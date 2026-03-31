'use client';

import * as React from 'react';
import api from '@/lib/api-client';
import { LoadingState } from '@/components/ui/LoadingState';
import { SummaryCardRow, ReportEmpty, ReportTable } from '../ReportComponents';
import { fmtCurrency } from '../report-utils';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function VendorPayableReportPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/reports/vendor-payable?page=1&limit=100')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPayable = data?.summary?.totalPayable || 0;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-4 py-3 mb-5">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        This report shows the current outstanding balance per vendor across all open supplier bills.
      </div>

      {data && (
        <SummaryCardRow cards={[
          { label: 'Total AP Payable', value: fmtCurrency(totalPayable), highlight: true },
          { label: 'Vendors with Balance', value: String(data.total || 0) },
          { label: 'Avg. Balance', value: data.total ? fmtCurrency(totalPayable / data.total) : '—' },
        ]} />
      )}

      {loading && <LoadingState message="Loading AP payable data..." />}
      {data && data.data?.length === 0 && <ReportEmpty message="All vendor accounts are settled." />}
      {data && data.data?.length > 0 && (
        <ReportTable cols={['Vendor', 'Open Bills', 'Total Billed', 'Balance Due']}>
          {data.data
            .sort((a: any, b: any) => Number(b.balanceDue) - Number(a.balanceDue))
            .map((row: any) => (
              <tr key={row.vendorId} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-5 py-4">
                  <span className="font-bold text-slate-800 text-base">{row.vendorName || 'Unknown'}</span>
                </td>
                <td className="px-5 py-4 text-right text-slate-600 font-medium">{row.billCount}</td>
                <td className="px-5 py-4 text-right font-medium text-slate-700">{fmtCurrency(row.totalBilled)}</td>
                <td className="px-5 py-4 text-right">
                  <span className="inline-block bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 rounded-lg font-extrabold text-sm">
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
