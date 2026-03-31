'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { LoadingState } from '@/components/ui/LoadingState';
import { Select } from '@/components/ui/Select';
import { ReportFilterBar, SummaryCardRow, ReportEmpty } from '../ReportComponents';
import { buildReportParams, fmtCurrency, getDefaultDates } from '../report-utils';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function LedgerReportPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [accountId, setAccountId] = React.useState('');
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    api.get('/accounts').then(r => {
      const list = Array.isArray(r.data) ? r.data : (r.data.data || []);
      setAccounts(list);
    }).catch(() => {});
  }, []);

  const load = async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const res = await api.get(`/reports/ledger/${accountId}?${buildReportParams(startDate, endDate)}`);
      setData(res.data);
    } catch { } finally { setLoading(false); }
  };

  const sum = data?.summary;

  return (
    <div>
      <ReportFilterBar
        startDate={startDate} endDate={endDate}
        onStartChange={setStartDate} onEndChange={setEndDate}
        onApply={load}
        loading={loading}
        extraFilters={
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Account <span className="text-red-500">*</span></label>
            <Select value={accountId} onChange={(e: any) => setAccountId(e.target.value)} className="h-9 text-sm min-w-[220px]">
              <option value="">— Select Account —</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </Select>
          </div>
        }
      />

      {!accountId && (
        <div className="py-16 text-center">
          <p className="text-slate-400 font-medium text-sm">Select an account to view its ledger entries.</p>
        </div>
      )}

      {sum && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-lg font-extrabold text-slate-900">{data.account?.name}</span>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wider">{data.account?.type}</span>
          </div>
          <SummaryCardRow cards={[
            { label: 'Total Debits', value: fmtCurrency(sum.totalDebits) },
            { label: 'Total Credits', value: fmtCurrency(sum.totalCredits) },
            { label: 'Ending Balance', value: fmtCurrency(sum.endingBalance), highlight: true },
          ]} />
        </>
      )}

      {loading && <LoadingState message="Loading ledger entries..." />}
      {data && data.data?.length === 0 && <ReportEmpty message="No ledger entries found for this account and period." />}

      {data && data.data?.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-left font-semibold">Reference</th>
                <th className="px-5 py-3 text-right font-semibold text-emerald-700">Debit</th>
                <th className="px-5 py-3 text-right font-semibold text-rose-700">Credit</th>
                <th className="px-5 py-3 text-right font-semibold">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((line: any, idx: number) => {
                const dr = Number(line.debitAmount);
                const cr = Number(line.creditAmount);
                const balance = Number(line.runningBalance);
                const isPositive = balance >= 0;
                return (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 text-slate-500">
                      {line.journalEntry?.entryDate
                        ? format(new Date(line.journalEntry.entryDate), 'MMM d, yyyy')
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-slate-800">{line.journalEntry?.journalNumber || '—'}</p>
                        <p className="text-xs text-slate-400">{line.description || ''}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-700">
                      {dr > 0 ? fmtCurrency(dr) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-rose-600">
                      {cr > 0 ? fmtCurrency(cr) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 font-extrabold ${isPositive ? 'text-slate-900' : 'text-rose-600'}`}>
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                        {fmtCurrency(Math.abs(balance))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
