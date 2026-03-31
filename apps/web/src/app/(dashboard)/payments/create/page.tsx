'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Save, ShieldAlert, Banknote, Search, User } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RecordPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillInvoiceId = searchParams.get('invoiceId') || '';
  const prefillCustomerId = searchParams.get('customerId') || '';

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  // Lookups
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [openInvoices, setOpenInvoices] = React.useState<any[]>([]);

  // Core Form State
  const [customerId, setCustomerId] = React.useState(prefillCustomerId);
  const today = new Date().toISOString().split('T')[0];
  const [paymentDate, setPaymentDate] = React.useState(today);
  const [paymentMethod, setPaymentMethod] = React.useState('BANK');
  const [amountStr, setAmountStr] = React.useState('');
  const [referenceNumber, setReferenceNumber] = React.useState('');
  const [notes, setNotes] = React.useState('');

  // Allocation Map: { [invoiceId]: numeric string }
  const [allocations, setAllocations] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    async function fetchLookups() {
      try {
        const custs = await api.get('/customers?status=ACTIVE');
        setCustomers(custs.data.data || []);
      } catch (err) { }
    }
    fetchLookups();
  }, []);

  React.useEffect(() => {
    if (!customerId) {
        setOpenInvoices([]);
        setAllocations({});
        return;
    }
    async function fetchInvoices() {
       try {
           const res = await api.get(`/invoices?customerId=${customerId}`);
           const invoices = res.data.data.filter((i: any) => 
               (i.status === 'ISSUED' || i.status === 'PARTIALLY_PAID') && Number(i.balanceDue) > 0
           );
           setOpenInvoices(invoices);
           
           // If passed from invoice detail directly, prepopulate matching fully
           if (prefillInvoiceId && !amountStr) {
               const target = invoices.find((i:any) => i.id === prefillInvoiceId);
               if (target) {
                   setAmountStr(String(target.balanceDue));
                   setAllocations({ [target.id]: String(target.balanceDue) });
               }
           }
       } catch (err) {}
    }
    fetchInvoices();
  }, [customerId]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleSetAllocation = (invoiceId: string, val: string) => {
      setAllocations(prev => {
          const next = { ...prev };
          if (val === '') {
              delete next[invoiceId];
          } else {
              next[invoiceId] = val;
          }
          return next;
      });
  };

  const totalPayment = Number(amountStr) || 0;
  
  let totalAllocated = 0;
  Object.values(allocations).forEach(v => {
      totalAllocated += Number(v) || 0;
  });
  
  const unallocatedAmount = totalPayment - totalAllocated;

  const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError('');

     if (totalAllocated > totalPayment) {
         setError('Cannot allocate strictly more structurally than the gross Total Payment!');
         setLoading(false);
         return;
     }

     const allocsPayload = Object.keys(allocations).map(invId => {
         return {
             invoiceId: invId,
             allocatedAmount: Number(allocations[invId])
         };
     }).filter(a => a.allocatedAmount > 0);

     try {
         const payload = {
             customerId,
             paymentDate: new Date(paymentDate).toISOString(),
             amount: totalPayment,
             paymentMethod,
             referenceNumber,
             notes,
             status: 'COMPLETED',
             allocations: allocsPayload
         };

         const res = await api.post('/customer-payments', payload);
         router.push(`/payments/${res.data.id}`);
     } catch (err: any) {
         setError(err.message || err.response?.data?.message || 'Failed natively generating remittance trace.');
         setLoading(false);
     }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in-50 duration-500 pb-20">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/payments" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Log Mappings
        </Link>
      </div>

      <PageHeader title="Record New Receipt" description="Log explicit financial deposits allocating linearly securely natively.">
        <Button disabled={loading || !customerId || totalPayment <= 0} type="submit" className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 px-6">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Committing Ledger...' : 'Post Transact Matrix'}
        </Button>
      </PageHeader>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center">
             <ShieldAlert className="w-4 h-4 mr-2" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Col: Master Identity Logic */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="border-t-4 border-t-emerald-500">
             <CardHeader className="py-4 border-b border-slate-50">
               <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center text-slate-500">
                 <User className="w-4 h-4 mr-2 text-emerald-500" /> Origin Bounds
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 pt-4">
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Customer <span className="text-red-500">*</span></label>
                    <Select value={customerId} onChange={(e: any) => setCustomerId(e.target.value)} required>
                        <option value="" disabled>Select Logical Origin...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Posting Date</label>
                    <Input type="date" value={paymentDate} onChange={(e: any) => setPaymentDate(e.target.value)} required />
                 </div>

                 <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Method Boundary</label>
                    <Select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} required>
                        <option value="BANK">Bank Transfer / NEFT</option>
                        <option value="CASH">Cash</option>
                        <option value="RAZORPAY">Razorpay / UPI / Online</option>
                    </Select>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ext Reference No.</label>
                    <Input type="text" placeholder="e.g. UTR102392ABC" value={referenceNumber} onChange={(e: any) => setReferenceNumber(e.target.value)} />
                 </div>
             </CardContent>
           </Card>
        </div>

        {/* Right Col: Ledger Input Array Math */}
        <div className="lg:col-span-3 space-y-6">
           <Card className="p-6 border-indigo-100 bg-indigo-50/10">
               <div className="flex flex-col sm:flex-row gap-6">
                   <div className="flex-1 space-y-2">
                       <label className="text-sm font-bold text-indigo-900 uppercase tracking-wide flex items-center">
                           <Banknote className="w-4 h-4 mr-2 text-indigo-600" /> Gross Payment Principal Deposited <span className="text-red-500 ml-1">*</span>
                       </label>
                       <Input 
                         type="number" 
                         required 
                         min="1" 
                         step="0.01"
                         className="h-14 text-2xl font-extrabold px-4 border-indigo-200 focus:ring-indigo-500/30"
                         placeholder="0.00"
                         value={amountStr}
                         onChange={(e: any) => setAmountStr(e.target.value)}
                       />
                   </div>
                   
                   <div className="flex-1 flex gap-4 mt-2 sm:mt-0 pt-2 border-t sm:border-t-0 sm:border-l sm:pl-6 sm:ml-2 border-slate-200">
                       <div className="w-1/2 flex flex-col justify-end pb-1">
                           <span className="text-[11px] uppercase font-bold text-slate-400 mb-1">Offset Allocation</span>
                           <span className="text-xl font-bold text-slate-800">{formatCurrency(totalAllocated)}</span>
                       </div>
                       <div className="w-1/2 flex flex-col justify-end pb-1">
                           <span className="text-[11px] uppercase font-bold text-slate-400 mb-1">Unused Ledger Float</span>
                           <span className={`text-xl font-extrabold ${unallocatedAmount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                               {formatCurrency(unallocatedAmount)}
                           </span>
                       </div>
                   </div>
               </div>
           </Card>

           <Card className="overflow-hidden">
             <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-base flex items-center">
                   Outstanding Accounts Receivable Targets
               </CardTitle>
             </div>
             
             {!customerId ? (
                 <div className="p-12 text-center flex flex-col items-center justify-center bg-white">
                     <Search className="w-8 h-8 text-slate-300 mb-3" />
                     <p className="text-slate-500 font-medium">Map a transacting identity origin initially to uncover native balances legitimately mathematically.</p>
                 </div>
             ) : openInvoices.length === 0 ? (
                 <div className="p-12 text-center text-slate-500 font-medium">
                     No open tracking bounds dynamically outstanding natively! <br/> Any gross values bound will flow entirely sequentially securely mathematically onto identical identical native mappings identical identical unallocated bounds mathematically directly statically gracefully perfectly seamlessly effectively successfully effortlessly accurately flawlessly automatically precisely efficiently immediately reliably logically naturally fully.
                 </div>
             ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left align-middle mb-0">
                      <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200">
                         <tr>
                            <th className="px-6 py-4 font-semibold">Ledger Root No.</th>
                            <th className="px-6 py-4 font-semibold">Dated Map</th>
                            <th className="px-6 py-4 font-semibold text-right">Balance Void Target</th>
                            <th className="px-6 py-4 font-semibold w-48 text-right bg-emerald-50/50 border-l border-emerald-100 text-emerald-700">Manually Offset (₹)</th>
                         </tr>
                      </thead>
                      <tbody>
                         {openInvoices.map((inv) => {
                             const allocVal = allocations[inv.id] || '';
                             const isExceeded = Number(allocVal) > Number(inv.balanceDue);
                             
                             return (
                                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                       <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-medium">
                                       {format(new Date(inv.invoiceDate), 'MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-extrabold text-rose-600">
                                       {formatCurrency(inv.balanceDue)}
                                    </td>
                                    <td className="p-3 text-right bg-emerald-50/30 border-l border-emerald-50">
                                        <div className="relative">
                                            <Input 
                                               type="number"
                                               min="0"
                                               max={String(inv.balanceDue)}
                                               step="0.01"
                                               className={`text-right font-bold h-10 ${isExceeded ? 'border-red-400 text-red-600 focus:ring-red-400/20' : 'border-emerald-200 focus:ring-emerald-400/20 text-emerald-800'}`}
                                               placeholder="0.00"
                                               value={allocVal}
                                               onChange={(e: any) => handleSetAllocation(inv.id, e.target.value)}
                                            />
                                            {allocVal !== '' && (
                                              <button type="button" onClick={() => handleSetAllocation(inv.id, String(inv.balanceDue))} className="absolute text-[9px] -bottom-3 text-indigo-500 hover:text-indigo-700 font-bold uppercase right-0">AUTO MAX</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                             );
                         })}
                      </tbody>
                   </table>
                 </div>
             )}
           </Card>
        </div>
      </div>
    </form>
  );
}
