'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Save, ShieldAlert, Banknote, Search, User } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RecordVendorPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillBillId = searchParams.get('billId') || '';
  const prefillVendorId = searchParams.get('vendorId') || '';

  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [vendors, setVendors] = React.useState<any[]>([]);
  const [openBills, setOpenBills] = React.useState<any[]>([]);

  const [vendorId, setVendorId] = React.useState(prefillVendorId);
  const [paymentDate, setPaymentDate] = React.useState(today);
  const [paymentMethod, setPaymentMethod] = React.useState('BANK_TRANSFER');
  const [amountStr, setAmountStr] = React.useState('');
  const [referenceNumber, setReferenceNumber] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [allocations, setAllocations] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    api.get('/vendors?limit=200').then(r => setVendors(r.data.data || r.data || [])).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!vendorId) { setOpenBills([]); setAllocations({}); return; }
    async function fetchBills() {
      try {
        const res = await api.get(`/supplier-bills?vendorId=${vendorId}`);
        const bills = (res.data.data || []).filter((b: any) =>
          (b.status === 'ISSUED' || b.status === 'PARTIALLY_PAID') && Number(b.balanceDue) > 0
        );
        setOpenBills(bills);
        if (prefillBillId && !amountStr) {
          const target = bills.find((b: any) => b.id === prefillBillId);
          if (target) {
            setAmountStr(String(target.balanceDue));
            setAllocations({ [target.id]: String(target.balanceDue) });
          }
        }
      } catch { }
    }
    fetchBills();
  }, [vendorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAlloc = (billId: string, val: string) => {
    setAllocations(prev => {
      const next = { ...prev };
      if (val === '') delete next[billId]; else next[billId] = val;
      return next;
    });
  };

  const totalPayment = Number(amountStr) || 0;
  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (Number(v) || 0), 0);
  const unallocated = totalPayment - totalAllocated;

  const fmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAllocated > totalPayment) { setError('Allocations exceed payment amount'); return; }
    setLoading(true);
    setError('');
    try {
      const allocsPayload = Object.entries(allocations)
        .filter(([, v]) => Number(v) > 0)
        .map(([supplierBillId, allocatedAmount]) => ({ supplierBillId, allocatedAmount: Number(allocatedAmount) }));

      const res = await api.post('/vendor-payments', {
        vendorId,
        paymentDate: new Date(paymentDate).toISOString(),
        amount: totalPayment,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        status: 'COMPLETED',
        allocations: allocsPayload,
      });
      router.push(`/vendor-payments/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in-50 duration-500 pb-20">
      <div className="flex items-center gap-2">
        <Link href="/vendor-payments" className="text-sm font-medium text-slate-500 hover:text-emerald-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Vendor Payments
        </Link>
      </div>

      <PageHeader title="Record Vendor Payment" description="Log an outbound payment and allocate against open supplier bills.">
        <Button type="submit" disabled={loading || !vendorId || totalPayment <= 0} className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 px-6">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Posting...' : 'Post Payment'}
        </Button>
      </PageHeader>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left panel: Identity */}
        <div className="lg:col-span-1 space-y-5">
          <Card className="border-t-4 border-t-emerald-500">
            <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-sm uppercase tracking-wide font-bold text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" /> Payee Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vendor <span className="text-red-500">*</span></label>
                <Select value={vendorId} onChange={(e: any) => setVendorId(e.target.value)} required>
                  <option value="" disabled>Select Vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Date</label>
                <Input type="date" value={paymentDate} onChange={(e: any) => setPaymentDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Method</label>
                <Select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)}>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="RAZORPAY">Razorpay</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reference No.</label>
                <Input value={referenceNumber} onChange={(e: any) => setReferenceNumber(e.target.value)} placeholder="UTR / Cheque No." />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Amount + Allocation */}
        <div className="lg:col-span-3 space-y-5">
          {/* Amount bar */}
          <Card className="p-6 border-emerald-100 bg-emerald-50/20">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" /> Total Payment Amount <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number" required min="0.01" step="0.01" placeholder="0.00"
                  className="h-14 text-2xl font-extrabold px-4 border-emerald-200 focus:ring-emerald-500/30"
                  value={amountStr} onChange={(e: any) => setAmountStr(e.target.value)}
                />
              </div>
              <div className="flex-1 flex gap-4 pt-2 sm:border-l sm:pl-6 border-t sm:border-t-0 border-slate-200">
                <div className="w-1/2 flex flex-col justify-end pb-1">
                  <span className="text-[11px] uppercase font-bold text-slate-400 mb-1">Allocated</span>
                  <span className="text-xl font-bold text-slate-800">{fmt(totalAllocated)}</span>
                </div>
                <div className="w-1/2 flex flex-col justify-end pb-1">
                  <span className="text-[11px] uppercase font-bold text-slate-400 mb-1">Unallocated</span>
                  <span className={`text-xl font-extrabold ${unallocated < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(unallocated)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Open Bills Allocation Table */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base">Open Supplier Bills</CardTitle>
            </div>
            {!vendorId ? (
              <div className="p-12 text-center flex flex-col items-center text-slate-500">
                <Search className="w-8 h-8 text-slate-300 mb-3" />
                <p className="font-medium">Select a vendor to view their open bills.</p>
              </div>
            ) : openBills.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                No open bills for this vendor. Any payment will be recorded as unallocated.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold">Bill Number</th>
                      <th className="px-5 py-4 font-semibold">Bill Date</th>
                      <th className="px-5 py-4 text-right font-semibold">Balance Due</th>
                      <th className="px-5 py-4 text-right font-semibold w-44 bg-emerald-50/50 border-l border-emerald-100 text-emerald-700">Allocate (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openBills.map((bill: any) => {
                      const allocVal = allocations[bill.id] || '';
                      const isExceeded = Number(allocVal) > Number(bill.balanceDue);
                      return (
                        <tr key={bill.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900">{bill.billNumber}</td>
                          <td className="px-5 py-4 text-slate-500 font-medium">
                            {format(new Date(bill.billDate), 'MMM d, yyyy')}
                          </td>
                          <td className="px-5 py-4 text-right font-extrabold text-rose-600">{fmt(bill.balanceDue)}</td>
                          <td className="p-3 text-right bg-emerald-50/30 border-l border-emerald-50">
                            <div className="relative">
                              <Input
                                type="number" min="0" max={String(bill.balanceDue)} step="0.01" placeholder="0.00"
                                className={`text-right font-bold h-10 ${isExceeded ? 'border-red-400 text-red-600' : 'border-emerald-200 text-emerald-800'}`}
                                value={allocVal}
                                onChange={(e: any) => setAlloc(bill.id, e.target.value)}
                              />
                              {allocVal === '' && (
                                <button
                                  type="button"
                                  onClick={() => setAlloc(bill.id, String(bill.balanceDue))}
                                  className="absolute -bottom-4 right-0 text-[9px] text-indigo-500 hover:text-indigo-700 font-bold uppercase"
                                >
                                  AUTO MAX
                                </button>
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
