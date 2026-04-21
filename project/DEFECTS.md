# B2B Corporate Bakery Platform — Per-File Defect List

Audit of `backend/` and `fleetops/` against the **Common Defect Prevention Guide**.
Every item below is a **concrete defect** with file + line references.
Priority legend: 🔴 Blocker · 🟠 High · 🟡 Medium · ⚪ Polish

---

## PART 1 — FRONTEND (`fleetops/`)

### 📄 `src/utils/api.js`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 1 | 66 | 🔴 | `formatDate` uses `'en-US'` locale → "Apr 17, 2026" | Use `'en-GB'` and output `DD/MM/YYYY` |
| 2 | 70 | 🔴 | `formatTime` uses `'en-US'`, `hour: '2-digit'` defaults to lowercase am/pm in some browsers | Force `hour12: true`, then `.toUpperCase()` so AM/PM is uppercase |
| 3 | 73 | 🔴 | `formatCurrency` hard-codes `'$'` + `'en-US'` | Use `₹` + `'en-IN'` (India-based SaaS per BRD) |
| 4 | 88 | 🟡 | Status `'cancelled'` ✅ (correct British spelling) | — |
| 5 | whole file | 🟠 | Exports a silent mock fallback path (`USE_MOCKS`) — risks masking broken CRUD in dev | Remove entirely or guard behind `DEV` banner in UI |

### 📄 `src/data/mockData.js`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 6 | whole file | 🔴 | All 180 lines are mock generators still referenced by real pages (see AdminDashboard line 5 import) | Remove file; pages must rely only on API responses |
| 7 | 46 | 🟡 | Phone format `'+1 555-…'` is US | Switch seed examples to `+91 XXXXX-XXXXX` |
| 8 | 157 | 🟠 | `getMockData` returns a fake login token — dangerous on network failure | Delete; never auto-login |

### 📄 `src/AppContext.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 9 | 14–20 | 🟠 | Hard-coded notifications array | Fetch from `GET /notifications` |
| 10 | 28–34 | 🟡 | No "Remember Me" persistence — always saves token to localStorage regardless | Gate `localStorage.setItem` behind remember-me flag; else use `sessionStorage` |

