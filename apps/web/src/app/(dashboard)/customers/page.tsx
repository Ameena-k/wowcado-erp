'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, UserPlus, FileEdit, FolderOpen, Download, Upload, Trash2, CheckSquare, AlertTriangle, X, Loader2 } from 'lucide-react';
import { SlideOver } from '@/components/ui/SlideOver';
import { CustomerForm } from './CustomerForm';
import { getUserRole } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const router = useRouter();

  const [isSlideOpen, setSlideOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<any>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Custom Delete Modals State
  const [deleteModalContent, setDeleteModalContent] = React.useState<{ type: 'single' | 'bulk', customer?: any } | null>(null);
  const [isDeletingAction, setIsDeletingAction] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [role, setRole] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    setRole(getUserRole());
  }, []);

  const canImportExport = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'ACCOUNTANT';
  const canDelete = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const loadCustomers = React.useCallback(async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?search=${query}`);
      setCustomers(res.data.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => loadCustomers(search), 400);
    return () => clearTimeout(t);
  }, [search, loadCustomers]);

  // reset selection when list changes
  React.useEffect(() => { setSelectedIds(new Set()); }, [customers]);

  const handleCreate = () => { setEditingCustomer(null); setSlideOpen(true); };
  const handleEdit = (c: any) => { setEditingCustomer(c); setSlideOpen(true); };
  const onFormSuccess = () => { setSlideOpen(false); loadCustomers(search); };

  // ── Single delete directly from row ────────────────────────────────────────
  const RequestDeleteOne = (c: any) => { setDeleteError(null); setDeleteModalContent({ type: 'single', customer: c }); };
  const RequestBulkDelete = () => { setDeleteError(null); setDeleteModalContent({ type: 'bulk' }); };

  const confirmDelete = async () => {
    if (!deleteModalContent) return;
    setIsDeletingAction(true);
    setDeleteError(null);

    try {
      if (deleteModalContent.type === 'single') {
        const c = deleteModalContent.customer;
        await api.delete(`/customers/${c.id}`);
      } else {
        const res = await api.post('/customers/bulk-delete', { ids: Array.from(selectedIds) });
        const { deletedCount, totalRequested } = res.data;
        if (deletedCount < totalRequested) {
          setDeleteError(`Only ${deletedCount} of ${totalRequested} customers were deleted. The rest have transaction history and cannot be deleted strictly.`);
          setIsDeletingAction(false);
          loadCustomers(search);
          return; // Keep modal open intentionally to show error message
        }
      }
      
      // Success cleanup
      setDeleteModalContent(null);
      if (deleteModalContent.type === 'bulk') setSelectedIds(new Set());
      loadCustomers(search);
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setIsDeletingAction(false);
    }
  };

  // ── Selection helpers ────────────────────────────────────────────────────────
  const allSelected = customers.length > 0 && selectedIds.size === customers.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map(c => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/customers/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'wowcado_customers_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.alert('Export failed. Make sure you have the correct permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader
        title="Customers"
        description="Manage your client relations and access 360-degree profiles seamlessly."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {canImportExport && (
            <>
              <Button
                variant="outline"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting…' : 'Export CSV'}
              </Button>
              <Link 
                href="/customers/import"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-slate-200 bg-transparent shadow-sm hover:bg-slate-50 hover:text-slate-900 h-9 px-4 py-2 text-slate-700 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Link>
            </>
          )}
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-5">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Bulk actions bar — only visible when something is selected */}
          {selectedIds.size > 0 && canDelete && (
            <div className="flex items-center gap-2 ml-auto bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 animate-in slide-in-from-right-4 duration-200">
              <CheckSquare className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-sm font-semibold text-red-700">{selectedIds.size} selected</span>
              <Button
                variant="outline"
                className="h-8 px-3 text-xs border-red-300 text-red-700 hover:bg-red-100 ml-1"
                onClick={RequestBulkDelete}
                disabled={isDeletingAction}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {isDeletingAction ? 'Deleting…' : 'Delete Selected'}
              </Button>
              <button
                className="text-xs text-slate-500 hover:text-slate-700 ml-1 underline"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────────────────────── */}
        {loading && customers.length === 0 ? (
          <LoadingState message="Fetching customers…" />
        ) : customers.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={search ? 'No matches found' : 'No customers yet'}
              description={search ? 'Try a different search term' : 'Add your first customer to start generating invoices.'}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {canDelete && (
                  <TableHead className="w-10 pr-0">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer accent-indigo-600"
                      title="Select all"
                    />
                  </TableHead>
                )}
                <TableHead>Customer</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => {
                const isSelected = selectedIds.has(c.id);
                return (
                  <TableRow
                    key={c.id}
                    className={isSelected ? 'bg-indigo-50/60' : undefined}
                  >
                    {canDelete && (
                      <TableCell className="pr-0 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(c.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer accent-indigo-600"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="text-xs font-mono text-slate-400 mt-0.5">#{c.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-slate-600">
                        <span>{c.phone}</span>
                        {c.email && <span className="text-slate-400 text-xs">{c.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(c.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(c)}
                          className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                          title="Edit customer"
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Link href={`/customers/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900" title="View profile">
                            <FolderOpen className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => RequestDeleteOne(c)}
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* ── Quick count footer ─────────────────────────────────────────────── */}
        {customers.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>{customers.length} customer{customers.length !== 1 ? 's' : ''} shown</span>
            {selectedIds.size > 0 && (
              <span className="text-indigo-500 font-medium">{selectedIds.size} selected</span>
            )}
          </div>
        )}
      </div>

      <SlideOver
        isOpen={isSlideOpen}
        onClose={() => setSlideOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Onboard Customer'}
        description={
          editingCustomer
            ? 'Update customer details.'
            : 'Fill in customer info and default delivery address to get started.'
        }
      >
        {isSlideOpen && (
          <CustomerForm
            initialData={editingCustomer}
            onSuccess={onFormSuccess}
            onCancel={() => setSlideOpen(false)}
          />
        )}
      </SlideOver>

      {/* ── Custom Theme Delete Confirmation Modal ─────────────────────────────── */}
      {deleteModalContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {deleteModalContent.type === 'bulk' ? 'Delete Selected' : 'Delete Customer'}
                </h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100" onClick={() => setDeleteModalContent(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-slate-600 leading-relaxed mb-6">
              {deleteModalContent.type === 'bulk' 
                ? `Are you strictly sure you want to permanently delete the ${selectedIds.size} selected customers? This action cannot be undone.`
                : `Are you strictly sure you want to permanently delete "${deleteModalContent.customer?.name}"? This action cannot be undone.`
              }
            </p>

            {deleteError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex flex-col gap-2">
                <span className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Deletion Guard Triggered</span>
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="border-slate-300" onClick={() => setDeleteModalContent(null)} disabled={isDeletingAction}>
                {deleteError ? 'Close' : 'Cancel'}
              </Button>
              <Button 
                onClick={confirmDelete} 
                className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                disabled={isDeletingAction}
              >
                {isDeletingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : (deleteError ? 'Retry Deletion' : 'Yes, Delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
