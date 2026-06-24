'use client';

import { cn } from '@/lib/utils';
import { Score } from 'lucide-react';

// ============================================================
// WealthOS — Reusable Display Primitives
// ============================================================

export function GlassCard({
  className,
  children,
  glow,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  glow?: 'gold' | 'success' | 'danger' | 'none';
  onClick?: () => void;
}) {
  const glowClass = glow === 'gold' ? 'glow-gold' : glow === 'success' ? 'glow-success' : glow === 'danger' ? 'glow-danger' : '';
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass rounded-xl relative overflow-hidden',
        glowClass,
        onClick && 'cursor-pointer hover:border-white/20 transition-colors',
        className
      )}
    >
      {children}
    </div>
  );
}

export function MetricLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium', className)}>
      {children}
    </p>
  );
}

export function MetricValue({
  value,
  className,
  symbol = '₹',
  prefix = '',
  suffix = '',
  decimals = 0,
  useShortFormat = true,
  mono = true,
}: {
  value: number;
  className?: string;
  symbol?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  useShortFormat?: boolean;
  mono?: boolean;
}) {
  const formatted = useShortFormat
    ? formatShort(value, symbol)
    : `${symbol}${value.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}`;
  return (
    <span className={cn('tabular font-semibold', mono && 'font-mono', className)}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

function formatShort(amount: number, symbol: string): string {
  if (!isFinite(amount)) amount = 0;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  let body: string;
  if (abs >= 1_00_00_000) body = (abs / 1_00_00_000).toFixed(2) + ' Cr';
  else if (abs >= 1_00_000) body = (abs / 1_00_000).toFixed(2) + ' L';
  else if (abs >= 1_000) body = (abs / 1_000).toFixed(1) + 'K';
  else body = abs.toFixed(0);
  return `${sign}${symbol}${body}`;
}

export function DeltaPill({ value, suffix = '%', className }: { value: number; suffix?: string; className?: string }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold tabular',
        positive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        className
      )}
    >
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(2)}{suffix}
    </span>
  );
}

export function SeverityPill({ severity }: { severity: 'critical' | 'warning' | 'info' | 'success' }) {
  const map = {
    critical: { label: 'CRITICAL', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
    warning:  { label: 'WARNING',  cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    info:     { label: 'INFO',     cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
    success:  { label: 'ON TRACK', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  };
  const m = map[severity];
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider border', m.cls)}>
      {m.label}
    </span>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  className,
  color = 'gold',
  showLabel = false,
  height = 'h-2',
}: {
  value: number;
  max?: number;
  className?: string;
  color?: 'gold' | 'success' | 'danger' | 'info' | 'warning';
  showLabel?: boolean;
  height?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorClass = {
    gold: 'bg-gradient-to-r from-amber-500/70 to-amber-400',
    success: 'bg-gradient-to-r from-emerald-500/70 to-emerald-400',
    danger: 'bg-gradient-to-r from-rose-500/70 to-rose-400',
    info: 'bg-gradient-to-r from-sky-500/70 to-sky-400',
    warning: 'bg-gradient-to-r from-amber-500/70 to-orange-400',
  }[color];
  return (
    <div className={cn('relative', className)}>
      <div className={cn('w-full bg-white/5 rounded-full overflow-hidden', height)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="absolute -top-5 right-0 text-[10px] text-muted-foreground tabular">{pct.toFixed(1)}%</span>
      )}
    </div>
  );
}

export function RingScore({
  score,
  size = 80,
  stroke = 6,
  label,
  sublabel,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  // color by score
  const color = score >= 85 ? '#d4af37' : score >= 70 ? '#34d399' : score >= 55 ? '#38bdf8' : score >= 40 ? '#fbbf24' : '#f43f5e';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular font-mono" style={{ color }}>{score}</span>
        {label && <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>}
        {sublabel && <span className="text-[10px] font-semibold" style={{ color }}>{sublabel}</span>}
      </div>
    </div>
  );
}

export function Sparkline({ data, color = '#d4af37', height = 32, width = 96 }: { data: number[]; color?: string; height?: number; width?: number }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  const last = points.split(' ').pop()!.split(',');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
    </svg>
  );
}
