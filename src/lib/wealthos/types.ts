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
  | 'children'
  | 'eldercare'
  | 'estate'
  | 'documents'
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

// Recurring frequency for income & expense entries.
// The engine converts any frequency to a monthly equivalent for calculations.
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

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
  amount: number;            // amount per occurrence (per the frequency)
  frequency: Frequency;      // how often this amount occurs
  customDays?: number;       // when frequency === 'custom', interval in days
  active: boolean;
}

export interface ExpenseEntry {
  id: string;
  category: ExpenseCategory;
  label: string;
  amount: number;            // amount per occurrence (per the frequency)
  frequency: Frequency;      // how often this amount occurs
  customDays?: number;       // when frequency === 'custom', interval in days
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

// ============================================================
// Estate Planning
// ============================================================

export type EstateDocumentType =
  | 'will'
  | 'trust'
  | 'nomination'
  | 'power_of_attorney'
  | 'medical_directive'
  | 'succession_plan';

export type EstateStatus = 'not_started' | 'drafted' | 'registered' | 'outdated';

export interface EstateDocument {
  id: string;
  type: EstateDocumentType;
  title: string;
  status: EstateStatus;
  lastUpdated: string;
  nextReviewDate?: string;
  notes?: string;
  attachmentsCount: number;
}

export interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  sharePct: number;       // % of estate
  assetIds: string[];     // specific assets nominated
  notes?: string;
}

export interface EstatePlan {
  documents: EstateDocument[];
  beneficiaries: Beneficiary[];
  executorName?: string;
  guardianName?: string;  // for minor children
  trustSetup: boolean;
  hasRegisteredWill: boolean;
}

// ============================================================
// Children & Elder Care Planning
// ============================================================

export type ChildMilestone =
  | 'primary_education'
  | 'secondary_education'
  | 'higher_education'
  | 'marriage'
  | 'business_seed'
  | 'first_home';

export interface ChildPlan {
  id: string;
  childId: string;       // ref to FamilyMember
  childName: string;
  currentAge: number;
  milestones: {
    id: string;
    type: ChildMilestone;
    ageAtMilestone: number;
    targetAmount: number;       // future value (inflated)
    currentCorpus: number;
    monthlyContribution: number;
    expectedReturnRate: number;
  }[];
}

export type ElderCareNeed =
  | 'medical'
  | 'housing'
  | 'caregiver'
  | 'insurance'
  | 'monthly_support'
  | 'emergency_fund';

export interface ElderCarePlan {
  id: string;
  elderId: string;       // ref to FamilyMember
  elderName: string;
  age: number;
  monthlySupport: number;
  annualMedicalCost: number;
  insuranceCoverage: number;
  needs: {
    id: string;
    type: ElderCareNeed;
    description: string;
    annualCost: number;
    inflationRate: number;
    yearsNeeded: number;
  }[];
}

// ============================================================
// Document Vault
// ============================================================

export type DocumentCategory =
  | 'tax'
  | 'insurance'
  | 'loan'
  | 'property'
  | 'investment'
  | 'legal'
  | 'estate'
  | 'identity'
  | 'other';

export interface VaultDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  issuer?: string;
  documentDate?: string;
  expiryDate?: string;
  tags: string[];
  encrypted: boolean;
  sizeBytes: number;
  notes?: string;
  addedAt: string;
  // In a real Flutter app this would be the file path/hash on device storage.
  // In the web preview we store metadata only.
  reference?: string;
}

// ============================================================
// Authentication
// ============================================================

export interface AuthState {
  pinHash?: string;        // SHA-256 hash of PIN, never store raw
  biometricEnabled: boolean;
  autoLockMinutes: number;
  hint?: string;
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
  estatePlan: EstatePlan;
  childPlans: ChildPlan[];
  elderCarePlans: ElderCarePlan[];
  documents: VaultDocument[];
  auth: AuthState;
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
