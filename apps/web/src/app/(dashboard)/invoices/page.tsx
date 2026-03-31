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
import { Search, Filter, Receipt, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const loadInvoices = React.useCallback(async (query = '', status = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices?search=${query}&status=${status}`);
      setInvoices(res.data.data);
    } catch (err) { } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadInvoices(search, statusFilter);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, loadInvoices]);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return <Badge variant="success">Paid in Full</Badge>;
    if (status === 'PARTIALLY_PAID') return <Badge variant="warning">Partially Paid</Badge>;
    if (status === 'ISSUED') return <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Issued / Open</Badge>;
    if (status === 'CANCELLED') return <Badge variant="destructive">Cancelled</Badge>;
    if (status === 'DRAFT') return <Badge variant="outline">Draft</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader title="Billings & Receivables" description="Monitor customer invoicing ledgers natively bounding explicit financial totals." />

      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full max-w-sm transition-all">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by Invoice ID or Customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 focus:bg-white"
            />
          </div>
          
          <div className="flex w-full sm:w-auto items-center gap-3">
             <div className="relative min-w-[150px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-9 h-10 w-full text-sm">
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ISSUED">Open / Issued</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid in Full</option>
                    <option value="CANCELLED">Voided / Cancelled</option>
                </Select>
             </div>
          </div>
        </div>

        {loading && invoices.length === 0 ? (
          <LoadingState message="Fetching ledger records..." />
        ) : invoices.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              title={search || statusFilter ? "No matches found" : "No invoices actively mapped"} 
              description={search || statusFilter ? "Try adjusting the filters." : "Generate a native invoice explicitly translating from an active Order pipeline."}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Identity</TableHead>
                <TableHead>Customer Node</TableHead>
                <TableHead>Generation Date</TableHead>
                <TableHead className="text-center">Ledger State</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex h-9 w-9 bg-emerald-50 rounded-lg items-center justify-center border border-emerald-100 text-emerald-600">
                           <Receipt className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight">{inv.invoiceNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-800">{inv.customer?.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 font-medium tracking-tight">
                        {format(new Date(inv.invoiceDate), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(inv.status)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-rose-600 text-sm">
                    {formatCurrency(inv.balanceDue)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900 text-base">
                    {formatCurrency(inv.grandTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                      <Link href={`/invoices/${inv.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-emerald-50">
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
