const mongoose = require('mongoose');


const STALE_INDEXES = [
  { collection: 'orders', name: 'orderNo_1' },
 
  { collection: 'invoices', name: 'invoiceNo_1' },
];

const dropStaleIndexes = async () => {
  for (const { collection, name } of STALE_INDEXES) {
    try {
      const coll = mongoose.connection.collection(collection);
      const indexes = await coll.indexes();
      if (indexes.find(i => i.name === name)) {
        console.log(`[db] Dropping stale ${name} index from ${collection}`);
        await coll.dropIndex(name);
      }
    } catch (error) {
      
      if (error.codeName !== 'IndexNotFound') {
        console.error(`[db] failed to drop ${name} on ${collection}:`, error.message);
      }
    }
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await dropStaleIndexes();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };
