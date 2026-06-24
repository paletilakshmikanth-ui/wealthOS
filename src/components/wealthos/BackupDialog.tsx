'use client';

import { useState, useRef } from 'react';
import { useWealthOS } from '@/lib/wealthos/store';
import {
  createEncryptedBackup,
  downloadBackup,
  formatBackupSize,
} from '@/lib/wealthos/backup';
import { hashPin } from '@/lib/wealthos/engine';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Download, Eye, EyeOff, ShieldCheck, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BackupDialogProps {
  trigger: React.ReactNode;
}

export function BackupDialog({ trigger }: BackupDialogProps) {
  const state = useWealthOS();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState<{ filename: string; sizeBytes: number; createdAt: string } | null>(null);

  const handleBackup = async () => {
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    setBusy(true);
    try {
      // Small delay so users see the loading state (encryption takes ~500ms)
      const result = await createEncryptedBackup(state, pin);
      downloadBackup(result);
      setLastBackup({
        filename: result.filename,
        sizeBytes: result.sizeBytes,
        createdAt: result.createdAt,
      });
      toast.success('Encrypted backup downloaded', {
        description: `${result.filename} · ${formatBackupSize(result.sizeBytes)} · AES-256-GCM`,
      });
      setPin('');
    } catch (e: any) {
      toast.error('Backup failed', { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  const entriesTotal = state.assets.length + state.liabilities.length + state.income.length +
    state.expenses.length + state.goals.length + state.insurance.length +
    state.family.length + state.documents.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPin(''); setLastBackup(null); } }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-400 flex items-center gap-2">
            <Download className="w-4 h-4" /> Encrypted Backup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info banner */}
          <div className="p-3 rounded-md bg-emerald-500/5 border border-emerald-500/15">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-300/90 space-y-1">
                <p>Your data will be encrypted with <span className="font-mono font-bold">AES-256-GCM</span> using a key derived from your PIN via <span className="font-mono font-bold">PBKDF2</span> (150,000 iterations).</p>
                <p>The PIN is never stored in the backup file. Keep your PIN safe — without it, the backup cannot be decrypted.</p>
              </div>
            </div>
          </div>

          {/* What's included */}
          <div>
            <Label className="text-xs text-muted-foreground">Backup includes</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5 text-[11px]">
              <Stat label="Assets" count={state.assets.length} />
              <Stat label="Liabilities" count={state.liabilities.length} />
              <Stat label="Income" count={state.income.length} />
              <Stat label="Expenses" count={state.expenses.length} />
              <Stat label="Goals" count={state.goals.length} />
              <Stat label="Insurance" count={state.insurance.length} />
              <Stat label="Family" count={state.family.length} />
              <Stat label="Documents" count={state.documents.length} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Total: <span className="font-mono text-foreground">{entriesTotal}</span> entries ·
              Profile: <span className="font-mono text-foreground">{state.settings.profileName}</span> ·
              Currency: <span className="font-mono text-foreground">{state.settings.currency}</span>
            </p>
          </div>

          {/* PIN input */}
          <div>
            <Label className="text-xs text-muted-foreground">Enter your PIN to encrypt</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type={show ? 'text' : 'password'}
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={e => e.key === 'Enter' && !busy && pin.length >= 4 && handleBackup()}
                placeholder="••••"
                autoFocus
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-10 py-2.5 font-mono text-lg tracking-[0.4em] text-amber-400 focus:border-amber-500/40 focus:outline-none"
              />
              <button onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Use the same PIN you set up at app launch.
            </p>
          </div>

          {/* Last backup confirmation */}
          {lastBackup && (
            <div className="p-3 rounded-md bg-emerald-500/5 border border-emerald-500/15">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-400">Backup downloaded</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5 break-all">{lastBackup.filename}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Size: <span className="font-mono text-foreground">{formatBackupSize(lastBackup.sizeBytes)}</span> ·
                    Created: <span className="font-mono text-foreground">{new Date(lastBackup.createdAt).toLocaleString('en-IN')}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="p-2 rounded bg-amber-500/5 border border-amber-500/15">
            <p className="text-[10px] text-amber-300/80 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>Store this file safely. If you forget your PIN, the backup is unrecoverable — there is no backdoor.</span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Close</Button>
          <Button
            onClick={handleBackup}
            disabled={busy || pin.length < 4}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 disabled:opacity-50"
          >
            {busy ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Encrypting...</>
            ) : (
              <><Download className="w-3.5 h-3.5 mr-1" /> Download Encrypted Backup</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded bg-black/30 border border-white/5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{count}</span>
    </div>
  );
}
