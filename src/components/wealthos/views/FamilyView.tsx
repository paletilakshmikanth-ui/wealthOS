'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import { computeKPIs, fmtCurrency, fmtPct, computeAllocation, ASSET_CATEGORY_META } from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, RingScore } from '../Primitives';
import { Users, User, Heart, GraduationCap, Baby, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import type { FamilyMember } from '@/lib/wealthos/types';

const RELATION_ICON = {
  self: User, spouse: Heart, child: Baby, parent: GraduationCap, sibling: Users, other: User,
};

export function FamilyView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const sym = state.settings.currencySymbol;
  const family = state.family;
  const dependents = family.filter(m => m.dependent);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-3.5 h-3.5 text-amber-400" /><MetricLabel>Family Members</MetricLabel></div>
          <p className="text-2xl font-mono font-bold text-amber-400">{family.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{state.settings.userMode} mode</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Dependents</MetricLabel>
          <p className="text-2xl font-mono font-bold text-sky-400">{dependents.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{dependents.length > 0 ? 'Need protection' : 'No dependents'}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Family Net Worth</MetricLabel>
          <MetricValue value={kpis.netWorth} symbol={sym} className="text-2xl text-emerald-400" />
          <p className="text-[10px] text-muted-foreground mt-1">All members combined</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Per Capita Wealth</MetricLabel>
          <MetricValue value={kpis.netWorth / family.length} symbol={sym} className="text-2xl text-violet-400" />
          <p className="text-[10px] text-muted-foreground mt-1">Family average</p>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <SectionHeader title="Family Office Directory" subtitle="Manage family members and wealth distribution" icon={<Users className="w-4 h-4" />} action={<AddMemberDialog />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {family.map(m => {
            const Icon = RELATION_ICON[m.relationship];
            const share = kpis.netWorth / family.length; // simplification
            return (
              <div key={m.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{m.name}</span>
                      <button onClick={() => useWealthOS.getState().removeFamilyMember(m.id)} className="text-muted-foreground hover:text-rose-400 p-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.relationship}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{m.age}y</span>
                      {m.dependent && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400">Dependent</span>}
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <MetricLabel>Allocated Wealth</MetricLabel>
                      <p className="text-sm font-mono text-amber-400">{fmtCurrency(share, sym)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionHeader title="Wealth Distribution" subtitle="How family wealth is structured" icon={<Users className="w-4 h-4" />} />
        <div className="space-y-2">
          {family.map(m => {
            const share = kpis.netWorth / family.length;
            const pct = 100 / family.length;
            const Icon = RELATION_ICON[m.relationship];
            return (
              <div key={m.id} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">{m.name}</span>
                    <span className="font-mono text-amber-400">{fmtCurrency(share, sym)} • {pct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={pct} color="gold" height="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function AddMemberDialog() {
  const addFamilyMember = useWealthOS(s => s.addFamilyMember);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', relationship: 'child' as FamilyMember['relationship'], age: '', dependent: true });
  const submit = () => {
    if (!form.name || !form.age) return;
    addFamilyMember({ name: form.name, relationship: form.relationship, age: parseInt(form.age) || 0, dependent: form.dependent });
    setForm({ name: '', relationship: 'child', age: '', dependent: true });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"><Plus className="w-3.5 h-3.5 mr-1" /> Add Member</Button></DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-sm">
        <DialogHeader><DialogTitle className="text-amber-400">Add Family Member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Diya Mehta" className="bg-black/30 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Relationship</Label>
              <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v as FamilyMember['relationship'] })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Age</Label>
              <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Dependent</Label>
            <Select value={form.dependent ? 'yes' : 'no'} onValueChange={(v) => setForm({ ...form, dependent: v === 'yes' })}>
              <SelectTrigger className="bg-black/30 border-white/10 w-20"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong border-white/10">
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
