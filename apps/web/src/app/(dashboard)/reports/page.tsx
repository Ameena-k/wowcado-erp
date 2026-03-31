'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  TrendingUp, TrendingDown, CreditCard, Building2, Receipt,
  FileText, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

// ── Stat card ──────────────────────────────────────────────────────────────────
function FinanceCard({
  label, value, sub, icon: Icon, color, trend, trendPositive
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
  trend?: string; trendPositive?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 bg-white shadow-sm ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color.replace('border-', 'bg-').replace('/20', '/10')}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`flex items-center text-xs font-bold ${trendPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Transaction type config ────────────────────────────────────────────────────
const typeConfig: Record<string, { label: string; color: string; href: string }> = {
  INVOICE: { label: 'Invoice', color: 'bg-blue-100 text-blue-700', href: '/invoices' },
  CUSTOMER_PAYMENT: { label: 'Payment Rcvd', color: 'bg-emerald-100 text-emerald-700', href: '/payments' },
  EXPENSE: { label: 'Expense', color: 'bg-orange-100 text-orange-700', href: '/expenses' },
  SUPPLIER_BILL: { label: 'Bill', color: 'bg-violet-100 text-violet-700', href: '/bills' },
  VENDOR_PAYMENT: { label: 'Vendor Pay', color: 'bg-rose-100 text-rose-700', href: '/vendor-payments' },
  JOURNAL_ENTRY: { label: 'Journal', color: 'bg-slate-100 text-slate-600', href: '#' },
};

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ReportsOverviewPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Aggregating financial data..." />;
  if (!data) return <div className="text-slate-500 text-sm">Failed to load metrics.</div>;

  const m = data.metrics;
  const fmt = (v: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v));

  return (
    <div className="space-y-8">
      {/* KPI grid */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Key Metrics</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <FinanceCard label="Total Sales" value={fmt(m.totalSales)} icon={TrendingUp} color="border-indigo-200/60" trendPositive />
          <FinanceCard label="Collections" value={fmt(m.totalCollections)} icon={CreditCard} color="border-emerald-200/60" trendPositive />
          <FinanceCard label="AR Outstanding" value={fmt(m.outstandingReceivables)} icon={Clock} color="border-amber-200/60" />
          <FinanceCard label="AP Payable" value={fmt(m.outstandingPayables)} icon={Building2} color="border-rose-200/60" trendPositive={false} />
          <FinanceCard label="Total Expenses" value={fmt(m.totalExpenses)} icon={Receipt} color="border-orange-200/60" />
          <FinanceCard
            label="Invoices"
            value={String(m.invoiceCount?.total || 0)}
            sub={`${m.invoiceCount?.paid || 0} paid · ${m.invoiceCount?.unpaidOrPartial || 0} open`}
            icon={FileText}
            color="border-blue-200/60"
          />
        </div>
      </div>

      {/* Net position banner */}
      <div className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Net Cash Position</p>
          <p className="text-3xl font-extrabold tracking-tight">
            {fmt(Number(m.totalCollections) - Number(m.totalExpenses) - Number(m.outstandingPayables))}
          </p>
          <p className="text-xs text-slate-400 mt-1">Collections − Expenses − AP Payable</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">Receivable</p>
            <p className="font-bold text-amber-300">{fmt(m.outstandingReceivables)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">Payable</p>
            <p className="font-bold text-rose-300">{fmt(m.outstandingPayables)}</p>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Activity</p>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Type</th>
                <th className="px-5 py-3 text-left font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentTransactions || []).map((tx: any, idx: number) => {
                const cfg = typeConfig[tx.type] || { label: tx.type, color: 'bg-slate-100 text-slate-600', href: '#' };
                return (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`${cfg.href}/${tx.refId}`} className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                        {tx.refNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-500">
                      {tx.entryDate ? format(new Date(tx.entryDate), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {fmt(tx.amount || 0)}
                    </td>
                  </tr>
                );
              })}
              {!data.recentTransactions?.length && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
