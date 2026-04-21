const orderConfirm = (data) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#f8f9fa;padding:20px;border-radius:8px">
    <h2 style="color:#1a1a2e">Order Confirmed</h2>
    <p>Hi ${data.corporateName},</p>
    <p>Your order <strong>${data.orderNumber}</strong> has been confirmed.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#e9ecef">
        <th style="padding:8px;text-align:left">Order #</th>
        <th style="padding:8px;text-align:left">Delivery Date</th>
        <th style="padding:8px;text-align:right">Total</th>
      </tr>
      <tr>
        <td style="padding:8px">${data.orderNumber}</td>
        <td style="padding:8px">${data.deliveryDate}</td>
        <td style="padding:8px;text-align:right">${data.currency} ${data.totalAmount}</td>
      </tr>
    </table>
    <p style="color:#666;font-size:13px">You will receive a reminder 2 days before delivery.</p>
  </div>
</body>
</html>`;

const preDelivery = (data) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#fff3cd;padding:20px;border-radius:8px;border-left:4px solid #ffc107">
    <h2 style="color:#856404">Delivery Reminder</h2>
    <p>Hi ${data.corporateName},</p>
    <p>Your order <strong>${data.orderNumber}</strong> is scheduled for delivery on <strong>${data.deliveryDate}</strong>.</p>
    <p>Please ensure someone is available to receive the delivery.</p>
    <p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
  </div>
</body>
</html>`;

const invoiceEmail = (data) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#f8f9fa;padding:20px;border-radius:8px">
    <h2 style="color:#1a1a2e">Invoice ${data.invoiceNumber}</h2>
    <p>Hi ${data.corporateName},</p>
    <p>Please find your invoice details below.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px"><strong>Invoice #:</strong></td><td>${data.invoiceNumber}</td></tr>
      <tr><td style="padding:6px"><strong>Amount:</strong></td><td>${data.currency} ${data.totalAmount}</td></tr>
      <tr><td style="padding:6px"><strong>Due Date:</strong></td><td>${data.dueDate}</td></tr>
      <tr><td style="padding:6px"><strong>Status:</strong></td><td>${data.status}</td></tr>
    </table>
    <a href="${data.paymentUrl}" style="background:#007bff;color:white;padding:10px 20px;border-radius:5px;text-decoration:none">Pay Now</a>
  </div>
</body>
</html>`;

const feedbackRequest = (data) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#f8f9fa;padding:20px;border-radius:8px">
    <h2 style="color:#1a1a2e">How was your delivery?</h2>
    <p>Hi ${data.corporateName},</p>
    <p>We hope you're satisfied with order <strong>${data.orderNumber}</strong>.</p>
    <p>Please take a moment to rate your experience:</p>
    <div style="text-align:center;margin:20px 0">
      <a href="${data.feedbackUrl}?rating=5" style="font-size:24px;text-decoration:none;margin:0 5px">⭐</a>
      <a href="${data.feedbackUrl}?rating=4" style="font-size:24px;text-decoration:none;margin:0 5px">⭐</a>
      <a href="${data.feedbackUrl}?rating=3" style="font-size:24px;text-decoration:none;margin:0 5px">⭐</a>
    </div>
    <p style="color:#666;font-size:12px">Your feedback helps us improve.</p>
  </div>
</body>
</html>`;

module.exports = { orderConfirm, preDelivery, invoiceEmail, feedbackRequest };
