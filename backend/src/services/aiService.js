const axios = require('axios');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

async function extractProductInfo(html, url) {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are a product data extractor. Extract ONLY these fields from the HTML below.

URL: ${url}
HTML: ${html.substring(0, 5000)}

Respond with ONLY this exact JSON format, no extra text:
{"name":"product name here","price":1234,"currency":"INR","image_url":null,"site":"amazon"}

IMPORTANT:
- price: number only, no symbols, no null
- image_url: null always (do not extract)
- Keep response under 100 tokens`
          }]
        }],
        generationConfig: { 
          temperature: 0.1, 
          maxOutputTokens: 150,
          responseMimeType: "application/json"
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const text = response.data.candidates[0].content.parts[0].text.trim();
    console.log('Gemini raw response:', text.substring(0, 300));
    
    const clean = text.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[^{}]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    return JSON.parse(jsonMatch[0]);
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 150 }
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
