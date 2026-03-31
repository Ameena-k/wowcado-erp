'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ArrowLeft, Building2, FileText, CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

function BillStatusBadge({ status }: { status: string }) {
  const map: Record<string, any> = {
    PAID: <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>,
    PARTIALLY_PAID: <Badge variant="warning">Partially Paid</Badge>,
    ISSUED: <Badge className="bg-blue-100 text-blue-700 border-blue-200"><AlertCircle className="w-3 h-3 mr-1" />Issued</Badge>,
    DRAFT: <Badge variant="secondary">Draft</Badge>,
    CANCELLED: <Badge variant="destructive">Cancelled</Badge>,
  };
  return map[status] || <Badge variant="secondary">{status}</Badge>;
}

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const [bill, setBill] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [issuing, setIssuing] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.get(`/supplier-bills/${params.id}`)
      .then(r => setBill(r.data))
      .catch(() => setError('Bill not found'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleIssue = async () => {
    setIssuing(true);
    try {
      await api.patch(`/supplier-bills/${params.id}/status`, { status: 'ISSUED' });
      const res = await api.get(`/supplier-bills/${params.id}`);
      setBill(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue bill');
    } finally {
      setIssuing(false);
    }
  };

  if (loading) return <LoadingState message="Loading bill details..." />;
  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!bill) return null;

  const fmt = (v: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v));
  const isSettleable = bill.status === 'ISSUED' || bill.status === 'PARTIALLY_PAID';
  const isDraft = bill.status === 'DRAFT';

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-12">
      <div className="flex items-center gap-2">
        <Link href="/bills" className="text-sm font-medium text-slate-500 hover:text-violet-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Bills
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{bill.billNumber}</h1>
            <BillStatusBadge status={bill.status} />
          </div>
          <p className="text-slate-500 text-sm">Issued {format(new Date(bill.billDate), 'MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isDraft && (
            <Button onClick={handleIssue} disabled={issuing} className="bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 px-6">
              {issuing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Approve & Issue
            </Button>
          )}
          {isSettleable && (
            <Link href={`/vendor-payments/create?billId=${bill.id}&vendorId=${bill.vendorId}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 px-6">
                <CreditCard className="w-4 h-4 mr-2" /> Record Payment
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Info panel */}
        <div className="lg:col-span-1 space-y-5">
          <Card>
            <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-sm uppercase tracking-wide font-bold text-slate-500 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-500" /> Vendor
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-1">
              <p className="font-bold text-slate-900 text-lg">{bill.vendor?.name || 'Unknown Vendor'}</p>
              {bill.vendor?.phone && <p className="text-sm text-slate-500">{bill.vendor.phone}</p>}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-200 mb-4">Financial Summary</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-violet-200">Subtotal</span>
                  <span className="font-semibold">{fmt(bill.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-200">Tax</span>
                  <span className="font-semibold">{fmt(bill.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-violet-500/50">
                  <span>Grand Total</span>
                  <span className="text-xl">{fmt(bill.grandTotal)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-violet-500/30">
                  <span className="text-violet-200">Paid</span>
                  <span className="font-semibold text-emerald-300">{fmt(bill.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base">
                  <span>Balance Due</span>
                  <span className={`${Number(bill.balanceDue) > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                    {fmt(bill.balanceDue || 0)}
                  </span>
                </div>
              </div>
            </div>
            {bill.dueDate && (
              <div className="p-4 bg-amber-50 border-t border-amber-100">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-0.5">Due</p>
                <p className="font-bold text-amber-900">{format(new Date(bill.dueDate), 'MMM d, yyyy')}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Line items */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base">Line Items</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Description</th>
                    <th className="px-5 py-3 text-right font-semibold">Qty</th>
                    <th className="px-5 py-3 text-right font-semibold">Unit Price</th>
                    <th className="px-5 py-3 text-right font-semibold">Tax %</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-medium text-slate-800">{item.description || '—'}</td>
                      <td className="px-5 py-4 text-right text-slate-600">{item.quantity}</td>
                      <td className="px-5 py-4 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                      <td className="px-5 py-4 text-right text-slate-500">{item.taxRate}%</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">{fmt(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
