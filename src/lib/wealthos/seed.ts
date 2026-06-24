// ============================================================
// WealthOS Infinity — Seed Data & Empty State
// New users start with an empty profile. They can either:
//   1. Add their own data manually via the various modules
//   2. Click "Load Sample Data" in the Command Center to
//      populate the demo profile (32-year-old tech professional)
// ============================================================

import type { WealthOSState } from './types';

// Deterministic IDs (no Math.random) — prevents SSR hydration mismatch
const id = (prefix: string, n: number) => `${prefix}-${n.toString(36).padStart(4, '0')}`;

// ============================================================
// EMPTY STATE — what new users see on first launch
// ============================================================

export const createEmptyState = (): WealthOSState => {
  const now = new Date();
  const isoNow = now.toISOString();
  void isoNow;

  return {
    settings: {
      country: 'India',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      inflationRate: 6.2,
      salaryGrowthRate: 8,
      expectedMarketReturn: 12,
      marketVolatility: 15,
      safeWithdrawalRate: 4,
      retirementAge: 55,
      currentAge: 30,
      lifeExpectancy: 85,
      taxBracket: 30,
      userMode: 'personal',
      profileName: 'New User',
    },
    assets: [],
    liabilities: [],
    income: [],
    expenses: [],
    goals: [],
    insurance: [],
    family: [],
    netWorthHistory: [],
    activeView: 'dashboard',
    estatePlan: {
      documents: [],
      beneficiaries: [],
      executorName: undefined,
      guardianName: undefined,
      trustSetup: false,
      hasRegisteredWill: false,
    },
    childPlans: [],
    elderCarePlans: [],
    documents: [],
    auth: {
      pinHash: undefined,
      biometricEnabled: true,
      autoLockMinutes: 5,
      hint: undefined,
    },
  };
};

// ============================================================
// SAMPLE DATA — loaded when user clicks "Load Sample Data"
// Realistic profile: 32-year-old tech professional in India
// ============================================================

