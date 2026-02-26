* [x] landing: basic setup with sprae
* [x] datatable.net example page for finance
* [x] login page

* [x] Restructure
  * [x] Nav: 3 items only — Overview, Donations, Expenses
    * [x] Settings & Tax Receipts move to user menu (not nav)
    * [x] Members page deleted — donors are a sub-concern of Donations
    * [x] Reports page deleted — merged into Overview
    * [x] Tax page deferred — empty placeholder removed until real
  * [x] Overview (replaces Home + Reports)
    * [x] Net position (keep existing)
    * [x] Donation vs expense proportion — visual bar, not just numbers
    * [x] Category breakdown (move from Reports)
    * [x] Top donors (move from Reports)
    * [x] Recent transactions (keep existing)
    * [x] Month/year filter (keep existing)
    * [x] Quick-add "+" button (keep existing)
  * [x] Donations UX
    * [x] Filter bar: category, date range, search text
    * [x] Inline category summary at top (small breakdown, replaces Reports visit)
    * [x] Recurring donation flag
    * [x] Pagination for real data volumes
    * [x] Export CSV
    * [x] Donor autocomplete (keep existing)
    * [x] Receipt OCR (keep existing placeholder)
  * [x] Expenses UX
    * [x] Filter bar: category, date range, search text
    * [x] Inline category summary at top
    * [x] Recurring expense flag
    * [x] Pagination
    * [x] Export CSV
    * [x] Receipt OCR (keep existing placeholder)
  * [x] DRY: extract shared sprae init
    * [x] `user, active, logout, userMenu` repeated across every page → shared module
    * [x] Categories hardcoded in `<select>` across pages → shared constant or API-driven
    * [x] Year select hardcoded 2024/2025/2026 → dynamic
  * [x] Delete files
    * [x] `app/members.html`
    * [x] `app/reports.html`
    * [x] `app/tax.html`
    * [x] Remove `simple-datatables` CDN dependency
  * [x] Rename `setting.html` → `settings.html`

* [ ] What Goloka needs to implement:
  * [ ] GET /auth/google — returns Google OAuth2 redirect URL
  * [ ] GET /auth/google/callback — handles code exchange, issues JWT
  * [ ] POST /auth/login — username/password fallback (phase 2)
  * [ ] JWT signing/verification (standard library in any language)
  * [ ] A users table with email, role, name — pre-populated by admin

* [ ] What Mandala (frontend) needs:
  * [ ] Login page with "Sign in with Google" button (a link, not an SDK)
  * [ ] Token capture from URL fragment on redirect
  * [ ] localStorage for JWT storage
  * [ ] Auth helper module that attaches Authorization: Bearer to every fetch
  * [ ] Redirect to login.html when 401 received

## [ ] Happy Path
  1. Treasurer opens mandala (bookmarked on phone/laptop)
  2. Sees login → enters credentials → JWT stored
  3. Dashboard: donation total this month, expense total, net, recent activity
  4. Taps "+" → "Donation" → selects/creates donor → amount, category, date, note → Save
  5. Donation appears in list. Running total updates.
  6. Later: President opens same URL → logs in → sees same dashboard truth
  7. Month-end: Treasurer taps "Reports" → selects month → sees summary → exports PDF

* [ ] Donations
  * [ ] "+" → "Donation" → selects/creates donor → amount, category, date, note → Save

* [ ] Dashboard
  * [ ] donation total this month
  * [ ] expense total
  * [ ] net
  * [ ] recent activity

## Backlog

* [ ] Tax receipt template formatting / PDF generation (necessary, not exciting)
* [ ] Auth/session management for cross-domain static→API (real friction, must solve cleanly)
  - JWT tokens, cookie-less, Authorization header

* [ ] Offline/unreachable API — Static pages must gracefully handle API being down. No spinner-of-death.

* [ ] Mac Mini reliability — Hardware failure, power outage, network. Need backup strategy. Not day-one, but must be acknowledged.
* [ ] Data integrity — Financial data is sacred. Backup, audit trail, immutable records. This is non-negotiable from day one.

* [ ] Disaster being pretended away: Mitigation: automated backups to a second location. Document this requirement now.
