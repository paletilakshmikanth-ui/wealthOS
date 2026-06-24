// ============================================================
// WealthOS Infinity — Seed Data
// Realistic demo profile: 32-year-old tech professional in India
// ============================================================

import type { WealthOSState } from './types';

// Deterministic IDs (no Math.random) — prevents SSR hydration mismatch
const id = (prefix: string, n: number) => `${prefix}-${n.toString(36).padStart(4, '0')}`;

export const createInitialState = (): WealthOSState => {
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
      { id: nextId('i'), source: 'salary',    label: 'Primary Salary',         monthlyAmount: 280000, active: true  },
      { id: nextId('i'), source: 'bonus',     label: 'Annual Bonus (avg)',     monthlyAmount: 25000,  active: true  },
      { id: nextId('i'), source: 'freelance', label: 'Consulting',             monthlyAmount: 45000,  active: true  },
      { id: nextId('i'), source: 'dividend',  label: 'Stock Dividends',        monthlyAmount: 8000,   active: true  },
      { id: nextId('i'), source: 'rental',    label: 'Rental Income',          monthlyAmount: 22000,  active: true  },
      { id: nextId('i'), source: 'interest',  label: 'FD & Savings Interest',  monthlyAmount: 5500,   active: true  },
    ],
    expenses: [
      { id: nextId('e'), category: 'housing',     label: 'Rent / Maintenance',  monthlyAmount: 18000, essential: true  },
      { id: nextId('e'), category: 'food',        label: 'Groceries & Dining',  monthlyAmount: 28000, essential: true  },
      { id: nextId('e'), category: 'transport',   label: 'Fuel & Cab',          monthlyAmount: 12000, essential: true  },
      { id: nextId('e'), category: 'utilities',   label: 'Electricity/Water/Net', monthlyAmount: 6500, essential: true  },
      { id: nextId('e'), category: 'healthcare',  label: 'Health & Wellness',   monthlyAmount: 8000,  essential: true  },
      { id: nextId('e'), category: 'education',   label: 'Skill Development',   monthlyAmount: 10000, essential: false },
      { id: nextId('e'), category: 'lifestyle',   label: 'Subscriptions',       monthlyAmount: 4500,  essential: false },
      { id: nextId('e'), category: 'discretionary', label: 'Entertainment',     monthlyAmount: 15000, essential: false },
      { id: nextId('e'), category: 'discretionary', label: 'Travel (avg)',      monthlyAmount: 25000, essential: false },
      { id: nextId('e'), category: 'insurance',   label: 'Insurance Premiums',  monthlyAmount: 8500,  essential: true  },
      { id: nextId('e'), category: 'other',       label: 'Miscellaneous',       monthlyAmount: 7000,  essential: false },
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
  };
};
