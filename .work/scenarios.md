## Scenarios


### 1. Expenses (vouchers)

**1.a Reimbursement (< $100)** — member already paid, wants money back
1. Nani Gopal opens app → Expenses → New Voucher
2. Taps "Reimbursement," snaps receipt photo
3. OCR fills: amount $47, vendor "Costco," date
4. Selects category "Prasadam," submits
5. Auto-approved. Treasurer sees it in payment queue.
6. Treasurer pays via e-transfer, marks paid. Done.

**1.b Reimbursement (>= $100)** — member already paid, wants money back
1. Same as 1.a, but amount is $230
2. Two approvers get notified
3. Each reviews and approves (or one returns with note)
4. Once 2 approvals: enters payment queue
5. Treasurer pays, marks paid. Done.

**1.c Advance** — money needed before purchase, reconcile after
1. Member needs $300 for festival supplies
2. New Voucher → "Advance" → fills purpose, estimated amount, category
3. Two approvers approve
4. Treasurer disburses $300
5. Member purchases, uploads receipt(s)
6. Reconciliation: actual was $275 → member returns $25 (or keeps as next advance credit)
7. Closed.

**1.d Direct Payment** — pay vendor/bill directly
1. Hydro bill arrives → member/treasurer uploads invoice
2. New Voucher → "Direct Payment" → vendor: Hydro-Quebec, amount, due date
3. Approval flow based on amount
4. Treasurer pays vendor directly. Done.

**1.e Batch Entry** — multiple receipts/invoices at once *(UI convenience, not a separate voucher type)*
1. Member/treasurer has multiple receipts or invoices
2. New Voucher → "Batch" → snaps/uploads documents one after another
3. OCR extracts each → presented as editable list
4. Reviews, assigns categories, submits all
5. Each becomes individual voucher with appropriate approval flow
6. Approvers see them grouped: "Batch of 8 from Nani Gopal"

**1.f Bank Import** — reconciliation, not voucher creation
1. Treasurer downloads monthly CSV from Desjardins/TD
2. Uploads to app → parser extracts transactions
3. System auto-matches transactions to existing vouchers (by amount + date proximity)
4. Three buckets shown:
   - **Matched** — bank txn ↔ voucher (auto-close)
   - **Unmatched vouchers** — approved/paid but no bank record (investigate)
   - **Unmatched bank txns** — no voucher exists (create voucher from txn)
5. Treasurer reviews, confirms. Reconciliation complete.


### 2. Donations

**2.a Single Donation** — cash/cheque/e-transfer, one-time
1. Donor gives $200 by e-transfer
2. Treasurer opens app → New Donation
3. Selects/creates donor → amount, method (e-transfer), category (general/deity/building), date, note
4. Save. Donation recorded. Running totals update.

**2.b Recurring Pledge** — monthly commitment, auto-tracked
1. Donor commits to $108/month
2. Treasurer creates pledge: donor, amount, frequency (monthly), start date
3. Each month: system creates expected donation entry marked "pending"
4. When e-transfer arrives, treasurer confirms → status: received
5. Missed month: shows as overdue (no nagging — just visibility)

**2.c In-Kind Donation** — goods not cash, fair market value
1. Donor brings commercial kitchen equipment worth ~$2,000
2. Treasurer → New Donation → "In-Kind"
3. Enters: donor, description, fair market value, category
4. If FMV > $1,000: needs independent appraisal (CRA requirement) — uploads appraisal document
5. Receipt issued for FMV amount.

**2.d Event Collection** — Sunday feast, festival, many small donations
1. Sunday feast: plate collection yields $347
2. Treasurer → New Donation → "Collection"
3. Enters: event name, date, total amount
4. Optionally logs named envelopes: "Nani Gopal $50, Anonymous $20, ..."
5. Remainder logged as anonymous aggregate
6. All named portions link to donor records for receipting


### 3. Compliance

**3.a Tax Receipts** — annual, per donor (CRA-compliant)
1. February: Treasurer opens Reports → Tax Receipts → Select Year
2. System generates one receipt per donor with annual total
3. CRA mandatory fields auto-filled:
   - Charity name, address, registration number
   - Receipt number (sequential, e.g., `R-2025-0001`)
   - Donor full name and address
   - Eligible gift amount
   - Date(s) of donation(s)
   - Statement: *"This is an official receipt for income tax purposes"*
   - Signature line (charity authorized person)
   - CRA website URL for charity info
