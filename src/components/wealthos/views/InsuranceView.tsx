'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import { computeKPIs, fmtCurrency, fmtPct } from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar } from '../Primitives';
import { ShieldCheck, Heart, Activity, Home, Car, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import type { InsuranceType } from '@/lib/wealthos/types';

const INSURANCE_META: Record<InsuranceType, { label: string; icon: React.ElementType; color: string; recommended: string }> = {
  health:            { label: 'Health',            icon: Heart,        color: 'text-rose-400',    recommended: '₹10L-50L family floater' },
  life:              { label: 'Life (Term)',        icon: ShieldCheck,  color: 'text-emerald-400', recommended: '10-15x annual income' },
  disability:        { label: 'Disability',         icon: Activity,     color: 'text-amber-400',   recommended: '60-70% of income' },
  critical_illness:  { label: 'Critical Illness',   icon: AlertTriangle, color: 'text-orange-400',  recommended: '₹25L-1Cr' },
  property:          { label: 'Property',           icon: Home,         color: 'text-sky-400',     recommended: 'Full reconstruction cost' },
  auto:              { label: 'Auto',               icon: Car,          color: 'text-violet-400',  recommended: 'IDV + Comprehensive' },
};

export function InsuranceView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const sym = state.settings.currencySymbol;

  const totalCoverage = state.insurance.reduce((s, p) => s + p.coverageAmount, 0);
  const totalPremium = state.insurance.reduce((s, p) => s + p.annualPremium, 0);
  const coverageTypes = new Set(state.insurance.map(p => p.type));

  // Insurance adequacy
  const lifeCover = state.insurance.filter(p => p.type === 'life').reduce((s,p)=>s+p.coverageAmount,0);
  const recommendedLife = kpis.annualIncome * 12;
  const lifeAdequacy = recommendedLife > 0 ? (lifeCover / recommendedLife) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /><MetricLabel>Total Coverage</MetricLabel></div>
          <MetricValue value={totalCoverage} symbol={sym} className="text-2xl text-amber-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{state.insurance.length} active policies</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Annual Premium</MetricLabel>
          <MetricValue value={totalPremium} symbol={sym} className="text-2xl text-rose-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{fmtPct((totalPremium / kpis.annualIncome) * 100)} of income</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Life Cover Adequacy</MetricLabel>
          <p className={`text-2xl font-mono font-bold ${lifeAdequacy >= 100 ? 'text-emerald-400' : lifeAdequacy >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{lifeAdequacy.toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">vs 12x income recommended</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Coverage Types</MetricLabel>
          <p className="text-2xl font-mono font-bold text-sky-400">{coverageTypes.size}/6</p>
          <p className="text-[10px] text-muted-foreground mt-1">Categories covered</p>
        </GlassCard>
      </div>

      {/* Coverage gaps */}
      <GlassCard className="p-5">
        <SectionHeader title="Coverage Gap Analysis" subtitle="Recommended vs current insurance" icon={<AlertTriangle className="w-4 h-4" />} action={<AddInsuranceDialog />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(INSURANCE_META).map(([type, meta]) => {
            const policies = state.insurance.filter(p => p.type === type);
            const Icon = meta.icon;
            const has = policies.length > 0;
            return (
              <div key={type} className={`p-3 rounded-lg border ${has ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-rose-500/5 border-rose-500/15'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                    <span className="text-xs font-medium text-foreground">{meta.label}</span>
                  </div>
                  {has ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{meta.recommended}</p>
                {has ? (
                  <div>
                    <p className="text-sm font-mono font-semibold text-emerald-400">{fmtCurrency(policies.reduce((s,p)=>s+p.coverageAmount,0), sym)}</p>
                    <p className="text-[10px] text-muted-foreground">{policies.length} policy • {fmtCurrency(policies.reduce((s,p)=>s+p.annualPremium,0), sym)}/yr</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-rose-400">Not covered</p>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Policies */}
      <GlassCard className="p-5">
        <SectionHeader title="Active Policies" subtitle="All insurance holdings" icon={<ShieldCheck className="w-4 h-4" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium">Provider</th>
                <th className="text-right px-3 py-2 font-medium">Coverage</th>
                <th className="text-right px-3 py-2 font-medium">Annual Premium</th>
                <th className="text-right px-3 py-2 font-medium">Premium/Coverage</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {state.insurance.map(p => {
                const meta = INSURANCE_META[p.type];
                const Icon = meta.icon;
                return (
                  <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-3 py-2"><span className="inline-flex items-center gap-2"><Icon className={`w-3.5 h-3.5 ${meta.color}`} /><span className="text-foreground font-medium">{meta.label}</span></span></td>
                    <td className="px-3 py-2 text-muted-foreground">{p.provider}</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-400 tabular">{fmtCurrency(p.coverageAmount, sym)}</td>
                    <td className="px-3 py-2 text-right font-mono text-rose-400 tabular">{fmtCurrency(p.annualPremium, sym)}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular">{((p.annualPremium / p.coverageAmount) * 100).toFixed(2)}%</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => useWealthOS.getState().removeInsurance(p.id)} className="text-muted-foreground hover:text-rose-400 p-1"><Trash2 className="w-3 h-3" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function AddInsuranceDialog() {
  const addInsurance = useWealthOS(s => s.addInsurance);
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'health' as InsuranceType, provider: '', coverageAmount: '', annualPremium: '' });
  const submit = () => {
    if (!form.provider || !form.coverageAmount) return;
    addInsurance({ type: form.type, provider: form.provider, coverageAmount: parseFloat(form.coverageAmount) || 0, annualPremium: parseFloat(form.annualPremium) || 0 });
    setForm({ type: 'health', provider: '', coverageAmount: '', annualPremium: '' });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"><Plus className="w-3.5 h-3.5 mr-1" /> Add Policy</Button></DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-sm">
        <DialogHeader><DialogTitle className="text-amber-400">Add Insurance Policy</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Provider</Label>
            <Input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="e.g., HDFC Life" className="bg-black/30 border-white/10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as InsuranceType })}>
              <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong border-white/10">
                {Object.entries(INSURANCE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Coverage ({sym})</Label>
              <Input type="number" value={form.coverageAmount} onChange={e => setForm({ ...form, coverageAmount: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Annual Premium ({sym})</Label>
              <Input type="number" value={form.annualPremium} onChange={e => setForm({ ...form, annualPremium: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
