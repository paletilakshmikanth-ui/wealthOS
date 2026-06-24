'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  computeKPIs,
  computeAllocation,
  computeCashFlow,
  computeFIRE,
  computeRetirement,
  generateInsights,
  projectNetWorth,
  scoreRating,
  fmtCurrency,
  fmtPct,
  fmtDuration,
  ASSET_CATEGORY_META,
} from '@/lib/wealthos/engine';
import {
  GlassCard,
  MetricLabel,
  MetricValue,
  DeltaPill,
  SeverityPill,
  SectionHeader,
  ProgressBar,
  RingScore,
  Sparkline,
} from '../Primitives';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Sankey,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  Target,
  Shield,
  PiggyBank,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

export function DashboardView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const allocation = computeAllocation(state.assets);
  const cashflow = computeCashFlow(state);
  const fire = computeFIRE(state);
  const retirement = computeRetirement(state);
  const insights = generateInsights(state, kpis).slice(0, 4);
  const projection = projectNetWorth(state, 60);

  const sym = state.settings.currencySymbol;
  const wealthRating = scoreRating(kpis.wealthHealthScore);
  const financialRating = scoreRating(kpis.financialHealthScore);

  return (
    <div className="space-y-4">
      {/* HERO — Command Strip */}
      <GlassCard glow="gold" className="p-5">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <MetricLabel>Total Net Worth</MetricLabel>
              <DeltaPill value={kpis.netWorthChangePct} />
            </div>
            <div className="flex items-end gap-3">
              <MetricValue value={kpis.netWorth} symbol={sym} className="text-4xl text-gradient-gold" />
              <span className="text-xs text-muted-foreground mb-1.5">
                ↑ {fmtCurrency(kpis.annualGrowthProjection, sym)} projected next 12mo
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <HeroStat label="Total Assets"     value={kpis.totalAssets}     sym={sym} tone="positive" icon={TrendingUp} />
              <HeroStat label="Liabilities"      value={kpis.totalLiabilities} sym={sym} tone="negative" icon={TrendingDown} />
              <HeroStat label="Monthly Surplus"  value={kpis.monthlySurplus}  sym={sym} tone={kpis.monthlySurplus >= 0 ? 'positive' : 'negative'} icon={Activity} />
            </div>
          </div>

          <div className="lg:w-px lg:h-auto h-px bg-white/10" />

          {/* Scores */}
          <div className="flex items-center gap-6 justify-around">
            <div className="flex flex-col items-center gap-1.5">
              <RingScore score={kpis.wealthHealthScore} label="WEALTH" sublabel={wealthRating.label} size={92} />
              <span className="text-[10px] text-muted-foreground">Health Score</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RingScore score={kpis.financialHealthScore} label="FIN." sublabel={financialRating.label} size={92} />
              <span className="text-[10px] text-muted-foreground">Financial Score</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* KPI strip — 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard label="Savings Rate" value={fmtPct(kpis.savingsRate)} icon={PiggyBank} tone={kpis.savingsRate >= 30 ? 'positive' : kpis.savingsRate >= 15 ? 'warning' : 'negative'} delta={`Target: 30%`} />
        <KPICard label="Emergency Fund" value={`${kpis.emergencyFundMonths.toFixed(1)}mo`} icon={Shield} tone={kpis.emergencyFundMonths >= 6 ? 'positive' : kpis.emergencyFundMonths >= 3 ? 'warning' : 'negative'} delta={`Target: 6mo`} />
        <KPICard label="Debt/Income" value={fmtPct(kpis.debtToIncomeRatio)} icon={TrendingDown} tone={kpis.debtToIncomeRatio <= 30 ? 'positive' : kpis.debtToIncomeRatio <= 50 ? 'warning' : 'negative'} delta={`Target: <30%`} />
        <KPICard label="Investment %" value={fmtPct(kpis.investmentRatio)} icon={TrendingUp} tone={kpis.investmentRatio >= 70 ? 'positive' : 'warning'} delta={`Target: 70%+`} />
        <KPICard label="FIRE Progress" value={fmtPct(fire.progressPct)} icon={Flame} tone={fire.progressPct >= 50 ? 'positive' : 'warning'} delta={`${fmtDuration(fire.yearsToFire)} to FIRE`} />
        <KPICard label="Retirement" value={fmtPct(retirement.readinessPct)} icon={Target} tone={retirement.readinessPct >= 70 ? 'positive' : retirement.readinessPct >= 40 ? 'warning' : 'negative'} delta={`${retirement.yearsToRetirement}y to retire`} />
      </div>

      {/* Net Worth Trajectory + Asset Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="p-5 xl:col-span-2">
          <SectionHeader
            title="Net Worth Trajectory"
            subtitle="Historical performance & 5-year projection"
            icon={<Activity className="w-4 h-4" />}
            action={
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Historical
                </span>
                <span className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Projected
                </span>
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={[
              ...state.netWorthHistory.slice(-12).map(h => ({ date: h.date, value: h.netWorth, type: 'historical' })),
              ...projection.filter(p => p.month > 0 && p.month % 6 === 0).map(p => ({ date: p.date, value: p.value, type: 'projected' })),
            ]}>
              <defs>
                <linearGradient id="gHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gProj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={60} />
              <Tooltip
                contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => [fmtCurrency(v as number, sym), 'Net Worth']}
              />
              <Area dataKey="value" stroke="#d4af37" strokeWidth={2} fill="url(#gHist)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Asset Allocation" subtitle="Diversification map" icon={<Wallet className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={allocation}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={1}
                stroke="none"
              >
                {allocation.map((a, i) => (
                  <Cell key={i} fill={ASSET_CATEGORY_META[a.category].color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any, n: any) => [fmtCurrency(v as number, sym), n]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto scroll-thin">
            {allocation.slice(0, 6).map(a => (
              <div key={a.category} className="flex items-center gap-2 text-[11px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ASSET_CATEGORY_META[a.category].color }} />
                <span className="flex-1 truncate text-muted-foreground">{a.label}</span>
                <span className="font-mono tabular">{a.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* FIRE Progress + Cash Flow Sankey + Critical Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Financial Freedom" subtitle="FIRE progress meter" icon={<Flame className="w-4 h-4" />} />
          <div className="flex items-center justify-between mb-3">
            <div>
              <MetricLabel>FIRE Number</MetricLabel>
              <MetricValue value={fire.fireNumber} symbol={sym} className="text-2xl text-amber-400" />
            </div>
            <div className="text-right">
              <MetricLabel>Years to FIRE</MetricLabel>
              <span className="text-2xl font-mono font-bold text-emerald-400">{fmtDuration(fire.yearsToFire)}</span>
            </div>
          </div>
          <ProgressBar value={fire.progressPct} color="gold" height="h-3" showLabel />
          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
            <span>Current: <span className="font-mono text-foreground">{fmtCurrency(fire.currentCorpus, sym)}</span></span>
            <span>Target: <span className="font-mono text-foreground">{fmtCurrency(fire.fireNumber, sym)}</span></span>
          </div>
          <div className="mt-3 p-2 rounded-md bg-amber-500/5 border border-amber-500/15">
            <p className="text-[10px] text-amber-300/80">
              <Zap className="w-3 h-3 inline mr-1" />
              Contribute <span className="font-mono font-bold">{fmtCurrency(fire.monthlyContributionRequired, sym)}/mo</span> to retire by {state.settings.retirementAge}
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Cash Flow" subtitle="Monthly inflow vs outflow" icon={<ArrowUpRight className="w-4 h-4" />} />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                <MetricLabel>Income</MetricLabel>
              </div>
              <MetricValue value={kpis.monthlyIncome} symbol={sym} className="text-lg text-emerald-400" />
            </div>
            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/15">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownRight className="w-3 h-3 text-rose-400" />
                <MetricLabel>Expenses</MetricLabel>
              </div>
              <MetricValue value={kpis.monthlyExpenses} symbol={sym} className="text-lg text-rose-400" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={[
              { name: 'Salary',     v: cashflow.income.find(i => i.source === 'salary')?.amount || 0, type: 'in' },
              { name: 'Freelance',  v: cashflow.income.find(i => i.source === 'freelance')?.amount || 0, type: 'in' },
              { name: 'Passive',    v: cashflow.income.filter(i => ['dividend','rental','interest'].includes(i.source)).reduce((s,i)=>s+i.amount,0), type: 'in' },
              { name: 'Housing',    v: cashflow.expenses.find(e => e.category === 'housing')?.amount || 0, type: 'out' },
              { name: 'Food',       v: cashflow.expenses.find(e => e.category === 'food')?.amount || 0, type: 'out' },
              { name: 'Discretion', v: cashflow.expenses.filter(e => !e.essential).reduce((s,e)=>s+e.amount,0), type: 'out' },
            ]}>
              <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => fmtCurrency(v as number, sym)}
              />
              <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                {[
                  <Cell key="a" fill="#34d399" />,
                  <Cell key="b" fill="#34d399" />,
                  <Cell key="c" fill="#34d399" />,
                  <Cell key="d" fill="#f43f5e" />,
                  <Cell key="e" fill="#f43f5e" />,
                  <Cell key="f" fill="#f43f5e" />,
                ]}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="CFO Alerts" subtitle="Top financial insights" icon={<Sparkles className="w-4 h-4" />} />
          <div className="space-y-2 max-h-64 overflow-y-auto scroll-thin">
            {insights.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">All clear. No critical alerts.</div>
            )}
            {insights.map(ins => (
              <div key={ins.id} className="p-2.5 rounded-md bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground flex-1">{ins.title}</span>
                  <SeverityPill severity={ins.severity} />
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{ins.description}</p>
                {ins.impact > 0 && (
                  <p className="text-[10px] font-mono text-amber-400/80 mt-1">Impact: {fmtCurrency(ins.impact, sym)}</p>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Goals grid */}
      <GlassCard className="p-5">
        <SectionHeader title="Goals Tracking" subtitle={`${state.goals.length} active goals`} icon={<Target className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {state.goals.slice(0, 6).map(g => {
            const monthsLeft = Math.max(0, (new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
            const progressPct = (g.currentAmount / g.targetAmount) * 100;
            const tone = progressPct >= 75 ? 'success' : progressPct >= 40 ? 'warning' : 'danger';
            return (
              <div key={g.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground">{g.name}</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-white/5">{g.priority}</span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-mono font-semibold text-foreground">{fmtCurrency(g.currentAmount, sym)}</span>
                  <span className="text-[10px] text-muted-foreground">/ {fmtCurrency(g.targetAmount, sym)}</span>
                </div>
                <ProgressBar value={progressPct} color={tone} height="h-1.5" />
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>{progressPct.toFixed(1)}% complete</span>
                  <span>{Math.round(monthsLeft)}mo left</span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function HeroStat({
  label,
  value,
  sym,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  sym: string;
  tone: 'positive' | 'negative';
  icon: React.ElementType;
}) {
  const color = tone === 'positive' ? 'text-emerald-400' : 'text-rose-400';
  return (
    <div className="p-2.5 rounded-md bg-black/30 border border-white/5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className={`w-3 h-3 ${color}`} />
        <MetricLabel>{label}</MetricLabel>
      </div>
      <MetricValue value={value} symbol={sym} className={`text-base ${color}`} />
    </div>
  );
}

function KPICard({
  label,
  value,
  icon: Icon,
  tone,
  delta,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: 'positive' | 'warning' | 'negative';
  delta: string;
}) {
  const color = tone === 'positive' ? 'text-emerald-400' : tone === 'warning' ? 'text-amber-400' : 'text-rose-400';
  const bg = tone === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20' : tone === 'warning' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20';
  return (
    <GlassCard className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${bg}`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
      </div>
      <MetricLabel>{label}</MetricLabel>
      <p className={`text-lg font-mono font-bold tabular ${color} mt-0.5`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{delta}</p>
    </GlassCard>
  );
}
