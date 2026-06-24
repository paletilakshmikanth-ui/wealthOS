'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  projectChildMilestone,
  CHILD_MILESTONE_META,
  fmtCurrency,
  fmtDuration,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, RingScore } from '../Primitives';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Baby, GraduationCap, Heart, Plus, Trash2, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Coins } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import type { ChildMilestone } from '@/lib/wealthos/types';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };
const MILESTONE_ICON: Record<string, React.ElementType> = {
  primary_education: GraduationCap, secondary_education: GraduationCap, higher_education: GraduationCap,
  marriage: Heart, business_seed: Coins, first_home: Baby,
};

export function ChildrenView() {
  const state = useWealthOS();
  const sym = state.settings.currencySymbol;
  const inflationRate = state.settings.inflationRate;
  const plans = state.childPlans;

  // Aggregate stats
  const totalFutureValue = plans.reduce((s, p) =>
    s + p.milestones.reduce((ms, m) => ms + projectChildMilestone(m, p.currentAge, inflationRate).futureValue, 0), 0);
  const totalCurrentCorpus = plans.reduce((s, p) =>
    s + p.milestones.reduce((ms, m) => ms + m.currentCorpus, 0), 0);
  const totalMonthlyContribution = plans.reduce((s, p) =>
    s + p.milestones.reduce((ms, m) => ms + m.monthlyContribution, 0), 0);
  const totalShortfall = plans.reduce((s, p) =>
    s + p.milestones.reduce((ms, m) => ms + projectChildMilestone(m, p.currentAge, inflationRate).shortfall, 0), 0);

  // Chart data — show projection over time
  const chartData: { year: number; projected: number; target: number }[] = [];
  const maxYears = 30;
  for (let y = 0; y <= maxYears; y++) {
    let projected = 0;
    let target = 0;
    for (const p of plans) {
      for (const m of p.milestones) {
        const rM = (m.expectedReturnRate / 100) / 12;
        const months = y * 12;
        projected += m.currentCorpus * Math.pow(1 + rM, months) +
          m.monthlyContribution * (rM > 0 ? ((Math.pow(1 + rM, months) - 1) / rM) : months);
        if (m.ageAtMilestone - p.currentAge === y) {
          target += m.targetAmount * Math.pow(1 + inflationRate / 100, y);
        }
      }
    }
    chartData.push({ year: y, projected: Math.round(projected), target: Math.round(target) });
  }

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1"><Baby className="w-3.5 h-3.5 text-amber-400" /><MetricLabel>Children Tracked</MetricLabel></div>
          <p className="text-2xl font-mono font-bold text-amber-400">{plans.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{plans.reduce((s, p) => s + p.milestones.length, 0)} milestones</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Future Value Needed</MetricLabel>
          <MetricValue value={totalFutureValue} symbol={sym} className="text-2xl text-sky-400" />
          <p className="text-[10px] text-muted-foreground mt-1">Inflation-adjusted ({inflationRate}%)</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Current Corpus</MetricLabel>
          <MetricValue value={totalCurrentCorpus} symbol={sym} className="text-2xl text-emerald-400" />
          <p className="text-[10px] text-muted-foreground mt-1">Already saved</p>
        </GlassCard>
        <GlassCard glow={totalShortfall > 0 ? 'danger' : 'success'} className="p-4">
          <MetricLabel>Shortfall</MetricLabel>
          <MetricValue value={totalShortfall} symbol={sym} className={`text-2xl ${totalShortfall > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          <p className="text-[10px] text-muted-foreground mt-1">{fmtCurrency(totalMonthlyContribution, sym)}/mo invested</p>
        </GlassCard>
      </div>

      {/* Projection chart */}
      <GlassCard className="p-5">
        <SectionHeader
          title="Children Wealth Projection"
          subtitle="30-year projection across all children's milestones"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData.filter((_, i) => i % 2 === 0)}>
            <defs>
              <linearGradient id="gChild" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `+${v}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={70} />
            <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any, n: any) => [fmtCurrency(v as number, sym), n === 'projected' ? 'Projected Corpus' : 'Milestone Targets']} />
            <Area dataKey="projected" stroke="#d4af37" strokeWidth={2} fill="url(#gChild)" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Per-child plans */}
      {plans.map(plan => (
        <GlassCard key={plan.id} className="p-5">
          <SectionHeader
            title={plan.childName}
            subtitle={`Age ${plan.currentAge} • ${plan.milestones.length} milestones planned`}
            icon={<Baby className="w-4 h-4" />}
            action={
              <button onClick={() => useWealthOS.getState().removeChildPlan(plan.id)} className="text-muted-foreground hover:text-rose-400 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            }
          />
          <div className="space-y-2">
            {plan.milestones.map(m => {
              const meta = CHILD_MILESTONE_META[m.type];
              const Icon = MILESTONE_ICON[m.type] || GraduationCap;
              const proj = projectChildMilestone(m, plan.currentAge, inflationRate);
              return (
                <div key={m.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{meta.label}</span>
                        {proj.onTrack ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" /> On Track
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" /> Behind
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        At age {m.ageAtMilestone} • {fmtDuration(proj.yearsToMilestone)} from now
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                    <div>
                      <p className="text-muted-foreground">Target (today)</p>
                      <p className="font-mono text-foreground">{fmtCurrency(m.targetAmount, sym)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Future Value</p>
                      <p className="font-mono text-amber-400">{fmtCurrency(proj.futureValue, sym)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Projected</p>
                      <p className={`font-mono ${proj.onTrack ? 'text-emerald-400' : 'text-rose-400'}`}>{fmtCurrency(proj.projectedCorpus, sym)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Shortfall</p>
                      <p className={`font-mono ${proj.shortfall > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{fmtCurrency(proj.shortfall, sym)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly Needed</p>
                      <p className="font-mono text-amber-400">{fmtCurrency(proj.requiredMonthlyContribution, sym)}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <ProgressBar value={(m.currentCorpus / Math.max(1, proj.futureValue)) * 100} color={proj.onTrack ? 'success' : 'warning'} height="h-1.5" />
                  </div>

                  {!proj.onTrack && (
                    <div className="mt-2 p-2 rounded bg-amber-500/5 border border-amber-500/15">
                      <p className="text-[10px] text-amber-300/90">
                        Increase monthly SIP from <span className="font-mono font-bold">{fmtCurrency(m.monthlyContribution, sym)}</span> to <span className="font-mono font-bold">{fmtCurrency(proj.requiredMonthlyContribution, sym)}</span> to stay on track.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      ))}

      {plans.length === 0 && (
        <GlassCard className="p-8 text-center">
          <Baby className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No children plans yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add a family member first (under Family Office), then create their plan.</p>
        </GlassCard>
      )}
    </div>
  );
}
