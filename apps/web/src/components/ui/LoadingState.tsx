import * as React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <p className="mt-4 text-sm">{message}</p>
    </div>
  );
}
