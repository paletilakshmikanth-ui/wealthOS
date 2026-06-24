// ============================================================
// WealthOS Infinity — Financial Calculation Engine
// All calculations run locally. No cloud, no external APIs.
// ============================================================

import type {
  Asset,
  AssetAllocation,
  AssetCategory,
  CashFlowBreakdown,
  ChildPlan,
  ElderCarePlan,
  EstatePlan,
  FIRCEResult,
  Frequency,
  Goal,
  IncomeEntry,
  IncomeSource,
  Insight,
  KPIMetrics,
  Liability,
  MonteCarloResult,
  RetirementProjection,
  WealthOSState,
} from './types';

// ---------- Helpers ----------

export const fmtCurrency = (amount: number, symbol = '₹', digits = 0): string => {
  if (!isFinite(amount)) amount = 0;
  const abs = Math.abs(amount);
  let body: string;
  if (abs >= 1_00_00_000) body = (amount / 1_00_00_000).toFixed(2) + ' Cr';
  else if (abs >= 1_00_000) body = (amount / 1_00_000).toFixed(2) + ' L';
  else if (abs >= 1_000) body = (amount / 1_000).toFixed(1) + 'K';
  else body = amount.toFixed(0);
  return `${symbol}${body}`;
};

export const fmtFullCurrency = (amount: number, symbol = '₹'): string => {
  if (!isFinite(amount)) amount = 0;
  return `${symbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const fmtPct = (pct: number, digits = 1): string => {
  if (!isFinite(pct)) pct = 0;
  return `${pct.toFixed(digits)}%`;
};

export const fmtNumber = (n: number, digits = 0): string => {
  if (!isFinite(n)) n = 0;
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits });
};

export const uid = (): string => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---------- Asset Categories Metadata ----------

export const ASSET_CATEGORY_META: Record<
  AssetCategory,
  { label: string; color: string; isInvestment: boolean; isLiquid: boolean }
> = {
  cash:           { label: 'Cash & Bank',     color: 'oklch(0.68 0.13 220)',  isInvestment: false, isLiquid: true  },
  mutual_funds:   { label: 'Mutual Funds',    color: 'oklch(0.78 0.13 75)',   isInvestment: true,  isLiquid: true  },
  stocks:         { label: 'Stocks',          color: 'oklch(0.72 0.18 152)',  isInvestment: true,  isLiquid: true  },
  etf:            { label: 'ETFs',            color: 'oklch(0.78 0.15 200)',  isInvestment: true,  isLiquid: true  },
  bonds:          { label: 'Bonds',           color: 'oklch(0.74 0.20 295)',  isInvestment: true,  isLiquid: false },
  ppf:            { label: 'PPF',             color: 'oklch(0.65 0.22 22)',   isInvestment: true,  isLiquid: false },
  epf:            { label: 'EPF',             color: 'oklch(0.80 0.13 60)',   isInvestment: true,  isLiquid: false },
  nps:            { label: 'NPS',             color: 'oklch(0.68 0.13 220)',  isInvestment: true,  isLiquid: false },
  gold:           { label: 'Gold',            color: 'oklch(0.82 0.12 80)',   isInvestment: true,  isLiquid: true  },
  silver:         { label: 'Silver',          color: 'oklch(0.70 0.02 240)',  isInvestment: true,  isLiquid: true  },
  crypto:         { label: 'Crypto',          color: 'oklch(0.74 0.20 295)',  isInvestment: true,  isLiquid: true  },
  real_estate:    { label: 'Real Estate',     color: 'oklch(0.65 0.18 30)',   isInvestment: false, isLiquid: false },
  land:           { label: 'Land',            color: 'oklch(0.55 0.15 145)',  isInvestment: false, isLiquid: false },
  vehicles:       { label: 'Vehicles',        color: 'oklch(0.60 0.10 240)',  isInvestment: false, isLiquid: false },
  business:       { label: 'Business',        color: 'oklch(0.70 0.20 295)',  isInvestment: false, isLiquid: false },
  private_equity: { label: 'Private Equity',  color: 'oklch(0.72 0.18 152)',  isInvestment: true,  isLiquid: false },
  esop:           { label: 'ESOPs',           color: 'oklch(0.78 0.15 200)',  isInvestment: true,  isLiquid: false },
  rsu:            { label: 'RSUs',            color: 'oklch(0.78 0.13 75)',   isInvestment: true,  isLiquid: false },
  foreign:        { label: 'Foreign Assets',  color: 'oklch(0.68 0.13 220)',  isInvestment: true,  isLiquid: true  },
  collectibles:   { label: 'Collectibles',    color: 'oklch(0.80 0.13 60)',   isInvestment: false, isLiquid: false },
};

export const LIABILITY_TYPE_META: Record<string, { label: string; color: string }> = {
  home_loan:       { label: 'Home Loan',       color: 'oklch(0.65 0.22 22)'   },
  education_loan:  { label: 'Education Loan',  color: 'oklch(0.78 0.13 75)'   },
  personal_loan:   { label: 'Personal Loan',   color: 'oklch(0.78 0.15 70)'   },
  business_loan:   { label: 'Business Loan',   color: 'oklch(0.74 0.20 295)'  },
  credit_card:     { label: 'Credit Card',     color: 'oklch(0.65 0.22 22)'   },
  mortgage:        { label: 'Mortgage',        color: 'oklch(0.68 0.13 220)'  },
  auto_loan:       { label: 'Auto Loan',       color: 'oklch(0.70 0.02 240)'  },
  other:           { label: 'Other',           color: 'oklch(0.60 0.02 240)'  },
};

export const INCOME_SOURCE_META: Record<IncomeSource, { label: string; isPassive: boolean }> = {
  salary:         { label: 'Salary',          isPassive: false },
  bonus:          { label: 'Bonus',           isPassive: false },
  dividend:       { label: 'Dividend',        isPassive: true  },
  rental:         { label: 'Rental Income',   isPassive: true  },
  interest:       { label: 'Interest',        isPassive: true  },
  business:       { label: 'Business',        isPassive: false },
  freelance:      { label: 'Freelance',       isPassive: false },
  capital_gains:  { label: 'Capital Gains',   isPassive: true  },
  other:          { label: 'Other',           isPassive: false },
};

// ---------- Core Aggregations ----------

export const sumAssets = (assets: Asset[]): number =>
  assets.reduce((s, a) => s + (a.currentValue || 0), 0);

export const sumInvestedAssets = (assets: Asset[]): number =>
  assets.reduce((s, a) => s + (a.investedValue || 0), 0);

export const sumLiabilities = (liabilities: Liability[]): number =>
  liabilities.reduce((s, l) => s + (l.outstandingBalance || 0), 0);

// ---------- Frequency Conversions ----------
// Convert any recurring amount to its monthly equivalent.
// Average days/month = 30.4375 (365.25 / 12, accounting for leap years)
// Average weeks/month = 52/12 = 4.3333

export const DAYS_PER_MONTH = 30.4375;
export const WEEKS_PER_MONTH = 52 / 12;

export const toMonthly = (
  amount: number,
  frequency: Frequency = 'monthly',
  customDays?: number,
): number => {
  if (!amount || !isFinite(amount)) return 0;
  switch (frequency) {
    case 'daily':   return amount * DAYS_PER_MONTH;
    case 'weekly':  return amount * WEEKS_PER_MONTH;
    case 'monthly': return amount;
    case 'yearly':  return amount / 12;
    case 'custom':  return amount * (DAYS_PER_MONTH / Math.max(1, customDays || 30));
    default:        return amount;
  }
};

export const toYearly = (
  amount: number,
  frequency: Frequency = 'monthly',
  customDays?: number,
): number => toMonthly(amount, frequency, customDays) * 12;

export const toDaily = (
  amount: number,
  frequency: Frequency = 'monthly',
  customDays?: number,
): number => toMonthly(amount, frequency, customDays) / DAYS_PER_MONTH;

export const FREQUENCY_META: Record<Frequency, { label: string; short: string; description: string }> = {
  daily:   { label: 'Daily',           short: '/day',   description: 'Occurs every day' },
  weekly:  { label: 'Weekly',          short: '/wk',    description: 'Occurs every week' },
  monthly: { label: 'Monthly',         short: '/mo',    description: 'Occurs every month' },
  yearly:  { label: 'Yearly',          short: '/yr',    description: 'Occurs once a year' },
  custom:  { label: 'Custom Interval', short: '/cust',  description: 'Custom interval in days' },
};

export const frequencyLabel = (f: Frequency, customDays?: number): string => {
  if (f === 'custom') return `every ${customDays || 30} days`;
  return FREQUENCY_META[f].label.toLowerCase();
};

export const frequencyShort = (f: Frequency, customDays?: number): string => {
  if (f === 'custom') return `/ ${customDays || 30}d`;
  return FREQUENCY_META[f].short;
};

// Format an entry's amount with its frequency, e.g. "₹50,000 /mo" or "₹500 /day"
export const fmtEntryAmount = (
  amount: number,
  frequency: Frequency = 'monthly',
  customDays?: number,
  symbol = '₹',
): string => {
  return `${fmtFullCurrency(amount, symbol)} ${frequencyShort(frequency, customDays)}`;
};

export const sumMonthlyIncome = (income: IncomeEntry[]): number =>
  income.filter(i => i.active).reduce((s, i) => s + toMonthly(i.amount, i.frequency, i.customDays), 0);

export const sumMonthlyExpenses = (expenses: WealthOSState['expenses']): number =>
  expenses.reduce((s, e) => s + toMonthly(e.amount, e.frequency, e.customDays), 0);

export const sumMonthlyEMI = (liabilities: Liability[]): number =>
  liabilities.reduce((s, l) => s + (l.emi || 0), 0);

export const computeNetWorth = (state: WealthOSState): number =>
  sumAssets(state.assets) - sumLiabilities(state.liabilities);

// ---------- Allocation ----------

export const computeAllocation = (assets: Asset[]): AssetAllocation[] => {
  const total = sumAssets(assets);
  if (total === 0) return [];
  const grouped = new Map<AssetCategory, AssetAllocation>();
  for (const a of assets) {
    const cur = grouped.get(a.category);
    const value = a.currentValue || 0;
    const invested = a.investedValue || 0;
    if (cur) {
      cur.value += value;
      cur.investedValue += invested;
    } else {
      grouped.set(a.category, {
        category: a.category,
        label: ASSET_CATEGORY_META[a.category].label,
        value,
        pct: 0,
        investedValue: invested,
        unrealizedGain: 0,
        gainPct: 0,
      });
    }
  }
  const arr = Array.from(grouped.values());
  for (const g of arr) {
    g.pct = (g.value / total) * 100;
    g.unrealizedGain = g.value - g.investedValue;
    g.gainPct = g.investedValue > 0 ? (g.unrealizedGain / g.investedValue) * 100 : 0;
  }
  return arr.sort((a, b) => b.value - a.value);
};

// ---------- Cash Flow ----------

export const computeCashFlow = (state: WealthOSState): CashFlowBreakdown => {
  const totalIncome = sumMonthlyIncome(state.income) || 1;
  const totalExpenses = sumMonthlyExpenses(state.expenses) || 1;
  return {
    income: state.income
      .filter(i => i.active)
      .map(i => {
        const monthly = toMonthly(i.amount, i.frequency, i.customDays);
        return {
          source: i.source,
          label: i.label || INCOME_SOURCE_META[i.source].label,
          amount: monthly,
          pct: (monthly / totalIncome) * 100,
        };
      })
      .sort((a, b) => b.amount - a.amount),
    expenses: state.expenses
      .map(e => {
        const monthly = toMonthly(e.amount, e.frequency, e.customDays);
        return {
          category: e.category,
          label: e.label,
          amount: monthly,
          pct: (monthly / totalExpenses) * 100,
          essential: e.essential,
        };
      })
      .sort((a, b) => b.amount - a.amount),
    surplus: sumMonthlyIncome(state.income) - sumMonthlyExpenses(state.expenses),
  };
};

// ---------- Passive Income & FIRE ----------

export const computePassiveIncomeMonthly = (state: WealthOSState): number =>
  state.income
    .filter(i => i.active && INCOME_SOURCE_META[i.source].isPassive)
    .reduce((s, i) => s + toMonthly(i.amount, i.frequency, i.customDays), 0) +
  // imputed returns from investments
  state.assets
    .filter(a => ASSET_CATEGORY_META[a.category].isInvestment)
    .reduce((s, a) => s + (a.currentValue * (a.annualReturnRate / 100)) / 12, 0);

// ---------- Health Scores ----------

export const computeWealthHealthScore = (state: WealthOSState, kpis: KPIMetrics): number => {
  // Weighted scoring across dimensions, 0-100
  const dims = {
    savings: Math.min(100, kpis.savingsRate * 2),                // 30% target
    emergency: Math.min(100, (kpis.emergencyFundMonths / 6) * 100), // 6 months target
    debt: Math.max(0, 100 - kpis.debtToIncomeRatio * 1.5),       // DTI < 40% good
    investments: Math.min(100, kpis.investmentRatio * 1.2),      // > 80% target
    insurance: Math.min(100, state.insurance.length * 20),       // 5 policies = full
    goals: state.goals.length > 0
      ? Math.min(100, (state.goals.reduce((s, g) => s + (g.currentAmount / Math.max(1, g.targetAmount)), 0) / state.goals.length) * 100)
      : 0,
    diversification: Math.min(100, computeAllocation(state.assets).length * 12), // 8+ categories
    netWorthGrowth: Math.max(0, Math.min(100, 50 + kpis.netWorthChangePct)),
  };
  const weights = {
    savings: 18, emergency: 15, debt: 17, investments: 14,
    insurance: 10, goals: 10, diversification: 8, netWorthGrowth: 8,
  };
  let score = 0;
  for (const key of Object.keys(weights) as (keyof typeof weights)[]) {
    score += (dims[key] as number) * (weights[key] / 100);
  }
  return Math.round(Math.max(0, Math.min(100, score)));
};

export const computeFinancialHealthScore = (kpis: KPIMetrics): number => {
  const savingsScore = Math.min(40, kpis.savingsRate * 0.8);
  const emergencyScore = Math.min(25, (kpis.emergencyFundMonths / 6) * 25);
  const debtScore = Math.max(0, 25 - kpis.debtToIncomeRatio * 0.4);
  const surplusScore = kpis.monthlySurplus > 0 ? 10 : 0;
  return Math.round(Math.min(100, savingsScore + emergencyScore + debtScore + surplusScore));
};

// ---------- Master KPIs ----------

export const computeKPIs = (state: WealthOSState): KPIMetrics => {
  const totalAssets = sumAssets(state.assets);
  const totalLiabilities = sumLiabilities(state.liabilities);
  const netWorth = totalAssets - totalLiabilities;

  const monthlyIncome = sumMonthlyIncome(state.income);
  const monthlyExpenses = sumMonthlyExpenses(state.expenses);
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  const liquidAssets = state.assets
    .filter(a => ASSET_CATEGORY_META[a.category].isLiquid || a.liquidity === 'high')
    .reduce((s, a) => s + a.currentValue, 0);

  const investmentAssets = state.assets
    .filter(a => ASSET_CATEGORY_META[a.category].isInvestment)
    .reduce((s, a) => s + a.currentValue, 0);

  const monthlyEMI = sumMonthlyEMI(state.liabilities);
  const annualExpenses = monthlyExpenses * 12;

  const passiveIncomeMonthly = computePassiveIncomeMonthly(state);

  const emergencyFundMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
  const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;
  const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyEMI / monthlyIncome) * 100 : 0;
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const investmentRatio = totalAssets > 0 ? (investmentAssets / totalAssets) * 100 : 0;
  const liquidityRatio = totalLiabilities > 0 ? (liquidAssets / totalLiabilities) : (liquidAssets > 0 ? 1 : 0);
  const financialIndependencePct = monthlyExpenses > 0 ? (passiveIncomeMonthly / monthlyExpenses) * 100 : 0;

  const monthlyIncomeForFI = monthlyExpenses / (state.settings.safeWithdrawalRate / 100) / 12;
  void monthlyIncomeForFI;

  // Net worth change vs previous snapshot
  const history = state.netWorthHistory;
  const netWorthChangePct = history.length >= 2
    ? ((netWorth - history[history.length - 2].netWorth) / Math.max(1, history[history.length - 2].netWorth)) * 100
    : 0;

  // Annual growth projection: project next 12 months using expected returns + monthly surplus
  const annualReturnFromAssets = state.assets.reduce(
    (s, a) => s + a.currentValue * (a.annualReturnRate / 100),
    0
  );
  const annualGrowthProjection = annualReturnFromAssets + monthlySurplus * 12;

  const kpis: KPIMetrics = {
    netWorth,
    totalAssets,
    totalLiabilities,
    monthlyIncome,
    monthlyExpenses,
    monthlySurplus,
    annualIncome: monthlyIncome * 12,
    annualExpenses,
    annualSurplus: monthlySurplus * 12,
    savingsRate,
    debtToIncomeRatio,
    debtToAssetRatio,
    emergencyFundMonths,
    liquidityRatio,
    investmentRatio,
    passiveIncomeMonthly,
    financialIndependencePct,
    wealthHealthScore: 0,
    financialHealthScore: 0,
    netWorthChangePct,
    annualGrowthProjection,
  };
  kpis.wealthHealthScore = computeWealthHealthScore(state, kpis);
  kpis.financialHealthScore = computeFinancialHealthScore(kpis);
  return kpis;
};

// ---------- FIRE ----------

export const computeFIRE = (state: WealthOSState, type: FIRCEResult['fireType'] = 'regular'): FIRCEResult => {
  const annualExpenses = sumMonthlyExpenses(state.expenses) * 12;
  const multiplier = { lean: 25, regular: 25, fat: 50, coast: 25, barista: 15 }[type];
  const fireNumber = (annualExpenses * multiplier) / (state.settings.safeWithdrawalRate / 25 * 25) ;
  // Standard: 25x annual expenses for regular, 15x for lean, 50x for fat
  const stdMultiplier = { lean: 15, regular: 25, fat: 50, coast: 25, barista: 15 }[type];
  const target = annualExpenses * stdMultiplier;
  void fireNumber;

  // Current investable corpus (only investment assets)
  const currentCorpus = state.assets
    .filter(a => ASSET_CATEGORY_META[a.category].isInvestment)
    .reduce((s, a) => s + a.currentValue, 0);

  const monthlySurplus = sumMonthlyIncome(state.income) - sumMonthlyExpenses(state.expenses);
  // Solve: target = currentCorpus * (1+r)^n + monthlySurplus * [((1+r/12)^(12n) - 1) / (r/12)]
  const r = state.settings.expectedMarketReturn / 100;
  const rMonthly = r / 12;
  let yearsToFire = 0;
  if (currentCorpus >= target) {
    yearsToFire = 0;
  } else if (monthlySurplus > 0) {
    // Iterative solve (Newton-ish via search)
    let lo = 0, hi = 80;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const months = mid * 12;
      const future =
        currentCorpus * Math.pow(1 + rMonthly, months) +
        (rMonthly > 0
          ? monthlySurplus * ((Math.pow(1 + rMonthly, months) - 1) / rMonthly)
          : monthlySurplus * months);
      if (future < target) lo = mid;
      else hi = mid;
    }
    yearsToFire = (lo + hi) / 2;
  } else {
    // Only growth on current corpus
    if (r > 0 && currentCorpus > 0) {
      yearsToFire = Math.log(target / currentCorpus) / Math.log(1 + r);
    } else yearsToFire = 99;
  }

  const fireDate = new Date();
  fireDate.setFullYear(fireDate.getFullYear() + Math.ceil(yearsToFire));

  const progressPct = target > 0 ? (currentCorpus / target) * 100 : 0;

  // Required monthly contribution if user wants FIRE in N years
  const yearsTarget = state.settings.retirementAge - state.settings.currentAge;
  const monthsTarget = Math.max(1, yearsTarget * 12);
  const rM = rMonthly;
  let monthlyContributionRequired = 0;
  if (target > currentCorpus * Math.pow(1 + rM, monthsTarget)) {
    const futureValueOfCurrent = currentCorpus * Math.pow(1 + rM, monthsTarget);
    const shortfall = target - futureValueOfCurrent;
    monthlyContributionRequired = rM > 0
      ? shortfall * rM / (Math.pow(1 + rM, monthsTarget) - 1)
      : shortfall / monthsTarget;
  }

  return {
    fireNumber: target,
    currentCorpus,
    progressPct: Math.min(100, progressPct),
    yearsToFire,
    fireDate: fireDate.toISOString(),
    monthlyContributionRequired,
    fireType: type,
    annualExpenses,
    safeWithdrawalRate: state.settings.safeWithdrawalRate,
  };
};

// ---------- Retirement ----------

export const computeRetirement = (state: WealthOSState): RetirementProjection => {
  const yearsToRetirement = Math.max(1, state.settings.retirementAge - state.settings.currentAge);
  const yearsInRetirement = state.settings.lifeExpectancy - state.settings.retirementAge;
  const annualExpenses = sumMonthlyExpenses(state.expenses) * 12;

  // Retirement corpus needed (future value adjusted for inflation)
  // Annual expense at retirement inflated
  const futureAnnualExpense = annualExpenses * Math.pow(1 + state.settings.inflationRate / 100, yearsToRetirement);
  // Corpus needed = futureAnnualExpense * yearsInRetirement, discounted for SWR
  // Use SWR method: corpus = futureAnnualExpense / SWR
  const swr = state.settings.safeWithdrawalRate / 100;
  const retirementCorpus = futureAnnualExpense / swr;

  // Current investable corpus
  const currentCorpus = state.assets
    .filter(a => ASSET_CATEGORY_META[a.category].isInvestment)
    .reduce((s, a) => s + a.currentValue, 0);

  // Project current corpus to retirement
  const r = state.settings.expectedMarketReturn / 100;
  const corpusAtRetirement = currentCorpus * Math.pow(1 + r, yearsToRetirement);

  const monthlySurplus = sumMonthlyIncome(state.income) - sumMonthlyExpenses(state.expenses);
  const rM = r / 12;
  const months = yearsToRetirement * 12;

  // Required monthly contribution
  let monthlyContributionRequired = 0;
  if (retirementCorpus > corpusAtRetirement) {
    const shortfall = retirementCorpus - corpusAtRetirement;
    monthlyContributionRequired = rM > 0
      ? (shortfall * rM) / (Math.pow(1 + rM, months) - 1)
      : shortfall / months;
  }

  const surplus = corpusAtRetirement - retirementCorpus;
  const shortfall = Math.max(0, retirementCorpus - corpusAtRetirement);
  const readinessPct = retirementCorpus > 0 ? Math.min(100, (corpusAtRetirement / retirementCorpus) * 100) : 0;
  const projectedAnnualIncomeAtRetirement = corpusAtRetirement * swr;

  void monthlySurplus; void yearsInRetirement;

  return {
    retirementCorpus,
    corpusAtRetirement,
    shortfall,
    surplus,
    monthlyContributionRequired,
    yearsToRetirement,
    readinessPct,
    projectedAnnualIncomeAtRetirement,
  };
};

// ---------- Monte Carlo Simulation ----------

export const runMonteCarlo = (
  initialState: number,
  monthlyContribution: number,
  annualReturnPct: number,
  volatilityPct: number,
  years: number,
  targetCorpus: number,
  numSimulations = 200,
): MonteCarloResult => {
  const months = years * 12;
  const monthlyReturn = annualReturnPct / 100 / 12;
  const monthlyVol = volatilityPct / 100 / Math.sqrt(12);
  // Box-Muller transform for normal random
  const gaussian = (): number => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const paths: number[][] = [];
  const finalCorpus: number[] = [];
  let success = 0;

  // Sample only a few paths to display
  const sampledPathIndices = new Set<number>();
  while (sampledPathIndices.size < Math.min(10, numSimulations)) {
    sampledPathIndices.add(Math.floor(Math.random() * numSimulations));
  }

  for (let i = 0; i < numSimulations; i++) {
    let corpus = initialState;
    const path: number[] = [corpus];
    const track = sampledPathIndices.has(i);
    for (let m = 0; m < months; m++) {
      const shock = gaussian() * monthlyVol;
      const growth = corpus * (monthlyReturn + shock);
      corpus = corpus + growth + monthlyContribution;
      if (corpus < 0) corpus = 0;
      if (track) path.push(corpus);
    }
    finalCorpus.push(corpus);
    if (track && path.length > 0) paths.push(path);
    if (corpus >= targetCorpus) success++;
  }

  finalCorpus.sort((a, b) => a - b);
  const median = finalCorpus[Math.floor(finalCorpus.length / 2)] || 0;
  const best = finalCorpus[Math.floor(finalCorpus.length * 0.95)] || 0;
  const worst = finalCorpus[Math.floor(finalCorpus.length * 0.05)] || 0;

  return {
    best,
    median,
    worst,
    successRate: (success / numSimulations) * 100,
    paths,
  };
};

// ---------- AI-like Insights Engine (Local rules) ----------

export const generateInsights = (state: WealthOSState, kpis: KPIMetrics): Insight[] => {
  const insights: Insight[] = [];
  const sym = state.settings.currencySymbol;

  // 1. Emergency fund
  if (kpis.emergencyFundMonths < 3) {
    insights.push({
      id: 'ins-emergency',
      severity: kpis.emergencyFundMonths < 1 ? 'critical' : 'warning',
      category: 'cashflow',
      title: 'Emergency fund critically low',
      description: `Your liquid assets cover only ${kpis.emergencyFundMonths.toFixed(1)} months of expenses. Recommended: 6 months minimum.`,
      impact: (6 - kpis.emergencyFundMonths) * kpis.monthlyExpenses,
      recommendation: `Build emergency fund of ${fmtCurrency(6 * kpis.monthlyExpenses, sym)} before pursuing aggressive investments.`,
    });
  }

  // 2. Savings rate
  if (kpis.savingsRate < 20) {
    insights.push({
      id: 'ins-savings',
      severity: kpis.savingsRate < 10 ? 'critical' : 'warning',
      category: 'savings',
      title: 'Savings rate below recommended threshold',
      description: `Your savings rate is ${kpis.savingsRate.toFixed(1)}%. Aim for 30%+ for wealth accumulation, 50%+ for FIRE.`,
      impact: kpis.monthlyIncome * 0.3 - kpis.monthlySurplus,
      recommendation: 'Reduce discretionary spending or increase income streams to reach 30%+ savings rate.',
    });
  } else if (kpis.savingsRate >= 50) {
    insights.push({
      id: 'ins-savings-good',
      severity: 'success',
      category: 'savings',
      title: 'Excellent savings rate',
      description: `Your savings rate of ${kpis.savingsRate.toFixed(1)}% positions you well for early financial independence.`,
      impact: 0,
      recommendation: 'Continue and consider tax-advantaged accounts for additional optimization.',
    });
  }

  // 3. Debt-to-income
  if (kpis.debtToIncomeRatio > 40) {
    insights.push({
      id: 'ins-dti',
      severity: kpis.debtToIncomeRatio > 60 ? 'critical' : 'warning',
      category: 'debt',
      title: 'High debt-to-income ratio',
      description: `EMIs consume ${kpis.debtToIncomeRatio.toFixed(1)}% of your income. Above 40% is risky; above 60% is dangerous.`,
      impact: kpis.monthlyIncome * (kpis.debtToIncomeRatio - 40) / 100,
      recommendation: 'Prioritize debt avalanche: pay off highest-interest loans first. Consider consolidation.',
    });
  }

  // 4. Insurance gaps
  const hasLife = state.insurance.some(p => p.type === 'life');
  const hasHealth = state.insurance.some(p => p.type === 'health');
  if (!hasLife) {
    insights.push({
      id: 'ins-life',
      severity: 'critical',
      category: 'insurance',
      title: 'No life insurance detected',
      description: 'Life insurance is critical for income replacement, especially if you have dependents.',
      impact: kpis.annualIncome * 10,
      recommendation: `Get term life coverage of at least ${fmtCurrency(kpis.annualIncome * 10, sym)} (10x annual income).`,
    });
  }
  if (!hasHealth) {
    insights.push({
      id: 'ins-health',
      severity: 'critical',
      category: 'insurance',
      title: 'No health insurance detected',
      description: 'Medical emergencies can wipe out years of wealth accumulation in days.',
      impact: 500000,
      recommendation: `Get family floater health cover of at least ${fmtCurrency(1000000, sym)}.`,
    });
  }

  // 5. Investment concentration
  const alloc = computeAllocation(state.assets);
  if (alloc.length > 0) {
    const topCategory = alloc[0];
    if (topCategory.pct > 60) {
      insights.push({
        id: 'ins-concentration',
        severity: 'warning',
        category: 'investment',
        title: 'Asset concentration risk',
        description: `${topCategory.label} represents ${topCategory.pct.toFixed(0)}% of your portfolio. Above 60% in one category is concentrated.`,
        impact: topCategory.value * 0.15,
        recommendation: 'Diversify across 4-6 asset categories to reduce concentration risk.',
      });
    }
    // Cash drag
    const cash = alloc.find(a => a.category === 'cash');
    if (cash && cash.pct > 25) {
      insights.push({
        id: 'ins-cash-drag',
        severity: 'info',
        category: 'investment',
        title: 'Excess idle cash',
        description: `${cash.pct.toFixed(0)}% of your portfolio is in cash. Idle cash loses purchasing power to inflation.`,
        impact: cash.value * (state.settings.inflationRate / 100),
        recommendation: 'Deploy surplus cash into investments per your asset allocation plan.',
      });
    }
  }

  // 6. Goal delays
  for (const g of state.goals) {
    const progressPct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
    const monthsLeft = Math.max(0, (new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    // Projected value
    const rM = (g.expectedReturnRate / 100) / 12;
    const projected = g.currentAmount * Math.pow(1 + rM, monthsLeft) +
      g.monthlyContribution * (rM > 0 ? ((Math.pow(1 + rM, monthsLeft) - 1) / rM) : monthsLeft);
    if (projected < g.targetAmount * 0.9 && g.targetAmount > 0) {
      insights.push({
        id: `ins-goal-${g.id}`,
        severity: 'warning',
        category: 'goal',
        title: `Goal "${g.name}" likely to miss target`,
        description: `Projected corpus ${fmtCurrency(projected, sym)} vs target ${fmtCurrency(g.targetAmount, sym)}. Shortfall: ${fmtCurrency(g.targetAmount - projected, sym)}.`,
        impact: g.targetAmount - projected,
        recommendation: `Increase monthly contribution by ${fmtCurrency(Math.max(0, (g.targetAmount - g.currentAmount * Math.pow(1 + rM, monthsLeft)) * rM / (Math.pow(1 + rM, monthsLeft) - 1)) - g.monthlyContribution, sym)} to stay on track.`,
      });
    } else if (progressPct >= 100) {
      insights.push({
        id: `ins-goal-${g.id}`,
        severity: 'success',
        category: 'goal',
        title: `Goal "${g.name}" achieved`,
        description: `Congratulations! You've reached ${progressPct.toFixed(0)}% of your target.`,
        impact: 0,
        recommendation: 'Consider setting a stretch goal or reallocating contributions to other priorities.',
      });
    }
  }

  // 7. Retirement readiness
  const retirement = computeRetirement(state);
  if (retirement.readinessPct < 50) {
    insights.push({
      id: 'ins-retirement',
      severity: retirement.readinessPct < 30 ? 'critical' : 'warning',
      category: 'retirement',
      title: 'Retirement corpus significantly behind',
      description: `Projected corpus at retirement covers only ${retirement.readinessPct.toFixed(0)}% of required corpus. Shortfall: ${fmtCurrency(retirement.shortfall, sym)}.`,
      impact: retirement.shortfall,
      recommendation: `Increase monthly investment by ${fmtCurrency(retirement.monthlyContributionRequired, sym)} to close the gap.`,
    });
  }

  // 8. Financial independence progress
  if (kpis.financialIndependencePct < 25) {
    insights.push({
      id: 'ins-fi',
      severity: 'info',
      category: 'retirement',
      title: 'Early stage of financial independence',
      description: `Passive income covers ${kpis.financialIndependencePct.toFixed(1)}% of expenses. Accelerate investment corpus growth.`,
      impact: 0,
      recommendation: 'Focus on building dividend, rental, and interest income streams alongside market investments.',
    });
  } else if (kpis.financialIndependencePct >= 100) {
    insights.push({
      id: 'ins-fi-achieved',
      severity: 'success',
      category: 'retirement',
      title: 'Financial Independence Achieved!',
      description: `Your passive income fully covers your expenses. You have achieved financial freedom.`,
      impact: 0,
      recommendation: 'Consider reducing active work, focus on legacy planning and philanthropy.',
    });
  }

  // 9. Tax optimization
  const taxAdvantaged = state.assets
    .filter(a => ['ppf', 'epf', 'nps'].includes(a.category))
    .reduce((s, a) => s + a.currentValue, 0);
  const taxBracket = state.settings.taxBracket;
  if (taxAdvantaged < 150000 && taxBracket > 20) {
    insights.push({
      id: 'ins-tax',
      severity: 'info',
      category: 'tax',
      title: 'Tax-advantaged accounts underutilized',
      description: `PPF/EPF/NPS corpus is ${fmtCurrency(taxAdvantaged, sym)}. Section 80C allows up to ${fmtCurrency(150000, sym)} deduction.`,
      impact: 150000 * (taxBracket / 100),
      recommendation: `Maximize PPF/NPS contributions to save ${fmtCurrency(150000 * (taxBracket / 100), sym)} in taxes annually.`,
    });
  }

  // Sort by severity
  const severityRank = { critical: 0, warning: 1, info: 2, success: 3 };
  return insights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
};

