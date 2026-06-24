// ============================================================
// WealthOS Infinity — CSV Import/Export Utilities
// Pure functions for parsing, validating, and serializing
// financial data to/from CSV format.
// ============================================================

import type {
  Asset, AssetCategory, Liability, LiabilityType,
  IncomeEntry, IncomeSource, ExpenseEntry, ExpenseCategory,
  Goal, GoalType, Frequency,
} from './types';
import { uid, ASSET_CATEGORY_META, LIABILITY_TYPE_META, INCOME_SOURCE_META } from './engine';

// ---------- CSV Parser (RFC 4180 compliant-ish) ----------

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  errors: string[];
}

export const parseCSV = (text: string): CSVParseResult => {
  const errors: string[] = [];
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  // Normalize line endings
  const input = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < input.length) {
    const c = input[i];

    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          // Escaped quote
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    // Not in quotes
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ',') {
      current.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\n') {
      current.push(field);
      field = '';
      rows.push(current);
      current = [];
      i++;
      continue;
    }
    field += c;
    i++;
  }

  // Last field/row
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  // Remove fully empty trailing rows
  const filtered = rows.filter(r => r.length > 0 && r.some(c => c.trim().length > 0));

  if (filtered.length === 0) {
    return { headers: [], rows: [], errors: ['CSV is empty'] };
  }

  const headers = filtered[0].map(h => h.trim());
  const dataRows = filtered.slice(1);

  return { headers, rows: dataRows, errors };
};

// ---------- Row → Object mapper ----------

const getCell = (row: string[], headers: string[], ...names: string[]): string => {
  for (const name of names) {
    const idx = headers.findIndex(h => h.toLowerCase().replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (idx >= 0 && row[idx] !== undefined) return row[idx].trim();
  }
  return '';
};

const parseNum = (s: string): number => {
  if (!s) return 0;
  // Strip currency symbols, commas, spaces
  const cleaned = s.replace(/[₹$€£,\s]/g, '').replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

const parseDate = (s: string): string => {
  if (!s) return new Date().toISOString().slice(0, 10);
  // Accept YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
  const trimmed = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [a, b, c] = trimmed.split('/');
    // Assume DD/MM/YYYY (Indian format)
    const day = a.padStart(2, '0');
    const month = b.padStart(2, '0');
    return `${c}-${month}-${day}`;
  }
  return trimmed;
};

// ---------- Asset Import ----------

export interface AssetImportRow {
  raw: Record<string, string>;
  parsed: Partial<Asset>;
  errors: string[];
}

const normalizeAssetCategory = (s: string): AssetCategory => {
  const lower = s.toLowerCase().replace(/[^a-z_]/g, '_').replace(/_+/g, '_');
  const map: Record<string, AssetCategory> = {
    cash: 'cash', bank: 'cash', savings: 'cash',
    mutual_funds: 'mutual_funds', mutualfund: 'mutual_funds', mf: 'mutual_funds', mutual_fund: 'mutual_funds',
    stocks: 'stocks', stock: 'stocks', equity: 'stocks', shares: 'stocks',
    etf: 'etf', etfs: 'etf',
    bonds: 'bonds', bond: 'bonds',
    ppf: 'ppf',
    epf: 'epf',
    nps: 'nps',
    gold: 'gold',
    silver: 'silver',
    crypto: 'crypto', cryptocurrency: 'crypto', bitcoin: 'crypto',
    real_estate: 'real_estate', realestate: 'real_estate', property: 'real_estate', apartment: 'real_estate', house: 'real_estate',
    land: 'land', plot: 'land',
    vehicles: 'vehicles', vehicle: 'vehicles', car: 'vehicles',
    business: 'business',
    private_equity: 'private_equity', privateequity: 'private_equity', pe: 'private_equity',
    esop: 'esop', esops: 'esop',
    rsu: 'rsu', rsus: 'rsu',
    foreign: 'foreign', foreign_assets: 'foreign', us_stocks: 'foreign',
    collectibles: 'collectibles',
  };
  return map[lower] || 'other' as AssetCategory;
};

export const parseAssetRows = (headers: string[], rows: string[][]): AssetImportRow[] => {
  return rows.map((row, idx) => {
    const errors: string[] = [];
    const name = getCell(row, headers, 'name', 'asset_name', 'holding', 'instrument');
    const categoryRaw = getCell(row, headers, 'category', 'type', 'asset_class', 'asset_type');
    const currentValue = parseNum(getCell(row, headers, 'current_value', 'current', 'value', 'market_value', 'currentvalue'));
    const investedValue = parseNum(getCell(row, headers, 'invested_value', 'invested', 'cost', 'cost_basis', 'purchase_price', 'investedvalue'));
    const annualReturnRate = parseNum(getCell(row, headers, 'expected_return', 'return_rate', 'yield', 'cagr', 'annual_return', 'return', 'expectedreturn')) || 10;
    const liquidityRaw = getCell(row, headers, 'liquidity', 'liquid').toLowerCase();
    const liquidity: Asset['liquidity'] = ['high', 'medium', 'low', 'illiquid'].includes(liquidityRaw) ? liquidityRaw as Asset['liquidity'] : 'medium';
    const notes = getCell(row, headers, 'notes', 'description', 'comment');

    if (!name) errors.push(`Row ${idx + 2}: missing asset name`);
    if (currentValue === 0) errors.push(`Row ${idx + 2}: missing/zero current value`);

    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = row[i] || ''; });

    return {
      raw,
      parsed: {
        id: uid(),
        name,
        category: normalizeAssetCategory(categoryRaw),
        currentValue,
        investedValue: investedValue || currentValue,
        annualReturnRate,
        liquidity,
        notes,
        updatedAt: new Date().toISOString(),
      },
      errors,
    };
  });
};

