'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ArrowLeft, Building2, Banknote, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function VendorPaymentDetailPage({ params }: { params: { id: string } }) {
  const [payment, setPayment] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.get(`/vendor-payments/${params.id}`)
      .then(r => setPayment(r.data))
      .catch(() => setError('Payment record not found'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState message="Loading payment record..." />;
  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!payment) return null;

  const fmt = (v: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v));

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-12">
      <div className="flex items-center gap-2">
        <Link href="/vendor-payments" className="text-sm font-medium text-slate-500 hover:text-emerald-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Vendor Payments
        </Link>
      </div>

      <PageHeader title={`Payment ${payment.paymentNumber}`} description={`Logged on ${format(new Date(payment.paymentDate), 'MMM d, yyyy')}`}>
        <Badge variant="success" className="px-3 py-1 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> COMPLETED
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info panel */}
        <div className="lg:col-span-1 space-y-5">
          <Card>
            <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-sm uppercase tracking-wide font-bold text-slate-500 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" /> Payee
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-1">
              <p className="font-bold text-slate-900 text-lg">{payment.vendor?.name || '—'}</p>
              {payment.vendor?.phone && <p className="text-sm text-slate-500">{payment.vendor.phone}</p>}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Banknote className="w-20 h-20" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-200 mb-4">Fund Summary</p>
              <div className="space-y-2.5 text-sm">
                <div>
                  <p className="text-emerald-200 text-xs mb-0.5">Total Disbursed</p>
                  <p className="text-3xl font-extrabold tracking-tight">{fmt(payment.amount)}</p>
                  <p className="text-xs font-bold text-emerald-300 uppercase mt-0.5">{payment.paymentMethod}</p>
                </div>
                <div className="pt-3 border-t border-emerald-500/40 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-emerald-200">Allocated to Bills</span>
                    <span className="font-bold text-white">{fmt(payment.allocatedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-200 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-300" /> Unallocated Float
                    </span>
                    <span className={`font-bold ${Number(payment.unallocatedAmount) > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {fmt(payment.unallocatedAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {payment.referenceNumber && (
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Reference</p>
                <p className="font-bold text-slate-700 font-mono">{payment.referenceNumber}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Allocations */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-500" /> Bill Allocations
              </CardTitle>
            </div>
            {!payment.allocations?.length ? (
              <div className="p-10 text-center text-slate-500 text-sm">No specific bills were allocated. Full amount is unallocated.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold">Bill Number</th>
                      <th className="px-5 py-4 font-semibold">Bill Date</th>
                      <th className="px-5 py-4 text-right font-semibold">Allocated Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payment.allocations.map((alloc: any) => (
                      <tr key={alloc.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <Link href={`/bills/${alloc.supplierBillId}`} className="font-bold text-violet-600 hover:underline flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            {alloc.supplierBill?.billNumber || 'Bill'}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-medium">
                          {alloc.supplierBill?.billDate
                            ? format(new Date(alloc.supplierBill.billDate), 'MMM d, yyyy')
                            : '—'}
                        </td>
                        <td className="px-5 py-4 text-right font-extrabold text-emerald-600 text-[15px]">
                          {fmt(alloc.allocatedAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
