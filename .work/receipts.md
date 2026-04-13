# Tax Receipt Implementation Plan

Per-donation CRA-compliant official receipts with authorized signature.

## Current State

**Backend has:**
- `TaxReceipt` model: `receipt_no` (TR-YYYY-NNNN), `member_id`, `donor_name`, `donor_address`, `fiscal_year`, `eligible_amount`, `date_issued`
- `IssueTaxReceipt` — calculates eligible = sum(donations) - sum(advantages) for member+year, one receipt per member per year
- `PrintTaxReceipt` — HTML page with basic receipt fields, no CRA statement, no signature, no CRA URL
- `OrgSettings` — `org_name`, `charity_bn`, `org_address`, `org_city`, `org_province`, `org_postal`, `org_logo_url`
- Member photos at `uploads/community/members/{public_id}.webp`

**Frontend has:**
- `donationReceiptHtml()` in form.js — beautiful per-donation preview with design tokens, shows "Tax-receiptable" vs "Pending official issuance" badge
- `createPrintDonation()` — iframe print, works well
- No tax receipt management UI
- No signature upload UI

**Missing for CRA compliance:**
- Statement "Official receipt for income tax purposes"
- CRA website: `canada.ca/charities-giving`
- Location where receipt was issued
- Authorized signature + name + designation
- Per-donation receipt linkage (currently per-member-per-year only)
- `income_id` on TaxReceipt (no link to specific donation)
- `issued_by` on TaxReceipt (no audit trail of who issued)

---

## Resolved Uncertainties

### 1. Migration & Index (was: High)

**Problem:** `001_initial.sql` has `CREATE UNIQUE INDEX idx_tax_receipts_member_year ON tax_receipts(member_id, fiscal_year)` — blocks per-donation receipts. Goloka uses versioned SQL migrations (`embed.FS` + `_migrations` table), NOT AutoMigrate.

**Decision:** One table, new migration `002_per_donation_receipts.sql`.

```sql
-- 002_per_donation_receipts.sql

-- Drop the annual-only unique index
DROP INDEX IF EXISTS idx_tax_receipts_member_year;

-- New columns for per-donation issuance
ALTER TABLE tax_receipts ADD COLUMN income_id INTEGER DEFAULT 0;
ALTER TABLE tax_receipts ADD COLUMN issued_by INTEGER DEFAULT 0;
ALTER TABLE tax_receipts ADD COLUMN location_issued TEXT DEFAULT '';
ALTER TABLE tax_receipts ADD COLUMN date_gift_received DATETIME;
ALTER TABLE tax_receipts ADD COLUMN amount_gift INTEGER DEFAULT 0;
ALTER TABLE tax_receipts ADD COLUMN advantage_amount INTEGER DEFAULT 0;
ALTER TABLE tax_receipts ADD COLUMN advantage_description TEXT DEFAULT '';

-- Per-donation: one receipt per donation (income_id > 0 means per-donation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_receipts_income
  ON tax_receipts(income_id) WHERE income_id > 0;

-- Annual: one receipt per member per year (income_id = 0 means annual batch)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_receipts_annual
  ON tax_receipts(member_id, fiscal_year) WHERE income_id = 0;

-- Lookup: all receipts for a member
CREATE INDEX IF NOT EXISTS idx_tax_receipts_member
  ON tax_receipts(member_id);
```

**Why one table:** Per-donation and annual receipts share the same CRA schema — same required fields, same receipt_no series, same print template. Two tables would force duplicated columns, handlers, and print logic for zero semantic difference. The `income_id = 0` convention cleanly separates annual from per-donation, and partial unique indexes enforce both invariants. Annual mode (Phase 2b) stays intact, per-donation mode is unlocked.

**Why store amount_gift, advantage_amount, advantage_description:** CRA requires these on the receipt at issuance time. The income record's Details JSON can be edited later. Receipts must be immutable snapshots — store the values as they were at issuance, not as live references.

### 2. Org Settings (was: High)

**Problem:** `settings.go` has a whitelist (`allowedOrgKeys`) and a typed response struct (`OrgSettingsResponse`). New keys require backend changes.

**Decision:** Extend the whitelist, response struct, and handler in Goloka. The changes are mechanical:

```go
// Add to allowedOrgKeys:
"receipt_signatory_name":  true,
"receipt_signatory_title": true,
"receipt_signatory_id":    true,  // member public_id for signature image
"receipt_location":        true,

// Add to OrgSettingsResponse:
ReceiptSignatoryName  string `json:"receipt_signatory_name"`
ReceiptSignatoryTitle string `json:"receipt_signatory_title"`
ReceiptSignatoryID    string `json:"receipt_signatory_id"`
ReceiptLocation       string `json:"receipt_location"`

// Add to orgSettingsResponseFromMap defaults:
// receipt_location defaults to org_city + ", " + org_province if empty
```

