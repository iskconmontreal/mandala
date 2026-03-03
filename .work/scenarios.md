## Scenarios

What users do. Not UI specs, not infrastructure.


### 1. Expenses

**1.a Direct Payment** — pay vendor/bill directly
1. Member or treasurer creates expense → type: direct
2. Attaches invoice, fills vendor/amount/due date/category
3. Submits → approval flow based on amount
4. Treasurer pays vendor, attaches payment proof, marks paid
5. Confirmed in bank reconciliation → closed

**1.b Advance** — money needed before purchase, reconcile after
1. Member creates expense → type: advance
2. Fills purpose, estimated amount, category
3. Submits → 2 approvals required (always, regardless of amount)
4. Treasurer disburses, attaches payment proof, marks paid
5. Member purchases, uploads receipt(s) as attachments, enters actual amount
6. Difference settled (member returns overage or receives shortfall)
7. Closed


### 2. Donations

**2.a Donation** — cash/cheque/e-transfer/card, one-time
1. Treasurer creates donation
2. Selects or creates donor, fills amount/method/category/date/note
2.1 If donor doesn't exist - it is created in place.
3. Save. Running totals update.

**2.b In-Kind Donation** — goods not cash
1. Treasurer creates donation → method: in-kind
2. Fills donor, description, fair market value, category
3. If FMV > $1,000: uploads independent appraisal (CRA requirement)
4. Receipt issued for FMV amount


### 3. Compliance

**3.a Tax Receipts** — annual, per donor, CRA-compliant
1. Treasurer selects fiscal year
2. System generates one receipt per donor: receipt_no, eligible amount, dates
3. CRA fields filled from org settings (charity name, address, reg no, statement)
4. Treasurer reviews, generates PDFs, emails to donors
5. Copies retained minimum 2 years
6. In-kind: FMV + description shown separately. Advantage amounts deducted.

**3.b GST/HST Rebate** — 50% back on GST paid
1. System totals GST/HST from expenses for selected period
2. Calculates 50% rebate amount
3. Treasurer exports for Form GST66
4. When rebate received, recorded as income

**3.c T3010 Annual Return** — within 6 months of fiscal year end
1. System generates summary: revenue by source, expenditures by category
2. Treasurer exports to fill T3010
3. Data ready and categorized, not full automation


### 4. Donor Self-Service

**4.a Donor Portal** — donor views own history + receipts
1. Donor logs in (or uses unique link)
2. Sees: giving history, year totals, downloadable tax receipts
3. Read-only


### 5. Auth

**5.a Invite** — admin adds someone
1. Admin enters name, email, role flags (member/approver/treasurer)
2. System sends invite email with one-time link
3. User sets password, logged in

**5.b Login**
1. Email + password → session
2. Role-appropriate view
3. 30-day session, explicit logout

**5.c Password Reset**
1. "Forgot password" → email → reset link → new password


### 6. Year-End

**6.a Year-End Close**
1. Treasurer selects year to close
2. System checks: all expenses closed/rejected, all donations receipted, bank reconciled
3. Gaps shown as checklist
4. Once clean: year locked (read-only), new year active
