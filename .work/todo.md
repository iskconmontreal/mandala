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

* [ ] Scenarios refinement
  * That's creeping toward "building impressive software" rather than "serving the treasurer." The next treasurer should understand the data model in 5 minutes — can they?
  * Resolve: Event entity — 3 fields, one derivable. It's a label, not a thing.
    Notification entity — infrastructure masquerading as domain. Notifications are computed from state transitions, not stored truth.
    FiscalYear entity — it's a config flag, not an entity. "Is 2025 closed?" is one boolean.
    batch_id — already killed, still in file.
    Donor.board_opt_in — deferred feature, polluting core model.
  * Cleanup and resolve: Scenarios 1.e already says "UI convenience, not a separate expense type." The document knew it was ornament but included it anyway. Several scenarios are actually UI specs (dashboards, notifications, reports) or rules (approval thresholds) pretending to be user stories.
  * Delete:
    From infology:
    Kill	Why
    Event entity	event_name string on Donation. total_collected is sum(donations where event_name=X).
    Notification entity	Derived. "Expenses where status=submitted and needs_my_approval" is a query, not stored data.
    FiscalYear entity	Config value. One row in settings.
    batch_id on Expense	Already decided.
    advance_id → Expense	Bug. Reconciliation receipts are Attachments on the advance, not child Expenses. Scenario 1.c says "uploads receipt(s)" — those are files, not new expenses.
    Donation.receipt_no	Denormalization. TaxReceipt already links donor+year.
    BankTransaction.match_status	Derivable from expense_id is null.
    Expense status reconciling	Derivable: type=advance AND status=paid AND actual_amount is null.
    Donor.board_opt_in	Deferred feature.
    TaxReceipt CRA fields	Org-level config (charity name, address, reg no). Not per-receipt data. Receipt only needs: no, donor, year, amount, date_issued, pdf.
    From scenarios:
    Kill/Merge	Why
    1.a + 1.b → one scenario	Only difference is approval threshold. That's a rule, not a story.
    1.e Batch Entry	UI detail, not domain.
    Section 6 (Dashboards)	UI spec. Belongs in mockups, not scenarios.
    Section 8 (Notifications)	Cross-cutting infrastructure. Not a user story.
    7.b Annual Report	Same as 7.a with different period selector.
    7.c Donor Report	It's a step inside 3.a (tax receipts), not a separate scenario.
    4.b Donor Board	Deferred.
    * Resolve: The advance_id relationship is wrong. Infology says "Expense (advance) links to 0..n Expenses (reconciliation receipts via advance_id)." But receipts uploaded during reconciliation aren't new expenses — they're Attachments. The current model invents phantom child expenses that don't exist in any scenario. This would cause real confusion during implementation.
    8 expense statuses. draft | submitted | returned | rejected | approved | paid | reconciling | closed. Kill reconciling (derived). That leaves 7, which maps cleanly to the lifecycle:
    draft → submitted → approved → paid → closed
                  ↘ returned (fix, resubmit)
                  ↘ rejected (terminal)
    For non-advances: paid could be terminal. But bank reconciliation wants to confirm payment cleared, so closed = "confirmed in bank." Consistent across types.
    Donation categories ≠ Expense categories. This is correct (income sources ≠ expense purposes) but the infology doesn't explain why they differ. Someone reading it later will wonder.
    * Resolve: "Scenarios are complete." They're not. No scenario mentions draft status — every story jumps straight to "submits." But the mockups introduced "editable until finalized" and the infology has draft. Gap between what's written and what's designed.
    "Event is an entity." It's a string. total_collected is sum(). The desire to make it an entity is the desire to build more than needed.

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

* [ ] Donations
  * [ ] "+" → "Donation" → selects/creates donor → amount, category, date, note → Save or save and add one more

* [ ] Limit user/pass login only to temple internal network

* [ ] Dashboard
  * [ ] donation total this month
  * [ ] expense total
  * [ ] net
  * [ ] recent activity

* [ ] Tax receipt template formatting / PDF generation (necessary, not exciting)
* [ ] Auth/session management for cross-domain static→API (real friction, must solve cleanly)
  - JWT tokens, cookie-less, Authorization header

* [ ] Offline/unreachable API — Static pages must gracefully handle API being down. No spinner-of-death.

* [ ] Mac Mini reliability — Hardware failure, power outage, network. Need backup strategy. Not day-one, but must be acknowledged.
* [ ] Data integrity — Financial data is sacred. Backup, audit trail, immutable records. This is non-negotiable from day one.

* [ ] Disaster being pretended away: Mitigation: automated backups to a second location. Document this requirement now.
