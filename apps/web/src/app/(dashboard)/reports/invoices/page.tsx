'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badge';
import { ReportFilterBar, SummaryCardRow, ReportEmpty, ReportTable } from '../ReportComponents';
import { buildReportParams, fmtCurrency, getDefaultDates } from '../report-utils';
import { format } from 'date-fns';
import Link from 'next/link';

function InvoiceStatusBadge({ status }: { status: string }) {
  if (status === 'PAID') return <Badge variant="success">Paid</Badge>;
  if (status === 'PARTIALLY_PAID') return <Badge variant="warning">Partial</Badge>;
  if (status === 'ISSUED') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Issued</Badge>;
  if (status === 'DRAFT') return <Badge variant="secondary">Draft</Badge>;
  return <Badge variant="destructive">{status}</Badge>;
}

export default function InvoicesReportPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = React.useState(defaults.start);
  const [endDate, setEndDate] = React.useState(defaults.end);
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async (s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/invoices?${buildReportParams(s, e)}`);
      setData(res.data);
    } catch { } finally { setLoading(false); }
  }, [startDate, endDate]);

  React.useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const s = data?.summary;

  return (
    <div>
      <ReportFilterBar
        startDate={startDate} endDate={endDate}
        onStartChange={setStartDate} onEndChange={setEndDate}
        onApply={() => load(startDate, endDate)}
        loading={loading}
      />
      {s && (
        <SummaryCardRow cards={[
          { label: 'Total Invoiced', value: fmtCurrency(s.grandTotal), highlight: true },
          { label: 'Collected', value: fmtCurrency(s.paidAmount) },
          { label: 'Outstanding', value: fmtCurrency(s.balanceDue) },
          { label: 'Invoices', value: String(data.total || 0) },
        ]} />
      )}
      {loading && !data && <LoadingState message="Loading invoice data..." />}
      {data && data.data?.length === 0 && <ReportEmpty />}
      {data && data.data?.length > 0 && (
        <ReportTable cols={['Invoice', 'Customer', 'Date', 'Status', 'Total', 'Paid', 'Balance Due']}>
          {data.data.map((row: any) => (
            <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-5 py-3.5">
                <Link href={`/invoices/${row.id}`} className="font-bold text-indigo-600 hover:underline">{row.invoiceNumber}</Link>
              </td>
              <td className="px-5 py-3.5 text-right font-medium text-slate-700">{row.customer?.name || '—'}</td>
              <td className="px-5 py-3.5 text-right text-slate-500">{row.invoiceDate ? format(new Date(row.invoiceDate), 'MMM d, yyyy') : '—'}</td>
              <td className="px-5 py-3.5 text-right"><InvoiceStatusBadge status={row.status} /></td>
              <td className="px-5 py-3.5 text-right font-bold text-slate-900">{fmtCurrency(row.grandTotal)}</td>
              <td className="px-5 py-3.5 text-right font-medium text-emerald-600">{fmtCurrency(row.paidAmount)}</td>
              <td className={`px-5 py-3.5 text-right font-extrabold ${Number(row.balanceDue) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {Number(row.balanceDue) > 0 ? fmtCurrency(row.balanceDue) : 'Settled'}
              </td>
            </tr>
          ))}
        </ReportTable>
      )}
    </div>
  );
}
