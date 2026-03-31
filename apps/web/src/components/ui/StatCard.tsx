import * as React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '@/lib/utils';

export function StatCard({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between pb-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          {icon && (
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700">
               {icon}
             </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
           <div className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
