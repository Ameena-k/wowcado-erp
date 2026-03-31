'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  TrendingUp, FileText, Users, Building2, Receipt,
  BookOpen, Activity, BarChart2
} from 'lucide-react';

const tabs = [
  { href: '/reports', label: 'Finance Overview', icon: BarChart2, exact: true },
  { href: '/reports/sales', label: 'Sales', icon: TrendingUp },
  { href: '/reports/invoices', label: 'Invoices', icon: FileText },
  { href: '/reports/outstanding', label: 'AR Outstanding', icon: Users },
  { href: '/reports/payables', label: 'AP Payable', icon: Building2 },
  { href: '/reports/expenses', label: 'Expenses', icon: Receipt },
  { href: '/reports/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/reports/daybook', label: 'Day Book', icon: Activity },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time insights across your entire accounting ledger.</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <nav className="flex border-b border-slate-100 min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                    isActive
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-500' : 'text-slate-400')} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
