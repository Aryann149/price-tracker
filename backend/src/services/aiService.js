const axios = require('axios');
const cheerio = require('cheerio');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

function extractImageUrl($, url) {
  const isFlipkart = url.includes('flipkart');
  const isAmazon = url.includes('amazon');
  const isNykaa = url.includes('nykaa');

  if (isAmazon) {
    const amazonSelectors = [
      '#landingImage', '#imgBlkFront', '.a-dynamic-image',
      '#main-image', 'img[data-old-hires]', 'img[data-a-dynamic-image]'
    ];
    for (const selector of amazonSelectors) {
      const img = $(selector).first();
      if (!img.length) continue;
      const src = img.attr('data-old-hires') || img.attr('src');
      if (src && src.startsWith('http') && src.length < 500) return src;
    }
  }

  if (isFlipkart) {
    const flipkartSelectors = [
      'img._396cs4', 'img._2r_T1I', 'img.DByuf4',
      'div._3kidJX img', 'div._2E41e_ img', 'div._396cs4 img',
      'img[src*="rukminim"]',
    ];
    for (const selector of flipkartSelectors) {
      const img = $(selector).first();
      if (!img.length) continue;
      const src = img.attr('src') || img.attr('data-src');
      if (src && src.startsWith('http') && src.includes('rukminim')) return src;
    }
    let found = null;
    $('img').each((_, el) => {
      if (found) return;
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && src.includes('rukminim') && src.startsWith('http')) found = src;
    });
    if (found) return found;
  }

  if (isNykaa) {
    const nykaaSelectors = [
      'img.product-image',
      'div.product-image-wrapper img',
      'div.pdp-image img',
      'img[src*="aakritist"]',
      'img[src*="nykaa-cdn"]',
      'img[src*="images-static.naikaa.com/media/catalog"]',
      'img[src*="images-static.naikaa.com/tr:"]',
    ];
    for (const selector of nykaaSelectors) {
      const img = $(selector).first();
      if (!img.length) continue;
      const src = img.attr('src') || img.attr('data-src');
      if (src && src.startsWith('http') && !src.includes('wysiwyg') && !src.includes('uiTools')) return src;
    }
    let found = null;
    $('img').each((_, el) => {
      if (found) return;
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && src.startsWith('http') &&
          src.includes('naikaa.com') &&
          (src.includes('/catalog/') || src.includes('/tr:')) &&
          !src.includes('wysiwyg') && !src.includes('uiTools') &&
          !src.includes('logo') && !src.includes('icon')) {
        found = src;
      }
    });
    if (found) return found;
  }

  // Generic fallback
  let fallback = null;
  $('img').each((_, el) => {
    if (fallback) return;
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && src.startsWith('http') && src.length < 500 &&
        !src.includes('logo') && !src.includes('icon') &&
        !src.includes('sprite') && !src.includes('banner') &&
        !src.includes('wysiwyg')) {
      fallback = src;
    }
  });
  return fallback;
}

function buildPrompt(url, cleanText) {
  const isFlipkart = url.includes('flipkart');
  const isAmazon = url.includes('amazon');

  let priceRule = '';

  if (isFlipkart) {
    priceRule = `IMPORTANT PRICE RULES FOR FLIPKART:
- Flipkart shows multiple prices. You must return the BASE PRICE — the price a customer pays WITHOUT any bank offer, credit card discount, or EMI scheme.
- The base price is usually labeled as the main selling price or "Special Price".
- IGNORE any prices labeled: "with HDFC card", "with SBI card", "bank offer", "card discount", "no cost EMI", "exchange offer".
- If you see something like "₹82,900" as the main price and "₹79,900 with HDFC card", return 82900.
- Return only the price payable without any card or bank offer.`;
  } else if (isAmazon) {
    priceRule = `PRICE RULES FOR AMAZON:
- Return the current selling price (the main price shown on the page).
- IGNORE "M.R.P" or strikethrough prices — those are original prices.
- If there's a "Deal price" or "Sale price", use that.
- IGNORE cashback, coupon, or bank offer discounts.`;
  } else {
    priceRule = `PRICE RULES:
- Return the CURRENT SELLING PRICE — what a customer actually pays at checkout without any special card, coupon, or bank offers.
- IGNORE prices that require a specific bank card or coupon to avail.
- If there's an MRP and a sale price, return the sale price.
- If there's only one price, return that.`;
  }

  return `Extract product info from this e-commerce page.

URL: ${url}

${priceRule}

PAGE TEXT:
${cleanText}

Return ONLY this JSON (price as a plain number, no currency symbols):
{"name":"FULL PRODUCT NAME","price":1234,"currency":"INR","site":"flipkart"}

JSON only. No explanation. No markdown.`;
}

async function extractProductInfo(html, url) {
  try {
    const $ = cheerio.load(html);
    $('script, style, noscript').remove();

    const imageUrl = extractImageUrl($, url);
    const cleanText = $('body').text().replace(/\s+/g, ' ').substring(0, 4000);

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: buildPrompt(url, cleanText) }]
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 200 }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const text = response.data.candidates[0].content.parts[0].text.trim();
    console.log('Gemini raw response:', text);

    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found in response');

    const parsed = JSON.parse(clean.substring(start, end + 1));
    parsed.image_url = imageUrl;

    console.log('Extracted product:', parsed);
    return parsed;
  } catch (error) {
    console.error('Gemini extractProductInfo error:', error.response?.data || error.message);
    throw error;
  }
}

async function generateAlertMessage(product, priceData, alertType) {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Write a 3-line price alert email for:
Product: ${product.name}
Alert: ${alertType}
Best Price: ${priceData.bestPrice} ${product.currency} on ${priceData.bestSite}
Previous: ${product.current_price} ${product.currency}`
          }]
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Gemini generateAlertMessage error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { extractProductInfo, generateAlertMessage };