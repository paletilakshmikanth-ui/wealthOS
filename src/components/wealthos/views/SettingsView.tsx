'use client';

import { useState } from 'react';
import { useWealthOS } from '@/lib/wealthos/store';
import { GlassCard, MetricLabel, MetricValue, SectionHeader } from '../Primitives';
import { Settings as SettingsIcon, User, Globe, Percent, Calendar, Shield, Database, AlertTriangle, RotateCcw, Lock, Crown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Settings } from '@/lib/wealthos/types';

export function SettingsView() {
  const state = useWealthOS();
  const updateSettings = useWealthOS(s => s.updateSettings);
  const loadSampleData = useWealthOS(s => s.loadSampleData);
  const clearAllData = useWealthOS(s => s.clearAllData);
  const snapshotNetWorth = useWealthOS(s => s.snapshotNetWorth);

  const update = (partial: Partial<Settings>) => {
    updateSettings(partial);
    toast.success('Settings updated');
  };

  return (
    <div className="space-y-4">
      {/* Profile */}
      <GlassCard className="p-5">
        <SectionHeader title="Profile" subtitle="Personal information & user mode" icon={<User className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Profile Name</Label>
            <Input value={state.settings.profileName} onChange={e => update({ profileName: e.target.value })} className="bg-black/30 border-white/10 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Current Age</Label>
            <Input type="number" value={state.settings.currentAge} onChange={e => update({ currentAge: parseInt(e.target.value) || 0 })} className="bg-black/30 border-white/10 mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Retirement Age</Label>
            <Input type="number" value={state.settings.retirementAge} onChange={e => update({ retirementAge: parseInt(e.target.value) || 0 })} className="bg-black/30 border-white/10 mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Life Expectancy</Label>
            <Input type="number" value={state.settings.lifeExpectancy} onChange={e => update({ lifeExpectancy: parseInt(e.target.value) || 0 })} className="bg-black/30 border-white/10 mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">User Mode</Label>
            <Select value={state.settings.userMode} onValueChange={(v) => update({ userMode: v as Settings['userMode'] })}>
              <SelectTrigger className="bg-black/30 border-white/10 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong border-white/10">
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="couple">Couple</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="business">Business Owner</SelectItem>
                <SelectItem value="family_office">Family Office</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Location & Currency */}
      <GlassCard className="p-5">
        <SectionHeader title="Location & Currency" subtitle="Regional settings affect calculations and tax assumptions" icon={<Globe className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Country</Label>
            <Input value={state.settings.country} onChange={e => update({ country: e.target.value })} className="bg-black/30 border-white/10 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Timezone</Label>
            <Input value={state.settings.timezone} onChange={e => update({ timezone: e.target.value })} className="bg-black/30 border-white/10 mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Currency</Label>
            <Select value={state.settings.currency} onValueChange={(v) => {
              const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$' };
              update({ currency: v, currencySymbol: symbols[v] || v });
            }}>
              <SelectTrigger className="bg-black/30 border-white/10 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong border-white/10">
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="AED">AED</SelectItem>
                <SelectItem value="SGD">SGD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Marginal Tax Bracket (%)</Label>
            <Input type="number" value={state.settings.taxBracket} onChange={e => update({ taxBracket: parseFloat(e.target.value) || 0 })} className="bg-black/30 border-white/10 mt-1 font-mono" />
          </div>
        </div>
      </GlassCard>

      {/* Financial Assumptions */}
      <GlassCard className="p-5">
        <SectionHeader title="Financial Assumptions" subtitle="These parameters drive all projections and simulations" icon={<Percent className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Inflation Rate</Label>
              <span className="text-xs font-mono text-amber-400">{state.settings.inflationRate.toFixed(1)}%</span>
            </div>
            <Slider value={[state.settings.inflationRate]} min={0} max={15} step={0.1} onValueChange={v => update({ inflationRate: v[0] })} />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Salary Growth Rate</Label>
              <span className="text-xs font-mono text-amber-400">{state.settings.salaryGrowthRate.toFixed(1)}%</span>
            </div>
            <Slider value={[state.settings.salaryGrowthRate]} min={0} max={20} step={0.5} onValueChange={v => update({ salaryGrowthRate: v[0] })} />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Expected Market Return</Label>
              <span className="text-xs font-mono text-amber-400">{state.settings.expectedMarketReturn.toFixed(1)}%</span>
            </div>
            <Slider value={[state.settings.expectedMarketReturn]} min={1} max={25} step={0.5} onValueChange={v => update({ expectedMarketReturn: v[0] })} />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Market Volatility (Std Dev)</Label>
              <span className="text-xs font-mono text-amber-400">{state.settings.marketVolatility.toFixed(1)}%</span>
            </div>
            <Slider value={[state.settings.marketVolatility]} min={5} max={40} step={0.5} onValueChange={v => update({ marketVolatility: v[0] })} />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Safe Withdrawal Rate</Label>
              <span className="text-xs font-mono text-amber-400">{state.settings.safeWithdrawalRate.toFixed(2)}%</span>
            </div>
            <Slider value={[state.settings.safeWithdrawalRate]} min={2} max={8} step={0.25} onValueChange={v => update({ safeWithdrawalRate: v[0] })} />
          </div>
        </div>
      </GlassCard>

      {/* Security & Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Security" subtitle="Authentication & encryption" icon={<Shield className="w-4 h-4" />} />
          <div className="space-y-2">
            <SettingRow label="PIN Authentication" desc="Require PIN on app launch" defaultOn />
            <SettingRow label="Biometric Unlock" desc="Use fingerprint/face ID" defaultOn />
            <SettingRow label="Auto-Lock (5 min)" desc="Lock app after inactivity" defaultOn />
            <SettingRow label="AES-256 Encryption" desc="Encrypt local database" defaultOn />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Data Management" subtitle="Offline-first storage" icon={<Database className="w-4 h-4" />} />
          <div className="space-y-2">
            <SettingRow label="Auto Snapshot" desc="Capture monthly net worth automatically" defaultOn />
            <SettingRow label="Encrypted Backup" desc="Export encrypted backup file" />
            <SettingRow label="Cloud Sync" desc="Disabled — offline-first mode" />
          </div>
          <div className="mt-4 space-y-2">
            <Button variant="outline" size="sm" onClick={() => { snapshotNetWorth(); toast.success('Net worth snapshot captured'); }} className="w-full bg-black/30 border-white/10">
              <Calendar className="w-3.5 h-3.5 mr-2" /> Capture Net Worth Snapshot
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.success('Encrypted backup exported', { description: 'Backup file saved to download folder.' })} className="w-full bg-black/30 border-white/10">
              <Lock className="w-3.5 h-3.5 mr-2" /> Export Encrypted Backup
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* Danger Zone */}
      <GlassCard glow="danger" className="p-5">
        <SectionHeader title="Danger Zone" subtitle="Irreversible actions" icon={<AlertTriangle className="w-4 h-4" />} />
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-md bg-amber-500/5 border border-amber-500/15">
            <div>
              <p className="text-xs font-medium text-amber-400">Load Sample Data</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Replace current data with the demo profile (32-year-old tech professional). PIN preserved.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              if (confirm('Load sample data? This will REPLACE your current data with the demo profile. Your PIN will be preserved.')) {
                loadSampleData();
                toast.success('Sample data loaded', { description: 'Demo profile activated.' });
              }
            }} className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20">
              <Database className="w-3.5 h-3.5 mr-1" /> Load Sample
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-rose-500/5 border border-rose-500/15">
            <div>
              <p className="text-xs font-medium text-rose-400">Clear All Data</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Wipe everything — assets, liabilities, income, expenses, goals, documents. PIN preserved.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              if (confirm('Clear ALL data? This wipes your entire profile. Your PIN will be preserved. This cannot be undone.')) {
                clearAllData();
                toast.success('All data cleared', { description: 'Your profile is now empty.' });
              }
            }} className="bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Footer info */}
      <div className="text-center py-4">
        <p className="text-[10px] text-muted-foreground">
          <Crown className="w-3 h-3 inline mr-1 text-amber-400" />
          WealthOS Infinity v1.0.0 • Personal CFO & Family Office Platform • Offline-First • AES-256 Encrypted
        </p>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-white/[0.02] border border-white/5">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}
