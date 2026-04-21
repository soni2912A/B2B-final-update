# B2B Corporate Bakery Platform Frontend — Applied Fixes

This frontend has been patched based on a comprehensive audit. Summary of changes:

## Critical Behavior Changes
- `utils/api.js` — Silent mock fallback is OFF by default. Failed requests now throw real errors. Opt back in via `VITE_USE_MOCKS=true` in `.env`.
- `utils/api.js` — Dispatches `auth:unauthorized` on any 401, so the whole app can react.
- `AppContext.jsx` — Session restore now calls `/auth/me` to verify the stored token. Invalid tokens trigger auto-logout via the 401 listener.
- `AppContext.jsx` — Listens for `auth:unauthorized` and logs the user out automatically.
- `pages/LoginPage.jsx` — **No more fake demo login**. If the backend is down, the user sees an error instead of being logged in with `demo-token` as whatever role they picked.
- `pages/LoginPage.jsx` — Default credentials changed to `admin@acme.com / Admin@1234` (the seeded admin account).

## API Payload Fixes
- `pages/corporate/CorpPages.jsx` PlaceOrder — Payload now matches backend schema (`items: [{product, quantity, staffMembers}]`, separate `deliveryDate`, structured `deliveryAddress`).
- `pages/corporate/CorpPages.jsx` — Reads from `/corporate/products` (new endpoint) instead of `/admin/products` (which would 403 for corp users).
- `pages/corporate/CorpPages.jsx` — Order total now uses `basePrice` (not `price` which doesn't exist).
- `pages/admin/OrdersPage.jsx` — `updateStatus` and `sendAlert` use `prefix` consistently (admin vs corporate).
- `pages/admin/InvoicesPage.jsx` RecordPaymentModal — Sends `transactionId` (not `ref`), `method: 'bank_transfer'` enum values (not display strings like "Bank Transfer").
- `pages/admin/InvoicesPage.jsx` — Status filter options match backend enum (`sent`, `partial`, `paid`, etc. — no more `pending` which doesn't exist).

## Wired to Real Endpoints
- `pages/admin/MiscPages.jsx` InventoryPage — Now loads from `GET /admin/inventory`, adjust modal sends real `PATCH /admin/inventory/:productId/adjust` requests. Was entirely mock before.

## Documentation
- `.env.example` — Documents `VITE_API_URL` and `VITE_USE_MOCKS`
- `.gitignore` — Proper exclusions

## Deleted
- Stray `src/{components` directory from malformed shell commands removed

---

**Start here**: `cp .env.example .env`, `npm install`, `npm run dev`.

Vite proxies `/api/*` to `http://localhost:5000` so make sure the backend is running first.

## Known limitations (not blocking)

- `OccasionsPage` and `NotifPrefsPage` in `MiscPages.jsx` still use hardcoded data.
- `ReportsPage` now hits a working backend endpoint but some chart labels are still hardcoded — partial fix.
- Other fixes documented in the audit were deferred to keep this patch focused on critical path.
