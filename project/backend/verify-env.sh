#!/usr/bin/env bash
# Verifies the backend has everything it needs to run.
# Does NOT start the server. Does NOT run seed. Purely diagnostic.
# Exits non-zero on hard failures; warnings don't fail.
#
# Usage:  cd backend && bash verify-env.sh

set -u  # catch typos; don't -e so we can print all checks before exiting

here="$(cd "$(dirname "$0")" && pwd)"
cd "$here" || exit 1

pass=0; warn=0; fail=0
ok()   { echo "  ok    $*"; pass=$((pass+1)); }
wn()   { echo "  WARN  $*"; warn=$((warn+1)); }
bad()  { echo "  FAIL  $*"; fail=$((fail+1)); }
hdr()  { echo; echo "── $* ──"; }

hdr "Working directory"
if [ -f package.json ] && grep -q '"fleet-management-backend"' package.json; then
  ok "running inside backend/"
else
  bad "expected to run inside backend/ (package.json with fleet-management-backend not found)"
  exit 1
fi

hdr "Environment file"
if [ -f .env ]; then
  ok ".env present"
else
  bad ".env missing — copy .env.example → .env and fill in"
fi

# Required vars. Source .env into a subshell so unset vars in the parent aren't polluted.
required=(MONGO_URI JWT_SECRET JWT_REFRESH_SECRET CLIENT_URL)
optional=(SMTP_HOST SMTP_USER REDIS_URL DEFAULT_BUSINESS_ID)

if [ -f .env ]; then
  for var in "${required[@]}"; do
    val="$(grep -E "^${var}=" .env | head -1 | cut -d= -f2- | tr -d '\r')"
    if [ -z "$val" ] || echo "$val" | grep -q "replace-with"; then
      bad "$var is missing or still has a placeholder value"
    else
      ok "$var set"
    fi
  done
  for var in "${optional[@]}"; do
    val="$(grep -E "^${var}=" .env | head -1 | cut -d= -f2- | tr -d '\r')"
    if [ -z "$val" ]; then
      wn "$var is blank (optional — feature degrades gracefully)"
    else
      ok "$var set"
    fi
  done
fi

hdr "Node + deps"
if command -v node >/dev/null 2>&1; then
  ok "node present ($(node --version))"
else
  bad "node not in PATH"
fi

if [ -d node_modules ]; then
  ok "node_modules present"
else
  bad "node_modules missing — run: npm install"
fi

# Spot-check the five deps the app can't run without.
if [ -d node_modules ]; then
  for mod in mongoose express multer xlsx pdfkit node-cron jsonwebtoken bcryptjs nodemailer; do
    if [ -d "node_modules/$mod" ]; then
      ok "$mod installed"
    else
      bad "$mod missing from node_modules"
    fi
  done
fi

hdr "Cron wiring in server.js"
if grep -q "startAllJobs()" server.js 2>/dev/null; then
  ok "server.js calls startAllJobs() — occasion reminder + pre-delivery + low-stock + feedback + overdue-invoice cron will run"
else
  bad "server.js does not call startAllJobs() — no cron jobs will fire"
fi

# Everything below needs mongoose + .env; skip if earlier hard failures.
if [ "$fail" -gt 0 ] || [ ! -f .env ] || [ ! -d node_modules/mongoose ]; then
  hdr "Skipping live DB checks (earlier failures)"
