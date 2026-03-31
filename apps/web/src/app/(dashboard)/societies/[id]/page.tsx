'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Building2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/LoadingState';

export default function EditSocietyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const [name, setName] = React.useState('');
  const [area, setArea] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    async function fetchSociety() {
      try {
        const res = await api.get(`/societies/${params.id}`);
        setName(res.data.name);
        setArea(res.data.areaOrLocality || '');
        setIsActive(res.data.isActive);
      } catch (err: any) {
        setError('Failed to load society master data');
      } finally {
        setLoading(false);
      }
    }
    fetchSociety();
  }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.patch(`/societies/${params.id}`, {
        name,
        areaOrLocality: area || undefined,
        isActive
      });
      router.push('/societies');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update ledger');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you certain? Terminating this entity breaks linked legacy address records.')) return;
    try {
      await api.delete(`/societies/${params.id}`);
      router.push('/societies');
    } catch (err: any) {
      setError('Cannot eliminate entity: Address constraints blocking.');
    }
  };

  if (loading) return <LoadingState message="Fetching grid locus..." />;

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in-50 duration-500 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/societies" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Matrix
        </Link>
      </div>

      <PageHeader title="Configure Sector" description={`Master ID: #${params.id.slice(0,8).toUpperCase()}`}>
        <Button onClick={handleDelete} type="button" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
          <Trash2 className="w-4 h-4 mr-2" />
          Purge
        </Button>
        <Button disabled={saving || !name} type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 px-6 ml-2">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Overwriting...' : 'Force Overwrite'}
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
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Geo Locality</label>
            <Input 
              value={area} 
              onChange={(e) => setArea(e.target.value)} 
            />
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
