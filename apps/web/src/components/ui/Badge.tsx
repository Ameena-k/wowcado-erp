import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-colors focus:outline-none',
        {
          'border-transparent bg-slate-900 text-white': variant === 'default',
          'border-slate-200 bg-slate-100 text-slate-700': variant === 'secondary',
          'border-transparent bg-red-100 text-red-700': variant === 'destructive',
          'border-transparent bg-emerald-100 text-emerald-700': variant === 'success',
          'border-transparent bg-amber-100 text-amber-700': variant === 'warning',
          'text-slate-700 border-slate-200': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
