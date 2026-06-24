'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  computeEstateReadiness,
  ESTATE_DOC_META,
  ESTATE_STATUS_META,
  fmtCurrency,
  computeKPIs,
  computeAllocation,
  ASSET_CATEGORY_META,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar, RingScore, SeverityPill } from '../Primitives';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
  FileText, Landmark, UserCheck, FileSignature, HeartPulse, Users,
  Plus, Trash2, Shield, CheckCircle2, AlertTriangle, Scale, Baby, Crown, PencilLine,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import type { EstateDocument, EstateDocumentType, EstateStatus, Beneficiary } from '@/lib/wealthos/types';

const DOC_ICON: Record<string, React.ElementType> = {
  will: FileText, trust: Landmark, nomination: UserCheck,
  power_of_attorney: FileSignature, medical_directive: HeartPulse, succession_plan: Users,
};

export function EstateView() {
  const state = useWealthOS();
  const plan = state.estatePlan;
  const sym = state.settings.currencySymbol;
  const kpis = computeKPIs(state);
  const readiness = computeEstateReadiness(plan);

  const totalShare = plan.beneficiaries.reduce((s, b) => s + b.sharePct, 0);
  const shareValid = Math.abs(totalShare - 100) < 0.5;

  const beneficiaryData = plan.beneficiaries.map(b => ({ name: b.name, value: b.sharePct }));

  return (
    <div className="space-y-4">
      {/* Hero */}
      <GlassCard glow={readiness.score >= 70 ? 'gold' : 'danger'} className="p-5">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <RingScore score={readiness.score} size={110} stroke={7} label="ESTATE" sublabel={readiness.rating} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-amber-400" />
              <MetricLabel>Estate Readiness Assessment</MetricLabel>
            </div>
            <p className="text-sm text-foreground mb-3">
              Score <span className="font-mono font-bold text-amber-400">{readiness.score}/100</span> — {readiness.rating}. Estate value being planned: <span className="font-mono text-amber-400">{fmtCurrency(kpis.netWorth, sym)}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Hero label="Documents"        value={`${plan.documents.length}`}                       icon={FileText}      tone="info" />
              <Hero label="Beneficiaries"    value={`${plan.beneficiaries.length}`}                   icon={Users}         tone={plan.beneficiaries.length >= 3 ? 'positive' : 'warning'} />
              <Hero label="Share Allocation" value={`${totalShare.toFixed(0)}%`}                       icon={UserCheck}     tone={shareValid ? 'positive' : 'negative'} />
              <Hero label="Will Registered"  value={plan.hasRegisteredWill ? 'Yes' : 'No'}            icon={CheckCircle2}  tone={plan.hasRegisteredWill ? 'positive' : 'negative'} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Readiness checklist */}
      <GlassCard className="p-5">
        <SectionHeader title="Estate Readiness Checklist" subtitle="8-point legacy planning audit" icon={<Shield className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {readiness.checks.map((c, i) => (
            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-md border ${c.passed ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-rose-500/5 border-rose-500/15'}`}>
              {c.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">{c.label}</p>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">+{c.weight}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Documents + Beneficiaries */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionHeader
            title="Estate Documents"
            subtitle="Wills, trusts, nominations & directives"
            icon={<FileText className="w-4 h-4" />}
            action={<AddDocumentDialog />}
          />
          <div className="space-y-2">
            {plan.documents.map(d => {
              const Icon = DOC_ICON[d.type] || FileText;
              const meta = ESTATE_DOC_META[d.type];
              const statusMeta = ESTATE_STATUS_META[d.status];
              return (
                <div key={d.id} className="p-3 rounded-md bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground truncate">{d.title}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <EditEstateDocumentButton doc={d} />
                          <button onClick={() => useWealthOS.getState().removeEstateDocument(d.id)} className="text-muted-foreground hover:text-rose-400 p-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{meta.label}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${statusMeta.color}20`, color: statusMeta.color }}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                        <span>Updated: {d.lastUpdated}</span>
                        {d.nextReviewDate && <span>Review: {d.nextReviewDate}</span>}
                        {d.attachmentsCount > 0 && <span className="text-amber-400/80">{d.attachmentsCount} attachments</span>}
                      </div>
                      {d.notes && <p className="text-[10px] text-muted-foreground mt-1.5 italic">{d.notes}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader
            title="Beneficiaries & Distribution"
            subtitle={`Total allocated: ${totalShare.toFixed(1)}% ${shareValid ? '✓' : '(should be 100%)'}`}
            icon={<Users className="w-4 h-4" />}
            action={<AddBeneficiaryDialog />}
          />
          <div className="grid grid-cols-2 gap-3">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={beneficiaryData.length > 0 ? beneficiaryData : [{ name: 'Unallocated', value: 100 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={1}>
                  {(beneficiaryData.length > 0 ? beneficiaryData : [{ name: 'Unallocated', value: 100 }]).map((_, i) => (
                    <Cell key={i} fill={['#d4af37', '#34d399', '#38bdf8', '#a78bfa', '#fb923c', '#f43f5e'][i % 6]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v: any, n: any) => [`${(v as number).toFixed(1)}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 overflow-y-auto max-h-44 scroll-thin">
              {plan.beneficiaries.map((b, i) => (
                <div key={b.id} className="flex items-center gap-2 text-[11px] p-1.5 rounded bg-white/[0.02]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ['#d4af37', '#34d399', '#38bdf8', '#a78bfa', '#fb923c', '#f43f5e'][i % 6] }} />
                  <span className="flex-1 truncate text-muted-foreground">{b.name}</span>
                  <span className="font-mono text-foreground">{b.sharePct.toFixed(0)}%</span>
                  <EditBeneficiaryButton beneficiary={b} />
                  <button onClick={() => useWealthOS.getState().removeBeneficiary(b.id)} className="text-muted-foreground hover:text-rose-400">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          {!shareValid && (
            <div className="mt-3 p-2 rounded bg-rose-500/5 border border-rose-500/15">
              <p className="text-[11px] text-rose-300/90 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Beneficiary shares total {totalShare.toFixed(1)}% — adjust to reach 100%.
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Executor / Guardian / Trust */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Executor" subtitle="Manages estate distribution" icon={<Scale className="w-4 h-4" />} />
          <p className="text-base font-medium text-foreground">{plan.executorName || 'Not designated'}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {plan.executorName ? 'Ensure executor knows will location' : 'Appoint a trusted executor to handle your estate'}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <SectionHeader title="Guardian" subtitle="For minor children" icon={<Baby className="w-4 h-4" />} />
          <p className="text-base font-medium text-foreground">{plan.guardianName || 'Not designated'}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {plan.guardianName ? 'Documented in will' : 'Critical if you have children under 18'}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <SectionHeader title="Trust Structure" subtitle="For tax-efficient transfer" icon={<Landmark className="w-4 h-4" />} />
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-foreground">{plan.trustSetup ? 'Active' : 'Not Set Up'}</span>
            <Switch checked={plan.trustSetup} onCheckedChange={(v) => useWealthOS.getState().updateEstatePlan({ trustSetup: v })} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {plan.trustSetup ? 'Review trust deed annually' : 'Consider HUF or Family Trust for tax efficiency'}
          </p>
        </GlassCard>
      </div>

      {/* Asset inheritance map */}
      <GlassCard className="p-5">
        <SectionHeader title="Asset Inheritance Map" subtitle="Which assets pass to whom" icon={<Crown className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {computeAllocation(state.assets).map(a => {
            const meta = ASSET_CATEGORY_META[a.category];
            return (
              <div key={a.category} className="flex items-center gap-3 p-2 rounded-md bg-white/[0.02] border border-white/5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{fmtCurrency(a.value, sym)}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                  {plan.beneficiaries.length > 0 ? 'Spouse' : 'Unassigned'}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function Hero({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: 'positive' | 'negative' | 'warning' | 'info' | 'neutral' }) {
  const color = tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-rose-400' : tone === 'warning' ? 'text-amber-400' : tone === 'info' ? 'text-sky-400' : 'text-foreground';
  return (
    <div className="p-2.5 rounded-md bg-black/30 border border-white/5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${color}`} />
        <MetricLabel>{label}</MetricLabel>
      </div>
      <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function AddDocumentDialog() {
  return <EstateDocumentDialog mode="add" trigger={
    <Button size="sm" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">
      <Plus className="w-3.5 h-3.5 mr-1" /> Add Document
    </Button>
  } />;
}

function EditEstateDocumentButton({ doc }: { doc: EstateDocument }) {
  return <EstateDocumentDialog mode="edit" doc={doc} trigger={
    <button className="text-muted-foreground hover:text-amber-400 p-1 shrink-0" title="Edit document">
      <PencilLine className="w-3 h-3" />
    </button>
  } />;
}

function EstateDocumentDialog({ mode, doc, trigger }: { mode: 'add' | 'edit'; doc?: EstateDocument; trigger: React.ReactNode }) {
  const addEstateDocument = useWealthOS(s => s.addEstateDocument);
  const updateEstateDocument = useWealthOS(s => s.updateEstateDocument);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'will' as EstateDocumentType,
    title: '',
    status: 'drafted' as EstateStatus,
    notes: '',
  });

  const handleOpenChange = (v: boolean) => {
    if (v && doc) {
      setForm({
        type: doc.type,
        title: doc.title,
        status: doc.status,
        notes: doc.notes || '',
      });
    }
    setOpen(v);
  };

  const submit = () => {
    if (!form.title) return;
    const payload = {
      type: form.type,
      title: form.title,
      status: form.status,
      lastUpdated: new Date().toISOString().slice(0, 10),
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      notes: form.notes,
      attachmentsCount: doc?.attachmentsCount || 0,
    };
    if (mode === 'edit' && doc) {
      // Preserve existing lastUpdated/nextReviewDate if user is editing
      updateEstateDocument(doc.id, {
        type: form.type,
        title: form.title,
        status: form.status,
        lastUpdated: new Date().toISOString().slice(0, 10),
        notes: form.notes,
      });
    } else {
      addEstateDocument(payload);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-400">{mode === 'edit' ? 'Edit Estate Document' : 'Add Estate Document'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Updated Will 2025" className="bg-black/30 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as EstateDocumentType })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {Object.entries(ESTATE_DOC_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EstateStatus })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {Object.entries(ESTATE_STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="bg-black/30 border-white/10" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">
            {mode === 'edit' ? 'Save Changes' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddBeneficiaryDialog() {
  return <BeneficiaryDialog mode="add" trigger={
    <Button size="sm" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">
      <Plus className="w-3.5 h-3.5 mr-1" /> Add Beneficiary
    </Button>
  } />;
}

function EditBeneficiaryButton({ beneficiary }: { beneficiary: Beneficiary }) {
  return <BeneficiaryDialog mode="edit" beneficiary={beneficiary} trigger={
    <button className="text-muted-foreground hover:text-amber-400 p-0.5" title="Edit beneficiary">
      <PencilLine className="w-2.5 h-2.5" />
    </button>
  } />;
}

function BeneficiaryDialog({ mode, beneficiary, trigger }: { mode: 'add' | 'edit'; beneficiary?: Beneficiary; trigger: React.ReactNode }) {
  const addBeneficiary = useWealthOS(s => s.addBeneficiary);
  const updateBeneficiary = useWealthOS(s => s.updateBeneficiary);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', relationship: '', sharePct: '', notes: '' });

  const handleOpenChange = (v: boolean) => {
    if (v && beneficiary) {
      setForm({
        name: beneficiary.name,
        relationship: beneficiary.relationship,
        sharePct: beneficiary.sharePct.toString(),
        notes: beneficiary.notes || '',
      });
    }
    setOpen(v);
  };

  const submit = () => {
    if (!form.name || !form.sharePct) return;
    const payload = {
      name: form.name,
      relationship: form.relationship || 'Other',
      sharePct: parseFloat(form.sharePct) || 0,
      assetIds: beneficiary?.assetIds || [],
      notes: form.notes,
    };
    if (mode === 'edit' && beneficiary) {
      updateBeneficiary(beneficiary.id, payload);
    } else {
      addBeneficiary(payload);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-amber-400">{mode === 'edit' ? 'Edit Beneficiary' : 'Add Beneficiary'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Diya Mehta" className="bg-black/30 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Relationship</Label>
              <Input value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} placeholder="Spouse / Son / ..." className="bg-black/30 border-white/10" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Share %</Label>
              <Input type="number" value={form.sharePct} onChange={e => setForm({ ...form, sharePct: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional" className="bg-black/30 border-white/10" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">
            {mode === 'edit' ? 'Save Changes' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
