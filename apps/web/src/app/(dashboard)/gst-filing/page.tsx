'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronDown, FileText, ShoppingCart, ShoppingBag, AlertCircle, UploadCloud } from 'lucide-react';
import api from '@/lib/api-client';

export default function GstFilingDashboard() {
  const [activeTab, setActiveTab] = React.useState('MONTHLY');
  const [loading, setLoading] = React.useState(true);
  const [gstr1Data, setGstr1Data] = React.useState<any>(null);
  const [gstr2bData, setGstr2bData] = React.useState<any>(null);

  React.useEffect(() => {
    async function loadGst() {
      try {
        const [r1, r2b] = await Promise.all([
          api.get('/gst/gstr1?month=2&year=2026'),
          api.get('/gst/gstr2b?month=2&year=2026')
        ]);
        setGstr1Data(r1.data);
        setGstr2bData(r2b.data);
      } catch (err) {
        console.error('Failed to load GST data', err);
      } finally {
        setLoading(false);
      }
    }
    loadGst();
  }, []);

  const tabs = [
    { id: 'MONTHLY', label: 'MONTHLY / QUARTERLY RETURNS' },
    { id: 'IMS', label: 'IMS DASHBOARD' },
    { id: 'PAYMENTS', label: 'GST PAYMENTS' },
    { id: 'ANNUAL', label: 'ANNUAL RETURNS' },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-50/50 -m-6 p-0 min-h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Top Header Navigation matching Zoho */}
      <div className="bg-white border-b border-slate-200 px-8 pt-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-8 border-b border-slate-200 w-full relative">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs font-bold tracking-wide transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                )}
              </button>
            ))}
            
            {/* View My Online returns button from right */}
            <div className="absolute right-0 bottom-2 text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center gap-1 cursor-pointer">
              View My Online <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* GST Summary Dropdown */}
        <div className="flex items-center gap-2 pb-4 pt-1">
          <span className="text-sm font-medium text-slate-700 font-semibold">GST Summary for:</span>
          <button className="text-sm font-medium text-slate-900 flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded">
            February 2026 <ChevronDown className="w-4 h-4 text-indigo-600 font-bold ml-1" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 pb-32">
        <div className="w-full max-w-3xl mx-auto">
          <div className="space-y-6">
            
            {/* GSTR-3B Card */}
            <Card className="p-6 bg-white shadow-sm border-slate-200 flex items-center justify-between rounded-xl">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 border border-slate-200 rounded flex items-center justify-center text-slate-600 bg-white shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-[15px] text-slate-900">GSTR-3B Summary</h3>
               </div>
               <Button className="bg-[#4b8df8] hover:bg-[#3b7ee8] text-white text-xs font-medium h-9 px-4 rounded shadow-sm">
                 View Summary
               </Button>
            </Card>

            {/* GSTR-1 Card */}
            <Card className="p-6 bg-white shadow-sm border-slate-200 rounded-xl">
               <div className="flex justify-between items-start mb-10">
                 <div className="flex gap-4">
                    <div className="h-10 w-10 border border-slate-200 rounded flex items-center justify-center text-slate-600 bg-white shadow-sm">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[15px] text-slate-900">GSTR-1 (February - 2026)</h3>
                      <p className="text-[13px] text-slate-400 mt-1">Details of outward supplies of goods and services</p>
                    </div>
                 </div>
               </div>
               
               {/* Stepper Implementation */}
               <div className="flex justify-between items-center px-12 pb-6 relative">
                  <div className="absolute left-[80px] right-[80px] top-6 border-t-2 border-dashed border-slate-200 -z-10" />
                  <div className="flex flex-col items-center gap-3 bg-white px-4">
                     <div className="w-12 h-14 border border-slate-200 shadow-sm rounded bg-white flex items-center justify-center overflow-hidden">
                       <FileText className="w-6 h-6 text-emerald-500" />
                       <div className="absolute w-4 h-4 bg-white rounded-full flex items-center justify-center border border-slate-200 -bottom-1 -right-1">
                          <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                       </div>
                     </div>
                     <span className="text-[13px] font-bold text-slate-800">1. Create your transactions</span>
                  </div>

                  <div className="flex flex-col items-center gap-3 bg-white px-4">
                     <div className="w-14 h-12 border border-slate-200 shadow-sm rounded bg-white flex items-center justify-center">
                       <UploadCloud className="w-6 h-6 text-pink-400" />
                     </div>
                     <span className="text-[13px] font-bold text-slate-800">2. Push to GSTN</span>
                  </div>

                  <div className="flex flex-col items-center gap-3 bg-white px-4">
                     <div className="w-12 h-14 border border-slate-200 shadow-sm rounded bg-white flex items-center justify-center">
                       <FileText className="w-6 h-6 text-purple-400" />
                       <div className="absolute w-full h-[2px] bg-purple-400 top-1/2 -translate-y-1/2 rounded-full scale-110 flex items-center justify-center">
                          <div className="w-3 h-3 bg-purple-400 rotate-45 flex items-center justify-center">
                            <span className="text-[8px] text-white transform -rotate-45">🎀</span>
                          </div>
                       </div>
                     </div>
                     <span className="text-[13px] font-bold text-slate-800">3. File return</span>
                  </div>
               </div>
               
               {loading ? (
                 <div className="animate-pulse h-10 bg-slate-50 mt-4 rounded"></div>
               ) : (
                 <div className="flex items-center justify-center text-sm font-medium text-emerald-600 bg-emerald-50 py-3 rounded-lg border border-emerald-100">
                   {gstr1Data?.totalInvoices || 0} Invoices Ready for Export
                 </div>
               )}
            </Card>

            {/* GSTR-2A Card */}
            <Card className="p-6 bg-white shadow-sm border-slate-200 rounded-xl opacity-60 hover:opacity-100 transition-opacity">
               <div className="flex justify-between items-start mb-8">
                 <div className="flex gap-4">
                    <div className="h-10 w-10 border border-slate-200 rounded flex items-center justify-center text-slate-400 bg-white shadow-sm">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[15px] text-slate-500">GSTR-2A</h3>
                      <p className="text-[13px] text-slate-400 mt-1">Details of inward supplies of goods and services</p>
                    </div>
                 </div>
               </div>

               <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex gap-2 items-center text-orange-800 text-[13px] font-medium px-4">
                  <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <p>GSTR-2A return for the selected month will be available only after you mark the previous return as completed. Go to <span className="text-indigo-600 cursor-pointer hover:underline">December - 2025</span> return.</p>
               </div>
            </Card>

            {/* GSTR-2B Card */}
            <Card className="p-6 bg-white shadow-sm border-slate-200 rounded-xl pb-8">
               <div className="flex justify-between items-start mb-8">
                 <div className="flex gap-4">
                    <div className="h-10 w-10 border border-slate-200 rounded flex items-center justify-center text-slate-600 bg-white shadow-sm">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[15px] text-slate-900">GSTR-2B (February - 2026)</h3>
                      <p className="text-[13px] text-slate-400 mt-1">Details of inward supplies of goods and services</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                   <Button className="bg-[#4b8df8] hover:bg-[#3b7ee8] text-white text-xs font-medium h-9 px-4 rounded shadow-sm">
                     View Summary
                   </Button>
                   <Button className="bg-[#4b8df8] hover:bg-[#3b7ee8] text-white text-xs font-medium h-9 px-4 rounded shadow-sm">
                     Fetch Summary
                   </Button>
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-8 mt-2">
                 <div>
                    <h4 className="text-[11px] font-bold text-slate-500 tracking-wider mb-2">ALL TRANSACTIONS</h4>
                    <div className="h-1 bg-slate-100 rounded-full w-full mb-3">
                      <div className="h-1 bg-indigo-500 rounded-full w-full"></div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-indigo-600">
                        {loading ? '...' : gstr2bData?.totalTransactions || 0}
                      </span>
                      <span className="text-sm text-indigo-600">Transactions</span>
                    </div>
                 </div>
                 
                 <div>
                    <h4 className="text-[11px] font-bold text-slate-500 tracking-wider mb-2">MATCHED</h4>
                    <div className="h-1 bg-slate-100 rounded-full w-full mb-3">
                      <div className="h-1 bg-emerald-500 rounded-full w-0"></div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-sky-500">0</span>
                      <span className="text-sm text-sky-500">Transactions</span>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-[11px] font-bold text-slate-500 tracking-wider mb-2">PARTIALLY MATCHED</h4>
                    <div className="h-1 bg-slate-100 rounded-full w-full mb-3">
                      <div className="h-1 bg-sky-500 rounded-full w-0"></div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-sky-500">0</span>
                      <span className="text-sm text-sky-500">Transactions</span>
                    </div>
                 </div>
               </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
