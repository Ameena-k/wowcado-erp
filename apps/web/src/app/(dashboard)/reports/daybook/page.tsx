'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { LoadingState } from '@/components/ui/LoadingState';
import { ReportFilterBar, ReportEmpty } from '../ReportComponents';
import { buildReportParams, fmtCurrency, getDefaultDates } from '../report-utils';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  FileText, CreditCard, Receipt, Landmark, Banknote, BookOpen, ArrowRight
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; href: string }> = {
  INVOICE:          { label: 'Invoice',         icon: FileText,  color: 'text-blue-700',   bg: 'bg-blue-100',   href: '/invoices' },
  CUSTOMER_PAYMENT: { label: 'Payment Rcvd',    icon: CreditCard, color: 'text-emerald-700', bg: 'bg-emerald-100', href: '/payments' },
  EXPENSE:          { label: 'Expense',          icon: Receipt,   color: 'text-orange-700', bg: 'bg-orange-100', href: '/expenses' },
  SUPPLIER_BILL:    { label: 'Supplier Bill',    icon: Landmark,  color: 'text-violet-700', bg: 'bg-violet-100', href: '/bills' },
  VENDOR_PAYMENT:   { label: 'Vendor Payment',  icon: Banknote,  color: 'text-rose-700',   bg: 'bg-rose-100',   href: '/vendor-payments' },
  JOURNAL_ENTRY:    { label: 'Journal Entry',   icon: BookOpen,  color: 'text-slate-600',  bg: 'bg-slate-100',  href: '#' },
};

export default function DayBookPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = React.useState(defaults.start);
  const [endDate, setEndDate] = React.useState(defaults.end);
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async (s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/daybook?${buildReportParams(s, e)}`);
      setRows(res.data.data || []);
    } catch { } finally { setLoading(false); }
  }, [startDate, endDate]);

  React.useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Group rows by date for the timeline
  const grouped = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    rows.forEach(row => {
      const d = row.entryDate
        ? format(new Date(row.entryDate), 'yyyy-MM-dd')
        : 'Unknown';
      if (!map[d]) map[d] = [];
      map[d].push(row);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [rows]);

  return (
    <div>
      <ReportFilterBar
        startDate={startDate} endDate={endDate}
        onStartChange={setStartDate} onEndChange={setEndDate}
        onApply={() => load(startDate, endDate)}
        loading={loading}
      />

      {loading && <LoadingState message="Loading day book..." />}
      {!loading && rows.length === 0 && <ReportEmpty message="No transactions recorded in this period." />}

      {grouped.map(([dateKey, entries]) => (
        <div key={dateKey} className="mb-6">
          {/* Date separator */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide">
              {dateKey !== 'Unknown'
                ? format(new Date(dateKey), 'EEE, MMM d yyyy')
                : 'Unknown Date'}
            </div>
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-xs font-medium text-slate-400">{entries.length} transaction{entries.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Entry cards for the day */}
          <div className="space-y-2 pl-2">
            {entries.map((tx: any, idx: number) => {
              const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.JOURNAL_ENTRY;
              const Icon = cfg.icon;
              const linkHref = cfg.href !== '#' ? `${cfg.href}/${tx.refId}` : '#';

              return (
                <div key={idx} className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl px-4 py-3.5 shadow-sm hover:shadow-md transition-all group">
                  {/* Icon */}
                  <div className={`h-10 w-10 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
                  </div>

                  {/* Type label */}
                  <div className="flex-shrink-0 w-32 hidden sm:block">
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                  </div>

                  {/* Reference */}
                  <div className="flex-1 min-w-0">
                    {linkHref !== '#' ? (
                      <Link href={linkHref} className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors truncate block">
                        {tx.refNumber}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-800 truncate block">{tx.refNumber}</span>
                    )}
                    <span className="text-xs text-slate-400 uppercase font-medium">{tx.status}</span>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    {Number(tx.amount) > 0 && (
                      <span className="font-extrabold text-slate-900 text-base">{fmtCurrency(tx.amount)}</span>
                    )}
                  </div>

                  {/* Link arrow */}
                  {linkHref !== '#' && (
                    <Link href={linkHref} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <ArrowRight className="w-4 h-4 text-slate-400 hover:text-indigo-500" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
