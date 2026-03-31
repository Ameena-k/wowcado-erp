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
import { Search, Plus, Banknote, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function VendorPaymentsPage() {
  const [payments, setPayments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async (q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const res = await api.get(`/vendor-payments?${params}`);
      setPayments(res.data.data || []);
    } catch { } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(search), 380);
    return () => clearTimeout(t);
  }, [search, load]);

  const fmt = (v: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v));

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader title="Vendor Payments" description="Record and track all outbound supplier payments.">
        <Link href="/vendor-payments/create">
          <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 px-6">
            <Plus className="w-4 h-4 mr-2" /> Record Payment
          </Button>
        </Link>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search payments or vendors..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="pl-10 bg-slate-50 focus:bg-white" />
          </div>
        </div>

        {loading && payments.length === 0 ? (
          <div className="p-8"><LoadingState message="Loading vendor payments..." /></div>
        ) : payments.length === 0 ? (
          <div className="p-12"><EmptyState title="No vendor payments recorded" description="Record your first outbound payment to a supplier." /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Unallocated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 hidden sm:flex">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{p.paymentNumber}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{p.paymentMethod}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="font-semibold text-slate-800">{p.vendor?.name || '—'}</span></TableCell>
                  <TableCell><span className="text-sm text-slate-600">{format(new Date(p.paymentDate), 'MMM dd, yyyy')}</span></TableCell>
                  <TableCell className="text-center">
                    {p.status === 'COMPLETED' ? <Badge variant="success">Completed</Badge> : <Badge variant="secondary">{p.status}</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-slate-900">{fmt(p.amount)}</TableCell>
                  <TableCell className="text-right font-bold text-amber-600">
                    {Number(p.unallocatedAmount) > 0 ? fmt(p.unallocatedAmount) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/vendor-payments/${p.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600">
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