**Frontend impact:** `app/organization/index.html` needs a "Receipt Signatory" section — name, title, member selector, location field. The `RECEIPT_FIELDS` array gets `receipt_signatory_name` added, and `receiptReady` gets `receipt_location` check. Nav tests need updating for the new readiness fields.

### 3. Frontend/Backend Receipt Linkage (was: High)

**Problem:** Income responses have no receipt data. Frontend can't show "receipt issued" badge or know if a receipt exists. `api.js` rejects non-JSON responses, so `GET .../print` (returns HTML) would fail through the normal API helper.

**Decision — three parts:**

**a) Receipt status on income:** Add `tax_receipt_id` and `tax_receipt_no` transient fields to the Income model, hydrated by a LEFT JOIN or subquery when income is fetched. The backend handler already hydrates transient fields via `AfterFind()` — add receipt lookup there.

```go
// In Income model (transient):
TaxReceiptID *uint   `gorm:"-" json:"tax_receipt_id,omitempty"`
TaxReceiptNo string  `gorm:"-" json:"tax_receipt_no,omitempty"`

// In GetIncome / GetIncomeByID handler, after fetching incomes:
// SELECT income_id, id, receipt_no FROM tax_receipts WHERE income_id IN (...)
// Map onto income records
```

**b) Print HTML fetch:** Add a `rawFetch(path)` or `fetchHtml(path)` helper to `api.js` that returns `response.text()` instead of parsing JSON. Alternatively, `printHtml()` already sets iframe `.srcdoc` — so the frontend can just set `iframe.src = apiBase + '/api/tax-receipts/' + id + '/print'` directly (the browser fetches HTML natively, no JS fetch needed). This is the simpler path — no api.js change needed.

**c) Email resend:** `notifyTaxReceiptIssued()` already fires on issuance. For resend, add `POST /api/tax-receipts/:id/resend` — calls same notification function. Issue and send stay coupled by default (issue always notifies), resend is separate action. Frontend shows "Resend Email" button on issued receipts.

### 4. CRA Compliance (was: High)

**Problem:** Layout missing "date gift received" and explicit advantage breakdown per CRA samples.

**Decision:** Store and display ALL CRA-required fields. Per CRA sample receipts (canada.ca/charities-giving), a cash gift with advantage requires:

| CRA Field | Source | Stored On Receipt |
|-----------|--------|-------------------|
| Charity name (as on file with CRA) | org_settings.org_name | — (fetched at print) |
| Charity address | org_settings full address | — (fetched at print) |
| Registration No. (BN) | org_settings.charity_bn | — (fetched at print) |
| "Official receipt for income tax purposes" | Static text | — |
| Receipt serial number | receipt_no (TR-YYYY-NNNN) | receipt_no |
| Date receipt issued | When issued | date_issued |
| Date gift received | income.date_received | **date_gift_received** (new) |
| Location receipt issued | org_settings.receipt_location | location_issued |
| Donor name | member name | donor_name |
| Donor address | member address | donor_address |
| Amount of gift | income.amount | **amount_gift** (new, cents) |
| Eligible amount of gift | amount - advantage | eligible_amount |
| Amount of advantage | income.advantage_amount | **advantage_amount** (new, cents) |
| Description of advantage | income.details | **advantage_description** (new) |
| Authorized signature | signatory image | embedded at print |
| CRA name + website | Static: canada.ca/charities-giving | — |

**For cash gifts:** CRA allows year-only for "date gift received." We store full date but can format as year-only on the receipt if preferred.

**Advantage display:** When advantage_amount > 0, receipt shows:
```
Amount of gift:              $600.00
Amount of advantage:         $100.00  (Meal at fundraising dinner)
Eligible amount of gift:     $500.00
```
When advantage_amount = 0, only shows:
```
Eligible amount of gift:     $500.00
```

**Updated receipt layout:**

```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  ISKCON Montreal                                  │
│  1626 Bd Pie-IX, Montréal, QC H1V 2C5                    │
│  Registration No: 889862893 RR 0001                       │
│                                                           │
│  Official Receipt for Income Tax Purposes                 │
├───────────────────────────────────────────────────────────┤
│  Receipt No:           TR-2026-0042                        │
│  Date Receipt Issued:  April 12, 2026                      │
│  Location Issued:      Montréal, QC                        │
│  Date Gift Received:   2026                                │
├───────────────────────────────────────────────────────────┤
│  Donor:                Bhakta Das                           │
│  Address:              123 Main St, Montreal QC H1V 2C5    │
├───────────────────────────────────────────────────────────┤
│  Amount of gift:           $600.00                          │
│  Amount of advantage:      $100.00  (Meal)                  │
│  Eligible amount of gift:  $500.00                          │
│  (or just "Eligible amount: $500.00" if no advantage)       │
├───────────────────────────────────────────────────────────┤
│  [Signature Image]                                         │
│  John Doe, Treasurer                                       │
├───────────────────────────────────────────────────────────┤
│  Canada Revenue Agency — canada.ca/charities-giving        │
└───────────────────────────────────────────────────────────┘
```

