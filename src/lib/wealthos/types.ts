// ============================================================
// WealthOS Infinity — Domain Models
// ============================================================

export type ViewId =
  | 'dashboard'
  | 'wealth'
  | 'assets'
  | 'investments'
  | 'liabilities'
  | 'cashflow'
  | 'goals'
  | 'retirement'
  | 'fire'
  | 'insurance'
  | 'taxes'
  | 'family'
  | 'calculators'
  | 'simulation'
  | 'insights'
  | 'reports'
  | 'settings';

export type AssetCategory =
  | 'cash'
  | 'mutual_funds'
  | 'stocks'
  | 'etf'
  | 'bonds'
  | 'ppf'
  | 'epf'
  | 'nps'
  | 'gold'
  | 'silver'
  | 'crypto'
  | 'real_estate'
  | 'land'
  | 'vehicles'
  | 'business'
  | 'private_equity'
  | 'esop'
  | 'rsu'
  | 'foreign'
  | 'collectibles';

export type LiabilityType =
  | 'home_loan'
  | 'education_loan'
  | 'personal_loan'
  | 'business_loan'
  | 'credit_card'
  | 'mortgage'
  | 'auto_loan'
  | 'other';

export type IncomeSource =
  | 'salary'
  | 'bonus'
  | 'dividend'
  | 'rental'
  | 'interest'
  | 'business'
  | 'freelance'
  | 'capital_gains'
  | 'other';

export type ExpenseCategory =
  | 'housing'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'healthcare'
  | 'education'
  | 'lifestyle'
  | 'discretionary'
  | 'insurance'
  | 'taxes'
  | 'other';

export type GoalType =
  | 'retirement'
  | 'house'
  | 'vehicle'
  | 'marriage'
  | 'education'
  | 'vacation'
  | 'business'
  | 'emergency_fund'
  | 'financial_freedom'
  | 'other';

export type InsuranceType =
  | 'health'
  | 'life'
  | 'disability'
  | 'critical_illness'
  | 'property'
  | 'auto';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  currentValue: number;
  investedValue: number;
  annualReturnRate: number;
  liquidity: 'high' | 'medium' | 'low' | 'illiquid';
  notes?: string;
  updatedAt: string;
}

export interface Liability {
  id: string;
  name: string;
  type: LiabilityType;
  outstandingBalance: number;
  originalPrincipal: number;
  interestRate: number;
  emi: number;
  tenureMonthsRemaining: number;
  startDate: string;
  notes?: string;
}

export interface IncomeEntry {
  id: string;
  source: IncomeSource;
  label: string;
  monthlyAmount: number;
  active: boolean;
}

export interface ExpenseEntry {
  id: string;
  category: ExpenseCategory;
  label: string;
  monthlyAmount: number;
  essential: boolean;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  expectedReturnRate: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface InsurancePolicy {
  id: string;
  type: InsuranceType;
  provider: string;
  coverageAmount: number;
  annualPremium: number;
  maturityDate?: string;
  notes?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  age: number;
  dependent: boolean;
}

export interface Settings {
  country: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  inflationRate: number;
  salaryGrowthRate: number;
  expectedMarketReturn: number;
  marketVolatility: number;
  safeWithdrawalRate: number;
  retirementAge: number;
  currentAge: number;
  lifeExpectancy: number;
  taxBracket: number;
  userMode: 'personal' | 'couple' | 'family' | 'business' | 'family_office';
  profileName: string;
}

export interface NetWorthSnapshot {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export interface WealthOSState {
  settings: Settings;
  assets: Asset[];
  liabilities: Liability[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  goals: Goal[];
  insurance: InsurancePolicy[];
  family: FamilyMember[];
  netWorthHistory: NetWorthSnapshot[];
  activeView: ViewId;
}

export interface KPIMetrics {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySurplus: number;
  annualIncome: number;
  annualExpenses: number;
  annualSurplus: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  debtToAssetRatio: number;
  emergencyFundMonths: number;
  liquidityRatio: number;
  investmentRatio: number;
  passiveIncomeMonthly: number;
  financialIndependencePct: number;
  wealthHealthScore: number;
  financialHealthScore: number;
  netWorthChangePct: number;
  annualGrowthProjection: number;
}

export interface AssetAllocation {
  category: AssetCategory;
  label: string;
  value: number;
  pct: number;
  investedValue: number;
  unrealizedGain: number;
  gainPct: number;
}

export interface CashFlowBreakdown {
  income: { source: IncomeSource; label: string; amount: number; pct: number }[];
  expenses: { category: ExpenseCategory; label: string; amount: number; pct: number; essential: boolean }[];
  surplus: number;
}

export interface FIRCEResult {
  fireNumber: number;
  currentCorpus: number;
  progressPct: number;
  yearsToFire: number;
  fireDate: string;
  monthlyContributionRequired: number;
  fireType: 'lean' | 'regular' | 'fat' | 'coast' | 'barista';
  annualExpenses: number;
  safeWithdrawalRate: number;
}

export interface RetirementProjection {
  retirementCorpus: number;
  corpusAtRetirement: number;
  shortfall: number;
  surplus: number;
  monthlyContributionRequired: number;
  yearsToRetirement: number;
  readinessPct: number;
  projectedAnnualIncomeAtRetirement: number;
}

export interface Insight {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  category: 'savings' | 'debt' | 'insurance' | 'tax' | 'retirement' | 'goal' | 'investment' | 'cashflow';
  title: string;
  description: string;
  impact: number;
  recommendation: string;
}

export interface MonteCarloResult {
  best: number;
  median: number;
  worst: number;
  successRate: number;
  paths: number[][];
}