// ---------- Goal Projection ----------

export const projectGoal = (goal: Goal, monthsToTarget: number): {
  projectedCorpus: number;
  requiredMonthlyContribution: number;
  onTrack: boolean;
} => {
  const rM = (goal.expectedReturnRate / 100) / 12;
  const projectedCorpus = goal.currentAmount * Math.pow(1 + rM, monthsToTarget) +
    goal.monthlyContribution * (rM > 0 ? ((Math.pow(1 + rM, monthsToTarget) - 1) / rM) : monthsToTarget);
  const futureValueOfCurrent = goal.currentAmount * Math.pow(1 + rM, monthsToTarget);
  const shortfall = Math.max(0, goal.targetAmount - futureValueOfCurrent);
  const requiredMonthlyContribution = rM > 0
    ? (shortfall * rM) / (Math.pow(1 + rM, monthsToTarget) - 1)
    : shortfall / monthsToTarget;
  return {
    projectedCorpus,
    requiredMonthlyContribution,
    onTrack: projectedCorpus >= goal.targetAmount * 0.95,
  };
};

// ---------- Net Worth Projection (next N months) ----------

export const projectNetWorth = (state: WealthOSState, months: number): { month: number; date: string; value: number }[] => {
  const result: { month: number; date: string; value: number }[] = [];
  let netWorth = computeNetWorth(state);
  const monthlySurplus = sumMonthlyIncome(state.income) - sumMonthlyExpenses(state.expenses);
  const monthlyReturn = state.assets.reduce((s, a) => s + a.currentValue * (a.annualReturnRate / 100) / 12, 0);

  const now = new Date();
  for (let m = 0; m <= months; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    result.push({
      month: m,
      date: d.toISOString().slice(0, 7),
      value: Math.round(netWorth),
    });
    netWorth = netWorth + monthlyReturn + monthlySurplus;
  }
  return result;
};

