'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Save, Plus, Trash2, ShieldAlert, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
}

const newItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: '',
  quantity: '1',
  unitPrice: '',
  taxRate: '0',
});

export default function CreateBillPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [vendors, setVendors] = React.useState<any[]>([]);

  const [vendorId, setVendorId] = React.useState('');
  const [billDate, setBillDate] = React.useState(today);
  const [dueDate, setDueDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState<LineItem[]>([newItem()]);

  React.useEffect(() => {
    api.get('/vendors?limit=200').then(r => setVendors(r.data.data || r.data || [])).catch(() => {});
  }, []);

  const updateItem = (id: string, field: keyof LineItem, val: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: val } : it));
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(it => it.id !== id));
  };

  // Derived totals
  const computedItems = items.map(it => {
    const qty = parseFloat(it.quantity) || 0;
    const price = parseFloat(it.unitPrice) || 0;
    const tax = parseFloat(it.taxRate) || 0;
    const sub = qty * price;
    const taxAmt = sub * (tax / 100);
    return { ...it, lineSubtotal: sub, lineTax: taxAmt, lineTotal: sub + taxAmt };
  });

  const subtotal = computedItems.reduce((s, i) => s + i.lineSubtotal, 0);
  const taxTotal = computedItems.reduce((s, i) => s + i.lineTax, 0);
  const grandTotal = subtotal + taxTotal;

  const fmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);

  const handleSubmit = async (e: React.FormEvent, status = 'DRAFT') => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        vendorId: vendorId || undefined,
        billDate,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        status,
        items: computedItems.map(it => ({
          description: it.description,
          quantity: parseFloat(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
          taxRate: parseFloat(it.taxRate) || 0,
          lineTotal: it.lineTotal,
        })),
      };
      const res = await api.post('/supplier-bills', payload);
      router.push(`/bills/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-20">
      <div className="flex items-center gap-2">
        <Link href="/bills" className="text-sm font-medium text-slate-500 hover:text-violet-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Bills
        </Link>
      </div>

      <PageHeader title="New Supplier Bill" description="Record a vendor invoice to your accounts payable.">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" disabled={loading} onClick={(e: any) => handleSubmit(e, 'DRAFT')}>
            Save as Draft
          </Button>
          <Button type="button" onClick={(e: any) => handleSubmit(e, 'ISSUED')} className="bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 px-6" disabled={loading || items.every(i => !i.unitPrice)}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Posting...' : 'Issue Bill'}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left col: Bill Header */}
        <div className="lg:col-span-1 space-y-5">
          <Card className="border-t-4 border-t-violet-500">
            <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-sm uppercase tracking-wide font-bold text-slate-500">Bill Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vendor</label>
                <Select value={vendorId} onChange={(e: any) => setVendorId(e.target.value)}>
                  <option value="">— Select Vendor —</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bill Date <span className="text-red-500">*</span></label>
                <Input type="date" value={billDate} onChange={(e: any) => setBillDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Due Date</label>
                <Input type="date" value={dueDate} onChange={(e: any) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                  placeholder="Internal notes or references..."
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Totals Summary */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-200 mb-3">Bill Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-violet-200">Subtotal</span>
                  <span className="font-semibold">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-200">Tax</span>
                  <span className="font-semibold">{fmt(taxTotal)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-violet-500/50 text-base font-bold">
                  <span>Grand Total</span>
                  <span className="text-xl">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right col: Line Items */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-500" /> Line Items
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems(p => [...p, newItem()])} className="border-violet-200 text-violet-700 hover:bg-violet-50">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                    <th className="px-4 py-3 text-right font-semibold w-20">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold w-28">Unit Price</th>
                    <th className="px-4 py-3 text-right font-semibold w-20">Tax %</th>
                    <th className="px-4 py-3 text-right font-semibold w-28">Total</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {computedItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Input
                          placeholder={`Item ${idx + 1} description`}
                          value={item.description}
                          onChange={(e: any) => updateItem(item.id, 'description', e.target.value)}
                          className="border-0 shadow-none focus:ring-0 bg-transparent px-0 font-medium"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e: any) => updateItem(item.id, 'quantity', e.target.value)}
                          className="text-right w-20 border-slate-200"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={(e: any) => updateItem(item.id, 'unitPrice', e.target.value)}
                          className="text-right w-28 border-slate-200"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.taxRate}
                          onChange={(e: any) => updateItem(item.id, 'taxRate', e.target.value)}
                          className="text-right w-20 border-slate-200"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {fmt(item.lineTotal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-slate-300 hover:text-red-400 disabled:opacity-30 transition-colors p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer totals row */}
            <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <div className="space-y-1.5 text-sm min-w-[220px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span className="font-semibold">{fmt(taxTotal)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-violet-700">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