4. Treasurer reviews → generates PDFs → emails to each donor (or bulk email)
5. Copies retained minimum 2 years (CRA requirement)
6. *In-kind shows FMV + description separately. Advantage amounts deducted automatically.*

**3.b GST/HST Rebate** — 50% back on GST paid, semi-annual or annual
1. System tracks GST/HST paid on all expense vouchers (`tax_amount` field)
2. Filing time: Reports → GST Rebate → select period
3. System totals eligible GST paid → calculates 50% rebate amount
4. Treasurer exports for Form GST66 filing
5. When rebate received, recorded as income.

**3.c T3010 Annual Return** — within 6 months of fiscal year end
1. Reports → T3010 → select fiscal year
2. System generates summary: total revenue by source, total expenditures by category
3. Treasurer exports data to fill T3010
4. *Not full automation — but data is ready and categorized.*


### 4. Donor engagement

**4.a Donor Self-Service** — donor views own history + receipts
1. Donor logs in (or receives unique link)
2. Sees: giving history, year totals, downloadable tax receipts
3. Read-only view of their own data.

**4.b Donor Board** — public recognition, opt-in
1. Public page (no login): shows donors who opted in
2. Displays name and tier (not exact amount) — e.g., "Gold Patron," "Monthly Supporter"
3. Donor opts in/out from their profile.


### 5. Auth

**5.a Invite Member** — treasurer/admin adds someone to the system
1. Admin opens People → Invite
2. Enters: name, email, role flags (member/approver/treasurer)
3. System sends invite email with one-time link
4. New user clicks link → sets password → logged in
5. Appears in member list. Can now submit vouchers.

**5.b Login** — returning user
1. User opens app.iskconmontreal.ca (bookmarked)
2. Enters email + password → JWT stored
3. Lands on role-appropriate dashboard.
4. Session persists until explicit logout or 30-day expiry.

**5.c Password Reset** — forgot credentials
1. Login screen → "Forgot password" → enters email
2. Receives reset link → sets new password → logged in.


### 6. Dashboards

**6.a Treasurer**
- Payment queue — approved vouchers awaiting payment (count + total)
- Pending approvals — vouchers awaiting others' approval (awareness)
- Month totals — donations in, expenses out, net
- Overdue pledges — recurring pledges not yet received
- Recent activity — last 10 actions across system
- One tap to enter payment queue and start paying.

**6.b Approver**
- Pending approvals — vouchers needing their review (count)
- Recent approvals — what they approved/returned recently
- One tap into approval queue.

**6.c Member**
- My vouchers — own submissions with status
- Returned — any vouchers sent back for correction
- One tap to create new voucher.

**6.d Donor** (self-service)
- Giving history — all donations by year
- Tax receipts — downloadable PDFs by year
- Read-only. No actions.


### 7. Reports

**7.a Monthly Report** — treasurer reviews month
1. Reports → Monthly → select month
2. Summary: total donations by category, total expenses by category, net
3. List of all vouchers and donations for the period
4. Export as PDF.

**7.b Annual Report** — year-end summary for board/T3010
1. Reports → Annual → select fiscal year
2. Revenue by source, expenditures by category, donor count, top categories
3. Feeds into 3.c (T3010) and board presentation.

**7.c Donor Report** — giving summary for receipting
1. Reports → Donors → select year
2. Per-donor totals, eligible amounts, receipt status (issued/not)
3. Feeds into 3.a (tax receipts).


### 8. Notifications

**8.a** How users learn something needs attention
- **Approver**: email when voucher needs approval (batched daily or immediate)
- **Treasurer**: email when voucher enters payment queue
- **Member**: email when voucher returned or paid
- **Donor**: email when tax receipt available
- **In-app**: badge counts on dashboard (approval queue: 3, payment queue: 5)
- *No push notifications — email + in-app badges only.*


### 9. Year-end

**9.a Year-End Close** — transition between fiscal years
1. Treasurer opens Settings → Year-End → select year to close
2. System verifies: all vouchers closed/rejected, all donations receipted, bank reconciled
3. If gaps: shows checklist of unresolved items
4. Once clean: year locked (read-only), new year active
5. Historical data remains accessible for reports and audits.
