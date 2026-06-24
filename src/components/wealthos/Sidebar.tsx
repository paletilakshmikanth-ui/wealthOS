'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import type { ViewId } from '@/lib/wealthos/types';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Landmark,
  CreditCard,
  ArrowLeftRight,
  Target,
  PiggyBank,
  Flame,
  ShieldCheck,
  Receipt,
  Users,
  Baby,
  HeartPulse,
  Scale,
  FileText,
  Calculator,
  FlaskConical,
  Lightbulb,
  Settings as SettingsIcon,
  Crown,
} from 'lucide-react';

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ElementType;
  group: string;
  badge?: 'fire' | 'gold';
}

const NAV: NavItem[] = [
  { id: 'dashboard',   label: 'Command Center', icon: LayoutDashboard, group: 'Overview' },
  { id: 'wealth',      label: 'Net Worth',      icon: Wallet,          group: 'Overview' },
  { id: 'assets',      label: 'Assets',         icon: Landmark,        group: 'Wealth' },
  { id: 'investments', label: 'Investments',    icon: TrendingUp,      group: 'Wealth' },
  { id: 'liabilities', label: 'Liabilities',    icon: CreditCard,      group: 'Wealth' },
  { id: 'cashflow',    label: 'Cash Flow',      icon: ArrowLeftRight,  group: 'Wealth' },
  { id: 'goals',       label: 'Goals',          icon: Target,          group: 'Planning' },
  { id: 'retirement',  label: 'Retirement',     icon: PiggyBank,       group: 'Planning' },
  { id: 'fire',        label: 'FIRE Center',    icon: Flame,           group: 'Planning', badge: 'fire' },
  { id: 'insurance',   label: 'Insurance',      icon: ShieldCheck,     group: 'Planning' },
  { id: 'taxes',       label: 'Tax Optimization', icon: Receipt,       group: 'Planning' },
  { id: 'family',      label: 'Family Office',  icon: Users,           group: 'Planning' },
  { id: 'children',    label: 'Children Planning', icon: Baby,         group: 'Planning' },
  { id: 'eldercare',   label: 'Elder Care',     icon: HeartPulse,      group: 'Planning' },
  { id: 'estate',      label: 'Estate Planning', icon: Scale,          group: 'Planning' },
  { id: 'documents',   label: 'Document Vault', icon: FileText,        group: 'Tools' },
  { id: 'calculators', label: 'Calculators',    icon: Calculator,      group: 'Tools' },
  { id: 'simulation',  label: 'Simulation Lab', icon: FlaskConical,    group: 'Tools', badge: 'gold' },
  { id: 'insights',    label: 'CFO Insights',   icon: Lightbulb,       group: 'Tools' },
  { id: 'reports',     label: 'Reports',        icon: FileText,        group: 'Tools' },
  { id: 'settings',    label: 'Settings',       icon: SettingsIcon,    group: 'System' },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const activeView = useWealthOS(s => s.activeView);
  const setView = useWealthOS(s => s.setView);
  const profileName = useWealthOS(s => s.settings.profileName);

  const groups = Array.from(new Set(NAV.map(n => n.group)));

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 glass-strong border-r border-white/5 flex flex-col z-30 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand */}
      <div className="h-14 px-3 flex items-center gap-2.5 border-b border-white/5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/90 to-amber-600/80 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
          <Crown className="w-4 h-4 text-stone-900" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold tracking-tight text-amber-400/90 leading-tight">WEALTHOS</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground leading-none">Infinity</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scroll-thin py-3 px-2">
        {groups.map(group => (
          <div key={group} className="mb-3">
            {!collapsed && (
              <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {NAV.filter(n => n.group === group).map(item => {
                const active = activeView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all relative group',
                      active
                        ? 'bg-gradient-to-r from-amber-500/15 to-transparent text-amber-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                      collapsed && 'justify-center'
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />}
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.badge === 'fire' && <Flame className="w-3 h-3 text-orange-400" />}
                        {item.badge === 'gold' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-dot" />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile footer */}
      {!collapsed && (
        <div className="p-3 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500/40 to-violet-500/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {profileName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{profileName}</p>
              <p className="text-[10px] text-muted-foreground">Premium • Offline</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
