
## Scenarios

### 1.a Reimbursement (< $100) — member already paid, wants money back
  Nani Gopal opens app → Expenses → New Voucher
  Taps "Reimbursement," snaps receipt photo
  OCR fills: amount $47, vendor "Costco," date
  Selects category "Prasadam," submits
  Auto-approved. Treasurer sees it in payment queue.
  Treasurer pays via e-transfer, marks paid. Done.

### 1.b Reimbursement (>= $100) — member already paid, wants money back
  Same as 1.a, but amount is $230
  Two approvers get notified
  Each reviews and approves (or one returns with note)
  Once 2 approvals: enters payment queue
  Treasurer pays, marks paid. Done.

### 1.c Advance — money needed before purchase, reconcile after
  Member needs $300 for festival supplies
  New Voucher → "Advance" → fills purpose, estimated amount, category
  Two approvers approve
  Treasurer disburses $300
  Member purchases, uploads receipt(s)
  Reconciliation: actual was $275 → member returns $25 (or keeps as next advance credit)
  Closed.

### 1.d Direct Payment — pay vendor/bill directly
  Hydro bill arrives → member/treasurer uploads invoice
  New Voucher → "Direct Payment" → vendor: Hydro-Quebec, amount, due date
  Approval flow based on amount
  Treasurer pays vendor directly. Done.

### 1.e Batch Entry — multiple receipts/invoices at once (UI convenience, not a separate voucher type)
  Member/treasurer has multiple receipts or invoices
  New Voucher → "Batch" → snaps/uploads documents one after another
  OCR extracts each → presented as editable list
  Reviews, assigns categories, submits all
  Each becomes individual voucher with appropriate approval flow
  Approvers see them grouped: "Batch of 8 from Nani Gopal"

### 1.f Bank Import — reconciliation, not voucher creation
  Treasurer downloads monthly CSV from Desjardins/TD
  Uploads to app → parser extracts transactions
  System auto-matches transactions to existing vouchers (by amount + date proximity)
  Three buckets shown:
    Matched — bank txn ↔ voucher (auto-close)
    Unmatched vouchers — approved/paid but no bank record (investigate)
    Unmatched bank txns — no voucher exists (create voucher from txn)
  Treasurer reviews, confirms. Reconciliation complete.


### 2.a Single Donation — cash/cheque/e-transfer, one-time
  Donor gives $200 by e-transfer
  Treasurer opens app → New Donation
  Selects/creates donor → amount, method (e-transfer), category (general/deity/building), date, note
  Save. Donation recorded. Running totals update.

### 2.b Recurring Pledge — monthly commitment, auto-tracked
  Donor commits to $108/month
  Treasurer creates pledge: donor, amount, frequency (monthly), start date
  Each month: system creates expected donation entry marked "pending"
  When e-transfer arrives, treasurer confirms → status: received
  Missed month: shows as overdue (no nagging — just visibility)

### 2.c In-Kind Donation — goods not cash, fair market value
  Donor brings commercial kitchen equipment worth ~$2,000
  Treasurer → New Donation → "In-Kind"
  Enters: donor, description, fair market value, category
  If FMV > $1,000: needs independent appraisal (CRA requirement) — uploads appraisal document
  Receipt issued for FMV amount.

### 2.d Event Collection — Sunday feast, festival, many small donations
  Sunday feast: plate collection yields $347
  Treasurer → New Donation → "Collection"
  Enters: event name, date, total amount
  Optionally logs named envelopes: "Nani Gopal $50, Anonymous $20, ..."
  Remainder logged as anonymous aggregate
  All named portions link to donor records for receipting

### 3.a Tax Receipts — annual, per donor (CRA-compliant)
  February: Treasurer opens Reports → Tax Receipts → Select Year
  System generates one receipt per donor with annual total
  CRA mandatory fields auto-filled:
    Charity name, address, registration number
    Receipt number (sequential, e.g., R-2025-0001)
    Donor full name and address
    Eligible gift amount
    Date(s) of donation(s)
    Statement: "This is an official receipt for income tax purposes"
    Signature line (charity authorized person)
    CRA website URL for charity info
  Treasurer reviews → generates PDFs → emails to each donor (or bulk email)
  Copies retained minimum 2 years (CRA requirement)
  Note: in-kind shows FMV + description separately. Advantage amounts deducted automatically.