// ---------- EMI Calculator ----------

export const calculateEMI = (principal: number, annualRatePct: number, tenureMonths: number): {
  emi: number;
  totalPayment: number;
  totalInterest: number;
} => {
  const r = annualRatePct / 100 / 12;
  if (r === 0) {
    const emi = principal / tenureMonths;
    return { emi, totalPayment: principal, totalInterest: 0 };
  }
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  const totalPayment = emi * tenureMonths;
  return { emi, totalPayment, totalInterest: totalPayment - principal };
};

// ---------- SIP Calculator ----------

export const calculateSIP = (
  monthlyInvestment: number,
  annualRatePct: number,
  years: number
): { maturityValue: number; totalInvested: number; gains: number; schedule: { month: number; invested: number; value: number }[] } => {
  const months = years * 12;
  const r = annualRatePct / 100 / 12;
  const maturityValue = monthlyInvestment * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
  const totalInvested = monthlyInvestment * months;
  const schedule: { month: number; invested: number; value: number }[] = [];
  let val = 0;
  for (let m = 0; m <= months; m++) {
    if (m > 0) val = (val + monthlyInvestment) * (1 + r);
    schedule.push({ month: m, invested: monthlyInvestment * m, value: Math.round(val) });
  }
  return { maturityValue, totalInvested, gains: maturityValue - totalInvested, schedule };
};

