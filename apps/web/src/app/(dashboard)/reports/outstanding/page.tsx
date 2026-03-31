'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { LoadingState } from '@/components/ui/LoadingState';
import { SummaryCardRow, ReportEmpty, ReportTable } from '../ReportComponents';
import { fmtCurrency } from '../report-utils';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CustomerOutstandingPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/reports/customer-outstanding?page=1&limit=100')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = data?.summary?.totalOutstanding || 0;

  return (
    <div>
      {/* Info banner - no date filter for outstanding (it's a snapshot) */}
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-5">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        This report shows the current outstanding balance per customer across all open invoices.
      </div>

      {data && (
        <SummaryCardRow cards={[
          { label: 'Total AR Outstanding', value: fmtCurrency(totalOutstanding), highlight: true },
          { label: 'Customers with Balance', value: String(data.total || 0) },
          { label: 'Avg. Balance', value: data.total ? fmtCurrency(totalOutstanding / data.total) : '—' },
        ]} />
      )}

      {loading && <LoadingState message="Loading AR outstanding..." />}
      {data && data.data?.length === 0 && <ReportEmpty message="All accounts are settled. No outstanding balances." />}
      {data && data.data?.length > 0 && (
        <ReportTable cols={['Customer', 'Open Invoices', 'Total Invoiced', 'Balance Due']}>
          {data.data
            .sort((a: any, b: any) => Number(b.balanceDue) - Number(a.balanceDue))
            .map((row: any) => (
              <tr key={row.customerId} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-5 py-4">
                  <Link href={`/customers/${row.customerId}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors text-base">
                    {row.customerName || 'Unknown'}
                  </Link>
                </td>
                <td className="px-5 py-4 text-right text-slate-600 font-medium">{row.invoiceCount}</td>
                <td className="px-5 py-4 text-right font-medium text-slate-700">{fmtCurrency(row.totalInvoiced)}</td>
                <td className="px-5 py-4 text-right">
                  <span className="inline-block bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1 rounded-lg font-extrabold text-sm">
                    {fmtCurrency(row.balanceDue)}
                  </span>
                </td>
              </tr>
            ))}
        </ReportTable>
      )}
    </div>
  );
}
