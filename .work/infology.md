## Infology — what information exists

Derived from scenarios. Conceptual, not physical.


### Entities

**User** `5.a-c, 6.a-c`
- name, email, password_hash
- roles: `member` | `approver` | `treasurer` (flags, combinable)
- invited_by → User, date_joined

**Donor** `2.a-d, 3.a, 4.a-b`
- name (full, with middle initial), address, email, phone
- board_opt_in
- user_id → User (optional — linked if donor has self-service account)
- *Separate from User. Many donors give cash and never log in.*

**Voucher** `1.a-f`
- voucher_no (auto: `V-2026-0042`)
- type: `reimbursement` | `advance` | `direct_payment`
- status: `draft` | `submitted` | `returned` | `rejected` | `approved` | `paid` | `reconciling` | `closed`
- amount, actual_amount (advance reconciliation)
- tax_amount (GST/HST portion)
- category: `prasadam` | `deity` | `maintenance` | `utilities` | `travel` | `supplies` | `event` | `other`
- description, vendor, due_date (direct payment only)
- payment_method: `e-transfer` | `cash` | `cheque` | `card`
- bank_ref (reconciliation matching)
- batch_id (optional grouping)
- advance_id → Voucher (links receipt back to advance)
- submitted_by → User
- paid_by → User

**Approval** `1.b, 1.c, 1.d`
- voucher_id → Voucher
- approved_by → User
- action: `approve` | `return` | `reject`
- note, date
- *Separate entity, not a field. A voucher may need 0–2 approvals.*

**Attachment** `1.a, 1.d, 2.c`
- parent → Voucher | Donation
- file (photo/scan/PDF)
- type: `receipt` | `invoice` | `appraisal`

**Donation** `2.a-d`
- donor_id → Donor (nullable for anonymous)
- amount
- method: `cash` | `cheque` | `e-transfer` | `card` | `in-kind`
- category: `general` | `deity` | `building_fund` | `festival` | `book_distribution`
- date_received, note
- event_id → Event (optional)
- pledge_id → Pledge (optional)
- in_kind_description, fair_market_value (for in-kind)
- advantage_amount (value of benefit received)
- receipt_no (once tax receipt issued)

**Pledge** `2.b`
- donor_id → Donor
- amount, frequency: `monthly` | `quarterly` | `annual`
- start_date, end_date (nullable — ongoing)
- status: `active` | `paused` | `completed`

**Event** `2.d`
- name, date
- total_collected

**TaxReceipt** `3.a`
- receipt_no (sequential: `R-2025-0001`)
- donor_id → Donor
- fiscal_year
- eligible_amount (total donations minus advantage amounts)
- date_issued
- CRA fields: charity name, address, registration_no, statement, signature
- pdf (generated document)

**BankTransaction** `1.f`
- import_id (which upload session)
- date, amount, description, reference
- match_status: `matched` | `unmatched`
- voucher_id → Voucher (if matched)

**FiscalYear** `9.a`
- year
- status: `open` | `closed`
- date_closed

**Notification** `8.a`
- recipient → User | Donor
- type: `approval_needed` | `payment_ready` | `voucher_returned` | `voucher_paid` | `receipt_available`
- reference → Voucher | TaxReceipt
- channel: `email` | `in_app`
- read, date_sent


### Relationships

- User submits 0..n Vouchers
- User approves 0..n Vouchers (through Approval)
- User pays 0..n Vouchers
- Donor makes 0..n Donations
- Donor has 0..n Pledges
- Donor receives 0..n TaxReceipts
- Donor optionally linked to User (for self-service login)
- Pledge generates 0..n Donations (expected monthly entries)
- Event contains 0..n Donations
- Voucher has 0..2 Approvals
- Voucher has 0..n Attachments
- Voucher (advance) links to 0..n Vouchers (reconciliation receipts via advance_id)
- Voucher optionally matched to BankTransaction
- Donation has 0..n Attachments (appraisal docs)
- TaxReceipt covers all Donations for a Donor in a FiscalYear


### Constraints

- Voucher amount < $100 → auto-approved (0 approvals required)
- Voucher amount >= $100 → 2 approvals required before payment
- Advance voucher → must reach `reconciling` after `paid`, `closed` only after receipts uploaded
- In-kind donation FMV > $1,000 → appraisal attachment required
- TaxReceipt eligible_amount = sum(donations) - sum(advantage_amounts) for donor+year
- FiscalYear close requires: all vouchers closed/rejected, all donations receipted, bank reconciled
- TaxReceipt copies retained minimum 2 years
- receipt_no sequential per year, never reused
- voucher_no sequential, never reused
- Same user cannot approve twice on same voucher
- Roles are flags — a user can hold multiple (`treasurer` + `approver`)
