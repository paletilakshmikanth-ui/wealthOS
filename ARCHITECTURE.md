# 🏗️ WealthOS Infinity — Architecture

Technical deep-dive into the WealthOS Infinity platform. Covers the calculation engine, state management, crypto layer, data flow, and design decisions.

---

## 📑 Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [State Management](#state-management)
- [Financial Calculation Engine](#financial-calculation-engine)
- [Crypto Layer](#crypto-layer)
- [Data Flow](#data-flow)
- [SSR & Hydration Strategy](#ssr--hydration-strategy)
- [Performance Considerations](#performance-considerations)
- [Design Decisions](#design-decisions)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (Client)                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Next.js 16 (App Router)                │ │
│  │                                                         │ │
│  │  ┌──────────────────┐    ┌──────────────────────────┐ │ │
│  │  │   React 19 UI    │───▶│   Zustand Store           │ │ │
│  │  │   (21 views)     │    │   (persisted)             │ │ │
│  │  └──────────────────┘    └──────────┬─────────────────┘ │ │
│  │           ▲                          │                   │ │
│  │           │                          ▼                   │ │
│  │  ┌──────────────────┐    ┌──────────────────────────┐ │ │
│  │  │  Financial Engine│◀───│   localStorage            │ │ │
│  │  │  (pure TS)       │    │   (AES-256 ready)         │ │ │
│  │  └──────────────────┘    └──────────────────────────┘ │ │
│  │           ▲                          ▲                  │ │
│  │           │                          │                  │ │
│  │  ┌──────────────────┐    ┌──────────────────────────┐ │ │
│  │  │  Web Crypto API  │    │   Backup/Restore          │ │ │
│  │  │  (PBKDF2+AES-GCM)│    │   (.wealthos files)       │ │ │
│  │  └──────────────────┘    └──────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              No cloud • No backend • No external APIs
```

### Key Principles

1. **Offline-first** — every feature works without internet
2. **Privacy by design** — data never leaves the user's device
3. **Reactive engine** — change one entry, all 30+ derived metrics update instantly
4. **Pure functions** — the engine has zero side effects, making it testable and predictable
5. **Type-safe** — strict TypeScript throughout, no `any` in domain logic

---

## State Management

### Store: `src/lib/wealthos/store.ts`

WealthOS uses **Zustand 5** with the `persist` middleware. The store is the single source of truth for all financial data.

```typescript
type WealthOSStore = WealthOSState & WealthOSActions;

export const useWealthOS = create<WealthOSStore>()(
  persist(
    (set) => ({
      // State (initialized from createEmptyState())
      ...seed,

      // Actions (30+ methods)
      setView: (view) => set({ activeView: view }),
      addAsset: (asset) => set((s) => ({ assets: [...s.assets, ...] })),
      updateAsset: (id, partial) => set((s) => ({ ... })),
      removeAsset: (id) => set((s) => ({ ... })),
      // ... 25+ more actions
    }),
    {
      name: 'wealthos-infinity-store',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      partialize: (s) => ({
        // Only persist these keys (NOT activeView)
        settings: s.settings,
        assets: s.assets,
        // ...
      }),
      migrate: (persistedState, version) => {
        // v3 → v4: convert monthlyAmount → amount + frequency
        if (version < 4) { ... }
      },
    }
  )
);
```

### Store Actions (30+)

| Category | Actions |
|----------|---------|
| **Navigation** | `setView` |
| **Settings** | `updateSettings` |
| **Assets** | `addAsset`, `updateAsset`, `removeAsset`, `importAssets` |
| **Liabilities** | `addLiability`, `updateLiability`, `removeLiability`, `importLiabilities` |
| **Income** | `addIncome`, `updateIncome`, `removeIncome`, `importIncome` |
| **Expenses** | `addExpense`, `updateExpense`, `removeExpense`, `importExpenses` |
| **Goals** | `addGoal`, `updateGoal`, `removeGoal`, `importGoals` |
| **Insurance** | `addInsurance`, `updateInsurance`, `removeInsurance` |
| **Family** | `addFamilyMember`, `updateFamilyMember`, `removeFamilyMember` |
| **Estate** | `addEstateDocument`, `updateEstateDocument`, `removeEstateDocument`, `addBeneficiary`, `updateBeneficiary`, `removeBeneficiary`, `updateEstatePlan` |
| **Children** | `addChildPlan`, `updateChildPlan`, `removeChildPlan` |
| **Elder Care** | `addElderCarePlan`, `updateElderCarePlan`, `removeElderCarePlan` |
| **Documents** | `addDocument`, `updateDocument`, `removeDocument` |
| **Auth** | `setPin`, `removePin`, `updateAuth` |
| **System** | `snapshotNetWorth`, `loadSampleData`, `clearAllData`, `restoreFromBackup`, `resetAll` |

### Subscription Pattern

Components subscribe to specific slices to minimize re-renders:

```typescript
// ✅ Good — only re-renders when assets change
const assets = useWealthOS(s => s.assets);

// ✅ Good — only re-renders when settings.currencySymbol changes
const sym = useWealthOS(s => s.settings.currencySymbol);

// ⚠️ Avoid — re-renders on ANY state change
const state = useWealthOS();
```

### Persistence

- **Storage**: `localStorage` via `createJSONStorage`
- **Store version**: 4 (with migration logic)
- **Partialize**: `activeView` is NOT persisted (prevents SSR hydration mismatch)
- **Migration**: v3→v4 converts legacy `monthlyAmount` → `amount` + `frequency='monthly'`

---

## Financial Calculation Engine

### Location: `src/lib/wealthos/engine.ts` (~1300 lines)

The engine is a **pure-TypeScript module** with zero external dependencies. All calculations run locally in the browser.

### Core Aggregations

```typescript
// Master KPI aggregator — called by Dashboard, TopBar, Insights, Reports
computeKPIs(state: WealthOSState): KPIMetrics {
  const totalAssets = sumAssets(state.assets);
  const totalLiabilities = sumLiabilities(state.liabilities);
  const monthlyIncome = sumMonthlyIncome(state.income);  // converts frequencies
  const monthlyExpenses = sumMonthlyExpenses(state.expenses);
  // ... 20+ derived metrics
  kpis.wealthHealthScore = computeWealthHealthScore(state, kpis);
  kpis.financialHealthScore = computeFinancialHealthScore(kpis);
  return kpis;
}
```

### Frequency Conversion

All income/expense entries support 5 frequencies. The `toMonthly()` function is the universal converter:

```typescript
export const DAYS_PER_MONTH = 30.4375;  // 365.25 / 12 (leap-year aware)
export const WEEKS_PER_MONTH = 52 / 12;

export const toMonthly = (amount, frequency, customDays) => {
  switch (frequency) {
    case 'daily':   return amount * DAYS_PER_MONTH;
    case 'weekly':  return amount * WEEKS_PER_MONTH;
    case 'monthly': return amount;
    case 'yearly':  return amount / 12;
    case 'custom':  return amount * (DAYS_PER_MONTH / Math.max(1, customDays || 30));
  }
};
```

Every calculation that touches income/expenses calls `toMonthly()` first, ensuring consistency regardless of how the user entered the data.

### FIRE Calculator

The FIRE calculation uses an **iterative solver** (binary search) to find years-to-FIRE:

```typescript
export const computeFIRE = (state, type = 'regular'): FIRCEResult => {
  const annualExpenses = sumMonthlyExpenses(state.expenses) * 12;
  const multiplier = { lean: 15, regular: 25, fat: 50, coast: 25, barista: 15 }[type];
  const target = annualExpenses * multiplier;
  const currentCorpus = sumInvestmentAssets(state.assets);
  const monthlySurplus = sumMonthlyIncome(state.income) - sumMonthlyExpenses(state.expenses);

  // Binary search: find years N such that
  // target = currentCorpus * (1+r)^N + monthlySurplus * [((1+r/12)^(12N) - 1) / (r/12)]
  let lo = 0, hi = 80;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const future = projectCorpus(currentCorpus, monthlySurplus, mid, r);
    if (future < target) lo = mid;
    else hi = mid;
  }
  return { fireNumber: target, yearsToFire: (lo + hi) / 2, ... };
};
```

### Monte Carlo Simulation

```typescript
export const runMonteCarlo = (
  initialState, monthlyContribution, annualReturnPct,
  volatilityPct, years, targetCorpus, numSimulations = 200
): MonteCarloResult => {
  // Box-Muller transform for Gaussian random
  const gaussian = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  // Run N simulations, each with monthly shocks
  for (let i = 0; i < numSimulations; i++) {
    let corpus = initialState;
    for (let m = 0; m < months; m++) {
      const shock = gaussian() * monthlyVol;
      corpus = corpus + corpus * (monthlyReturn + shock) + monthlyContribution;
    }
    finalCorpus.push(corpus);
  }

  // Return P5, P50, P95 + success rate
  return { best: P95, median: P50, worst: P5, successRate, paths };
};
```

### Health Scoring

**Wealth Health Score** (0-100) — weighted across 8 dimensions:

| Dimension | Weight | Target | Calculation |
|-----------|--------|--------|-------------|
| Savings rate | 18% | 30%+ | `min(100, savingsRate * 2)` |
| Emergency fund | 15% | 6 months | `min(100, (emergencyMonths / 6) * 100)` |
| Debt management | 17% | DTI < 40% | `max(0, 100 - dti * 1.5)` |
| Investments | 14% | 70%+ | `min(100, investmentRatio * 1.2)` |
| Insurance | 10% | 5 policies | `min(100, policyCount * 20)` |
| Goals | 10% | progress | `avg(goal.currentAmount / goal.targetAmount) * 100` |
| Diversification | 8% | 8+ categories | `min(100, categoryCount * 12)` |
| Net worth growth | 8% | positive MoM | `max(0, min(100, 50 + netWorthChangePct))` |

### Insights Engine

The `generateInsights()` function runs 9 rule categories and returns severity-tagged insights:

```typescript
export const generateInsights = (state, kpis): Insight[] => {
  const insights = [];

  // 1. Emergency fund check
  if (kpis.emergencyFundMonths < 3) {
    insights.push({
      severity: kpis.emergencyFundMonths < 1 ? 'critical' : 'warning',
      category: 'cashflow',
      title: 'Emergency fund critically low',
      impact: (6 - kpis.emergencyFundMonths) * kpis.monthlyExpenses,
      recommendation: 'Build emergency fund of 6 months of expenses',
    });
  }

  // 2. Savings rate, 3. DTI, 4. Insurance gaps, 5. Concentration,
  // 6. Cash drag, 7. Goal delays, 8. Retirement, 9. FI progress, 10. Tax
  // ...

  return insights.sort(bySeverity);
};
```

### Calculators

| Function | Formula |
|----------|---------|
| `calculateSIP` | `P × ((1+r)^n - 1) / r × (1+r)` |
| `calculateLumpsum` | `P × (1+r)^n` |
| `calculateSWP` | recursive: `corpus = (corpus - W) × (1+r)` |
| `calculateEMI` | `P × r × (1+r)^n / ((1+r)^n - 1)` |
| `calculateCAGR` | `(F/P)^(1/n) - 1` |
| `calculateXIRR` | Newton's method on NPV = 0 |
| `debtPayoffSchedule` | month-by-month avalanche/snowball simulation |

---

## Crypto Layer

### Location: `src/lib/wealthos/backup.ts`

WealthOS uses the **native Web Crypto API** for all cryptographic operations. No JS crypto libraries.

### PIN Hashing (for app unlock)

```typescript
// src/lib/wealthos/engine.ts
export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(`wealthos-salt::${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
```

### Encrypted Backup (AES-256-GCM)

```typescript
// Key derivation: PBKDF2 with 150,000 iterations
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt: returns [salt][IV][ciphertext]
export async function createEncryptedBackup(state, pin): Promise<BackupResult> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload))
  );
  // Concatenate: salt (16) + IV (12) + ciphertext
  const fileBytes = new Uint8Array(16 + 12 + ciphertext.byteLength);
  fileBytes.set(salt, 0);
  fileBytes.set(iv, 16);
  fileBytes.set(new Uint8Array(ciphertext), 28);
  return { blob: new Blob([fileBytes]), filename, ... };
}
```

### File Format

```
Offset  Length  Content
0       16      Salt (random per backup)
16      12      IV (random per backup)
28      N       AES-256-GCM ciphertext (includes 16-byte auth tag)
```

### Why AES-GCM?

- **Authenticated encryption** — detects tampering via authentication tag
- **Hardware-accelerated** — native browser support, fast
- **No padding oracle attacks** — stream cipher mode
- **Wrong PIN detection** — decryption fails if auth tag doesn't match

### Security Properties

1. **PIN never leaves the device** — only used in-memory for key derivation
2. **Per-backup salt + IV** — every backup file is unique even with the same PIN
3. **150K PBKDF2 iterations** — ~500ms on modern hardware, brute-force resistant
4. **No backdoor** — without the PIN, the backup is cryptographically unrecoverable
5. **Tamper detection** — AES-GCM auth tag catches any ciphertext modification

---

## Data Flow

### Add Entry Flow

```
User clicks "Add Asset"
  → AddAssetDialog opens
  → User fills form (name, category, value, etc.)
  → User clicks "Add Asset"
  → addAsset(payload) dispatched to store
  → Zustand set() updates state
  → persist middleware writes to localStorage
  → All subscribed components re-render:
     - Dashboard (net worth, KPIs update)
     - TopBar (live KPIs update)
     - Insights (new alerts generated)
     - FIRE/Retirement (projections update)
     - Tax (if income changed)
```

### Edit Entry Flow

```
User clicks pencil icon on asset row
  → AssetDialog opens in 'edit' mode
  → handleOpenChange populates form from asset
  → User changes value
  → User clicks "Save Changes"
  → updateAsset(id, payload) dispatched
  → Store updates, all derived metrics recompute
```

### CSV Import Flow

```
User clicks "Import CSV"
  → CSVImportDialog opens
  → User downloads template
  → User fills template, uploads file
  → parseCSV(text) → headers + rows
  → parseAssetRows(headers, rows) → validated entries + errors
  → Preview shows: total/valid/error counts + per-row errors
  → User clicks "Import N assets"
  → importAssets(entries) dispatched
  → Store batch-adds all entries
```

### Backup Flow

```
User clicks "Backup"
  → BackupDialog opens
  → User enters PIN
  → createEncryptedBackup(state, pin):
     1. Strip auth from state
     2. JSON.stringify(state)
     3. Generate random salt (16 bytes) + IV (12 bytes)
     4. Derive AES-256 key via PBKDF2(pin, salt, 150K iters)
     5. Encrypt JSON with AES-GCM(key, IV)
     6. Concatenate: salt + IV + ciphertext
  → downloadBackup(blob) → browser downloads .wealthos file
```

### Restore Flow

```
User clicks "Restore"
  → RestoreDialog opens
  → User selects .wealthos file
  → User enters PIN
  → previewBackup(file, pin):
     1. Read file as ArrayBuffer
     2. Extract salt (first 16 bytes), IV (next 12), ciphertext (rest)
     3. Derive key via PBKDF2(pin, salt)
     4. Decrypt with AES-GCM(key, IV)
     5. If fails → "Incorrect PIN or corrupted file"
     6. If succeeds → parse JSON, show preview
  → User clicks "Restore Backup"
  → confirm() dialog
  → restoreFromBackup(data) dispatched
  → Store replaces all data slices (PIN preserved)
  → Dashboard shows restored data
```

---

## SSR & Hydration Strategy

### The Problem

Next.js 16 with App Router renders pages on the server first, then hydrates on the client. If the server-rendered HTML differs from the client's first render, React throws a hydration mismatch.

### The Solution

1. **Deterministic seed data** — uses `id(prefix, n)` instead of `Math.random()`:
   ```typescript
   const id = (prefix: string, n: number) => `${prefix}-${n.toString(36).padStart(4, '0')}`;
   ```

2. **Hydration gate** — `useHydrated()` hook uses `useSyncExternalStore` to return `false` on server and `true` on client:
   ```typescript
   export function useHydrated(): boolean {
     return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
   }
   // getServerSnapshot returns false → server renders loading state
   // getSnapshot returns true → client renders actual UI
   ```

3. **Don't persist `activeView`** — the `partialize` function excludes `activeView` so the server (always renders `dashboard`) matches the client's first render.

4. **Store migration** — version 4 with `migrate()` function converts legacy `monthlyAmount` → `amount` + `frequency` for users upgrading from v3.

---

## Performance Considerations

### Zustand Selector Subscriptions

Components subscribe to specific slices, not the whole store:

```typescript
// ✅ Re-renders only when assets array changes
const assets = useWealthOS(s => s.assets);

// ✅ Re-renders only when currencySymbol changes
const sym = useWealthOS(s => s.settings.currencySymbol);
```

### Memoized Calculations

The engine functions are pure and fast, but for expensive operations (Monte Carlo, projections), React's `useMemo` is used:

```typescript
const result = useMemo(() => {
  return runMonteCarlo(initial, monthlyContribution, ...);
}, [initial, monthlyContribution, years, targetCorpus, numSims, seed]);
```

### Chart Performance

- Recharts with `ResponsiveContainer` for responsive sizing
- Monte Carlo paths sampled (10 paths displayed, not all 300)
- Projection charts downsampled (every 6th month for 30-year projections)

### localStorage Quota

- Typical profile: ~50-100KB (well within 5MB localStorage quota)
- Net worth history capped at 36 months
- Backup files: ~15-20KB for a full profile

---

## Design Decisions

### Why Zustand over Redux/Context?

- **Minimal boilerplate** — no action types, reducers, or providers
- **Better performance** — components subscribe to specific slices, not whole state
- **Persist middleware** — built-in localStorage persistence with versioning + migration
- **TypeScript-friendly** — full type inference out of the box

### Why Web Crypto API over a JS library?

- **Native performance** — hardware-accelerated AES-GCM
- **No dependencies** — smaller bundle size
- **Audited** — browser crypto is battle-tested and security-audited
- **Future-proof** — W3C standard, supported in all modern browsers

### Why offline-first?

- **Privacy** — financial data is the most sensitive personal information
- **Performance** — no network latency, instant calculations
- **Reliability** — works in airplanes, trains, poor connectivity
- **Cost** — no server infrastructure to maintain

### Why not Prisma/SQLite?

The project includes Prisma (configured) but doesn't use it for the core data layer because:
- **localStorage is sufficient** — typical profiles are <100KB
- **Simpler UX** — no database migrations, no file system access
- **Browser-only** — works in static hosting (GitHub Pages, Netlify)
- Prisma remains available for future server-side features (sync, multi-device)

### Why deterministic IDs in seed data?

`Math.random()` produces different values on server vs client, causing hydration mismatches. The seed uses:
```typescript
const id = (prefix: string, n: number) => `${prefix}-${n.toString(36).padStart(4, '0')}`;
```

This ensures the server-rendered HTML matches the client's first render exactly.

### Why not persist `activeView`?

If `activeView` was persisted, a user who navigated to "FIRE Center" and reloaded would have:
- Server renders `dashboard` (default)
- Client renders `fire` (from localStorage)
- → Hydration mismatch

By not persisting `activeView`, both server and client always start at `dashboard`, then the client navigates if needed (though currently we just show dashboard on reload, which is fine UX).

---

## Testing Strategy

> Note: Automated tests are not yet implemented. This section documents the recommended approach.

### Unit Tests (recommended)
- Engine functions (`computeKPIs`, `computeFIRE`, `calculateEMI`, etc.)
- CSV parser (`parseCSV`, `parseAssetRows`, etc.)
- Crypto functions (`hashPin`, `createEncryptedBackup`, `previewBackup`)

### Integration Tests (recommended)
- Store actions (add → update → delete → verify state)
- CSV import end-to-end (template → upload → preview → import → verify)
- Backup/restore cycle (backup → clear → restore → verify data integrity)

### E2E Tests (current)
- Manual verification via Agent Browser (all 21 views smoke-tested after each feature)
- Edge cases: empty state, wrong PIN, corrupted backup file, invalid CSV

---

*Last updated: v2.3*
