'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api-client';

interface ProductFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const [categories, setCategories] = React.useState<any[]>([]);
  const [taxRates, setTaxRates] = React.useState<any[]>([]);

  const [formData, setFormData] = React.useState({
    sku: initialData?.sku || '',
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || '',
    unit: initialData?.unit || 'pcs',
    sellingPrice: initialData?.sellingPrice || '',
    taxRateId: initialData?.taxRateId || '',
    active: initialData?.active ?? true,
    description: initialData?.description || '',
  });

  React.useEffect(() => {
    async function loadLookups() {
      try {
        const [catRes, taxRes] = await Promise.all([
          api.get('/categories'),
          api.get('/tax-rates')
        ]);
        setCategories(catRes.data);
        setTaxRates(taxRes.data);
        
        // Auto-select first if new form
        if (!initialData) {
           setFormData(f => ({
             ...f,
             categoryId: catRes.data[0]?.id || '',
             taxRateId: taxRes.data[0]?.id || ''
           }));
        }
      } catch (err: any) {
        setError('Failed to load form lookup data.');
      }
    }
    loadLookups();
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Transform number bounds dynamically
    const payload = {
      ...formData,
      sellingPrice: Number(formData.sellingPrice),
      active: String(formData.active) === 'true' || formData.active === true
    };

    try {
      if (initialData?.id) {
        await api.put(`/products/${initialData.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium border border-red-100">
          {error}
        </div>
      )}
      
      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Stock Keeping Unit (SKU) <span className="text-red-500">*</span></label>
                <Input 
                name="sku" 
                value={formData.sku} 
                onChange={handleChange} 
                placeholder="PROD-1029" 
                required 
                autoFocus 
                />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Product Name <span className="text-red-500">*</span></label>
                <Input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Wireless Mouse" 
                required 
                />
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Category <span className="text-red-500">*</span></label>
            <Select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                <option value="" disabled>Select Category</option>
                {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </Select>
            </div>
            
            <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Unit of Measure <span className="text-red-500">*</span></label>
            <Select name="unit" value={formData.unit} onChange={handleChange} required>
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="hr">Hours (hr)</option>
                <option value="box">Box</option>
            </Select>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Selling Price <span className="text-red-500">*</span></label>
            <Input 
                type="number"
                step="0.01"
                min="0"
                name="sellingPrice" 
                value={formData.sellingPrice} 
                onChange={handleChange} 
                placeholder="0.00"
                required
            />
            </div>
            
            <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Tax Rate <span className="text-red-500">*</span></label>
            <Select name="taxRateId" value={formData.taxRateId} onChange={handleChange} required>
                <option value="" disabled>Select Tax Rate</option>
                {taxRates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
                ))}
            </Select>
            </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Status</label>
          <Select name="active" value={String(formData.active)} onChange={handleChange}>
            <option value="true">Active (Visible)</option>
            <option value="false">Inactive (Hidden)</option>
          </Select>
        </div>
        
        <div className="space-y-1.5 pt-2">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add internal or catalog details..."
            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]" disabled={loading || !formData.categoryId || !formData.taxRateId}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? 'Save Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