### 5. Signature Security (was: Medium)

**Problem:** `uploads/community/...` is served without auth (`ServeUpload` has a TODO comment about restoring auth). Signatures stored there are publicly fetchable.

**Decision:** Signatures stay private — **do not store in `uploads/community/`**. Instead:

- Store at `uploads/private/signatures/{public_id}.webp`
- `ServeUpload` already blocks paths with `..` and resolves to `uploads/` root — add a check: paths starting with `private/` require authentication (check JWT from `Authorization` header or return 401)
- The print/PDF handler embeds the signature as a base64 data URI directly into the HTML/PDF — so the image is never exposed as a separate URL to the browser
- The org settings upload preview uses a dedicated `GET /api/members/:id/signature` endpoint that checks auth

This means: signature image is **never publicly addressable**. Only embedded server-side.

---

## Phase 1 — Backend: Migration + Model + Settings

### 1a. New migration: `002_per_donation_receipts.sql`

See resolved uncertainty #1 above. File goes in `internal/migrate/finance/`.

### 1b. Extend TaxReceipt model

```go
// tax_receipt.go — add fields
IncomeID              uint      `json:"income_id"`
IssuedBy              uint      `json:"issued_by"`
LocationIssued        string    `json:"location_issued"`
DateGiftReceived      time.Time `json:"date_gift_received"`
AmountGift            uint32    `json:"amount_gift"`              // cents
AdvantageAmount       uint32    `json:"advantage_amount"`         // cents
AdvantageDescription  string    `json:"advantage_description"`
```

### 1c. Extend org settings whitelist + response

See resolved uncertainty #2 above.

### 1d. Signature upload endpoint

`POST /api/members/:id/signature` — same pattern as `processMemberPhoto`.
Store at `uploads/private/signatures/{public_id}.webp`.
Permission: self or admin.
Returns `{ "ok": true }` (no URL — signatures are never directly served).

Add `GET /api/members/:id/signature` — returns image bytes with auth check (for org settings preview only).

---

## Phase 2 — Backend: Per-Donation Receipt Issuance

### 2a. Extend `POST /api/tax-receipts`

New request shape (backward compatible):

```go
type taxReceiptRequest struct {
    MemberID       uint    `json:"member_id" binding:"required"`
    FiscalYear     int     `json:"fiscal_year" binding:"required"`
    IncomeID       *uint   `json:"income_id"`                    // new: if set, per-donation mode
    EligibleAmount *uint32 `json:"eligible_amount"`              // optional override
}
```

When `income_id` is provided:
- Load income, validate type=donation, not archived, member matches
- eligible = amount - advantage_amount (from income record)
- Store: income_id, amount_gift, advantage_amount, advantage_description, date_gift_received (all from income)
- Duplicate check: existing receipt with this income_id

When `income_id` is nil:
- Existing annual mode (sum all donations for member+year)
- Duplicate check: existing receipt with member_id + fiscal_year + income_id=0

Both modes: fill `issued_by` from JWT `user_id`, `location_issued` from org settings.

### 2b. Resend endpoint

`POST /api/tax-receipts/:id/resend` — calls `notifyTaxReceiptIssued()` again. Rate limit: 1 per minute per receipt.

### 2c. Receipt status on income responses

Hydrate `tax_receipt_id` + `tax_receipt_no` on income records. See uncertainty #3a.

---

## Phase 3 — Backend: CRA-Compliant Receipt HTML/PDF

### 3a. Rewrite PrintTaxReceipt HTML

See updated layout in uncertainty #4. All CRA fields present. Signature embedded as base64 data URI (read from `uploads/private/signatures/`).

### 3b. PDF generation for email

Add `GenerateTaxReceiptPDF()` using fpdf — same fields as HTML, signature embedded. Attach to notification email.

### 3c. Update notification email + mailer interface

`SendTaxReceiptIssued` gains a `pdfBytes []byte` parameter. Sends multipart MIME with PDF attachment (same pattern as `SendDonationRecorded`).

---

## Phase 4 — Frontend: Issue Receipt from Donation

### 4a. "Issue Receipt" button on income rows

