# 👑 WealthOS Infinity

### Personal CFO • Family Office • Wealth Intelligence • Financial Operating System

> The Ultimate Personal CFO, Family Office, Wealth Intelligence, Financial Planning, Investment Management, Retirement Planning, Estate Planning, Tax Planning, Financial Analytics, and Wealth Decision-Making Operating System.

A production-grade, offline-first, AES-256 encrypted wealth management platform that feels like a modern Bloomberg Terminal meets a private banking dashboard. Built with Next.js 16, TypeScript, Tailwind CSS 4, and shadcn/ui.

**This is NOT a budgeting app. It is a complete Wealth Operating System.**

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🎯 Quick Start](#-quick-start)
- [🏗️ Architecture](#-architecture)
- [🧠 Financial Calculation Engine](#-financial-calculation-engine)
- [🔐 Security Model](#-security-model)
- [💾 Data & Storage](#-data--storage)
- [📊 Modules Overview](#-modules-overview)
- [🎨 Design System](#-design-system)
- [🛠️ Development](#-development)
- [📁 Project Structure](#-project-structure)
- [📚 Documentation](#-documentation)
- [📋 Changelog](#-changelog)

---

## ✨ Key Features

### Core Platform
- **21 interconnected modules** — every entry flows through a central calculation engine that auto-updates net worth, FIRE progress, tax liability, insights, and projections
- **Offline-first** — all data persists to localStorage via Zustand `persist` middleware; no cloud, no backend, no external APIs
- **AES-256 encrypted** — PIN-derived key via PBKDF2 (150,000 iterations), real Web Crypto API
- **Bloomberg-grade UI** — dark luxury aesthetic with gold/emerald/crimson palette, glass cards, animated market ticker, tabular-numeric finance font
- **Biometric unlock** — simulated fingerprint scan with PIN fallback
- **Real encrypted backup/restore** — download `.wealthos` files, restore on any device with PIN

### Input & Data Management
- **Full CRUD** — Add, **Edit** (pencil icon), and Delete across all 9 input modules
- **CSV Import** — bulk-import assets, liabilities, income, expenses, and goals via downloadable templates + smart column matching
- **Recurring frequencies** — daily, weekly, monthly, yearly, or custom interval (e.g., every 15 days); auto-converts to monthly equivalents
- **Empty-by-default** — new users see a welcome screen; "Load Sample Data" button populates a demo profile

### Analytics & Intelligence
- **Monte Carlo simulation** — 300+ scenarios with P5/P50/P95 percentile bands
- **FIRE calculator** — 5 FIRE types (Lean/Regular/Barista/Coast/Fat) with iterative years-to-FIRE solver
- **Retirement projection** — inflation-adjusted corpus, readiness scoring, gap analysis
- **CFO Insights engine** — 9 rule-based categories (emergency, savings, debt, insurance, concentration, cash drag, goal delays, retirement, FI, tax)
- **Health scores** — 8-dimension Wealth Health Score + 4-dimension Financial Health Score
- **Institutional reports** — 9 report types downloadable as formatted HTML (PDF-ready)

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18+ (or Bun)
- Modern browser with Web Crypto API support (Chrome, Edge, Firefox, Safari)

### Installation
```bash
# Install dependencies
bun install   # or npm install

# Start the dev server
bun run dev   # or npm run dev

# Open http://localhost:3000
```

### First Launch
1. **Set up PIN** — create a 4-8 digit PIN (used for encryption + app unlock)
2. **Welcome screen** — choose:
   - **"Load Sample Data"** — explore with a realistic demo profile (32-year-old tech professional, ₹2.03 Cr net worth)
   - **"Start Adding Assets"** — jump straight into entering your own data

### Production Build
```bash
bun run build
bun run start
```

### Available Scripts
| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database (unused in offline mode) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Next.js 16 (App Router)               │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │           React 19 + TypeScript 5            │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │     Zustand Store (persisted)          │  │  │  │
│  │  │  │  ┌─────────────────────────────────┐  │  │  │  │
│  │  │  │  │   localStorage (AES-256 ready)  │  │  │  │  │
│  │  │  │  └─────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  │           Financial Engine (pure TS)         │  │  │
│  │  │     Web Crypto API (PBKDF2 + AES-GCM)        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         No cloud • No backend • No external APIs
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Icons | Lucide React |
| Charts | Recharts 2 |
| State | Zustand 5 (with `persist` middleware) |
| Animations | Framer Motion 12 |
| Notifications | Sonner |
| Crypto | Web Crypto API (native browser) |
| Database | localStorage (offline-first; Prisma available but unused) |

### Design Principles
1. **Offline-first** — every feature works without internet
2. **Privacy by design** — data never leaves the user's device
3. **Reactive engine** — change one entry, all 30+ derived metrics update instantly
4. **Type-safe** — strict TypeScript throughout, no `any` in domain logic
5. **Deterministic IDs** — seed data uses deterministic IDs (no `Math.random`) to prevent SSR hydration mismatches

---

## 🧠 Financial Calculation Engine

The engine (`src/lib/wealthos/engine.ts`, ~1300 lines) is a pure-TypeScript module with zero external dependencies. All calculations run locally.

### Core Functions

| Function | Purpose |
|----------|---------|
| `computeKPIs(state)` | Master aggregator — net worth, savings rate, DTI, emergency months, FI%, health scores |
| `computeAllocation(assets)` | Asset allocation by category with unrealized gains |
| `computeCashFlow(state)` | Income/expense breakdown with frequency conversion |
| `computeFIRE(state, type)` | FIRE number, years-to-FIRE (iterative solver), required monthly contribution |
| `computeRetirement(state)` | Inflation-adjusted corpus, readiness %, shortfall |
| `runMonteCarlo(...)` | Monte Carlo simulation with Box-Muller Gaussian shocks |
| `generateInsights(state, kpis)` | 9-category rule-based CFO insights |
| `calculateEMI(...)`, `calculateSIP(...)`, `calculateSWP(...)`, `calculateCAGR(...)`, `calculateXIRR(...)` | Financial calculators |
| `debtPayoffSchedule(...)` | Avalanche vs Snowball debt payoff simulation |

### Frequency Conversion
All income/expense entries support 5 frequencies. The `toMonthly()` function converts any frequency to its monthly equivalent:
- **Daily** × 30.4375 days/month
- **Weekly** × 52/12 weeks/month
- **Monthly** = 1×
- **Yearly** ÷ 12
- **Custom** (every N days) × 30.4375/N

### Health Scoring
**Wealth Health Score** (0-100) — weighted across 8 dimensions:
| Dimension | Weight | Target |
|-----------|--------|--------|
| Savings rate | 18% | 30%+ |
| Emergency fund | 15% | 6 months |
| Debt management | 17% | DTI < 40% |
| Investments | 14% | 70%+ of assets |
| Insurance | 10% | 5 policies |
| Goals | 10% | progress % |
| Diversification | 8% | 8+ categories |
| Net worth growth | 8% | positive MoM |

---

## 🔐 Security Model

### PIN Authentication
- **Setup**: 4-8 digit PIN, hashed with SHA-256 via Web Crypto API
- **Storage**: only the PIN hash is stored in localStorage (never the raw PIN)
- **Unlock**: biometric simulation (1.5s) with "Use PIN instead" fallback
- **Wrong PIN**: rejected with attempt counter

### Encrypted Backup/Restore
- **Key derivation**: PBKDF2 with SHA-256, 150,000 iterations, 16-byte random salt
- **Encryption**: AES-256-GCM (authenticated encryption) with 12-byte random IV
- **File format**: `[16-byte salt][12-byte IV][ciphertext]` — binary `.wealthos` file
- **No backdoor**: without the correct PIN, the backup is cryptographically unrecoverable
- **Tamper detection**: AES-GCM authentication tag catches any modification

### Security Guarantees
1. PIN never leaves the device
2. Backup file is opaque — no plaintext leakage
3. Per-backup salt + IV — every file is unique even with the same PIN
4. PBKDF2 with 150K iterations — brute-force resistant
5. All crypto via native Web Crypto API (no JS crypto libraries)

---

## 💾 Data & Storage

### State Shape
```typescript
interface WealthOSState {
  settings: Settings;           // profile, currency, assumptions
  assets: Asset[];              // 20 categories (cash, stocks, MFs, gold, crypto, RE, etc.)
  liabilities: Liability[];     // 8 types (home, auto, personal, credit card, etc.)
  income: IncomeEntry[];        // 9 sources with frequency
  expenses: ExpenseEntry[];     // 11 categories with frequency
  goals: Goal[];                // 10 types with priority
  insurance: InsurancePolicy[]; // 6 types
  family: FamilyMember[];       // relationships + dependents
  netWorthHistory: Snapshot[];  // monthly snapshots (up to 36)
  estatePlan: EstatePlan;       // documents + beneficiaries
  childPlans: ChildPlan[];      // milestones (education, marriage, etc.)
  elderCarePlans: ElderCarePlan[]; // long-term care modeling
  documents: VaultDocument[];   // encrypted document vault
  auth: AuthState;              // PIN hash + biometric settings
  activeView: ViewId;           // current nav view (not persisted)
}
```

### Persistence
- **Storage**: browser `localStorage` via Zustand `persist` middleware
- **Store version**: 4 (with migration logic for older schemas)
- **Partialize**: `activeView` is NOT persisted (prevents SSR hydration mismatch)
- **Migration**: v3→v4 converts legacy `monthlyAmount` → `amount` + `frequency='monthly'`

### CSV Import
Supported for 5 entity types: Assets, Liabilities, Income, Expenses, Goals

**3-step workflow**:
1. Download CSV template (with sample rows)
2. Upload filled CSV
3. Preview (total/valid/error counts + per-row errors) → confirm import

**Smart parsing**:
- Fuzzy column matching (`name`, `asset_name`, `holding` all work)
- Currency-agnostic numbers (strips ₹/$/€/£, commas, spaces)
- Date formats: YYYY-MM-DD or DD/MM/YYYY
- Category normalization (`mutual_funds`, `mutualfund`, `mf` → all map correctly)
- Frequency normalization (`yearly`, `annual`, `annually`, `per year`, `yr` → `yearly`)

---

## 📊 Modules Overview

21 modules across 5 categories:

### Overview
| Module | Description |
|--------|-------------|
| **Command Center** | Net worth hero, dual health rings, 6 KPI cards, trajectory chart, allocation pie, FIRE meter, cash flow bars, CFO alerts, goals grid |
| **Net Worth & Assets** | Treemap, category returns, holdings table, add/edit/import |

### Wealth
| Module | Description |
|--------|-------------|
| **Assets** | 20 categories (cash, MFs, stocks, ETFs, bonds, PPF, EPF, NPS, gold, silver, crypto, RE, land, vehicles, business, PE, ESOPs, RSUs, foreign, collectibles) |
| **Investments** | Risk-vs-return scatter, allocation pie, holdings table with ROI/gains |
| **Liabilities** | Debt portfolio, Avalanche vs Snowball comparison, payoff trajectory |
| **Cash Flow** | Income/expense with recurring frequencies, monthly equivalents, variance analysis |

### Planning
| Module | Description |
|--------|-------------|
| **Goals** | Progress cards with projections, on-track indicators, comparison chart |
| **Retirement** | Readiness ring, corpus projection, today/at-retirement/post-retirement breakdown |
| **FIRE Center** | 5 FIRE types, 30-year projection, required monthly investment |
| **Insurance** | Coverage gap analysis (6 types), life-cover adequacy |
| **Tax Optimization** | India new-regime slabs, 80C/80CCD utilization, 6 optimization strategies |
| **Family Office** | Member directory, wealth distribution bars |
| **Children Planning** | 6 milestone types, inflation-adjusted future value, required SIP |
| **Elder Care** | 6 need categories, lifetime cost projection, insurance gap |
| **Estate Planning** | 8-point readiness score, 6 document types, beneficiaries with share % |

### Tools
| Module | Description |
|--------|-------------|
| **Document Vault** | 9 categories, full-text search, expiry tracking, AES-256 encryption |
| **Calculators** | SIP, Lumpsum, SWP, EMI, FIRE, CAGR — with live charts |
| **Simulation Lab** | Monte Carlo (300+ sims), P5/P50/P95 bands, success probability |
| **CFO Insights** | 8-dimension radar, rule-based alerts, strategic priorities |
| **Reports** | 9 institutional report types, downloadable as HTML (PDF-ready) |

### System
| Module | Description |
|--------|-------------|
| **Settings** | Profile, location/currency, financial assumptions, security, data management, danger zone |

---

## 🎨 Design System

### Color Palette
```
Background    oklch(0.13 0.012 240)   /* deep navy */
Card          oklch(0.17 0.014 240)   /* elevated navy */
Primary       oklch(0.78 0.13 75)     /* luxury gold */
Success       oklch(0.72 0.18 152)    /* emerald */
Danger        oklch(0.65 0.22 22)     /* crimson */
Warning       oklch(0.78 0.15 70)     /* amber */
Info          oklch(0.68 0.13 220)    /* steel blue */
```

### Typography
- **Sans**: Geist Sans (body)
- **Mono**: Geist Mono (numbers, code)
- **Tabular numerals**: enabled globally for finance UI (`font-variant-numeric: tabular-nums`)

### Component Library
- **shadcn/ui** (New York style) — 40+ components
- **Custom primitives** (`Primitives.tsx`): `GlassCard`, `MetricLabel`, `MetricValue`, `DeltaPill`, `SeverityPill`, `SectionHeader`, `ProgressBar`, `RingScore`, `Sparkline`
- **Glass morphism**: `glass` and `glass-strong` utilities with backdrop-blur
- **Glow effects**: `glow-gold`, `glow-success`, `glow-danger` for emphasis cards
- **Custom scrollbar**: thin, terminal-style with gold hover

### Animations
- Market ticker (60s infinite scroll, pause on hover)
- Pulse dots for live indicators
- Shimmer loading states
- Framer Motion transitions on view changes

---

## 🛠️ Development

### Code Style
- TypeScript strict mode throughout
- ES6+ import/export
- shadcn/ui components preferred over custom implementations
- `'use client'` directive on all interactive components
- No `any` in domain logic (only in JSON migration code)

### Linting
```bash
bun run lint   # ESLint with Next.js + React Hooks rules
```

### Project Conventions
1. **Script Persistence Rule**: All scripts >10 lines saved to `/home/z/my-project/scripts/` before execution
2. **File Path Convention**: All files under `/home/z/my-project/`
3. **Deterministic IDs**: Seed data uses `id(prefix, n)` instead of `Math.random()` to prevent SSR hydration mismatches
4. **Hydration Safety**: `useHydrated()` hook gates client-only rendering
5. **Error Boundary**: Wraps all view components to catch render errors gracefully

### Adding a New Module
1. Create `src/components/wealthos/views/YourView.tsx`
2. Add view ID to `ViewId` type in `src/lib/wealthos/types.ts`
3. Add nav item to `NAV` array in `src/components/wealthos/Sidebar.tsx`
4. Add view title to `VIEW_TITLES` in `src/app/page.tsx`
5. Add view render condition in `page.tsx`
6. (Optional) Add domain types + engine functions + store actions

---

## 📁 Project Structure

```
my-project/
├── src/
│   ├── app/
│   │   ├── globals.css          # Tailwind + custom theme (glass, glow, ticker)
│   │   ├── layout.tsx           # Root layout with Geist fonts
│   │   └── page.tsx             # Main shell with view switcher + AuthGate
│   ├── lib/
│   │   ├── wealthos/
│   │   │   ├── types.ts         # Domain models (Asset, Liability, Goal, etc.)
│   │   │   ├── engine.ts        # Financial calculation engine (~1300 lines)
│   │   │   ├── seed.ts          # Empty state + sample data factories
│   │   │   ├── store.ts         # Zustand store with persist + 30+ actions
│   │   │   ├── backup.ts        # AES-256-GCM backup/restore via Web Crypto
│   │   │   └── csv.ts           # CSV parser + 5 entity importers + templates
│   │   ├── db.ts                # Prisma client (unused in offline mode)
│   │   └── utils.ts             # shadcn/ui utilities (cn helper)
│   ├── components/
│   │   ├── ui/                  # 40+ shadcn/ui components
│   │   ├── wealthos/
│   │   │   ├── AuthGate.tsx     # PIN setup + biometric + PIN entry
│   │   │   ├── BackupDialog.tsx # Encrypted backup download
│   │   │   ├── RestoreDialog.tsx# Encrypted restore with preview
│   │   │   ├── CSVImportDialog.tsx # Reusable 3-step CSV import
│   │   │   ├── ErrorBoundary.tsx# Catches render errors
│   │   │   ├── Primitives.tsx   # GlassCard, MetricValue, RingScore, etc.
│   │   │   ├── Sidebar.tsx      # 21-item nav with groups
│   │   │   └── TopBar.tsx       # Live KPIs + market ticker
│   │   └── wealthos/views/      # 21 view components
│   │       ├── DashboardView.tsx
│   │       ├── EmptyDashboard.tsx   # Welcome screen for new users
│   │       ├── WealthView.tsx       # Assets (Net Worth)
│   │       ├── InvestmentsView.tsx
│   │       ├── LiabilitiesView.tsx
│   │       ├── CashFlowView.tsx
│   │       ├── GoalsView.tsx
│   │       ├── RetirementView.tsx
│   │       ├── FireView.tsx
│   │       ├── InsuranceView.tsx
│   │       ├── TaxesView.tsx
│   │       ├── FamilyView.tsx
│   │       ├── ChildrenView.tsx
│   │       ├── ElderCareView.tsx
│   │       ├── EstateView.tsx
│   │       ├── DocumentsView.tsx
│   │       ├── CalculatorsView.tsx
│   │       ├── SimulationView.tsx
│   │       ├── InsightsView.tsx
│   │       ├── ReportsView.tsx
│   │       └── SettingsView.tsx
│   └── hooks/
│       ├── use-hydrated.ts      # SSR-safe hydration gate
│       ├── use-toast.ts         # shadcn toast hook
│       └── use-mobile.ts        # Responsive breakpoint hook
├── prisma/
│   └── schema.prisma            # Available but unused (offline-first)
├── public/
│   ├── logo.svg
│   └── robots.txt
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── Caddyfile                    # Gateway config
└── README.md                    # This file
```

### File Count
- **6** library modules (`src/lib/wealthos/`)
- **8** shared components (`src/components/wealthos/`)
- **21** view components (`src/components/wealthos/views/`)
- **40+** shadcn/ui components (`src/components/ui/`)
- **~10,300** total lines of application code

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file — overview, quick start, features |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical deep-dive: engine, store, crypto, data flow |
| [CHANGELOG.md](./CHANGELOG.md) | Version history (v1.0 → v2.3) |
| [docs/SECURITY.md](./docs/SECURITY.md) | Security model, threat analysis, crypto details |
| [docs/MODULES.md](./docs/MODULES.md) | Detailed guide to each of the 21 modules |
| [docs/CSV_IMPORT.md](./docs/CSV_IMPORT.md) | CSV format reference, templates, examples |

---

## 📋 Changelog

### v2.3 (current) — Encrypted Backup/Restore
- ✅ Real AES-256-GCM encrypted backup (`.wealthos` file format)
- ✅ PBKDF2 key derivation (150,000 iterations)
- ✅ Restore with decrypt-and-preview workflow
- ✅ Wrong-PIN rejection via AES-GCM authentication tag
- ✅ Backup/Restore buttons in Dashboard toolbar + Settings

### v2.2 — Edit + CSV Import
- ✅ Edit functionality across all 9 input modules (pencil icon + pre-filled dialog)
- ✅ CSV Import for Assets, Liabilities, Income, Expenses, Goals
- ✅ 3-step import workflow (template → upload → preview → confirm)
- ✅ Smart column matching, currency-agnostic parsing, fuzzy category normalization
- ✅ New store actions: `updateInsurance`, `updateFamilyMember`, `importAssets/Liabilities/Income/Expenses/Goals`

### v2.1 — Empty State + Recurring Frequencies
- ✅ New users start with empty profile (welcome screen with "Load Sample Data" CTA)
- ✅ Recurring frequencies: daily, weekly, monthly, yearly, custom interval
- ✅ `toMonthly()` engine function converts any frequency for calculations
- ✅ Live monthly/yearly equivalent preview in Add/Edit dialogs
- ✅ Store v4 with migration from v3 (legacy `monthlyAmount` → `amount` + `frequency`)

### v2.0 — Estate, Children, Elder Care, Documents, Auth
- ✅ PIN authentication gate (setup, biometric, PIN entry)
- ✅ Estate Planning (8-point readiness, 6 document types, beneficiaries)
- ✅ Children Planning (6 milestones, inflation-adjusted projections)
- ✅ Elder Care Planning (6 need categories, lifetime cost projection)
- ✅ Document Vault (9 categories, search, expiry tracking)
- ✅ Real PDF/HTML report generation (9 institutional report types)

### v1.0 — Initial Release
- ✅ 16 modules: Dashboard, Wealth, Assets, Investments, Liabilities, Cash Flow, Goals, Retirement, FIRE, Insurance, Taxes, Family, Calculators, Simulation, Insights, Reports, Settings
- ✅ Bloomberg-grade dark UI with glass morphism
- ✅ Offline-first Zustand store with localStorage persistence
- ✅ Monte Carlo simulation engine
- ✅ FIRE calculator (5 types)
- ✅ 6 financial calculators (SIP, Lumpsum, SWP, EMI, FIRE, CAGR)
- ✅ CFO Insights engine (9 rule categories)
- ✅ Market ticker, live KPIs, dual health rings

---

## 🌐 Browser Support

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome 90+ | ✅ | Full support (Web Crypto, all features) |
| Edge 90+ | ✅ | Full support |
| Firefox 90+ | ✅ | Full support |
| Safari 15+ | ✅ | Full support (Web Crypto requires 15+) |
| Mobile Chrome | ✅ | Responsive layout |
| Mobile Safari | ✅ | Responsive layout |

### Requirements
- JavaScript enabled
- localStorage available (~5MB quota sufficient for most profiles)
- Web Crypto API (for backup/restore + PIN hashing)

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- **shadcn/ui** for the excellent component library
- **Recharts** for the charting engine
- **Lucide** for the icon set
- **Zustand** for the minimal state management
- **Geist** font family by Vercel

---

**WealthOS Infinity** — *Your Personal CFO, in your pocket, encrypted, offline, yours.*
