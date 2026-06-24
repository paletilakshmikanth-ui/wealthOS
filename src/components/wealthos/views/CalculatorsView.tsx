'use client';

import { useState } from 'react';
import { useWealthOS } from '@/lib/wealthos/store';
import {
  calculateSIP,
  calculateLumpsum,
  calculateSWP,
  calculateEMI,
  calculateCAGR,
  computeFIRE,
  fmtCurrency,
  fmtPct,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar } from '../Primitives';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { Calculator, TrendingUp, PiggyBank, CreditCard, Wallet, DollarSign, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

export function CalculatorsView() {
  const [active, setActive] = useState('sip');
  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <SectionHeader
          title="Calculator Super Center"
          subtitle="Investment • Loan • Retirement • Wealth — all in one place"
          icon={<Calculator className="w-4 h-4" />}
        />
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="bg-black/30 border border-white/5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 h-auto">
            <TabsTrigger value="sip" className="text-xs"><TrendingUp className="w-3 h-3 mr-1" /> SIP</TabsTrigger>
            <TabsTrigger value="lumpsum" className="text-xs"><DollarSign className="w-3 h-3 mr-1" /> Lumpsum</TabsTrigger>
            <TabsTrigger value="swp" className="text-xs"><PiggyBank className="w-3 h-3 mr-1" /> SWP</TabsTrigger>
            <TabsTrigger value="emi" className="text-xs"><CreditCard className="w-3 h-3 mr-1" /> EMI</TabsTrigger>
            <TabsTrigger value="fire" className="text-xs"><Zap className="w-3 h-3 mr-1" /> FIRE</TabsTrigger>
            <TabsTrigger value="cagr" className="text-xs"><Wallet className="w-3 h-3 mr-1" /> CAGR</TabsTrigger>
          </TabsList>

          <TabsContent value="sip"><SIPCalc /></TabsContent>
          <TabsContent value="lumpsum"><LumpsumCalc /></TabsContent>
          <TabsContent value="swp"><SWPCalc /></TabsContent>
          <TabsContent value="emi"><EMICalc /></TabsContent>
          <TabsContent value="fire"><FIRECalc /></TabsContent>
          <TabsContent value="cagr"><CAGRCalc /></TabsContent>
        </Tabs>
      </GlassCard>
    </div>
  );
}

function SIPCalc() {
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [monthly, setMonthly] = useState(25000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(20);
  const r = calculateSIP(monthly, rate, years);
  const data = r.schedule.filter((_, i) => i % 6 === 0).map(s => ({ month: s.month, invested: s.invested, value: s.value }));

  return (
    <CalcLayout
      title="SIP Calculator"
      description="Systematic Investment Plan — project your recurring investment growth"
      inputs={
        <>
          <CalcInput label="Monthly Investment" value={monthly} onChange={setMonthly} min={500} max={500000} step={500} suffix={sym} />
          <CalcSlider label="Expected Return (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.5} suffix="%" />
          <CalcSlider label="Duration" value={years} onChange={setYears} min={1} max={40} step={1} suffix=" years" />
        </>
      }
      results={
        <>
          <ResultCard label="Maturity Value" value={fmtCurrency(r.maturityValue, sym)} tone="positive" big />
          <ResultCard label="Total Invested" value={fmtCurrency(r.totalInvested, sym)} tone="neutral" />
          <ResultCard label="Total Gains" value={fmtCurrency(r.gains, sym)} tone="positive" />
          <ResultCard label="Gain Multiple" value={`${(r.maturityValue / r.totalInvested).toFixed(2)}x`} tone="info" />
        </>
      }
      chart={
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} /><stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} /><stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${(v/12).toFixed(0)}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym,'')} width={70} />
            <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym)} />
            <Area dataKey="invested" stroke="#38bdf8" strokeWidth={1.5} fill="url(#gInv)" />
            <Area dataKey="value" stroke="#d4af37" strokeWidth={2} fill="url(#gVal)" />
          </AreaChart>
        </ResponsiveContainer>
      }
    />
  );
}

