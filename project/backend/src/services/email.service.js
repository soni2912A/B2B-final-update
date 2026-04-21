// const nodemailer = require('nodemailer');
// const EmailLog = require('../models/EmailLog.model');

// const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
// const transporter = smtpConfigured
//   ? nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: parseInt(process.env.SMTP_PORT) || 587,
//       secure: process.env.SMTP_SECURE === 'true',
//       auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
//     })
//   : null;

// if (!smtpConfigured) {
//   console.log('[email] SMTP not configured — emails will be logged to console only (dev mode)');
// }

// const sendMail = async ({ to, subject, html, businessId, templateType, referenceId }) => {
//   const log = await EmailLog.create({
//     business: businessId, to, subject, templateType, referenceId,
//     status: smtpConfigured ? 'pending' : 'skipped',
//   }).catch(err => {
//     // Observable: emit the cause so capture-side bugs don't stay silent.
//     console.error('[emailLog] create failed:', err.message);
//     return null;
//   });

//   if (!smtpConfigured) {
//     console.log(`\n━━━ [email stub] ━━━\nTo: ${to}\nSubject: ${subject}\nBody: ${html.replace(/\s+/g,' ').slice(0,400)}...\n━━━━━━━━━━━━━━━━━━━\n`);
//     return;
//   }

//   try {
//     await transporter.sendMail({
//       from: `"${process.env.EMAIL_FROM_NAME || 'B2B Corporate Bakery Platform'}" <${process.env.EMAIL_FROM || 'noreply@b2bcorporatebakery.com'}>`,
//       to, subject, html,
//     });
//     if (log) await EmailLog.findByIdAndUpdate(log._id, { status: 'sent', sentAt: new Date() });
//   } catch (error) {
//     if (log) await EmailLog.findByIdAndUpdate(log._id, { status: 'failed', errorMessage: error.message });
//     throw error;
//   }
// };

// const sendPasswordReset = (email, name, resetUrl, businessId) => sendMail({
//   to: email, subject: 'Password Reset Request',
//   html: `<p>Hi ${name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 10 minutes.</p>`,
//   templateType: 'password_reset',
//   businessId,
// });

// const sendInviteEmail = (email, name, inviterName, role, inviteUrl, businessId) => sendMail({
//   to: email,
//   subject: `You've been invited to B2B Corporate Bakery Platform as ${role}`,
//   html:
//     `<p>Hi ${name || 'there'},</p>` +
//     `<p>${inviterName || 'An admin'} has invited you to join B2B Corporate Bakery Platform as <strong>${role}</strong>.</p>` +
//     `<p><a href="${inviteUrl}">Click here to set your password and activate your account</a>.</p>` +
//     `<p>This link expires in 48 hours.</p>`,
//   templateType: 'invite',
//   businessId,
// });

// const sendOrderConfirmation = (order) => sendMail({
//   to: order.corporate.email, subject: `Order Confirmed - ${order.orderNumber}`,
//   html: `<p>Your order <strong>${order.orderNumber}</strong> has been confirmed. Total: ${order.totalAmount}</p>`,
//   businessId: order.business, templateType: 'order_confirm', referenceId: order._id,
// });

// const sendPreDeliveryAlert = (order) => sendMail({
//   to: order.corporate.email, subject: `Delivery Reminder - ${order.orderNumber}`,
//   html: `<p>Your order <strong>${order.orderNumber}</strong> is scheduled for delivery on ${order.deliveryDate}.</p>`,
//   businessId: order.business, templateType: 'pre_delivery', referenceId: order._id,
// });

// const sendOrderAssignedToStaff = (order, staff) => sendMail({
//   to: staff.email,
//   subject: `Order ${order.orderNumber} has been assigned to you`,
//   html:
//     `<p>Hi ${staff.name || 'there'},</p>` +
//     `<p>This order has been assigned to you.</p>` +
//     `<ul>` +
//       `<li><strong>Order:</strong> ${order.orderNumber || '—'}</li>` +
//       (order.corporate?.companyName ? `<li><strong>Corporate:</strong> ${order.corporate.companyName}</li>` : '') +
//       (order.deliveryDate ? `<li><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toDateString()}</li>` : '') +
//       (order.deliveryAddress?.address ? `<li><strong>Address:</strong> ${order.deliveryAddress.address}</li>` : '') +
//     `</ul>` +
//     `<p>Please coordinate the delivery and update the status once delivered.</p>`,
//   businessId: order.business,
//   templateType: 'order_assigned',
//   referenceId: order._id,
// });

// const sendDeliveryComplete = (delivery) => sendMail({
//   to: delivery.corporate.email, subject: `Order Delivered - ${delivery.order.orderNumber}`,
//   html: `<p>Your order has been successfully delivered on ${delivery.deliveredAt}. Thank you!</p>`,
//   businessId: delivery.business, templateType: 'delivery_confirm', referenceId: delivery._id,
// });

