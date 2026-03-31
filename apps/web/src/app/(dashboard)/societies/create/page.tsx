'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateSocietyPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const [name, setName] = React.useState('');
  const [area, setArea] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/societies', {
        name,
        areaOrLocality: area || undefined,
        isActive
      });
      router.push('/societies');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create society record');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in-50 duration-500 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/societies" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Matrix
        </Link>
      </div>

      <PageHeader title="Onboard Community" description="Map a new fulfillment node into the system ledger.">
        <Button disabled={loading || !name} type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-6">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Committing...' : 'Commit Block'}
        </Button>
      </PageHeader>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center">
          {error}
        </div>
      )}

      <Card className="border-t-4 border-t-indigo-500">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-indigo-500" /> Structure Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Complex Name <span className="text-red-500">*</span></label>
            <Input 
              placeholder="e.g. Brigade Metropolis" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Geo Locality</label>
            <Input 
              placeholder="e.g. Mahadevapura" 
              value={area} 
              onChange={(e) => setArea(e.target.value)} 
            />
            <p className="text-[11px] text-slate-400 font-medium">Optional grouping namespace for delivery zones.</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <div 
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative ${isActive ? 'bg-indigo-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Operational Active</p>
              <p className="text-xs text-slate-500 mt-0.5">Toggle fulfillment visibility</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
