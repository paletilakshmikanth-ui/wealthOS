'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  computeAllocation,
  fmtCurrency,
  fmtPct,
  ASSET_CATEGORY_META,
  computeKPIs,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, DeltaPill } from '../Primitives';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie } from 'recharts';
import { TrendingUp, Activity, Target, Coins, BarChart3 } from 'lucide-react';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

export function InvestmentsView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const sym = state.settings.currencySymbol;
  const investments = state.assets.filter(a => ASSET_CATEGORY_META[a.category].isInvestment);
  const alloc = computeAllocation(investments);

  // Risk/return scatter
  const scatter = investments.map(a => ({
    name: a.name,
    expectedReturn: a.annualReturnRate,
    volatility: a.liquidity === 'high' ? 15 : a.liquidity === 'medium' ? 10 : a.liquidity === 'low' ? 7 : 5,
    value: a.currentValue,
    category: a.category,
  }));

  const totalInvested = investments.reduce((s, a) => s + a.investedValue, 0);
  const totalCurrent = investments.reduce((s, a) => s + a.currentValue, 0);
  const totalGain = totalCurrent - totalInvested;
  const gainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5 text-amber-400" /><MetricLabel>Investment Corpus</MetricLabel></div>
          <MetricValue value={totalCurrent} symbol={sym} className="text-2xl text-amber-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{investments.length} holdings</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Invested</MetricLabel>
          <MetricValue value={totalInvested} symbol={sym} className="text-2xl text-sky-400" />
          <p className="text-[10px] text-muted-foreground mt-1">Cost basis</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Unrealized Gains</MetricLabel>
          <MetricValue value={totalGain} symbol={sym} className={`text-2xl ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
          <DeltaPill value={gainPct} className="mt-1" />
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Investment Ratio</MetricLabel>
          <MetricValue value={kpis.investmentRatio} symbol="" suffix="%" className="text-2xl text-violet-400" />
          <p className="text-[10px] text-muted-foreground mt-1">% of total assets</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Risk vs Return Map" subtitle="Each holding positioned by expected return and volatility" icon={<Activity className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <XAxis type="number" dataKey="expectedReturn" name="Expected Return" unit="%" tick={axisStyle} tickLine={false} axisLine={false} domain={[0, 30]} />
              <YAxis type="number" dataKey="volatility" name="Volatility" unit="%" tick={axisStyle} tickLine={false} axisLine={false} domain={[0, 25]} />
              <ZAxis type="number" dataKey="value" range={[40, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any, n: any) => n === 'value' ? [fmtCurrency(v as number, sym), 'Value'] : [`${(v as number).toFixed(1)}%`, n]}
                labelFormatter={() => ''}
              />
              <Scatter data={scatter}>
                {scatter.map((s, i) => <Cell key={i} fill={ASSET_CATEGORY_META[s.category as keyof typeof ASSET_CATEGORY_META].color} fillOpacity={0.7} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Investment Allocation" subtitle="Diversification across asset classes" icon={<Target className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={alloc} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={1}>
                {alloc.map((a, i) => <Cell key={i} fill={ASSET_CATEGORY_META[a.category].color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any, n: any) => [fmtCurrency(v as number, sym), n]} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <SectionHeader title="Holdings Detail" subtitle="All investment positions" icon={<BarChart3 className="w-4 h-4" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-3 py-2 font-medium">Holding</th>
                <th className="text-left px-3 py-2 font-medium">Category</th>
                <th className="text-right px-3 py-2 font-medium">Invested</th>
                <th className="text-right px-3 py-2 font-medium">Current</th>
                <th className="text-right px-3 py-2 font-medium">Gain</th>
                <th className="text-right px-3 py-2 font-medium">Return %</th>
                <th className="text-right px-3 py-2 font-medium">Exp. Yield</th>
                <th className="px-3 py-2 font-medium">Liquidity</th>
              </tr>
            </thead>
            <tbody>
              {investments.sort((a,b)=>b.currentValue-a.currentValue).map(a => {
                const gain = a.currentValue - a.investedValue;
                const gainPct = a.investedValue > 0 ? (gain / a.investedValue) * 100 : 0;
                return (
                  <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-foreground font-medium">{a.name}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: ASSET_CATEGORY_META[a.category].color }} />
                        <span className="text-[10px] text-muted-foreground">{ASSET_CATEGORY_META[a.category].label}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular">{fmtCurrency(a.investedValue, sym)}</td>
                    <td className="px-3 py-2 text-right font-mono text-foreground tabular">{fmtCurrency(a.currentValue, sym)}</td>
                    <td className={`px-3 py-2 text-right font-mono tabular ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{gain >= 0 ? '+' : ''}{fmtCurrency(gain, sym)}</td>
                    <td className={`px-3 py-2 text-right font-mono tabular ${gainPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right font-mono text-amber-400 tabular">{a.annualReturnRate.toFixed(1)}%</td>
                    <td className="px-3 py-2"><span className="text-[10px] text-muted-foreground uppercase">{a.liquidity}</span></td>
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
