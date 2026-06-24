'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import { computeCashFlow, computeKPIs, fmtCurrency, fmtPct, INCOME_SOURCE_META } from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, DeltaPill } from '../Primitives';
import { ResponsiveContainer, Sankey, Tooltip, BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Plus, Trash2, Activity, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import type { IncomeEntry, IncomeSource, ExpenseEntry, ExpenseCategory } from '@/lib/wealthos/types';

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
          <SectionHeader title="Income Sources" subtitle="All active income streams" icon={<ArrowUpRight className="w-4 h-4" />} action={<AddIncomeDialog />} />
          <div className="space-y-2">
            {cf.income.map(i => {
              const meta = INCOME_SOURCE_META[i.source];
              return (
                <div key={i.label + i.source} className="flex items-center gap-3 p-2 rounded-md bg-white/[0.02] border border-white/5">
                  <div className={`w-1.5 h-8 rounded-full ${meta.isPassive ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{i.label}</span>
                      <span className="font-mono font-semibold text-emerald-400">{fmtCurrency(i.amount, sym)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{meta.label} {meta.isPassive && '• Passive'}</span>
                      <span className="text-[10px] text-muted-foreground">{i.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <button onClick={() => useWealthOS.getState().removeIncome(state.income.find(x => x.label === i.label && x.source === i.source)?.id || '')} className="text-muted-foreground hover:text-rose-400 p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Expense Breakdown" subtitle="Where your money goes" icon={<ArrowDownRight className="w-4 h-4" />} action={<AddExpenseDialog />} />
          <div className="grid grid-cols-2 gap-3">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={cf.expenses} dataKey="amount" nameKey="label" cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={1}>
                  {cf.expenses.map((e, i) => <Cell key={i} fill={e.essential ? '#34d399' : '#fbbf24'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 overflow-y-auto max-h-44 scroll-thin">
              {cf.expenses.map(e => (
                <div key={e.label} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${e.essential ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-muted-foreground">{e.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground">{fmtCurrency(e.amount, sym)}</span>
                    <button onClick={() => useWealthOS.getState().removeExpense(state.expenses.find(x => x.label === e.label)?.id || '')} className="text-muted-foreground hover:text-rose-400">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
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
  const addIncome = useWealthOS(s => s.addIncome);
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ source: 'salary' as IncomeSource, label: '', monthlyAmount: '' });
  const submit = () => {
    if (!form.label || !form.monthlyAmount) return;
    addIncome({ source: form.source, label: form.label, monthlyAmount: parseFloat(form.monthlyAmount) || 0, active: true });
    setForm({ source: 'salary', label: '', monthlyAmount: '' });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button></DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-sm">
        <DialogHeader><DialogTitle className="text-emerald-400">Add Income Source</DialogTitle></DialogHeader>
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
          <div>
            <Label className="text-xs text-muted-foreground">Monthly Amount ({sym})</Label>
            <Input type="number" value={form.monthlyAmount} onChange={e => setForm({ ...form, monthlyAmount: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddExpenseDialog() {
  const addExpense = useWealthOS(s => s.addExpense);
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'food' as ExpenseCategory, label: '', monthlyAmount: '', essential: true });
  const submit = () => {
    if (!form.label || !form.monthlyAmount) return;
    addExpense({ category: form.category, label: form.label, monthlyAmount: parseFloat(form.monthlyAmount) || 0, essential: form.essential });
    setForm({ category: 'food', label: '', monthlyAmount: '', essential: true });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button></DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-sm">
        <DialogHeader><DialogTitle className="text-rose-400">Add Expense</DialogTitle></DialogHeader>
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
          <div>
            <Label className="text-xs text-muted-foreground">Monthly Amount ({sym})</Label>
            <Input type="number" value={form.monthlyAmount} onChange={e => setForm({ ...form, monthlyAmount: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Essential (non-discretionary)</Label>
            <Switch checked={form.essential} onCheckedChange={(v) => setForm({ ...form, essential: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
