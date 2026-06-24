'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  projectElderCare,
  ELDER_CARE_NEED_META,
  fmtCurrency,
  fmtDuration,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, RingScore } from '../Primitives';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, AreaChart, Area } from 'recharts';
import { HeartPulse, Plus, Trash2, Calendar, TrendingUp, AlertTriangle, Activity, Home, Users, Shield, Coins } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import type { ElderCareNeed } from '@/lib/wealthos/types';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };
const NEED_ICON: Record<string, React.ElementType> = {
  medical: HeartPulse, housing: Home, caregiver: Users,
  insurance: Shield, monthly_support: Coins, emergency_fund: AlertTriangle,
};

export function ElderCareView() {
  const state = useWealthOS();
  const sym = state.settings.currencySymbol;
  const plans = state.elderCarePlans;

  const totals = plans.map(p => projectElderCare(p));
  const totalAnnual = totals.reduce((s, t) => s + t.totalAnnualCostToday, 0);
  const totalLifetime = totals.reduce((s, t) => s + t.totalLifetimeCost, 0);
  const totalInsuranceGap = totals.reduce((s, t) => s + t.insuranceGap, 0);

  // Bar chart: needs by category for each elder
  const needsByCategory = new Map<string, { name: string; total: number }>();
  for (const p of plans) {
    for (const n of p.needs) {
      const meta = ELDER_CARE_NEED_META[n.type];
      const existing = needsByCategory.get(n.type);
      if (existing) existing.total += n.annualCost;
      else needsByCategory.set(n.type, { name: meta.label, total: n.annualCost });
    }
  }
  const chartData = Array.from(needsByCategory.values());

  // Lifetime cost projection (year by year)
  const lifetimeData: { year: number; cost: number }[] = [];
  const maxYears = 25;
  for (let y = 0; y <= maxYears; y++) {
    let cost = 0;
    for (const p of plans) {
      for (const n of p.needs) {
        if (y < n.yearsNeeded) {
          cost += n.annualCost * Math.pow(1 + n.inflationRate / 100, y);
        }
      }
      cost += p.monthlySupport * 12 * Math.pow(1 + 0.06, y);
    }
    lifetimeData.push({ year: y, cost: Math.round(cost) });
  }

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-3.5 h-3.5 text-amber-400" /><MetricLabel>Elders Supported</MetricLabel></div>
          <p className="text-2xl font-mono font-bold text-amber-400">{plans.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{plans.reduce((s, p) => s + p.needs.length, 0)} care needs tracked</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Annual Cost Today</MetricLabel>
          <MetricValue value={totalAnnual} symbol={sym} className="text-2xl text-amber-400" />
          <p className="text-[10px] text-muted-foreground mt-1">All elders combined</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Lifetime Cost</MetricLabel>
          <MetricValue value={totalLifetime} symbol={sym} className="text-2xl text-rose-400" />
          <p className="text-[10px] text-muted-foreground mt-1">Inflation-adjusted</p>
        </GlassCard>
        <GlassCard glow={totalInsuranceGap > 0 ? 'danger' : 'success'} className="p-4">
          <MetricLabel>Insurance Gap</MetricLabel>
          <MetricValue value={totalInsuranceGap} symbol={sym} className={`text-2xl ${totalInsuranceGap > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          <p className="text-[10px] text-muted-foreground mt-1">Uncovered exposure</p>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Annual Cost by Need Category" subtitle="Where elder care money goes" icon={<Activity className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} />
              <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} width={100} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym)} />
              <Bar dataKey="total" radius={[0, 3, 3, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={['#f43f5e', '#fb923c', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa'][i % 6]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Lifetime Cost Trajectory" subtitle="25-year inflation-adjusted projection" icon={<TrendingUp className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={lifetimeData.filter((_, i) => i % 2 === 0)}>
              <defs>
                <linearGradient id="gElder" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `+${v}y`} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={70} />
              <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [fmtCurrency(v as number, sym) + '/yr', 'Annual Cost']} />
              <Area dataKey="cost" stroke="#fb923c" strokeWidth={2} fill="url(#gElder)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Per-elder plans */}
      {plans.map((plan, idx) => {
        const proj = totals[idx];
        return (
          <GlassCard key={plan.id} className="p-5">
            <SectionHeader
              title={plan.elderName}
              subtitle={`Age ${plan.age} • ${fmtDuration(85 - plan.age)} of expected care remaining`}
              icon={<HeartPulse className="w-4 h-4" />}
              action={
                <button onClick={() => useWealthOS.getState().removeElderCarePlan(plan.id)} className="text-muted-foreground hover:text-rose-400 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              }
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="p-2.5 rounded-md bg-black/30 border border-white/5">
                <MetricLabel>Monthly Support</MetricLabel>
                <p className="text-sm font-mono text-amber-400 mt-1">{fmtCurrency(plan.monthlySupport, sym)}</p>
              </div>
              <div className="p-2.5 rounded-md bg-black/30 border border-white/5">
                <MetricLabel>Annual Medical</MetricLabel>
                <p className="text-sm font-mono text-rose-400 mt-1">{fmtCurrency(plan.annualMedicalCost, sym)}</p>
              </div>
              <div className="p-2.5 rounded-md bg-black/30 border border-white/5">
                <MetricLabel>Insurance Cover</MetricLabel>
                <p className="text-sm font-mono text-emerald-400 mt-1">{fmtCurrency(plan.insuranceCoverage, sym)}</p>
              </div>
              <div className="p-2.5 rounded-md bg-black/30 border border-white/5">
                <MetricLabel>Lifetime Cost</MetricLabel>
                <p className="text-sm font-mono text-amber-400 mt-1">{fmtCurrency(proj.totalLifetimeCost, sym)}</p>
              </div>
            </div>

            <div className="space-y-2">
              {plan.needs.map(n => {
                const meta = ELDER_CARE_NEED_META[n.type];
                const Icon = NEED_ICON[n.type] || Activity;
                const lifetime = n.annualCost * n.yearsNeeded;
                return (
                  <div key={n.id} className="p-2.5 rounded-md bg-white/[0.02] border border-white/5">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-foreground">{meta.label}</span>
                          <button onClick={() => {
                            const updated = plan.needs.filter(x => x.id !== n.id);
                            useWealthOS.getState().updateElderCarePlan(plan.id, { needs: updated });
                          }} className="text-muted-foreground hover:text-rose-400 p-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-1.5">{n.description}</p>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">
                            <span className="font-mono text-amber-400">{fmtCurrency(n.annualCost, sym)}/yr</span>
                            <span className="mx-1.5">•</span>
                            <span>{n.yearsNeeded}y needed</span>
                            <span className="mx-1.5">•</span>
                            <span>Inflation: {n.inflationRate}%</span>
                          </span>
                          <span className="font-mono text-rose-400">Lifetime: {fmtCurrency(lifetime, sym)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {proj.insuranceGap > 0 && (
              <div className="mt-3 p-2.5 rounded bg-rose-500/5 border border-rose-500/15">
                <p className="text-[11px] text-rose-300/90 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Insurance gap of <span className="font-mono font-bold">{fmtCurrency(proj.insuranceGap, sym)}</span> — increase coverage or build elder care fund.
                </p>
              </div>
            )}
          </GlassCard>
        );
      })}

      {plans.length === 0 && (
        <GlassCard className="p-8 text-center">
          <HeartPulse className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No elder care plans yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add a parent family member first, then create their elder care plan.</p>
        </GlassCard>
      )}
    </div>
  );
}
