const axios = require('axios');
const { extractProductInfo } = require('./aiService');

async function fetchPage(url, options = {}) {
  const params = new URLSearchParams({
    api_key: process.env.SCRAPER_API_KEY,
    url: url,
    country_code: 'in',
    render: 'true',
    ...(options.premium && { premium: 'true' }),
    ...(options.session_number && { session_number: options.session_number }),
  });

  const scraperUrl = `http://api.scraperapi.com?${params.toString()}`;
  const response = await axios.get(scraperUrl, { timeout: 90000 });
  return response.data;
}

async function fetchFlipkart(url) {
  // Strategy 1: ScraperAPI premium residential proxy
  const params = new URLSearchParams({
    api_key: process.env.SCRAPER_API_KEY,
    url: url,
    country_code: 'in',
    render: 'true',
    premium: 'true',
    device_type: 'desktop',
  });

  try {
    const scraperUrl = `http://api.scraperapi.com?${params.toString()}`;
    const response = await axios.get(scraperUrl, { timeout: 90000 });
    if (response.data && response.data.length > 5000) {
      return response.data;
    }
    throw new Error('Response too short, likely blocked');
  } catch (err) {
    console.warn('ScraperAPI premium failed for Flipkart, trying direct fetch...');
  }

  // Strategy 2: Direct fetch with browser-like headers (fallback)
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });
    if (response.data && response.data.length > 5000) {
      return response.data;
    }
    throw new Error('Direct fetch also blocked');
  } catch (err) {
    console.warn('Direct fetch failed for Flipkart:', err.message);
  }

  // Strategy 3: Use Flipkart's mobile API endpoint (most reliable)
  try {
    const mobileUrl = url.replace('www.flipkart.com', 'm.flipkart.com');
    const mobileParams = new URLSearchParams({
      api_key: process.env.SCRAPER_API_KEY,
      url: mobileUrl,
      country_code: 'in',
      render: 'false', // mobile site doesn't need JS render
      premium: 'true',
    });
    const scraperUrl = `http://api.scraperapi.com?${mobileParams.toString()}`;
    const response = await axios.get(scraperUrl, { timeout: 90000 });
    return response.data;
  } catch (err) {
    throw new Error(`All Flipkart fetch strategies failed: ${err.message}`);
  }
}

function cleanFlipkartUrl(url) {
  // Flipkart URLs: keep only up to /p/ segment, strip everything after
  // e.g. https://www.flipkart.com/product-name/p/ITEMID
  try {
    const match = url.match(/(https:\/\/www\.flipkart\.com\/[^/]+\/p\/[A-Z0-9]+)/i);
    if (match) return match[1];
  } catch {}
  return url.split('?')[0];
}

function getSiteName(url) {
  if (url.includes('amazon')) return 'amazon';
  if (url.includes('flipkart')) return 'flipkart';
  if (url.includes('croma')) return 'croma';
  if (url.includes('reliancedigital')) return 'reliance_digital';
  if (url.includes('meesho')) return 'meesho';
  if (url.includes('myntra')) return 'myntra';
  if (url.includes('snapdeal')) return 'snapdeal';
  return 'other';
}

async function scrapeProduct(url) {
  const site = getSiteName(url);

  // Clean URL based on site
  if (site === 'flipkart') {
    url = cleanFlipkartUrl(url);
  } else {
    url = url.split('?')[0].split('&')[0];
  }

  try {
    let html;
    if (site === 'flipkart') {
      html = await fetchFlipkart(url);
    } else {
      html = await fetchPage(url);
    }

    const productInfo = await extractProductInfo(html, url);
    return { ...productInfo, site, url };
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error.message);
    return null;
  }
}

async function searchOnOtherSites(productName) {
  const results = [];
  const searchSites = [
    { name: 'amazon', searchUrl: `https://www.amazon.in/s?k=${encodeURIComponent(productName)}` },
    { name: 'flipkart', searchUrl: `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}` }
  ];

  for (const site of searchSites) {
    try {
      let html;
      if (site.name === 'flipkart') {
        html = await fetchFlipkart(site.searchUrl);
      } else {
        html = await fetchPage(site.searchUrl);
      }
      const info = await extractProductInfo(html, site.searchUrl);
      if (info && info.price) {
        results.push({ site: site.name, price: info.price, url: site.searchUrl, currency: info.currency || 'INR' });
      }
    } catch (err) {
      console.error(`Failed to search on ${site.name}:`, err.message);
    }
  }
  return results;
}

module.exports = { scrapeProduct, searchOnOtherSites, getSiteName };