'use client';

import { useState, useRef } from 'react';
import { useWealthOS } from '@/lib/wealthos/store';
import {
  previewBackup,
  formatBackupSize,
  type RestorePreview,
} from '@/lib/wealthos/backup';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2, Loader2, FileCheck,
  Database, Users, Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Target, Shield, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { WealthOSState } from '@/lib/wealthos/types';

interface RestoreDialogProps {
  trigger: React.ReactNode;
}

export function RestoreDialog({ trigger }: RestoreDialogProps) {
  const updateSettings = useWealthOS(s => s.updateSettings);
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPin('');
    setFileName('');
    setFileSize(0);
    setFile(null);
    setPreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (f: File) => {
    setError('');
    setPreview(null);
    setFile(f);
    setFileName(f.name);
    setFileSize(f.size);
    if (!f.name.endsWith('.wealthos') && !f.name.endsWith('.bin')) {
      setError('Warning: file does not have .wealthos extension. It may not be a valid backup.');
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a backup file first');
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await previewBackup(file, pin);
      if (!result.success || !result.preview) {
        setError(result.error || 'Failed to preview backup');
      } else {
        setPreview(result.preview);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = () => {
    if (!preview) return;
    // Confirm — this is destructive (replaces current data)
    if (!confirm('Restore from backup? This will REPLACE your current data with the backup contents. Your PIN will be preserved. This cannot be undone.')) {
      return;
    }
    // Apply the backup state via the dedicated store action (goes through persist middleware)
    const backupState = preview.state as Partial<WealthOSState>;
    useWealthOS.getState().restoreFromBackup(backupState);

    toast.success('Backup restored successfully', {
      description: `Profile: ${preview.profileName} · ${preview.entriesCount.assets + preview.entriesCount.liabilities + preview.entriesCount.income + preview.entriesCount.expenses + preview.entriesCount.goals} entries loaded`,
    });
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-amber-400 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Restore from Backup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: File picker */}
          <div>
            <Label className="text-xs text-muted-foreground">1. Select backup file</Label>
            <div className="mt-1.5">
              <input
                ref={fileRef}
                type="file"
                accept=".wealthos,.bin,application/octet-stream"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="hidden"
                id="restore-file-input"
              />
              <label
                htmlFor="restore-file-input"
                className="flex items-center gap-3 px-3 py-3 rounded-md border border-dashed border-white/20 hover:border-amber-500/40 hover:bg-amber-500/[0.03] cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  {fileName ? (
                    <>
                      <p className="text-xs font-mono text-amber-400 truncate">{fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{formatBackupSize(fileSize)} · click to change</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-foreground">Click to select .wealthos backup file</p>
                      <p className="text-[10px] text-muted-foreground">Encrypted backup from any device</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Step 2: PIN */}
          <div>
            <Label className="text-xs text-muted-foreground">2. Enter PIN used to create this backup</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type={show ? 'text' : 'password'}
                inputMode="numeric"
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); setError(''); setPreview(null); }}
                placeholder="••••"
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-10 py-2.5 font-mono text-lg tracking-[0.4em] text-amber-400 focus:border-amber-500/40 focus:outline-none"
              />
              <button onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-2 rounded-md bg-rose-500/5 border border-rose-500/15 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-300/90">{error}</p>
            </div>
          )}

          {/* Step 3: Preview */}
          {preview && (
            <div className="p-3 rounded-md bg-emerald-500/5 border border-emerald-500/15">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p className="text-xs font-medium text-emerald-400">Backup decrypted successfully</p>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profile:</span>
                  <span className="font-mono text-foreground">{preview.profileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Backup created:</span>
                  <span className="font-mono text-foreground">{new Date(preview.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-mono text-foreground">{preview.currency}</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/5">
                  <PreviewStat icon={Wallet} label="Assets" count={preview.entriesCount.assets} />
                  <PreviewStat icon={CreditCard} label="Liab." count={preview.entriesCount.liabilities} />
                  <PreviewStat icon={ArrowUpRight} label="Income" count={preview.entriesCount.income} />
                  <PreviewStat icon={ArrowDownRight} label="Exp." count={preview.entriesCount.expenses} />
                  <PreviewStat icon={Target} label="Goals" count={preview.entriesCount.goals} />
                  <PreviewStat icon={Shield} label="Insur." count={preview.entriesCount.insurance} />
                  <PreviewStat icon={Users} label="Family" count={preview.entriesCount.family} />
                  <PreviewStat icon={FileText} label="Docs" count={preview.entriesCount.documents} />
                </div>

                {(preview.entriesCount.estateDocs > 0 || preview.entriesCount.beneficiaries > 0 || preview.entriesCount.childPlans > 0 || preview.entriesCount.elderCarePlans > 0) && (
                  <div className="pt-2 border-t border-white/5 text-[10px] text-muted-foreground">
                    <span className="text-amber-400">Also includes:</span> {preview.entriesCount.estateDocs} estate docs, {preview.entriesCount.beneficiaries} beneficiaries, {preview.entriesCount.childPlans} child plans, {preview.entriesCount.elderCarePlans} elder care plans
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Destructive warning */}
          {preview && (
            <div className="p-2 rounded bg-amber-500/5 border border-amber-500/15">
              <p className="text-[10px] text-amber-300/80 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>Restoring will <span className="font-bold">replace</span> your current data with the backup contents. Your PIN will be preserved. Consider downloading a backup of your current data first.</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          {!preview ? (
            <Button
              onClick={handlePreview}
              disabled={busy || !file || pin.length < 4}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 disabled:opacity-50"
            >
              {busy ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Decrypting...</>
              ) : (
                <><Database className="w-3.5 h-3.5 mr-1" /> Decrypt & Preview</>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleRestore}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Restore Backup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewStat({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count: number }) {
  return (
    <div className="p-1.5 rounded bg-black/30 border border-white/5 text-center">
      <Icon className="w-3 h-3 text-amber-400 mx-auto mb-0.5" />
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xs font-mono font-bold text-foreground">{count}</p>
    </div>
  );
}
