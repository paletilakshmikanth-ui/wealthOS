'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  computeKPIs,
  generateInsights,
  fmtCurrency,
  computeAllocation,
  computeCashFlow,
  ASSET_CATEGORY_META,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, SeverityPill, ProgressBar, RingScore } from '../Primitives';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Lightbulb, AlertTriangle, TrendingUp, Shield, PiggyBank, Receipt, Target, CreditCard, Wallet, Sparkles } from 'lucide-react';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

const CATEGORY_ICON = {
  savings: PiggyBank, debt: CreditCard, insurance: Shield, tax: Receipt,
  retirement: PiggyBank, goal: Target, investment: TrendingUp, cashflow: Wallet,
};

export function InsightsView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const insights = generateInsights(state, kpis);
  const sym = state.settings.currencySymbol;

  const critical = insights.filter(i => i.severity === 'critical');
  const warnings = insights.filter(i => i.severity === 'warning');
  const success = insights.filter(i => i.severity === 'success');
  const info = insights.filter(i => i.severity === 'info');

  // Radar chart of financial health dimensions
  const radarData = [
    { dim: 'Savings',       score: Math.min(100, kpis.savingsRate * 2) },
    { dim: 'Emergency',     score: Math.min(100, (kpis.emergencyFundMonths / 6) * 100) },
    { dim: 'Debt Mgmt',     score: Math.max(0, 100 - kpis.debtToIncomeRatio * 1.5) },
    { dim: 'Investments',   score: Math.min(100, kpis.investmentRatio * 1.2) },
    { dim: 'Insurance',     score: Math.min(100, state.insurance.length * 20) },
    { dim: 'Goals',         score: state.goals.length > 0 ? Math.min(100, (state.goals.reduce((s,g)=>s+g.currentAmount/g.targetAmount,0)/state.goals.length)*100) : 0 },
    { dim: 'Diversification', score: Math.min(100, computeAllocation(state.assets).length * 12) },
    { dim: 'FI Progress',   score: kpis.financialIndependencePct },
  ];

  return (
    <div className="space-y-4">
      {/* Hero summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow={critical.length > 0 ? 'danger' : 'gold'} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <MetricLabel>Critical Alerts</MetricLabel>
              <p className="text-3xl font-mono font-bold text-rose-400 mt-1">{critical.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-rose-400/40" />
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <MetricLabel>Warnings</MetricLabel>
              <p className="text-3xl font-mono font-bold text-amber-400 mt-1">{warnings.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-400/40" />
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <MetricLabel>On Track</MetricLabel>
              <p className="text-3xl font-mono font-bold text-emerald-400 mt-1">{success.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-400/40" />
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <MetricLabel>CFO Score</MetricLabel>
              <p className="text-3xl font-mono font-bold text-amber-400 mt-1">{kpis.wealthHealthScore}</p>
            </div>
            <Sparkles className="w-8 h-8 text-amber-400/40" />
          </div>
        </GlassCard>
      </div>

      {/* Radar + insights list */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Financial Health Radar" subtitle="Multi-dimensional wellness map" icon={<Lightbulb className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
              <Radar dataKey="score" stroke="#d4af37" fill="#d4af37" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5 xl:col-span-2">
          <SectionHeader title="CFO Intelligence Briefing" subtitle="Personal Chief Financial Officer insights" icon={<Lightbulb className="w-4 h-4" />} />
          <div className="space-y-2 max-h-[400px] overflow-y-auto scroll-thin pr-1">
            {insights.map(ins => {
              const Icon = CATEGORY_ICON[ins.category];
              return (
                <div key={ins.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      ins.severity === 'critical' ? 'bg-rose-500/15 text-rose-400' :
                      ins.severity === 'warning' ? 'bg-amber-500/15 text-amber-400' :
                      ins.severity === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                      'bg-sky-500/15 text-sky-400'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium text-foreground">{ins.title}</h4>
                        <SeverityPill severity={ins.severity} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">{ins.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-amber-300/90 flex-1">
                          <span className="font-semibold">Action:</span> {ins.recommendation}
                        </p>
                        {ins.impact > 0 && (
                          <span className="text-[10px] font-mono text-amber-400/80 shrink-0">↓ {fmtCurrency(ins.impact, sym)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Recommendations summary */}
      <GlassCard className="p-5">
        <SectionHeader title="Strategic Priorities" subtitle="Where to focus next 90 days" icon={<Target className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.filter(i => i.severity === 'critical' || i.severity === 'warning').slice(0, 6).map((ins, i) => (
            <div key={ins.id} className="flex items-start gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
              <span className="text-amber-400 font-mono text-xs font-bold">#{i + 1}</span>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground mb-1">{ins.title}</p>
                <p className="text-[11px] text-muted-foreground">{ins.recommendation}</p>
              </div>
            </div>
          ))}
          {insights.filter(i => i.severity === 'critical' || i.severity === 'warning').length === 0 && (
            <div className="col-span-2 text-center py-6">
              <p className="text-sm text-emerald-400 font-medium">All systems nominal. No critical actions needed.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
