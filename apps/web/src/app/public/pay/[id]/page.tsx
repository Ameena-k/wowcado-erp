'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { RazorpayPayButton } from '@/components/RazorpayPayButton';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api-client';

export default function PublicPaymentPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // This calls the API, but since it's @Public() on the backend, it succeeds without login.
    api.get(`/invoices/${params.id}`)
      .then(res => setInvoice(res.data))
      .catch(err => setError(err?.response?.data?.message || 'Invoice not found.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-pulse text-slate-500 font-medium tracking-wide">Securely loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-100 bg-white p-6 text-center shadow-lg shadow-red-100/30 ring-1 ring-red-100 rounded-2xl">
           <h2 className="text-xl font-bold text-slate-700 mb-2">Unavailable</h2>
           <p className="text-slate-500 text-sm mb-6">{error}</p>
        </Card>
      </div>
    );
  }

  const isPaid = Number(invoice.balanceDue) <= 0 || invoice.status === 'PAID';

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center py-10 px-4 md:px-0">
      <Card className="w-full max-w-lg shadow-2xl shadow-indigo-100/50 ring-1 ring-indigo-50 border-white rounded-[1.5rem] bg-white overflow-hidden">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 px-8 py-10 text-white relative">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          <div className="flex items-center justify-between relative z-10 mb-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">Wowcado ERP</h1>
                <p className="text-indigo-200 text-sm opacity-90 font-medium tracking-wide">Secure Checkout Portal</p>
             </div>
             <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-indigo-100">
               <FileText className="w-6 h-6" />
             </div>
          </div>
          
          <div className="relative z-10">
            <p className="text-sm font-medium text-indigo-200/80 mb-1 uppercase tracking-wider">Amount Due</p>
            <div className="flex items-baseline gap-3">
               <span className="text-5xl font-extrabold tracking-tighter" style={{ fontFamily: 'system-ui' }}>{formatCurrency(invoice.balanceDue)}</span>
               {isPaid && <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-none ring-1 ring-emerald-500/50 uppercase tracking-widest text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1 inline"/> Paid</Badge>}
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="bg-slate-50 rounded-2xl p-5 mb-8 ring-1 ring-slate-100">
             <div className="flex justify-between items-center py-2 border-b border-slate-200/60 pb-3 mb-3">
                <span className="text-slate-500 text-sm font-medium">Billed To</span>
                <span className="text-slate-800 font-semibold">{invoice.customer?.name}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-200/60 pb-3 mb-3">
                <span className="text-slate-500 text-sm font-medium">Invoice Number</span>
                <span className="text-slate-800 font-semibold">{invoice.invoiceNumber}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-200/60 pb-3 mb-3">
                <span className="text-slate-500 text-sm font-medium">Invoice Date</span>
                <span className="text-slate-800 font-medium">{format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}</span>
             </div>
             <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 text-sm font-medium">Total Billed</span>
                <span className="text-slate-800 font-semibold">{formatCurrency(invoice.grandTotal)}</span>
             </div>
          </div>

          <div className="pt-2">
            {!isPaid ? (
               <RazorpayPayButton 
                  invoiceId={invoice.id} 
                  customerName={invoice.customer?.name} 
                  amountInr={invoice.balanceDue} 
                  customerId={invoice.customerId}
               />
            ) : (
                <div className="w-full bg-emerald-50 text-emerald-800 text-center font-medium py-4 rounded-xl ring-1 ring-emerald-200 flex items-center justify-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                   Payment Completed
                </div>
            )}
            
            <p className="text-center text-xs text-slate-400 mt-6 font-medium flex items-center justify-center gap-1.5">
               <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
               Secured by Razorpay Payments
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
