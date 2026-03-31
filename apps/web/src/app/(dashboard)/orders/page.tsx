'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, Plus, Filter, FileText, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const loadOrders = React.useCallback(async (query = '', status = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/orders?search=${query}&status=${status}`);
      setOrders(res.data.data);
    } catch (err) { } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadOrders(search, statusFilter);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, loadOrders]);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  const getStatusBadge = (status: string) => {
    if (status === 'DELIVERED') return <Badge variant="success">Delivered</Badge>;
    if (status === 'CANCELLED') return <Badge variant="destructive">Cancelled</Badge>;
    if (status === 'DRAFT') return <Badge variant="outline">Draft</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader title="Sales Orders" description="Track and fulfill outbound customer engagements dynamically.">
        <Link href="/orders/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-6">
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full max-w-sm transition-all">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by Order ID or Customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 focus:bg-white"
            />
          </div>
          
          <div className="flex w-full sm:w-auto items-center gap-3">
             <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-9 h-10 w-full text-sm">
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PLACED">Placed</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                </Select>
             </div>
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <LoadingState message="Fetching active orders..." />
        ) : orders.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              title={search || statusFilter ? "No matches found" : "No orders yet"} 
              description={search || statusFilter ? "Try adjusting the filters." : "Create your first sales order to begin generating invoices."}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-center">Fulfillment</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex h-9 w-9 bg-slate-100 rounded-lg items-center justify-center border border-slate-200 text-slate-500">
                           <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight">{o.orderNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{o.customer?.name}</span>
                        <span className="text-[11px] font-mono text-slate-500">{o.customer?.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-slate-600">
                        <span><b className="text-slate-400 font-medium text-xs uppercase mr-1">Ord:</b>{format(new Date(o.orderDate), 'dd MMM yyyy')}</span>
                        <span><b className="text-indigo-400 font-medium text-xs uppercase mr-1">Del:</b>{format(new Date(o.deliveryDate), 'dd MMM yyyy')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(o.status)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900 text-base">
                    {formatCurrency(o.grandTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                      <Link href={`/orders/${o.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
