import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Pagination, Badge } from '@/Components/ui';
import { Head, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Award, Users, DollarSign, CheckCircle2,
    Search, Settings, RefreshCw, ShieldCheck,
    Calendar, Key, ExternalLink, AlertCircle, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAffiliatesIndex({
    settings = { access_fee: 0, access_currency: 'USD', access_cycle: 'yearly' },
    currencies = [],
    affiliates = { data: [], links: [] },
    filters = {},
    stats = { total_affiliates: 0, active_paid_affiliates: 0, total_revenue: 0 }
}) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('members');
    const [search, setSearch] = useState(filters.search || '');
    const [copiedId, setCopiedId] = useState(null);

    // Settings form
    const { data: settingsData, setData: setSettingsData, post: postSettings, processing: savingSettings } = useForm({
        access_fee: settings.access_fee ?? 0,
        access_currency: settings.access_currency ?? 'USD',
        access_cycle: settings.access_cycle ?? 'yearly',
    });

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get(route('admin.affiliates.index'), { search }, { preserveState: true, replace: true });
    };

    const handleSettingsSubmit = (e) => {
        e.preventDefault();
        postSettings(route('admin.affiliates.settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Affiliate access settings updated successfully.');
            },
            onError: () => {
                toast.error('Failed to update settings. Please check your inputs.');
            }
        });
    };

    const handleCompUser = (userId, userName) => {
        if (!confirm(`Grant lifetime complimentary (free) affiliate access to ${userName}?`)) return;
        router.post(route('admin.affiliates.users.comp', userId), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Comped access granted to ${userName}`),
        });
    };

    const handleExtendUser = (userId, userName) => {
        if (!confirm(`Extend affiliate subscription for ${userName} by 1 billing cycle?`)) return;
        router.post(route('admin.affiliates.users.extend', userId), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Access extended for ${userName}`),
        });
    };

    const handleRevokeUser = (userId, userName) => {
        if (!confirm(`Revoke and cancel affiliate access for ${userName}?`)) return;
        router.post(route('admin.affiliates.users.revoke', userId), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Access revoked for ${userName}`),
        });
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Referral code copied');
    };

    const formatMoney = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <AdminLayout title="Affiliate Program & Access Layer">
            <Head title="Affiliate Program - Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
                            <Award className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                            Affiliate Program & Access Layer
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Configure affiliate access fees, subscription cycles, monitor enrolled affiliates, and track subscription revenue.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            settings.access_fee > 0
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Access Mode: {settings.access_fee > 0 ? `Paid (${formatMoney(settings.access_fee, settings.access_currency)} / ${settings.access_cycle})` : '100% Free Access'}
                        </span>
                    </div>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Total Affiliates
                                </p>
                                <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
                                    {stats.total_affiliates}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl text-purple-600 dark:text-purple-400">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Active Subscriptions
                                </p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                    {stats.active_paid_affiliates}
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Total Revenue Collected
                                </p>
                                <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
                                    {formatMoney(stats.total_revenue, settings.access_currency)}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('members')}
                        className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                            activeTab === 'members'
                                ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Affiliate Members & Subscriptions
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('settings')}
                        className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                            activeTab === 'settings'
                                ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        Access Fee & Cycle Settings
                    </button>
                </div>

                {/* TAB 1: MEMBERS */}
                {activeTab === 'members' && (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                            </form>

                            <Button
                                variant="secondary"
                                onClick={() => router.get(route('admin.affiliates.index'))}
                                className="w-full sm:w-auto text-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                Refresh Table
                            </Button>
                        </div>

                        {/* Members Table */}
                        <Card className="overflow-hidden border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-neutral-700 dark:text-neutral-300">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                                        <tr>
                                            <th className="px-5 py-3.5">Affiliate User</th>
                                            <th className="px-4 py-3.5">Referral Code</th>
                                            <th className="px-4 py-3.5">Plan Type</th>
                                            <th className="px-4 py-3.5">Status</th>
                                            <th className="px-4 py-3.5">Revenue Paid</th>
                                            <th className="px-4 py-3.5">Renewal / Expiry</th>
                                            <th className="px-5 py-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {affiliates.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                                                    No affiliates found matching your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            affiliates.data.map((item) => (
                                                <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="font-semibold text-neutral-900 dark:text-white">
                                                            {item.name}
                                                        </div>
                                                        <div className="text-xs text-neutral-400">
                                                            {item.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(item.referral_code, item.id)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                                            title="Click to copy code"
                                                        >
                                                            {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                                                            {item.referral_code}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="capitalize font-medium text-xs">
                                                            {item.plan_type === 'comped' ? (
                                                                <span className="text-purple-600 dark:text-purple-400 font-bold">Comped (Free)</span>
                                                            ) : (
                                                                item.plan_type
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {item.effective_status === 'comped' && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                                                                Comped
                                                            </span>
                                                        )}
                                                        {item.effective_status === 'active' && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                Active
                                                            </span>
                                                        )}
                                                        {item.effective_status === 'free' && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                                                Free Plan
                                                            </span>
                                                        )}
                                                        {item.effective_status === 'expired' && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                                                Expired
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 font-semibold text-xs text-neutral-900 dark:text-white">
                                                        {formatMoney(item.total_revenue, item.currency)}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-neutral-500 dark:text-neutral-400">
                                                        {item.expires_at ? item.expires_at : (item.plan_type === 'comped' ? 'Lifetime Access' : 'Permanent')}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {item.effective_status !== 'comped' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCompUser(item.id, item.name)}
                                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 transition-colors"
                                                                    title="Grant Free Lifetime Access"
                                                                >
                                                                    Comp Free
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleExtendUser(item.id, item.name)}
                                                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                                                                title="Extend duration"
                                                            >
                                                                Extend
                                                            </button>
                                                            {item.is_active && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRevokeUser(item.id, item.name)}
                                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                                                                    title="Revoke affiliate access"
                                                                >
                                                                    Revoke
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {affiliates.links && affiliates.links.length > 3 && (
                                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <Pagination links={affiliates.links} />
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* TAB 2: ACCESS FEE SETTINGS */}
                {activeTab === 'settings' && (
                    <div className="max-w-3xl">
                        <Card className="p-6 sm:p-8 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-purple-600" />
                                    Affiliate Program Access Fee Configuration
                                </h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    Control whether joining the affiliate hub requires a paid subscription fee or remains free for all platform users.
                                </p>
                            </div>

                            {/* Informational Callout */}
                            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                                <div className="text-xs text-purple-900 dark:text-purple-200 space-y-1">
                                    <p className="font-semibold">How the Access Layer Works:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-purple-800 dark:text-purple-300">
                                        <li><strong>Access Fee = 0:</strong> The affiliate portal is completely free and instantly open to all users.</li>
                                        <li><strong>Access Fee &gt; 0:</strong> Users clicking "Affiliates" see a checkout paywall and must pay to activate their affiliate dashboard.</li>
                                        <li><strong>Multi-Currency:</strong> The fee is set in the base currency below and automatically converted into the user's regional currency at checkout.</li>
                                    </ul>
                                </div>
                            </div>

                            <form onSubmit={handleSettingsSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Access Fee Numeric Input */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                                            Access Fee Amount
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={settingsData.access_fee}
                                                onChange={(e) => setSettingsData('access_fee', parseFloat(e.target.value) || 0)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <p className="text-[11px] text-neutral-400 mt-1.5">
                                            Enter 0 to make joining free, or set a price (e.g. 10.00).
                                        </p>
                                    </div>

                                    {/* Base Currency Dropdown */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                                            Base Currency
                                        </label>
                                        <select
                                            value={settingsData.access_currency}
                                            onChange={(e) => setSettingsData('access_currency', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        >
                                            {currencies.map((curr) => (
                                                <option key={curr.code} value={curr.code}>
                                                    {curr.code} ({curr.symbol}) - Rate: {curr.exchange_rate}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-neutral-400 mt-1.5">
                                            The master currency used as the benchmark for currency conversion.
                                        </p>
                                    </div>
                                </div>

                                {/* Billing Cycle Selection */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                                        Billing Cycle
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setSettingsData('access_cycle', 'yearly')}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                                settingsData.access_cycle === 'yearly'
                                                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30'
                                                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full mt-0.5 border-2 flex items-center justify-center ${
                                                settingsData.access_cycle === 'yearly' ? 'border-purple-600 bg-purple-600' : 'border-neutral-400'
                                            }`}>
                                                {settingsData.access_cycle === 'yearly' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                                                    Yearly Cycle
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                                                        Recommended
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                    Affiliates pay once per year. Fewer renewal friction points.
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setSettingsData('access_cycle', 'monthly')}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                                settingsData.access_cycle === 'monthly'
                                                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30'
                                                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full mt-0.5 border-2 flex items-center justify-center ${
                                                settingsData.access_cycle === 'monthly' ? 'border-purple-600 bg-purple-600' : 'border-neutral-400'
                                            }`}>
                                                {settingsData.access_cycle === 'monthly' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-neutral-900 dark:text-white">
                                                    Monthly Cycle
                                                </div>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                    Affiliates pay every month to retain their promotion access.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={savingSettings}
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm"
                                    >
                                        {savingSettings ? 'Saving Settings...' : 'Save Affiliate Settings'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
