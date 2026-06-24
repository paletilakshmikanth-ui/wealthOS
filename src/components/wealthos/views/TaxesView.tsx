'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import { computeKPIs, fmtCurrency, fmtPct } from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar } from '../Primitives';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Receipt, TrendingUp, TrendingDown, PiggyBank, Calculator } from 'lucide-react';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

export function TaxesView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const sym = state.settings.currencySymbol;

  // Rough tax estimation (India FY24-25 new regime slabs)
  const annualIncome = kpis.annualIncome;
  const slabs = [
    { upTo: 300000, rate: 0 },
    { upTo: 700000, rate: 0.05 },
    { upTo: 1000000, rate: 0.10 },
    { upTo: 1200000, rate: 0.15 },
    { upTo: 1500000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 },
  ];
  let tax = 0;
  let prev = 0;
  const slabData: { slab: string; tax: number }[] = [];
  for (const s of slabs) {
    if (annualIncome > prev) {
      const taxable = Math.min(annualIncome, s.upTo) - prev;
      const slabTax = taxable * s.rate;
      tax += slabTax;
      if (s.rate > 0) slabData.push({ slab: `${(prev/100000).toFixed(0)}L-${s.upTo === Infinity ? '∞' : (s.upTo/100000).toFixed(0)+'L'}`, tax: slabTax });
      prev = s.upTo;
    } else break;
  }
  const cess = tax * 0.04;
  const totalTax = tax + cess;
  const effectiveRate = (totalTax / annualIncome) * 100;

  // Tax-advantaged investments
  const taxAdvantaged = state.assets
    .filter(a => ['ppf', 'epf', 'nps'].includes(a.category))
    .reduce((s, a) => s + a.currentValue, 0);
  const section80CUsed = Math.min(150000, state.assets
    .filter(a => ['ppf', 'epf'].includes(a.category))
    .reduce((s, a) => s + a.currentValue * 0.001, 0) * 12); // approximation
  const section80CCD = Math.min(50000, state.assets.filter(a => a.category === 'nps').reduce((s,a)=>s+a.currentValue*0.001,0)*12);
  const potentialSavings = (150000 - Math.min(150000, section80CUsed)) * (state.settings.taxBracket / 100) + (50000 - Math.min(50000, section80CCD)) * (state.settings.taxBracket / 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1"><Receipt className="w-3.5 h-3.5 text-amber-400" /><MetricLabel>Annual Income</MetricLabel></div>
          <MetricValue value={annualIncome} symbol={sym} className="text-2xl text-amber-400" />
          <p className="text-[10px] text-muted-foreground mt-1">Pre-tax</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Estimated Tax</MetricLabel>
          <MetricValue value={totalTax} symbol={sym} className="text-2xl text-rose-400" />
          <p className="text-[10px] text-muted-foreground mt-1">Including 4% cess</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Effective Rate</MetricLabel>
          <p className="text-2xl font-mono font-bold text-amber-400">{effectiveRate.toFixed(2)}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Marginal: {state.settings.taxBracket}%</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Potential Savings</MetricLabel>
          <MetricValue value={Math.max(0, potentialSavings)} symbol={sym} className="text-2xl text-emerald-400" />
          <p className="text-[10px] text-muted-foreground mt-1">Via 80C + 80CCD</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Tax Slab Breakdown" subtitle="Income tax liability by slab (New Regime)" icon={<Receipt className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={slabData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="slab" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} width={70} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym)} />
              <Bar dataKey="tax" radius={[3, 3, 0, 0]}>
                {slabData.map((_, i) => <Cell key={i} fill={`oklch(0.78 0.13 75 / ${(0.3 + (i / slabData.length) * 0.5)})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Tax-Advantaged Allocation" subtitle="Section 80C, 80CCD, 10(13D)" icon={<PiggyBank className="w-4 h-4" />} />
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Section 80C (PPF + EPF)</span>
                <span className="text-xs font-mono text-emerald-400">Limit: {fmtCurrency(150000, sym)}</span>
              </div>
              <ProgressBar value={Math.min(100, (section80CUsed / 150000) * 100)} color="success" height="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1">Used: {fmtCurrency(Math.min(150000, section80CUsed), sym)}</p>
            </div>
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Section 80CCD (NPS)</span>
                <span className="text-xs font-mono text-emerald-400">Limit: {fmtCurrency(50000, sym)}</span>
              </div>
              <ProgressBar value={Math.min(100, (section80CCD / 50000) * 100)} color="success" height="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1">Used: {fmtCurrency(Math.min(50000, section80CCD), sym)}</p>
            </div>
            <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/15">
              <p className="text-[11px] text-amber-300/90">
                <Calculator className="w-3 h-3 inline mr-1" />
                Maximize PPF/NPS to save up to <span className="font-mono font-bold">{fmtCurrency((150000 + 50000) * (state.settings.taxBracket / 100), sym)}</span> in taxes.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <SectionHeader title="Tax Optimization Strategies" subtitle="Recommended actions for tax efficiency" icon={<TrendingDown className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Maximize PPF', desc: 'Lock ₹1.5L annually for risk-free 7.1% tax-free returns.', saving: 46800 },
            { title: 'NPS Additional ₹50K', desc: 'Extra deduction under 80CCD(1B) over and above 80C.', saving: 15600 },
            { title: 'LTCG Harvesting', desc: 'Book ₹1.25L LTCG on equity gains annually — tax-free.', saving: 12500 },
            { title: 'HRA Exemption', desc: 'If renting, claim HRA to reduce taxable income.', saving: 60000 },
            { title: 'Health Insurance 80D', desc: 'Premium up to ₹25K (self) + ₹50K (parents) deductible.', saving: 22500 },
            { title: 'Debt Fund Realignment', desc: 'Move debt MF to G-Sec/Bond for indexation benefit.', saving: 8000 },
          ].map(s => (
            <div key={s.title} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-foreground">{s.title}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{s.desc}</p>
              <p className="text-sm font-mono font-bold text-emerald-400">↓ {fmtCurrency(s.saving, sym)}/yr</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
