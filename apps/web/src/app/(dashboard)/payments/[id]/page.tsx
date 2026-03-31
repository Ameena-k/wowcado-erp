'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ArrowLeft, User, Search, CheckCircle2, ShieldAlert, FileText, Banknote } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { WhatsAppLogsCard } from '@/components/ui/WhatsAppLogsCard';

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  const [payment, setPayment] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function fetchPayment() {
      try {
        const res = await api.get(`/customer-payments/${params.id}`);
        setPayment(res.data);
      } catch (err: any) {
        setError('Remittance log structurally absent.');
      } finally {
        setLoading(false);
      }
    }
    fetchPayment();
  }, [params.id]);

  if (loading) return <LoadingState message="Decoding allocation logs natively..." />;
  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!payment) return null;

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/payments" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Remittances
        </Link>
      </div>

      <PageHeader title={`Payment ${payment.paymentNumber}`} description={`Logged safely on ${format(new Date(payment.paymentDate), 'MMM d, yyyy')}`}>
        <div className="mr-auto">
            <Badge variant="success" className="px-3 py-1 text-sm font-semibold tracking-wide">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> COMPLETED & POSTED
            </Badge>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Stats Summary */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-t-4 border-t-indigo-500">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
                    <CardTitle className="text-sm uppercase text-slate-500 font-bold flex items-center">
                        <User className="w-4 h-4 mr-2 text-indigo-500" /> Transacting Client
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                    <p className="font-bold text-slate-900 tracking-tight text-lg">{payment.customer?.name}</p>
                    <p className="text-sm text-slate-600 font-medium">{payment.customer?.phone}</p>
                </CardContent>
            </Card>

            <Card className="bg-white border-slate-200/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Banknote className="w-24 h-24" />
              </div>
              <CardContent className="p-5 relative z-10">
                   <div className="mb-4">
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Principal</p>
                       <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(payment.amount)}</p>
                       <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mt-1">VIA {payment.paymentMethod}</p>
                   </div>
                   
                   <div className="space-y-3 pt-4 border-t border-slate-100">
                       <div className="flex justify-between items-center text-sm font-medium">
                           <span className="text-slate-500">Formally Allocated</span>
                           <span className="text-emerald-600 font-bold">{formatCurrency(payment.allocatedAmount)}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm font-medium">
                           <span className="text-slate-500 flex items-center"><ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-500" /> Pending Float</span>
                           <span className="text-amber-600 font-bold">{formatCurrency(payment.unallocatedAmount)}</span>
                       </div>
                   </div>
              </CardContent>
            </Card>
        </div>

        {/* Invoice Target Allocations Matrix */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base text-slate-800 flex items-center">
                        Explicit Invoice Targets
                    </CardTitle>
                </div>
                {payment.allocations?.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No manual allocations tracked natively for this remittance bounds.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left align-middle mb-0">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Ledger Ext Reference</th>
                                    <th className="px-6 py-4 font-semibold">Invoice Ext Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Offset Limit Applied</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payment.allocations?.map((alloc: any) => (
                                    <tr key={alloc.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                                        <td className="px-6 py-4">
                                            <Link href={`/invoices/${alloc.invoiceId}`} className="font-semibold text-indigo-600 hover:underline flex items-center">
                                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                                {alloc.invoice?.invoiceNumber}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {alloc.invoice?.invoiceDate ? format(new Date(alloc.invoice.invoiceDate), 'MMM yyyy') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-extrabold text-emerald-600 text-[15px]">
                                            {formatCurrency(alloc.allocatedAmount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <div className="mt-8">
                <WhatsAppLogsCard linkedEntityType="PAYMENT" linkedEntityId={payment.id} />
            </div>
        </div>
      </div>
    </div>
  );
}
