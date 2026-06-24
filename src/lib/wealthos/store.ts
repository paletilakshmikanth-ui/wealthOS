'use client';

// ============================================================
// WealthOS Infinity — Offline-First Zustand Store
// All data persists to localStorage. No cloud, no backend.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Asset,
  ExpenseEntry,
  FamilyMember,
  Goal,
  IncomeEntry,
  InsurancePolicy,
  Liability,
  Settings,
  ViewId,
  WealthOSState,
} from './types';
import { createInitialState } from './seed';
import { uid } from './engine';

interface WealthOSActions {
  setView: (view: ViewId) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  addAsset: (asset: Omit<Asset, 'id' | 'updatedAt'>) => void;
  updateAsset: (id: string, partial: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
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
  removeInsurance: (id: string) => void;
  addFamilyMember: (m: Omit<FamilyMember, 'id'>) => void;
  removeFamilyMember: (id: string) => void;
  snapshotNetWorth: () => void;
  resetAll: () => void;
}

type WealthOSStore = WealthOSState & WealthOSActions;

const seed = createInitialState();

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
      removeInsurance: (id) =>
        set((s) => ({ insurance: s.insurance.filter((p) => p.id !== id) })),

      addFamilyMember: (m) =>
        set((s) => ({ family: [...s.family, { ...m, id: uid() }] })),
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

      resetAll: () => set(() => ({ ...createInitialState() })),
    }),
    {
      name: 'wealthos-infinity-store',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // Don't persist activeView — prevents SSR hydration mismatch
      // (server always renders 'dashboard', client starts there too)
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
      }),
      // Wipe any older persisted state
      migrate: () => createInitialState() as any,
    }
  )
);
