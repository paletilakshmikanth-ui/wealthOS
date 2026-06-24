'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  computeKPIs,
  fmtCurrency,
  fmtPct,
  calculateEMI,
  debtPayoffSchedule,
  LIABILITY_TYPE_META,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, DeltaPill } from '../Primitives';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { CreditCard, TrendingDown, AlertTriangle, Plus, Trash2, Flame, Snowflake, Calculator, PencilLine, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { CSVImportDialog } from '../CSVImportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Liability, LiabilityType } from '@/lib/wealthos/types';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

export function LiabilitiesView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const sym = state.settings.currencySymbol;

  const totalDebt = state.liabilities.reduce((s,l)=>s+l.outstandingBalance,0);
  const totalEMI = state.liabilities.reduce((s,l)=>s+l.emi,0);
  const totalInterest = state.liabilities.reduce((s,l) => {
    return s + (l.emi * l.tenureMonthsRemaining - l.outstandingBalance);
  }, 0);

  // Strategy comparison
  const avalanche = debtPayoffSchedule(state.liabilities, 'avalanche');
  const snowball = debtPayoffSchedule(state.liabilities, 'snowball');

  const strategyData = [
    { name: 'Avalanche', months: avalanche.totalMonths, interest: avalanche.totalInterestPaid },
    { name: 'Snowball',  months: snowball.totalMonths,  interest: snowball.totalInterestPaid },
  ];

  // Payoff timeline (avalanche, sampled every 6 months)
  const timeline = avalanche.schedule.filter((_, i) => i % 6 === 0).map(s => ({
    month: s.month,
    balance: s.totalBalance,
  }));

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="danger" className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-3.5 h-3.5 text-rose-400" />
            <MetricLabel>Total Liabilities</MetricLabel>
          </div>
          <MetricValue value={totalDebt} symbol={sym} className="text-2xl text-rose-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{state.liabilities.length} active loans</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Monthly EMI Burden</MetricLabel>
          <MetricValue value={totalEMI} symbol={sym} className="text-2xl text-amber-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{fmtPct(kpis.debtToIncomeRatio)} of income</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Future Interest</MetricLabel>
          <MetricValue value={totalInterest} symbol={sym} className="text-2xl text-orange-400" />
          <p className="text-[10px] text-muted-foreground mt-1">If paying minimum only</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Debt-to-Asset Ratio</MetricLabel>
          <MetricValue value={kpis.debtToAssetRatio} symbol="" suffix="%" className="text-2xl text-sky-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{kpis.debtToAssetRatio < 50 ? 'Healthy leverage' : 'High leverage'}</p>
        </GlassCard>
      </div>

      {/* Debt breakdown + strategy comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="p-5 xl:col-span-2">
          <SectionHeader title="Debt Portfolio" subtitle="All outstanding liabilities" icon={<CreditCard className="w-4 h-4" />} action={<div className="flex items-center gap-2"><ImportLiabilitiesButton /><AddLiabilityDialog /></div>} />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">Loan</th>
                  <th className="text-right px-3 py-2 font-medium">Outstanding</th>
                  <th className="text-right px-3 py-2 font-medium">EMI</th>
                  <th className="text-right px-3 py-2 font-medium">Rate</th>
                  <th className="text-right px-3 py-2 font-medium">Tenure Left</th>
                  <th className="text-right px-3 py-2 font-medium">Future Interest</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {state.liabilities.map(l => {
                  const futureInterest = l.emi * l.tenureMonthsRemaining - l.outstandingBalance;
                  return (
                    <tr key={l.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: LIABILITY_TYPE_META[l.type].color }} />
                          <div>
                            <div className="text-foreground font-medium">{l.name}</div>
                            <div className="text-[10px] text-muted-foreground">{LIABILITY_TYPE_META[l.type].label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-foreground tabular">{fmtCurrency(l.outstandingBalance, sym)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-amber-400 tabular">{fmtCurrency(l.emi, sym)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground tabular">{l.interestRate.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground tabular">{l.tenureMonthsRemaining}mo</td>
                      <td className="px-3 py-2.5 text-right font-mono text-rose-400 tabular">{fmtCurrency(futureInterest, sym)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditLiabilityButton liability={l} />
                          <button onClick={() => useWealthOS.getState().removeLiability(l.id)} className="text-muted-foreground hover:text-rose-400 p-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Strategy Comparison" subtitle="Avalanche vs Snowball" icon={<Calculator className="w-4 h-4" />} />
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Avalanche (Highest Rate First)</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Payoff: <span className="font-mono text-foreground">{avalanche.totalMonths}mo</span></span>
                <span className="text-muted-foreground">Interest: <span className="font-mono text-rose-400">{fmtCurrency(avalanche.totalInterestPaid, sym)}</span></span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-sky-500/5 border border-sky-500/15">
              <div className="flex items-center gap-2 mb-2">
                <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-medium text-sky-400">Snowball (Smallest Balance First)</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Payoff: <span className="font-mono text-foreground">{snowball.totalMonths}mo</span></span>
                <span className="text-muted-foreground">Interest: <span className="font-mono text-rose-400">{fmtCurrency(snowball.totalInterestPaid, sym)}</span></span>
              </div>
            </div>
            {avalanche.totalInterestPaid < snowball.totalInterestPaid && (
              <div className="p-2.5 rounded-md bg-emerald-500/5 border border-emerald-500/15">
                <p className="text-[10px] text-emerald-300/80">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Avalanche saves you <span className="font-mono font-bold">{fmtCurrency(snowball.totalInterestPaid - avalanche.totalInterestPaid, sym)}</span> in interest.
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Payoff timeline */}
      <GlassCard className="p-5">
        <SectionHeader title="Debt Payoff Trajectory" subtitle="Avalanche strategy projection" icon={<TrendingDown className="w-4 h-4" />} />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${(v/12).toFixed(1)}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={60} />
            <Tooltip
              contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: any) => [fmtCurrency(v as number, sym), 'Total Debt']}
              labelFormatter={(l: any) => `Month ${l}`}
            />
            <Line dataKey="balance" stroke="#f43f5e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}

