'use client';

import { useState, useMemo } from 'react';
import { useWealthOS } from '@/lib/wealthos/store';
import {
  runMonteCarlo,
  computeNetWorth,
  fmtCurrency,
  fmtPct,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar } from '../Primitives';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Area, AreaChart } from 'recharts';
import { FlaskConical, TrendingUp, TrendingDown, Activity, Dice5, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

export function SimulationView() {
  const state = useWealthOS();
  const sym = state.settings.currencySymbol;

  const [monthlyContribution, setMonthlyContribution] = useState(state.income.filter(i => i.active).reduce((s,i)=>s+i.monthlyAmount,0) - state.expenses.reduce((s,e)=>s+e.monthlyAmount,0));
  const [years, setYears] = useState(state.settings.retirementAge - state.settings.currentAge);
  const [targetCorpus, setTargetCorpus] = useState(computeNetWorth(state) * 5);
  const [numSims, setNumSims] = useState(300);
  const [seed, setSeed] = useState(0);

  const initial = useMemo(() => {
    return state.assets.filter(a => a.category !== 'cash').reduce((s, a) => s + a.currentValue, 0);
  }, [state.assets]);

  const result = useMemo(() => {
    return runMonteCarlo(
      initial,
      monthlyContribution,
      state.settings.expectedMarketReturn,
      state.settings.marketVolatility,
      years,
      targetCorpus,
      numSims,
    );
  }, [initial, monthlyContribution, years, targetCorpus, numSims, state.settings.expectedMarketReturn, state.settings.marketVolatility, seed]);

  // Build chart data from paths
  const pathData = result.paths[0]?.map((_, i) => {
    const point: Record<string, number> = { month: i };
    result.paths.forEach((p, idx) => {
      point[`p${idx}`] = p[i] || 0;
    });
    // Add percentile bands
    const allAtI = result.paths.map(p => p[i] || 0).sort((a, b) => a - b);
    point.p95 = allAtI[Math.floor(allAtI.length * 0.95)] || 0;
    point.p50 = allAtI[Math.floor(allAtI.length * 0.5)] || 0;
    point.p05 = allAtI[Math.floor(allAtI.length * 0.05)] || 0;
    return point;
  }) || [];

  const recompute = () => setSeed(s => s + 1);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <MetricLabel>Best Case (P95)</MetricLabel>
          </div>
          <MetricValue value={result.best} symbol={sym} className="text-2xl text-emerald-400" />
          <p className="text-[10px] text-muted-foreground mt-1">95th percentile outcome</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <MetricLabel>Median (P50)</MetricLabel>
          </div>
          <MetricValue value={result.median} symbol={sym} className="text-2xl text-amber-400" />
          <p className="text-[10px] text-muted-foreground mt-1">Expected outcome</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <MetricLabel>Worst Case (P5)</MetricLabel>
          </div>
          <MetricValue value={result.worst} symbol={sym} className="text-2xl text-rose-400" />
          <p className="text-[10px] text-muted-foreground mt-1">5th percentile outcome</p>
        </GlassCard>
        <GlassCard glow={result.successRate >= 80 ? 'success' : 'danger'} className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Dice5 className="w-3.5 h-3.5 text-sky-400" />
            <MetricLabel>Success Probability</MetricLabel>
          </div>
          <p className={`text-2xl font-mono font-bold ${result.successRate >= 80 ? 'text-emerald-400' : result.successRate >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
            {result.successRate.toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">{numSims} simulations</p>
        </GlassCard>
      </div>

      {/* Controls */}
      <GlassCard className="p-5">
        <SectionHeader
          title="Monte Carlo Simulation Lab"
          subtitle="Test your wealth trajectory under thousands of market scenarios"
          icon={<FlaskConical className="w-4 h-4" />}
          action={<Button onClick={recompute} size="sm" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"><Dice5 className="w-3.5 h-3.5 mr-1" /> Re-run</Button>}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Monthly Contribution</Label>
              <span className="text-xs font-mono text-amber-400">{fmtCurrency(monthlyContribution, sym)}</span>
            </div>
            <Slider value={[monthlyContribution]} min={0} max={500000} step={5000} onValueChange={(v) => setMonthlyContribution(v[0])} />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Years</Label>
              <span className="text-xs font-mono text-amber-400">{years}y</span>
            </div>
            <Slider value={[years]} min={1} max={50} step={1} onValueChange={(v) => setYears(v[0])} />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Target Corpus</Label>
              <span className="text-xs font-mono text-amber-400">{fmtCurrency(targetCorpus, sym)}</span>
            </div>
            <Slider value={[targetCorpus]} min={1000000} max={500000000} step={1000000} onValueChange={(v) => setTargetCorpus(v[0])} />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Simulations</Label>
              <span className="text-xs font-mono text-amber-400">{numSims}</span>
            </div>
            <Slider value={[numSims]} min={50} max={1000} step={50} onValueChange={(v) => setNumSims(v[0])} />
          </div>
        </div>
      </GlassCard>

      {/* Simulation chart */}
      <GlassCard className="p-5">
        <SectionHeader
          title="Wealth Trajectory — Monte Carlo Bands"
          subtitle="Best/Median/Worst percentile bands over time"
          icon={<Activity className="w-4 h-4" />}
          action={
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> P95</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Median</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> P5</span>
            </div>
          }
        />
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={pathData}>
            <defs>
              <linearGradient id="gBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#d4af37" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${(v/12).toFixed(0)}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={70} />
            <Tooltip
              contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: any, n: any) => [fmtCurrency(v as number, sym), n === 'p95' ? 'Best (P95)' : n === 'p50' ? 'Median (P50)' : n === 'p05' ? 'Worst (P5)' : n]}
            />
            <ReferenceLine y={targetCorpus} stroke="#34d399" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `Target: ${fmtCurrency(targetCorpus, sym)}`, position: 'right', fill: '#34d399', fontSize: 10 }} />
            <Area dataKey="p95" stroke="#34d399" strokeWidth={1} fill="transparent" />
            <Area dataKey="p05" stroke="#f43f5e" strokeWidth={1} fill="transparent" />
            <Area dataKey="p50" stroke="#d4af37" strokeWidth={2} fill="url(#gBand)" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Sample paths */}
      <GlassCard className="p-5">
        <SectionHeader title="Sample Trajectories" subtitle="10 randomly sampled paths" icon={<Dice5 className="w-4 h-4" />} />
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={pathData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${(v/12).toFixed(0)}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={70} />
            <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym)} />
            {result.paths.map((_, idx) => (
              <Line key={idx} dataKey={`p${idx}`} stroke={`oklch(0.78 0.13 75 / ${0.15 + (idx / result.paths.length) * 0.3})`} strokeWidth={1} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Risk Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Downside Risk" subtitle="Worst case analysis" icon={<AlertTriangle className="w-4 h-4" />} />
          <MetricValue value={result.worst} symbol={sym} className="text-2xl text-rose-400" />
          <p className="text-[11px] text-muted-foreground mt-1 mb-3">
            If market conditions are extremely poor (P5), your corpus would reach {fmtCurrency(result.worst, sym)} in {years} years.
          </p>
          <ProgressBar value={(result.worst / targetCorpus) * 100} color="danger" height="h-2" showLabel />
        </GlassCard>
        <GlassCard className="p-5">
          <SectionHeader title="Expected Outcome" subtitle="Most likely trajectory" icon={<Activity className="w-4 h-4" />} />
          <MetricValue value={result.median} symbol={sym} className="text-2xl text-amber-400" />
          <p className="text-[11px] text-muted-foreground mt-1 mb-3">
            Median projection: {fmtCurrency(result.median, sym)}. This is your most likely outcome (P50).
          </p>
          <ProgressBar value={(result.median / targetCorpus) * 100} color="gold" height="h-2" showLabel />
        </GlassCard>
        <GlassCard glow="success" className="p-5">
          <SectionHeader title="Upside Potential" subtitle="Best case scenario" icon={<TrendingUp className="w-4 h-4" />} />
          <MetricValue value={result.best} symbol={sym} className="text-2xl text-emerald-400" />
          <p className="text-[11px] text-muted-foreground mt-1 mb-3">
            In a bullish market (P95), your corpus could reach {fmtCurrency(result.best, sym)} — a {((result.best / result.median - 1) * 100).toFixed(0)}% upside over median.
          </p>
          <ProgressBar value={(result.best / targetCorpus) * 100} color="success" height="h-2" showLabel />
        </GlassCard>
      </div>
    </div>
  );
}
