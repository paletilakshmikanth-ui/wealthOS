'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Upload, Download, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseCSV, downloadCSV, readFileAsText,
  generateAssetTemplate, generateLiabilityTemplate, generateIncomeTemplate, generateExpenseTemplate, generateGoalTemplate,
} from '@/lib/wealthos/csv';

type EntityType = 'assets' | 'liabilities' | 'income' | 'expenses' | 'goals';

const TEMPLATE_GENERATORS: Record<EntityType, () => string> = {
  assets: generateAssetTemplate,
  liabilities: generateLiabilityTemplate,
  income: generateIncomeTemplate,
  expenses: generateExpenseTemplate,
  goals: generateGoalTemplate,
};

const TEMPLATES: Record<EntityType, { title: string; description: string; expectedHeaders: string[] }> = {
  assets:      { title: 'Import Assets',      description: 'Stocks, MFs, gold, real estate, etc.', expectedHeaders: ['name', 'category', 'current_value', 'invested_value', 'expected_return', 'liquidity'] },
  liabilities: { title: 'Import Liabilities', description: 'Home/auto/personal loans, credit cards', expectedHeaders: ['name', 'type', 'outstanding', 'interest_rate', 'emi', 'tenure_months'] },
  income:      { title: 'Import Income',      description: 'Salary, freelance, dividends, etc.', expectedHeaders: ['label', 'source_type', 'amount', 'frequency'] },
  expenses:    { title: 'Import Expenses',    description: 'Housing, food, transport, etc.', expectedHeaders: ['label', 'category', 'amount', 'frequency', 'essential'] },
  goals:       { title: 'Import Goals',       description: 'Retirement, education, house, etc.', expectedHeaders: ['name', 'type', 'target_amount', 'current_amount', 'monthly_contribution', 'target_date'] },
};

interface ImportResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: string[];
  parsedItems: any[];
}

interface CSVImportDialogProps {
  entityType: EntityType;
  onImport: (items: any[]) => void;
  trigger: React.ReactNode;
}