### 3.b GST/HST Rebate — 50% back on GST paid, semi-annual or annual
  System tracks GST/HST paid on all expense vouchers (tax_amount field)
  Filing time: Reports → GST Rebate → select period
  System totals eligible GST paid → calculates 50% rebate amount
  Treasurer exports for Form GST66 filing
  When rebate received, recorded as income.

### 3.c T3010 Annual Return — within 6 months of fiscal year end
  Reports → T3010 → select fiscal year
  System generates summary: total revenue by source, total expenditures by category
  Treasurer exports data to fill T3010
  Not full automation — but data is ready and categorized.

### 4.a Donor Self-Service — donor views own history + receipts
  Donor logs in (or receives unique link)
  Sees: giving history, year totals, downloadable tax receipts
  Read-only view of their own data.

### 4.b Donor Board — public recognition, opt-in
  Public page (no login): shows donors who opted in
  Displays name and tier (not exact amount) — e.g., "Gold Patron," "Monthly Supporter"
  Donor opts in/out from their profile.


### 5.a Invite Member — treasurer/admin adds someone to the system
  Admin opens People → Invite
  Enters: name, email, role flags (member/approver/treasurer)
  System sends invite email with one-time link
  New user clicks link → sets password → logged in
  Appears in member list. Can now submit vouchers.

### 5.b Login — returning user
  User opens app.iskconmontreal.ca (bookmarked)
  Enters email + password → JWT stored
  Lands on role-appropriate dashboard.
  Session persists until explicit logout or 30-day expiry.

### 5.c Password Reset — forgot credentials
  Login screen → "Forgot password" → enters email
  Receives reset link → sets new password → logged in.


### 6.a Dashboard: Treasurer
  Lands on dashboard. Sees at a glance:
    Payment queue — approved vouchers awaiting payment (count + total)
    Pending approvals — vouchers awaiting others' approval (awareness)
    Month totals — donations in, expenses out, net
    Overdue pledges — recurring pledges not yet received
    Recent activity — last 10 actions across system
  One tap to enter payment queue and start paying.

### 6.b Dashboard: Approver
  Lands on dashboard. Sees:
    Pending approvals — vouchers needing their review (count)
    Recent approvals — what they approved/returned recently
  One tap into approval queue.

### 6.c Dashboard: Member
  Lands on dashboard. Sees:
    My vouchers — own submissions with status
    Returned — any vouchers sent back for correction
  One tap to create new voucher.

### 6.d Dashboard: Donor (self-service)
  Lands on dashboard. Sees:
    Giving history — all donations by year
    Tax receipts — downloadable PDFs by year
  Read-only. No actions.


### 7.a Monthly Report — treasurer reviews month
  Reports → Monthly → select month
  Summary: total donations by category, total expenses by category, net
  List of all vouchers and donations for the period
  Export as PDF.

### 7.b Annual Report — year-end summary for board/T3010
  Reports → Annual → select fiscal year
  Revenue by source, expenditures by category, donor count, top categories
  Feeds into 3.c (T3010) and board presentation.

### 7.c Donor Report — giving summary for receipting
  Reports → Donors → select year
  Per-donor totals, eligible amounts, receipt status (issued/not)
  Feeds into 3.a (tax receipts).


### 8.a Notifications — how users learn something needs attention
  Approver: email when voucher needs approval (batched daily or immediate based on preference)
  Treasurer: email when voucher enters payment queue
  Member: email when voucher returned or paid
  Donor: email when tax receipt available
  In-app: badge counts on dashboard (approval queue: 3, payment queue: 5)
  No push notifications — email + in-app badges only. Simple.


### 9.a Year-End Close — transition between fiscal years
  Treasurer opens Settings → Year-End → select year to close
  System verifies: all vouchers closed or rejected, all donations receipted, bank reconciled
  If gaps: shows checklist of unresolved items
  Once clean: year locked (read-only), new year active
  Historical data remains accessible for reports and audits.
