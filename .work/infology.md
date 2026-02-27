## Infology — what information exists

Derived from scenarios. Conceptual, not physical.


### Entities

**User** `5.a-c`
- name, email, password_hash
- roles: `member` | `approver` | `treasurer` (flags, combinable)
- invited_by → User, date_joined

**Donor** `2.a-d, 3.a, 4.a`
- name, address, email, phone
- user_id → User (optional — linked if donor has self-service login)
- *Separate from User. Many donors give cash and never log in.*

**Voucher** `1.a-d`
- voucher_no (auto: `V-2026-0042`, sequential per year, never reused)
- type: `reimbursement` | `advance` | `direct_payment`
- status: `draft` | `submitted` | `returned` | `rejected` | `approved` | `paid` | `closed`
- amount, actual_amount (for advances — what was actually spent)
- tax_amount (GST/HST portion, feeds 3.b rebate calc)
- vendor, description
- category: `prasadam` | `deity` | `maintenance` | `utilities` | `travel` | `supplies` | `event` | `other`
- due_date (direct payment only)
- submitted_by → User
- paid_by → User
- bank_ref (for reconciliation matching)

**Approval** `1.a-c`
- voucher_id → Voucher
- approved_by → User
- action: `approve` | `return` | `reject`
- note, date
- *Separate entity. A voucher needs 0 or 2 approvals depending on amount/type.*

**Attachment** `1.a-c, 2.c`
- parent → Voucher | Donation (polymorphic)
- file_path (relative to data root, human-navigable — see datalogy.md)
- type: `receipt` | `invoice` | `payment` | `appraisal`
- *`receipt`/`invoice`: member attaches on submit. `payment`: treasurer attaches on pay (e-transfer screenshot, cheque scan). `appraisal`: in-kind FMV doc.*
- *Advance reconciliation receipts are Attachments on the advance Voucher, not child Vouchers.*

**Donation** `2.a-d`
- donor_id → Donor (nullable — anonymous aggregate from collections)
- amount
- method: `cash` | `cheque` | `e-transfer` | `card` | `in-kind`
- category: `general` | `deity` | `building_fund` | `festival` | `book_distribution`
- date_received, note
- event_name (string, nullable — e.g. "Sunday Feast 2026-02-23")
- pledge_id → Pledge (nullable — links to expected donation)
- in_kind_description, fair_market_value (when method = in-kind)
- advantage_amount (value of benefit received, deducted from eligible gift)
- *Income categories ≠ expense categories. Donations track where money comes from (general, deity, building). Vouchers track what money is spent on (prasadam, utilities, maintenance). Different taxonomies by design.*

**Pledge** `2.b`
- donor_id → Donor
- amount, frequency: `monthly` | `quarterly` | `annual`
- start_date, end_date (nullable — ongoing)
- status: `active` | `paused` | `completed`

**TaxReceipt** `3.a`
- receipt_no (sequential per year: `R-2025-0001`, never reused)
- donor_id → Donor
- fiscal_year
- eligible_amount (computed: sum of donations - sum of advantage_amounts for donor+year)
- date_issued
- pdf (generated document)
- *CRA boilerplate (charity name, address, reg no, statement, signature) comes from org settings at render time, not stored per receipt.*

**BankTransaction** `1.d`
- import_id (which upload session — needed to replace/redo imports)
- date, amount, description, reference
- voucher_id → Voucher (nullable — null means unmatched)
- donation_id → Donation (nullable — for matched donation transactions)


### Relationships

- User submits 0..n Vouchers
- User approves 0..n Vouchers (through Approval)
- User pays 0..n Vouchers
- Donor makes 0..n Donations
- Donor has 0..n Pledges
- Donor receives 0..n TaxReceipts
- Donor optionally linked to User (for self-service login)
- Pledge generates 0..n Donations (expected periodic entries)
- Voucher has 0..2 Approvals
- Voucher has 0..n Attachments (receipts, invoices)
- Voucher optionally matched to BankTransaction
- Donation has 0..n Attachments (appraisal docs for in-kind)
- Donation optionally matched to BankTransaction
- TaxReceipt covers all Donations for a Donor in a FiscalYear


### Derived (not stored)

These are queries, not entities or fields:

- **Voucher "reconciling"**: `type=advance AND status=paid AND actual_amount IS NULL`
- **Bank match status**: `voucher_id IS NOT NULL` (or `donation_id IS NOT NULL`)
- **Event total**: `SUM(amount) WHERE event_name = X`
- **Fiscal year closed**: org setting, not an entity
- **Notification "to approve"**: `vouchers WHERE status=submitted AND needs approval from current user`
- **Notification "to pay"**: `vouchers WHERE status=approved`
- **Notification "returned"**: `vouchers WHERE status=returned AND submitted_by=current user`
- **Overdue pledges**: `pledges WHERE active AND no donation received for current period`
- **Tax receipt issued for donation**: `EXISTS tax_receipt WHERE donor=D AND year=Y`


### Constraints

- Voucher amount < $100 → 0 approvals (auto-approved on submit)
- Voucher amount >= $100 → 2 approvals required before payment
- Advance vouchers → always 2 approvals regardless of amount
- Advance voucher lifecycle: draft → submitted → approved → paid → closed (only after actual_amount set + receipts attached)
- In-kind donation FMV > $1,000 → appraisal attachment required (CRA)
- TaxReceipt eligible_amount = sum(donations) - sum(advantage_amounts) for donor+year
- Fiscal year close requires: all vouchers closed/rejected, all donations receipted, bank reconciled
- TaxReceipt copies retained minimum 2 years (CRA)
- receipt_no sequential per year, never reused
- voucher_no sequential per year, never reused
- Same user cannot approve twice on same voucher
- Roles are flags — a user can hold multiple (e.g. treasurer + approver)
- Submitter cannot approve their own voucher


### Voucher Lifecycle

```
draft → submitted → approved → paid → closed
             ↘ returned (fix, resubmit → submitted)
             ↘ rejected (terminal)
```

- **draft**: editable, not yet submitted
- **submitted**: awaiting approval (or auto-approved if < $100)
- **returned**: approver sent back for correction, editable again
- **rejected**: denied, terminal
- **approved**: awaiting payment by treasurer
- **paid**: money disbursed. For advances: awaiting reconciliation. For others: awaiting bank confirmation.
- **closed**: confirmed in bank reconciliation. Terminal.
