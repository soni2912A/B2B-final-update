const mongoose = require('mongoose');

// One-time cleanup of stale unique indexes left over from earlier schema
// versions. If a collection ever had a unique field that was later renamed
// or dropped, the original index can still live in MongoDB — causing E11000
// collisions on every subsequent insert (all new docs write `null` to the
// no-longer-existent field, and the second-ever insert dup-keys the first).
//
// This table is idempotent: on each startup we check and drop if present,
// otherwise do nothing. Adding entries here is the right place to fix new
// stale-index regressions as they appear in any environment.
const STALE_INDEXES = [
  { collection: 'orders', name: 'orderNo_1' },
  // Speculative: added by pattern-match after orderNo_1 was confirmed stale.
  // Invoice schema uses `invoiceNumber` today; an older schema may have used
  // `invoiceNo`, leaving a unique index with that name. The guarded dropIndex
  // is a no-op when absent, so keeping this costs nothing.
  // not yet confirmed; remove if not observed after two weeks of clean starts
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
      // IndexNotFound is expected on fresh DBs after the first successful run.
      // Any other error here shouldn't kill startup — just log and move on.
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