// const sendInvoice = (invoice) => sendMail({
//   to: invoice.corporate.email, subject: `Invoice ${invoice.invoiceNumber} - Amount Due: ${invoice.totalAmount}`,
//   html: `<p>Please find your invoice <strong>${invoice.invoiceNumber}</strong> for the amount of <strong>${invoice.totalAmount}</strong>. Due: ${invoice.dueDate}.</p>`,
//   businessId: invoice.business, templateType: 'invoice', referenceId: invoice._id,
// });

// const sendFeedbackRequest = (order) => {
//   const clientUrl = (process.env.CLIENT_URL || '').split(',')[0].trim() || 'http://localhost:5173';
//   const ordersUrl = `${clientUrl}/?page=corp-orders`;
//   return sendMail({
//     to: order.corporate.email,
//     subject: `How was your delivery? - ${order.orderNumber}`,
//     html:
//       `<p>We hope you're happy with your recent order <strong>${order.orderNumber}</strong>.</p>` +
//       `<p><a href="${ordersUrl}">Open your orders</a> to leave feedback. ` +
//       `Find order ${order.orderNumber} and click the "Leave feedback" button.</p>`,
//     businessId: order.business, templateType: 'feedback_request', referenceId: order._id,
//   });
// };

// const sendLowStockAlert = (adminEmail, adminName, product) => sendMail({
//   to: adminEmail, subject: `Low Stock Alert: ${product.name}`,
//   html: `<p>Hi ${adminName},</p><p>Product <strong>${product.name}</strong> (SKU: ${product.sku}) is running low. Current stock: <strong>${product.stockQuantity}</strong> (threshold: ${product.lowStockThreshold}).</p>`,
//   businessId: product.business?._id || product.business, templateType: 'low_stock_alert', referenceId: product._id,
// });

// module.exports = {
//   sendMail, sendPasswordReset, sendInviteEmail, sendOrderConfirmation,
//   sendPreDeliveryAlert, sendDeliveryComplete, sendInvoice,
//   sendFeedbackRequest, sendLowStockAlert,
//   sendOrderAssignedToStaff,
// };


const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog.model');

const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

if (!smtpConfigured) {
  console.log('[email] SMTP not configured — emails will be logged to console only (dev mode)');
}

// Render a DB-stored template for a given type and business, substituting {{vars}}.
// Falls back gracefully if no DB template is found.
const renderDbTemplate = async (businessId, templateType, vars = {}) => {
  try {
    const EmailTemplate = require('../models/EmailTemplate.model');
    const tmpl = await EmailTemplate.findOne({ business: businessId, type: templateType });
    if (!tmpl) return null;
    let subject = tmpl.subject || '';
    let body = tmpl.body || '';
    Object.entries(vars).forEach(([k, v]) => {
      const re = new RegExp(`{{\s*${k}\s*}}`, 'g');
      subject = subject.replace(re, v != null ? String(v) : '');
      body = body.replace(re, v != null ? String(v) : '');
    });
    return { subject, html: body };
  } catch {
    return null;
  }
};

const sendMail = async ({ to, subject, html, businessId, templateType, referenceId }) => {
  const log = await EmailLog.create({
    business: businessId, to, subject, templateType, referenceId,
    status: smtpConfigured ? 'pending' : 'skipped',
  }).catch(err => {
    // Observable: emit the cause so capture-side bugs don't stay silent.
    console.error('[emailLog] create failed:', err.message);
    return null;
  });

  if (!smtpConfigured) {
    console.log(`\n━━━ [email stub] ━━━\nTo: ${to}\nSubject: ${subject}\nBody: ${html.replace(/\s+/g,' ').slice(0,400)}...\n━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'B2B Corporate Bakery Platform'}" <${process.env.EMAIL_FROM || 'noreply@b2bcorporatebakery.com'}>`,
      to, subject, html,
    });
    if (log) await EmailLog.findByIdAndUpdate(log._id, { status: 'sent', sentAt: new Date() });
  } catch (error) {
    if (log) await EmailLog.findByIdAndUpdate(log._id, { status: 'failed', errorMessage: error.message });
    throw error;
  }
};

const sendPasswordReset = (email, name, resetUrl, businessId) => sendMail({
  to: email, subject: 'Password Reset Request',
  html: `<p>Hi ${name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 10 minutes.</p>`,
  templateType: 'password_reset',
  businessId,
});

const sendInviteEmail = (email, name, inviterName, role, inviteUrl, businessId) => sendMail({
  to: email,
  subject: `You've been invited to B2B Corporate Bakery Platform as ${role}`,
  html:
    `<p>Hi ${name || 'there'},</p>` +
    `<p>${inviterName || 'An admin'} has invited you to join B2B Corporate Bakery Platform as <strong>${role}</strong>.</p>` +
    `<p><a href="${inviteUrl}">Click here to set your password and activate your account</a>.</p>` +
    `<p>This link expires in 48 hours.</p>`,
  templateType: 'invite',
  businessId,
});

