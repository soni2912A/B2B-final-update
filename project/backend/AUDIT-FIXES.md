# B2B Corporate Bakery Platform Backend — Applied Fixes

This backend has been patched based on a comprehensive audit. Summary of changes:

## Auth & Security
- `auth.controller.js` — Distinguishes between unverified email (403) and deactivated account (401) with clear messages
- `auth.controller.js` register — Now links new corporate users to Business + Corporate records, auto-activates in dev
- `auth.controller.js` refreshToken — Now checks `isActive` before issuing new tokens
- `auth.controller.js` login — LoginLog entries now reflect actual outcome (failed vs success)
- `app.js` — Scoped rate limits: tight on auth endpoints, loose on rest; CORS auto-allows localhost:5173 in dev

## Response Shape
- `utils/responseHelper.js` — `sendPaginated` now emits `{ data: { [key]: items }, pagination }` where `key` is a named param
- All 13 list controllers updated to pass the right plural key (orders, corporates, products, invoices, deliveries, staff, users, logs, feedbacks, tickets, businesses, items)
- `admin/dashboard.controller.js` — Stats shape is now flat (totalOrders, totalRevenue, etc.) matching frontend
- `corporate/dashboard.controller.js` — Returns `upcomingBirthdays` with the shape frontend expects

## Data Integrity
- `services/invoice.service.js` — Atomic counter increment via `findByIdAndUpdate({ $inc })`
- `models/Invoice.model.js` — Compound unique index `{business, invoiceNumber}` instead of global unique
- `models/Order.model.js` — Flexible `deliveryAddress` sub-schema (accepts structured + free-form)
- `admin/invoice.controller.js` recordPayment — Uses `doc.save()` so `pre('save')` recalculates `balanceAmount`

## Wrong Field Names
- `jobs/cronJobs.js` — `roleName: 'admin'` → `role: 'admin'`
- `admin/discount.controller.js` validateCoupon — `usageCount` → `usedCount`
- `admin/ticket.controller.js` — `.populate('author', 'name roleName')` → `'name role'`

## Missing Functionality
- `admin/report.controller.js` — New `getReportOverview` for `GET /admin/reports`
- `admin/adminUser.controller.js` — New `deleteAdminUser` with self-delete protection
- `routes/corporate/product.routes.js` — **NEW FILE** — read-only products for corp users
- `routes/index.js` — Registers the new `/corporate/products` route

## Rewritten
- `admin/inventory.controller.js` — Rewritten around `Product.stockQuantity` as source of truth, `Inventory` model is now purely a ledger
- `routes/admin/inventory.routes.js` — Keyed by `productId`
- `superAdmin/business.controller.js` — Enriches responses with `plan`, `users`, `status` fields frontend expects

## Services
- `services/email.service.js` — Falls back to console logging when SMTP not configured (no more crashes in dev). Verification URLs printed for manual testing.

## Documentation
- `.env.example` — Complete documented template
- `.gitignore` — Proper exclusions

## Deleted
- Stray `src/{config,models,routes` directories from malformed shell commands removed

---

**Start here**: `cp .env.example .env`, fill in `MONGO_URI` + JWT secrets, `npm install`, `npm run seed`, `npm run dev`.

Log in with `admin@acme.com` / `Admin@1234` to see the fixes in action.
