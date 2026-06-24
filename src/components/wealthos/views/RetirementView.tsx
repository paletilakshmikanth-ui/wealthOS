'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import { computeRetirement, computeKPIs, fmtCurrency, fmtPct, projectNetWorth } from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, RingScore } from '../Primitives';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { PiggyBank, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

export function RetirementView() {
  const state = useWealthOS();
  const sym = state.settings.currencySymbol;
  const retirement = computeRetirement(state);
  const kpis = computeKPIs(state);

  // Long-term projection to retirement age
  const years = state.settings.retirementAge - state.settings.currentAge;
  const projection = projectNetWorth(state, years);

  const chartData = projection.map((p, i) => ({
    ...p,
    year: i,
    target: retirement.retirementCorpus,
  }));

  return (
    <div className="space-y-4">
      {/* Hero */}
      <GlassCard glow="gold" className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <RingScore score={retirement.readinessPct} size={120} stroke={8} label="READY" sublabel={`${retirement.readinessPct.toFixed(0)}%`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-4 h-4 text-amber-400" />
              <MetricLabel>Retirement Readiness</MetricLabel>
            </div>
            <h1 className="text-3xl font-bold text-gradient-gold mb-2">{fmtCurrency(retirement.retirementCorpus, sym)}</h1>
            <p className="text-sm text-muted-foreground mb-3">
              Required corpus at age {state.settings.retirementAge} ({years} years away), assuming {state.settings.inflationRate}% inflation and {state.settings.safeWithdrawalRate}% safe withdrawal rate.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Hero label="Years to Retirement" value={`${retirement.yearsToRetirement}y`} icon={Calendar} tone="info" />
              <Hero label="Projected Corpus"     value={fmtCurrency(retirement.corpusAtRetirement, sym)} icon={TrendingUp} tone={retirement.surplus >= 0 ? 'positive' : 'negative'} />
              <Hero label="Shortfall"            value={fmtCurrency(retirement.shortfall, sym)} icon={AlertTriangle} tone={retirement.shortfall > 0 ? 'negative' : 'positive'} />
              <Hero label="Monthly Required"     value={fmtCurrency(retirement.monthlyContributionRequired, sym)} icon={Activity} tone="warning" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Projection chart */}
      <GlassCard className="p-5">
        <SectionHeader
          title="Wealth Projection to Retirement"
          subtitle={`${years}-year net worth trajectory with retirement corpus target`}
          icon={<TrendingUp className="w-4 h-4" />}
          action={
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Projected</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Target</span>
            </div>
          }
        />
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData.filter((_, i) => i % 2 === 0)}>
            <defs>
              <linearGradient id="gRetire" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `+${v}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={70} />
            <Tooltip
              contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: any, n: any) => [fmtCurrency(v as number, sym), n === 'value' ? 'Net Worth' : 'Target']}
            />
            <ReferenceLine y={retirement.retirementCorpus} stroke="#34d399" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `Target ${fmtCurrency(retirement.retirementCorpus, sym)}`, position: 'right', fill: '#34d399', fontSize: 10 }} />
            <Area dataKey="value" stroke="#d4af37" strokeWidth={2} fill="url(#gRetire)" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Three cards: Now, At Retirement, Post-Retirement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Today" subtitle="Current position" icon={<CheckCircle2 className="w-4 h-4" />} />
          <div className="space-y-2 text-xs">
            <Row label="Current Age" value={`${state.settings.currentAge}y`} />
            <Row label="Investment Corpus" value={fmtCurrency(kpis.totalAssets * (kpis.investmentRatio / 100), sym)} />
            <Row label="Annual Income" value={fmtCurrency(kpis.annualIncome, sym)} />
            <Row label="Annual Expenses" value={fmtCurrency(kpis.annualExpenses, sym)} />
            <Row label="Savings Rate" value={fmtPct(kpis.savingsRate)} />
          </div>
        </GlassCard>

        <GlassCard glow={retirement.shortfall > 0 ? 'danger' : 'success'} className="p-5">
          <SectionHeader title="At Retirement" subtitle={`Age ${state.settings.retirementAge}`} icon={<Calendar className="w-4 h-4" />} />
          <div className="space-y-2 text-xs">
            <Row label="Required Corpus" value={fmtCurrency(retirement.retirementCorpus, sym)} />
            <Row label="Projected Corpus" value={fmtCurrency(retirement.corpusAtRetirement, sym)} tone={retirement.surplus >= 0 ? 'positive' : 'negative'} />
            <Row label="Gap" value={fmtCurrency(retirement.shortfall, sym)} tone={retirement.shortfall > 0 ? 'negative' : 'positive'} />
            <Row label="Annual Income @SWR" value={fmtCurrency(retirement.projectedAnnualIncomeAtRetirement, sym)} />
            <Row label="Readiness" value={fmtPct(retirement.readinessPct)} tone={retirement.readinessPct >= 70 ? 'positive' : 'warning'} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Post-Retirement" subtitle={`${state.settings.lifeExpectancy - state.settings.retirementAge}y in retirement`} icon={<PiggyBank className="w-4 h-4" />} />
          <div className="space-y-2 text-xs">
            <Row label="Life Expectancy" value={`${state.settings.lifeExpectancy}y`} />
            <Row label="Years in Retirement" value={`${state.settings.lifeExpectancy - state.settings.retirementAge}y`} />
            <Row label="SWR" value={`${state.settings.safeWithdrawalRate}%`} />
            <Row label="Inflation Adjusted?" value="Yes" />
            <Row label="Corpus Sustainability" value={retirement.surplus > 0 ? 'Sustainable' : 'At Risk'} tone={retirement.surplus > 0 ? 'positive' : 'negative'} />
          </div>
        </GlassCard>
      </div>

      {retirement.shortfall > 0 && (
        <GlassCard glow="gold" className="p-5">
          <SectionHeader title="Action Required" subtitle="Close the retirement gap" icon={<AlertTriangle className="w-4 h-4" />} />
          <p className="text-sm text-foreground mb-3">
            You have a projected shortfall of <span className="font-mono font-bold text-rose-400">{fmtCurrency(retirement.shortfall, sym)}</span> at retirement. To close this gap, increase your monthly investments by <span className="font-mono font-bold text-amber-400">{fmtCurrency(retirement.monthlyContributionRequired, sym)}/mo</span> for the next {years} years.
          </p>
          <ProgressBar value={retirement.readinessPct} color="gold" height="h-2" showLabel />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded bg-white/[0.02] border border-white/5">
              <MetricLabel>Option 1: Increase SIP</MetricLabel>
              <p className="font-mono text-amber-400 mt-1">+{fmtCurrency(retirement.monthlyContributionRequired, sym)}/mo</p>
            </div>
            <div className="p-2 rounded bg-white/[0.02] border border-white/5">
              <MetricLabel>Option 2: Delay Retirement</MetricLabel>
              <p className="font-mono text-amber-400 mt-1">+3 years</p>
            </div>
            <div className="p-2 rounded bg-white/[0.02] border border-white/5">
              <MetricLabel>Option 3: Higher Returns</MetricLabel>
              <p className="font-mono text-amber-400 mt-1">+2% expected</p>
            </div>
          </div>
        </GlassCard>
      )}
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

function Row({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'positive' | 'negative' | 'warning' | 'info' | 'neutral' }) {
  const color = tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-rose-400' : tone === 'warning' ? 'text-amber-400' : tone === 'info' ? 'text-sky-400' : 'text-foreground';
  return (
    <div className="flex justify-between py-1.5 border-b border-white/5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
