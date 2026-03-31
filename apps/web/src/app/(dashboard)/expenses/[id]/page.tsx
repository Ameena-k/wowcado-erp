'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ArrowLeft, User, RefreshCw, FileText, CheckCircle2, ShieldAlert, Loader2, CreditCard, Tag } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [expense, setExpense] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  const [posting, setPosting] = React.useState(false);

  React.useEffect(() => {
    async function fetchExpense() {
      try {
        const res = await api.get(`/expenses/${params.id}`);
        setExpense(res.data);
      } catch (err: any) {
        setError('Expense Record not found natively.');
      } finally {
        setLoading(false);
      }
    }
    fetchExpense();
  }, [params.id]);

  if (loading) return <LoadingState message="Verifying financial ledger..." />;
  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!expense) return null;

  const handlePostExpense = async () => {
     setPosting(true);
     try {
         await api.patch(`/expenses/${expense.id}/status`, { status: 'PAID' });
         const updated = await api.get(`/expenses/${expense.id}`);
         setExpense(updated.data);
     } catch (err: any) {
         alert(err.response?.data?.message || 'Failed to post expense to ledger.');
     } finally {
         setPosting(false);
     }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val));
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return <Badge variant="success">Paid in Full</Badge>;
    if (status === 'UNPAID') return <Badge variant="warning">Unpaid (Posted)</Badge>;
    if (status === 'CANCELLED') return <Badge variant="destructive">Voided</Badge>;
    if (status === 'DRAFT') return <Badge variant="outline" className="border-slate-300 text-slate-600 bg-slate-50">Draft (Unposted)</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/expenses" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Expenses
        </Link>
      </div>

      <PageHeader title={`Expense ${expense.expenseNumber}`} description={`Registered natively on ${format(new Date(expense.expenseDate), 'MMM d, yyyy')}`}>
        <div className="mr-auto">
            {getStatusBadge(expense.status)}
        </div>
        
        {expense.status === 'DRAFT' && (
           <Button onClick={handlePostExpense} disabled={posting} className="bg-blue-600 hover:bg-blue-700 shadow-md text-white border-transparent">
               {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
               Post to Ledger
           </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-t-4 border-t-rose-500">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
                    <CardTitle className="text-sm uppercase text-slate-500 font-bold flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-rose-500" /> Expense Category
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                    <p className="font-bold text-slate-900 tracking-tight text-lg">{expense.category?.name}</p>
                    <p className="text-sm text-slate-600 font-medium">{expense.category?.description || 'Operational Overhead'}</p>
                    {expense.vendor && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Associated Vendor</span>
                            <span className="text-sm font-semibold text-slate-800">{expense.vendor.name}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-white border-slate-200/50 shadow-sm">
              <CardContent className="p-5">
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Amount</p>
                   <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(expense.amount)}</p>
                   {expense.paidImmediately && (
                       <p className="text-xs text-emerald-600 font-medium mt-2 pt-2 border-t border-slate-100 flex items-center">
                           <CheckCircle2 className="w-3 h-3 mr-1" /> Paid Immediately
                       </p>
                   )}
              </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
            {expense.status === 'DRAFT' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-800">Draft Status Active</h4>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                             This expense is currently unposted. Clicking <b>Post to Ledger</b> will log this operational expense natively into the <b>PostingEngine</b>!
                        </p>
                    </div>
                </div>
            )}

            <Card className="overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">Operational Notes</h3>
                    <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                        {expense.notes || 'No extended notes provided for this transaction.'}
                    </p>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