const sendOrderConfirmation = async (order) => {
  const vars = { orderNumber: order.orderNumber, name: order.corporate?.companyName || '', date: new Date().toLocaleDateString('en-IN'), totalAmount: order.totalAmount };
  const db = await renderDbTemplate(order.business, 'order_confirm', vars);
  return sendMail({
    to: order.corporate.email,
    subject: db ? db.subject : `Order Confirmed - ${order.orderNumber}`,
    html: db ? db.html : `<p>Your order <strong>${order.orderNumber}</strong> has been confirmed. Total: ${order.totalAmount}</p>`,
    businessId: order.business, templateType: 'order_confirm', referenceId: order._id,
  });
};

const sendPreDeliveryAlert = (order) => sendMail({
  to: order.corporate.email, subject: `Delivery Reminder - ${order.orderNumber}`,
  html: `<p>Your order <strong>${order.orderNumber}</strong> is scheduled for delivery on ${order.deliveryDate}.</p>`,
  businessId: order.business, templateType: 'pre_delivery', referenceId: order._id,
});

const sendOrderAssignedToStaff = (order, staff) => sendMail({
  to: staff.email,
  subject: `Order ${order.orderNumber} has been assigned to you`,
  html:
    `<p>Hi ${staff.name || 'there'},</p>` +
    `<p>This order has been assigned to you.</p>` +
    `<ul>` +
      `<li><strong>Order:</strong> ${order.orderNumber || '—'}</li>` +
      (order.corporate?.companyName ? `<li><strong>Corporate:</strong> ${order.corporate.companyName}</li>` : '') +
      (order.deliveryDate ? `<li><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toDateString()}</li>` : '') +
      (order.deliveryAddress?.address ? `<li><strong>Address:</strong> ${order.deliveryAddress.address}</li>` : '') +
    `</ul>` +
    `<p>Please coordinate the delivery and update the status once delivered.</p>`,
  businessId: order.business,
  templateType: 'order_assigned',
  referenceId: order._id,
});

const sendDeliveryComplete = async (delivery) => {
  const vars = { orderNumber: delivery.order?.orderNumber || '', name: delivery.corporate?.companyName || '', date: delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString('en-IN') : '' };
  const db = await renderDbTemplate(delivery.business, 'delivery_confirm', vars);
  return sendMail({
    to: delivery.corporate.email,
    subject: db ? db.subject : `Order Delivered - ${delivery.order.orderNumber}`,
    html: db ? db.html : `<p>Your order has been successfully delivered on ${delivery.deliveredAt}. Thank you!</p>`,
    businessId: delivery.business, templateType: 'delivery_confirm', referenceId: delivery._id,
  });
};

const sendInvoice = (invoice) => sendMail({
  to: invoice.corporate.email, subject: `Invoice ${invoice.invoiceNumber} - Amount Due: ${invoice.totalAmount}`,
  html: `<p>Please find your invoice <strong>${invoice.invoiceNumber}</strong> for the amount of <strong>${invoice.totalAmount}</strong>. Due: ${invoice.dueDate}.</p>`,
  businessId: invoice.business, templateType: 'invoice', referenceId: invoice._id,
});

const sendFeedbackRequest = (order) => {
  const clientUrl = (process.env.CLIENT_URL || '').split(',')[0].trim() || 'http://localhost:5173';
  const ordersUrl = `${clientUrl}/?page=corp-orders`;
  return sendMail({
    to: order.corporate.email,
    subject: `How was your delivery? - ${order.orderNumber}`,
    html:
      `<p>We hope you're happy with your recent order <strong>${order.orderNumber}</strong>.</p>` +
      `<p><a href="${ordersUrl}">Open your orders</a> to leave feedback. ` +
      `Find order ${order.orderNumber} and click the "Leave feedback" button.</p>`,
    businessId: order.business, templateType: 'feedback_request', referenceId: order._id,
  });
};

const sendLowStockAlert = (adminEmail, adminName, product) => sendMail({
  to: adminEmail, subject: `Low Stock Alert: ${product.name}`,
  html: `<p>Hi ${adminName},</p><p>Product <strong>${product.name}</strong> (SKU: ${product.sku}) is running low. Current stock: <strong>${product.stockQuantity}</strong> (threshold: ${product.lowStockThreshold}).</p>`,
  businessId: product.business?._id || product.business, templateType: 'low_stock_alert', referenceId: product._id,
});

module.exports = {
  sendMail, sendPasswordReset, sendInviteEmail, sendOrderConfirmation,
  sendPreDeliveryAlert, sendDeliveryComplete, sendInvoice,
  sendFeedbackRequest, sendLowStockAlert,
  sendOrderAssignedToStaff, renderDbTemplate,
};