function LumpsumCalc() {
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [principal, setPrincipal] = useState(1000000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);
  const r = calculateLumpsum(principal, rate, years);
  const data = Array.from({ length: years + 1 }, (_, y) => {
    const v = principal * Math.pow(1 + rate / 100, y);
    return { year: y, invested: principal, value: Math.round(v) };
  });

  return (
    <CalcLayout
      title="Lumpsum Calculator"
      description="Project one-time investment growth over time"
      inputs={
        <>
          <CalcInput label="Investment Amount" value={principal} onChange={setPrincipal} min={1000} max={10000000} step={1000} suffix={sym} />
          <CalcSlider label="Expected Return (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.5} suffix="%" />
          <CalcSlider label="Duration" value={years} onChange={setYears} min={1} max={40} step={1} suffix=" years" />
        </>
      }
      results={
        <>
          <ResultCard label="Maturity Value" value={fmtCurrency(r.maturityValue, sym)} tone="positive" big />
          <ResultCard label="Principal" value={fmtCurrency(principal, sym)} tone="neutral" />
          <ResultCard label="Gains" value={fmtCurrency(r.gains, sym)} tone="positive" />
          <ResultCard label="Multiple" value={`${(r.maturityValue / principal).toFixed(2)}x`} tone="info" />
        </>
      }
      chart={
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gLump" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} /><stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${v}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym,'')} width={70} />
            <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym)} />
            <Area dataKey="value" stroke="#d4af37" strokeWidth={2} fill="url(#gLump)" />
          </AreaChart>
        </ResponsiveContainer>
      }
    />
  );
}

function SWPCalc() {
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [corpus, setCorpus] = useState(10000000);
  const [withdrawal, setWithdrawal] = useState(50000);
  const [rate, setRate] = useState(10);
  const [months, setMonths] = useState(240);
  const r = calculateSWP(corpus, withdrawal, rate, months);
  const data = r.schedule.filter((_, i) => i % 12 === 0).map(s => ({ month: s.month, corpus: s.corpus }));

  return (
    <CalcLayout
      title="SWP Calculator"
      description="Systematic Withdrawal Plan — see how long your corpus lasts"
      inputs={
        <>
          <CalcInput label="Initial Corpus" value={corpus} onChange={setCorpus} min={100000} max={100000000} step={100000} suffix={sym} />
          <CalcInput label="Monthly Withdrawal" value={withdrawal} onChange={setWithdrawal} min={1000} max={1000000} step={1000} suffix={sym} />
          <CalcSlider label="Expected Return (p.a.)" value={rate} onChange={setRate} min={1} max={20} step={0.5} suffix="%" />
          <CalcSlider label="Duration" value={months} onChange={setMonths} min={12} max={480} step={12} suffix=" months" />
        </>
      }
      results={
        <>
          <ResultCard label="Initial Corpus" value={fmtCurrency(corpus, sym)} tone="neutral" big />
          <ResultCard label="Monthly Withdrawal" value={fmtCurrency(withdrawal, sym)} tone="info" />
          <ResultCard label="Final Corpus" value={fmtCurrency(r.schedule[r.schedule.length - 1]?.corpus || 0, sym)} tone={r.exhausted ? 'negative' : 'positive'} />
          <ResultCard label="Status" value={r.exhausted ? `Exhausted @ mo ${r.exhaustionMonth}` : 'Sustained'} tone={r.exhausted ? 'negative' : 'positive'} />
        </>
      }
      chart={
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gSwp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} /><stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${(v/12).toFixed(0)}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym,'')} width={70} />
            <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym)} />
            <Area dataKey="corpus" stroke="#34d399" strokeWidth={2} fill="url(#gSwp)" />
          </AreaChart>
        </ResponsiveContainer>
      }
    />
  );
}

