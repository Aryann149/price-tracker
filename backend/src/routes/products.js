const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { scrapeProduct } = require('../services/scraperService');
const { checkProductPrice } = require('../services/priceService');

// Middleware to get user ID from header
function getUserId(req) {
  return req.headers['x-user-id'];
}

// GET /api/products
router.get('/', async (req, res) => {
  const userId = getUserId(req);
  console.log('GET /api/products - userId:', userId);
  if (!userId) return res.status(401).json({ error: 'Unauthorized - no user ID' });

  const { data, error } = await supabase
    .from('products')
    .select(`*, price_history (id, site, price, checked_at)`)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET products error:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// POST /api/products
router.post('/', async (req, res) => {
  const userId = getUserId(req);
  console.log('POST /api/products - userId:', userId);
  if (!userId) return res.status(401).json({ error: 'Unauthorized - no user ID' });

  const { url, target_price } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const productInfo = await scrapeProduct(url);
    if (!productInfo || !productInfo.name) {
      return res.status(400).json({ error: 'Could not extract product info from URL' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: userId,
        name: productInfo.name,
        url,
        image_url: productInfo.image_url,
        current_price: productInfo.price,
        lowest_price: productInfo.price,
        target_price: target_price || null,
        currency: productInfo.currency || 'INR'
      })
      .select()
      .single();

    if (error) {
      console.error('Insert product error:', error);
      return res.status(500).json({ error: error.message });
    }

    await supabase.from('price_history').insert({
      product_id: data.id,
      site: productInfo.site,
      price: productInfo.price,
      url
    });

    res.json(data);
  } catch (err) {
    console.error('Add product error:', err.message);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// PATCH /api/products/:id
router.patch('/:id', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { target_price } = req.body;
  const { data, error } = await supabase
    .from('products')
    .update({ target_price })
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', req.params.id)
    .eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/products/:id/check
router.post('/:id/check', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single();
  if (error || !product) return res.status(404).json({ error: 'Product not found' });
  await checkProductPrice(product);
  res.json({ success: true });
});

module.exports = router;
