'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowLeft, Package, Receipt, Info, Tag, Layers, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await api.get(`/products/${params.id}`);
        setProduct(res.data);
      } catch (err: any) {
        setError('Product not found in catalog');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.id]);

  if (loading) return <LoadingState message="Loading catalog item..." />;
  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!product) return null;

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  const inclusiveTaxRate = 1 + (Number(product.taxRate?.rate || 0) / 100);
  const estimatedInclusivePrice = Number(product.sellingPrice) * inclusiveTaxRate;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/products" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Catalog
        </Link>
      </div>

      <PageHeader title={product.name} description={`SKU: ${product.sku}`}>
        <Badge variant={product.active ? 'success' : 'secondary'} className="px-3 py-1">
          {product.active ? 'Active' : 'Hidden'}
        </Badge>
        <Button variant="outline" className="ml-2">Edit Matrix</Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Core Attributes Card */}
        <Card className="md:col-span-1 border-t-4 border-t-indigo-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Product Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-500">Category Node</span>
                <span className="font-semibold text-slate-900">{product.category?.name || 'Uncategorized'}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-500">Measurement</span>
                <span className="font-semibold text-slate-900 uppercase tracking-wider">{product.unit}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-500">Tax Schedule</span>
                <span className="font-semibold text-slate-900">{product.taxRate?.name} ({product.taxRate?.rate}%)</span>
            </div>
            
            <div className="pt-4 mt-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Inventory Description</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
                {product.description || 'No descriptive matrix pushed.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Usage Tracker */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-indigo-50/30 border-indigo-100">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-1">Base Catalog Price (Excl. Tax)</span>
                <span className="text-3xl font-extrabold text-indigo-700 tracking-tight">{formatCurrency(product.sellingPrice)}</span>
              </CardContent>
            </Card>
            <Card className="bg-slate-50/50 border-slate-200/50 hidden sm:flex">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Estimated Street Price (Incl. Tax)</span>
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight text-opacity-80 line-through decoration-slate-300">
                    {formatCurrency(estimatedInclusivePrice)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Estimates assume single-unit parity bounds.</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <Card className="bg-white border-slate-200/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Times Invoiced</p>
                   <p className="text-2xl font-bold text-slate-800">{product._count?.invoiceItems || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Times Ordered</p>
                   <p className="text-2xl font-bold text-slate-800">{product._count?.orderItems || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base text-slate-800 flex items-center">
                 <Info className="w-4 h-4 mr-2" /> Supply Chain Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="py-12 border-b border-dashed border-slate-200 bg-white">
                 <EmptyState 
                   title="Procurement module inactive" 
                   description="Phase 2 mappings for Inventory Stock level allocations will embed dynamically directly here." 
                 />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
