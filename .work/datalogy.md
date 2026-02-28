## Datalogy — physical data conventions

How data is stored on disk. Human-navigable without the app.


### Directory Structure

Root: `storage/<tenant>/`

```
storage/
  montreal/
    app.db            ← users, donors, members, roles (shared identity)
    finance.db        ← expenses, donations, tax receipts, bank txns
    library.db        ← book lending, inventory
    website.db        ← content, pages, events

uploads/
  iskcon-montreal/
    2026/
      expense/
        E-0042-costco-prasadam-receipt.webp
        E-0042-costco-prasadam-payment.webp
        E-0043-festival-supplies-receipt-1.webp
        E-0043-festival-supplies-receipt-2.webp
        E-0039-hydro-quebec-utilities-invoice.pdf
        E-0039-hydro-quebec-utilities-payment.webp
      donation/
        arjuna-das-2026-02-26-in-kind-appraisal.pdf
      tax-receipt/
        R-2026-0001-arjuna-das.pdf
        R-2026-0002-bhakta-tom.pdf
      bank/
        desjardins-2026-02.csv
        td-2026-02.csv
    2025/
      expense/
      donation/
      tax-receipt/
      bank/
```


### File Naming

#### Expense attachments

`<expense_no>-<vendor>-<category>-<type>[-n].<ext>`

- expense_no: `E-0042` (lowercased from Expense.expense_no)
- vendor: slugified (`hydro-quebec`, `costco`)
- category: from expense (`prasadam`, `utilities`)
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
| receipt   | Expense   | Member submits      | Proof of purchase             |
| invoice   | Expense   | Member submits      | Vendor bill (direct payment)  |
| payment   | Expense   | Treasurer pays      | Proof of payment (e-transfer screenshot, cheque scan) |
| appraisal | Donation  | In-kind entry       | Independent FMV appraisal (CRA, if FMV > $1,000) |


### Why No Status in Filenames

Status is mutable — an expense moves through draft → submitted → approved → paid → closed. The file doesn't change when the expense changes. The attachment **type** already implies the relevant state:
- `receipt` / `invoice` → exists from submission
- `payment` → exists from payment

Query the database for state, not the filesystem. The filesystem stores evidence.


## Managing multiple connections in GORM

With GORM, you manage multiple connections — not ATTACH. Each database gets its own *gorm.DB instance.


montrealApp := openDB("montreal/app.db")
montrealFinance := openDB("montreal/finance-2025.db")
ottawaApp := openDB("ottawa/app.db")

// Query whichever you need
montrealFinance.Find(&transactions)
ottawaApp.Find(&users)
Cross-database joins won't work this way. If you need that, use ATTACH via raw SQL on a single connection:


db := openDB("montreal/app.db")
db.Exec("ATTACH DATABASE 'montreal/finance-2025.db' AS finance")

db.Raw("SELECT u.name, t.amount FROM users u JOIN finance.transactions t ON u.id = t.user_id").Scan(&results)