export function CSVImportDialog({ entityType, onImport, trigger }: CSVImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = TEMPLATES[entityType];

  const handleFile = async (file: File) => {
    try {
      const text = await readFileAsText(file);
      setFileName(file.name);
      const parsed = parseCSV(text);

      if (parsed.errors.length > 0) {
        toast.error('CSV parse error', { description: parsed.errors[0] });
        return;
      }

      // Lazy import parsers to avoid circular deps
      const { parseAssetRows, parseLiabilityRows, parseIncomeRows, parseExpenseRows, parseGoalRows } = await import('@/lib/wealthos/csv');
      const parser = {
        assets: parseAssetRows,
        liabilities: parseLiabilityRows,
        income: parseIncomeRows,
        expenses: parseExpenseRows,
        goals: parseGoalRows,
      }[entityType];

      const parsedItems = parser(parsed.headers, parsed.rows);
      const allErrors = parsedItems.flatMap(p => p.errors);
      const validItems = parsedItems.filter(p => p.errors.length === 0).map(p => p.parsed);

      setResult({
        totalRows: parsedItems.length,
        validRows: validItems.length,
        errorRows: parsedItems.length - validItems.length,
        errors: allErrors,
        parsedItems: validItems,
      });
    } catch (e: any) {
      toast.error('Failed to read file', { description: e.message });
    }
  };

  const handleConfirm = () => {
    if (!result || result.parsedItems.length === 0) return;
    onImport(result.parsedItems);
    toast.success(`Imported ${result.parsedItems.length} ${entityType}`, {
      description: result.errorRows > 0 ? `${result.errorRows} row(s) skipped due to errors` : undefined,
    });
    setOpen(false);
    setResult(null);
    setFileName('');
  };

  const handleDownloadTemplate = () => {
    const template = TEMPLATE_GENERATORS[entityType]();
    downloadCSV(template, `wealthos_${entityType}_template.csv`);
    toast.success('Template downloaded', { description: `Fill it in and re-upload to import` });
  };

  const handleReset = () => {
    setResult(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleReset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-amber-400 flex items-center gap-2">
            <Upload className="w-4 h-4" /> {meta.title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Download template */}
          <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <span className="text-amber-400">1.</span> Download CSV Template
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Get the correct column format. Headers: <span className="font-mono text-amber-400/80">{meta.expectedHeaders.join(', ')}</span>
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="bg-black/30 border-white/10 hover:bg-white/5 text-foreground">
                <Download className="w-3.5 h-3.5 mr-1" /> Template
              </Button>
            </div>
          </div>

          {/* Step 2: Upload CSV */}
          <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
            <p className="text-xs font-medium text-foreground mb-2">
              <span className="text-amber-400">2.</span> Upload Filled CSV
            </p>
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="flex-1 px-3 py-2.5 rounded-md border border-dashed border-white/20 hover:border-amber-500/40 hover:bg-amber-500/[0.03] cursor-pointer text-center transition-colors"
              >
                <Upload className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">
                  {fileName ? <span className="text-amber-400 font-mono">{fileName}</span> : 'Click to select CSV file'}
                </span>
              </label>
            </div>
          </div>

          {/* Step 3: Preview & confirm */}
          {result && (
            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-foreground">
                  <span className="text-amber-400">3.</span> Preview Import
                </p>
                <button onClick={handleReset} className="text-muted-foreground hover:text-rose-400">
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded bg-black/30 border border-white/5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Total Rows</p>
                  <p className="text-lg font-mono font-bold text-foreground">{result.totalRows}</p>
                </div>
                <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/15 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Valid</p>
                  <p className="text-lg font-mono font-bold text-emerald-400">{result.validRows}</p>
                </div>
                <div className="p-2 rounded bg-rose-500/5 border border-rose-500/15 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Errors</p>
                  <p className="text-lg font-mono font-bold text-rose-400">{result.errorRows}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto scroll-thin space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-rose-300">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-[10px] text-muted-foreground italic">...and {result.errors.length - 10} more</p>
                  )}
                </div>
              )}

              {result.parsedItems.length > 0 && (
                <div className="mt-3 p-2 rounded bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <p className="text-[11px] text-emerald-300/90">
                    Ready to import <span className="font-mono font-bold">{result.parsedItems.length}</span> {entityType}. Click "Import" below.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Format help */}
          <details className="text-[10px] text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">Supported column names &amp; values</summary>
            <div className="mt-2 p-2 rounded bg-black/30 border border-white/5 space-y-1.5">
              <p><span className="text-amber-400">Categories:</span> {entityType === 'assets' && 'cash, mutual_funds, stocks, etf, bonds, ppf, epf, nps, gold, silver, crypto, real_estate, land, vehicles, business, private_equity, esop, rsu, foreign, collectibles'}
              {entityType === 'liabilities' && 'home_loan, education_loan, personal_loan, business_loan, credit_card, mortgage, auto_loan, other'}
              {entityType === 'income' && 'salary, bonus, dividend, rental, interest, business, freelance, capital_gains, other'}
              {entityType === 'expenses' && 'housing, food, transport, utilities, healthcare, education, lifestyle, discretionary, insurance, taxes, other'}
              {entityType === 'goals' && 'retirement, house, vehicle, marriage, education, vacation, business, emergency_fund, financial_freedom, other'}</p>
              <p><span className="text-amber-400">Frequency:</span> daily, weekly, monthly, yearly, custom (for income/expenses)</p>
              <p><span className="text-amber-400">Numbers:</span> ₹ symbols, commas, and spaces are stripped automatically</p>
              <p><span className="text-amber-400">Dates:</span> YYYY-MM-DD or DD/MM/YYYY</p>
            </div>
          </details>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={!result || result.parsedItems.length === 0}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-3.5 h-3.5 mr-1" /> Import {result?.validRows || 0} {entityType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