// ---------- Liability Import ----------

const normalizeLiabilityType = (s: string): LiabilityType => {
  const lower = s.toLowerCase().replace(/[^a-z_]/g, '_').replace(/_+/g, '_');
  const map: Record<string, LiabilityType> = {
    home_loan: 'home_loan', homeloan: 'home_loan', home: 'home_loan', mortgage: 'home_loan',
    education_loan: 'education_loan', educationloan: 'education_loan', education: 'education_loan', student_loan: 'education_loan',
    personal_loan: 'personal_loan', personalloan: 'personal_loan', personal: 'personal_loan',
    business_loan: 'business_loan', businessloan: 'business_loan', business: 'business_loan',
    credit_card: 'credit_card', creditcard: 'credit_card', card: 'credit_card',
    mortgage_: 'mortgage',
    auto_loan: 'auto_loan', autoloan: 'auto_loan', auto: 'auto_loan', car_loan: 'auto_loan', carloan: 'auto_loan',
  };
  return map[lower] || 'other';
};

export const parseLiabilityRows = (headers: string[], rows: string[][]): any[] => {
  return rows.map((row, idx) => {
    const errors: string[] = [];
    const name = getCell(row, headers, 'name', 'loan_name', 'loan');
    const typeRaw = getCell(row, headers, 'type', 'loan_type');
    const outstandingBalance = parseNum(getCell(row, headers, 'outstanding', 'balance', 'outstanding_balance', 'current_balance'));
    const originalPrincipal = parseNum(getCell(row, headers, 'principal', 'original_principal', 'original', 'loan_amount'));
    const interestRate = parseNum(getCell(row, headers, 'rate', 'interest_rate', 'roi', 'interest'));
    const emi = parseNum(getCell(row, headers, 'emi', 'monthly_payment', 'payment', 'installment'));
    const tenureMonthsRemaining = parseNum(getCell(row, headers, 'tenure', 'tenure_months', 'months_left', 'remaining_months', 'tenuremonthsremaining'));
    const startDate = parseDate(getCell(row, headers, 'start_date', 'start', 'date', 'startdate'));
    const notes = getCell(row, headers, 'notes', 'description');

    if (!name) errors.push(`Row ${idx + 2}: missing loan name`);
    if (outstandingBalance === 0) errors.push(`Row ${idx + 2}: missing/zero outstanding balance`);

    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = row[i] || ''; });

    return {
      raw,
      parsed: {
        id: uid(),
        name,
        type: normalizeLiabilityType(typeRaw),
        outstandingBalance,
        originalPrincipal: originalPrincipal || outstandingBalance,
        interestRate: interestRate || 0,
        emi: emi || 0,
        tenureMonthsRemaining: tenureMonthsRemaining || 0,
        startDate,
        notes,
      },
      errors,
    };
  });
};

// ---------- Income Import ----------

const normalizeIncomeSource = (s: string): IncomeSource => {
  const lower = s.toLowerCase().replace(/[^a-z_]/g, '_').replace(/_+/g, '_');
  const map: Record<string, IncomeSource> = {
    salary: 'salary',
    bonus: 'bonus',
    dividend: 'dividend', dividends: 'dividend',
    rental: 'rental', rent: 'rental',
    interest: 'interest',
    business: 'business',
    freelance: 'freelance', freelancing: 'freelance', consulting: 'freelance',
    capital_gains: 'capital_gains', capitalgains: 'capital_gains', gains: 'capital_gains',
  };
  return map[lower] || 'other';
};