function EMICalc() {
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [principal, setPrincipal] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(240);
  const r = calculateEMI(principal, rate, tenure);

  // Amortization schedule (yearly)
  const data: { year: number; principalPaid: number; interestPaid: number; balance: number }[] = [];
  let balance = principal;
  let totalPrincipal = 0;
  let totalInterest = 0;
  const rM = rate / 100 / 12;
  for (let m = 1; m <= tenure; m++) {
    const interest = balance * rM;
    const principalPaid = r.emi - interest;
    balance -= principalPaid;
    totalInterest += interest;
    totalPrincipal += principalPaid;
    if (m % 12 === 0) {
      data.push({ year: m / 12, principalPaid: Math.round(totalPrincipal), interestPaid: Math.round(totalInterest), balance: Math.max(0, Math.round(balance)) });
    }
  }

  return (
    <CalcLayout
      title="EMI Calculator"
      description="Calculate loan EMI, total interest, and amortization schedule"
      inputs={
        <>
          <CalcInput label="Loan Principal" value={principal} onChange={setPrincipal} min={10000} max={100000000} step={10000} suffix={sym} />
          <CalcSlider label="Interest Rate (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.1} suffix="%" />
          <CalcSlider label="Tenure" value={tenure} onChange={setTenure} min={6} max={360} step={6} suffix=" months" />
        </>
      }
      results={
        <>
          <ResultCard label="Monthly EMI" value={fmtCurrency(r.emi, sym)} tone="warning" big />
          <ResultCard label="Total Payment" value={fmtCurrency(r.totalPayment, sym)} tone="neutral" />
          <ResultCard label="Total Interest" value={fmtCurrency(r.totalInterest, sym)} tone="negative" />
          <ResultCard label="Interest Ratio" value={fmtPct((r.totalInterest / r.totalPayment) * 100)} tone="info" />
        </>
      }
      chart={
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${v}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym,'')} width={70} />
            <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => fmtCurrency(v as number, sym)} />
            <Area dataKey="principalPaid" stackId="1" stroke="#38bdf8" strokeWidth={1.5} fill="#38bdf8" fillOpacity={0.3} />
            <Area dataKey="interestPaid" stackId="1" stroke="#f43f5e" strokeWidth={1.5} fill="#f43f5e" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      }
    />
  );
}

function FIRECalc() {
  const state = useWealthOS();
  const sym = state.settings.currencySymbol;
  const [annualExpense, setAnnualExpense] = useState(1200000);
  const [swr, setSwr] = useState(4);
  const fireNumber = annualExpense / (swr / 100);
  const fire = computeFIRE(state, 'regular');
  void fire;

  return (
    <CalcLayout
      title="FIRE Calculator"
      description="Calculate your Financial Independence Number"
      inputs={
        <>
          <CalcInput label="Annual Expenses" value={annualExpense} onChange={setAnnualExpense} min={100000} max={50000000} step={50000} suffix={sym} />
          <CalcSlider label="Safe Withdrawal Rate" value={swr} onChange={setSwr} min={2} max={8} step={0.25} suffix="%" />
          <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/15">
            <p className="text-[11px] text-amber-300/80">
              <Zap className="w-3 h-3 inline mr-1" />
              FIRE Number = Annual Expense ÷ SWR
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Formula: {fmtCurrency(annualExpense, sym)} ÷ {swr}% = <span className="font-mono text-amber-400 font-bold">{fmtCurrency(fireNumber, sym)}</span></p>
          </div>
        </>
      }
      results={
        <>
          <ResultCard label="FIRE Number (Lean)" value={fmtCurrency(annualExpense * 15, sym)} tone="info" big />
          <ResultCard label="FIRE Number (Regular)" value={fmtCurrency(annualExpense * 25, sym)} tone="positive" big />
          <ResultCard label="FIRE Number (Fat)" value={fmtCurrency(annualExpense * 50, sym)} tone="info" big />
          <ResultCard label="Custom (SWR-based)" value={fmtCurrency(fireNumber, sym)} tone="positive" />
        </>
      }
      chart={
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={Array.from({ length: 41 }, (_, i) => ({ swr: i / 4 + 2, fire: annualExpense / ((i/4+2)/100) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="swr" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(1)}%`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym,'')} width={70} />
            <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any, n: any) => [fmtCurrency(v as number, sym), 'FIRE Number @ SWR']} />
            <Area dataKey="fire" stroke="#d4af37" strokeWidth={2} fill="#d4af37" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      }
    />
  );
}

function CAGRCalc() {
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [initial, setInitial] = useState(500000);
  const [final, setFinal] = useState(1500000);
  const [years, setYears] = useState(7);
  const cagr = calculateCAGR(initial, final, years);

  return (
    <CalcLayout
      title="CAGR Calculator"
      description="Compound Annual Growth Rate — your true annualized return"
      inputs={
        <>
          <CalcInput label="Initial Value" value={initial} onChange={setInitial} min={1000} max={100000000} step={1000} suffix={sym} />
          <CalcInput label="Final Value" value={final} onChange={setFinal} min={1000} max={100000000} step={1000} suffix={sym} />
          <CalcSlider label="Duration" value={years} onChange={setYears} min={1} max={40} step={1} suffix=" years" />
        </>
      }
      results={
        <>
          <ResultCard label="CAGR" value={`${cagr.toFixed(2)}%`} tone={cagr >= 10 ? 'positive' : cagr >= 5 ? 'info' : 'warning'} big />
          <ResultCard label="Total Return" value={fmtPct(((final / initial) - 1) * 100)} tone="positive" />
          <ResultCard label="Multiple" value={`${(final / initial).toFixed(2)}x`} tone="info" />
          <ResultCard label="Absolute Gain" value={fmtCurrency(final - initial, sym)} tone="positive" />
        </>
      }
      chart={
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={Array.from({ length: years + 1 }, (_, y) => ({
            year: y,
            actual: Math.round(initial * Math.pow(1 + cagr / 100, y)),
            linear: Math.round(initial + (final - initial) * (y / years)),
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${v}y`} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym,'')} width={70} />
            <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any, n: any) => [fmtCurrency(v as number, sym), n === 'actual' ? 'Compounded' : 'Linear']} />
            <Line dataKey="actual" stroke="#d4af37" strokeWidth={2} dot={false} />
            <Line dataKey="linear" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      }
    />
  );
}