In `income-list.html` action area:
- Show "Issue Receipt" icon-button if: `d.type === 'donation' && d.member_id && !d.tax_receipt_id`
- Emits `issuereceipt` event with donation data
- Finance page handles: `POST /api/tax-receipts { income_id, member_id, fiscal_year }`
- On success: refresh income to show updated `tax_receipt_no`

### 4b. Receipt badge on donation rows

When `d.tax_receipt_no` is present, show small badge: `TR-2026-0042` (green, subtle).

### 4c. Print receipt from frontend

Set `iframe.src = apiBase + '/api/tax-receipts/' + id + '/print'` — browser fetches HTML directly (Authorization header via query param token or session). No `api.js` change needed.

Alternative if auth is tricky: `fetch()` with raw text response → `iframe.srcdoc`. Add `api.fetchHtml(path)` that returns `response.text()`.

---

## Phase 5 — Frontend: Signature + Signatory Settings

### 5a. Organization settings page — signatory section

Below existing org fields in `app/organization/index.html`:
- "Tax Receipt Signatory" section header
- Member autocomplete → sets `receipt_signatory_id`
- Auto-fills `receipt_signatory_name` from member, editable
- `receipt_signatory_title` text field
- `receipt_location` text field (default: org_city + ", " + org_province)
- Signature image upload (drag/drop or file picker) → `POST /api/members/:id/signature`
- Preview of signature from `GET /api/members/:id/signature`
- Add to `RECEIPT_FIELDS`: `receipt_signatory_name`, `receipt_location`
- Update nav tests for new readiness fields

### 5b. Profile page — personal signature upload

Optional. Deferred — not needed for v1. Admins upload via org settings.

---

## Phase 6 — Frontend: Tax Receipt Management

### 6a. Receipts list in Reports tab

Add "Tax Receipts" sub-section to Reports tab in `app/finance/index.html`:
- Table: receipt_no, donor, eligible amount, fiscal year, date issued
- Filter by fiscal year
- Actions: Print, Resend Email
- Uses `GET /api/tax-receipts?fiscal_year=2026`

### 6b. Bulk annual receipt (future, not v1)

---

## File Changes Summary

### Goloka (backend)
| File | Change |
|------|--------|
| `internal/migrate/finance/002_per_donation_receipts.sql` | **New.** Schema migration: new columns, index redesign |
| `internal/models/tax_receipt.go` | Add `IncomeID`, `IssuedBy`, `LocationIssued`, `DateGiftReceived`, `AmountGift`, `AdvantageAmount`, `AdvantageDescription` |
| `internal/handlers/tax_receipt.go` | Per-donation mode, fill all CRA fields, CRA-compliant HTML, resend endpoint |
| `internal/handlers/income.go` | Hydrate `TaxReceiptID`, `TaxReceiptNo` on income responses |
| `internal/models/finance.go` | Add `TaxReceiptID`, `TaxReceiptNo` transient fields to Income |
| `internal/handlers/settings.go` | Add 4 keys to whitelist + response struct |
| `internal/handlers/member.go` | `processMemberSignature()`, `GET /api/members/:id/signature` with auth |
| `internal/handlers/handlers.go` | `ServeUpload`: block `private/` prefix without auth |
| `internal/routes/routes.go` | `POST /api/members/:id/signature`, `GET /api/members/:id/signature`, `POST /api/tax-receipts/:id/resend` |
| `internal/mailer/mailer.go` | PDF attachment on `SendTaxReceiptIssued`, `GenerateTaxReceiptPDF()` |

### Mandir (frontend)
| File | Change |
|------|--------|
| `_includes/components/income-list.html` | "Issue Receipt" button, receipt badge |
| `app/organization/index.html` | Signatory section (name, title, member selector, location, signature upload) |
| `app/finance/index.html` | Tax receipts table in Reports tab |
| `lib/api.js` | `issueTaxReceipt()`, `resendTaxReceipt()`, `uploadSignature()`, optionally `fetchHtml()` |
| `tests/nav.spec.js` | Update readiness fields |

---

## Execution Order

1. **Phase 1a** — Migration `002_per_donation_receipts.sql`
2. **Phase 1b+1c** — Model fields + settings whitelist
3. **Phase 2a** — Per-donation issuance (extend POST /api/tax-receipts)
4. **Phase 2c** — Receipt status on income responses
5. **Phase 3a** — CRA-compliant HTML template
6. **Phase 4a+4b** — Issue button + badge on frontend
7. **Phase 4c** — Print from frontend
8. **Phase 1d** — Signature upload endpoint + private storage
9. **Phase 5a** — Org settings signatory UI
10. **Phase 3b+3c** — PDF generation + email attachment
11. **Phase 2b** — Resend endpoint
12. **Phase 6a** — Receipt list in Reports