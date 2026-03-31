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
import { Search, Filter, CreditCard, ArrowUpRight, Plus, Banknote } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState('');

  const loadPayments = React.useCallback(async (query = '', method = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/customer-payments?search=${query}&method=${method}`);
      setPayments(res.data.data);
    } catch (err) { } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadPayments(search, methodFilter);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search, methodFilter, loadPayments]);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') return <Badge variant="success">Completed</Badge>;
    if (status === 'FAILED') return <Badge variant="destructive">Failed</Badge>;
    if (status === 'PENDING') return <Badge variant="warning">Pending</Badge>;
    if (status === 'REFUNDED') return <Badge variant="secondary" className="bg-slate-200">Refunded</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader title="Customer Remittances" description="Record internal cash-flow tracking metrics logically mapped.">
        <Link href="/payments/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-6">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full max-w-sm transition-all">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search Payment ID or Customer..." 
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 focus:bg-white"
            />
          </div>
          
          <div className="flex w-full sm:w-auto items-center gap-3">
             <div className="relative min-w-[150px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Select value={methodFilter} onChange={(e: any) => setMethodFilter(e.target.value)} className="pl-9 h-10 w-full text-sm">
                    <option value="">All Methods</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI / Digital</option>
                    <option value="CASH">Cash</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="CHEQUE">Cheque</option>
                </Select>
             </div>
          </div>
        </div>

        {loading && payments.length === 0 ? (
          <LoadingState message="Fetching remittance datasets..." />
        ) : payments.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              title={search || methodFilter ? "No matches found natively" : "No Payments logged yet"} 
              description={search || methodFilter ? "Try adjusting the filters explicitly." : "Once an invoice is formally issued, track and bind transactions seamlessly here!"}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Remittance ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Transaction Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Fund Value</TableHead>
                <TableHead className="text-right">Unused Float</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex h-9 w-9 bg-indigo-50 rounded-lg items-center justify-center border border-indigo-100 text-indigo-500">
                           <Banknote className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 tracking-tight">{p.paymentNumber}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">{p.paymentMethod}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-800">{p.customer?.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 font-medium tracking-tight">
                        {format(new Date(p.paymentDate), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(p.status)}
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-slate-900 text-[15px]">
                    {formatCurrency(p.amount)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-amber-600 text-sm">
                    {Number(p.unallocatedAmount) > 0 ? formatCurrency(p.unallocatedAmount) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                      <Link href={`/payments/${p.id}`}>
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
