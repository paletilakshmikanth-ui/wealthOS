'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  computeFIRE,
  computeRetirement,
  fmtCurrency,
  fmtPct,
  fmtDuration,
  projectNetWorth,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, RingScore } from '../Primitives';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Flame, Target, PiggyBank, TrendingUp, Zap, Calendar, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FIRCEResult } from '@/lib/wealthos/types';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

export function FireView() {
  const state = useWealthOS();
  const sym = state.settings.currencySymbol;
  const [fireType, setFireType] = useState<FIRCEResult['fireType']>('regular');
  const fire = computeFIRE(state, fireType);
  const retirement = computeRetirement(state);

  const projection = projectNetWorth(state, 360);
  const fireLine = projection.map(p => ({ ...p, fireTarget: fire.fireNumber }));

  return (
    <div className="space-y-4">
      {/* HERO */}
      <GlassCard glow="gold" className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <RingScore score={fire.progressPct} size={120} stroke={8} label="FIRE" sublabel={`${fire.progressPct.toFixed(0)}%`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <MetricLabel>Financial Independence Retire Early</MetricLabel>
            </div>
            <h1 className="text-3xl font-bold text-gradient-gold mb-2">{fmtCurrency(fire.fireNumber, sym)}</h1>
            <p className="text-sm text-muted-foreground mb-3">
              Your FIRE target corpus — {state.settings.safeWithdrawalRate}% safe withdrawal rate × annual expenses
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Hero label="Current Corpus"   value={fmtCurrency(fire.currentCorpus, sym)}        icon={PiggyBank} tone="positive" />
              <Hero label="Years to FIRE"    value={fmtDuration(fire.yearsToFire)}              icon={Calendar}   tone={fire.yearsToFire < 15 ? 'positive' : 'warning'} />
              <Hero label="FIRE Date"        value={new Date(fire.fireDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })} icon={Target} tone="info" />
              <Hero label="Annual Expenses"  value={fmtCurrency(fire.annualExpenses, sym)}      icon={TrendingUp} tone="neutral" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* FIRE type selector */}
      <GlassCard className="p-5">
        <SectionHeader title="FIRE Strategy" subtitle="Choose your financial independence target" icon={<Flame className="w-4 h-4" />} />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['lean', 'regular', 'barista', 'coast', 'fat'] as const).map(t => {
            const res = computeFIRE(state, t);
            const mult = { lean: '15x', regular: '25x', barista: '15x', coast: '25x', fat: '50x' }[t];
            const active = fireType === t;
            return (
              <button
                key={t}
                onClick={() => setFireType(t)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  active ? 'bg-amber-500/15 border-amber-500/40 glow-gold' : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-amber-400' : 'text-muted-foreground'}`}>{t}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{mult}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">
                  {t === 'lean' && 'Frugal lifestyle'}
                  {t === 'regular' && 'Standard lifestyle'}
                  {t === 'barista' && 'Part-time work'}
                  {t === 'coast' && 'Coast on growth'}
                  {t === 'fat' && 'Luxury lifestyle'}
                </p>
                <p className="text-xs font-mono font-semibold text-foreground">{fmtCurrency(res.fireNumber, sym)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDuration(res.yearsToFire)} to reach</p>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* FIRE trajectory */}
      <GlassCard className="p-5">
        <SectionHeader
          title="Wealth vs FIRE Target"
          subtitle="30-year net worth projection with FIRE threshold"
          icon={<TrendingUp className="w-4 h-4" />}
          action={
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Net Worth</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> FIRE Target</span>
            </div>
          }
        />
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={fireLine.filter((_, i) => i % 6 === 0)}>
            <defs>
              <linearGradient id="gFire" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={70} />
            <Tooltip
              contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: any, n: any) => [fmtCurrency(v as number, sym), n === 'value' ? 'Net Worth' : 'FIRE Target']}
            />
            <ReferenceLine y={fire.fireNumber} stroke="#34d399" strokeDasharray="6 4" strokeWidth={1.5} />
            <Area dataKey="value" stroke="#d4af37" strokeWidth={2} fill="url(#gFire)" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Required action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard glow="gold" className="p-5">
          <SectionHeader title="Required Monthly Investment" subtitle="To reach FIRE by retirement age" icon={<Zap className="w-4 h-4" />} />
          <MetricValue value={fire.monthlyContributionRequired} symbol={sym} className="text-3xl text-gradient-gold" />
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Per month for {state.settings.retirementAge - state.settings.currentAge} years at {state.settings.expectedMarketReturn}% expected return
          </p>
          <ProgressBar value={fire.progressPct} color="gold" height="h-2" showLabel />
          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
            <span>Current: <span className="font-mono text-foreground">{fmtCurrency(fire.currentCorpus, sym)}</span></span>
            <span>Target: <span className="font-mono text-amber-400">{fmtCurrency(fire.fireNumber, sym)}</span></span>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Retirement Readiness" subtitle="Conventional retirement projection" icon={<PiggyBank className="w-4 h-4" />} />
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
              <MetricLabel>Required Corpus</MetricLabel>
              <MetricValue value={retirement.retirementCorpus} symbol={sym} className="text-base text-amber-400" />
            </div>
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
              <MetricLabel>Projected Corpus</MetricLabel>
              <MetricValue value={retirement.corpusAtRetirement} symbol={sym} className="text-base text-emerald-400" />
            </div>
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
              <MetricLabel>Shortfall</MetricLabel>
              <MetricValue value={retirement.shortfall} symbol={sym} className="text-base text-rose-400" />
            </div>
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
              <MetricLabel>Readiness</MetricLabel>
              <span className="text-base font-mono font-bold text-amber-400">{retirement.readinessPct.toFixed(0)}%</span>
            </div>
          </div>
          {retirement.shortfall > 0 && (
            <div className="mt-3 p-2.5 rounded-md bg-amber-500/5 border border-amber-500/15 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/80">
                Invest an additional <span className="font-mono font-bold">{fmtCurrency(retirement.monthlyContributionRequired, sym)}/mo</span> to close the gap by retirement.
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function Hero({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: 'positive' | 'negative' | 'warning' | 'info' | 'neutral' }) {
  const color = tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-rose-400' : tone === 'warning' ? 'text-amber-400' : tone === 'info' ? 'text-sky-400' : 'text-foreground';
  return (
    <div className="p-2.5 rounded-md bg-black/30 border border-white/5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${color}`} />
        <MetricLabel>{label}</MetricLabel>
      </div>
      <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
    </div>
  );
}
