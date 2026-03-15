const cron = require('node-cron');
const { runDailyCheck } = require('../services/priceService');

/**
 * Schedule daily price check at 9:00 AM IST (3:30 AM UTC)
 */
function startCronJobs() {
  cron.schedule('30 3 * * *', async () => {
    console.log('⏰ Cron triggered: Daily price check');
    await runDailyCheck();
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('✅ Cron job scheduled: Daily price check at 9:00 AM IST');
}

module.exports = { startCronJobs };