const normalizeFrequency = (s: string): Frequency => {
  const lower = s.toLowerCase().trim();
  if (['daily', 'day', 'per day', '/day', 'd'].includes(lower)) return 'daily';
  if (['weekly', 'week', 'per week', '/week', 'wk', 'w'].includes(lower)) return 'weekly';
  if (['yearly', 'year', 'annual', 'annually', 'per year', '/year', 'yr', 'y'].includes(lower)) return 'yearly';
  if (['custom', 'interval'].includes(lower)) return 'custom';
  return 'monthly'; // default
};

export const parseIncomeRows = (headers: string[], rows: string[][]): any[] => {
  return rows.map((row, idx) => {
    const errors: string[] = [];
    const label = getCell(row, headers, 'label', 'name', 'source', 'description');
    const sourceRaw = getCell(row, headers, 'source_type', 'source', 'type', 'category');
    const amount = parseNum(getCell(row, headers, 'amount', 'value'));
    const frequencyRaw = getCell(row, headers, 'frequency', 'freq', 'period');
    const customDays = parseNum(getCell(row, headers, 'custom_days', 'interval_days', 'days'));
    const active = getCell(row, headers, 'active', 'status').toLowerCase();

    if (!label) errors.push(`Row ${idx + 2}: missing label`);
    if (amount === 0) errors.push(`Row ${idx + 2}: missing/zero amount`);

    const frequency = normalizeFrequency(frequencyRaw);

    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = row[i] || ''; });

    return {
      raw,
      parsed: {
        id: uid(),
        label,
        source: normalizeIncomeSource(sourceRaw || label),
        amount,
        frequency,
        customDays: frequency === 'custom' ? (customDays || 30) : undefined,
        active: active !== 'inactive' && active !== 'false' && active !== '0',
      },
      errors,
    };
  });
};

// ---------- Expense Import ----------

const normalizeExpenseCategory = (s: string): ExpenseCategory => {
  const lower = s.toLowerCase().replace(/[^a-z_]/g, '_').replace(/_+/g, '_');
  const map: Record<string, ExpenseCategory> = {
    housing: 'housing', rent: 'housing', home: 'housing', maintenance: 'housing',
    food: 'food', groceries: 'food', dining: 'food', restaurant: 'food',
    transport: 'transport', fuel: 'transport', travel: 'transport', cab: 'transport', petrol: 'transport',
    utilities: 'utilities', electricity: 'utilities', water: 'utilities', internet: 'utilities', broadband: 'utilities', phone: 'utilities',
    healthcare: 'healthcare', health: 'healthcare', medical: 'healthcare',
    education: 'education', school: 'education', college: 'education', course: 'education',
    lifestyle: 'lifestyle', subscription: 'lifestyle', subscriptions: 'lifestyle',
    discretionary: 'discretionary', entertainment: 'discretionary', fun: 'discretionary',
    insurance: 'insurance', premium: 'insurance',
    taxes: 'taxes', tax: 'taxes',
  };
  return map[lower] || 'other';
};

export const parseExpenseRows = (headers: string[], rows: string[][]): any[] => {
  return rows.map((row, idx) => {
    const errors: string[] = [];
    const label = getCell(row, headers, 'label', 'name', 'description');
    const categoryRaw = getCell(row, headers, 'category', 'type');
    const amount = parseNum(getCell(row, headers, 'amount', 'value'));
    const frequencyRaw = getCell(row, headers, 'frequency', 'freq', 'period');
    const customDays = parseNum(getCell(row, headers, 'custom_days', 'interval_days', 'days'));
    const essentialRaw = getCell(row, headers, 'essential', 'type').toLowerCase();

    if (!label) errors.push(`Row ${idx + 2}: missing label`);
    if (amount === 0) errors.push(`Row ${idx + 2}: missing/zero amount`);

    const frequency = normalizeFrequency(frequencyRaw);
    const essential = ['true', 'yes', 'y', '1', 'essential'].includes(essentialRaw);

    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = row[i] || ''; });

    return {
      raw,
      parsed: {
        id: uid(),
        label,
        category: normalizeExpenseCategory(categoryRaw),
        amount,
        frequency,
        customDays: frequency === 'custom' ? (customDays || 30) : undefined,
        essential,
      },
      errors,
    };
  });
};

// ---------- Goal Import ----------

const normalizeGoalType = (s: string): GoalType => {
  const lower = s.toLowerCase().replace(/[^a-z_]/g, '_').replace(/_+/g, '_');
  const map: Record<string, GoalType> = {
    retirement: 'retirement', retire: 'retirement',
    house: 'house', home: 'house', property: 'house',
    vehicle: 'vehicle', car: 'vehicle',
    marriage: 'marriage', wedding: 'marriage',
    education: 'education', edu: 'education', college: 'education',
    vacation: 'vacation', holiday: 'vacation', travel: 'vacation',
    business: 'business',
    emergency_fund: 'emergency_fund', emergency: 'emergency_fund', contingency: 'emergency_fund',
    financial_freedom: 'financial_freedom', freedom: 'financial_freedom', fi: 'financial_freedom',
  };
  return map[lower] || 'other';
};

