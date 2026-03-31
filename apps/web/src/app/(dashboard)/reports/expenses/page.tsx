'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badge';
import { ReportFilterBar, SummaryCardRow, ReportEmpty, ReportTable } from '../ReportComponents';
import { buildReportParams, fmtCurrency, getDefaultDates } from '../report-utils';
import { format } from 'date-fns';

export default function ExpenseReportPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = React.useState(defaults.start);
  const [endDate, setEndDate] = React.useState(defaults.end);
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async (s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/expenses?${buildReportParams(s, e)}`);
      setData(res.data);
    } catch { } finally { setLoading(false); }
  }, [startDate, endDate]);

  React.useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <ReportFilterBar
        startDate={startDate} endDate={endDate}
        onStartChange={setStartDate} onEndChange={setEndDate}
        onApply={() => load(startDate, endDate)}
        loading={loading}
      />
      {data?.summary && (
        <SummaryCardRow cards={[
          { label: 'Total Expenses', value: fmtCurrency(data.summary.amount), highlight: true },
          { label: 'Records', value: String(data.total || 0) },
        ]} />
      )}
      {loading && !data && <LoadingState message="Loading expense data..." />}
      {data && data.data?.length === 0 && <ReportEmpty />}
      {data && data.data?.length > 0 && (
        <ReportTable cols={['Expense', 'Category', 'Vendor', 'Date', 'Status', 'Amount']}>
          {data.data.map((row: any) => (
            <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-bold text-slate-900">{row.expenseNumber}</td>
              <td className="px-5 py-3.5 text-right text-slate-600">{row.category?.name || '—'}</td>
              <td className="px-5 py-3.5 text-right text-slate-600">{row.vendor?.name || '—'}</td>
              <td className="px-5 py-3.5 text-right text-slate-500">{row.expenseDate ? format(new Date(row.expenseDate), 'MMM d, yyyy') : '—'}</td>
              <td className="px-5 py-3.5 text-right">
                {row.status === 'PAID'
                  ? <Badge variant="success">Paid</Badge>
                  : <Badge variant="warning">Unpaid</Badge>}
              </td>
              <td className="px-5 py-3.5 text-right font-extrabold text-orange-700">{fmtCurrency(row.amount)}</td>
            </tr>
          ))}
        </ReportTable>
      )}
    </div>
  );
}
