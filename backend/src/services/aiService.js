const axios = require('axios');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

async function extractProductInfo(html, url) {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Extract product info from this e-commerce page HTML.
URL: ${url}

HTML: ${html.substring(0, 6000)}

Reply with ONLY this JSON, nothing else, no markdown:
{"name":"product name","price":9999,"currency":"INR","image_url":null,"site":"amazon"}

Rules:
- price must be a plain number (no symbols)
- image_url: use null if not found or if unsure
- site: amazon, flipkart, croma, etc`
          }]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const text = response.data.candidates[0].content.parts[0].text.trim();
    console.log('Gemini raw response:', text.substring(0, 200));
    
    // Clean the response
    const clean = text.replace(/```json|```/g, '').trim();
    
    // Extract just the JSON object
    const jsonMatch = clean.match(/\{[^{}]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate image_url — reject if it looks corrupted
    if (parsed.image_url && (
      parsed.image_url.includes('111111') ||
      parsed.image_url.includes('3+3+3') ||
      parsed.image_url.length > 500
    )) {
      parsed.image_url = null;
    }
    
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
            text: `Write a short 3-line price alert email body for:
Product: ${product.name}
Alert: ${alertType}
Best Price: ${priceData.bestPrice} ${product.currency} on ${priceData.bestSite}
Previous Price: ${product.current_price} ${product.currency}
Be friendly and concise.`
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