export const createSampleData = (): WealthOSState => {
  const now = new Date();
  const isoNow = now.toISOString();

  // Generate 24 months of net worth history (deterministic growth)
  const netWorthHistory = [];
  let baseAssets = 5500000;
  let baseLiabilities = 4200000;
  // Use a seeded pseudo-random for deterministic history
  let seed = 12345;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const growth = 1 + (0.012 + rand() * 0.015);
    baseAssets = baseAssets * growth + 45000;
    baseLiabilities = Math.max(3800000, baseLiabilities - 18000);
    netWorthHistory.push({
      date: d.toISOString().slice(0, 7),
      netWorth: Math.round(baseAssets - baseLiabilities),
      assets: Math.round(baseAssets),
      liabilities: Math.round(baseLiabilities),
    });
  }

  let n = 0;
  const nextId = (p: string) => id(p, ++n);

  return {
    settings: {
      country: 'India',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      inflationRate: 6.2,
      salaryGrowthRate: 8,
      expectedMarketReturn: 12,
      marketVolatility: 15,
      safeWithdrawalRate: 4,
      retirementAge: 55,
      currentAge: 32,
      lifeExpectancy: 85,
      taxBracket: 30,
      userMode: 'personal',
      profileName: 'Aarav Mehta',
    },
    assets: [
      // Cash
      { id: nextId('a'), name: 'HDFC Savings',         category: 'cash',           currentValue: 450000,   investedValue: 450000,   annualReturnRate: 3.5,  liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'ICICI Current A/c',    category: 'cash',           currentValue: 180000,   investedValue: 180000,   annualReturnRate: 3,    liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'Liquid Fund - Axis',   category: 'cash',           currentValue: 320000,   investedValue: 300000,   annualReturnRate: 6.2,  liquidity: 'high',     updatedAt: isoNow },

      // Mutual Funds
      { id: nextId('a'), name: 'Parag Parikh Flexi Cap',  category: 'mutual_funds', currentValue: 1850000, investedValue: 1400000, annualReturnRate: 15.5, liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'Mirae Asset Large Cap',   category: 'mutual_funds', currentValue: 920000,  investedValue: 780000,  annualReturnRate: 13.2, liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'Nippon India Small Cap',  category: 'mutual_funds', currentValue: 670000,  investedValue: 480000,  annualReturnRate: 22.8, liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'HDFC Mid Cap',            category: 'mutual_funds', currentValue: 540000,  investedValue: 410000,  annualReturnRate: 18.4, liquidity: 'high',     updatedAt: isoNow },

      // Stocks
      { id: nextId('a'), name: 'RELIANCE Industries',   category: 'stocks',        currentValue: 420000,   investedValue: 320000,   annualReturnRate: 14,   liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'TCS',                   category: 'stocks',        currentValue: 285000,   investedValue: 240000,   annualReturnRate: 11,   liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'HDFC Bank',             category: 'stocks',        currentValue: 195000,   investedValue: 210000,   annualReturnRate: 9,    liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'INFY',                  category: 'stocks',        currentValue: 220000,   investedValue: 165000,   annualReturnRate: 13,   liquidity: 'high',     updatedAt: isoNow },

      // ETF
      { id: nextId('a'), name: 'NIFTYBEES',             category: 'etf',           currentValue: 380000,   investedValue: 290000,   annualReturnRate: 13,   liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'GOLDBEES',              category: 'etf',           currentValue: 165000,   investedValue: 140000,   annualReturnRate: 8,    liquidity: 'high',     updatedAt: isoNow },

      // Bonds
      { id: nextId('a'), name: 'Govt Bond 7.18% 2033',  category: 'bonds',         currentValue: 250000,   investedValue: 250000,   annualReturnRate: 7.18, liquidity: 'medium',   updatedAt: isoNow },

      // PPF / EPF / NPS
      { id: nextId('a'), name: 'PPF Account',           category: 'ppf',           currentValue: 890000,   investedValue: 700000,   annualReturnRate: 7.1,  liquidity: 'low',      updatedAt: isoNow },
      { id: nextId('a'), name: 'EPF Corpus',            category: 'epf',           currentValue: 1250000,  investedValue: 980000,   annualReturnRate: 8.25, liquidity: 'low',      updatedAt: isoNow },
      { id: nextId('a'), name: 'NPS Tier-1',            category: 'nps',           currentValue: 380000,   investedValue: 300000,   annualReturnRate: 10.5, liquidity: 'low',      updatedAt: isoNow },

      // Gold (physical)
      { id: nextId('a'), name: 'Gold (Physical)',       category: 'gold',          currentValue: 480000,   investedValue: 380000,   annualReturnRate: 9,    liquidity: 'medium',   updatedAt: isoNow },

      // Crypto
      { id: nextId('a'), name: 'Bitcoin',               category: 'crypto',        currentValue: 220000,   investedValue: 150000,   annualReturnRate: 25,   liquidity: 'high',     updatedAt: isoNow },
      { id: nextId('a'), name: 'Ethereum',              category: 'crypto',        currentValue: 95000,    investedValue: 80000,    annualReturnRate: 22,   liquidity: 'high',     updatedAt: isoNow },

      // Real Estate
      { id: nextId('a'), name: '3BHK Apartment Pune',   category: 'real_estate',   currentValue: 9500000,  investedValue: 7500000,  annualReturnRate: 7,    liquidity: 'illiquid', updatedAt: isoNow },
      { id: nextId('a'), name: 'Plot - Bangalore Outskirts', category: 'land',     currentValue: 2200000,  investedValue: 1400000,  annualReturnRate: 11,   liquidity: 'illiquid', updatedAt: isoNow },

      // Vehicle
      { id: nextId('a'), name: 'Honda City 2022',       category: 'vehicles',      currentValue: 1100000,  investedValue: 1500000,  annualReturnRate: -10,  liquidity: 'low',      updatedAt: isoNow },

      // ESOPs
      { id: nextId('a'), name: 'Company ESOPs (Unlisted)', category: 'esop',       currentValue: 1500000,  investedValue: 600000,   annualReturnRate: 18,   liquidity: 'illiquid', updatedAt: isoNow },

      // Foreign assets
      { id: nextId('a'), name: 'US Stocks - VOO',       category: 'foreign',       currentValue: 380000,   investedValue: 280000,   annualReturnRate: 12,   liquidity: 'high',     updatedAt: isoNow },
    ],
    liabilities: [
      { id: nextId('l'), name: 'Home Loan - HDFC',      type: 'home_loan',      outstandingBalance: 3800000, originalPrincipal: 5500000, interestRate: 8.4,  emi: 48500,  tenureMonthsRemaining: 168, startDate: '2019-06-15', notes: 'Pune apartment' },
      { id: nextId('l'), name: 'Auto Loan - HDFC',      type: 'auto_loan',      outstandingBalance: 420000,  originalPrincipal: 900000,  interestRate: 9.2,  emi: 12500,  tenureMonthsRemaining: 36,  startDate: '2022-03-10' },
      { id: nextId('l'), name: 'Credit Card - Axis',    type: 'credit_card',    outstandingBalance: 85000,   originalPrincipal: 85000,   interestRate: 36,   emi: 12000,  tenureMonthsRemaining: 8,   startDate: '2024-01-01' },
      { id: nextId('l'), name: 'Education Loan - SBI',  type: 'education_loan', outstandingBalance: 280000,  originalPrincipal: 500000,  interestRate: 10.5, emi: 7500,   tenureMonthsRemaining: 48,  startDate: '2018-08-01' },
    ],
    income: [
      { id: nextId('i'), source: 'salary',    label: 'Primary Salary',         amount: 280000, frequency: 'monthly', active: true  },
      { id: nextId('i'), source: 'bonus',     label: 'Annual Bonus (avg)',     amount: 300000, frequency: 'yearly',  active: true  },
      { id: nextId('i'), source: 'freelance', label: 'Consulting',             amount: 45000,  frequency: 'monthly', active: true  },
      { id: nextId('i'), source: 'dividend',  label: 'Stock Dividends',        amount: 8000,   frequency: 'monthly', active: true  },
      { id: nextId('i'), source: 'rental',    label: 'Rental Income',          amount: 22000,  frequency: 'monthly', active: true  },
      { id: nextId('i'), source: 'interest',  label: 'FD & Savings Interest',  amount: 5500,   frequency: 'monthly', active: true  },
    ],
    expenses: [
      { id: nextId('e'), category: 'housing',     label: 'Rent / Maintenance',  amount: 18000, frequency: 'monthly', essential: true  },
      { id: nextId('e'), category: 'food',        label: 'Groceries & Dining',  amount: 28000, frequency: 'monthly', essential: true  },
      { id: nextId('e'), category: 'transport',   label: 'Fuel & Cab',          amount: 12000, frequency: 'monthly', essential: true  },
      { id: nextId('e'), category: 'utilities',   label: 'Electricity/Water/Net', amount: 6500, frequency: 'monthly', essential: true  },
      { id: nextId('e'), category: 'healthcare',  label: 'Health & Wellness',   amount: 8000,  frequency: 'monthly', essential: true  },
      { id: nextId('e'), category: 'education',   label: 'Skill Development',   amount: 10000, frequency: 'monthly', essential: false },
      { id: nextId('e'), category: 'lifestyle',   label: 'Newspaper & Magazines', amount: 800, frequency: 'monthly', essential: false },
      { id: nextId('e'), category: 'discretionary', label: 'Entertainment',     amount: 15000, frequency: 'monthly', essential: false },
      { id: nextId('e'), category: 'discretionary', label: 'Travel (avg)',      amount: 25000, frequency: 'monthly', essential: false },
      { id: nextId('e'), category: 'insurance',   label: 'Insurance Premiums',  amount: 102000, frequency: 'yearly', essential: true  },
      { id: nextId('e'), category: 'other',       label: 'Miscellaneous',       amount: 7000,  frequency: 'monthly', essential: false },
    ],
    goals: [
      { id: nextId('g'), name: 'Retirement Corpus',   type: 'retirement',       targetAmount: 120000000, currentAmount: 8800000, monthlyContribution: 85000, targetDate: '2048-12-31', expectedReturnRate: 12, priority: 'critical' },
      { id: nextId('g'), name: 'Child Education',     type: 'education',        targetAmount: 50000000,  currentAmount: 2100000, monthlyContribution: 35000, targetDate: '2040-06-30', expectedReturnRate: 12, priority: 'high'     },
      { id: nextId('g'), name: 'Second Home',         type: 'house',            targetAmount: 25000000,  currentAmount: 3500000, monthlyContribution: 50000, targetDate: '2030-12-31', expectedReturnRate: 10, priority: 'medium'   },
      { id: nextId('g'), name: 'Dream Vacation',      type: 'vacation',         targetAmount: 1500000,   currentAmount: 450000,  monthlyContribution: 15000, targetDate: '2026-12-31', expectedReturnRate: 8,  priority: 'low'      },
      { id: nextId('g'), name: 'Emergency Fund',      type: 'emergency_fund',   targetAmount: 1200000,   currentAmount: 950000,  monthlyContribution: 8000,  targetDate: '2025-12-31', expectedReturnRate: 6,  priority: 'high'     },
    ],
    insurance: [
      { id: nextId('ins'), type: 'health',            provider: 'Star Health',  coverageAmount: 1000000, annualPremium: 38000,  maturityDate: undefined, notes: 'Family Floater' },
      { id: nextId('ins'), type: 'life',              provider: 'HDFC Life',    coverageAmount: 20000000, annualPremium: 45000, maturityDate: '2055-12-31', notes: 'Term Plan' },
      { id: nextId('ins'), type: 'critical_illness',  provider: 'Max Bupa',     coverageAmount: 2500000, annualPremium: 18000,  notes: '' },
      { id: nextId('ins'), type: 'property',          provider: 'ICICI Lombard', coverageAmount: 9500000, annualPremium: 22000, notes: 'Home Building' },
      { id: nextId('ins'), type: 'auto',              provider: 'Bajaj Allianz', coverageAmount: 1100000, annualPremium: 14000, notes: 'Honda City Comprehensive' },
    ],
    family: [
      { id: nextId('f'), name: 'Aarav Mehta',  relationship: 'self',   age: 32, dependent: false },
      { id: nextId('f'), name: 'Diya Mehta',   relationship: 'spouse', age: 29, dependent: false },
      { id: nextId('f'), name: 'Vivaan Mehta', relationship: 'child',  age: 4,  dependent: true  },
      { id: nextId('f'), name: 'Rajesh Mehta', relationship: 'parent', age: 62, dependent: true  },
    ],
    netWorthHistory,
    activeView: 'dashboard',
    estatePlan: {
      documents: [
        { id: nextId('ed'), type: 'will',                title: 'Last Will & Testament',       status: 'registered',  lastUpdated: '2024-03-15', nextReviewDate: '2027-03-15', notes: 'Registered with sub-registrar, Pune', attachmentsCount: 3 },
        { id: nextId('ed'), type: 'nomination',          title: 'MF Nominations Update',       status: 'registered',  lastUpdated: '2024-08-01', nextReviewDate: '2026-08-01', notes: 'Updated nominees across all AMC folios', attachmentsCount: 1 },
        { id: nextId('ed'), type: 'power_of_attorney',   title: 'General PoA — Spouse',        status: 'drafted',     lastUpdated: '2024-01-20', nextReviewDate: '2026-01-20', notes: 'Drafted, needs notarization', attachmentsCount: 1 },
        { id: nextId('ed'), type: 'medical_directive',   title: 'Living Will / Advance Directive', status: 'not_started', lastUpdated: new Date().toISOString().slice(0, 10), notes: '', attachmentsCount: 0 },
        { id: nextId('ed'), type: 'succession_plan',     title: 'Business Succession — Tech Startup', status: 'drafted', lastUpdated: '2024-06-10', nextReviewDate: '2025-12-31', notes: 'Co-founder buy-sell agreement drafted', attachmentsCount: 2 },
      ],
      beneficiaries: [
        { id: nextId('b'), name: 'Diya Mehta',   relationship: 'Spouse',  sharePct: 50, assetIds: [], notes: 'Primary beneficiary' },
        { id: nextId('b'), name: 'Vivaan Mehta', relationship: 'Son',     sharePct: 30, assetIds: [], notes: 'Minor — guardian appointed' },
        { id: nextId('b'), name: 'Rajesh Mehta', relationship: 'Father',  sharePct: 10, assetIds: [], notes: 'Contingent' },
        { id: nextId('b'), name: 'Meera Mehta',  relationship: 'Mother',  sharePct: 10, assetIds: [], notes: 'Contingent' },
      ],
      executorName: 'Adv. Sunil Deshpande',
      guardianName: 'Diya Mehta',
      trustSetup: false,
      hasRegisteredWill: true,
    },
    childPlans: [
      {
        id: nextId('cp'),
        childId: 'f-0003',
        childName: 'Vivaan Mehta',
        currentAge: 4,
        milestones: [
          { id: nextId('cm'), type: 'primary_education',   ageAtMilestone: 6,  targetAmount: 800000,    currentCorpus: 250000, monthlyContribution: 8000,  expectedReturnRate: 10 },
          { id: nextId('cm'), type: 'secondary_education', ageAtMilestone: 16, targetAmount: 2500000,   currentCorpus: 350000, monthlyContribution: 12000, expectedReturnRate: 11 },
          { id: nextId('cm'), type: 'higher_education',    ageAtMilestone: 18, targetAmount: 50000000,  currentCorpus: 2100000, monthlyContribution: 35000, expectedReturnRate: 12 },
          { id: nextId('cm'), type: 'marriage',            ageAtMilestone: 28, targetAmount: 3000000,   currentCorpus: 0,      monthlyContribution: 5000,  expectedReturnRate: 10 },
        ],
      },
    ],
    elderCarePlans: [
      {
        id: nextId('ec'),
        elderId: 'f-0004',
        elderName: 'Rajesh Mehta',
        age: 62,
        monthlySupport: 25000,
        annualMedicalCost: 180000,
        insuranceCoverage: 500000,
        needs: [
          { id: nextId('en'), type: 'medical',         description: 'Annual health checkups + medication',     annualCost: 180000, inflationRate: 10, yearsNeeded: 20 },
          { id: nextId('en'), type: 'monthly_support', description: 'Monthly living support',                  annualCost: 300000, inflationRate: 6,  yearsNeeded: 23 },
          { id: nextId('en'), type: 'caregiver',       description: 'Full-time caregiver (post 75)',           annualCost: 360000, inflationRate: 8,  yearsNeeded: 10 },
          { id: nextId('en'), type: 'emergency_fund',  description: 'Emergency medical reserve',               annualCost: 100000, inflationRate: 5,  yearsNeeded: 5  },
        ],
      },
    ],
    documents: [
      { id: nextId('d'), name: 'ITR FY 2023-24',              category: 'tax',        issuer: 'Income Tax Dept',         documentDate: '2024-07-30', tags: ['ITR', 'FY24'],         encrypted: true,  sizeBytes: 482000,  notes: 'Acknowledgement 8841234', addedAt: '2024-07-31T10:00:00Z' },
      { id: nextId('d'), name: 'HDFC Term Insurance Policy',  category: 'insurance',  issuer: 'HDFC Life',              documentDate: '2020-05-12', tags: ['term', 'life'],        encrypted: true,  sizeBytes: 1240000, notes: 'Policy #501234567',     addedAt: '2020-05-13T10:00:00Z' },
      { id: nextId('d'), name: 'Star Health Family Floater',  category: 'insurance',  issuer: 'Star Health',            documentDate: '2024-04-01', expiryDate: '2025-03-31', tags: ['health', 'floater'], encrypted: true,  sizeBytes: 980000,  notes: 'Policy #SHF-2024-001',  addedAt: '2024-04-02T10:00:00Z' },
      { id: nextId('d'), name: 'Home Loan Sanction Letter',   category: 'loan',       issuer: 'HDFC Ltd',               documentDate: '2019-06-10', tags: ['home', 'loan'],        encrypted: true,  sizeBytes: 650000,  notes: 'Loan #HL-2019-5567',    addedAt: '2019-06-15T10:00:00Z' },
      { id: nextId('d'), name: 'Pune Apartment Sale Deed',    category: 'property',   issuer: 'Sub-Registrar Pune',     documentDate: '2019-06-20', tags: ['property', 'pune'],    encrypted: true,  sizeBytes: 2400000, notes: 'Reg #PUN-2019-112233',  addedAt: '2019-06-21T10:00:00Z' },
      { id: nextId('d'), name: 'Parag Parikh Statement Q1',   category: 'investment', issuer: 'PPFAS MF',              documentDate: '2024-06-30', tags: ['mutual-fund', 'q1'],   encrypted: true,  sizeBytes: 320000,  notes: 'Folio 91234567',        addedAt: '2024-07-01T10:00:00Z' },
      { id: nextId('d'), name: 'Last Will & Testament',       category: 'estate',     issuer: 'Self',                   documentDate: '2024-03-15', tags: ['will', 'registered'], encrypted: true,  sizeBytes: 850000,  notes: 'Reg with sub-registrar', addedAt: '2024-03-16T10:00:00Z' },
      { id: nextId('d'), name: 'Aadhaar Card',                category: 'identity',   issuer: 'UIDAI',                  documentDate: '2018-01-01', tags: ['aadhaar'],             encrypted: true,  sizeBytes: 180000,  notes: '',                      addedAt: '2018-01-05T10:00:00Z' },
      { id: nextId('d'), name: 'PAN Card',                    category: 'identity',   issuer: 'NSDL',                   documentDate: '2015-04-12', tags: ['pan'],                 encrypted: true,  sizeBytes: 150000,  notes: 'ABCDE1234F',            addedAt: '2015-04-15T10:00:00Z' },
    ],
    auth: {
      pinHash: undefined,
      biometricEnabled: true,
      autoLockMinutes: 5,
      hint: undefined,
    },
  };
};

// Backward-compat alias — old code referenced createInitialState
export const createInitialState = createSampleData;
