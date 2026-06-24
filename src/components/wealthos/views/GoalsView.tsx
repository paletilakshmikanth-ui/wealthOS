'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  fmtCurrency,
  fmtPct,
  projectGoal,
  computeKPIs,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, DeltaPill, SeverityPill } from '../Primitives';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, RadialBarChart, RadialBar } from 'recharts';
import { Target, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, PencilLine, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { CSVImportDialog } from '../CSVImportDialog';
import type { Goal, GoalType } from '@/lib/wealthos/types';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  retirement: 'Retirement', house: 'House Purchase', vehicle: 'Vehicle',
  marriage: 'Marriage', education: 'Education', vacation: 'Vacation',
  business: 'Business', emergency_fund: 'Emergency Fund',
  financial_freedom: 'Financial Freedom', other: 'Other',
};

export function GoalsView() {
  const state = useWealthOS();
  const goals = state.goals;
  const sym = state.settings.currencySymbol;
  const kpis = computeKPIs(state);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalMonthly = goals.reduce((s, g) => s + g.monthlyContribution, 0);

  const sortedByProgress = [...goals].map(g => {
    const monthsLeft = Math.max(1, (new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    const projection = projectGoal(g, monthsLeft);
    return { ...g, monthsLeft, projection, progressPct: (g.currentAmount / g.targetAmount) * 100 };
  }).sort((a, b) => b.progressPct - a.progressPct);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <MetricLabel>Active Goals</MetricLabel>
          </div>
          <p className="text-2xl font-mono font-bold text-amber-400">{goals.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{fmtCurrency(totalTarget, sym)} total target</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Current Corpus</MetricLabel>
          <MetricValue value={totalCurrent} symbol={sym} className="text-2xl text-emerald-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{fmtPct((totalCurrent / totalTarget) * 100)} of target</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Monthly Commitment</MetricLabel>
          <MetricValue value={totalMonthly} symbol={sym} className="text-2xl text-sky-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{fmtPct(kpis.monthlySurplus > 0 ? (totalMonthly / kpis.monthlySurplus) * 100 : 0)} of surplus</p>
        </GlassCard>
        <GlassCard className="p-4">
          <MetricLabel>Avg Progress</MetricLabel>
          <p className="text-2xl font-mono font-bold text-amber-400">{((totalCurrent / totalTarget) * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Across all goals</p>
        </GlassCard>
      </div>

      {/* Goals grid */}
      <GlassCard className="p-5">
        <SectionHeader
          title="Goals Tracking"
          subtitle="Monitor progress and projections"
          icon={<Target className="w-4 h-4" />}
          action={(
            <div className="flex items-center gap-2">
              <ImportGoalsButton />
              <AddGoalDialog />
            </div>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedByProgress.map(g => {
            const onTrack = g.projection.projectedCorpus >= g.targetAmount * 0.95;
            const monthsLeft = Math.round(g.monthsLeft);
            const yearsLeft = Math.floor(monthsLeft / 12);
            const remMonths = monthsLeft % 12;
            return (
              <div key={g.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{g.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{GOAL_TYPE_LABEL[g.type]} • {g.priority} priority</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {onTrack ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" /> On Track
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" /> Behind
                      </span>
                    )}
                    <EditGoalButton goal={g} />
                    <button onClick={() => useWealthOS.getState().removeGoal(g.id)} className="text-muted-foreground hover:text-rose-400 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <MetricValue value={g.currentAmount} symbol={sym} className="text-lg text-amber-400" />
                  <span className="text-[11px] text-muted-foreground">/ {fmtCurrency(g.targetAmount, sym)}</span>
                </div>

                <ProgressBar value={g.progressPct} color={g.progressPct >= 75 ? 'success' : g.progressPct >= 40 ? 'warning' : 'danger'} height="h-2" />

                <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
                  <div>
                    <p className="text-muted-foreground">Monthly</p>
                    <p className="font-mono text-foreground">{fmtCurrency(g.monthlyContribution, sym)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time Left</p>
                    <p className="font-mono text-foreground">{yearsLeft > 0 ? `${yearsLeft}y ${remMonths}m` : `${remMonths}mo`}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Projected</p>
                    <p className={`font-mono ${onTrack ? 'text-emerald-400' : 'text-rose-400'}`}>{fmtCurrency(g.projection.projectedCorpus, sym)}</p>
                  </div>
                </div>

                {!onTrack && (
                  <div className="mt-2 p-2 rounded bg-amber-500/5 border border-amber-500/15">
                    <p className="text-[10px] text-amber-300/80">
                      Increase monthly contribution to <span className="font-mono font-bold">{fmtCurrency(g.projection.requiredMonthlyContribution, sym)}</span> to hit target.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Goal progress chart */}
      <GlassCard className="p-5">
        <SectionHeader title="Goals Progress Comparison" subtitle="Visual progress bar across all active goals" icon={<Target className="w-4 h-4" />} />
        <ResponsiveContainer width="100%" height={Math.max(200, goals.length * 50)}>
          <BarChart data={sortedByProgress.map(g => ({ name: g.name, current: g.currentAmount, target: g.targetAmount, pct: g.progressPct }))} layout="vertical">
            <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} />
            <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} width={120} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(v: any) => fmtCurrency(v as number, sym)}
            />
            <Bar dataKey="target" fill="rgba(255,255,255,0.1)" radius={[0, 3, 3, 0]} />
            <Bar dataKey="current" radius={[0, 3, 3, 0]}>
              {sortedByProgress.map((g, i) => (
                <Cell key={i} fill={g.progressPct >= 75 ? '#34d399' : g.progressPct >= 40 ? '#fbbf24' : '#f43f5e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}

function AddGoalDialog() {
  return <GoalDialog mode="add" trigger={
    <Button size="sm" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">
      <Plus className="w-3.5 h-3.5 mr-1" /> Add Goal
    </Button>
  } />;
}

function EditGoalButton({ goal }: { goal: Goal }) {
  return <GoalDialog mode="edit" goal={goal} trigger={
    <button className="text-muted-foreground hover:text-amber-400 p-1" title="Edit goal">
      <PencilLine className="w-3 h-3" />
    </button>
  } />;
}

function GoalDialog({ mode, goal, trigger }: { mode: 'add' | 'edit'; goal?: Goal; trigger: React.ReactNode }) {
  const addGoal = useWealthOS(s => s.addGoal);
  const updateGoal = useWealthOS(s => s.updateGoal);
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'other' as GoalType, targetAmount: '', currentAmount: '',
    monthlyContribution: '', targetDate: new Date().toISOString().slice(0, 10),
    expectedReturnRate: '10', priority: 'medium' as Goal['priority'],
  });

  const handleOpenChange = (v: boolean) => {
    if (v && goal) {
      setForm({
        name: goal.name,
        type: goal.type,
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString(),
        monthlyContribution: goal.monthlyContribution.toString(),
        targetDate: goal.targetDate,
        expectedReturnRate: goal.expectedReturnRate.toString(),
        priority: goal.priority,
      });
    }
    setOpen(v);
  };

  const submit = () => {
    if (!form.name || !form.targetAmount) return;
    const payload = {
      name: form.name,
      type: form.type,
      targetAmount: parseFloat(form.targetAmount) || 0,
      currentAmount: parseFloat(form.currentAmount) || 0,
      monthlyContribution: parseFloat(form.monthlyContribution) || 0,
      targetDate: form.targetDate,
      expectedReturnRate: parseFloat(form.expectedReturnRate) || 0,
      priority: form.priority,
    };
    if (mode === 'edit' && goal) {
      updateGoal(goal.id, payload);
    } else {
      addGoal(payload);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-400">{mode === 'edit' ? 'Edit Goal' : 'Add Financial Goal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Goal Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Child Higher Education" className="bg-black/30 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as GoalType })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {Object.entries(GOAL_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Goal['priority'] })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Target ({sym})</Label>
              <Input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Current ({sym})</Label>
              <Input type="number" value={form.currentAmount} onChange={e => setForm({ ...form, currentAmount: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Monthly ({sym})</Label>
              <Input type="number" value={form.monthlyContribution} onChange={e => setForm({ ...form, monthlyContribution: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Return %</Label>
              <Input type="number" value={form.expectedReturnRate} onChange={e => setForm({ ...form, expectedReturnRate: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Target Date</Label>
            <Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">
            {mode === 'edit' ? 'Save Changes' : 'Add Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportGoalsButton() {
  const importGoals = useWealthOS(s => s.importGoals);
  return <CSVImportDialog entityType="goals" onImport={importGoals} trigger={
    <Button size="sm" variant="outline" className="bg-black/30 border-white/10 hover:bg-white/5 text-foreground">
      <Upload className="w-3.5 h-3.5 mr-1" /> Import CSV
    </Button>
  } />;
}
