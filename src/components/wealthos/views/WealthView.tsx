'use client';

import { useWealthOS } from '@/lib/wealthos/store';
import {
  computeKPIs,
  computeAllocation,
  fmtCurrency,
  fmtPct,
  ASSET_CATEGORY_META,
  sumAssets,
} from '@/lib/wealthos/engine';
import { GlassCard, MetricLabel, MetricValue, SectionHeader, DeltaPill, ProgressBar } from '../Primitives';
import { ResponsiveContainer, Treemap, Tooltip, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { Wallet, TrendingUp, Coins, Building2, Car, Plus, Trash2, ArrowUpRight, PencilLine, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { CSVImportDialog } from '../CSVImportDialog';
import type { Asset, AssetCategory } from '@/lib/wealthos/types';

const axisStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' as const };

export function WealthView() {
  const state = useWealthOS();
  const kpis = computeKPIs(state);
  const allocation = computeAllocation(state.assets);
  const sym = state.settings.currencySymbol;

  const grouped = allocation.reduce((acc, a) => {
    const cat = a.category;
    if (!acc[cat]) acc[cat] = { meta: ASSET_CATEGORY_META[cat], items: state.assets.filter(x => x.category === cat) };
    return acc;
  }, {} as Record<string, { meta: typeof ASSET_CATEGORY_META[AssetCategory]; items: Asset[] }>);

  const investmentAssets = state.assets.filter(a => ASSET_CATEGORY_META[a.category].isInvestment);
  const liquidAssets = state.assets.filter(a => ASSET_CATEGORY_META[a.category].isLiquid);

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <GlassCard glow="gold" className="p-4 md:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <MetricLabel>Total Assets</MetricLabel>
          </div>
          <MetricValue value={kpis.totalAssets} symbol={sym} className="text-2xl text-gradient-gold" />
          <p className="text-[10px] text-muted-foreground mt-1">{state.assets.length} holdings across {allocation.length} categories</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <MetricLabel>Investments</MetricLabel>
          </div>
          <MetricValue value={investmentAssets.reduce((s,a)=>s+a.currentValue,0)} symbol={sym} className="text-2xl text-emerald-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{fmtPct(kpis.investmentRatio)} of total assets</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-3.5 h-3.5 text-sky-400" />
            <MetricLabel>Liquid Assets</MetricLabel>
          </div>
          <MetricValue value={liquidAssets.reduce((s,a)=>s+a.currentValue,0)} symbol={sym} className="text-2xl text-sky-400" />
          <p className="text-[10px] text-muted-foreground mt-1">{kpis.emergencyFundMonths.toFixed(1)} months of expenses</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <MetricLabel>Unrealized Gains</MetricLabel>
          </div>
          <MetricValue value={state.assets.reduce((s,a)=>s+(a.currentValue-a.investedValue),0)} symbol={sym} className="text-2xl text-emerald-400" />
          <p className="text-[10px] text-muted-foreground mt-1">
            {(() => {
              const totalInv = state.assets.reduce((s,a)=>s+a.investedValue,0);
              const totalCur = state.assets.reduce((s,a)=>s+a.currentValue,0);
              return totalInv > 0 ? `+${((totalCur - totalInv) / totalInv * 100).toFixed(1)}% return` : '';
            })()}
          </p>
        </GlassCard>
      </div>

      {/* Treemap + Bar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionHeader title="Wealth Treemap" subtitle="Asset allocation by value" icon={<Wallet className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={allocation.map(a => ({ name: a.label, size: a.value, color: ASSET_CATEGORY_META[a.category].color }))}
              dataKey="size"
              stroke="rgba(20,20,28,0.8)"
              content={<CustomTreemapContent />}
            >
              <Tooltip
                contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any, n: any) => [fmtCurrency(v as number, sym), n]}
              />
            </Treemap>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Category Returns" subtitle="Unrealized gains by asset class" icon={<TrendingUp className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={allocation.map(a => ({ name: a.label, gain: a.unrealizedGain, gainPct: a.gainPct }))} layout="vertical">
              <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => fmtCurrency(v, sym).replace(sym, '')} />
              <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} width={100} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ background: 'rgba(20,20,28,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => fmtCurrency(v as number, sym)}
              />
              <Bar dataKey="gain" radius={[0, 3, 3, 0]}>
                {allocation.map((a, i) => (
                  <Cell key={i} fill={a.gainPct >= 0 ? ASSET_CATEGORY_META[a.category].color : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Asset list by category */}
      <GlassCard className="p-5">
        <SectionHeader
          title="Holdings"
          subtitle="All tracked assets"
          icon={<Building2 className="w-4 h-4" />}
          action={<div className="flex items-center gap-2"><ImportAssetsButton /><AddAssetDialog /></div>}
        />
        <div className="space-y-3">
          {Object.entries(grouped).map(([cat, group]) => (
            <div key={cat} className="rounded-lg border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: group.meta.color }} />
                  <span className="text-sm font-medium text-foreground">{group.meta.label}</span>
                  <span className="text-[10px] text-muted-foreground">({group.items.length})</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">
                    Invested: <span className="font-mono text-foreground">{fmtCurrency(group.items.reduce((s,a)=>s+a.investedValue,0), sym)}</span>
                  </span>
                  <span className="font-mono font-semibold text-amber-400">{fmtCurrency(group.items.reduce((s,a)=>s+a.currentValue,0), sym)}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Name</th>
                      <th className="text-right px-3 py-2 font-medium">Invested</th>
                      <th className="text-right px-3 py-2 font-medium">Current</th>
                      <th className="text-right px-3 py-2 font-medium">Gain</th>
                      <th className="text-right px-3 py-2 font-medium">Return</th>
                      <th className="text-right px-3 py-2 font-medium">Exp. Yield</th>
                      <th className="text-center px-3 py-2 font-medium">Liquidity</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map(a => {
                      const gain = a.currentValue - a.investedValue;
                      const gainPct = a.investedValue > 0 ? (gain / a.investedValue) * 100 : 0;
                      return (
                        <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-foreground font-medium">{a.name}</td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular">{fmtCurrency(a.investedValue, sym)}</td>
                          <td className="px-3 py-2 text-right font-mono text-foreground tabular">{fmtCurrency(a.currentValue, sym)}</td>
                          <td className={`px-3 py-2 text-right font-mono tabular ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {gain >= 0 ? '+' : ''}{fmtCurrency(gain, sym)}
                          </td>
                          <td className={`px-3 py-2 text-right font-mono tabular ${gainPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular">{a.annualReturnRate.toFixed(1)}%</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide ${
                              a.liquidity === 'high' ? 'bg-emerald-500/10 text-emerald-400' :
                              a.liquidity === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                              a.liquidity === 'low' ? 'bg-orange-500/10 text-orange-400' :
                              'bg-rose-500/10 text-rose-400'
                            }`}>{a.liquidity}</span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <EditAssetButton asset={a} />
                              <DeleteAssetButton id={a.id} name={a.name} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function CustomTreemapContent(props: any) {
  const { x, y, width, height, name, value, color } = props;
  if (!width || !height || width < 40 || height < 30) return null;
  const safeName = String(name || '');
  const display = safeName.length > 12 ? safeName.slice(0, 11) + '…' : safeName;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} stroke="rgba(20,20,28,0.9)" strokeWidth={2} fill={color || '#d4af37'} fillOpacity={0.7} />
      {display && (
        <text x={x + 6} y={y + 14} fill="white" fontSize={10} fontWeight={600} fontFamily="monospace">
          {display}
        </text>
      )}
      {height > 40 && value != null && (
        <text x={x + 6} y={y + 28} fill="rgba(255,255,255,0.8)" fontSize={9} fontFamily="monospace">
          {fmtCurrency(value, '₹')}
        </text>
      )}
    </g>
  );
}

function AddAssetDialog() {
  return <AssetDialog mode="add" trigger={
    <Button size="sm" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30">
      <Plus className="w-3.5 h-3.5 mr-1" /> Add Asset
    </Button>
  } />;
}

function EditAssetButton({ asset }: { asset: Asset }) {
  return <AssetDialog mode="edit" asset={asset} trigger={
    <button className="text-muted-foreground hover:text-amber-400 p-1" title="Edit asset">
      <PencilLine className="w-3 h-3" />
    </button>
  } />;
}

function AssetDialog({ mode, asset, trigger }: { mode: 'add' | 'edit'; asset?: Asset; trigger: React.ReactNode }) {
  const addAsset = useWealthOS(s => s.addAsset);
  const updateAsset = useWealthOS(s => s.updateAsset);
  const importAssets = useWealthOS(s => s.importAssets);
  const sym = useWealthOS(s => s.settings.currencySymbol);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: asset?.name || '',
    category: asset?.category || ('mutual_funds' as AssetCategory),
    currentValue: asset?.currentValue?.toString() || '',
    investedValue: asset?.investedValue?.toString() || '',
    annualReturnRate: asset?.annualReturnRate?.toString() || '10',
    liquidity: asset?.liquidity || ('high' as Asset['liquidity']),
    notes: asset?.notes || '',
  });

  // Reset form when dialog opens (so edit mode loads the latest values)
  const handleOpenChange = (v: boolean) => {
    if (v && asset) {
      setForm({
        name: asset.name,
        category: asset.category,
        currentValue: asset.currentValue.toString(),
        investedValue: asset.investedValue.toString(),
        annualReturnRate: asset.annualReturnRate.toString(),
        liquidity: asset.liquidity,
        notes: asset.notes || '',
      });
    }
    setOpen(v);
  };

  const submit = () => {
    if (!form.name || !form.currentValue) return;
    const payload = {
      name: form.name,
      category: form.category,
      currentValue: parseFloat(form.currentValue) || 0,
      investedValue: parseFloat(form.investedValue) || parseFloat(form.currentValue) || 0,
      annualReturnRate: parseFloat(form.annualReturnRate) || 0,
      liquidity: form.liquidity,
      notes: form.notes,
    };
    if (mode === 'edit' && asset) {
      updateAsset(asset.id, payload);
    } else {
      addAsset(payload);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-400">{mode === 'edit' ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Asset Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., HDFC Mid Cap Fund" className="bg-black/30 border-white/10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as AssetCategory })}>
              <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="glass-strong border-white/10">
                {Object.entries(ASSET_CATEGORY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Current Value ({sym})</Label>
              <Input type="number" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Invested Value ({sym})</Label>
              <Input type="number" value={form.investedValue} onChange={e => setForm({ ...form, investedValue: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Expected Annual Return (%)</Label>
              <Input type="number" value={form.annualReturnRate} onChange={e => setForm({ ...form, annualReturnRate: e.target.value })} className="bg-black/30 border-white/10 font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Liquidity</Label>
              <Select value={form.liquidity} onValueChange={(v) => setForm({ ...form, liquidity: v as Asset['liquidity'] })}>
                <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="illiquid">Illiquid</SelectItem>
                </SelectContent>
              </Select>
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
            {mode === 'edit' ? 'Save Changes' : 'Add Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportAssetsButton() {
  const importAssets = useWealthOS(s => s.importAssets);
  return <CSVImportDialog entityType="assets" onImport={importAssets} trigger={
    <Button size="sm" variant="outline" className="bg-black/30 border-white/10 hover:bg-white/5 text-foreground">
      <Upload className="w-3.5 h-3.5 mr-1" /> Import CSV
    </Button>
  } />;
}

function DeleteAssetButton({ id, name }: { id: string; name: string }) {
  const removeAsset = useWealthOS(s => s.removeAsset);
  return (
    <button onClick={() => removeAsset(id)} className="text-muted-foreground hover:text-rose-400 transition-colors p-1">
      <Trash2 className="w-3 h-3" />
    </button>
  );
}
