'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import { computeKPIs, computeFIRE, computeRetirement, generateInsights, computeAllocation, fmtCurrency, fmtPct, fmtDuration, ASSET_CATEGORY_META, generateReportHTML, downloadReport } from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, RingScore } from '../Primitives';
import { FileText, Download, Crown, PiggyBank, TrendingUp, Shield, Receipt, Users, Briefcase, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ReportsView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const fire = computeFIRE(state);
  const retirement = computeRetirement(state);
  const insights = generateInsights(state, kpis);
  const allocation = computeAllocation(state.assets);
  const sym = state.settings.currencySymbol;

  const handleDownload = (type: string) => {
    const html = generateReportHTML(state, type);
    const filename = `${type.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
    downloadReport(html, filename);
    toast.success(`${type} report generated`, {
      description: `Downloaded as ${filename}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Cover */}
      <GlassCard glow="gold" className="p-6 grid-bg">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <MetricLabel>WealthOS Infinity • Private Banking Report</MetricLabel>
            </div>
            <h1 className="text-3xl font-bold text-gradient-gold mb-1">{state.settings.profileName}</h1>
            <p className="text-xs text-muted-foreground">Wealth Intelligence Report — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-2">
            <RingScore score={kpis.wealthHealthScore} size={80} label="WEALTH" />
            <RingScore score={kpis.financialHealthScore} size={80} label="FIN." />
          </div>
        </div>
      </GlassCard>

      {/* Available reports */}
      <GlassCard className="p-5">
        <SectionHeader title="Institutional Reports" subtitle="Generate private banking-grade financial statements" icon={<FileText className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Monthly Wealth Report', desc: 'Net worth, allocation, monthly cash flow summary', icon: TrendingUp, color: 'text-amber-400' },
            { title: 'Quarterly Wealth Report', desc: 'Quarter performance vs goals, rebalancing needs', icon: FileText, color: 'text-sky-400' },
            { title: 'Annual Wealth Report', desc: 'Year-in-review with full financial statements', icon: Crown, color: 'text-amber-400' },
            { title: 'Investment Report', desc: 'Holdings, returns, performance attribution', icon: TrendingUp, color: 'text-emerald-400' },
            { title: 'Retirement Report', desc: 'Corpus projections, readiness, gap analysis', icon: PiggyBank, color: 'text-violet-400' },
            { title: 'Tax Report', desc: 'Tax liability, deductions, optimization roadmap', icon: Receipt, color: 'text-orange-400' },
            { title: 'Insurance Report', desc: 'Coverage map, adequacy, gap analysis', icon: Shield, color: 'text-rose-400' },
            { title: 'Family Office Report', desc: 'Family wealth distribution, succession readiness', icon: Users, color: 'text-sky-400' },
            { title: 'Estate Report', desc: 'Will readiness, nominee alignment, legacy planning', icon: FileCheck, color: 'text-amber-400' },
          ].map(r => {
            const Icon = r.icon;
            return (
              <button
                key={r.title}
                onClick={() => handleDownload(r.title)}
                className="text-left p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/[0.03] transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 rounded-md bg-white/5 flex items-center justify-center ${r.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <Download className="w-3 h-3 text-muted-foreground group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-1">{r.title}</h4>
                <p className="text-[10px] text-muted-foreground">{r.desc}</p>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Executive Summary" subtitle="Snapshot of your financial position" icon={<Briefcase className="w-4 h-4" />} />
          <div className="space-y-2">
            <SummaryRow label="Net Worth"                value={fmtCurrency(kpis.netWorth, sym)} />
            <SummaryRow label="Total Assets"             value={fmtCurrency(kpis.totalAssets, sym)} />
            <SummaryRow label="Total Liabilities"        value={fmtCurrency(kpis.totalLiabilities, sym)} />
            <SummaryRow label="Monthly Income"           value={fmtCurrency(kpis.monthlyIncome, sym)} />
            <SummaryRow label="Monthly Expenses"         value={fmtCurrency(kpis.monthlyExpenses, sym)} />
            <SummaryRow label="Monthly Surplus"          value={fmtCurrency(kpis.monthlySurplus, sym)} tone={kpis.monthlySurplus >= 0 ? 'positive' : 'negative'} />
            <SummaryRow label="Annual Savings Rate"      value={fmtPct(kpis.savingsRate)} tone={kpis.savingsRate >= 30 ? 'positive' : 'warning'} />
            <SummaryRow label="Emergency Fund Coverage"  value={`${kpis.emergencyFundMonths.toFixed(1)} months`} tone={kpis.emergencyFundMonths >= 6 ? 'positive' : 'warning'} />
            <SummaryRow label="Debt-to-Income Ratio"     value={fmtPct(kpis.debtToIncomeRatio)} tone={kpis.debtToIncomeRatio <= 40 ? 'positive' : 'negative'} />
            <SummaryRow label="FIRE Number"              value={fmtCurrency(fire.fireNumber, sym)} />
            <SummaryRow label="Years to FIRE"            value={fmtDuration(fire.yearsToFire)} tone="info" />
            <SummaryRow label="Retirement Readiness"     value={fmtPct(retirement.readinessPct)} tone={retirement.readinessPct >= 70 ? 'positive' : 'warning'} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Asset Allocation Summary" subtitle="Diversification snapshot" icon={<TrendingUp className="w-4 h-4" />} />
          <div className="space-y-1.5">
            {allocation.map(a => (
              <div key={a.category} className="flex items-center gap-3 p-2 rounded-md bg-white/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ASSET_CATEGORY_META[a.category].color }} />
                <span className="text-xs text-muted-foreground flex-1">{a.label}</span>
                <span className="text-xs font-mono text-foreground">{fmtCurrency(a.value, sym)}</span>
                <span className="text-[10px] font-mono text-amber-400 w-12 text-right">{a.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* CFO Recommendations */}
      <GlassCard className="p-5">
        <SectionHeader title="CFO Recommendations" subtitle="Top insights from your Personal Chief Financial Officer" icon={<FileText className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {insights.slice(0, 8).map(ins => (
            <div key={ins.id} className="p-2.5 rounded-md bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{ins.title}</span>
                <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  ins.severity === 'critical' ? 'bg-rose-500/15 text-rose-400' :
                  ins.severity === 'warning' ? 'bg-amber-500/15 text-amber-400' :
                  ins.severity === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                  'bg-sky-500/15 text-sky-400'
                }`}>{ins.severity}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{ins.recommendation}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function SummaryRow({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'positive' | 'negative' | 'warning' | 'info' | 'neutral' }) {
  const color = tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-rose-400' : tone === 'warning' ? 'text-amber-400' : tone === 'info' ? 'text-sky-400' : 'text-foreground';
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono font-semibold tabular ${color}`}>{value}</span>
    </div>
  );
}
