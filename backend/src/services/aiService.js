const axios = require('axios');
const cheerio = require('cheerio');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

async function extractProductInfo(html, url) {
  try {
    const $ = cheerio.load(html);

    // Remove scripts and styles
    $('script, style, noscript').remove();

    // Try to extract image directly from HTML
    let imageUrl = null;
    
    // Amazon image patterns
    const imgSelectors = [
      '#landingImage',
      '#imgBlkFront', 
      '.a-dynamic-image',
      '#main-image',
      'img[data-old-hires]',
      'img[data-a-dynamic-image]'
    ];
    
    for (const selector of imgSelectors) {
      const img = $(selector).first();
      if (img.length) {
        imageUrl = img.attr('data-old-hires') || 
                   img.attr('src') || 
                   null;
        if (imageUrl && imageUrl.startsWith('http') && imageUrl.length < 300) break;
        else imageUrl = null;
      }
    }

    // Get clean text for AI
    const cleanText = $('body').text().replace(/\s+/g, ' ').substring(0, 3000);

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Extract product info from this e-commerce page text.

URL: ${url}
TEXT: ${cleanText}

Return ONLY this JSON (price as number, no symbols):
{"name":"PRODUCT NAME","price":1234,"currency":"INR","site":"amazon"}

JSON only, nothing else.`
          }]
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
