'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import { computeKPIs, fmtCurrency } from '@/lib/wealthos/engine';
import { Menu, Search, Bell, Lock, Wifi, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

const TICKER_ITEMS = [
  { label: 'NIFTY 50',     value: '24,180.45', change: +0.62 },
  { label: 'SENSEX',       value: '79,486.32', change: +0.55 },
  { label: 'BANK NIFTY',   value: '51,920.80', change: -0.18 },
  { label: 'GOLD (10g)',   value: '₹72,450',   change: +0.32 },
  { label: 'USD/INR',      value: '83.42',     change: -0.05 },
  { label: 'BTC/INR',      value: '₹58,42,000',change: +1.84 },
  { label: '10Y BOND',     value: '6.84%',     change: +0.01 },
  { label: 'CRUDE',        value: '$73.20',    change: -0.42 },
  { label: 'S&P 500',      value: '5,827.04',  change: +0.28 },
];

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const sym = state.settings.currencySymbol;
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-20 glass-strong border-b border-white/5">
      {/* Top row */}
      <div className="h-14 px-4 flex items-center gap-3">
        <button onClick={onToggleSidebar} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground">
          <Menu className="w-4 h-4" />
        </button>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 font-mono">{time} IST</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Wifi className="w-3 h-3" /> Offline-First
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lock className="w-3 h-3" /> AES-256
          </span>
        </div>

        {/* Live KPIs */}
        <div className="hidden lg:flex items-center gap-2 ml-auto mr-2">
          <MiniStat label="NET WORTH" value={fmtCurrency(kpis.netWorth, sym)} tone={kpis.netWorthChangePct >= 0 ? 'positive' : 'negative'} delta={kpis.netWorthChangePct} />
          <div className="w-px h-7 bg-white/10" />
          <MiniStat label="MONTHLY SURPLUS" value={fmtCurrency(kpis.monthlySurplus, sym)} tone={kpis.monthlySurplus >= 0 ? 'positive' : 'negative'} />
          <div className="w-px h-7 bg-white/10" />
          <MiniStat label="FI %" value={`${kpis.financialIndependencePct.toFixed(1)}%`} tone={kpis.financialIndependencePct >= 50 ? 'positive' : 'neutral'} />
          <div className="w-px h-7 bg-white/10" />
          <MiniStat label="HEALTH" value={`${kpis.wealthHealthScore}/100`} tone={kpis.wealthHealthScore >= 70 ? 'positive' : kpis.wealthHealthScore >= 40 ? 'neutral' : 'negative'} />
        </div>

        <div className="flex items-center gap-1 ml-auto lg:ml-0">
          <button className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-400 rounded-full pulse-dot" />
          </button>
        </div>
      </div>

      {/* Market ticker */}
      <div className="h-8 border-t border-white/5 overflow-hidden relative bg-black/30">
        <div className="absolute inset-0 flex items-center">
          <div className="flex items-center gap-6 px-4 animate-ticker whitespace-nowrap">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-muted-foreground">{t.label}</span>
                <span className="text-foreground font-medium tabular">{t.value}</span>
                <span className={t.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {t.change >= 0 ? '▲' : '▼'} {Math.abs(t.change).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-stone-950 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-stone-950 to-transparent pointer-events-none z-10" />
      </div>
    </header>
  );
}

function MiniStat({
  label,
  value,
  tone = 'neutral',
  delta,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
  delta?: number;
}) {
  const color = tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-rose-400' : 'text-foreground';
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-mono font-semibold tabular ${color}`}>{value}</span>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-[9px] ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
