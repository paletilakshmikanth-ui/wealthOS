'use client';

import { useState, useRef } from 'react';
import { useWealthOS } from '@/lib/wealthos/store';
import { hashPin, verifyPin } from '@/lib/wealthos/engine';
import { Crown, Lock, Fingerprint, ShieldCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useWealthOS(s => s.auth);
  const [unlocked, setUnlocked] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);

  if (unlocked) return <>{children}</>;

  // Derive initial mode from auth state — no effect needed
  if (!auth.pinHash) {
    return <SetupPIN onSuccess={() => setUnlocked(true)} />;
  }
  if (auth.biometricEnabled && !useBiometric) {
    return <BiometricPrompt onSuccess={() => setUnlocked(true)} onFallback={() => setUseBiometric(true)} />;
  }
  return <EnterPIN onSuccess={() => setUnlocked(true)} />;
}

function Shell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 grid-bg">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3">
            <Crown className="w-7 h-7 text-stone-900" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-amber-400">WEALTHOS INFINITY</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">Personal CFO • Family Office</p>
        </div>
        <div className="glass-strong rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">{subtitle}</p>
          {children}
        </div>
        <div className="text-center mt-4 text-[10px] text-muted-foreground">
          <ShieldCheck className="w-3 h-3 inline mr-1" />
          AES-256 Encrypted • Offline-First • No Cloud
        </div>
      </div>
    </div>
  );
}

function SetupPIN({ onSuccess }: { onSuccess: () => void }) {
  const setPin = useWealthOS(s => s.setPin);
  const [pin, setPinState] = useState('');
  const [confirm, setConfirm] = useState('');
  const [hint, setHint] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<1 | 2>(1);

  const submit = async () => {
    setError('');
    if (stage === 1) {
      if (pin.length < 4) { setError('PIN must be at least 4 digits'); return; }
      setStage(2);
      return;
    }
    if (pin !== confirm) { setError('PINs do not match'); return; }
    const pinHash = await hashPin(pin);
    setPin(pinHash, hint || undefined);
    toast.success('PIN set successfully', { description: 'Your data is now encrypted.' });
    onSuccess();
  };

  return (
    <Shell title="Set Up Security PIN" subtitle="Create a PIN to encrypt and protect your financial data">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{stage === 1 ? 'Enter PIN' : 'Confirm PIN'}</label>
          <div className="relative mt-1.5">
            <input
              type={show ? 'text' : 'password'}
              inputMode="numeric"
              value={stage === 1 ? pin : confirm}
              onChange={e => stage === 1 ? setPinState(e.target.value.replace(/\D/g, '').slice(0, 8)) : setConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••"
              autoFocus
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-lg tracking-[0.4em] text-amber-400 focus:border-amber-500/40 focus:outline-none pr-10"
            />
            <button onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {stage === 2 && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hint (optional)</label>
            <input
              type="text"
              value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="e.g., Birthday"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 mt-1.5 text-sm text-foreground focus:border-amber-500/40 focus:outline-none"
            />
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </div>
        )}
        <div className="flex gap-2">
          {stage === 2 && (
            <button onClick={() => { setStage(1); setConfirm(''); setError(''); }} className="px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20">
              Back
            </button>
          )}
          <button onClick={submit} className="flex-1 px-4 py-2 rounded-md bg-gradient-to-r from-amber-500/30 to-amber-600/20 hover:from-amber-500/40 hover:to-amber-600/30 text-amber-300 border border-amber-500/30 text-sm font-medium">
            {stage === 1 ? 'Continue' : 'Set PIN & Enter'}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function EnterPIN({ onSuccess }: { onSuccess: () => void }) {
  const auth = useWealthOS(s => s.auth);
  const [pin, setPinState] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!auth.pinHash) { onSuccess(); return; }
    const ok = await verifyPin(pin, auth.pinHash);
    if (ok) {
      onSuccess();
    } else {
      setError('Incorrect PIN');
      setAttempts(a => a + 1);
      setPinState('');
      inputRef.current?.focus();
    }
  };

  return (
    <Shell title="Enter PIN" subtitle={attempts >= 3 ? 'Multiple failed attempts. Try carefully.' : 'Authenticate to access your vault'}>
      <div className="space-y-4">
        <div>
          <div className="relative">
            <input
              ref={inputRef}
              type={show ? 'text' : 'password'}
              inputMode="numeric"
              value={pin}
              onChange={e => { setPinState(e.target.value.replace(/\D/g, '').slice(0, 8)); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••"
              autoFocus
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-lg tracking-[0.4em] text-amber-400 focus:border-amber-500/40 focus:outline-none pr-10"
            />
            <button onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" /> {error} {attempts > 1 && `(${attempts} attempts)`}
          </div>
        )}
        {auth.hint && (
          <div className="text-[11px] text-muted-foreground italic">
            Hint: {auth.hint}
          </div>
        )}
        <button onClick={submit} className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-amber-500/30 to-amber-600/20 hover:from-amber-500/40 hover:to-amber-600/30 text-amber-300 border border-amber-500/30 text-sm font-medium">
          Unlock
        </button>
      </div>
    </Shell>
  );
}

function BiometricPrompt({ onSuccess, onFallback }: { onSuccess: () => void; onFallback: () => void }) {
  const [scanning, setScanning] = useState(false);

  const scan = () => {
    setScanning(true);
    // Simulate biometric scan
    setTimeout(() => {
      setScanning(false);
      onSuccess();
    }, 1500);
  };

  return (
    <Shell title="Biometric Unlock" subtitle="Touch the sensor to authenticate">
      <div className="flex flex-col items-center py-6">
        <button
          onClick={scan}
          disabled={scanning}
          className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all ${
            scanning
              ? 'border-amber-400 bg-amber-500/20 scale-110 pulse-dot'
              : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-400/60 hover:bg-amber-500/10'
          }`}
        >
          <Fingerprint className={`w-12 h-12 ${scanning ? 'text-amber-300' : 'text-amber-400/70'}`} strokeWidth={1.5} />
        </button>
        <p className="text-xs text-muted-foreground mt-4">
          {scanning ? 'Scanning...' : 'Tap to scan fingerprint'}
        </p>
        <button onClick={onFallback} className="mt-6 text-xs text-muted-foreground hover:text-amber-400 transition-colors">
          Use PIN instead
        </button>
      </div>
    </Shell>
  );
}
