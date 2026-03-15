const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/**
 * Send a price drop alert email
 */
async function sendPriceAlert({ to, productName, alertType, message, bestPrice, bestSite, productUrl, currency = 'INR' }) {
  const isTargetReached = alertType === 'target_reached';

  const subject = isTargetReached
    ? `🎯 Target Price Reached! ${productName}`
    : `📉 Price Drop Alert! ${productName}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
      <div style="background: ${isTargetReached ? '#10b981' : '#3b82f6'}; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">
          ${isTargetReached ? '🎯 Target Price Reached!' : '📉 Price Drop Alert!'}
        </h1>
      </div>

      <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-top: 0;">${productName}</h2>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Best Price Now</p>
          <p style="margin: 4px 0; color: #10b981; font-size: 32px; font-weight: bold;">
            ${currency === 'INR' ? '₹' : '$'}${bestPrice?.toLocaleString()}
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">on <strong>${bestSite}</strong></p>
        </div>

        <p style="color: #4b5563; line-height: 1.6;">${message}</p>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${productUrl}" 
             style="background: ${isTargetReached ? '#10b981' : '#3b82f6'}; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Product →
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
          You're receiving this because you set up a price alert on PriceTracker.<br/>
          <a href="#" style="color: #9ca3af;">Manage your alerts</a>
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"PriceTracker" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  });

  console.log(`✅ Alert email sent to ${to} for ${productName}`);
}

module.exports = { sendPriceAlert };
