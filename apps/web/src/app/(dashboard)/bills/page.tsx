'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, Plus, Filter, FileText, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

function BillStatusBadge({ status }: { status: string }) {
  if (status === 'PAID') return <Badge variant="success">Paid</Badge>;
  if (status === 'PARTIALLY_PAID') return <Badge variant="warning">Partial</Badge>;
  if (status === 'ISSUED') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Issued</Badge>;
  if (status === 'DRAFT') return <Badge variant="secondary">Draft</Badge>;
  if (status === 'CANCELLED') return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function SupplierBillsPage() {
  const [bills, setBills] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const load = React.useCallback(async (q = '', st = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (st) params.set('status', st);
      const res = await api.get(`/supplier-bills?${params}`);
      setBills(res.data.data || []);
    } catch { } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(search, statusFilter), 380);
    return () => clearTimeout(t);
  }, [search, statusFilter, load]);

  const fmt = (v: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v));

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader title="Supplier Bills" description="Manage all vendor invoices and accounts payable obligations.">
        <Link href="/bills/create">
          <Button className="bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 px-6">
            <Plus className="w-4 h-4 mr-2" /> New Supplier Bill
          </Button>
        </Link>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search bills or vendors..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="pl-10 bg-slate-50 focus:bg-white" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="pl-9 h-10 min-w-[160px]">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="PARTIALLY_PAID">Partial</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </div>

        {loading && bills.length === 0 ? (
          <div className="p-8"><LoadingState message="Loading supplier bills..." /></div>
        ) : bills.length === 0 ? (
          <div className="p-12"><EmptyState title="No supplier bills yet" description="Create your first bill to start tracking accounts payable." /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Bill Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill: any) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-500 hidden sm:flex">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{bill.billNumber}</p>
                        <p className="text-xs text-slate-400">{bill.items?.length || 0} line item{bill.items?.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-800">{bill.vendor?.name || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{format(new Date(bill.billDate), 'MMM dd, yyyy')}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{bill.dueDate ? format(new Date(bill.dueDate), 'MMM dd, yyyy') : '—'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <BillStatusBadge status={bill.status} />
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {fmt(bill.grandTotal)}
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-rose-600">
                    {Number(bill.balanceDue) > 0 ? fmt(bill.balanceDue) : <span className="text-emerald-600">Settled</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/bills/${bill.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-slate-50 hover:bg-violet-50 text-slate-500 hover:text-violet-600">
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
