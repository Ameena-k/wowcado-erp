'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Save, Plus, Trash2, Calendar, MapPin, Truck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  // Lookups
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [zones, setZones] = React.useState<any[]>([]);
  const [slots, setSlots] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);

  // Form State
  const [customerId, setCustomerId] = React.useState('');
  const [addressId, setAddressId] = React.useState('');
  const [zoneId, setZoneId] = React.useState('');
  const [slotId, setSlotId] = React.useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const [orderDate, setOrderDate] = React.useState(today);
  const [deliveryDate, setDeliveryDate] = React.useState(today);
  
  const [overrideDeliveryCharge, setOverrideDeliveryCharge] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const [lineItems, setLineItems] = React.useState([{ productId: '', quantity: 1 }]);

  React.useEffect(() => {
    async function fetchLookups() {
      try {
        const [custs, zn, slt, prods] = await Promise.all([
          api.get('/customers?status=ACTIVE'),
          api.get('/delivery-zones?active=true'),
          api.get('/delivery-slots?active=true'),
          api.get('/products?active=true')
        ]);
        setCustomers(custs.data.data || []);
        setZones(zn.data || []);
        setSlots(slt.data || []);
        setProducts(prods.data.data || []);
      } catch (err) { }
    }
    fetchLookups();
  }, []);

  React.useEffect(() => {
    if (!customerId) {
        setAddresses([]);
        setAddressId('');
        return;
    }
    async function fetchAddresses() {
       try {
           const res = await api.get(`/customer-addresses?customerId=${customerId}`);
           setAddresses(res.data);
           if (res.data.length > 0) {
               setAddressId(res.data[0].id); // default to first
           }
       } catch (err) {}
    }
    fetchAddresses();
  }, [customerId]);

  const addLine = () => setLineItems([...lineItems, { productId: '', quantity: 1 }]);
  const updateLine = (idx: number, field: string, value: any) => {
      const newLineItems = [...lineItems];
      newLineItems[idx] = { ...newLineItems[idx], [field]: value };
      setLineItems(newLineItems);
  };
  const removeLine = (idx: number) => {
      if (lineItems.length === 1) return;
      setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const calculateLiveTotals = () => {
     let sub = 0;
     let tax = 0;
     lineItems.forEach(item => {
         if (!item.productId) return;
         const p = products.find(x => x.id === item.productId);
         if (!p) return;
         const lineExcl = Number(p.sellingPrice) * Number(item.quantity);
         const lineTax = lineExcl * (Number(p.taxRate?.rate || 0) / 100);
         sub += lineExcl;
         tax += lineTax;
     });
     
     let delivery = 0;
     if (overrideDeliveryCharge) {
         delivery = Number(overrideDeliveryCharge);
     } else if (zoneId) {
         const z = zones.find(x => x.id === zoneId);
         if (z) delivery = Number(z.deliveryCharge);
     }
     
     return { sub, tax, delivery, grand: sub + tax + delivery };
  };

  const t = calculateLiveTotals();

  const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError('');

     try {
         const payload = {
             customerId,
             customerAddressId: addressId,
             deliveryZoneId: zoneId || undefined,
             deliverySlotId: slotId || undefined,
             orderDate: new Date(orderDate).toISOString(),
             deliveryDate: new Date(deliveryDate).toISOString(),
             overrideDeliveryCharge: overrideDeliveryCharge ? Number(overrideDeliveryCharge) : undefined,
             notes,
             items: lineItems.filter(i => i.productId).map(i => ({
                 productId: i.productId,
                 quantity: Number(i.quantity)
             }))
         };

         if (payload.items.length === 0) {
             throw new Error('Please add at least one physical line item');
         }

         const res = await api.post('/orders', payload);
         router.push(`/orders/${res.data.id}`);
     } catch (err: any) {
         setError(err.message || err.response?.data?.message || 'Failed to create order');
         setLoading(false);
     }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in-50 duration-500 pb-20">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/orders" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>
      </div>

      <PageHeader title="New Sales Order" description="Draft a new fulfillment request directly natively into the Ledger.">
        <Button disabled={loading || !customerId || !addressId} type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-6">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Processing...' : 'Generate Order'}
        </Button>
      </PageHeader>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="border-t-4 border-t-indigo-500">
             <CardHeader>
               <CardTitle className="text-base flex items-center">
                 <Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Identity
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Customer <span className="text-red-500">*</span></label>
                    <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                        <option value="" disabled>Select Customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                 </div>
                 
                 <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Fulfillment Addr <span className="text-red-500">*</span></label>
                    <Select value={addressId} onChange={(e) => setAddressId(e.target.value)} required disabled={!customerId || addresses.length === 0}>
                        <option value="" disabled>{customerId ? (addresses.length > 0 ? 'Select Address' : '-- No saved addresses --') : 'Select Customer First'}</option>
                        {addresses.map(a => <option key={a.id} value={a.id}>{a.society?.name || 'Unknown Community'} - {a.blockOrStreet} {a.doorNo}</option>)}
                    </Select>
                 </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle className="text-base flex items-center">
                 <Truck className="w-4 h-4 mr-2 text-indigo-500" /> Logistics
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Order Date</label>
                    <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Target Delivery</label>
                    <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
                 </div>
                 <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Delivery Zone</label>
                    <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                        <option value="">-- None --</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name} ({formatCurrency(z.deliveryCharge)})</option>)}
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Delivery Slot</label>
                    <Select value={slotId} onChange={(e) => setSlotId(e.target.value)}>
                        <option value="">-- Flexible --</option>
                        {slots.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                    </Select>
                 </div>
                 <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Manual Freight Override (₹)</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="e.g. 500" 
                      value={overrideDeliveryCharge} 
                      onChange={(e) => setOverrideDeliveryCharge(e.target.value)} 
                    />
                 </div>
             </CardContent>
           </Card>
        </div>

        {/* Right Column: Line Items & Totals */}
        <div className="lg:col-span-3 space-y-6">
           <Card className="h-full flex flex-col">
             <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
               <CardTitle className="text-lg">Line Items Matrix</CardTitle>
               <Button type="button" variant="outline" size="sm" onClick={addLine}>
                 <Plus className="w-4 h-4 mr-1" /> Add Row
               </Button>
             </div>
             <CardContent className="p-0 flex-1 overflow-x-auto">
               <table className="w-full text-sm text-left align-middle border-b border-slate-100">
                  <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200">
                     <tr>
                        <th className="px-6 py-4 font-semibold w-full">Inventory Product</th>
                        <th className="px-6 py-4 font-semibold w-32">Qty</th>
                        <th className="px-6 py-4 font-semibold text-right">Unit Price</th>
                        <th className="px-6 py-4 font-semibold text-right">Line Total</th>
                        <th className="px-6 py-4"></th>
                     </tr>
                  </thead>
                  <tbody>
                     {lineItems.map((item, idx) => {
                         const product = products.find(p => p.id === item.productId);
                         const price = Number(product?.sellingPrice || 0);
                         const total = price * Number(item.quantity);

                         return (
                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-3">
                                   <Select value={item.productId} onChange={(e) => updateLine(idx, 'productId', e.target.value)} required className="w-full min-w-[200px]">
                                       <option value="" disabled>Select Item...</option>
                                       {products.map(p => (
                                           <option key={p.id} value={p.id}>{p.name}</option>
                                       ))}
                                   </Select>
                                </td>
                                <td className="px-6 py-3">
                                   <Input type="number" min="1" step="1" required value={item.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} className="w-24 min-w-[80px] text-center" />
                                </td>
                                <td className="px-6 py-3 text-right font-medium text-slate-700">
                                   {formatCurrency(price)}
                                </td>
                                <td className="px-6 py-3 text-right font-bold text-slate-900">
                                   {formatCurrency(total)}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <button type="button" onClick={() => removeLine(idx)} disabled={lineItems.length === 1} className="text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                         );
                     })}
                  </tbody>
               </table>
               
               <div className="flex justify-end p-6 bg-slate-50 rounded-b-xl border-t border-slate-100">
                   <div className="w-full max-w-xs space-y-3 pt-2 pb-2">
                       <div className="flex items-center justify-between text-sm text-slate-500 font-medium">
                           <span>Subtotal Matrix</span>
                           <span className="text-slate-900">{formatCurrency(t.sub)}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm text-slate-500 font-medium">
                           <span>Tax Escrow Flow</span>
                           <span className="text-slate-900">{formatCurrency(t.tax)}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm text-slate-500 font-medium border-b border-slate-200 pb-3">
                           <span>Logistics Freight</span>
                           <span className="text-slate-900">{formatCurrency(t.delivery)}</span>
                       </div>
                       <div className="flex items-center justify-between font-extrabold text-xl pt-1">
                           <span className="text-slate-900 tracking-tight">Grand Total</span>
                           <span className="text-indigo-600 tracking-tight">{formatCurrency(t.grand)}</span>
                       </div>
                   </div>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </form>
  );
}
