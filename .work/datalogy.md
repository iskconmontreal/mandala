## Datalogy — physical data conventions

How data is stored on disk. Human-navigable without the app.


### Directory Structure

Root: `data/<tenant>/`

```
data/
  iskcon-montreal/
    settings.db                          # org config, fiscal year flags
    members.db                           # User, Donor, Pledge
    2026/
      finance.db                         # Voucher, Approval, Attachment,
                                         # Donation, TaxReceipt, BankTransaction
      expense/
        V-0042-costco-prasadam-receipt.webp
        V-0042-costco-prasadam-payment.webp
        V-0043-festival-supplies-receipt-1.webp
        V-0043-festival-supplies-receipt-2.webp
        V-0039-hydro-quebec-utilities-invoice.pdf
        V-0039-hydro-quebec-utilities-payment.webp
      donation/
        arjuna-das-2026-02-26-in-kind-appraisal.pdf
      tax-receipt/
        R-2026-0001-arjuna-das.pdf
        R-2026-0002-bhakta-tom.pdf
      bank/
        desjardins-2026-02.csv
        td-2026-02.csv
    2025/
      finance.db                         # read-only after year-end close
      expense/
      donation/
      tax-receipt/
      bank/
```


### Databases

Three SQLite files per tenant:

| DB            | Contains                                      | Lifecycle           |
|---------------|-----------------------------------------------|---------------------|
| settings.db   | Org config (name, address, CRA reg no, etc.), fiscal year flags | Persistent, rarely changes |
| members.db    | User, Donor, Pledge                           | Persistent, cross-year |
| `<year>/finance.db` | Voucher, Approval, Attachment, Donation, TaxReceipt, BankTransaction | One per year. Read-only after year-end close. |

Why this split:
- **settings.db** — config that changes almost never. Separate from member data that changes regularly.
- **members.db** — donors and users span years. A donor created in 2024 donates in 2026. Pledges generate expected donations across years.
- **finance.db per year** — all financial transactions are year-scoped. Year-end close locks the file. Backup = copy folder. Archive = zip old years. No cross-year joins needed.

Cross-DB lookups: finance.db stores `donor_id`, `submitted_by` (user_id), etc. as integer foreign keys. App resolves names from members.db. Two simple queries, not a join.

Multi-tenant: one directory per tenant. Zero code changes — just a path prefix.


### File Naming

#### Expense attachments

`<voucher_no>-<vendor>-<category>-<type>[-n].<ext>`

- voucher_no: `V-0042` (lowercased from Voucher.voucher_no)
- vendor: slugified (`hydro-quebec`, `costco`)
- category: from voucher (`prasadam`, `utilities`)
- type: `receipt` | `invoice` | `payment`
- n: counter when multiple (advance with several receipts)
- ext: `webp` for photos, `pdf` for documents

#### Donation attachments

`<donor>-<date>-<detail>.<ext>`

- donor: slugified (`arjuna-das`)
- date: ISO date of donation
- detail: `in-kind-appraisal`

#### Tax receipts

`<receipt_no>-<donor>.pdf`

#### Bank imports

`<bank>-<year>-<month>.csv`


### Image Format

All photos stored as **webp** — good compression, universal support.
Camera captures converted on upload.


### Attachment Types

| Type      | On Entity | When Created        | What It Is                    |
|-----------|-----------|---------------------|-------------------------------|
| receipt   | Voucher   | Member submits      | Proof of purchase             |
| invoice   | Voucher   | Member submits      | Vendor bill (direct payment)  |
| payment   | Voucher   | Treasurer pays      | Proof of payment (e-transfer screenshot, cheque scan) |
| appraisal | Donation  | In-kind entry       | Independent FMV appraisal (CRA, if FMV > $1,000) |


### Why No Status in Filenames

Status is mutable — a voucher moves through draft → submitted → approved → paid → closed. The file doesn't change when the voucher changes. The attachment **type** already implies the relevant state:
- `receipt` / `invoice` → exists from submission
- `payment` → exists from payment

Query the database for state, not the filesystem. The filesystem stores evidence.
