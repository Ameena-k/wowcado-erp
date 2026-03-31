'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ArrowLeft, Zap, ShieldCheck, XCircle, Copy, MinusCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

type Status = 'PROCESSED' | 'RECEIVED' | 'FAILED' | 'DUPLICATE' | 'IGNORED';

const STATUS_CFG: Record<Status, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  PROCESSED: { label: 'Processed',  icon: ShieldCheck,  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  RECEIVED:  { label: 'Received',   icon: AlertCircle,  color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  FAILED:    { label: 'Failed',     icon: XCircle,      color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
  DUPLICATE: { label: 'Duplicate',  icon: Copy,         color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  IGNORED:   { label: 'Ignored',    icon: MinusCircle,  color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200' },
};

export default function GatewayTransactionDetailPage({ params }: { params: { id: string } }) {
  const [tx, setTx] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.get(`/razorpay/transactions/${params.id}`)
      .then(r => setTx(r.data))
      .catch(() => setError('Transaction not found'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState message="Loading gateway event..." />;
  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!tx) return null;

  const status = tx.status as Status;
  const cfg = STATUS_CFG[status] || STATUS_CFG.IGNORED;
  const Icon = cfg.icon;
  const fmt = (v: number | string | null | undefined) => v != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v))
    : '—';

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-12">
      <div className="flex items-center gap-2">
        <Link href="/gateway" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Gateway Events
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`h-14 w-14 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
          <Icon className={`w-7 h-7 ${cfg.color}`} />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">{tx.eventType}</h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          </div>
          <p className="text-sm text-slate-500">
            Received {tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm:ss') : '—'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gateway IDs */}
        <Card>
          <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/50">
            <CardTitle className="text-sm uppercase tracking-wide font-bold text-slate-500">Gateway Identifiers</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[
              ['Event ID', tx.razorpayEventId],
              ['Order ID', tx.razorpayOrderId],
              ['Payment ID', tx.razorpayPaymentId],
            ].map(([label, val]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">{label}</span>
                <code className="text-xs text-slate-700 font-mono text-right break-all">{val || '—'}</code>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className={`rounded-xl border p-5 ${cfg.bg}`}>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${cfg.color}`}>Financial Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Amount</span>
              <span className="font-extrabold text-slate-900 text-xl">{fmt(tx.amountInr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Currency</span>
              <span className="font-bold">{tx.currency || 'INR'}</span>
            </div>
            {tx.amountPaise && (
              <div className="flex justify-between text-slate-500">
                <span>Amount (paise)</span>
                <code className="text-xs">{tx.amountPaise}</code>
              </div>
            )}
          </div>
        </div>

        {/* Linked ERP Records */}
        <Card>
          <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/50">
            <CardTitle className="text-sm uppercase tracking-wide font-bold text-slate-500">Linked ERP Records</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Payment</span>
              {tx.customerPaymentId
                ? <Link href={`/payments/${tx.customerPaymentId}`} className="text-sm font-bold text-indigo-600 hover:underline">View Payment</Link>
                : <span className="text-slate-400 text-sm">—</span>}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice</span>
              {tx.invoiceId
                ? <Link href={`/invoices/${tx.invoiceId}`} className="text-sm font-bold text-violet-600 hover:underline">View Invoice</Link>
                : <span className="text-slate-400 text-sm">—</span>}
            </div>
            {tx.processingError && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">
                <p className="text-xs font-bold text-red-700 mb-1">Processing Error</p>
                <p className="text-xs text-red-600 font-mono">{tx.processingError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Merchant Notes */}
        {tx.notes && Object.keys(tx.notes).length > 0 && (
          <Card>
            <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-sm uppercase tracking-wide font-bold text-slate-500">Merchant Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 overflow-auto">
                {JSON.stringify(tx.notes, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Raw Payload */}
      <Card>
        <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/50">
          <CardTitle className="text-sm uppercase tracking-wide font-bold text-slate-500 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Raw Webhook Payload (Audit)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <pre className="text-xs text-slate-600 bg-slate-900 text-slate-200 rounded-lg p-4 overflow-auto max-h-[400px] font-mono leading-relaxed">
            {JSON.stringify(tx.rawPayload, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