// ---------- Lumpsum Calculator ----------

export const calculateLumpsum = (principal: number, annualRatePct: number, years: number): {
  maturityValue: number; gains: number;
} => {
  const r = annualRatePct / 100;
  const maturityValue = principal * Math.pow(1 + r, years);
  return { maturityValue, gains: maturityValue - principal };
};

// ---------- SWP Calculator ----------

export const calculateSWP = (
  initialCorpus: number,
  monthlyWithdrawal: number,
  annualRatePct: number,
  months: number
): { schedule: { month: number; corpus: number; withdrawn: number }[]; exhausted: boolean; exhaustionMonth: number | null } => {
  const r = annualRatePct / 100 / 12;
  const schedule: { month: number; corpus: number; withdrawn: number }[] = [];
  let corpus = initialCorpus;
  let exhausted = false;
  let exhaustionMonth: number | null = null;
  for (let m = 0; m <= months; m++) {
    schedule.push({ month: m, corpus: Math.max(0, Math.round(corpus)), withdrawn: monthlyWithdrawal });
    if (corpus <= 0) {
      exhausted = true;
      exhaustionMonth = exhaustionMonth ?? m;
      break;
    }
    corpus = (corpus - monthlyWithdrawal) * (1 + r);
  }
  return { schedule, exhausted, exhaustionMonth };
};

