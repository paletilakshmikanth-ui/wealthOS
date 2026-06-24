'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import { GlassCard, MetricLabel } from '../Primitives';
import {
  Crown, Sparkles, ArrowRight, TrendingUp, Wallet, Target, PiggyBank,
  Calculator, FlaskConical, Users, FileText, ShieldCheck, Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ViewId } from '@/lib/wealthos/types';

const QUICK_LINKS: { view: ViewId; label: string; icon: React.ElementType; description: string; color: string }[] = [
  { view: 'assets',       label: 'Add Asset',         icon: Wallet,        description: 'Stocks, MFs, real estate, gold, crypto', color: 'text-amber-400' },
  { view: 'cashflow',     label: 'Add Income',        icon: TrendingUp,    description: 'Salary, freelance, dividends, rental',   color: 'text-emerald-400' },
  { view: 'cashflow',     label: 'Add Expense',       icon: TrendingUp,    description: 'Housing, food, transport, lifestyle',   color: 'text-rose-400' },
  { view: 'liabilities',  label: 'Add Liability',     icon: Target,        description: 'Home loan, auto loan, credit card',     color: 'text-amber-400' },
  { view: 'goals',        label: 'Set Goal',          icon: Target,        description: 'Retirement, education, home, vacation', color: 'text-amber-400' },
  { view: 'insurance',    label: 'Add Insurance',     icon: ShieldCheck,   description: 'Term, health, critical illness',        color: 'text-rose-400' },
  { view: 'family',       label: 'Add Family',        icon: Users,         description: 'Spouse, children, parents',             color: 'text-sky-400' },
  { view: 'calculators',  label: 'Open Calculators',  icon: Calculator,    description: 'SIP, EMI, FIRE, CAGR, SWP',             color: 'text-violet-400' },
  { view: 'simulation',   label: 'Simulation Lab',    icon: FlaskConical,  description: 'Monte Carlo wealth modeling',           color: 'text-amber-400' },
  { view: 'fire',         label: 'FIRE Center',       icon: Flame,         description: 'Calculate financial independence',      color: 'text-orange-400' },
  { view: 'estate',       label: 'Estate Planning',   icon: FileText,      description: 'Will, beneficiaries, succession',       color: 'text-amber-400' },
  { view: 'documents',    label: 'Document Vault',    icon: FileText,      description: 'Encrypted local document storage',      color: 'text-emerald-400' },
];

export function EmptyDashboard() {
  const loadSampleData = useWealthOS(s => s.loadSampleData);
  const setView = useWealthOS(s => s.setView);
  const profileName = useWealthOS(s => s.settings.profileName);

  const handleLoadSample = () => {
    loadSampleData();
    toast.success('Sample data loaded', {
      description: 'Demo profile: 32-year-old tech professional. Explore freely!',
    });
  };

  return (
    <div className="space-y-4">
      {/* Welcome hero */}
      <GlassCard glow="gold" className="p-8 grid-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30 mb-4">
            <Crown className="w-8 h-8 text-stone-900" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <MetricLabel>Welcome to WealthOS Infinity</MetricLabel>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-gold mb-3">
            Your Personal CFO & Family Office
          </h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-xl">
            Hello {profileName === 'New User' ? 'there' : profileName}! Your financial command center is ready.
            Start by adding your assets, income, and goals — or load sample data to explore the platform first.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleLoadSample}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500/30 to-amber-600/20 hover:from-amber-500/40 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 text-sm font-semibold glow-gold transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Load Sample Data
            </button>
            <button
              onClick={() => setView('assets')}
              className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground border border-white/10 text-sm font-medium transition-colors flex items-center gap-2"
            >
              Start Adding Assets <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-md text-center">
            <div>
              <div className="text-2xl font-bold text-amber-400 font-mono">21</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Modules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">100%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Offline</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sky-400 font-mono">AES</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Encrypted</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">Wealth Tracking</h3>
          </div>
          <p className="text-xs text-muted-foreground">Track 20+ asset classes — cash, stocks, MFs, ETFs, gold, crypto, real estate, ESOPs, and more. Real-time net worth, allocation, and unrealized gains.</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-foreground">FIRE & Retirement</h3>
          </div>
          <p className="text-xs text-muted-foreground">5 FIRE types (Lean/Regular/Barista/Coast/Fat), Monte Carlo simulation, retirement readiness scoring, and inflation-adjusted corpus projections.</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground">Estate & Legacy</h3>
          </div>
          <p className="text-xs text-muted-foreground">Wills, trusts, beneficiaries, succession planning. 8-point estate readiness score. Document vault with AES-256 encryption.</p>
        </GlassCard>
      </div>

      {/* Quick actions */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Quick Start</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Jump into any module to begin entering your data</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {QUICK_LINKS.map((q, i) => {
            const Icon = q.icon;
            return (
              <button
                key={i}
                onClick={() => setView(q.view)}
                className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/[0.03] transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${q.color}`} />
                  <span className="text-xs font-medium text-foreground">{q.label}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{q.description}</p>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Hint */}
      <div className="text-center py-4">
        <p className="text-[11px] text-muted-foreground">
          💡 Tip: Click <span className="text-amber-400 font-medium">Load Sample Data</span> above to explore WealthOS with a realistic demo profile, or start adding your own data via any module.
        </p>
      </div>
    </div>
  );
}
