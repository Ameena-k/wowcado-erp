'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MessageSquare, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface WhatsAppLogsCardProps {
  linkedEntityType: 'ORDER' | 'INVOICE' | 'PAYMENT';
  linkedEntityId: string;
}

export function WhatsAppLogsCard({ linkedEntityType, linkedEntityId }: WhatsAppLogsCardProps) {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/whatsapp/logs?linkedEntityType=${linkedEntityType}&linkedEntityId=${linkedEntityId}`);
      setLogs(res.data.data || []);
      setError('');
    } catch (err: any) {
      setError('Unable to fetch WhatsApp delivery history.');
    } finally {
      setLoading(false);
    }
  }, [linkedEntityType, linkedEntityId]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SIMULATED': return <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50"><ShieldCheck className="w-3 h-3 mr-1" /> SIMULATED DEV</Badge>;
      case 'SENT': return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> SENT NATIVELY</Badge>;
      case 'DELIVERED': return <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-300">DELIVERED</Badge>;
      case 'FAILED': return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> FAILED</Badge>;
      case 'QUEUED': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> QUEUED</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="border-t-4 border-t-green-500 overflow-hidden shadow-sm">
      <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center">
          <MessageSquare className="w-4 h-4 mr-2 text-green-500" /> WhatsApp Delivery Log
        </CardTitle>
        <button 
          onClick={fetchLogs} 
          disabled={loading}
          className="text-slate-400 hover:text-green-600 transition-colors focus:outline-none"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-500' : ''}`} />
        </button>
      </CardHeader>
      <CardContent className="p-0">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-300 mx-auto mb-2" />
            Syncing timeline natively...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-rose-500 font-medium">
            <AlertTriangle className="w-5 h-5 text-rose-400 mx-auto mb-2" />
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/30">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-100">
              <MessageSquare className="w-5 h-5 text-green-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Messages Logged</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto text-balance">
              No WhatsApp triggers have fired for this structured entity yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto w-full no-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(log.status)}
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">{log.templateName}</span>
                  </div>
                  <time className="text-xs font-semibold text-slate-500 tabular-nums">
                    {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                  </time>
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900 block mb-0.5">Target: +{log.phone}</span>
                </div>
                {log.status === 'FAILED' && log.errorReason && (
                    <div className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-md font-medium leading-relaxed">
                        Reason: {log.errorReason}
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