// ---------- CAGR ----------

export const calculateCAGR = (initial: number, final: number, years: number): number => {
  if (initial <= 0 || years <= 0) return 0;
  return (Math.pow(final / initial, 1 / years) - 1) * 100;
};

// ---------- XIRR ----------

export const calculateXIRR = (cashflows: { date: Date; amount: number }[]): number => {
  if (cashflows.length < 2) return 0;
  const sorted = [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime());
  let rate = 0.1; // start guess 10%
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0;
    let deriv = 0;
    const t0 = sorted[0].date.getTime();
    for (const cf of sorted) {
      const years = (cf.date.getTime() - t0) / (1000 * 60 * 60 * 24 * 365);
      const factor = Math.pow(1 + rate, years);
      npv += cf.amount / factor;
      deriv += -years * cf.amount / (factor * (1 + rate));
    }
    if (Math.abs(npv) < 1e-6) break;
    if (deriv === 0) break;
    const newRate = rate - npv / deriv;
    if (!isFinite(newRate) || Math.abs(newRate - rate) < 1e-7) break;
    rate = newRate;
  }
  return rate * 100;
};

// ---------- Debt Payoff (Avalanche & Snowball) ----------

export const debtPayoffSchedule = (
  liabilities: Liability[],
  strategy: 'avalanche' | 'snowball',
  extraMonthly: number = 0,
): {
  strategy: 'avalanche' | 'snowball';
  totalMonths: number;
  totalInterestPaid: number;
  schedule: { month: number; payments: { id: string; name: string; payment: number; interest: number; balance: number }[]; totalBalance: number }[];
} => {
  // Sort: avalanche = highest rate first, snowball = lowest balance first
  const sorted = [...liabilities].sort((a, b) =>
    strategy === 'avalanche' ? b.interestRate - a.interestRate : a.outstandingBalance - b.outstandingBalance
  );

  // Working copy of balances
  const balances = sorted.map(l => ({ ...l, balance: l.outstandingBalance, totalInterest: 0 }));
  const schedule: any[] = [];
  let month = 0;
  const maxMonths = 600;

  while (balances.some(b => b.balance > 0.01) && month < maxMonths) {
    month++;
    const payments: any[] = [];
    // Pay minimum EMIs first
    for (const b of balances) {
      if (b.balance <= 0) {
        payments.push({ id: b.id, name: b.name, payment: 0, interest: 0, balance: 0 });
        continue;
      }
      const rM = b.interestRate / 100 / 12;
      const interest = b.balance * rM;
      let payment = Math.min(b.emi, b.balance + interest);
      let principalPaid = payment - interest;
      if (principalPaid < 0) principalPaid = 0;
      b.balance -= principalPaid;
      b.totalInterest += interest;
      payments.push({ id: b.id, name: b.name, payment, interest, balance: Math.max(0, b.balance) });
    }
    // Apply extra to first non-zero balance
    let extra = extraMonthly;
    for (let i = 0; i < balances.length && extra > 0; i++) {
      const b = balances[i];
      if (b.balance <= 0) continue;
      const applied = Math.min(extra, b.balance);
      b.balance -= applied;
      payments[i].payment += applied;
      payments[i].balance = Math.max(0, b.balance);
      extra -= applied;
    }
    const totalBalance = balances.reduce((s, b) => s + Math.max(0, b.balance), 0);
    schedule.push({ month, payments, totalBalance });
  }

  const totalInterestPaid = balances.reduce((s, b) => s + b.totalInterest, 0);
  return {
    strategy,
    totalMonths: month,
    totalInterestPaid,
    schedule,
  };
};

