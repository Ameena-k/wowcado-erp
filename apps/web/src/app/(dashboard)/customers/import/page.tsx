'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Papa from 'papaparse';
import api from '@/lib/api-client';
import { getUserRole } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const DB_FIELDS = [
  { key: 'name', label: 'Full Name (Required)' },
  { key: 'phone', label: 'Phone Number (Required - Duplicate Key)' },
  { key: 'email', label: 'Email Address (Optional)' },
  { key: 'society', label: 'Society Name (Required - Master Matched)' },
  { key: 'blockOrStreet', label: 'Block/Street (Required)' },
  { key: 'doorNo', label: 'Door/Flat No (Required)' },
  { key: 'landmark', label: 'Landmark (Optional)' },
];

export default function CustomerImportPage() {
  const router = useRouter();
  React.useEffect(() => {
    const role = getUserRole();
    if (!role || !['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'].includes(role)) {
      router.replace('/customers');
    }
  }, [router]);

  // Steps: 1: Upload, 2: Map, 3: Preview & Run, 4: Result
  const [step, setStep] = React.useState(1);
  const [file, setFile] = React.useState<File | null>(null);
  const [csvData, setCsvData] = React.useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([]);
  
  const [mappings, setMappings] = React.useState<Record<string, string>>({});
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState({ current: 0, total: 0 });
  
  const [results, setResults] = React.useState<{
    created: number; updated: number; skipped: number; reviewRequired: number; failed: number; details: any[];
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields) {
            setCsvHeaders(results.meta.fields);
            setCsvData(results.data);
            
            // Auto map identical names playfully
            const initialMap: Record<string, string> = {};
            DB_FIELDS.forEach(f => {
               const match = results.meta.fields!.find(h => h.toLowerCase().replace(/[^a-z]/g,'') === f.key.toLowerCase());
               if(match) initialMap[f.key] = match;
            });
            setMappings(initialMap);
            setStep(2);
          }
        }
      });
    }
  };

  const handleMapChange = (dbKey: string, csvHeader: string) => {
    setMappings(prev => ({ ...prev, [dbKey]: csvHeader }));
  };

  const executeImport = async () => {
    setIsProcessing(true);
    setStep(4);
    
    // Transform CSV data to DB mapped objects
    const mappedRows = csvData.map(row => {
      const obj: any = {};
      DB_FIELDS.forEach(f => {
        if (mappings[f.key]) {
          obj[f.key] = row[mappings[f.key]];
        }
      });
      return obj;
    });

    const chunkSize = 200;
    const aggregatedResults = { created: 0, updated: 0, skipped: 0, reviewRequired: 0, failed: 0, details: [] as any[] };
    setProgress({ current: 0, total: mappedRows.length });

    try {
      for (let i = 0; i < mappedRows.length; i += chunkSize) {
        const chunk = mappedRows.slice(i, i + chunkSize);
        
        const response = await api.post('/customers/import', { rows: chunk });
        const batchRes = response.data;
        
        aggregatedResults.created += batchRes.created || 0;
        aggregatedResults.updated += batchRes.updated || 0;
        aggregatedResults.skipped += batchRes.skipped || 0;
        aggregatedResults.reviewRequired += batchRes.reviewRequired || 0;
        aggregatedResults.failed += batchRes.failed || 0;
        if (batchRes.details) aggregatedResults.details.push(...batchRes.details);
        
        setProgress({ current: Math.min(i + chunkSize, mappedRows.length), total: mappedRows.length });
      }
      setResults(aggregatedResults);
    } catch (err) {
      alert("A fatal network error interrupted the batch processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-500 pb-12">
      <PageHeader title="Import Customers CSV" description="Mass onboard historical data cleanly mapping directly to Societies.">
        <Link href="/customers">
          <Button variant="outline" className="border-slate-200">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customers
          </Button>
        </Link>
      </PageHeader>

      {/* STEP INDICATORS */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        {[
          { id: 1, name: 'Upload CSV' },
          { id: 2, name: 'Map Columns' },
          { id: 3, name: 'Preview & Run' },
          { id: 4, name: 'Results' }
        ].map((s) => (
          <div key={s.id} className={`flex flex-col items-center ${step >= s.id ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${step >= s.id ? 'bg-indigo-100' : 'bg-slate-100'}`}>
              {s.id}
            </div>
            <span className="text-sm font-medium">{s.name}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <label className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors group">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-slate-800 mb-2">Drag and drop your CSV file here</p>
          <p className="text-slate-500 mb-6 text-sm">Strictly only .csv files are supported. Ideal chunk parsing up to 5000 rows.</p>
          <div className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 transition-colors pointer-events-none">
            Select File
          </div>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
      )}

      {/* STEP 2: MAP COLUMNS */}
      {step === 2 && (
        <Card className="p-6 space-y-6 shadow-sm border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Map your CSV Columns</h2>
              <p className="text-slate-500 text-sm">Select which CSV column headers match the internal Wowcado fields.</p>
            </div>
            <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
               <span className="font-bold text-indigo-700">{csvData.length} rows detected</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
            {DB_FIELDS.map((field) => (
              <div key={field.key} className="p-4 flex items-center justify-between gap-4">
                 <div className="w-1/3">
                    <span className="font-semibold text-slate-700 block">{field.label}</span>
                 </div>
                 <div className="w-2/3">
                    <select 
                      className="w-full sm:max-w-md bg-white border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={mappings[field.key] || ''}
                      onChange={(e) => handleMapChange(field.key, e.target.value)}
                    >
                      <option value="">-- Ignore / Not Provided --</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                 </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
             <Button variant="outline" onClick={() => setStep(1)}>Cancel</Button>
             <Button 
                onClick={() => setStep(3)} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!mappings.name || !mappings.phone || !mappings.society || !mappings.blockOrStreet || !mappings.doorNo}
             >
               Next: Preview Data
             </Button>
          </div>
          <p className="text-right text-xs text-slate-500">You must map Name, Phone, Society, Block, and Door No to proceed.</p>
        </Card>
      )}

      {/* STEP 3: PREVIEW */}
      {step === 3 && (
        <Card className="p-6 space-y-6 shadow-sm border-slate-200">
           <div>
             <h2 className="text-lg font-bold text-slate-900">Preview Parsed Data</h2>
             <p className="text-slate-500 text-sm">Here is structurally how your first 3 rows will be interpreted before inserting.</p>
           </div>
           
           <div className="overflow-x-auto border rounded-xl divide-y">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50">
                 <tr>
                    {DB_FIELDS.map(f => <th key={f.key} className="p-3 font-semibold text-slate-600">{f.label.split(' ')[0]}</th>)}
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {csvData.slice(0,3).map((row, i) => (
                   <tr key={i}>
                      {DB_FIELDS.map(f => (
                         <td key={f.key} className="p-3 font-mono text-xs text-slate-700">
                           {row[mappings[f.key]] || <span className="text-slate-300 italic">null</span>}
                         </td>
                      ))}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>

           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Important Upsert Warning</p>
                <p className="mt-1">Rows matching an existing Phone Number will dramatically overwrite the existing Name and Default Address payload to match this CSV. Ambiguous Society names will skip the row into the "Review Required" bucket.</p>
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-2">
             <Button variant="outline" onClick={() => setStep(2)}>Back to Mapping</Button>
             <Button onClick={executeImport} className="bg-amber-600 hover:bg-amber-700 text-white">Execute Final Import</Button>
           </div>
        </Card>
      )}

      {/* STEP 4: RESULTS */}
      {step === 4 && (
        <Card className="p-8 space-y-8 shadow-sm border-slate-200 text-center">
          {isProcessing ? (
             <div className="py-12 flex flex-col items-center">
               <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
               <h2 className="text-2xl font-bold text-slate-900 mb-2">Importing Customers...</h2>
               <p className="text-slate-500 mb-6 font-mono">{progress.current} / {progress.total} Parsed</p>
               <div className="w-64 h-3 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${Math.max(5, (progress.current / (progress.total||1))*100)}%` }} />
               </div>
             </div>
          ) : results && (
             <div className="space-y-8 text-left">
               <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900">Import Complete</h2>
                 <p className="text-slate-500">{csvData.length} total rows processed in batches.</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                 <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-emerald-700">{results.created}</div>
                   <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mt-1">Created</div>
                 </div>
                 <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-blue-700">{results.updated}</div>
                   <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mt-1">Updated</div>
                 </div>
                 <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-slate-700">{results.skipped}</div>
                   <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-1">Missing Info</div>
                 </div>
                 <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-amber-700">{results.reviewRequired}</div>
                   <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mt-1">Review Req.</div>
                 </div>
                 <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-red-700">{results.failed}</div>
                   <div className="text-xs font-bold uppercase tracking-wider text-red-600 mt-1">Hard Failed</div>
                 </div>
               </div>

               {results.details.length > 0 && (
                 <div className="bg-white border rounded-xl overflow-hidden mt-8">
                   <div className="bg-slate-50 p-4 border-b">
                     <h3 className="font-bold text-slate-800">Exceptions Log ({results.details.length})</h3>
                   </div>
                   <div className="max-h-96 overflow-y-auto">
                     <table className="w-full text-left text-sm">
                       <thead className="bg-white sticky top-0 shadow-sm">
                         <tr>
                           <th className="p-3">Status</th><th className="p-3">Reason</th><th className="p-3">Row Snapshot</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y relative z-0">
                         {results.details.map((d: any, i: number) => (
                           <tr key={i} className="hover:bg-slate-50">
                             <td className="p-3"><span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold">{d.status}</span></td>
                             <td className="p-3 text-red-600 font-medium">{d.reason}</td>
                             <td className="p-3 font-mono text-xs text-slate-500 overflow-hidden text-ellipsis max-w-[200px]">{JSON.stringify(d.row)}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               )}
             </div>
          )}
        </Card>
      )}
    </div>
  );
}