const normalizePriority = (s: string): Goal['priority'] => {
  const lower = s.toLowerCase().trim();
  if (['critical', 'urgent', 'top'].includes(lower)) return 'critical';
  if (['high', 'important'].includes(lower)) return 'high';
  if (['low', 'minor'].includes(lower)) return 'low';
  return 'medium';
};

export const parseGoalRows = (headers: string[], rows: string[][]): any[] => {
  return rows.map((row, idx) => {
    const errors: string[] = [];
    const name = getCell(row, headers, 'name', 'goal');
    const typeRaw = getCell(row, headers, 'type', 'goal_type');
    const targetAmount = parseNum(getCell(row, headers, 'target', 'target_amount', 'goal_amount'));
    const currentAmount = parseNum(getCell(row, headers, 'current', 'current_amount', 'saved', 'saved_amount'));
    const monthlyContribution = parseNum(getCell(row, headers, 'monthly', 'monthly_contribution', 'sip', 'contribution'));
    const targetDate = parseDate(getCell(row, headers, 'target_date', 'date', 'deadline', 'targetdate'));
    const expectedReturnRate = parseNum(getCell(row, headers, 'expected_return', 'return_rate', 'roi', 'expectedreturn')) || 10;
    const priorityRaw = getCell(row, headers, 'priority');

    if (!name) errors.push(`Row ${idx + 2}: missing goal name`);
    if (targetAmount === 0) errors.push(`Row ${idx + 2}: missing/zero target amount`);

    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = row[i] || ''; });

    return {
      raw,
      parsed: {
        id: uid(),
        name,
        type: normalizeGoalType(typeRaw),
        targetAmount,
        currentAmount,
        monthlyContribution,
        targetDate,
        expectedReturnRate,
        priority: normalizePriority(priorityRaw),
      },
      errors,
    };
  });
};

// ---------- CSV Export (for template generation) ----------

export const generateAssetTemplate = (): string => {
  return [
    'name,category,current_value,invested_value,expected_return,liquidity,notes',
    'HDFC Mid Cap,mutual_funds,540000,410000,18.4,high,SIP ongoing',
    'Reliance Industries,stocks,420000,320000,14,high,',
    'PPF Account,ppf,890000,700000,7.1,low,15-year lock-in',
    '3BHK Apartment,real_estate,9500000,7500000,7,illiquid,Pune',
  ].join('\n');
};

export const generateLiabilityTemplate = (): string => {
  return [
    'name,type,outstanding,original_principal,interest_rate,emi,tenure_months,start_date,notes',
    'Home Loan - HDFC,home_loan,3800000,5500000,8.4,48500,168,2019-06-15,Pune apartment',
    'Auto Loan,auto_loan,420000,900000,9.2,12500,36,2022-03-10,',
    'Credit Card,credit_card,85000,85000,36,12000,8,2024-01-01,',
  ].join('\n');
};

export const generateIncomeTemplate = (): string => {
  return [
    'label,source_type,amount,frequency,custom_days,active',
    'Primary Salary,salary,280000,monthly,,true',
    'Annual Bonus,bonus,300000,yearly,,true',
    'Consulting,freelance,45000,monthly,,true',
    'Dividends,dividend,8000,monthly,,true',
    'Rental Income,rental,22000,monthly,,true',
  ].join('\n');
};

export const generateExpenseTemplate = (): string => {
  return [
    'label,category,amount,frequency,custom_days,essential',
    'Rent,housing,18000,monthly,,true',
    'Groceries,food,28000,monthly,,true',
    'Fuel,transport,12000,monthly,,true',
    'Newspaper,lifestyle,30,custom,7,false',
    'Insurance Premiums,insurance,102000,yearly,,true',
  ].join('\n');
};

export const generateGoalTemplate = (): string => {
  return [
    'name,type,target_amount,current_amount,monthly_contribution,target_date,expected_return,priority',
    'Retirement Corpus,retirement,120000000,8800000,85000,2048-12-31,12,critical',
    'Child Education,education,50000000,2100000,35000,2040-06-30,12,high',
    'Second Home,house,25000000,3500000,50000,2030-12-31,10,medium',
    'Dream Vacation,vacation,1500000,450000,15000,2026-12-31,8,low',
  ].join('\n');
};

// ---------- File helpers ----------

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};