else
  hdr "MongoDB health + seed data"
  # Run a small node script that: connects, counts core collections, lists tickets.orders
  # indexes for the stale orderNo_1 leftover.
  node <<'JS'
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const started = Date.now();
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
  } catch (e) {
    console.log('  FAIL  cannot reach MongoDB at ' + process.env.MONGO_URI);
    console.log('        ' + e.message);
    process.exit(2);
  }
  console.log('  ok    mongo reachable (' + (Date.now() - started) + 'ms)');

  const db = mongoose.connection.db;
  const wanted = {
    businesses: 'Business',
    users:      'User',
    corporates: 'Corporate',
  };
  for (const [coll, label] of Object.entries(wanted)) {
    try {
      const n = await db.collection(coll).countDocuments();
      if (n === 0) console.log(`  WARN  ${label}: collection empty — run: npm run seed`);
      else         console.log(`  ok    ${label}: ${n} doc(s)`);
    } catch (e) {
      console.log(`  FAIL  ${label}: ${e.message}`);
    }
  }

  // Admin user existence (login/flows assume ≥1 admin per business).
  const admins = await db.collection('users').countDocuments({ role: 'admin' });
  if (admins === 0) console.log('  WARN  No admin user in users — seed or create one');
  else              console.log(`  ok    admin users: ${admins}`);

  const corpUsers = await db.collection('users').countDocuments({ role: 'corporate_user' });
  if (corpUsers === 0) console.log('  WARN  No corporate_user in users — register one for corp flows');
  else                  console.log(`  ok    corporate users: ${corpUsers}`);

  // Cross-business linkage check: admin(s) and corporate_user(s) must share a business.
  try {
    const adminBiz = await db.collection('users').distinct('business', { role: 'admin' });
    const corpBiz  = await db.collection('users').distinct('business', { role: 'corporate_user' });
    const adminSet = new Set(adminBiz.map(String));
    const overlap = corpBiz.map(String).filter(b => adminSet.has(b));
    if (corpBiz.length > 0 && overlap.length === 0) {
      console.log('  WARN  No corporate_user shares a business with any admin — admin ticket/order lists will look empty');
    } else if (corpBiz.length > 0) {
      console.log(`  ok    ${overlap.length} business(es) have both admin and corporate_user`);
    }
  } catch (e) { /* permissive */ }

  // Stale-index check: the orderNo_1 index from an earlier schema causes E11000
  // on every 2nd-or-later order placement if it's still present.
  try {
    const orderIdx = await db.collection('orders').indexes();
    const stale = orderIdx.find(i => i.name === 'orderNo_1');
    if (stale) {
      console.log('  FAIL  orders collection has stale index "orderNo_1" — drop it in mongosh:');
      console.log('        db.orders.dropIndex("orderNo_1")');
      process.exitCode = 3;
    } else {
      console.log('  ok    orders indexes clean (no stale orderNo_1)');
    }
  } catch (e) { /* collection may not exist yet; fine */ }

  // Pre-check: invoice.order duplicates will block the new unique { order: 1 }
  // index build on next restart. Caught HERE with a ready-to-paste cleanup
  // snippet so the admin fixes it before the server fails to boot.
  try {
    const dupes = await db.collection('invoices').aggregate([
      { $group: { _id: '$order', count: { $sum: 1 }, ids: { $push: { _id: '$_id', createdAt: '$createdAt' } } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();
    if (dupes.length > 0) {
      console.log(`  FAIL  invoices: ${dupes.length} order(s) have duplicate invoices — the unique { order: 1 } index will fail to build`);
      for (const d of dupes.slice(0, 5)) {
        const idList = d.ids.map(i => String(i._id)).join(', ');
        console.log(`        order ${d._id}: ${d.count} invoices (${idList})`);
      }
      if (dupes.length > 5) console.log(`        … and ${dupes.length - 5} more`);
      console.log('');
      console.log('        Cleanup — keeps the MOST RECENT invoice per order, deletes the rest.');
      console.log('        Paste this into mongosh after `use ' + db.databaseName + '`:');
      console.log('');
      console.log('        db.invoices.aggregate([');
      console.log('          { $group: { _id: "$order", ids: { $push: { id: "$_id", c: "$createdAt" } } } },');
      console.log('          { $match: { "ids.1": { $exists: true } } }');
      console.log('        ]).forEach(d => {');
      console.log('          const sorted = d.ids.sort((a, b) => b.c - a.c);  // newest first');
      console.log('          db.invoices.deleteMany({ _id: { $in: sorted.slice(1).map(x => x.id) } });');
      console.log('        });');
      process.exitCode = 3;
    } else {
      console.log('  ok    invoices collection has no duplicate order refs');
    }
  } catch (e) { /* collection may not exist yet; fine */ }

  // Occasion schema — sanity-check the new reminderSentAt + createdBy fields via
  // existing docs (if any). Not a fail if empty.
  try {
    const n = await db.collection('occasions').countDocuments();
    if (n > 0) {
      const orphan = await db.collection('occasions').countDocuments({
        $or: [{ createdBy: { $exists: false } }, { createdBy: null }],
      });
      if (orphan > 0) {
        console.log(`  WARN  ${orphan}/${n} occasions have no createdBy — upcoming-reminder cron will skip them`);
      } else {
        console.log(`  ok    occasions: ${n} with createdBy`);
      }
    }
  } catch (e) { /* ignore */ }

  // Notification.type enum sanity — verify no doc uses a type we no longer allow.
  try {
    const badTypes = await db.collection('notifications').distinct('type');
    const allowed = new Set(['order','delivery','invoice','system','feedback','ticket','occasion','low_stock','payment','corporate']);
    const unknown = badTypes.filter(t => !allowed.has(t));
    if (unknown.length > 0) {
      console.log('  WARN  notifications has unknown types: ' + unknown.join(', '));
    } else if (badTypes.length > 0) {
      console.log(`  ok    notification types all valid (${badTypes.length} distinct)`);
    }
  } catch (e) { /* ignore */ }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
JS
fi

hdr "Summary"
echo "  passes: $pass   warnings: $warn   failures: $fail"
if [ "$fail" -gt 0 ]; then
  echo
  echo "Backend is NOT ready. Fix the FAIL items above."
  exit 1
fi
if [ "$warn" -gt 0 ]; then
  echo
  echo "Backend can start, but some features will degrade. See WARNs above."
fi
echo "Done."
