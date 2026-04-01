'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  FileText,
  IndianRupee,
} from 'lucide-react';
import api from '@/lib/api-client';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

interface Gstr3bData {
  period: { month: number; year: number };
  companyGstin: string;
  companyState: string;
  outwardSupplies: { taxableValue: number; igst: number; cgst: number; sgst: number };
  reverseCharge: { taxableValue: number; igst: number; cgst: number; sgst: number };
  exemptSupplies: number;
  itc: { igst: number; cgst: number; sgst: number };
  exemptPurchases: number;
  netTaxPayable: { igst: number; cgst: number; sgst: number; total: number };
  meta: { totalInvoices: number; totalBills: number; rcBillCount: number; itcBillCount: number };
}

export default function Gstr3bSummaryPage() {
  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [data, setData] = React.useState<Gstr3bData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showMonthPicker, setShowMonthPicker] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/gst/gstr3b?month=${month}&year=${year}`);
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to generate GSTR-3B summary.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="flex h-full flex-col bg-slate-50/50 -m-6 p-0 min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/gst-filing" className="text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">GSTR-3B Summary</h1>
              <p className="text-sm text-slate-500 mt-0.5">Monthly Summary Return</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Month Picker */}
            <div className="relative">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                {periodLabel}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showMonthPicker && (
                <div className="absolute right-0 top-12 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/50 p-4 w-[320px]">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setYear(y => y - 1)} className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100">← {year - 1}</button>
                    <span className="text-sm font-bold text-slate-800">{year}</span>
                    <button onClick={() => setYear(y => y + 1)} className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100">{year + 1} →</button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => { setMonth(i + 1); setShowMonthPicker(false); }}
                        className={`text-xs font-medium rounded-lg py-2.5 transition-all ${
                          month === i + 1
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {m.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={fetchData}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium h-10 px-5 rounded-lg shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Generate Summary
            </Button>

            <Button
              disabled
              className="bg-slate-100 text-slate-400 text-sm font-medium h-10 px-5 rounded-lg border border-slate-200 cursor-not-allowed"
              title="GSP integration coming soon"
            >
              <Upload className="w-4 h-4 mr-2" />
              Push to GSTN
            </Button>
          </div>
        </div>

        {/* GSTIN Banner */}
        {data && (
          <div className="mt-4 flex items-center gap-6 bg-slate-50 border border-slate-100 rounded-lg px-5 py-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GSTIN</span>
              <p className="text-sm font-semibold text-slate-800 tracking-wide">{data.companyGstin}</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Return Period</span>
              <p className="text-sm font-semibold text-slate-800">{periodLabel}</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source</span>
              <p className="text-sm font-medium text-slate-600">
                {data.meta.totalInvoices} invoices · {data.meta.totalBills} bills
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 pb-32">
        <div className="w-full max-w-4xl mx-auto space-y-6">

          {/* Loading State */}
          {loading && (
            <Card className="p-12 bg-white border-slate-200 rounded-xl shadow-sm">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Aggregating tax data for {periodLabel}...</p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="p-8 bg-white border-red-100 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </Card>
          )}

          {/* Data */}
          {data && !loading && (
            <>
              {/* Section 3.1 — Outward Supplies */}
              <Card className="bg-white border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-800 tracking-wide">
                    3.1 — Details of Outward Supplies and Inward Supplies Liable to Reverse Charge
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nature of Supplies</th>
                        <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Taxable Value</th>
                        <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">IGST</th>
                        <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CGST</th>
                        <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SGST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-700 font-medium">
                          (a) Outward taxable supplies
                          <span className="text-slate-400 text-xs ml-1">(other than zero rated, nil rated and exempted)</span>
                        </td>
                        <td className="text-right px-4 py-3.5 font-semibold text-slate-800 tabular-nums">{formatCurrency(data.outwardSupplies.taxableValue)}</td>
                        <td className="text-right px-4 py-3.5 font-medium text-slate-600 tabular-nums">{formatCurrency(data.outwardSupplies.igst)}</td>
                        <td className="text-right px-4 py-3.5 font-medium text-slate-600 tabular-nums">{formatCurrency(data.outwardSupplies.cgst)}</td>
                        <td className="text-right px-4 py-3.5 font-medium text-slate-600 tabular-nums">{formatCurrency(data.outwardSupplies.sgst)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-700 font-medium">
                          (d) Inward supplies
                          <span className="text-slate-400 text-xs ml-1">(liable to reverse charge)</span>
                        </td>
                        <td className="text-right px-4 py-3.5 font-semibold text-slate-800 tabular-nums">{formatCurrency(data.reverseCharge.taxableValue)}</td>
                        <td className="text-right px-4 py-3.5 font-medium text-slate-600 tabular-nums">{formatCurrency(data.reverseCharge.igst)}</td>
                        <td className="text-right px-4 py-3.5 font-medium text-slate-600 tabular-nums">{formatCurrency(data.reverseCharge.cgst)}</td>
                        <td className="text-right px-4 py-3.5 font-medium text-slate-600 tabular-nums">{formatCurrency(data.reverseCharge.sgst)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-700 font-medium">
                          (e) Non-GST outward supplies
                          <span className="text-slate-400 text-xs ml-1">(exempt / nil rated)</span>
                        </td>
                        <td className="text-right px-4 py-3.5 font-semibold text-slate-800 tabular-nums">{formatCurrency(data.exemptSupplies)}</td>
                        <td className="text-right px-4 py-3.5 text-slate-300">—</td>
                        <td className="text-right px-4 py-3.5 text-slate-300">—</td>
                        <td className="text-right px-4 py-3.5 text-slate-300">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Section 4 — ITC */}
              <Card className="bg-white border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100">
                  <h2 className="text-sm font-bold text-slate-800 tracking-wide">
                    4 — Eligible ITC
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Details</th>
                        <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">IGST</th>
                        <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CGST</th>
                        <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SGST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-700 font-medium">
                          (A) ITC Available
                          <span className="text-slate-400 text-xs ml-1">(from {data.meta.itcBillCount} eligible bills)</span>
                        </td>
                        <td className="text-right px-4 py-3.5 font-semibold text-emerald-700 tabular-nums">{formatCurrency(data.itc.igst)}</td>
                        <td className="text-right px-4 py-3.5 font-semibold text-emerald-700 tabular-nums">{formatCurrency(data.itc.cgst)}</td>
                        <td className="text-right px-4 py-3.5 font-semibold text-emerald-700 tabular-nums">{formatCurrency(data.itc.sgst)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Section 5 — Exempt / Nil / Non-GST */}
              <Card className="bg-white border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100">
                  <h2 className="text-sm font-bold text-slate-800 tracking-wide">
                    5 — Values of Exempt, Nil Rated and Non-GST Inward Supplies
                  </h2>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100">
                  <div className="px-6 py-5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Exempt Sales (Outward)</p>
                    <p className="text-xl font-bold text-slate-800 tabular-nums">{formatCurrency(data.exemptSupplies)}</p>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Exempt Purchases (Inward)</p>
                    <p className="text-xl font-bold text-slate-800 tabular-nums">{formatCurrency(data.exemptPurchases)}</p>
                  </div>
                </div>
              </Card>

              {/* Net Tax Payable */}
              <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 border-none rounded-xl shadow-lg overflow-hidden text-white">
                <div className="px-6 py-5 border-b border-white/10">
                  <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-indigo-300" />
                    Net Tax Payable (After ITC Set-off)
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2">IGST</p>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(data.netTaxPayable.igst)}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2">CGST</p>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(data.netTaxPayable.cgst)}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2">SGST</p>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(data.netTaxPayable.sgst)}</p>
                    </div>
                    <div className="bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mb-2">Total Payable</p>
                      <p className="text-2xl font-extrabold tracking-tight tabular-nums">{formatCurrency(data.netTaxPayable.total)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Empty data notice */}
              {data.meta.totalInvoices === 0 && data.meta.totalBills === 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-800">
                    No invoices or supplier bills found for {periodLabel}. All values are showing as zero.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
