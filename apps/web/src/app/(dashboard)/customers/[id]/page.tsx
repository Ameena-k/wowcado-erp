'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Mail, Phone, MapPin, Receipt, ShoppingCart, CreditCard, ArrowLeft, ArrowUpRight, Plus, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = React.useState<any>(null);
  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [societies, setSocieties] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newAddr, setNewAddr] = React.useState({ societyId: '', recipientName: '', phone: '', blockOrStreet: '', doorNo: '', landmark: '' });

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, addrRes, socRes] = await Promise.all([
          api.get(`/customers/${params.id}`),
          api.get(`/customer-addresses?customerId=${params.id}`),
          api.get('/societies?active=true')
        ]);
        setCustomer(custRes.data);
        setAddresses(addrRes.data);
        setSocieties(socRes.data);
        
        // Default recipient to customer name
        if (custRes.data) {
           setNewAddr(p => ({ ...p, recipientName: custRes.data.name, phone: custRes.data.phone }));
        }
      } catch (err: any) {
        setError('Customer not found');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customer-addresses', { ...newAddr, customerId: params.id });
      const addrRes = await api.get(`/customer-addresses?customerId=${params.id}`);
      setAddresses(addrRes.data);
      setShowAddForm(false);
      setNewAddr(p => ({ ...p, societyId: '', blockOrStreet: '', doorNo: '', landmark: '' }));
    } catch (err) {
      alert('Failed to save address');
    }
  };

  if (loading) return <LoadingState message="Loading customer profile..." />;
  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!customer) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/customers" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Customers
        </Link>
      </div>

      <PageHeader title={customer.name} description={`Internal ID: ${customer.customerNumber}`}>
        <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'secondary'} className="px-3 py-1">
          {customer.status}
        </Badge>
        <Button variant="outline" className="ml-2">Edit Details</Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Profile Card */}
        <Card className="md:col-span-1 border-t-4 border-t-indigo-500">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{customer.email}</span>
              </div>
            )}
            <div className="flex items-start gap-3 text-sm text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <div className="flex flex-col gap-1 w-full">
                {addresses.length === 0 ? (
                   <span className="text-slate-500 italic">Address unspecified</span>
                ) : (
                   addresses.map(a => (
                     <div key={a.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-indigo-500"/> {a.society?.name || 'Unknown Complex'}</p>
                        <p className="text-slate-700 text-sm mt-0.5">{a.blockOrStreet}, {a.doorNo}</p>
                        <p className="text-xs text-slate-500 mt-1 flex gap-2">
                           <span>{a.recipientName}</span> &bull; <span>{a.phone}</span>
                           {a.landmark && <>&bull; <span>{a.landmark}</span></>}
                        </p>
                     </div>
                   ))
                )}
                
                {!showAddForm ? (
                  <Button variant="outline" size="sm" className="mt-2 text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 w-full" onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-1"/> Link New Address
                  </Button>
                ) : (
                  <form onSubmit={saveAddress} className="mt-3 p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-3">
                     <Select value={newAddr.societyId} onChange={e => setNewAddr({...newAddr, societyId: e.target.value})} required>
                        <option value="" disabled>Select Community / Society...</option>
                        {societies.map(s => <option key={s.id} value={s.id}>{s.name} {s.areaOrLocality ? `(${s.areaOrLocality})` : ''}</option>)}
                     </Select>
                     <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Block / Street" value={newAddr.blockOrStreet} onChange={e => setNewAddr({...newAddr, blockOrStreet: e.target.value})} required className="text-sm bg-white" />
                        <Input placeholder="Door / Apt No" value={newAddr.doorNo} onChange={e => setNewAddr({...newAddr, doorNo: e.target.value})} required className="text-sm bg-white" />
                     </div>
                     <Input placeholder="Recipient Name" value={newAddr.recipientName} onChange={e => setNewAddr({...newAddr, recipientName: e.target.value})} required className="text-sm bg-white" />
                     <Input placeholder="Phone for delivery" value={newAddr.phone} onChange={e => setNewAddr({...newAddr, phone: e.target.value})} required className="text-sm bg-white" />
                     <Input placeholder="Landmark (Optional)" value={newAddr.landmark} onChange={e => setNewAddr({...newAddr, landmark: e.target.value})} className="text-sm bg-white" />
                     
                     <div className="flex gap-2 pt-1">
                        <Button type="submit" size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">Save</Button>
                        <Button type="button" size="sm" variant="outline" className="w-full bg-white" onClick={() => setShowAddForm(false)}>Cancel</Button>
                     </div>
                  </form>
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Internal Notes</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
                {customer.notes || 'No active notes recorded on this account.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Aggregate Tracker */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-slate-50/50 border-slate-200/40">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <ShoppingCart className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-2xl font-bold text-slate-800">{customer._count?.orders || 0}</span>
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Orders</span>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50/30 border-emerald-100">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Receipt className="w-6 h-6 text-emerald-500 mb-2" />
                <span className="text-2xl font-bold text-emerald-700">{customer._count?.invoices || 0}</span>
                <span className="text-xs font-semibold uppercase text-emerald-600 tracking-wider">Invoices</span>
              </CardContent>
            </Card>
            <Card className="bg-indigo-50/30 border-indigo-100">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <CreditCard className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-2xl font-bold text-indigo-700">{customer._count?.payments || 0}</span>
                <span className="text-xs font-semibold uppercase text-indigo-600 tracking-wider">Payments</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base text-slate-800">Recent Customer Invoices</CardTitle>
              <Link href="/invoices" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center transition-colors">
                View Ledger <ArrowUpRight className="w-3 h-3 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
               <div className="py-10 border-b border-dashed border-slate-200">
                 <EmptyState 
                   title="No invoices mapped internally" 
                   description="The invoice ledger matrix will dynamically auto-populate here once active." 
                 />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