// ---- Shared Calc Components ----

function CalcLayout({ title, description, inputs, results, chart }: {
  title: string;
  description: string;
  inputs: React.ReactNode;
  results: React.ReactNode;
  chart: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-amber-400">{title}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="space-y-3">{inputs}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 content-start">{results}</div>
      <GlassCard className="p-3">
        <MetricLabel>Visualization</MetricLabel>
        <div className="mt-2">{chart}</div>
      </GlassCard>
    </div>
  );
}

function CalcInput({ label, value, onChange, min, max, step, suffix }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono font-semibold text-amber-400">{fmtCurrency(value, suffix)}</span>
      </div>
      <Input
        type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(Math.max(min, Math.min(max, parseFloat(e.target.value) || 0)))}
        className="bg-black/30 border-white/10 font-mono"
      />
    </div>
  );
}

function CalcSlider({ label, value, onChange, min, max, step, suffix }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono font-semibold text-amber-400">{value}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} className="[&_[role=slider]]:bg-amber-400 [&_[role=slider]]:border-amber-400" />
    </div>
  );
}

function ResultCard({ label, value, tone, big }: {
  label: string; value: string; tone: 'positive' | 'negative' | 'neutral' | 'info' | 'warning'; big?: boolean;
}) {
  const color = tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-rose-400' : tone === 'info' ? 'text-sky-400' : tone === 'warning' ? 'text-amber-400' : 'text-foreground';
  const bg = tone === 'positive' ? 'bg-emerald-500/5 border-emerald-500/15' : tone === 'negative' ? 'bg-rose-500/5 border-rose-500/15' : tone === 'info' ? 'bg-sky-500/5 border-sky-500/15' : tone === 'warning' ? 'bg-amber-500/5 border-amber-500/15' : 'bg-white/[0.02] border-white/5';
  return (
    <div className={`p-3 rounded-md border ${bg} ${big ? 'col-span-2' : ''}`}>
      <MetricLabel>{label}</MetricLabel>
      <p className={`${big ? 'text-xl' : 'text-base'} font-mono font-bold tabular ${color} mt-0.5`}>{value}</p>
    </div>
  );
}
