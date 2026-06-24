# 📋 WealthOS Infinity — Changelog

All notable changes to WealthOS Infinity are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [v2.3] — 2026-06-24 — Encrypted Backup/Restore

### Added
- ✅ **Real AES-256-GCM encrypted backup** — download `.wealthos` files via Web Crypto API
- ✅ **PBKDF2 key derivation** — 150,000 iterations with SHA-256, 16-byte random salt
- ✅ **Restore with decrypt-and-preview workflow** — 3-step dialog (file → PIN → preview → confirm)
- ✅ **Wrong-PIN rejection** — AES-GCM authentication tag detects incorrect PIN
- ✅ **`BackupDialog` component** — shows entry counts, security info, download trigger
- ✅ **`RestoreDialog` component** — file picker, PIN input, preview tiles, destructive confirmation
- ✅ **`restoreFromBackup(data)` store action** — replaces all data slices, preserves PIN
- ✅ **Backup/Restore buttons** in Dashboard toolbar + Settings → Data Management

### Security
- PIN never leaves the device (in-memory only for key derivation)
- Per-backup salt + IV — every file is unique even with the same PIN
- No backdoor — without the PIN, the backup is cryptographically unrecoverable
- Tamper detection via AES-GCM authentication tag

### Files
- NEW: `src/lib/wealthos/backup.ts`
- NEW: `src/components/wealthos/BackupDialog.tsx`
- NEW: `src/components/wealthos/RestoreDialog.tsx`
- MODIFIED: `src/lib/wealthos/store.ts` (added `restoreFromBackup`)
- MODIFIED: `src/components/wealthos/views/SettingsView.tsx`
- MODIFIED: `src/components/wealthos/views/DashboardView.tsx`

---

## [v2.2] — 2026-06-24 — Edit + CSV Import

### Added
- ✅ **Edit functionality across all 9 input modules** — pencil icon next to delete, pre-filled dialog
- ✅ **CSV Import for 5 entity types** — Assets, Liabilities, Income, Expenses, Goals
- ✅ **3-step CSV import workflow** — download template → upload CSV → preview → confirm
- ✅ **Smart column matching** — fuzzy headers (`name`, `asset_name`, `holding` all work)
- ✅ **Currency-agnostic parsing** — strips ₹/$/€/£, commas, spaces automatically
- ✅ **Date format detection** — accepts YYYY-MM-DD and DD/MM/YYYY
- ✅ **Category normalization** — `mutual_funds`, `mutualfund`, `mf` → all map correctly
- ✅ **Frequency normalization** — `yearly`, `annual`, `annually`, `per year`, `yr` → `yearly`
- ✅ **Per-row validation** — invalid rows skipped with clear error messages

### Changed
- Refactored `AddXDialog` into shared `XDialog` component supporting `mode: 'add' | 'edit'`
- `handleOpenChange` populates form state from item when opening in edit mode
- Submit dispatches `addX` or `updateX` based on mode (no duplicate form code)

### New Store Actions
- `updateInsurance(id, partial)`
- `updateFamilyMember(id, partial)`
- `importAssets(assets[])`
- `importLiabilities(liabilities[])`
- `importIncome(income[])`
- `importExpenses(expenses[])`
- `importGoals(goals[])`

### Files
- NEW: `src/lib/wealthos/csv.ts` (parser + 5 entity parsers + 5 template generators)
- NEW: `src/components/wealthos/CSVImportDialog.tsx` (reusable import dialog)
- MODIFIED: 9 view files (WealthView, LiabilitiesView, CashFlowView, GoalsView, InsuranceView, FamilyView, EstateView, DocumentsView)
- MODIFIED: `src/lib/wealthos/store.ts` (7 new actions)

---

## [v2.1] — 2026-06-24 — Empty State + Recurring Frequencies

### Added
- ✅ **Empty-by-default profile** — new users see welcome screen instead of auto-loaded demo data
- ✅ **"Load Sample Data" button** — populates demo profile on demand (32-year-old tech professional)
- ✅ **"Clear All Data" button** — wipes all data, preserves PIN
- ✅ **Recurring frequencies** — daily, weekly, monthly, yearly, custom interval (every N days)
- ✅ **`toMonthly()` engine function** — converts any frequency to monthly equivalent
- ✅ **Live monthly/yearly equivalent preview** in Add/Edit dialogs
- ✅ **`EmptyDashboard` component** — welcome hero with feature highlights + 12 quick-start cards
- ✅ **Frequency display** — each income/expense entry shows original amount + frequency AND monthly equivalent

### Changed
- Store now initializes with `createEmptyState()` instead of `createSampleData()`
- `IncomeEntry` and `ExpenseEntry` use `amount` + `frequency` + `customDays` (instead of `monthlyAmount`)
- Sample data uses realistic frequencies: salary=monthly, bonus=yearly, insurance=yearly

### Store Migration
- Version bumped to 4
- `migrate()` function converts v3 `monthlyAmount` → v4 `amount` + `frequency='monthly'`

### Files
- NEW: `src/components/wealthos/views/EmptyDashboard.tsx`
- MODIFIED: `src/lib/wealthos/types.ts` (added `Frequency` type)
- MODIFIED: `src/lib/wealthos/engine.ts` (added `toMonthly`, `FREQUENCY_META`, `frequencyShort`)
- MODIFIED: `src/lib/wealthos/seed.ts` (split into `createEmptyState` + `createSampleData`)
- MODIFIED: `src/lib/wealthos/store.ts` (added `loadSampleData`, `clearAllData`, version 4)

---

## [v2.0] — 2026-06-24 — Estate, Children, Elder Care, Documents, Auth

