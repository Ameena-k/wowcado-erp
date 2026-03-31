'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { MessageSquare, RefreshCw, AlertTriangle, Search, CheckCircle2, ShieldCheck, Clock, FileText, ShoppingCart, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { getUserRole } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function WhatsAppLogsPage() {
  const router = useRouter();
  
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // Role-based access check
    const role = getUserRole();
    if (!role || !['ADMIN', 'ACCOUNTANT'].includes(role)) {
      router.replace('/dashboard');
      return;
    }
    
    async function fetchLogs() {
      try {
        const res = await api.get('/whatsapp/logs');
        setLogs(res.data.data || []);
      } catch (err: any) {
        setError('Failed to fetch global WhatsApp logs.');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SIMULATED': return <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50"><ShieldCheck className="w-3 h-3 mr-1" /> SIMULATED DEV</Badge>;
      case 'SENT': return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> SENT</Badge>;
      case 'DELIVERED': return <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-300">DELIVERED</Badge>;
      case 'FAILED': return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> FAILED</Badge>;
      case 'QUEUED': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> QUEUED</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEntityLink = (type: string, id: string) => {
    if (type === 'ORDER') return <Link href={`/orders/${id}`} className="text-indigo-600 hover:underline flex items-center font-semibold text-xs uppercase tracking-wider"><ShoppingCart className="w-3.5 h-3.5 mr-1 text-slate-400" /> ORDER LINK</Link>;
    if (type === 'INVOICE') return <Link href={`/invoices/${id}`} className="text-indigo-600 hover:underline flex items-center font-semibold text-xs uppercase tracking-wider"><FileText className="w-3.5 h-3.5 mr-1 text-slate-400" /> INVOICE LINK</Link>;
    if (type === 'PAYMENT') return <Link href={`/payments/${id}`} className="text-indigo-600 hover:underline flex items-center font-semibold text-xs uppercase tracking-wider"><CreditCard className="w-3.5 h-3.5 mr-1 text-slate-400" /> PAYMENT LINK</Link>;
    return <span className="text-slate-400 text-xs">Unlinked</span>;
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
        const res = await api.get('/whatsapp/logs');
        setLogs(res.data.data || []);
    } catch {
        setError('Refresh failed');
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Fetching global message logs..." />;
  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-10">
      <PageHeader title="WhatsApp Integration Logs" description="Global audit trail of all conversational notifications executed.">
        <Button variant="outline" onClick={handleRefresh} className="ml-auto flex items-center">
            <RefreshCw className="w-4 h-4 mr-2 text-slate-500" /> Refresh Queue
        </Button>
      </PageHeader>

      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-middle mb-0">
             <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
               <tr>
                 <th className="px-6 py-4 font-semibold">Message Timestamp</th>
                 <th className="px-6 py-4 font-semibold">Recipient Client</th>
                 <th className="px-6 py-4 font-semibold">Template Engine</th>
                 <th className="px-6 py-4 font-semibold">Tracing Entity</th>
                 <th className="px-6 py-4 font-semibold text-right">Delivery Status</th>
               </tr>
             </thead>
             <tbody>
               {logs.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-10 text-center text-slate-500">
                       <MessageSquare className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                       No WhatsApp dispatches recorded yet.
                   </td>
                 </tr>
               ) : (
                 logs.map((log) => (
                   <React.Fragment key={log.id}>
                     <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className="font-semibold text-slate-700">{format(new Date(log.createdAt), 'MMM d, yyyy')}</span>
                         <span className="block text-slate-500 text-xs mt-0.5">{format(new Date(log.createdAt), 'h:mm a')}</span>
                       </td>
                       <td className="px-6 py-4">
                         <span className="font-semibold text-slate-900 block">{log.customer?.name || 'Unknown Entity'}</span>
                         <span className="font-mono text-[11px] text-slate-500 tracking-widest">{log.phone}</span>
                       </td>
                       <td className="px-6 py-4">
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{log.templateName}</span>
                       </td>
                       <td className="px-6 py-4">
                         {getEntityLink(log.linkedEntityType, log.linkedEntityId)}
                       </td>
                       <td className="px-6 py-4 text-right">
                         {getStatusBadge(log.status)}
                       </td>
                     </tr>
                     {log.status === 'FAILED' && log.errorReason && (
                         <tr className="bg-red-50/20 border-b border-slate-100">
                             <td colSpan={5} className="px-6 py-3 text-xs text-red-600 font-medium tracking-wide">
                                 <AlertTriangle className="w-3 h-3 inline mr-1 text-red-500" /> Dispatch Refused: {log.errorReason}
                             </td>
                         </tr>
                     )}
                   </React.Fragment>
                 ))
               )}
             </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
