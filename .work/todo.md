

## March ~~5~~ 6

* [x] harden backend

* [ ] complete flows (tested dev)
  * [ ] request expense - treasurer gets notified
  * [ ] changing / assigning roles

* [ ] switch year persists

* [ ] adding member when adding expense button

* [ ] main: deploy to prod;
  * [ ] import all 2025 receipts database

* [ ] Import all interacs members names from files: MK, Samir
* [ ] Onboard MK, Samir, Ash


## [ ] User testing

* [x] What if user uploads expense receipt into donation form? -> don't store intent.
* [x] Donation form should not necessarily have photos.
  * [x] That should not be called scan "receipt".
* [ ] Viewer doesn't see recent activity after uploading the document
  * [ ] Viewer has no finance info - no permission
* Treasurer doesnt see freshly added expenses because they can have old date - should sort by date submitted maybe?
* Treasurer append expense form error on appending image
* Hanging loading button on expense details
* Pujari new role breaks list
* Pending approval status doesn't approve
* [x] Search doesn't highlight

## [ ] UIs

* [ ] Search through unloaded data
* [ ] Better pills alignment
* [ ] Income same style as expenses
* [ ] Display attachments shortcuts in the lines
* [ ] Unify icons across the app
* [ ] Make preloading better, while JS/data loads
* [ ] Quick actions can be better in desktops since there's enough space
* [ ] Make scan image area for existing items less big maybe? Or humbler
* [ ] Better multiple categories filter
* [ ] History label in modal info is inconsistent
* [ ] Highlight added item in content

## [ ] Notifications
  * [ ] Invitations for all oboardees
  * [ ] Integrate backend notification center from Goloka Swagger
    * [ ] Read `GET /api/me/notifications`
    * [ ] Use `POST /api/me/notifications/:id/read` and `POST /api/me/notifications/read-all`
    * [ ] Add toasts for successful expense/donation submit
    * [ ] Highlight newly created row for 3 seconds
    * [ ] Show status badges + timeline in `/me/expenses`

## [ ] Auth flows
  * [ ] Google
  * [ ] Apple
  * [ ] OTP SMS
  * [ ] Passcode / keycode (biometrics)

* [x] Donations
  * [ ] "+" → "Donation" → selects/creates donor → amount, category, date, note → Save or save and add one more

## [ ] Mobile version


## Backlog

* [ ] Sprae load first
* [ ] Autoloading is a bit strange
* [x] page transitions @​view-transition { navigation: auto }

* [ ] Enhance frontend looks: not SLOP

* [ ] Tax receipt template formatting / PDF generation (necessary, not exciting)
* [ ] Auth/session management for cross-domain static→API (real friction, must solve cleanly)
  - JWT tokens, cookie-less, Authorization header

* [ ] Offline/unreachable API — Static pages must gracefully handle API being down. No spinner-of-death.

* [ ] Mac Mini reliability — Hardware failure, power outage, network. Need backup strategy. Not day-one, but must be acknowledged.
* [ ] Data integrity — Financial data is sacred. Backup, audit trail, immutable records. This is non-negotiable from day one.

* [ ] Disaster being pretended away: Mitigation: automated backups to a second location. Document this requirement now.

* [ ] Change expense grouping


## Ideas

* [ ] Link to soundboard (can be iframe)
* [ ] Write down Luv prabhu / sankirtan numbers
* [ ] Upload a file, system decides itself where to classify it: expense, donation, legal etc.
* [ ] Who is online feature
* [ ] Tracking spiritual results to please Guru

## Archive

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

* [x] OTP with trusted device
