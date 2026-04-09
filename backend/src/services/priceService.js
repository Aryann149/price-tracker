const supabase = require('../db/supabase');
const { scrapeProduct } = require('./scraperService');
const { generateAlertMessage } = require('./aiService');
const { sendPriceAlert } = require('./alertService');

async function checkProductPrice(product) {
  console.log(`Checking price for: ${product.name}`);

  try {
    // Scrape the product's own URL directly — not a name search
    const scraped = await scrapeProduct(product.url);

    if (!scraped || !scraped.price) {
      console.log(`No price found for ${product.name}`);
      return;
    }

    const previousPrice = product.current_price;
    const newPrice = scraped.price;

    // Save to price history
    await supabase.from('price_history').insert({
      product_id: product.id,
      site: product.site,
      price: newPrice,
      url: product.url
    });

    // Update product current + lowest price
    const lowestEver = product.lowest_price
      ? Math.min(product.lowest_price, newPrice)
      : newPrice;

    await supabase
      .from('products')
      .update({
        current_price: newPrice,
        lowest_price: lowestEver,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    console.log(`💰 ${product.name}: ${previousPrice} → ${newPrice}`);

    // Determine alert type
    let alertType = null;
    if (product.target_price && newPrice <= product.target_price) {
      alertType = 'target_reached';
    } else if (previousPrice && newPrice < previousPrice) {
      alertType = 'price_drop';
    }

    // Send alert if needed
    if (alertType) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, alert_email')
        .eq('id', product.user_id)
        .single();

      const alertEmail = profile?.alert_email || profile?.email;

      if (alertEmail) {
        const priceData = {
          bestPrice: newPrice,
          bestSite: product.site,
          priceDrop: previousPrice
            ? (((previousPrice - newPrice) / previousPrice) * 100).toFixed(1)
            : 0
        };

        const message = await generateAlertMessage(product, priceData, alertType);

        await sendPriceAlert({
          to: alertEmail,
          productName: product.name,
          alertType,
          message,
          bestPrice: newPrice,
          bestSite: product.site,
          productUrl: product.url,
          currency: product.currency
        });

        await supabase.from('alerts_sent').insert({
          product_id: product.id,
          user_id: product.user_id,
          alert_type: alertType,
          message
        });

        console.log(`📧 Alert sent to ${alertEmail} for ${product.name}`);
      }
    }

    console.log(`✅ Done: ${product.name}`);
  } catch (error) {
    console.error(`❌ Error checking ${product.name}:`, error.message);
  }
}

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
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('✅ Daily price check complete!');
}

module.exports = { runDailyCheck, checkProductPrice };