// ---------- Health Score Rating ----------

export const scoreRating = (score: number): { label: string; color: string } => {
  if (score >= 85) return { label: 'Elite',     color: 'oklch(0.78 0.13 75)'  };
  if (score >= 70) return { label: 'Excellent', color: 'oklch(0.72 0.18 152)' };
  if (score >= 55) return { label: 'Good',      color: 'oklch(0.78 0.15 200)' };
  if (score >= 40) return { label: 'Average',   color: 'oklch(0.78 0.15 70)'  };
  return { label: 'Poor', color: 'oklch(0.65 0.22 22)' };
};

// ---------- Years/Months formatter ----------

export const fmtDuration = (years: number): string => {
  if (!isFinite(years) || years >= 99) return 'N/A';
  if (years <= 0) return 'Achieved';
  const y = Math.floor(years);
  const m = Math.round((years - y) * 12);
  if (y === 0) return `${m} months`;
  return m > 0 ? `${y}y ${m}m` : `${y} years`;
};

// ============================================================
// Estate Planning Engine
// ============================================================

export const ESTATE_DOC_META: Record<string, { label: string; icon: string; description: string }> = {
  will:                { label: 'Will',                    icon: 'FileText',  description: 'Legal document specifying asset distribution after death' },
  trust:               { label: 'Trust',                   icon: 'Landmark',  description: 'Legal entity holding assets for beneficiaries' },
  nomination:          { label: 'Nomination',              icon: 'UserCheck', description: 'Nominee registered on specific assets/accounts' },
  power_of_attorney:   { label: 'Power of Attorney',       icon: 'FileSignature', description: 'Authorizes another to act on your behalf' },
  medical_directive:   { label: 'Medical Directive',       icon: 'HeartPulse', description: 'Healthcare wishes if you become incapacitated' },
  succession_plan:     { label: 'Succession Plan',         icon: 'Users',     description: 'Business succession & leadership transition plan' },
};

