'use client';

import * as React from 'react';
import { Menu, LogOut, Bell, Search } from 'lucide-react';
import { clearToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-md transition-all shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        {toggleSidebar && (
          <button onClick={toggleSidebar} className="mr-2 lg:hidden text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-1">
            <Menu className="h-6 w-6" />
          </button>
        )}
        
        {/* Mock Search Bar representing SaaS functionality */}
        <div className="hidden md:flex relative max-w-md w-full items-center">
           <Search className="absolute left-3 h-4 w-4 text-slate-400" />
           <input 
             type="text" 
             placeholder="Search transactions, customers, or reports..." 
             className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
           />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative text-slate-500 hover:text-indigo-600 transition-colors">
           <Bell className="h-5 w-5" />
           <span className="absolute 1 top-0 right-0 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200" />
        
        <div className="flex items-center gap-3">
           <div className="flex flex-col text-right hidden sm:flex">
             <span className="text-sm font-semibold text-slate-900 leading-none">Admin User</span>
             <span className="text-xs font-medium text-slate-500 mt-1">Superadmin</span>
           </div>
           <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold shadow-inner ring-1 ring-indigo-500/20">
              A
           </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="group flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 transition-colors ml-1"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </header>
  );
}
