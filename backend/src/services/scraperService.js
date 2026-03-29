const axios = require('axios');
const { extractProductInfo } = require('./aiService');

async function fetchPage(url) {
  const scraperUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&country_code=in&render=true`;
  const response = await axios.get(scraperUrl, { timeout: 60000 });
  return response.data;
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
  // Clean URL - remove all query parameters
  url = url.split('?')[0].split('&')[0];
  try {
    const html = await fetchPage(url);
    const productInfo = await extractProductInfo(html, url);
    return { ...productInfo, site: getSiteName(url), url };
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
      const html = await fetchPage(site.searchUrl);
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
