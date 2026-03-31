'use client';

import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Download, RefreshCw } from 'lucide-react';

interface ReportFilterBarProps {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onApply: () => void;
  loading?: boolean;
  extraFilters?: React.ReactNode;
}

export function ReportFilterBar({
  startDate, endDate, onStartChange, onEndChange,
  onApply, loading, extraFilters
}: ReportFilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 pb-5 mb-5 border-b border-slate-100">
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">From</label>
        <Input type="date" value={startDate} onChange={(e: any) => onStartChange(e.target.value)} className="w-36 h-9 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">To</label>
        <Input type="date" value={endDate} onChange={(e: any) => onEndChange(e.target.value)} className="w-36 h-9 text-sm" />
      </div>
      {extraFilters}
      <Button onClick={onApply} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 h-9 px-4 text-sm">
        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Loading...' : 'Apply'}
      </Button>
      <Button variant="outline" className="h-9 px-4 text-sm text-slate-600 hover:bg-slate-50 ml-auto" disabled>
        <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
      </Button>
    </div>
  );
}

// ── Shared summary card row ────────────────────────────────────────────────────
export function SummaryCardRow({ cards }: { cards: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl border p-4 ${c.highlight ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-slate-200/60'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${c.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{c.label}</p>
          <p className={`text-xl font-extrabold tracking-tight ${c.highlight ? 'text-white' : 'text-slate-900'}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Empty / Loading helpers ────────────────────────────────────────────────────
export function ReportEmpty({ message = 'No data for the selected period.' }: { message?: string }) {
  return (
    <div className="py-16 text-center text-slate-400">
      <p className="font-medium text-sm">{message}</p>
    </div>
  );
}

export function ReportTable({ cols, children }: { cols: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
          <tr>
            {cols.map((col, i) => (
              <th
                key={col}
                className={`px-5 py-3 font-semibold ${i > 0 ? 'text-right' : 'text-left'}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
