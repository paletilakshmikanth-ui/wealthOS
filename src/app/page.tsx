'use client';

import { useState } from 'react';
import { useWealthOS } from '@/lib/wealthos/store';
import { useHydrated } from '@/hooks/use-hydrated';
import { Sidebar } from '@/components/wealthos/Sidebar';
import { TopBar } from '@/components/wealthos/TopBar';
import { ErrorBoundary } from '@/components/wealthos/ErrorBoundary';
import { AuthGate } from '@/components/wealthos/AuthGate';
import { DashboardView } from '@/components/wealthos/views/DashboardView';
import { WealthView } from '@/components/wealthos/views/WealthView';
import { InvestmentsView } from '@/components/wealthos/views/InvestmentsView';
import { LiabilitiesView } from '@/components/wealthos/views/LiabilitiesView';
import { CashFlowView } from '@/components/wealthos/views/CashFlowView';
import { GoalsView } from '@/components/wealthos/views/GoalsView';
import { RetirementView } from '@/components/wealthos/views/RetirementView';
import { FireView } from '@/components/wealthos/views/FireView';
import { InsuranceView } from '@/components/wealthos/views/InsuranceView';
import { TaxesView } from '@/components/wealthos/views/TaxesView';
import { FamilyView } from '@/components/wealthos/views/FamilyView';
import { ChildrenView } from '@/components/wealthos/views/ChildrenView';
import { ElderCareView } from '@/components/wealthos/views/ElderCareView';
import { EstateView } from '@/components/wealthos/views/EstateView';
import { DocumentsView } from '@/components/wealthos/views/DocumentsView';
import { CalculatorsView } from '@/components/wealthos/views/CalculatorsView';
import { SimulationView } from '@/components/wealthos/views/SimulationView';
import { InsightsView } from '@/components/wealthos/views/InsightsView';
import { ReportsView } from '@/components/wealthos/views/ReportsView';
import { SettingsView } from '@/components/wealthos/views/SettingsView';
import type { ViewId } from '@/lib/wealthos/types';
import { Toaster } from 'sonner';

const VIEW_TITLES: Record<ViewId, { title: string; subtitle: string }> = {
  dashboard:   { title: 'Command Center',         subtitle: 'Real-time financial intelligence overview' },
  wealth:      { title: 'Net Worth & Assets',      subtitle: 'Complete wealth composition & trajectory' },
  assets:      { title: 'Asset Portfolio',         subtitle: 'All tracked assets across categories' },
  investments: { title: 'Investment Intelligence', subtitle: 'Risk-adjusted performance analytics' },
  liabilities: { title: 'Liability Center',        subtitle: 'Debt management & payoff strategies' },
  cashflow:    { title: 'Cash Flow Engine',        subtitle: 'Income, expenses & surplus analysis' },
  goals:       { title: 'Goals Tracking',          subtitle: 'Monitor progress toward financial objectives' },
  retirement:  { title: 'Retirement Center',       subtitle: 'Corpus projections & readiness analysis' },
  fire:        { title: 'FIRE Command',            subtitle: 'Financial Independence Retire Early' },
  insurance:   { title: 'Wealth Protection',       subtitle: 'Coverage adequacy & gap analysis' },
  taxes:       { title: 'Tax Optimization',        subtitle: 'Tax efficiency & savings opportunities' },
  family:      { title: 'Family Office',           subtitle: 'Multi-generational wealth management' },
  children:    { title: 'Children Planning',       subtitle: 'Education, marriage & milestone funding' },
  eldercare:   { title: 'Elder Care Planning',     subtitle: 'Parents & dependents long-term care' },
  estate:      { title: 'Estate & Legacy',         subtitle: 'Wills, trusts, beneficiaries & succession' },
  documents:   { title: 'Document Vault',          subtitle: 'Encrypted local document storage' },
  calculators: { title: 'Calculator Super Center', subtitle: 'Investment, loan, retirement & wealth calculators' },
  simulation:  { title: 'Simulation Lab',          subtitle: 'Monte Carlo wealth trajectory modeling' },
  insights:    { title: 'CFO Insights',            subtitle: 'Personal Chief Financial Officer intelligence' },
  reports:     { title: 'Reports Vault',           subtitle: 'Institutional-grade financial statements' },
  settings:    { title: 'Settings & Configuration', subtitle: 'Profile, preferences & system configuration' },
};

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const hydrated = useHydrated();
  const activeView = useWealthOS(s => s.activeView);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/90 to-amber-600/80 animate-pulse" />
          <div className="text-amber-400 text-xs font-mono tracking-wider animate-pulse">INITIALIZING WEALTHOS INFINITY</div>
        </div>
      </div>
    );
  }

  const meta = VIEW_TITLES[activeView];

  return (
    <AuthGate>
      <div className="min-h-screen flex bg-background">
        <Sidebar collapsed={collapsed} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onToggleSidebar={() => setCollapsed(c => !c)} />
          <main className="flex-1 p-4 lg:p-6 max-w-[1800px] mx-auto w-full">
            {/* View header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{meta.title}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/5 font-mono">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">Live Sync</span>
              </div>
            </div>

            {/* View body */}
            <div className="pb-12">
              <ErrorBoundary>
                {activeView === 'dashboard'   && <DashboardView />}
                {activeView === 'wealth'      && <WealthView />}
                {activeView === 'assets'      && <WealthView />}
                {activeView === 'investments' && <InvestmentsView />}
                {activeView === 'liabilities' && <LiabilitiesView />}
                {activeView === 'cashflow'    && <CashFlowView />}
                {activeView === 'goals'       && <GoalsView />}
                {activeView === 'retirement'  && <RetirementView />}
                {activeView === 'fire'        && <FireView />}
                {activeView === 'insurance'   && <InsuranceView />}
                {activeView === 'taxes'       && <TaxesView />}
                {activeView === 'family'      && <FamilyView />}
                {activeView === 'children'    && <ChildrenView />}
                {activeView === 'eldercare'   && <ElderCareView />}
                {activeView === 'estate'      && <EstateView />}
                {activeView === 'documents'   && <DocumentsView />}
                {activeView === 'calculators' && <CalculatorsView />}
                {activeView === 'simulation'  && <SimulationView />}
                {activeView === 'insights'    && <InsightsView />}
                {activeView === 'reports'     && <ReportsView />}
                {activeView === 'settings'    && <SettingsView />}
              </ErrorBoundary>
            </div>
          </main>
        </div>
        <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' } }} />
      </div>
    </AuthGate>
  );
}
