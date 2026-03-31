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
import { SlideOver } from '@/components/ui/SlideOver';
import { Search, Plus, Filter, Receipt, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

// ─── Expense Drawer Form ─────────────────────────────────────────────────────
function ExpenseForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);

  const [form, setForm] = React.useState({
    expenseDate: today,
    categoryId: '',
    vendorId: '',
    amount: '',
    notes: '',
    paidImmediately: false,
    paymentAccount: '',
    status: 'UNPAID',
  });

  React.useEffect(() => {
    async function loadLookups() {
      try {
        const [v, c] = await Promise.all([
          api.get('/vendors?limit=200'),
          api.get('/categories?limit=200'),
        ]);
        setVendors(v.data.data || v.data || []);
        setCategories(c.data.data || c.data || []);
      } catch { }
    }
    loadLookups();
  }, []);

  const set = (field: string, val: any) => setForm(p => ({ ...p, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        expenseDate: form.expenseDate,
        amount: Number(form.amount),
        notes: form.notes || undefined,
        status: form.paidImmediately ? 'PAID' : 'UNPAID',
      };
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.vendorId) payload.vendorId = form.vendorId;
      if (form.paidImmediately && form.paymentAccount) payload.paymentAccount = form.paymentAccount;

      await api.post('/expenses', payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-900">Record New Expense</h2>
        <p className="text-sm text-slate-500 mt-0.5">Log an operational cost to the AP ledger</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {/* Section: Details */}
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Expense Details</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Date <span className="text-red-500">*</span></label>
              <Input type="date" value={form.expenseDate} onChange={(e: any) => set('expenseDate', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Amount (₹) <span className="text-red-500">*</span></label>
              <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(e: any) => set('amount', e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <Select value={form.categoryId} onChange={(e: any) => set('categoryId', e.target.value)}>
              <option value="">— Select Category —</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Vendor / Supplier <span className="text-xs font-normal text-slate-400">(optional)</span></label>
            <Select value={form.vendorId} onChange={(e: any) => set('vendorId', e.target.value)}>
              <option value="">— No Vendor —</option>
              {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Internal Notes</label>
            <textarea
              value={form.notes}
              onChange={(e: any) => set('notes', e.target.value)}
              placeholder="Add context or reference..."
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 min-h-[80px] resize-none transition-all"
            />
          </div>
        </div>

        {/* Section: Payment */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment Details</p>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => set('paidImmediately', !form.paidImmediately)}
              className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${form.paidImmediately ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${form.paidImmediately ? 'left-[22px]' : 'left-0.5'}`} />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              Paid Immediately
              <span className="block text-xs font-normal text-slate-400">Mark as settled right now</span>
            </span>
          </label>

          {form.paidImmediately && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-sm font-semibold text-slate-700">Payment Account <span className="text-red-500">*</span></label>
              <Select value={form.paymentAccount} onChange={(e: any) => set('paymentAccount', e.target.value)} required={form.paidImmediately}>
                <option value="">— Select Account —</option>
                <option value="CASH_IN_HAND">Cash in Hand</option>
                <option value="BANK">Bank Account</option>
                <option value="RAZORPAY">Razorpay Clearing</option>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-6" disabled={loading || !form.amount}>
          {loading ? 'Posting...' : 'Post Expense'}
        </Button>
      </div>
    </form>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function ExpenseStatusBadge({ status }: { status: string }) {
  if (status === 'PAID') return <Badge variant="success">Paid</Badge>;
  if (status === 'UNPAID') return <Badge variant="warning">Unpaid</Badge>;
  if (status === 'CANCELLED') return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const load = React.useCallback(async (q = '', st = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (st) params.set('status', st);
      const res = await api.get(`/expenses?${params}`);
      setExpenses(res.data.data || []);
    } catch { } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(search, statusFilter), 380);
    return () => clearTimeout(t);
  }, [search, statusFilter, load]);

  const fmt = (v: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(v));

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader title="Expenses" description="Track and categorize all operational costs and outflows.">
        <Button onClick={() => setDrawerOpen(true)} className="bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-500/20 px-6">
          <Plus className="w-4 h-4 mr-2" /> Record Expense
        </Button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search expenses..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="pl-10 bg-slate-50 focus:bg-white" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="pl-9 h-10 min-w-[150px]">
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </div>

        {/* Table */}
        {loading && expenses.length === 0 ? (
          <div className="p-8"><LoadingState message="Loading expenses..." /></div>
        ) : expenses.length === 0 ? (
          <div className="p-12"><EmptyState title="No expenses recorded" description="Click 'Record Expense' to log your first operational cost." /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp: any) => (
                <TableRow key={exp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 hidden sm:flex">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{exp.expenseNumber}</p>
                        {exp.notes && <p className="text-xs text-slate-400 truncate max-w-[160px]">{exp.notes}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-slate-700">{exp.category?.name || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{exp.vendor?.name || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{format(new Date(exp.expenseDate), 'MMM dd, yyyy')}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <ExpenseStatusBadge status={exp.status} />
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-slate-900 text-[15px]">
                    {fmt(exp.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/expenses/${exp.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-orange-600">
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

      <SlideOver isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="">
        <ExpenseForm
          onSuccess={() => { setDrawerOpen(false); load(search, statusFilter); }}
          onClose={() => setDrawerOpen(false)}
        />
      </SlideOver>
    </div>
  );
}
