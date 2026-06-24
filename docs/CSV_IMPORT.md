# 📥 WealthOS Infinity — CSV Import Guide

This document covers the CSV import feature, supported formats, and examples for each entity type.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Import Workflow](#import-workflow)
- [Supported Entities](#supported-entities)
- [Smart Parsing Features](#smart-parsing-features)
- [CSV Formats](#csv-formats)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

WealthOS Infinity supports bulk CSV import for 5 entity types:
- **Assets** — stocks, MFs, gold, real estate, etc.
- **Liabilities** — home/auto/personal loans, credit cards
- **Income** — salary, freelance, dividends, etc.
- **Expenses** — housing, food, transport, etc.
- **Goals** — retirement, education, house, etc.

Each importer provides:
1. A downloadable template with correct headers + sample rows
2. Smart column matching (fuzzy headers)
3. Per-row validation with clear error messages
4. Preview before committing (total/valid/error counts)

---

## Import Workflow

### 3-Step Process

```
1. Download Template → 2. Upload CSV → 3. Preview & Confirm
```

### Step 1: Download Template

Click the **"Import CSV"** button (next to "Add" in any of the 5 modules). The import dialog opens. Click **"Template"** to download a CSV with:
- Correct column headers
- 3-5 sample rows showing the expected format

### Step 2: Fill & Upload

Open the template in Excel/Google Sheets/any text editor. Fill in your data. Save as CSV. Click the upload area to select your file.

### Step 3: Preview & Confirm

The dialog shows:
- **Total Rows** — how many data rows were found
- **Valid** — how many passed validation
- **Errors** — how many had issues (with specific error messages)
- A green confirmation card: "Ready to import N items"

Click **"Import N items"** to add all valid rows to your profile.

---

## Supported Entities

| Entity | Module Location | Import Button |
|--------|-----------------|---------------|
| Assets | Net Worth / Assets | "Import CSV" next to "Add Asset" |
| Liabilities | Liabilities | "Import CSV" next to "Add Liability" |
| Income | Cash Flow | "Import" next to "Add" (Income section) |
| Expenses | Cash Flow | "Import" next to "Add" (Expense section) |
| Goals | Goals | "Import CSV" next to "Add Goal" |

---

## Smart Parsing Features

### Fuzzy Column Matching

The importer accepts multiple header names for the same field:

| Canonical Field | Accepted Headers |
|-----------------|------------------|
| Name | `name`, `asset_name`, `holding`, `instrument` |
| Category | `category`, `type`, `asset_class` |
| Current Value | `current_value`, `current`, `value`, `market_value` |
| Invested Value | `invested_value`, `invested`, `cost`, `cost_basis`, `purchase_price` |
| Amount | `amount`, `value` |
| Frequency | `frequency`, `freq`, `period` |
| Target Date | `target_date`, `date`, `deadline` |

### Currency-Agnostic Numbers

All number fields accept:
- `540000` (plain)
- `₹5,40,000` (Indian format with symbol)
- `$5,400.00` (US format)
- `5 400 000` (European spaces)

The parser strips currency symbols, commas, and spaces automatically.

### Date Formats

- `2024-12-31` (ISO format, preferred)
- `31/12/2024` (DD/MM/YYYY, Indian format)
- `12/31/2024` (MM/DD/YYYY — treated as DD/MM)

### Category Normalization

Categories are fuzzy-matched:

| User Input | Maps To |
|-----------|---------|
| `mutual_funds`, `mutualfund`, `mf`, `mutual_fund` | `mutual_funds` |
| `stocks`, `stock`, `equity`, `shares` | `stocks` |
| `real_estate`, `realestate`, `property`, `apartment`, `house` | `real_estate` |
| `home_loan`, `homeloan`, `home`, `mortgage` | `home_loan` |
| `salary` | `salary` |
| `housing`, `rent`, `home`, `maintenance` | `housing` |

### Frequency Normalization

| User Input | Maps To |
|-----------|---------|
| `daily`, `day`, `per day`, `/day`, `d` | `daily` |
| `weekly`, `week`, `per week`, `/week`, `wk`, `w` | `weekly` |
| `monthly`, `month`, `per month`, `/month`, `mo`, `m` | `monthly` |
| `yearly`, `year`, `annual`, `annually`, `per year`, `/year`, `yr`, `y` | `yearly` |
| `custom`, `interval` | `custom` (requires `custom_days` column) |

---

## CSV Formats

### Assets Template

```csv
name,category,current_value,invested_value,expected_return,liquidity,notes
HDFC Mid Cap,mutual_funds,540000,410000,18.4,high,SIP ongoing
Reliance Industries,stocks,420000,320000,14,high,
PPF Account,ppf,890000,700000,7.1,low,15-year lock-in
3BHK Apartment,real_estate,9500000,7500000,7,illiquid,Pune
```

**Required**: `name`, `current_value`
**Optional**: `category` (defaults to `other`), `invested_value` (defaults to current), `expected_return` (defaults to 10), `liquidity` (defaults to medium), `notes`

**Categories** (20): cash, mutual_funds, stocks, etf, bonds, ppf, epf, nps, gold, silver, crypto, real_estate, land, vehicles, business, private_equity, esop, rsu, foreign, collectibles

**Liquidity**: high, medium, low, illiquid

---

### Liabilities Template

```csv
name,type,outstanding,original_principal,interest_rate,emi,tenure_months,start_date,notes
Home Loan - HDFC,home_loan,3800000,5500000,8.4,48500,168,2019-06-15,Pune apartment
Auto Loan,auto_loan,420000,900000,9.2,12500,36,2022-03-10,
Credit Card,credit_card,85000,85000,36,12000,8,2024-01-01,
```

**Required**: `name`, `outstanding`
**Optional**: `type` (defaults to `other`), `original_principal` (defaults to outstanding), `interest_rate` (defaults to 0), `emi` (defaults to 0), `tenure_months` (defaults to 0), `start_date` (defaults to today), `notes`

**Types** (8): home_loan, education_loan, personal_loan, business_loan, credit_card, mortgage, auto_loan, other

---

### Income Template

```csv
label,source_type,amount,frequency,custom_days,active
Primary Salary,salary,280000,monthly,,true
Annual Bonus,bonus,300000,yearly,,true
Consulting,freelance,45000,monthly,,true
Dividends,dividend,8000,monthly,,true
Rental Income,rental,22000,monthly,,true
Newspaper Delivery,other,500,custom,7,true
```

**Required**: `label`, `amount`
**Optional**: `source_type` (defaults to `other`), `frequency` (defaults to `monthly`), `custom_days` (required if frequency=custom), `active` (defaults to true)

**Source types** (9): salary, bonus, dividend, rental, interest, business, freelance, capital_gains, other

**Frequencies** (5): daily, weekly, monthly, yearly, custom

---

### Expenses Template

```csv
label,category,amount,frequency,custom_days,essential
Rent,housing,18000,monthly,,true
Groceries,food,28000,monthly,,true
Fuel,transport,12000,monthly,,true
Newspaper,lifestyle,30,custom,7,false
Insurance Premiums,insurance,102000,yearly,,true
```

**Required**: `label`, `amount`
**Optional**: `category` (defaults to `other`), `frequency` (defaults to `monthly`), `custom_days` (required if frequency=custom), `essential` (defaults to false)

**Categories** (11): housing, food, transport, utilities, healthcare, education, lifestyle, discretionary, insurance, taxes, other

**Essential values**: `true`/`false`, `yes`/`no`, `y`/`n`, `1`/`0`, `essential`/`discretionary`

---

### Goals Template

```csv
name,type,target_amount,current_amount,monthly_contribution,target_date,expected_return,priority
Retirement Corpus,retirement,120000000,8800000,85000,2048-12-31,12,critical
Child Education,education,50000000,2100000,35000,2040-06-30,12,high
Second Home,house,25000000,3500000,50000,2030-12-31,10,medium
Dream Vacation,vacation,1500000,450000,15000,2026-12-31,8,low
```

**Required**: `name`, `target_amount`
**Optional**: `type` (defaults to `other`), `current_amount` (defaults to 0), `monthly_contribution` (defaults to 0), `target_date` (defaults to today), `expected_return` (defaults to 10), `priority` (defaults to medium)

**Types** (10): retirement, house, vehicle, marriage, education, vacation, business, emergency_fund, financial_freedom, other

**Priorities**: low, medium, high, critical

---

## Examples

### Example 1: Import Mutual Fund Portfolio

You have 10 mutual funds in your portfolio. Instead of adding them one by one:

1. Go to **Net Worth** → click **"Import CSV"** → download template
2. Open in Excel, replace sample rows with your funds:
   ```csv
   name,category,current_value,invested_value,expected_return,liquidity
   Parag Parikh Flexi Cap,mutual_funds,1850000,1400000,15.5,high
   Mirae Asset Large Cap,mutual_funds,920000,780000,13.2,high
   Nippon India Small Cap,mutual_funds,670000,480000,22.8,high
   # ... 7 more rows
   ```
3. Save as CSV, upload, preview, import
4. All 10 funds appear in your Holdings table instantly

### Example 2: Import Annual Expenses with Mixed Frequencies

You track expenses monthly, but some are yearly (insurance) or weekly (maid):

```csv
label,category,amount,frequency,essential
Rent,housing,18000,monthly,true
Groceries,food,28000,monthly,true
Maid,other,2000,weekly,true
Insurance,insurance,102000,yearly,true
Property Tax,taxes,45000,yearly,true
```

After import, the Cash Flow view shows:
- Rent: ₹18,000 /mo (₹18K/mo)
- Groceries: ₹28,000 /mo (₹28K/mo)
- Maid: ₹2,000 /wk → ₹8.7K /mo
- Insurance: ₹1,02,000 /yr → ₹8.5K /mo
- Property Tax: ₹45,000 /yr → ₹3.75K /mo

Total monthly expenses auto-calculated correctly.

---

## Troubleshooting

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Row N: missing asset name" | Name column is empty | Fill in the name for that row |
| "Row N: missing/zero current value" | Current value is 0 or missing | Enter a non-zero number |
| "CSV is empty" | File has no data rows | Add at least one data row |
| "Incorrect PIN or corrupted file" | Wrong PIN for backup restore | Use the correct PIN |

### Tips

1. **Use the template** — don't create CSV from scratch; download the template first
2. **Check for hidden characters** — copy-paste from PDFs can introduce invisible characters
3. **Don't merge cells** — Excel merged cells break CSV parsing
4. **Save as UTF-8** — for non-English characters, save with UTF-8 encoding
5. **Validate numbers** — ensure no text in number columns (e.g., "N/A" in amount)

### Validation Rules

| Field | Rule |
|-------|------|
| `name` / `label` | Required, non-empty |
| `current_value` / `amount` / `target_amount` / `outstanding` | Required, must be a number > 0 |
| `category` / `type` / `source_type` | Optional, normalized if provided |
| `frequency` | Optional, defaults to `monthly` |
| `custom_days` | Required only if frequency = `custom`, must be > 0 |
| `date` fields | Optional, accepts YYYY-MM-DD or DD/MM/YYYY |

### Partial Import

If some rows have errors, the valid rows still import. You'll see:
- "Valid: 8"
- "Errors: 2"
- Specific error messages for each invalid row

Fix the errors in your CSV and re-upload to import the remaining rows.

---

## CSV Export (Future Enhancement)

Currently, WealthOS Infinity supports CSV import but not CSV export. To export your data:
1. Use the **Backup** feature (encrypted `.wealthos` file)
2. Or manually copy from the UI tables

CSV export is planned for a future version.

---

*Last updated: v2.3*
