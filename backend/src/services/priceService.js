const supabase = require('../db/supabase');
const { searchOnOtherSites } = require('./scraperService');
const { generateAlertMessage } = require('./aiService');
const { sendPriceAlert } = require('./alertService');

/**
 * Check price for a single product and handle alerts
 */
async function checkProductPrice(product) {
  console.log(`Checking price for: ${product.name}`);

  try {
    // Search for current price on original site + other sites
    const prices = await searchOnOtherSites(product.name);

    if (!prices || prices.length === 0) {
      console.log(`No prices found for ${product.name}`);
      return;
    }

    // Find best (lowest) price
    const bestDeal = prices.reduce((best, current) =>
      current.price < best.price ? current : best
    );

    const previousPrice = product.current_price;
    const bestPrice = bestDeal.price;
    const priceDrop = previousPrice
      ? (((previousPrice - bestPrice) / previousPrice) * 100).toFixed(1)
      : 0;

    // Save each price to history
    for (const priceData of prices) {
      await supabase.from('price_history').insert({
        product_id: product.id,
        site: priceData.site,
        price: priceData.price,
        url: priceData.url
      });
    }

    // Update product's current price and lowest price
    const lowestEver = product.lowest_price
      ? Math.min(product.lowest_price, bestPrice)
      : bestPrice;

    await supabase
      .from('products')
      .update({
        current_price: bestPrice,
        lowest_price: lowestEver,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    // Determine alert type
    let alertType = null;
    if (product.target_price && bestPrice <= product.target_price) {
      alertType = 'target_reached';
    } else if (previousPrice && bestPrice < previousPrice) {
      alertType = 'price_drop';
    }

    // Send alert if needed
    if (alertType) {
      // Get user email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, alert_email')
        .eq('id', product.user_id)
        .single();

      const alertEmail = profile?.alert_email || profile?.email;

      if (alertEmail) {
        const priceData = { bestPrice, bestSite: bestDeal.site, priceDrop };
        const message = await generateAlertMessage(product, priceData, alertType);

        await sendPriceAlert({
          to: alertEmail,
          productName: product.name,
          alertType,
          message,
          bestPrice,
          bestSite: bestDeal.site,
          productUrl: product.url,
          currency: product.currency
        });

        // Log alert sent
        await supabase.from('alerts_sent').insert({
          product_id: product.id,
          user_id: product.user_id,
          alert_type: alertType,
          message
        });
      }
    }

    console.log(`✅ Done: ${product.name} — Best price: ${bestPrice} on ${bestDeal.site}`);
  } catch (error) {
    console.error(`❌ Error checking ${product.name}:`, error.message);
  }
}

/**
 * Run daily check for all active products
 */
async function runDailyCheck() {
  console.log('🕐 Starting daily price check...');

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch products:', error.message);
    return;
  }

  console.log(`Found ${products.length} active products`);

  for (const product of products) {
    await checkProductPrice(product);
    // Small delay between checks to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('✅ Daily price check complete!');
}

module.exports = { runDailyCheck, checkProductPrice };
