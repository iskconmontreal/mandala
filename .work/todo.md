* [x] landing: basic setup with sprae
* [x] datatable.net example page for finance
* [x] login page

  What Goloka needs to implement:
  * [ ] GET /auth/google — returns Google OAuth2 redirect URL
  * [ ] GET /auth/google/callback — handles code exchange, issues JWT
  * [ ] POST /auth/login — username/password fallback (phase 2)
  * [ ] JWT signing/verification (standard library in any language)
  * [ ] A users table with email, role, name — pre-populated by admin

  What Mandala (frontend) needs:
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
