'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const [orders, setOrders] = React.useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = React.useState('');

  React.useEffect(() => {
    async function fetchOrders() {
      try {
        // Fetch orders. In a real app, we might filter by status=CONFIRMED or un-invoiced only.
        const res = await api.get('/orders');
        setOrders(res.data.data || []);
      } catch (err) { }
    }
    fetchOrders();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedOrderId) return;
     
     setLoading(true);
     setError('');

     try {
         const res = await api.post(`/invoices/from-order/${selectedOrderId}`);
         router.push(`/invoices/${res.data.id}`);
     } catch (err: any) {
         setError(err.response?.data?.message || err.message || 'Failed to generate invoice from order.');
         setLoading(false);
     }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-20">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/invoices" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Billings
        </Link>
      </div>

      <PageHeader title="Draft Invoice from Order" description="Select an active sales order to pull items, pricing, and tax configuration into a native Draft Invoice." />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-t-4 border-t-indigo-500">
          <CardHeader>
             <CardTitle className="text-base flex items-center">
               <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Source Order Selection
             </CardTitle>
          </CardHeader>
          <CardContent>
             <form onSubmit={handleGenerate} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Available Orders <span className="text-red-500">*</span></label>
                   <Select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} required 
                           className="w-full h-11 text-base p-2 border border-slate-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                       <option value="" disabled>Select Order...</option>
                       {orders.map(o => (
                         <option key={o.id} value={o.id}>
                           {o.orderNumber} - {o.customer?.name} - {formatCurrency(o.grandTotal)}
                         </option>
                       ))}
                   </Select>
                </div>
                
                <div className="pt-4 mt-6 border-t border-slate-100">
                  <Button disabled={loading || !selectedOrderId} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md h-12 text-white text-sm font-semibold tracking-wide">
                    {loading ? 'Processing...' : (
                        <>
                           GENERATE DRAFT INVOICE <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                  </Button>
                </div>
             </form>
          </CardContent>
        </Card>
        
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Automated Ledger Integration</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Instead of manual dual-entry, Wowcado maps your confirmed Sales Orders natively into Accounts Receivable limits. 
            </p>
            <ul className="space-y-3 text-sm text-slate-600 font-medium pb-2">
               <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" /> Pre-fills customer demographics and targets</li>
               <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" /> Locks dynamic tax rates and logistics overheads</li>
               <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" /> Safely drafts records before finalizing journal entries</li>
            </ul>
        </div>
      </div>
    </div>
  );
}
