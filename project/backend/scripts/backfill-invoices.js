require('dotenv').config();
(async () => {
  const { connectDB } = require('../src/config/db');
  await connectDB();
  const Order = require('../src/models/Order.model');
  const invoiceService = require('../src/services/invoice.service');
  const delivered = await Order.find({ status: 'delivered' });
  console.log(`Found ${delivered.length} delivered order(s).`);
  for (const o of delivered) {
    try {
      const inv = await invoiceService.generateInvoice(o);
      console.log('OK', o.orderNumber, '→', inv.invoiceNumber);
    } catch (err) {
      console.error('FAIL', o.orderNumber, err.message);
    }
  }
  process.exit(0);
})();
