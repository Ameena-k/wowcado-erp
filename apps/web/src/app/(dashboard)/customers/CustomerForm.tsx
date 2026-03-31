'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Loader2, User, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api-client';

interface CustomerFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMPTY_ADDRESS = {
  societyId: '',
  blockOrStreet: '',
  doorNo: '',
  landmark: '',
};

export function CustomerForm({ initialData, onSuccess, onCancel }: CustomerFormProps) {
  const isEditing = !!initialData?.id;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [societies, setSocieties] = React.useState<any[]>([]);

  const [customer, setCustomer] = React.useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    notes: initialData?.notes || '',
    status: initialData?.status || 'ACTIVE',
  });

  const [address, setAddress] = React.useState({ ...EMPTY_ADDRESS });

  // Load societies for the address picker when creating
  React.useEffect(() => {
    if (!isEditing) {
      api.get('/societies?active=true')
        .then(res => setSocieties(Array.isArray(res.data) ? res.data : []))
        .catch(() => setSocieties([]));
    }
  }, [isEditing]);



  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        // Edit mode — customer fields only, address is managed from the detail page
        await api.put(`/customers/${initialData.id}`, {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || undefined,
          notes: customer.notes || undefined,
          status: customer.status,
        });
      } else {
        // Create mode — send customer + address in one atomic request
        if (!address.societyId) {
          setError('Please select a Society / Apartment for the delivery address.');
          setLoading(false);
          return;
        }
        await api.post('/customers', {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || undefined,
          notes: customer.notes || undefined,
          status: customer.status,
          defaultAddress: {
            societyId: address.societyId,
            blockOrStreet: address.blockOrStreet,
            doorNo: address.doorNo,
            recipientName: customer.name,
            phone: customer.phone,
            landmark: address.landmark || undefined,
          },
        });
      }
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to save customer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {error && (
        <div className="mx-0 mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 space-y-0 overflow-y-auto">
        {/* ── Section 1: Customer Info ─────────────────────────────── */}
        <div className="pb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">Customer Information</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                value={customer.name}
                onChange={handleCustomerChange}
                placeholder="e.g. Priya Sharma"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Phone <span className="text-red-500">*</span>
              </label>
              <Input
                name="phone"
                value={customer.phone}
                onChange={handleCustomerChange}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <Input
                type="email"
                name="email"
                value={customer.email}
                onChange={handleCustomerChange}
                placeholder="priya@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Account Status</label>
              <Select name="status" value={customer.status} onChange={handleCustomerChange}>
                <option value="ACTIVE">Active (Default)</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Internal Notes</label>
              <textarea
                name="notes"
                value={customer.notes}
                onChange={handleCustomerChange}
                placeholder="Any special instructions or notes..."
                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Default Delivery Address (create only) ─────── */}
        {!isEditing && (
          <div className="pt-5 border-t border-dashed border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">Default Delivery Address</span>
              </div>
              <span className="ml-auto text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Required</span>
            </div>

            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3.5">
              {/* Society */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  <Building2 className="inline w-3.5 h-3.5 mr-1 text-indigo-500" />
                  Society / Apartment <span className="text-red-500">*</span>
                </label>
                {societies.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                    <span>No active societies found. Please add a society first.</span>
                  </div>
                ) : (
                  <Select name="societyId" value={address.societyId} onChange={handleAddressChange} required>
                    <option value="" disabled>Select community / society...</option>
                    {societies.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.areaOrLocality ? ` — ${s.areaOrLocality}` : ''}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Block / Floor + Door / Flat No */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Block / Floor <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="blockOrStreet"
                    value={address.blockOrStreet}
                    onChange={handleAddressChange}
                    placeholder="e.g. Block A"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Door / Flat No <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="doorNo"
                    value={address.doorNo}
                    onChange={handleAddressChange}
                    placeholder="e.g. 4B"
                    required
                  />
                </div>
              </div>



              {/* Landmark */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Landmark <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <Input
                  name="landmark"
                  value={address.landmark}
                  onChange={handleAddressChange}
                  placeholder="e.g. Near swimming pool"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              This address will be marked as default and used in orders immediately.
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 shrink-0">
        <div>
           {isEditing && (
             <Button
               type="button"
               variant="outline"
               className="text-red-600 border-red-200 hover:bg-red-50"
               onClick={async () => {
                 if (confirm('Are you strictly sure you want to delete this customer? This cannot be undone.')) {
                   setLoading(true);
                   try {
                     await api.delete(`/customers/${initialData.id}`);
                     onSuccess();
                   } catch (err: any) {
                     const msg = err.response?.data?.message || 'Failed to delete';
                     setError(msg);
                     setLoading(false);
                   }
                 }
               }}
               disabled={loading}
             >
               Delete
             </Button>
           )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[130px]"
            disabled={loading}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : isEditing
                ? 'Save Changes'
                : 'Create Customer'
            }
          </Button>
        </div>
      </div>
    </form>
  );
}
