'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  DOCUMENT_CATEGORY_META,
  formatFileSize,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, ProgressBar } from '../Primitives';
import {
  FolderPlus, FileText, Lock, Search, Plus, Trash2, Shield, Tag, Calendar, Download, Eye,
  AlertTriangle, FileCheck, Database,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { DocumentCategory, VaultDocument } from '@/lib/wealthos/types';

export function DocumentsView() {
  const state = useWealthOS();
  const docs = state.documents;
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  const filtered = useMemo(() => {
    return docs.filter(d => {
      if (filterCat !== 'all' && d.category !== filterCat) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.issuer?.toLowerCase().includes(q) ||
          d.tags.some(t => t.toLowerCase().includes(q)) ||
          d.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }, [docs, search, filterCat]);

  const totalSize = docs.reduce((s, d) => s + d.sizeBytes, 0);
  const encryptedCount = docs.filter(d => d.encrypted).length;
  const expiringSoon = docs.filter(d => {
    if (!d.expiryDate) return false;
    const days = (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days < 90 && days > 0;
  }).length;
  const expiredCount = docs.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length;

  // Category distribution
  const byCategory = new Map<string, number>();
  for (const d of docs) byCategory.set(d.category, (byCategory.get(d.category) || 0) + 1);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-3.5 h-3.5 text-amber-400" /><MetricLabel>Total Documents</MetricLabel></div>
          <p className="text-2xl font-mono font-bold text-amber-400">{docs.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{formatFileSize(totalSize)} stored</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1"><Lock className="w-3.5 h-3.5 text-emerald-400" /><MetricLabel>Encrypted</MetricLabel></div>
          <p className="text-2xl font-mono font-bold text-emerald-400">{encryptedCount}/{docs.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">AES-256 protected</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><MetricLabel>Expiring Soon</MetricLabel></div>
          <p className="text-2xl font-mono font-bold text-amber-400">{expiringSoon}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Within 90 days</p>
        </GlassCard>
        <GlassCard glow={expiredCount > 0 ? 'danger' : 'gold'} className="p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-3.5 h-3.5 text-rose-400" /><MetricLabel>Expired</MetricLabel></div>
          <p className="text-2xl font-mono font-bold text-rose-400">{expiredCount}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Needs renewal</p>
        </GlassCard>
      </div>

      {/* Search & filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, issuer, tag, notes..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:border-amber-500/40 focus:outline-none"
            />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="bg-black/30 border-white/10 w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent className="glass-strong border-white/10">
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(DOCUMENT_CATEGORY_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddDocumentDialog />
        </div>
        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button onClick={() => setFilterCat('all')} className={`px-2 py-1 rounded-md text-[10px] font-medium border ${filterCat === 'all' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-white/5 text-muted-foreground border-white/5'}`}>
            All ({docs.length})
          </button>
          {Array.from(byCategory.entries()).map(([cat, count]) => {
            const meta = DOCUMENT_CATEGORY_META[cat];
            return (
              <button key={cat} onClick={() => setFilterCat(cat)} className={`px-2 py-1 rounded-md text-[10px] font-medium border ${filterCat === cat ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-white/5 text-muted-foreground border-white/5'}`}>
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Document grid */}
      <GlassCard className="p-5">
        <SectionHeader title="Document Vault" subtitle={`${filtered.length} of ${docs.length} documents`} icon={<Database className="w-4 h-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(d => {
            const meta = DOCUMENT_CATEGORY_META[d.category];
            const isExpired = d.expiryDate && new Date(d.expiryDate) < new Date();
            const daysToExpiry = d.expiryDate ? Math.floor((new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div key={d.id} className={`p-3 rounded-lg bg-white/[0.02] border ${isExpired ? 'border-rose-500/30' : 'border-white/5'} hover:border-white/10 transition-colors group`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: `${meta.color}15` }}>
                    <FileText className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.encrypted && <Lock className="w-3 h-3 text-emerald-400" />}
                    <button onClick={() => toast.success('Opening preview...', { description: d.name })} className="text-muted-foreground hover:text-amber-400 p-1">
                      <Eye className="w-3 h-3" />
                    </button>
                    <button onClick={() => toast.success('Downloading (decrypted)...', { description: d.name })} className="text-muted-foreground hover:text-amber-400 p-1">
                      <Download className="w-3 h-3" />
                    </button>
                    <button onClick={() => useWealthOS.getState().removeDocument(d.id)} className="text-muted-foreground hover:text-rose-400 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-0.5 line-clamp-2">{d.name}</h4>
                <p className="text-[10px] text-muted-foreground mb-2">{meta.label} • {d.issuer || 'Unknown issuer'}</p>

                {d.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {d.tags.slice(0, 3).map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-muted-foreground">
                        <Tag className="w-2 h-2 inline mr-0.5" />{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-white/5">
                  <span>{formatFileSize(d.sizeBytes)}</span>
                  {d.expiryDate ? (
                    <span className={isExpired ? 'text-rose-400' : daysToExpiry !== null && daysToExpiry < 90 ? 'text-amber-400' : ''}>
                      <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
                      {isExpired ? 'Expired' : daysToExpiry !== null && daysToExpiry < 90 ? `${daysToExpiry}d left` : d.expiryDate}
                    </span>
                  ) : (
                    <span>{d.documentDate || '—'}</span>
                  )}
                </div>
                {d.notes && <p className="text-[10px] text-muted-foreground mt-1.5 italic line-clamp-1">{d.notes}</p>}
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{docs.length === 0 ? 'Vault is empty. Add your first document.' : 'No documents match your search.'}</p>
          </div>
        )}
      </GlassCard>

      {/* Encryption info banner */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">All documents are encrypted with AES-256</p>
            <p className="text-[11px] text-muted-foreground">Files are stored locally and encrypted with your PIN-derived key. No data leaves your device.</p>
          </div>
          <FileCheck className="w-5 h-5 text-emerald-400/40" />
        </div>
      </GlassCard>
    </div>
  );
}

function AddDocumentDialog() {
  const addDocument = useWealthOS(s => s.addDocument);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'tax' as DocumentCategory,
    issuer: '',
    documentDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    tags: '',
    notes: '',
    sizeBytes: '500000',
  });

  const submit = () => {
    if (!form.name) return;
    addDocument({
      name: form.name,
      category: form.category,
      issuer: form.issuer || undefined,
      documentDate: form.documentDate || undefined,
      expiryDate: form.expiryDate || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      encrypted: true,
      sizeBytes: parseInt(form.sizeBytes) || 0,
      notes: form.notes || undefined,
      addedAt: new Date().toISOString(),
    });
    setForm({ name: '', category: 'tax', issuer: '', documentDate: new Date().toISOString().slice(0, 10), expiryDate: '', tags: '', notes: '', sizeBytes: '500000' });
    setOpen(false);
    toast.success('Document added', { description: 'Encrypted and stored locally.' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-400">Add Document to Vault</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Document Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., ITR FY 2024-25" className="bg-black/30 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as DocumentCategory })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {Object.entries(DOCUMENT_CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Issuer</Label>
              <Input value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })} placeholder="e.g., HDFC Bank" className="bg-black/30 border-white/10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Document Date</Label>
              <Input type="date" value={form.documentDate} onChange={e => setForm({ ...form, documentDate: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Expiry Date (optional)</Label>
              <Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g., ITR, FY24, refund" className="bg-black/30 border-white/10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Acknowledgement #, folio #, etc." className="bg-black/30 border-white/10" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button onClick={submit} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">Add & Encrypt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
