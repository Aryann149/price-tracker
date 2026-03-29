const axios = require('axios');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

async function extractProductInfo(html, url) {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Extract product details from this e-commerce HTML page.

URL: ${url}
HTML: ${html.substring(0, 5000)}

Return ONLY a JSON object with these exact fields:
- name: full product name (string)
- price: selling price as number only, no symbols (number or null)
- currency: "INR" for Indian sites (string)
- image_url: main product image URL (string or null)
- site: website name like "amazon" or "flipkart" (string)

JSON only, no explanation:`
          }]
        }],
        generationConfig: { 
          temperature: 0.1, 
          maxOutputTokens: 500
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const text = response.data.candidates[0].content.parts[0].text.trim();
    console.log('Gemini raw response:', text.substring(0, 300));
    
    const clean = text.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate image_url
    if (parsed.image_url && parsed.image_url.length > 300) {
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
