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
import { Search, Plus, Filter, FileEdit, Package, Trash2, AlertTriangle, X } from 'lucide-react';
import { SlideOver } from '@/components/ui/SlideOver';
import { ProductForm } from './ProductForm';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProductsPage() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  
  const [categories, setCategories] = React.useState<any[]>([]);

  const [isSlideOpen, setSlideOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<any>(null);

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  const loadLookups = React.useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) { }
  }, []);

  const loadProducts = React.useCallback(async (query = '', catId = '', isActive = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/products?search=${query}&categoryId=${catId}&active=${isActive}`);
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProducts(search, categoryFilter, statusFilter);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search, categoryFilter, statusFilter, loadProducts]);

  const handleCreate = () => {
    setEditingProduct(null);
    setSlideOpen(true);
  };

  const handleEdit = (c: any) => {
    setEditingProduct(c);
    setSlideOpen(true);
  };

  const confirmDelete = (product: any) => {
    setProductToDelete(product);
    setDeleteError('');
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/products/${productToDelete.id}`);
      setDeleteModalOpen(false);
      setProductToDelete(null);
      loadProducts(search, categoryFilter, statusFilter);
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader title="Product Catalog" description="Manage your master inventory explicitly globally mapped.">
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-6">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full max-w-xs transition-all">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search SKU or Name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 focus:bg-white"
            />
          </div>
          
          <div className="flex w-full sm:w-auto items-center gap-3">
             <div className="relative min-w-[160px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="pl-9 h-10 w-full text-sm">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
             </div>
             <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 text-sm hidden sm:flex w-32">
                <option value="">Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
             </Select>
          </div>
        </div>

        {loading && products.length === 0 ? (
          <LoadingState message="Fetching catalog..." />
        ) : products.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              title={search || categoryFilter ? "No matches found in catalog" : "Catalog is empty"} 
              description={search || categoryFilter ? "Try adjusting the filters." : "Start categorizing inventory natively."}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Identity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Tax Profile</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex h-9 w-9 bg-slate-100 rounded-lg items-center justify-center border border-slate-200 text-slate-500">
                           <Package className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 leading-tight block">{p.name}</span>
                            <span className="text-[11px] font-mono font-medium text-slate-500 tracking-wider">
                                {p.sku} | {p.unit.toUpperCase()}
                            </span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 font-medium">
                        {p.category?.name || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-800">
                    {formatCurrency(p.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-slate-600 font-medium">
                        {p.taxRate?.rate}% <span className="text-xs text-slate-400 font-normal">({p.taxRate?.name})</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={p.active ? 'success' : 'secondary'}>
                      {p.active ? 'Active' : 'Hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-8 w-8 text-slate-500 hover:text-indigo-600">
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(p)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Link href={`/products/${p.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                          <Package className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <SlideOver 
        isOpen={isSlideOpen} 
        onClose={() => setSlideOpen(false)}
        title={editingProduct ? "Revise Catalog Item" : "Create Master Product"}
        description={editingProduct ? "Update sales pricing and taxation bounds securely." : "Push a completely new SKU item."}
      >
        {isSlideOpen && (
          <ProductForm 
            initialData={editingProduct} 
            onSuccess={() => { setSlideOpen(false); loadProducts(search, categoryFilter, statusFilter); }}
            onCancel={() => setSlideOpen(false)}
          />
        )}
      </SlideOver>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => !isDeleting && setDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Purge Master Item</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Delete SKU <span className="font-bold text-slate-800">{productToDelete.sku}</span> permanently from the database.
                  </p>
                </div>
              </div>
              
              {deleteError && (
                <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium">
                  {deleteError}
                </div>
              )}
              
              <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
                >
                  {isDeleting ? 'Erasing...' : 'Confirm Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
