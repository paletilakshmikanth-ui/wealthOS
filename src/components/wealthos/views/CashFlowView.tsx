'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  computeCashFlow,
  computeKPIs,
  fmtCurrency,
  fmtFullCurrency,
  fmtPct,
  INCOME_SOURCE_META,
  FREQUENCY_META,
  frequencyShort,
  toMonthly,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, DeltaPill } from '../Primitives';
import { ResponsiveContainer, Sankey, Tooltip, BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Plus, Trash2, Activity, Wallet, Repeat, PencilLine, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { CSVImportDialog } from '../CSVImportDialog';
import { useState } from 'react';
import type { IncomeEntry, IncomeSource, ExpenseEntry, ExpenseCategory, Frequency } from '@/lib/wealthos/types';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  housing: 'Housing', food: 'Food', transport: 'Transport', utilities: 'Utilities',
  healthcare: 'Healthcare', education: 'Education', lifestyle: 'Lifestyle',
  discretionary: 'Discretionary', insurance: 'Insurance', taxes: 'Taxes', other: 'Other',
};

export function CashFlowView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const cf = computeCashFlow(state);
  const sym = state.settings.currencySymbol;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1"><ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /><MetricLabel>Monthly Income</MetricLabel></div>
          <MetricValue value={kpis.monthlyIncome} symbol={sym} className="text-2xl text-emerald-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{state.income.filter(i=>i.active).length} sources</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1"><ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /><MetricLabel>Monthly Expenses</MetricLabel></div>
          <MetricValue value={kpis.monthlyExpenses} symbol={sym} className="text-2xl text-rose-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{state.expenses.length} categories</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Monthly Surplus</MetricLabel>
          <MetricValue value={kpis.monthlySurplus} symbol={sym} className={`text-2xl ${kpis.monthlySurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
          <p className="text-[10px] text-muted-foreground mt-1">{fmtPct(kpis.savingsRate)} savings rate</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Passive Income</MetricLabel>
          <MetricValue value={kpis.passiveIncomeMonthly} symbol={sym} className="text-2xl text-amber-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{fmtPct(kpis.financialIndependencePct)} of expenses</p>
        </GlassCard>
      </div>

      {/* Income sources + expense breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Income Sources" subtitle="All active income streams" icon={<ArrowUpRight className="w-4 h-4" />} action={<div className="flex items-center gap-2"><ImportIncomeButton /><AddIncomeDialog /></div>} />
          <div className="space-y-2">
            {state.income.filter(i => i.active).map(i => {
              const meta = INCOME_SOURCE_META[i.source];
              const monthly = toMonthly(i.amount, i.frequency, i.customDays);
              return (
                <div key={i.id} className="flex items-center gap-3 p-2 rounded-md bg-white/[0.02] border border-white/5">
                  <div className={`w-1.5 h-8 rounded-full ${meta.isPassive ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-foreground truncate">{i.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono font-semibold text-emerald-400">{fmtCurrency(monthly, sym)}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">/mo</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <span className="text-[10px] text-muted-foreground truncate">
                        {meta.label}{meta.isPassive && ' • Passive'}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0 flex items-center gap-1">
                        <Repeat className="w-2.5 h-2.5" />
                        {fmtFullCurrency(i.amount, sym)} {frequencyShort(i.frequency, i.customDays)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <EditIncomeButton income={i} />
                    <button onClick={() => useWealthOS.getState().removeIncome(i.id)} className="text-muted-foreground hover:text-rose-400 p-1 shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
            {state.income.filter(i => i.active).length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">No income sources yet. Click "Add" to create one.</div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Expense Breakdown" subtitle="Where your money goes" icon={<ArrowDownRight className="w-4 h-4" />} action={<div className="flex items-center gap-2"><ImportExpensesButton /><AddExpenseDialog /></div>} />
          <div className="grid grid-cols-2 gap-3">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={cf.expenses} dataKey="amount" nameKey="label" cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={1}>
                  {cf.expenses.map((e, i) => <Cell key={i} fill={e.essential ? '#34d399' : '#fbbf24'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym) + ' /mo'} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 overflow-y-auto max-h-44 scroll-thin">
              {state.expenses.map(e => {
                const monthly = toMonthly(e.amount, e.frequency, e.customDays);
                return (
                  <div key={e.id} className="flex items-center justify-between text-[11px] gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${e.essential ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="text-muted-foreground truncate">{e.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-foreground">{fmtCurrency(monthly, sym)}<span className="text-[9px] text-muted-foreground">/mo</span></span>
                      <EditExpenseButton expense={e} />
                      <button onClick={() => useWealthOS.getState().removeExpense(e.id)} className="text-muted-foreground hover:text-rose-400">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {state.expenses.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">No expenses yet.</div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Income vs expense monthly bar */}
      <GlassCard className="p-5">
        <SectionHeader title="Cash Flow Analysis" subtitle="Income vs expense by category" icon={<Activity className="w-4 h-4" />} />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={[
            { name: 'Active Income', amount: cf.income.filter(i => !INCOME_SOURCE_META[i.source].isPassive).reduce((s,i)=>s+i.amount,0), type: 'in' },
            { name: 'Passive Income', amount: cf.income.filter(i => INCOME_SOURCE_META[i.source].isPassive).reduce((s,i)=>s+i.amount,0), type: 'in' },
            { name: 'Essential', amount: cf.expenses.filter(e => e.essential).reduce((s,e)=>s+e.amount,0), type: 'out' },
            { name: 'Discretionary', amount: cf.expenses.filter(e => !e.essential).reduce((s,e)=>s+e.amount,0), type: 'out' },
            { name: 'Surplus', amount: cf.surplus, type: 'surplus' },
          ]}>
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={70} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym)} />
            <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
              <Cell fill="#34d399" />
              <Cell fill="#d4af37" />
              <Cell fill="#f43f5e" />
              <Cell fill="#fb923c" />
              <Cell fill="#38bdf8" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}

function AddIncomeDialog() {
  return <IncomeDialog mode="add" trigger={
    <Button size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
  } />;
}

function EditIncomeButton({ income }: { income: IncomeEntry }) {
  return <IncomeDialog mode="edit" income={income} trigger={
    <button className="text-muted-foreground hover:text-amber-400 p-1 shrink-0" title="Edit income">
      <PencilLine className="w-3 h-3" />
    </button>
  } />;
}

function IncomeDialog({ mode, income, trigger }: { mode: 'add' | 'edit'; income?: IncomeEntry; trigger: React.ReactNode }) {
  const addIncome = useWealthOS(s => s.addIncome);
  const updateIncome = useWealthOS(s => s.updateIncome);
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    source: 'salary' as IncomeSource,
    label: '',
    amount: '',
    frequency: 'monthly' as Frequency,
    customDays: '15',
  });

  const handleOpenChange = (v: boolean) => {
    if (v && income) {
      setForm({
        source: income.source,
        label: income.label,
        amount: income.amount.toString(),
        frequency: income.frequency,
        customDays: (income.customDays || 15).toString(),
      });
    }
    setOpen(v);
  };

  const monthlyPreview = toMonthly(
    parseFloat(form.amount) || 0,
    form.frequency,
    form.frequency === 'custom' ? parseInt(form.customDays) || 30 : undefined,
  );

  const submit = () => {
    if (!form.label || !form.amount) return;
    const payload = {
      source: form.source,
      label: form.label,
      amount: parseFloat(form.amount) || 0,
      frequency: form.frequency,
      customDays: form.frequency === 'custom' ? parseInt(form.customDays) || 30 : undefined,
      active: true,
    };
    if (mode === 'edit' && income) {
      updateIncome(income.id, payload);
    } else {
      addIncome(payload);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-sm">
        <DialogHeader><DialogTitle className="text-emerald-400">{mode === 'edit' ? 'Edit Income Source' : 'Add Income Source'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g., Salary" className="bg-black/30 border-white/10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Source Type</Label>
            <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as IncomeSource })}>
              <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong border-white/10">
                {Object.entries(INCOME_SOURCE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Amount ({sym})</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g., 50000" className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as Frequency })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {Object.entries(FREQUENCY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.frequency === 'custom' && (
            <div>
              <Label className="text-xs text-muted-foreground">Interval (days)</Label>
              <Input type="number" value={form.customDays} onChange={e => setForm({ ...form, customDays: e.target.value })} placeholder="e.g., 15" className="bg-black/30 border-white/10 font-mono" />
              <p className="text-[10px] text-muted-foreground mt-1">Amount occurs every N days</p>
            </div>
          )}
          {form.amount && (
            <div className="p-2 rounded-md bg-emerald-500/5 border border-emerald-500/15">
              <p className="text-[11px] text-emerald-300/90">
                <Repeat className="w-3 h-3 inline mr-1" />
                Monthly equivalent: <span className="font-mono font-bold">{fmtFullCurrency(monthlyPreview, sym)}/mo</span>
                <span className="text-muted-foreground"> · Yearly: {fmtFullCurrency(monthlyPreview * 12, sym)}/yr</span>
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30">
            {mode === 'edit' ? 'Save Changes' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportIncomeButton() {
  const importIncome = useWealthOS(s => s.importIncome);
  return <CSVImportDialog entityType="income" onImport={importIncome} trigger={
    <Button size="sm" variant="outline" className="bg-black/30 border-white/10 hover:bg-white/5 text-foreground">
      <Upload className="w-3.5 h-3.5 mr-1" /> Import
    </Button>
  } />;
}

function AddExpenseDialog() {
  return <ExpenseDialog mode="add" trigger={
    <Button size="sm" className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
  } />;
}

function EditExpenseButton({ expense }: { expense: ExpenseEntry }) {
  return <ExpenseDialog mode="edit" expense={expense} trigger={
    <button className="text-muted-foreground hover:text-amber-400 p-1" title="Edit expense">
      <PencilLine className="w-2.5 h-2.5" />
    </button>
  } />;
}

function ExpenseDialog({ mode, expense, trigger }: { mode: 'add' | 'edit'; expense?: ExpenseEntry; trigger: React.ReactNode }) {
  const addExpense = useWealthOS(s => s.addExpense);
  const updateExpense = useWealthOS(s => s.updateExpense);
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: 'food' as ExpenseCategory,
    label: '',
    amount: '',
    frequency: 'monthly' as Frequency,
    customDays: '15',
    essential: true,
  });

  const handleOpenChange = (v: boolean) => {
    if (v && expense) {
      setForm({
        category: expense.category,
        label: expense.label,
        amount: expense.amount.toString(),
        frequency: expense.frequency,
        customDays: (expense.customDays || 15).toString(),
        essential: expense.essential,
      });
    }
    setOpen(v);
  };

  const monthlyPreview = toMonthly(
    parseFloat(form.amount) || 0,
    form.frequency,
    form.frequency === 'custom' ? parseInt(form.customDays) || 30 : undefined,
  );

  const submit = () => {
    if (!form.label || !form.amount) return;
    const payload = {
      category: form.category,
      label: form.label,
      amount: parseFloat(form.amount) || 0,
      frequency: form.frequency,
      customDays: form.frequency === 'custom' ? parseInt(form.customDays) || 30 : undefined,
      essential: form.essential,
    };
    if (mode === 'edit' && expense) {
      updateExpense(expense.id, payload);
    } else {
      addExpense(payload);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-sm">
        <DialogHeader><DialogTitle className="text-rose-400">{mode === 'edit' ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g., Groceries" className="bg-black/30 border-white/10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
              <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong border-white/10">
                {Object.entries(EXPENSE_CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Amount ({sym})</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g., 5000" className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as Frequency })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {Object.entries(FREQUENCY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.frequency === 'custom' && (
            <div>
              <Label className="text-xs text-muted-foreground">Interval (days)</Label>
              <Input type="number" value={form.customDays} onChange={e => setForm({ ...form, customDays: e.target.value })} placeholder="e.g., 15" className="bg-black/30 border-white/10 font-mono" />
              <p className="text-[10px] text-muted-foreground mt-1">Amount occurs every N days</p>
            </div>
          )}
          {form.amount && (
            <div className="p-2 rounded-md bg-rose-500/5 border border-rose-500/15">
              <p className="text-[11px] text-rose-300/90">
                <Repeat className="w-3 h-3 inline mr-1" />
                Monthly equivalent: <span className="font-mono font-bold">{fmtFullCurrency(monthlyPreview, sym)}/mo</span>
                <span className="text-muted-foreground"> · Yearly: {fmtFullCurrency(monthlyPreview * 12, sym)}/yr</span>
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Essential (non-discretionary)</Label>
            <Switch checked={form.essential} onCheckedChange={(v) => setForm({ ...form, essential: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30">
            {mode === 'edit' ? 'Save Changes' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportExpensesButton() {
  const importExpenses = useWealthOS(s => s.importExpenses);
  return <CSVImportDialog entityType="expenses" onImport={importExpenses} trigger={
    <Button size="sm" variant="outline" className="bg-black/30 border-white/10 hover:bg-white/5 text-foreground">
      <Upload className="w-3.5 h-3.5 mr-1" /> Import
    </Button>
  } />;
}