function AddLiabilityDialog() {
  return <LiabilityDialog mode="add" trigger={
    <Button size="sm" className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30">
      <Plus className="w-3.5 h-3.5 mr-1" /> Add Liability
    </Button>
  } />;
}

function EditLiabilityButton({ liability }: { liability: Liability }) {
  return <LiabilityDialog mode="edit" liability={liability} trigger={
    <button className="text-muted-foreground hover:text-amber-400 p-1" title="Edit liability">
      <PencilLine className="w-3 h-3" />
    </button>
  } />;
}

function LiabilityDialog({ mode, liability, trigger }: { mode: 'add' | 'edit'; liability?: Liability; trigger: React.ReactNode }) {
  const addLiability = useWealthOS(s => s.addLiability);
  const updateLiability = useWealthOS(s => s.updateLiability);
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'home_loan' as LiabilityType,
    outstandingBalance: '', originalPrincipal: '',
    interestRate: '', emi: '', tenureMonthsRemaining: '', startDate: new Date().toISOString().slice(0, 10),
  });

  const handleOpenChange = (v: boolean) => {
    if (v && liability) {
      setForm({
        name: liability.name,
        type: liability.type,
        outstandingBalance: liability.outstandingBalance.toString(),
        originalPrincipal: liability.originalPrincipal.toString(),
        interestRate: liability.interestRate.toString(),
        emi: liability.emi.toString(),
        tenureMonthsRemaining: liability.tenureMonthsRemaining.toString(),
        startDate: liability.startDate,
      });
    }
    setOpen(v);
  };

  const submit = () => {
    if (!form.name || !form.outstandingBalance) return;
    const principal = parseFloat(form.outstandingBalance) || 0;
    const rate = parseFloat(form.interestRate) || 0;
    const tenure = parseInt(form.tenureMonthsRemaining) || 12;
    const emiCalc = form.emi ? parseFloat(form.emi) : calculateEMI(principal, rate, tenure).emi;
    const payload = {
      name: form.name,
      type: form.type,
      outstandingBalance: principal,
      originalPrincipal: parseFloat(form.originalPrincipal) || principal,
      interestRate: rate,
      emi: emiCalc,
      tenureMonthsRemaining: tenure,
      startDate: form.startDate,
    };
    if (mode === 'edit' && liability) {
      updateLiability(liability.id, payload);
    } else {
      addLiability(payload);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-rose-400">{mode === 'edit' ? 'Edit Liability' : 'Add Liability'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Loan Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Home Loan" className="bg-black/30 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as LiabilityType })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {Object.entries(LIABILITY_TYPE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Outstanding ({sym})</Label>
              <Input type="number" value={form.outstandingBalance} onChange={e => setForm({ ...form, outstandingBalance: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Rate (%)</Label>
              <Input type="number" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">EMI ({sym})</Label>
              <Input type="number" value={form.emi} onChange={e => setForm({ ...form, emi: e.target.value })} placeholder="auto" className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tenure (mo)</Label>
              <Input type="number" value={form.tenureMonthsRemaining} onChange={e => setForm({ ...form, tenureMonthsRemaining: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
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

function ImportLiabilitiesButton() {
  const importLiabilities = useWealthOS(s => s.importLiabilities);
  return <CSVImportDialog entityType="liabilities" onImport={importLiabilities} trigger={
    <Button size="sm" variant="outline" className="bg-black/30 border-white/10 hover:bg-white/5 text-foreground">
      <Upload className="w-3.5 h-3.5 mr-1" /> Import CSV
    </Button>
  } />;
}