### Added
- ✅ **PIN authentication gate** — setup, biometric simulation, PIN entry with attempt counter
- ✅ **SHA-256 PIN hashing** via Web Crypto API
- ✅ **Estate Planning module** — 8-point readiness score, 6 document types, beneficiaries
- ✅ **Children Planning module** — 6 milestone types, inflation-adjusted projections
- ✅ **Elder Care Planning module** — 6 need categories, lifetime cost projection
- ✅ **Document Vault** — 9 categories, full-text search, expiry tracking
- ✅ **Real PDF/HTML report generation** — 9 institutional report types downloadable
- ✅ **`AuthGate` component** — wraps app, shows PIN screen until unlocked
- ✅ **`ErrorBoundary` component** — catches render errors gracefully

### New Domain Types
- `EstateDocument`, `EstateDocumentType`, `EstateStatus`
- `Beneficiary`, `EstatePlan`
- `ChildPlan`, `ChildMilestone`
- `ElderCarePlan`, `ElderCareNeed`
- `VaultDocument`, `DocumentCategory`
- `AuthState`

### New Store Actions (14)
- Estate: `addEstateDocument`, `updateEstateDocument`, `removeEstateDocument`, `addBeneficiary`, `updateBeneficiary`, `removeBeneficiary`, `updateEstatePlan`
- Children: `addChildPlan`, `updateChildPlan`, `removeChildPlan`
- Elder Care: `addElderCarePlan`, `updateElderCarePlan`, `removeElderCarePlan`
- Documents: `addDocument`, `updateDocument`, `removeDocument`
- Auth: `setPin`, `removePin`, `updateAuth`

### Files
- NEW: `src/components/wealthos/AuthGate.tsx`
- NEW: `src/components/wealthos/ErrorBoundary.tsx`
- NEW: `src/hooks/use-hydrated.ts`
- NEW: 5 view files (EstateView, ChildrenView, ElderCareView, DocumentsView)
- MODIFIED: `src/lib/wealthos/types.ts` (7 new interfaces)
- MODIFIED: `src/lib/wealthos/engine.ts` (estate/child/elder care/doc functions + crypto)
- MODIFIED: `src/lib/wealthos/seed.ts` (sample data for all new modules)
- MODIFIED: `src/lib/wealthos/store.ts` (14 new actions, version 3)
- MODIFIED: `src/components/wealthos/Sidebar.tsx` (5 new nav items)
- MODIFIED: `src/app/page.tsx` (AuthGate wrapper + 5 new view conditions)

---

## [v1.0] — 2026-06-24 — Initial Release

### Added
- ✅ **16 modules**: Dashboard, Wealth, Assets, Investments, Liabilities, Cash Flow, Goals, Retirement, FIRE, Insurance, Taxes, Family, Calculators, Simulation, Insights, Reports, Settings
- ✅ **Bloomberg-grade dark UI** — gold/emerald/crimson palette, glass morphism, animated market ticker
- ✅ **Offline-first Zustand store** with localStorage persistence
- ✅ **Financial calculation engine** (~900 lines, pure TypeScript)
- ✅ **Monte Carlo simulation** — Box-Muller Gaussian shocks, P5/P50/P95 bands
- ✅ **FIRE calculator** — 5 types (Lean/Regular/Barista/Coast/Fat), iterative years-to-FIRE solver
- ✅ **6 financial calculators** — SIP, Lumpsum, SWP, EMI, FIRE, CAGR
- ✅ **CFO Insights engine** — 9 rule categories with severity tagging
- ✅ **Health scores** — 8-dimension Wealth Health + 4-dimension Financial Health
- ✅ **Market ticker** — animated 60s scroll with NIFTY/SENSEX/GOLD/BTC/USD-INR
- ✅ **Live KPI topbar** — net worth, surplus, FI%, health score
- ✅ **Asset allocation** — 20 categories with color-coded metadata
- ✅ **Debt payoff strategies** — Avalanche vs Snowball comparison
- ✅ **Tax optimization** — India new-regime slabs, 80C/80CCD tracking
- ✅ **Custom design system** — GlassCard, MetricValue, RingScore, Sparkline, etc.

### Architecture
- Next.js 16 with App Router
- TypeScript 5 (strict)
- Tailwind CSS 4 + shadcn/ui (New York)
- Zustand 5 with persist middleware
- Recharts 2 for visualizations
- Framer Motion 12 for animations

### Files
- NEW: `src/lib/wealthos/types.ts` (domain models)
- NEW: `src/lib/wealthos/engine.ts` (calculation engine)
- NEW: `src/lib/wealthos/seed.ts` (sample data)
- NEW: `src/lib/wealthos/store.ts` (Zustand store)
- NEW: `src/components/wealthos/Primitives.tsx` (UI primitives)
- NEW: `src/components/wealthos/Sidebar.tsx` (navigation)
- NEW: `src/components/wealthos/TopBar.tsx` (top bar + ticker)
- NEW: 16 view files
- MODIFIED: `src/app/page.tsx` (main shell)
- MODIFIED: `src/app/layout.tsx` (dark theme + metadata)
- MODIFIED: `src/app/globals.css` (custom theme)

---

## Version Summary

| Version | Date | Modules | Key Feature |
|---------|------|---------|-------------|
| v1.0 | 2026-06-24 | 16 | Initial release with Bloomberg-grade UI |
| v2.0 | 2026-06-24 | 21 | Auth + Estate + Children + Elder Care + Documents |
| v2.1 | 2026-06-24 | 21 | Empty state + recurring frequencies |
| v2.2 | 2026-06-24 | 21 | Edit + CSV Import |
| v2.3 | 2026-06-24 | 21 | Real encrypted backup/restore |

---

*Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).*
