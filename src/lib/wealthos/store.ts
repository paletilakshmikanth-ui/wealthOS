'use client';

// ============================================================
// WealthOS Infinity — Offline-First Zustand Store
// All data persists to localStorage. No cloud, no backend.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Asset,
  Beneficiary,
  ChildPlan,
  ElderCarePlan,
  EstateDocument,
  EstatePlan,
  ExpenseEntry,
  FamilyMember,
  Goal,
  IncomeEntry,
  InsurancePolicy,
  Liability,
  Settings,
  VaultDocument,
  ViewId,
  WealthOSState,
} from './types';
import { createInitialState, createEmptyState, createSampleData } from './seed';
import { uid } from './engine';

interface WealthOSActions {
  setView: (view: ViewId) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  addAsset: (asset: Omit<Asset, 'id' | 'updatedAt'>) => void;
  updateAsset: (id: string, partial: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  importAssets: (assets: Array<Omit<Asset, 'id' | 'updatedAt'>>) => void;
  importLiabilities: (liabilities: Array<Omit<Liability, 'id'>>) => void;
  importIncome: (income: Array<Omit<IncomeEntry, 'id'>>) => void;
  importExpenses: (expenses: Array<Omit<ExpenseEntry, 'id'>>) => void;
  importGoals: (goals: Array<Omit<Goal, 'id'>>) => void;
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  updateLiability: (id: string, partial: Partial<Liability>) => void;
  removeLiability: (id: string) => void;
  addIncome: (income: Omit<IncomeEntry, 'id'>) => void;
  updateIncome: (id: string, partial: Partial<IncomeEntry>) => void;
  removeIncome: (id: string) => void;
  addExpense: (expense: Omit<ExpenseEntry, 'id'>) => void;
  updateExpense: (id: string, partial: Partial<ExpenseEntry>) => void;
  removeExpense: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, partial: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  addInsurance: (policy: Omit<InsurancePolicy, 'id'>) => void;
  updateInsurance: (id: string, partial: Partial<InsurancePolicy>) => void;
  removeInsurance: (id: string) => void;
  addFamilyMember: (m: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (id: string, partial: Partial<FamilyMember>) => void;
  removeFamilyMember: (id: string) => void;
  // Estate
  addEstateDocument: (d: Omit<EstateDocument, 'id'>) => void;
  updateEstateDocument: (id: string, partial: Partial<EstateDocument>) => void;
  removeEstateDocument: (id: string) => void;
  addBeneficiary: (b: Omit<Beneficiary, 'id'>) => void;
  updateBeneficiary: (id: string, partial: Partial<Beneficiary>) => void;
  removeBeneficiary: (id: string) => void;
  updateEstatePlan: (partial: Partial<EstatePlan>) => void;
  // Children
  addChildPlan: (plan: Omit<ChildPlan, 'id'>) => void;
  updateChildPlan: (id: string, partial: Partial<ChildPlan>) => void;
  removeChildPlan: (id: string) => void;
  // Elder Care
  addElderCarePlan: (plan: Omit<ElderCarePlan, 'id'>) => void;
  updateElderCarePlan: (id: string, partial: Partial<ElderCarePlan>) => void;
  removeElderCarePlan: (id: string) => void;
  // Documents
  addDocument: (d: Omit<VaultDocument, 'id'>) => void;
  updateDocument: (id: string, partial: Partial<VaultDocument>) => void;
  removeDocument: (id: string) => void;
  // Auth
  setPin: (pinHash: string, hint?: string) => void;
  removePin: () => void;
  updateAuth: (partial: Partial<WealthOSState['auth']>) => void;
  // System
  snapshotNetWorth: () => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  restoreFromBackup: (data: Partial<WealthOSState>) => void;
  resetAll: () => void;
}

type WealthOSStore = WealthOSState & WealthOSActions;

// New users start with an empty profile. They can load sample data
// on demand via the "Load Sample Data" button in the Command Center.
const seed = createEmptyState();

export const useWealthOS = create<WealthOSStore>()(
  persist(
    (set) => ({
      ...seed,

      setView: (view) => set({ activeView: view }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      addAsset: (asset) =>
        set((s) => ({
          assets: [...s.assets, { ...asset, id: uid(), updatedAt: new Date().toISOString() }],
        })),
      updateAsset: (id, partial) =>
        set((s) => ({
          assets: s.assets.map((a) => (a.id === id ? { ...a, ...partial, updatedAt: new Date().toISOString() } : a)),
        })),
      removeAsset: (id) =>
        set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),
      importAssets: (assets) =>
        set((s) => ({
          assets: [...s.assets, ...assets.map(a => ({ ...a, id: uid(), updatedAt: new Date().toISOString() }))],
        })),
      importLiabilities: (liabilities) =>
        set((s) => ({ liabilities: [...s.liabilities, ...liabilities.map(l => ({ ...l, id: uid() }))] })),
      importIncome: (income) =>
        set((s) => ({ income: [...s.income, ...income.map(i => ({ ...i, id: uid() }))] })),
      importExpenses: (expenses) =>
        set((s) => ({ expenses: [...s.expenses, ...expenses.map(e => ({ ...e, id: uid() }))] })),
      importGoals: (goals) =>
        set((s) => ({ goals: [...s.goals, ...goals.map(g => ({ ...g, id: uid() }))] })),

      addLiability: (liability) =>
        set((s) => ({ liabilities: [...s.liabilities, { ...liability, id: uid() }] })),
      updateLiability: (id, partial) =>
        set((s) => ({
          liabilities: s.liabilities.map((l) => (l.id === id ? { ...l, ...partial } : l)),
        })),
      removeLiability: (id) =>
        set((s) => ({ liabilities: s.liabilities.filter((l) => l.id !== id) })),

      addIncome: (income) =>
        set((s) => ({ income: [...s.income, { ...income, id: uid() }] })),
      updateIncome: (id, partial) =>
        set((s) => ({
          income: s.income.map((i) => (i.id === id ? { ...i, ...partial } : i)),
        })),
      removeIncome: (id) =>
        set((s) => ({ income: s.income.filter((i) => i.id !== id) })),

      addExpense: (expense) =>
        set((s) => ({ expenses: [...s.expenses, { ...expense, id: uid() }] })),
      updateExpense: (id, partial) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...partial } : e)),
        })),
      removeExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addGoal: (goal) =>
        set((s) => ({ goals: [...s.goals, { ...goal, id: uid() }] })),
      updateGoal: (id, partial) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...partial } : g)),
        })),
      removeGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      addInsurance: (policy) =>
        set((s) => ({ insurance: [...s.insurance, { ...policy, id: uid() }] })),
      updateInsurance: (id, partial) =>
        set((s) => ({ insurance: s.insurance.map(p => p.id === id ? { ...p, ...partial } : p) })),
      removeInsurance: (id) =>
        set((s) => ({ insurance: s.insurance.filter((p) => p.id !== id) })),

      addFamilyMember: (m) =>
        set((s) => ({ family: [...s.family, { ...m, id: uid() }] })),
      updateFamilyMember: (id, partial) =>
        set((s) => ({ family: s.family.map(m => m.id === id ? { ...m, ...partial } : m) })),
      removeFamilyMember: (id) =>
        set((s) => ({ family: s.family.filter((m) => m.id !== id) })),

      snapshotNetWorth: () =>
        set((s) => {
          const totalAssets = s.assets.reduce((acc, a) => acc + a.currentValue, 0);
          const totalLiabilities = s.liabilities.reduce((acc, l) => acc + l.outstandingBalance, 0);
          const month = new Date().toISOString().slice(0, 7);
          // Replace this month's snapshot if it exists
          const filtered = s.netWorthHistory.filter(h => h.date !== month);
          return {
            netWorthHistory: [...filtered, {
              date: month,
              netWorth: totalAssets - totalLiabilities,
              assets: totalAssets,
              liabilities: totalLiabilities,
            }].slice(-36),
          };
        }),

      // ---------- Estate Planning ----------
      addEstateDocument: (d) =>
        set((s) => ({
          estatePlan: { ...s.estatePlan, documents: [...s.estatePlan.documents, { ...d, id: uid() }] },
        })),
      updateEstateDocument: (id, partial) =>
        set((s) => ({
          estatePlan: {
            ...s.estatePlan,
            documents: s.estatePlan.documents.map(d => d.id === id ? { ...d, ...partial } : d),
          },
        })),
      removeEstateDocument: (id) =>
        set((s) => ({
          estatePlan: { ...s.estatePlan, documents: s.estatePlan.documents.filter(d => d.id !== id) },
        })),
      addBeneficiary: (b) =>
        set((s) => ({
          estatePlan: { ...s.estatePlan, beneficiaries: [...s.estatePlan.beneficiaries, { ...b, id: uid() }] },
        })),
      updateBeneficiary: (id, partial) =>
        set((s) => ({
          estatePlan: {
            ...s.estatePlan,
            beneficiaries: s.estatePlan.beneficiaries.map(b => b.id === id ? { ...b, ...partial } : b),
          },
        })),
      removeBeneficiary: (id) =>
        set((s) => ({
          estatePlan: { ...s.estatePlan, beneficiaries: s.estatePlan.beneficiaries.filter(b => b.id !== id) },
        })),
      updateEstatePlan: (partial) =>
        set((s) => ({ estatePlan: { ...s.estatePlan, ...partial } })),

      // ---------- Children ----------
      addChildPlan: (plan) =>
        set((s) => ({ childPlans: [...s.childPlans, { ...plan, id: uid() }] })),
      updateChildPlan: (id, partial) =>
        set((s) => ({
          childPlans: s.childPlans.map(p => p.id === id ? { ...p, ...partial } : p),
        })),
      removeChildPlan: (id) =>
        set((s) => ({ childPlans: s.childPlans.filter(p => p.id !== id) })),

      // ---------- Elder Care ----------
      addElderCarePlan: (plan) =>
        set((s) => ({ elderCarePlans: [...s.elderCarePlans, { ...plan, id: uid() }] })),
      updateElderCarePlan: (id, partial) =>
        set((s) => ({
          elderCarePlans: s.elderCarePlans.map(p => p.id === id ? { ...p, ...partial } : p),
        })),
      removeElderCarePlan: (id) =>
        set((s) => ({ elderCarePlans: s.elderCarePlans.filter(p => p.id !== id) })),

      // ---------- Documents ----------
      addDocument: (d) =>
        set((s) => ({ documents: [...s.documents, { ...d, id: uid() }] })),
      updateDocument: (id, partial) =>
        set((s) => ({
          documents: s.documents.map(d => d.id === id ? { ...d, ...partial } : d),
        })),
      removeDocument: (id) =>
        set((s) => ({ documents: s.documents.filter(d => d.id !== id) })),

      // ---------- Auth ----------
      setPin: (pinHash, hint) =>
        set((s) => ({ auth: { ...s.auth, pinHash, hint } })),
      removePin: () =>
        set((s) => ({ auth: { ...s.auth, pinHash: undefined, hint: undefined } })),
      updateAuth: (partial) =>
        set((s) => ({ auth: { ...s.auth, ...partial } })),

      // ---------- System ----------
      loadSampleData: () =>
        set(() => {
          // Preserve the user's auth/PIN across the data load
          const current = useWealthOS.getState();
          const sample = createSampleData();
          return { ...sample, auth: current.auth, activeView: 'dashboard' };
        }),

      clearAllData: () =>
        set(() => {
          // Wipe everything but keep auth/PIN
          const current = useWealthOS.getState();
          const empty = createEmptyState();
          return { ...empty, auth: current.auth, activeView: 'dashboard' };
        }),

      restoreFromBackup: (data) =>
        set(() => {
          // Replace all data slices with the backup contents.
          // Preserve the current auth (PIN) — the backup file never contains it.
          const current = useWealthOS.getState();
          return {
            ...data,
            auth: current.auth,
            activeView: 'dashboard',
          } as any;
        }),

      resetAll: () => set(() => ({ ...createSampleData() })),
    }),
    {
      name: 'wealthos-infinity-store',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      // Don't persist activeView — prevents SSR hydration mismatch
      partialize: (s) => ({
        settings: s.settings,
        assets: s.assets,
        liabilities: s.liabilities,
        income: s.income,
        expenses: s.expenses,
        goals: s.goals,
        insurance: s.insurance,
        family: s.family,
        netWorthHistory: s.netWorthHistory,
        estatePlan: s.estatePlan,
        childPlans: s.childPlans,
        elderCarePlans: s.elderCarePlans,
        documents: s.documents,
        auth: s.auth,
      }),
      // Migrate older persisted states:
      //  - v3 → v4: income/expense entries used `monthlyAmount`; now they use `amount` + `frequency`
      //  - older: just start fresh with empty state (preserves auth via partialize merge)
      migrate: (persistedState: any, version: number) => {
        if (!persistedState) return createEmptyState() as any;
        if (version < 4) {
          // Convert legacy monthlyAmount → amount + frequency='monthly'
          const migrated = { ...persistedState };
          if (Array.isArray(migrated.income)) {
            migrated.income = migrated.income.map((i: any) => ({
              ...i,
              amount: i.amount ?? i.monthlyAmount ?? 0,
              frequency: i.frequency ?? 'monthly',
              customDays: i.customDays,
              monthlyAmount: undefined,
            }));
          }
          if (Array.isArray(migrated.expenses)) {
            migrated.expenses = migrated.expenses.map((e: any) => ({
              ...e,
              amount: e.amount ?? e.monthlyAmount ?? 0,
              frequency: e.frequency ?? 'monthly',
              customDays: e.customDays,
              monthlyAmount: undefined,
            }));
          }
          return migrated as any;
        }
        return persistedState as any;
      },
    }
  )
);
