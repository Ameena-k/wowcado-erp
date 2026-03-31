import * as React from 'react';
import { PackageOpen } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-slate-50/50 border-dashed">
      <div className="rounded-full bg-slate-100 p-3">
        <PackageOpen className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
    </div>
  );
}
