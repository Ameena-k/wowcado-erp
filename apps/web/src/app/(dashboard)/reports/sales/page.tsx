'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badge';
import { ReportFilterBar, SummaryCardRow, ReportEmpty, ReportTable } from '../ReportComponents';
import { buildReportParams, fmtCurrency, getDefaultDates } from '../report-utils';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SalesReportPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = React.useState(defaults.start);
  const [endDate, setEndDate] = React.useState(defaults.end);
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async (s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/sales?${buildReportParams(s, e)}`);
      setData(res.data);
    } catch { } finally { setLoading(false); }
  }, [startDate, endDate]);

  React.useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = data?.summary;

  const statusVariant: Record<string, any> = {
    DELIVERED: 'success', CONFIRMED: 'warning',
    PENDING: 'secondary', CANCELLED: 'destructive'
  };

  return (
    <div>
      <ReportFilterBar
        startDate={startDate} endDate={endDate}
        onStartChange={setStartDate} onEndChange={setEndDate}
        onApply={() => load(startDate, endDate)}
        loading={loading}
      />
      {summary && (
        <SummaryCardRow cards={[
          { label: 'Grand Total (Sales)', value: fmtCurrency(summary.grandTotal), highlight: true },
          { label: 'Subtotal', value: fmtCurrency(summary.subtotal) },
          { label: 'Tax Collected', value: fmtCurrency(summary.taxTotal) },
          { label: 'Orders', value: String(data.total || 0) },
        ]} />
      )}
      {loading && !data && <LoadingState message="Loading sales data..." />}
      {data && data.data?.length === 0 && <ReportEmpty />}
      {data && data.data?.length > 0 && (
        <ReportTable cols={['Order', 'Customer', 'Date', 'Status', 'Subtotal', 'Tax', 'Grand Total']}>
          {data.data.map((row: any) => (
            <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-5 py-3.5">
                <Link href={`/orders/${row.id}`} className="font-bold text-indigo-600 hover:underline">{row.orderNumber}</Link>
              </td>
              <td className="px-5 py-3.5 text-right text-slate-700 font-medium">{row.customer?.name || '—'}</td>
              <td className="px-5 py-3.5 text-right text-slate-500">{row.orderDate ? format(new Date(row.orderDate), 'MMM d, yyyy') : '—'}</td>
              <td className="px-5 py-3.5 text-right">
                <Badge variant={statusVariant[row.status] || 'secondary'}>{row.status}</Badge>
              </td>
              <td className="px-5 py-3.5 text-right font-medium text-slate-700">{fmtCurrency(row.subtotal)}</td>
              <td className="px-5 py-3.5 text-right text-slate-500">{fmtCurrency(row.taxTotal)}</td>
              <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">{fmtCurrency(row.grandTotal)}</td>
            </tr>
          ))}
        </ReportTable>
      )}
    </div>
  );
}
