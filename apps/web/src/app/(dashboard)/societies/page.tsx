'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function SocietiesPage() {
  const [societies, setSocieties] = React.useState<any[]>([]);
  const [filtered, setFiltered] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    async function fetchSocieties() {
      try {
        const res = await api.get('/societies');
        setSocieties(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSocieties();
  }, []);

  React.useEffect(() => {
    if (!search) {
      setFiltered(societies);
    } else {
      const lower = search.toLowerCase();
      setFiltered(societies.filter(s => 
        s.name.toLowerCase().includes(lower) || 
        (s.areaOrLocality && s.areaOrLocality.toLowerCase().includes(lower))
      ));
    }
  }, [search, societies]);

  const toggleStatus = async (society: any) => {
    try {
      const newStatus = !society.isActive;
      await api.patch(`/societies/${society.id}`, { isActive: newStatus });
      setSocieties(societies.map(s => s.id === society.id ? { ...s, isActive: newStatus } : s));
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader title="Community & Society Master" description="Manage serviced apartment complexes and localities.">
        <Link href="/societies/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
            <Plus className="w-4 h-4 mr-2" /> Add Society
          </Button>
        </Link>
      </PageHeader>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search complexes passing substring..." 
              className="pl-9 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            {filtered.length} Locations Mastered
          </div>
        </div>

        {loading ? (
          <div className="py-12"><LoadingState message="Loading societies matrix..." /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              title="No Master Found" 
              description="Upload or seed internal societies to unlock fulfillment options." 
            />
            <div className="flex justify-center mt-4">
              <Link href="/societies/create"><Button variant="outline">Create New</Button></Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left align-middle">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Complex Identity</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Geo Locality</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(society => (
                  <tr key={society.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-500 shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{society.name}</span>
                          <span className="text-xs font-mono text-slate-400 mt-0.5">#{society.id.slice(0,8).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                        {society.areaOrLocality || 'Not Mapped'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleStatus(society)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all hover:scale-105" style={{ backgroundColor: society.isActive ? '#dcfce7' : '#f1f5f9', color: society.isActive ? '#166534' : '#64748b' }}>
                        {society.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {society.isActive ? 'Active' : 'Halted'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link href={`/societies/${society.id}`}>
                         <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Manage</Button>
                       </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