export const ESTATE_STATUS_META: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'oklch(0.65 0.22 22)'  },
  drafted:     { label: 'Drafted',     color: 'oklch(0.78 0.15 70)'  },
  registered:  { label: 'Registered',  color: 'oklch(0.72 0.18 152)' },
  outdated:    { label: 'Outdated',    color: 'oklch(0.65 0.22 22)'  },
};

export const computeEstateReadiness = (plan: EstatePlan): {
  score: number;
  rating: string;
  checks: { label: string; passed: boolean; weight: number }[];
} => {
  const checks: { label: string; passed: boolean; weight: number }[] = [
    { label: 'Registered Will in place',         passed: plan.documents.some(d => d.type === 'will' && d.status === 'registered'), weight: 25 },
    { label: 'At least 3 beneficiaries nominated', passed: plan.beneficiaries.length >= 3, weight: 15 },
    { label: 'Beneficiary shares total 100%',    passed: Math.abs(plan.beneficiaries.reduce((s, b) => s + b.sharePct, 0) - 100) < 0.5, weight: 15 },
    { label: 'Trust structure set up',           passed: plan.trustSetup, weight: 10 },
    { label: 'Executor designated',              passed: !!plan.executorName, weight: 10 },
    { label: 'Guardian for minor children',      passed: !!plan.guardianName, weight: 10 },
    { label: 'Power of Attorney in place',       passed: plan.documents.some(d => d.type === 'power_of_attorney' && d.status !== 'not_started'), weight: 8 },
    { label: 'Medical directive',                passed: plan.documents.some(d => d.type === 'medical_directive' && d.status !== 'not_started'), weight: 7 },
  ];
  let score = 0;
  for (const c of checks) if (c.passed) score += c.weight;
  score = Math.min(100, score);
  const rating = score >= 85 ? 'Elite' : score >= 70 ? 'Excellent' : score >= 55 ? 'Good' : score >= 40 ? 'Average' : 'Poor';
  return { score, rating, checks };
};

// ============================================================
// Children Planning Engine
// ============================================================

export const CHILD_MILESTONE_META: Record<string, { label: string; defaultAge: number; inflationPct: number }> = {
  primary_education:   { label: 'Primary Education',   defaultAge: 6,  inflationPct: 8  },
  secondary_education: { label: 'Secondary Education', defaultAge: 16, inflationPct: 8  },
  higher_education:    { label: 'Higher Education',    defaultAge: 18, inflationPct: 10 },
  marriage:            { label: 'Marriage',            defaultAge: 28, inflationPct: 7  },
  business_seed:       { label: 'Business Seed Fund',  defaultAge: 25, inflationPct: 6  },
  first_home:          { label: 'First Home',          defaultAge: 30, inflationPct: 6  },
};

export const projectChildMilestone = (
  milestone: ChildPlan['milestones'][number],
  currentAge: number,
  inflationRate: number,
): {
  yearsToMilestone: number;
  futureValue: number;
  projectedCorpus: number;
  shortfall: number;
  requiredMonthlyContribution: number;
  onTrack: boolean;
} => {
  const yearsToMilestone = Math.max(0, milestone.ageAtMilestone - currentAge);
  const months = yearsToMilestone * 12;
  // Inflate current target to future value
  const futureValue = milestone.targetAmount * Math.pow(1 + inflationRate / 100, yearsToMilestone);
  // Project current corpus
  const rM = (milestone.expectedReturnRate / 100) / 12;
  const projectedCorpus = milestone.currentCorpus * Math.pow(1 + rM, months) +
    milestone.monthlyContribution * (rM > 0 ? ((Math.pow(1 + rM, months) - 1) / rM) : months);
  const shortfall = Math.max(0, futureValue - projectedCorpus);
  const futureValueOfCurrent = milestone.currentCorpus * Math.pow(1 + rM, months);
  const requiredMonthlyContribution = rM > 0 && months > 0
    ? ((futureValue - futureValueOfCurrent) * rM) / (Math.pow(1 + rM, months) - 1)
    : months > 0 ? (futureValue - futureValueOfCurrent) / months : 0;
  return {
    yearsToMilestone,
    futureValue,
    projectedCorpus,
    shortfall,
    requiredMonthlyContribution: Math.max(0, requiredMonthlyContribution),
    onTrack: projectedCorpus >= futureValue * 0.95,
  };
};

// ============================================================
// Elder Care Engine
// ============================================================

export const ELDER_CARE_NEED_META: Record<string, { label: string; defaultInflation: number }> = {
  medical:          { label: 'Medical Care',       defaultInflation: 10 },
  housing:          { label: 'Housing / Rent',     defaultInflation: 6  },
  caregiver:        { label: 'Caregiver',          defaultInflation: 8  },
  insurance:        { label: 'Insurance Premium',  defaultInflation: 12 },
  monthly_support:  { label: 'Monthly Support',    defaultInflation: 6  },
  emergency_fund:   { label: 'Emergency Fund',     defaultInflation: 5  },
};

export const projectElderCare = (plan: ElderCarePlan): {
  totalAnnualCostToday: number;
  totalLifetimeCost: number;
  totalInflatedAnnual: number;
  insuranceGap: number;
} => {
  const totalAnnualCostToday = plan.needs.reduce((s, n) => s + n.annualCost, 0) + plan.monthlySupport * 12;
  let totalLifetimeCost = 0;
  let totalInflatedAnnual = 0;
  for (const n of plan.needs) {
    for (let y = 0; y < n.yearsNeeded; y++) {
      totalLifetimeCost += n.annualCost * Math.pow(1 + n.inflationRate / 100, y);
    }
    totalInflatedAnnual += n.annualCost * Math.pow(1 + n.inflationRate / 100, 5);
  }
  // Insurance gap = lifetime cost - insurance coverage
  const insuranceGap = Math.max(0, totalLifetimeCost - plan.insuranceCoverage);
  return {
    totalAnnualCostToday,
    totalLifetimeCost,
    totalInflatedAnnual,
    insuranceGap,
  };
};

// ============================================================
// Document Vault
// ============================================================