### 📄 `src/components/ui/index.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 11 | 105–112 | 🔴 | `FormGroup` has **no support for**: mandatory asterisk, inline error, min/max, eye toggle, calendar icon, ✕ clear | Rewrite as `<FormField required label="Email ID" error={...} min={...} max={...} type="password" />` |
| 12 | 116 | 🔴 | `<Input />` — no eye icon for password, no clear ✕ for search, no calendar for date | Wrap with variant-based rendering |
| 13 | 121–141 | 🔴 | `FilterBar` search input has NO clear ✕ icon (line 135), no onChange wiring, `onClear` does nothing | Full rewrite: controlled input + ✕ button + fire callback |
| 14 | 130 | 🟡 | Dropdown has no search-inside behaviour (guide requires this for long lists) | Use a searchable select when `options.length > 8` |
| 15 | 144–154 | 🔴 | `Pagination` — no page-size selector (10/20/50/100), no prev/next, only shows first 7 page numbers, no click handler | Complete rewrite with size selector + handlers |
| 16 | 166 | 🔴 | `Empty` default text `"No data found"` (no full stop, inconsistent with guide's `"No records found."`) | Change to `"No records found."` |
| 17 | 82–102 | 🔴 | `Modal` has no mechanism to clear errors on reopen | Add `key` prop reset OR expose `resetOnClose` callback |
| 18 | 216 | 🔴 | `showToast(msg)` — callers pass strings without full stops everywhere | Enforce full stop by appending `.` if missing inside `showToast` |
| 19 | 20–33 | 🟡 | `Btn` has no `title`/tooltip prop for icon-only buttons | Add tooltip support |
| 20 | 73–79 | 🟠 | `TblAction` has no tooltip, no hover colour, same look for Delete (should be red) | Accept `variant="danger"` and `title` |
| 21 | 128 | 🟡 | Placeholder option is uppercase `"All Statuses"` but option values are lowercase — inconsistent casing pattern |

### 📄 `src/components/layout/Sidebar.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 22 | 55 | 🔴 | `title="Logout"` | Change to `"Log Out"` (two words per guide) |
| 23 | 47 | 🟡 | Entire user-row has empty `onClick={() => {}}` | Either wire to profile page or remove |

### 📄 `src/components/pages/LoginPage.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 24 | 463 | 🔴 | Label `"Email address"` | Change to `"Email ID*"` (with asterisk) |
| 25 | 467 | 🔴 | Placeholder `"you@company.com"` | Change to `"Enter Email ID"` |
| 26 | 472 | 🔴 | Label `"Password"` — no asterisk, no eye icon | `"Password*"` + eye toggle |
| 27 | 474 | 🔴 | `type="password"` only — no toggle | Toggle between `password`/`text` on eye click |
| 28 | 476 | 🟡 | Placeholder `"••••••••"` | Change to `"Enter Password"` |
| 29 | 484 | 🔴 | Button `"Sign in as {role}"` | Change to `"Log In"` (button must say exactly this) |
| 30 | 483 | 🔴 | Loading text `"Signing in…"` | Change to `"Logging in…"` |
| 31 | — | 🔴 | **No "Remember Me" checkbox** — guide requires this on every login panel | Add checkbox above Log In button |
| 32 | 494 | 🟠 | `"Forgot password?"` + `showToast('Reset email sent!')` → fake flow, not a real forgot-password page | Build real forgot-password screen → POST `/auth/forgot-password` |
| 33 | 493 | 🟡 | Exclamation mark in toast — guide requires full stop | Change to `"Password reset email sent."` |
| 34 | 17–18 | 🟠 | Email/password pre-filled with demo creds | Remove in production or gate on `DEV` flag |
| 35 | 39 | 🟡 | Error `"Unexpected response from server"` no full stop | Add `.` |
| 36 | 44 | 🟡 | `"Login failed. Please try again."` — OK (full stop present) but message should be role-aware | Consider `"Log in failed. Please try again."` |
| 37 | — | 🟠 | No error-message clear when the user starts typing again | Clear `error` in the input `onChange` handlers |

### 📄 `src/components/pages/RegisterPage.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 38 | 37 | 🔴 | Error `"Passwords do not match"` (no full stop) | `"Passwords do not match."` |
| 39 | 41 | 🔴 | `"Password must be at least 6 characters"` — (a) no full stop, (b) 6 chars is too weak | `"Password must be at least 8 characters."` + complexity rule |
| 40 | 311 | 🔴 | Label `"Full name *"` — **space before asterisk** | `"Full Name*"` |
| 41 | 315 | 🔴 | Label `"Phone"` | `"Contact Number*"` (required) |
| 42 | 316 | 🔴 | Placeholder `"+1 555 000 0000"` + no input restriction | `"Enter Contact Number"`, restrict to digits + length validation |
| 43 | 321 | 🔴 | `"Email address *"` with space | `"Email ID*"` |
| 44 | 322 | 🔴 | Placeholder `"jane@company.com"` | `"Enter Email ID"` |
| 45 | 327 | 🔴 | `"Password *"` with space | `"Password*"` |
| 46 | 330 | 🟡 | Placeholder `"Min. 6 characters"` | `"Enter Password"` (and bump to 8) |
| 47 | 340 | 🔴 | `"Confirm password *"` — space + lowercase 'p' | `"Confirm Password*"` |
| 48 | 352 | 🔴 | `"Company name *"` space + lowercase 'n' | `"Company Name*"` |
| 49 | 357 | 🟠 | `"Contact person"` — remove; merge with Contact Number per guide |
| 50 | — | 🔴 | **No Country / State / City dropdowns** — guide mandates these for address fields | Add 3 dropdowns (State auto-filters City) |
| 51 | — | 🔴 | **No Postal Code field** |
| 52 | — | 🔴 | **No Cancel button** — guide says every form must have one | Add Cancel that routes to login |
| 53 | — | 🔴 | **No per-field inline errors** — single top banner only | Move errors below each field |
| 54 | — | 🔴 | No password eye icon on both password fields | Add toggles |
| 55 | — | 🟠 | No client-side validation for whitespace-only input | Trim + reject |
| 56 | 295 | 🟠 | `"We've sent a verification email to {email}."` uses `'` which is fine but string is interpolated with no HTML escape — low risk in React but still |

### 📄 `src/components/pages/admin/AdminDashboard.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 57 | 5 | 🔴 | Imports `mockOrders`, `mockDeliveries` | Remove imports and fallbacks |
| 58 | 18–19 | 🔴 | `|| mockOrders(5)` fallback silently shows fake data | Remove; show `Empty` component instead |
| 59 | 17 | 🔴 | Hard-coded stat fallback values (248, 186, 94200 etc.) | Remove fallback; show Loading |
| 60 | 27–39 | 🟠 | Quick actions are clickable but stat cards (line 44–47) are **NOT clickable** — guide says dashboard stat cards must route to their list page | Wrap each `<StatCard>` in a button → `navigate('admin-orders')` etc. |
| 61 | 70 | 🟡 | `'Cancelled'` ✅ British spelling (good) but chart percentages are hard-coded | Fetch real status breakdown |
| 62 | 111 | 🟡 | Timeline line under each delivery is fine |

### 📄 `src/components/pages/admin/OrdersPage.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 63 | 29 | 🔴 | `showToast('Order status updated')` no full stop | `"Order status updated."` |
| 64 | 36 | 🔴 | `showToast('Pre-delivery alert sent!')` — exclamation not full stop | `"Pre-delivery alert sent."` |
| 65 | 44 | 🔴 | `showToast('Exporting…')` — fake export | Wire to real `GET /admin/orders/export` that returns XLSX |
| 66 | 47–51 | 🔴 | `FilterBar` not wired — `onClear={() => {}}`, no state | Lift filter state, pass to `load()` as query params |
| 67 | 58 | 🟠 | Column header `"Order No."` ok; add `"SR. No."` as first column per guide | Prepend serial-number column |
| 68 | 82 | 🔴 | `Pagination` rendered but no page-change handler | Pass `onPageChange`, `onLimitChange` and re-fetch |
| 69 | 69–77 | 🟠 | Action icons have no tooltips | Add `title` attribute / wrap in Tooltip |
| 70 | 75 | 🟡 | `Alert` action text no icon-style consistency | Use icon + tooltip |
| 71 | — | 🔴 | **No Create Order flow** — guide + BRD require admin can create orders manually | Add `+ New Order` button + modal |
| 72 | 140 | 🟠 | `FormGroup label="New Status"` — no asterisk | `"New Status*"` |
| 73 | 145 | 🟡 | `"Notes (optional)"` — fine, but use consistent casing |

### 📄 `src/components/pages/admin/CorporatesPage.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 74 | 25 | 🔴 | `"Status updated"` no full stop | `"Status updated."` |
| 75 | 32 | 🔴 | Fake export toast | Wire to real endpoint |
| 76 | 39 | 🔴 | `onClear={() => {}}` | Real clear + re-fetch |
| 77 | 46 | 🔴 | Columns `"Email"`, `"Phone"` | Must be `"Email ID"`, `"Contact Number"` |
| 78 | 88 | 🔴 | `showToast('Corporate added')` no full stop, no try/catch — fires even if POST fails | `await` → on success show `"Corporate added successfully."`, on error show error toast |
| 79 | 93 | 🔴 | Label `"Company Name"` no asterisk | `"Company Name*"` |
| 80 | 95 | 🔴 | Label `"Email"` + placeholder `"contact@company.com"` | `"Email ID*"` + `"Enter Email ID"` |
| 81 | 96 | 🔴 | Label `"Phone"` + US placeholder | `"Contact Number*"` + `"Enter Contact Number"` |
| 82 | 97 | 🔴 | `"Credit Limit"` accepts any number including negatives | Add `min="0"` + validation |
| 83 | 100 | 🟠 | Single `"Billing Address"` textarea — needs Country/State/City dropdowns + Postal Code | Split into structured address fields |
| 84 | — | 🔴 | **No Edit flow** — only Add + View + toggle Status | Add Edit modal with pre-populated values |
| 85 | — | 🔴 | **No Delete with confirmation modal** | Add |
| 86 | 92 | 🟡 | Modal actions show Add Corporate first, then Cancel — per guide, Cancel should be visible but less prominent ✅ |

### 📄 `src/components/pages/admin/DeliveriesPage.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 87 | 22, 28, 88 | 🔴 | Three messages missing full stops | Add `.` |
| 88 | 34 | 🟠 | Shows `deliveries.length` instead of total from pagination | Use pagination.total |
| 89 | — | 🔴 | **No `<Pagination />` component at all** on this page | Add |
| 90 | 42 | 🔴 | `onClear={() => {}}` | Wire |
| 91 | 48 | 🟠 | Column `"Assigned To"` ok |
| 92 | 93 | 🔴 | `"Order Number"` should be a searchable dropdown of active orders, not free text | Replace with select |
| 93 | 95 | 🔴 | `"Assigned Staff"` free text — must be dropdown of staff | Replace with select |
| 94 | 93–99 | 🔴 | No asterisks on mandatory fields | Add `*` |
| 95 | — | 🔴 | No validation, no Cancel button behaviour confirmed | Verify |

### 📄 `src/components/pages/admin/ProductsPage.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 96 | 24 | 🔴🔴 | `if (!confirm('Delete this product?')) return` — **browser `confirm()` is explicitly forbidden** by the guide | Replace with `ConfirmModal` component: `"Are you sure you want to delete {productName}?"` |
| 97 | 26 | 🔴 | `"Product deleted"` no full stop | Add `.` |
| 98 | 77 | 🔴 | Edit button opens AddProductModal but **does not pre-populate existing values** — violates guide | Pass `initialValues` prop to modal |
| 99 | 93 | 🔴 | `showImportModal()` → just shows a toast, no actual import | Build real import modal with file upload |
| 100 | 100 | 🔴 | `"Product added"` no full stop, no error handling | Add try/catch + full stop |
| 101 | 106 | 🔴 | Label `"Product Name"` no asterisk | `"Product Name*"` |
| 102 | 107 | 🔴 | `"SKU"` no asterisk | `"SKU*"` |
| 103 | 108 | 🔴 | `"Price"` no asterisk + allows negatives | `"Price (₹)*"` + `min="0"` |
| 104 | 109 | 🔴 | `"Stock Quantity"` no asterisk + allows negatives | `"Stock Quantity*"` + `min="0"` |
| 105 | 121 | 🟠 | `"Description"` textarea has no max-length limit | Add `maxLength="500"` per guide |

### 📄 `src/components/pages/admin/InvoicesPage.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 106 | 31 | 🔴 | `"Exporting…"` fake | Wire |
| 107 | 45 | 🔴 | `onClear={() => {}}` | Wire |
| 108 | 66 | 🔴 | `showToast('PDF downloaded')` — no actual download | Call `GET /admin/invoices/:id/pdf` and trigger download |
| 109 | 68 | 🔴 | `"Redirecting to payment…"` fake | Real payment gateway redirect or remove |
| 110 | 75 | 🔴 | Pagination not wired | Same fix as Orders |
| 111 | 88 | 🔴 | Same "PDF downloaded" fake toast + `onClick` after toast fires always |
| 112 | 108 | 🟠 | Tax hard-coded `* 0.1` — should come from invoice.taxAmount | Read from API |
| 113 | 127 | 🟠 | `"Payment recorded"` — missing `.` | Add |
| 114 | 140–150 | 🔴 | No asterisks on any mandatory field | Add |
| 115 | 140 | 🔴 | `"Amount Paid"` accepts negatives | Add `min="0"` |
| 116 | 150 | 🟡 | Note field has no maxLength | Add |

### 📄 `src/components/pages/admin/MiscPages.jsx`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 117 | 5 | 🔴 | Imports `mockProducts, randNum` still in use | Remove |
| 118 | 16–22 | 🔴 | Occasions events **hard-coded**, not from API | Fetch `/admin/occasions` |
| 119 | 77 | 🔴 | Add Occasion button fires toast without actually saving | Real POST + refresh calendar |
| 120 | 78–83 | 🔴 | No asterisks, no placeholders matching labels, no validation |
| 121 | 134–138 | 🔴 | DiscountsPage — `discounts` array is **hard-coded**; no API call | Fetch `/admin/discounts` |
| 122 | 159 | 🔴 | Edit button opens Create modal without prefill | Fix |
| 123 | 160 | 🔴 | Delete fires toast without API + no confirmation modal | Fix both |
| 124 | 168–178 | 🔴 | No asterisks on mandatory fields |
| 125 | 176 | 🟠 | Expiry `<Input type="date" />` without min=today | Add |
| 126 | 229 | 🔴 | Ticket create → fake toast, no POST | Wire to `POST /admin/tickets` |
| 127 | 212 | 🟡 | Ticket count badge not refreshed after create |
| 128 | — | 🔴 | InventoryPage / NotifPrefsPage may still have mock behaviour (per AUDIT-FIXES notes) — review |

### 📄 `src/components/pages/admin/SystemPages.jsx`

Assumption based on file size (15KB) and audit notes:

| # | Severity | Issue |
|---|---|---|
| 129 | 🟠 | EmailTemplatesPage — verify real save + variable preview works |
| 130 | 🟠 | LoginLogsPage + EmailLogsPage — verify pagination wired |
| 131 | 🔴 | ImportExportPage — verify file upload actually hits backend |
| 132 | 🔴 | AdminUsersPage — verify create/delete/toggle all work |
| 133 | 🔴 | SettingsPage — verify save actually PUTs to backend |

### 📄 `src/components/pages/corporate/CorpPages.jsx`

| # | Severity | Issue |
|---|---|---|
| 134 | 🔴 | Same label violations (Email, Phone) to fix |
| 135 | 🔴 | PlaceOrderPage — verify ALL mandatory fields have asterisks, Country/State/City dropdowns for delivery address |
| 136 | 🔴 | CorpStaffPage — CRUD modals need asterisks, validation, confirm modal for delete |
| 137 | 🔴 | CorpUsersPage — same |

### 📄 `src/components/pages/superadmin/SAPages.jsx`

| # | Severity | Issue |
|---|---|---|
| 138 | 🔴 | SABusinessesPage, SASubscriptionsPage — all need the same treatment (asterisks, confirm modals, British labels) |

---

## PART 2 — BACKEND (`backend/`)

### 📄 `src/controllers/auth/auth.controller.js`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 139 | 13 | 🟡 | `"Email and password are required"` — no full stop | Add `.` |
| 140 | 26 | 🟡 | `"Invalid email or password"` no full stop | Add `.` |
| 141 | 30 | 🟡 | `"Please verify your email before logging in. Check your inbox (or server logs in dev)."` — OK with `.` but wording mixes prod + dev | Split: send dev note only when `NODE_ENV !== 'production'` |
| 142 | 34 | 🟡 | `"Your account has been deactivated. Contact support."` — OK |
| 143 | 46 | 🟡 | `"Login successful"` | `"Logged in successfully."` |
| 144 | 55 | 🟡 | `"User fetched"` | `"User fetched successfully."` |
| 145 | 63 | 🟡 | `"No user found with this email"` | Add `.` |
| 146 | 78 | 🟡 | `"Password reset email sent"` | Add `.` |
| 147 | 89 | 🟡 | `"Token is invalid or has expired"` | Add `.` |
| 148 | 98 | 🟡 | `"Password reset successful"` → `"Password reset successfully."` |
| 149 | 105 | 🟡 | `"Refresh token required"` → Add `.` |
| 150 | 108 | 🟡 | `"User not found"` → Add `.` |
| 151 | 111 | 🟡 | `"Token refreshed"` → Add `.` |
| 152 | 119 | 🔴 | `changePassword` does **not** check `newPassword !== currentPassword` — guide mandates this | Add check: if same, return 400 `"New Password must be different from Current Password."` |
| 153 | 132 | 🟡 | `"name, email, password, and companyName are required"` — lowercase field names, no full stop | `"Name, Email ID, Password, and Company Name are required."` |
| 154 | 136 | 🟡 | `"Email already registered"` | Add `.` |
| 155 | 144 | 🟡 | Missing `.` |
| 156 | — | 🔴 | No rate limit helper confirmed on `login` route specifically (check `app.js`) |

### 📄 `src/controllers/admin/order.controller.js`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 157 | — | 🔴 | **No `createOrder`** function — admin cannot create orders from this controller | Add POST handler (possibly reuse corporate placeOrder logic) |
| 158 | 41, 42, 56, 64, 78, 80, 94, 95, 105, 108 | 🟡 | All messages missing full stops | Add `.` |
| 159 | 90 | 🟠 | cancelOrder doesn't validate `reason` | Require reason, 400 if empty |

### 📄 `src/controllers/admin/corporate.controller.js`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 160 | 27, 28, 37, 50, 51, 65, 66, 75, 76 | 🟡 | Messages missing `.` | Add |
| 161 | — | 🟠 | No email uniqueness check before `Corporate.create` | Add pre-check or rely on unique index + handle Mongo duplicate-key error |
| 162 | — | 🟠 | deleteCorporate has no cascade — orphan invoices/orders | Either soft-delete or reject with 409 when dependencies exist |

### 📄 `src/controllers/admin/*.controller.js` (all others)

All follow the same pattern. Apply universally:

| # | Severity | Issue |
|---|---|---|
| 163 | 🟡 | Every `sendSuccess(res, 200, '…')` message needs a full stop |
| 164 | 🟡 | Every `sendError(res, …, '…')` message needs a full stop |
| 165 | 🟠 | Every List endpoint should accept `search` param and apply to relevant fields via `buildSearchQuery` (verify — only some do) |
| 166 | 🟠 | All price/quantity fields: validate `>= 0` before save |
| 167 | 🔴 | `delete*` endpoints that affect child records need 409 cascade checks |

### 📄 `src/validators/index.js`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 168 | 6 | 🟡 | `"Validation failed"` no full stop | `"Validation failed."` |
| 169 | 12 | 🟡 | `"Valid email is required"` no `.` | Fix |
| 170 | 13 | 🟡 | `"Password is required"` no `.` | Fix |
| 171 | 20 | 🔴 | Password min = **6** — too weak for SaaS | Raise to 8 + add regex for 1 upper + 1 digit + 1 symbol |
| 172 | 21 | 🟠 | Registration doesn't validate `phone`, `companyName`, or name length |
| 173 | 18 | 🟠 | Name doesn't reject numbers/special chars (guide rule) | Add `.matches(/^[A-Za-z\s.'-]+$/)` |
| 174 | — | 🔴 | **No `validateCorporate`, `validateDelivery`, `validateInvoice`, `validateTicket`, `validateDiscount`** — most controllers accept any payload | Add validators for every Create/Update endpoint |
| 175 | — | 🔴 | No whitespace-only rejection — `.trim().notEmpty()` catches some but not `"   "` strings that trim to empty (actually this does work — but `.not().isEmpty()` without trim does not) | Audit every field |

### 📄 `src/models/User.model.js`

| # | Line | Severity | Issue | Fix |
|---|---|---|---|---|
| 176 | 7 | 🔴 | `minlength: 6` — too weak | `minlength: 8` |
| 177 | — | 🟠 | No complexity validator | Add pre-save hook or custom validator |
| 178 | 6 | 🟠 | `unique: true` on email with no partial index means soft-delete collisions later | OK for now, revisit if soft-delete added |

### 📄 `src/middleware/*`

| # | Severity | Issue |
|---|---|---|
| 179 | 🟠 | `activityLog.middleware.js` — verify it logs every mutation |
| 180 | 🟡 | `errorHandler.js` — confirm Mongoose duplicate-key and validation errors produce user-friendly messages with full stops |

### 📄 `src/utils/responseHelper.js`

| # | Severity | Issue |
|---|---|---|
| 181 | 🟡 | Confirm `sendSuccess` auto-appends `.` to messages missing it — a cheap way to enforce the rule centrally |

### 📄 `src/app.js`

| # | Severity | Issue |
|---|---|---|
| 182 | 🟠 | Verify auth routes have tight rate limits (login brute-force), other routes looser (per audit notes) |
| 183 | 🟠 | Verify CORS is locked down in production (only dev whitelists localhost) |

---

## PART 3 — CROSS-CUTTING / MISSING FEATURES

| # | Severity | Item |
|---|---|---|
| 184 | 🔴 | **No shared `DataTable` component** — every list page re-implements pagination/search |
| 185 | 🔴 | **No shared `ConfirmModal` component** — ProductsPage uses browser `confirm()` |
| 186 | 🔴 | **No shared `FormField` component** — no central place to enforce asterisks, inline errors, eye toggle, calendar icon |
| 187 | 🔴 | **No dark-mode toggle** in Topbar — verify dark theme renders all icons/progress bars |
| 188 | 🔴 | **No tooltips on any action icon** in tables |
| 189 | 🔴 | **No Forgot Password real flow** (only toast) |
| 190 | 🔴 | **No Reset Password page** |
| 191 | 🔴 | **No Verify Email page** |
| 192 | 🔴 | **No Change Password UI** anywhere (backend endpoint exists) |
| 193 | 🔴 | **No admin-side Create Order flow** |
| 194 | 🔴 | **No Staff CRUD UI audit** — verify all fields match BRD |
| 195 | 🟠 | **No Country/State/City seed data** — needed for every address field |
| 196 | 🟠 | **No min/max length applied** to any input globally |
| 197 | 🟠 | Dashboard stat cards not clickable (violates guide) |
| 198 | 🟠 | Sidebar "Log Out" wording |
| 199 | 🟠 | `formatDate` / `formatCurrency` locale not India |
| 200 | 🟡 | `"No records found."` string not standardised across pages |

---

## PART 4 — FLAGGED FOR FUTURE WORK (not counted in scorecard)

Architectural questions surfaced during builds — not defects per se, but decisions that need to be made before related feature work.

### Subscription model role is ambiguous (catalog vs per-tenant)

**Status**: flagged 2026 during (A)-scope Plan-catalog UI build.

**Context**: The `Subscription` schema has a `business: { ref: 'Business' }` field, suggesting per-tenant subscriptions (every tenant has its own Subscription doc, possibly cloned from a template at provisioning time). But the catalog-lookup pattern in `createBusiness` uses `Subscription.findOne({ name: /^starter$/i })` — treating `Subscription` as a shared catalog of plans (three rows total, keyed by name).

The current seed (post the (A) catalog build) creates three plans with `business: null`, making them shared-catalog rows. The `business` field sits unused on those rows. `Business.subscription` points at whichever catalog plan the tenant is on.

The model carries both shapes ambiguously. If we keep going, every new reader of the codebase has to infer which interpretation is canonical from the call-site semantics rather than the schema.

**Two ways to resolve**:

- **(a) Catalog-only**: drop the `business` ref from the Subscription schema. `Subscription` becomes one row per plan type (three total). A `Business` references the `Subscription` as "which plan am I on." Migration: `db.subscriptions.updateMany({}, { $unset: { business: '' } })` and remove the field from the model.

- **(b) Per-tenant**: every Business has its own Subscription doc, copied from a template at provisioning time. The catalog lookup in `createBusiness` would clone a template row rather than reference it directly. Migration: for every existing Business, clone the referenced catalog plan and rewrite `business.subscription` to point at the copy. Also requires a separate `PlanTemplate` model (or convention) to serve the catalog.

**When to decide**: when enforcement (C-scope quota-checking) is scoped. Until then, the current ambiguity has no user-visible impact — the catalog UI works against shared rows, and `createBusiness` keeps finding them by name. Not blocking.

**Why this matters later**: enforcement code like `if (count >= business.subscription.maxCorporates) reject` assumes each Business has a stable snapshot of its limits. Under (a), changing a catalog plan's `maxCorporates` immediately affects every business on that plan — which is either a feature or a surprise, depending on what you want. Under (b), catalog edits only apply to NEW businesses provisioned afterwards, and existing businesses keep their cloned limits until a super-admin pushes an update. Pick the one that matches the desired product behaviour before writing enforcement.

---

## SUMMARY SCORECARD

| Area | Defects | Blockers (🔴) |
|---|---|---|
| Frontend shared UI (`ui/index.jsx`, utils) | 11 | 7 |
| Login / Register pages | 24 | 16 |
| Admin pages (Dashboard, Orders, Corporates, Deliveries, Products, Invoices, Misc, System) | 70+ | 30+ |
| Corporate + Super-admin pages | ~15 | 8+ |
| Backend controllers (messages missing `.`, cascade, createOrder) | 25+ | 4 |
| Validators | 8 | 4 |
| Models | 3 | 2 |
| Cross-cutting (missing components & flows) | 17 | 11 |
| **TOTAL** | **~200** | **~80** |

---

## HOW TO USE THIS FILE

1. Save this file as `DEFECTS.md` in the repo root (outside both `backend/` and `fleetops/`).
2. Open Claude Code / Cline / Continue in VS Code.
3. Paste the master prompt (from the previous message) and also say:
   > "Read DEFECTS.md. Work through defects in order, one numbered group at a time. After each group, run both servers, test the affected flow end-to-end, and report back before starting the next group."
4. Start with **#11–#21 (shared UI)** — fixing these removes 40+ downstream defects because every page uses them.
5. Then **#184–#186** (create the three missing shared components: DataTable, ConfirmModal, FormField).
6. Then sweep frontend pages.
7. Finally the backend full-stop sweep (#158–#166) can be done in one regex pass.
