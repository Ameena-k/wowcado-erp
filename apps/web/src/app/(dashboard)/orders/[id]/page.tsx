'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ArrowLeft, User, MapPin, Truck, RefreshCw, Layers, FileSignature, Loader2, MessageSquare, ChevronDown, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { WhatsAppLogsCard } from '@/components/ui/WhatsAppLogsCard';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  const [generating, setGenerating] = React.useState(false);
  const [generateError, setGenerateError] = React.useState('');
  
  // WA Controls
  const [waDropdownOpen, setWaDropdownOpen] = React.useState(false);
  const [sendingWa, setSendingWa] = React.useState(false);
  const [waSuccessMsg, setWaSuccessMsg] = React.useState('');

  React.useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await api.get(`/orders/${params.id}`);
        setOrder(res.data);
      } catch (err: any) {
        setError('Sales Document not found natively.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params.id]);

  if (loading) return <LoadingState message="Loading Sales Form..." />;
  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!order) return null;

  const handleGenerateInvoice = async () => {
      setGenerating(true);
      setGenerateError('');
      try {
          const res = await api.post(`/invoices/from-order/${order.id}`);
          router.push(`/invoices/${res.data.id}`);
      } catch (err: any) {
          setGenerateError(err.response?.data?.message || 'Failed to generate invoice.');
      } finally {
          setGenerating(false);
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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/orders" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Listings
        </Link>
      </div>

      <PageHeader title={`Order ${order.orderNumber}`} description={`Initiated on ${format(new Date(order.orderDate), 'MMM d, yyyy')}`}>
        <Badge variant={order.status === 'DRAFT' ? 'outline' : 'success'} className="px-4 py-1.5 text-sm mr-auto uppercase tracking-wider">
          {order.status}
        </Badge>
        <div className="ml-4 space-x-2 hidden sm:flex items-center">
            <Button variant="outline"><RefreshCw className="w-4 h-4 mr-2" /> Change Status</Button>
            
            {order.status !== 'DRAFT' && order.status !== 'CANCELLED' && (
                <div className="relative">
                    <Button 
                        variant="outline" 
                        onClick={() => setWaDropdownOpen(!waDropdownOpen)} 
                        disabled={sendingWa}
                        className="border-green-200 text-green-700 hover:bg-green-50 focus:ring-green-500 bg-white"
                    >
                        {sendingWa ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <MessageSquare className="w-4 h-4 mr-2" />}
                        WhatsApp <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                    {waDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white shadow-xl z-50 p-1 animate-in fade-in zoom-in-95">
                            <button 
                              onClick={() => handleWaAction(`/whatsapp/notify/order/${order.id}`)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-green-700 rounded-md flex items-center"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2 text-slate-400" /> Resend Confirmation
                            </button>
                        </div>
                    )}
                </div>
            )}

            <Button onClick={handleGenerateInvoice} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700 shadow-md text-white border-transparent">
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
                Generate Native Invoice
            </Button>
        </div>
      </PageHeader>

      {generateError && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-sm font-semibold">
              {generateError}
          </div>
      )}

      {waSuccessMsg && (
          <div className="bg-green-50 text-green-700 border border-green-100 p-3 rounded-lg text-sm font-semibold flex items-center animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 mr-2" /> {waSuccessMsg} Let the UI component organically refresh...
          </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Module: Customer & Details */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-t-4 border-t-indigo-500">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
                    <CardTitle className="text-sm uppercase text-slate-500 font-bold flex items-center">
                        <User className="w-4 h-4 mr-2 text-indigo-500" /> Client
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                    <p className="font-bold text-slate-900 tracking-tight">{order.customer?.name}</p>
                    <p className="text-sm text-slate-600">{order.customer?.phone}</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
                    <CardTitle className="text-sm uppercase text-slate-500 font-bold flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-indigo-500" /> Delivery Target
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    <div className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-semibold block text-slate-900 mb-1">{order.customerAddress?.recipientName} • {order.customerAddress?.phone}</span>
                        {order.customerAddress?.addressLine1} <br/>
                        {order.customerAddress?.city}, {order.customerAddress?.state} {order.customerAddress?.pincode}
                    </div>
                    {order.deliveryZone && (
                        <div className="bg-indigo-50/50 p-2 rounded-md border border-indigo-100 flex items-center text-xs text-indigo-700 font-semibold space-x-2">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{order.deliveryZone.name} routing</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Right Module: Items & Billing Block */}
        <div className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base flex items-center">
                        <Layers className="w-4 h-4 mr-2 text-indigo-500" /> Order Invoice Snapshot
                    </CardTitle>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle mb-0">
                        <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold text-center">Qty</th>
                                <th className="px-6 py-4 font-semibold text-right">Price</th>
                                <th className="px-6 py-4 font-semibold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.orderItems?.map((item: any) => (
                                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-slate-900 block">{item.productNameSnapshot}</span>
                                        <span className="font-mono text-[11px] text-slate-500">{item.skuSnapshot}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right text-slate-600 font-medium">
                                        {formatCurrency(item.unitPrice)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">
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
                            <span>Subtotal Basis</span>
                            <span className="text-slate-900 font-semibold">{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 font-medium">
                            <span>Global Shipping Matrix</span>
                            <span className="text-slate-900 font-semibold">{formatCurrency(order.deliveryCharge)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 font-medium border-b border-slate-200 pb-3">
                            <span>Computed Tax Aggregate</span>
                            <span className="text-slate-900 font-semibold">{formatCurrency(order.taxTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-slate-900 font-bold uppercase tracking-wider text-sm">Grand Total</span>
                            <span className="text-indigo-600 font-extrabold text-2xl tracking-tight">{formatCurrency(order.grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="mt-8">
                <WhatsAppLogsCard linkedEntityType="ORDER" linkedEntityId={order.id} />
            </div>

            <Button onClick={handleGenerateInvoice} disabled={generating} className="w-full sm:hidden bg-emerald-600 hover:bg-emerald-700 shadow-md h-12 text-white border-transparent text-base mt-6">
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
                GENERATE INVOICE NATIVELY
            </Button>
        </div>
      </div>
    </div>
  );
}
