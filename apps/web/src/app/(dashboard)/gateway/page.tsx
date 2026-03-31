'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, Filter, Zap, ArrowUpRight, ShieldCheck, AlertCircle, XCircle, MinusCircle, Copy } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

// ── Status Badge ──────────────────────────────────────────────────────────────
function GatewayStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    PROCESSED:  { label: 'Processed',  icon: ShieldCheck,   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    RECEIVED:   { label: 'Received',   icon: AlertCircle,   cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    FAILED:     { label: 'Failed',     icon: XCircle,       cls: 'bg-red-100 text-red-700 border-red-200' },
    DUPLICATE:  { label: 'Duplicate',  icon: Copy,          cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    IGNORED:    { label: 'Ignored',    icon: MinusCircle,   cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  };
  const cfg = map[status] || { label: status, icon: AlertCircle, cls: 'bg-slate-100 text-slate-500' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GatewayReconciliationPage() {
  const [txns, setTxns] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const load = React.useCallback(async (q = '', st = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (st) params.set('status', st);
      const res = await api.get(`/razorpay/transactions?${params}`);
      setTxns(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(search, statusFilter), 380);
    return () => clearTimeout(t);
  }, [search, statusFilter, load]);

  const fmt = (v: number | string | null) => v != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v))
    : '—';

  // Summary counts
  const counts = React.useMemo(() => {
    // These are from the current filtered view — full count only from backend
    const r: Record<string, number> = {};
    txns.forEach(t => { r[t.status] = (r[t.status] || 0) + 1; });
    return r;
  }, [txns]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader title="Gateway Reconciliation" description="Audit every Razorpay webhook event and payment capture in real time.">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Webhooks</span>
        </div>
      </PageHeader>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { key: '', label: 'All', color: 'bg-slate-800 text-white' },
          { key: 'PROCESSED', label: 'Processed', color: 'bg-emerald-600 text-white' },
          { key: 'RECEIVED', label: 'Received', color: 'bg-blue-600 text-white' },
          { key: 'FAILED', label: 'Failed', color: 'bg-red-600 text-white' },
          { key: 'DUPLICATE', label: 'Duplicate', color: 'bg-amber-500 text-white' },
          { key: 'IGNORED', label: 'Ignored', color: 'bg-slate-400 text-white' },
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setStatusFilter(p.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              statusFilter === p.key ? p.color + ' shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {p.label}
            {p.key && counts[p.key] ? ` · ${counts[p.key]}` : p.key === '' ? ` · ${total}` : ''}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search event ID, payment ID, order ID..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Table */}
        {loading && txns.length === 0 ? (
          <div className="p-8"><LoadingState message="Loading gateway events..." /></div>
        ) : txns.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No webhook events yet"
              description="Configure your Razorpay webhook to send events to /api/v1/razorpay/webhook"
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Linked Record</TableHead>
                <TableHead>Time</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {txns.map((tx: any) => (
                <TableRow key={tx.id} className={tx.status === 'FAILED' ? 'bg-red-50/30' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tx.status === 'PROCESSED' ? 'bg-emerald-50' :
                        tx.status === 'FAILED' ? 'bg-red-50' :
                        'bg-slate-50'
                      }`}>
                        <Zap className={`w-3.5 h-3.5 ${
                          tx.status === 'PROCESSED' ? 'text-emerald-500' :
                          tx.status === 'FAILED' ? 'text-red-500' :
                          'text-slate-400'
                        }`} />
                      </div>
                      <code className="text-[11px] text-slate-500 truncate max-w-[100px]" title={tx.razorpayEventId}>
                        {tx.razorpayEventId?.slice(0, 16)}...
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono font-bold text-slate-700">{tx.eventType}</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-slate-600">{tx.razorpayOrderId || '—'}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-indigo-600 font-semibold">{tx.razorpayPaymentId || '—'}</code>
                  </TableCell>
                  <TableCell className="text-center">
                    <GatewayStatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {fmt(tx.amountInr)}
                  </TableCell>
                  <TableCell>
                    {tx.customerPaymentId ? (
                      <Link href={`/payments/${tx.customerPaymentId}`} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                        Payment <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    ) : tx.invoiceId ? (
                      <Link href={`/invoices/${tx.invoiceId}`} className="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1">
                        Invoice <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                    {tx.processingError && (
                      <p className="text-[10px] text-red-500 mt-0.5 max-w-[160px] truncate" title={tx.processingError}>
                        ⚠ {tx.processingError}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">
                      {tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, HH:mm') : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/gateway/${tx.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {total > txns.length && (
          <div className="p-4 border-t border-slate-50 text-center">
            <span className="text-xs text-slate-400">Showing {txns.length} of {total} events</span>
          </div>
        )}
      </div>
    </div>
  );
}
