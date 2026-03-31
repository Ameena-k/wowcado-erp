'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Banknote, Briefcase, Activity, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface DashboardData {
  metrics: {
    totalSales: number;
    totalCollections: number;
    outstandingReceivables: number;
    outstandingPayables: number;
    totalExpenses: number;
    invoiceCount: {
      total: number;
      paid: number;
      unpaidOrPartial: number;
    };
  };
  recentTransactions: Array<{
    type: string;
    refId: string;
    refNumber: string;
    entryDate: string;
    amount: number;
    status: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function loadData() {
      try {
        const response = await api.get('/dashboard/summary');
        setData(response.data);
      } catch (err: any) {
        setError('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard metrics..." />;
  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!data) return null;

  const { metrics, recentTransactions } = data;

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  const getStatusBadgeVariant = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'COMPLETED' || s === 'PAID') return 'success';
    if (s === 'PENDING' || s === 'ISSUED' || s === 'PARTIALLY_PAID') return 'secondary';
    if (s === 'CANCELLED' || s === 'VOIDED' || s === 'FAILED') return 'destructive';
    return 'default';
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700 pb-10">
      <PageHeader title="Overview" description="Real-time performance metrics and operations snapshot.">
        <Link href="/invoices/create" className="hidden sm:inline-flex">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 px-6">
            New Invoice
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          title="Gross Sales" 
          value={formatCurrency(metrics.totalSales)} 
          icon={<Banknote className="h-6 w-6" />} 
        />
        <StatCard 
          title="Collections Active" 
          value={formatCurrency(metrics.totalCollections)} 
          icon={<CreditCard className="h-6 w-6" />} 
        />
        <StatCard 
          title="Accounts Receivable" 
          value={formatCurrency(metrics.outstandingReceivables)} 
          icon={<Activity className="h-6 w-6" />} 
        />
        <StatCard 
          title="Opex Generated" 
          value={formatCurrency(metrics.totalExpenses)} 
          icon={<Briefcase className="h-6 w-6" />} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="flex items-center text-slate-800">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
               Receivables Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center p-8">
             <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <span className="text-base font-medium text-slate-600">Total Issued Volumes</span>
                 <span className="text-xl font-bold text-slate-900">{metrics.invoiceCount.total}</span>
               </div>
               <div className="h-px bg-slate-200/60" />
               <div className="flex items-center justify-between">
                 <span className="text-base font-medium text-slate-600">Fully Paid</span>
                 <span className="text-xl font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                    {metrics.invoiceCount.paid}
                 </span>
               </div>
               <div className="h-px bg-slate-200/60" />
               <div className="flex items-center justify-between">
                 <span className="text-base font-medium text-slate-600">Unpaid Tracker</span>
                 <span className="text-xl font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                    {metrics.invoiceCount.unpaidOrPartial}
                 </span>
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="flex items-center text-slate-800">
               <AlertCircle className="w-5 h-5 text-indigo-500 mr-2" />
               Payables Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center p-8">
             <div className="space-y-6">
               <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                 <span className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Total Outstanding Obligations</span>
                 <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {formatCurrency(metrics.outstandingPayables)}
                 </span>
               </div>
               <p className="text-center text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Real-time sync matching native supplier ledger bounds securely representing immediate AP.
               </p>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Live Timeline</h2>
            <Link href="/reports" className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
               View Full Daybook <ArrowUpRight className="ml-1 w-4 h-4" />
            </Link>
        </div>
        
        {recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-base text-slate-500 border border-dashed rounded-2xl bg-white">No active transactions flowing yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Ledger Pipeline</TableHead>
                <TableHead className="text-right">Total Flow</TableHead>
                <TableHead className="text-center">Status Matrix</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx, idx) => (
                <TableRow key={`${tx.refId}-${idx}`}>
                  <TableCell className="text-slate-500 font-medium whitespace-nowrap">
                      {format(new Date(tx.entryDate), 'dd MMM yyyy, HH:mm')}
                  </TableCell>
                  <TableCell>
                      <span className="font-semibold text-slate-800">{tx.refNumber}</span>
                  </TableCell>
                  <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px] tracking-wider uppercase text-slate-500 bg-slate-50">
                        {tx.type.replace('_', ' ')}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                      {tx.amount > 0 ? (
                         <span className="font-bold text-slate-900">{formatCurrency(tx.amount)}</span>
                      ) : (
                         <span className="text-slate-400">-</span>
                      )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(tx.status)}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      
    </div>
  );
}
