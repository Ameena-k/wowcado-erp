'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  CreditCard,
  FileText,
  Banknote,
  TrendingDown,
  BarChart,
  Settings,
  Activity,
  Zap,
  Building2,
  MessageSquare,
  FileSignature
} from 'lucide-react';

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  children?: { href: string; label: string }[];
};

const navGroups: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Sales',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/customers', icon: Users, label: 'Customers' },
      { href: '/products', icon: Package, label: 'Catalog' },
      { href: '/orders', icon: ShoppingCart, label: 'Orders' },
      { href: '/invoices', icon: Receipt, label: 'Invoices' },
      { href: '/payments', icon: CreditCard, label: 'Payments' },
    ],
  },
  {
    heading: 'Procurement',
    items: [
      { href: '/expenses', icon: TrendingDown, label: 'Expenses' },
      { href: '/bills', icon: FileText, label: 'Supplier Bills' },
      { href: '/vendor-payments', icon: Banknote, label: 'Vendor Payments' },
    ],
  },
  {
    heading: 'Reporting',
    items: [
      { href: '/reports', icon: BarChart, label: 'Reports' },
      { href: '/gateway', icon: Zap, label: 'Gateway Events' },
    ],
  },
  {
    heading: 'Filing & Compliance',
    items: [
      { href: '/gst-filing', icon: FileSignature, label: 'GST Filing' },
    ],
  },
  {
    heading: 'Communications',
    items: [
      { href: '/whatsapp', icon: MessageSquare, label: 'WhatsApp Logs' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-72 flex-col bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text))] shadow-2xl z-20 transition-all border-r border-white/5">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 font-bold text-lg text-white gap-3 border-b border-white/5 bg-white/5 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white">
          <Activity className="h-5 w-5" />
        </div>
        Wowcado
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-5 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.heading}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {group.heading}
            </p>
            <nav className="grid gap-1 font-medium">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all outline-none',
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-400 font-semibold'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-4.5 w-4.5 flex-shrink-0 transition-colors', isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300')} />
                    {item.label}
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-white/5 p-3 bg-black/10 flex-shrink-0 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-white/5 hover:text-white text-slate-400 outline-none"
        >
          <Settings className="h-4 w-4 text-slate-500" />
          Settings
        </Link>
      </div>
    </div>
  );
}
