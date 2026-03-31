'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Shield, Building2, UserCircle, Bell, Receipt, Save } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        alert('Settings saved successfully (Phase 1 Stub).');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 pb-20">
      <PageHeader title="Settings & Configuration" description="Manage organization profile, active integrations, and ledger bounds." />

      <form onSubmit={handleSave} className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-wider uppercase">Categories</h3>
            <div className="flex flex-col gap-1">
                <Link href="/societies" className="flex items-center text-left px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm">
                    <Building2 className="w-4 h-4 mr-3" /> Societies Master
                </Link>
                <button type="button" className="flex items-center text-left px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-600 font-medium text-sm transition-colors">
                    <UserCircle className="w-4 h-4 mr-3" /> My Profile
                </button>
                <button type="button" className="flex items-center text-left px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-600 font-medium text-sm transition-colors">
                    <Shield className="w-4 h-4 mr-3" /> Access & Roles
                </button>
                <button type="button" className="flex items-center text-left px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-600 font-medium text-sm transition-colors">
                    <Receipt className="w-4 h-4 mr-3" /> Tax Compliance
                </button>
                <button type="button" className="flex items-center text-left px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-600 font-medium text-sm transition-colors">
                    <Bell className="w-4 h-4 mr-3" /> Notifications
                </button>
            </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
            <Card>
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-lg">Organization Profile</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Legal Entity Name</label>
                            <Input defaultValue="Wowcado" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Tax ID / GSTIN</label>
                            <Input defaultValue="09ABCDE1234F1Z5" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Registered Address</label>
                            <Input defaultValue="Level 2, Tech Park, Cyber City, IN" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-lg">Payment Gateway (Razorpay)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4">
                        <p className="text-sm font-medium text-amber-800">For security reasons, production API keys are managed via environment variables.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Key ID</label>
                            <Input type="password" value="***********************" readOnly className="bg-slate-50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Key Secret</label>
                            <Input type="password" value="***********************" readOnly className="bg-slate-50" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 shadow-md text-white px-8 h-12">
                   <Save className="w-4 h-4 mr-2" />
                   {loading ? 'Saving bounds...' : 'Save Configuration'}
                </Button>
            </div>
        </div>
      </form>
    </div>
  );
}