export const DOCUMENT_CATEGORY_META: Record<string, { label: string; color: string }> = {
  tax:        { label: 'Tax Documents',     color: 'oklch(0.78 0.15 70)'  },
  insurance:  { label: 'Insurance Policies', color: 'oklch(0.72 0.18 152)' },
  loan:       { label: 'Loan Agreements',    color: 'oklch(0.65 0.22 22)'  },
  property:   { label: 'Property Records',   color: 'oklch(0.68 0.13 220)' },
  investment: { label: 'Investment Statements', color: 'oklch(0.78 0.13 75)' },
  legal:      { label: 'Legal Documents',    color: 'oklch(0.74 0.20 295)' },
  estate:     { label: 'Estate Documents',   color: 'oklch(0.78 0.15 200)' },
  identity:   { label: 'Identity Documents', color: 'oklch(0.72 0.18 152)' },
  other:      { label: 'Other',              color: 'oklch(0.60 0.02 240)' },
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// ============================================================
// Authentication (PIN Hashing — SHA-256)
// ============================================================

export const hashPin = async (pin: string): Promise<string> => {
  // Use Web Crypto API — available in browsers and Node 20+
  const encoder = new TextEncoder();
  const data = encoder.encode(`wealthos-salt::${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  const computed = await hashPin(pin);
  return computed === hash;
};

// Synchronous fallback for cases where async isn't viable (not cryptographic-grade but adequate for demo)
export const hashPinSync = (pin: string): string => {
  let h = 0x811c9dc5;
  const s = `wealthos-salt::${pin}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Add a second pass for more dispersion
  let h2 = 0xdeadbeef;
  for (let i = 0; i < s.length; i++) {
    h2 = Math.imul(h2 ^ s.charCodeAt(i), 0x85ebca6b);
    h2 = Math.imul(h2 ^ (h2 >>> 13), 0xc2b2ae35);
  }
  return (h >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
};

export const verifyPinSync = (pin: string, hash: string): boolean => {
  return hashPinSync(pin) === hash;
};

// ============================================================
// PDF Report Generation (browser-based, no server)
// ============================================================

export const generateReportHTML = (
  state: WealthOSState,
  reportType: string,
): string => {
  const kpis = computeKPIs(state);
  const fire = computeFIRE(state);
  const sym = state.settings.currencySymbol;
  const now = new Date().toLocaleString('en-IN');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${reportType} — WealthOS Infinity</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.5; margin: 0; }
  .header { background: linear-gradient(135deg, #1a1f2e, #2d1f0a); color: #d4af37; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
  .header h1 { margin: 0 0 6px 0; font-size: 28px; }
  .header .subtitle { color: #888; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
  .header .meta { color: #fff; font-size: 11px; margin-top: 12px; }
  h2 { color: #1a1f2e; border-bottom: 2px solid #d4af37; padding-bottom: 6px; font-size: 16px; margin-top: 28px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .metric { padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; }
  .metric .label { color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .metric .value { font-size: 18px; font-weight: 700; color: #1a1f2e; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
  th { background: #1a1f2e; color: #fff; text-align: left; padding: 8px; font-weight: 600; }
  td { padding: 8px; border-bottom: 1px solid #e5e5e5; }
  tr:nth-child(even) td { background: #f8f8f8; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #888; font-size: 10px; text-align: center; }
  .score-box { display: inline-block; padding: 20px 30px; border: 3px solid #d4af37; border-radius: 50%; text-align: center; margin: 10px; }
  .score-box .score { font-size: 36px; font-weight: 700; color: #1a1f2e; }
  .score-box .label { font-size: 11px; color: #666; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="header">
    <div class="subtitle">WealthOS Infinity • Private Banking Report</div>
    <h1>${reportType}</h1>
    <div class="meta">
      <strong>${state.settings.profileName}</strong> &nbsp;•&nbsp; Generated ${now} &nbsp;•&nbsp; Currency: ${state.settings.currency}
    </div>
  </div>

  <h2>Executive Summary</h2>
  <div class="grid">
    <div class="metric"><div class="label">Net Worth</div><div class="value">${fmtFullCurrency(kpis.netWorth, sym)}</div></div>
    <div class="metric"><div class="label">Total Assets</div><div class="value">${fmtFullCurrency(kpis.totalAssets, sym)}</div></div>
    <div class="metric"><div class="label">Total Liabilities</div><div class="value">${fmtFullCurrency(kpis.totalLiabilities, sym)}</div></div>
    <div class="metric"><div class="label">Monthly Surplus</div><div class="value">${fmtFullCurrency(kpis.monthlySurplus, sym)}</div></div>
    <div class="metric"><div class="label">Savings Rate</div><div class="value">${kpis.savingsRate.toFixed(1)}%</div></div>
    <div class="metric"><div class="label">Emergency Fund</div><div class="value">${kpis.emergencyFundMonths.toFixed(1)} months</div></div>
    <div class="metric"><div class="label">Debt/Income Ratio</div><div class="value">${kpis.debtToIncomeRatio.toFixed(1)}%</div></div>
    <div class="metric"><div class="label">FIRE Number</div><div class="value">${fmtFullCurrency(fire.fireNumber, sym)}</div></div>
  </div>

  <h2>Health Scores</h2>
  <div style="text-align:center; margin: 20px 0;">
    <div class="score-box"><div class="score">${kpis.wealthHealthScore}</div><div class="label">Wealth Health</div></div>
    <div class="score-box"><div class="score">${kpis.financialHealthScore}</div><div class="label">Financial Health</div></div>
    <div class="score-box"><div class="score">${fire.progressPct.toFixed(0)}%</div><div class="label">FIRE Progress</div></div>
  </div>

  <h2>Asset Allocation</h2>
  <table>
    <thead><tr><th>Category</th><th>Invested</th><th>Current Value</th><th>Gain</th><th>Return %</th><th>Allocation %</th></tr></thead>
    <tbody>
      ${computeAllocation(state.assets).map(a => `
        <tr>
          <td>${a.label}</td>
          <td>${fmtFullCurrency(a.investedValue, sym)}</td>
          <td>${fmtFullCurrency(a.value, sym)}</td>
          <td style="color:${a.unrealizedGain >= 0 ? 'green' : 'red'}">${a.unrealizedGain >= 0 ? '+' : ''}${fmtFullCurrency(a.unrealizedGain, sym)}</td>
          <td style="color:${a.gainPct >= 0 ? 'green' : 'red'}">${a.gainPct.toFixed(1)}%</td>
          <td>${a.pct.toFixed(1)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Active Liabilities</h2>
  <table>
    <thead><tr><th>Loan</th><th>Outstanding</th><th>EMI</th><th>Rate</th><th>Tenure Left</th></tr></thead>
    <tbody>
      ${state.liabilities.map(l => `
        <tr>
          <td>${l.name}</td>
          <td>${fmtFullCurrency(l.outstandingBalance, sym)}</td>
          <td>${fmtFullCurrency(l.emi, sym)}</td>
          <td>${l.interestRate.toFixed(1)}%</td>
          <td>${l.tenureMonthsRemaining} months</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Goals Tracking</h2>
  <table>
    <thead><tr><th>Goal</th><th>Target</th><th>Current</th><th>Progress</th><th>Monthly</th></tr></thead>
    <tbody>
      ${state.goals.map(g => {
        const pct = (g.currentAmount / g.targetAmount) * 100;
        return `<tr>
          <td>${g.name}</td>
          <td>${fmtFullCurrency(g.targetAmount, sym)}</td>
          <td>${fmtFullCurrency(g.currentAmount, sym)}</td>
          <td>${pct.toFixed(1)}%</td>
          <td>${fmtFullCurrency(g.monthlyContribution, sym)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <strong>WealthOS Infinity</strong> • Personal CFO & Family Office Platform • Offline-First • AES-256 Encrypted<br/>
    This report was generated locally on your device. No data was transmitted to any server.
  </div>
</body>
</html>`;
};

export const downloadReport = (html: string, filename: string) => {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

