'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ArrowLeft, User, RefreshCw, FileText, CheckCircle2, ShieldAlert, Loader2, CreditCard, MessageSquare, ChevronDown, Bell } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { WhatsAppLogsCard } from '@/components/ui/WhatsAppLogsCard';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  const [issuing, setIssuing] = React.useState(false);
  
  // WA Controls
  const [waDropdownOpen, setWaDropdownOpen] = React.useState(false);
  const [sendingWa, setSendingWa] = React.useState(false);
  const [waSuccessMsg, setWaSuccessMsg] = React.useState('');

  React.useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await api.get(`/invoices/${params.id}`);
        setInvoice(res.data);
      } catch (err: any) {
        setError('Invoice Record not found natively.');
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [params.id]);

  if (loading) return <LoadingState message="Verifying financial ledger..." />;
  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!invoice) return null;

  const handleIssueInvoice = async () => {
     setIssuing(true);
     try {
         await api.patch(`/invoices/${invoice.id}`, { status: 'ISSUED' });
         const updated = await api.get(`/invoices/${invoice.id}`);
         setInvoice(updated.data);
     } catch (err: any) {
         alert('Failed to execute posting engine dynamically.');
     } finally {
         setIssuing(false);
     }
  };

  const handleWaAction = async (endpoint: string) => {
      setSendingWa(true);
      setWaDropdownOpen(false);
      setWaSuccessMsg('');
      try {
          const res = await api.post(endpoint);
          setWaSuccessMsg('WhatsApp generic dispatch triggered normally.');
          setTimeout(() => setWaSuccessMsg(''), 4000);
      } catch (err: any) {
          alert('Failed to execute WhatsApp dispatch.');
      } finally {
          setSendingWa(false);
      }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return <Badge variant="success">Paid in Full</Badge>;
    if (status === 'PARTIALLY_PAID') return <Badge variant="warning">Partially Paid</Badge>;
    if (status === 'ISSUED') return <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Issued / Open</Badge>;
    if (status === 'CANCELLED') return <Badge variant="destructive">Voided</Badge>;
    if (status === 'DRAFT') return <Badge variant="outline" className="border-slate-300 text-slate-600 bg-slate-50">Draft (Unposted)</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/invoices" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Billings
        </Link>
      </div>

      <PageHeader title={`Invoice ${invoice.invoiceNumber}`} description={`Registered natively on ${format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}`}>
        <div className="mr-auto">
            {getStatusBadge(invoice.status)}
        </div>
        
        {invoice.status === 'DRAFT' && (
           <Button onClick={handleIssueInvoice} disabled={issuing} className="bg-blue-600 hover:bg-blue-700 shadow-md text-white border-transparent">
               {issuing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
               Finalize & Issue Ledger
           </Button>
        )}

        {invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
           <div className="relative">
               <Button 
                   variant="outline" 
                   onClick={() => setWaDropdownOpen(!waDropdownOpen)} 
                   disabled={sendingWa}
                   className="border-green-200 text-green-700 hover:bg-green-50 focus:ring-green-500"
               >
                   {sendingWa ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <MessageSquare className="w-4 h-4 mr-2" />}
                   WhatsApp Actions <ChevronDown className="w-4 h-4 ml-2" />
               </Button>
               {waDropdownOpen && (
                   <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white shadow-xl z-50 p-1 animate-in fade-in zoom-in-95">
                       <button 
                         onClick={() => handleWaAction(`/whatsapp/notify/invoice/${invoice.id}`)}
                         className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-green-700 rounded-md flex items-center"
                       >
                           <Bell className="w-4 h-4 mr-2 text-slate-400" /> Send Issue Notification
                       </button>
                       <button 
                         onClick={() => handleWaAction(`/whatsapp/remind/invoice/${invoice.id}`)}
                         className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-green-700 rounded-md flex items-center"
                       >
                           <RefreshCw className="w-4 h-4 mr-2 text-slate-400" /> Dispatch Payment Reminder
                       </button>
                   </div>
               )}
           </div>
        )}
      </PageHeader>
      
      {waSuccessMsg && (
          <div className="bg-green-50 text-green-700 border border-green-100 p-3 rounded-lg text-sm font-semibold flex items-center animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 mr-2" /> {waSuccessMsg} Let the UI component organically refresh...
          </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card Summary */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-t-4 border-t-emerald-500">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
                    <CardTitle className="text-sm uppercase text-slate-500 font-bold flex items-center">
                        <User className="w-4 h-4 mr-2 text-emerald-500" /> Billed Entity
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                    <p className="font-bold text-slate-900 tracking-tight text-lg">{invoice.customer?.name}</p>
                    <p className="text-sm text-slate-600 font-medium">{invoice.customer?.phone}</p>
                    {invoice.orderId && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Origin Order</span>
                            <Link href={`/orders/${invoice.orderId}`} className="text-xs text-indigo-600 font-bold hover:underline flex items-center">
                                <FileText className="w-3 h-3 mr-1" /> {invoice.order?.orderNumber}
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-white border-slate-200/50 shadow-sm">
              <CardContent className="p-5">
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Outstanding Balance</p>
                   <p className="text-3xl font-extrabold text-rose-600 tracking-tight">{formatCurrency(invoice.balanceDue)}</p>
                   {Number(invoice.paidAmount) > 0 && (
                       <p className="text-xs text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100">
                           {formatCurrency(invoice.paidAmount)} partially remitted natively.
                       </p>
                   )}
              </CardContent>
            </Card>

            {/* Mobile payment action */}
            {invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && Number(invoice.balanceDue) > 0 && (
                <Link href={`/payments/create?invoiceId=${invoice.id}&customerId=${invoice.customerId}`} className="block w-full lg:hidden">
                    <Button variant="outline" className="w-full h-12 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100">
                        <CreditCard className="w-4 h-4 mr-2" /> RECORD PAYMENT
                    </Button>
                </Link>
            )}
        </div>

        {/* Ledger Transaction Block */}
        <div className="lg:col-span-2 space-y-6">
            {invoice.status === 'DRAFT' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-800">Draft Status Active</h4>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                             This invoice is unposted. Clicking <b>Finalize & Issue Ledger</b> will lock structural edits and push the subtotal natively into the <b>PostingEngine Accounts Receivable</b> mapping!
                        </p>
                    </div>
                </div>
            )}

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle mb-0">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Service / Product Matrix</th>
                                <th className="px-6 py-4 font-semibold text-center">Qty</th>
                                <th className="px-6 py-4 font-semibold text-right">Unit Rate</th>
                                <th className="px-6 py-4 font-semibold text-right">Tax Bound</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.invoiceItems?.map((item: any) => (
                                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-slate-900 block">{item.productNameSnapshot}</span>
                                        <span className="font-mono text-[11px] text-slate-500">{item.skuSnapshot || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right text-slate-600 font-medium text-xs">
                                        {formatCurrency(item.unitPrice)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 font-medium text-xs">
                                        {formatCurrency(item.taxAmount)} <br />
                                        <span className="text-[10px]">({item.taxRateSnapshot}%)</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                                        {formatCurrency(item.lineTotal)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-end p-6 bg-slate-50/50 border-t border-slate-100">
                    <div className="w-full max-w-sm space-y-3 text-sm">
                        <div className="flex justify-between items-center text-slate-500 font-medium">
                            <span>Subtotal Principal</span>
                            <span className="text-slate-900 font-semibold">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {Number(invoice.discountTotal) > 0 && (
                            <div className="flex justify-between items-center text-emerald-600 font-medium">
                                <span>Discount Aggregates</span>
                                <span className="font-semibold">- {formatCurrency(invoice.discountTotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-slate-500 font-medium border-b border-slate-200 pb-3">
                            <span>Computed Tax Reserve</span>
                            <span className="text-slate-900 font-semibold">{formatCurrency(invoice.taxTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 pb-3">
                            <span className="text-slate-900 font-bold uppercase tracking-wider text-sm">Grand Total</span>
                            <span className="text-slate-900 font-extrabold text-2xl tracking-tight">{formatCurrency(invoice.grandTotal)}</span>
                        </div>
                        
                        {/* Payments phase 2 action placeholder */}
                        {invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && Number(invoice.balanceDue) > 0 && (
                            <div className="pt-4 mt-2 border-t border-slate-200 hidden lg:block">
                                <Link href={`/payments/create?invoiceId=${invoice.id}&customerId=${invoice.customerId}`}>
                                   <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md h-11 text-white text-sm font-semibold tracking-wide">
                                       <CreditCard className="w-4 h-4 mr-2" /> RECORD REMITTANCE
                                   </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <div className="mt-8">
                <WhatsAppLogsCard linkedEntityType="INVOICE" linkedEntityId={invoice.id} />
            </div>
        </div>
      </div>
    </div>
  );
}
