import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Download, ShoppingBag, Receipt, ShieldCheck,
    Clock, CheckCircle2, ArrowRight, ExternalLink,
    Store, Sparkles, UserCheck, HardDrive, FileText,
    ArrowUpRight, AlertCircle, RefreshCw
} from 'lucide-react';

export default function CustomerDashboard({
    user = {},
    orders = [],
    digitalAssets = [],
    stats = {}
}) {
    const handleRoleSwitch = (role) => {
        router.post(route('client.role.switch'), { role });
    };

    const formatMoney = (val, curr = 'NGN') => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: curr || 'NGN',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Head title="My Purchases & Digital Asset Vault - BotifyAI" />

            {/* Buyer Navbar */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                            B
                        </div>
                        <div>
                            <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">BotifyAI</span>
                            <span className="text-xs font-semibold px-2 py-0.5 ml-2 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                                Customer Vault
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleRoleSwitch('merchant')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
                        >
                            <Store className="w-3.5 h-3.5" /> Merchant Mode
                        </button>

                        <button
                            type="button"
                            onClick={() => handleRoleSwitch('affiliate')}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Affiliate Mode
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Welcome & KPI Header */}
                <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/60 border border-teal-500/30 text-teal-200 text-xs font-semibold mb-3">
                                <ShieldCheck className="w-3.5 h-3.5" /> Verified Digital Asset Vault
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                                Welcome back, {user.name || 'Customer'}!
                            </h1>
                            <p className="text-sm text-teal-100/80 mt-1">
                                Access your purchased courses, software, ebooks, and official payment receipts across all BotifyAI stores.
                            </p>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
                            <div className="px-3">
                                <div className="text-xl sm:text-2xl font-black">{stats.total_assets || 0}</div>
                                <div className="text-[10px] sm:text-xs text-teal-200 font-medium uppercase tracking-wider">Digital Assets</div>
                            </div>
                            <div className="px-3 border-x border-white/10">
                                <div className="text-xl sm:text-2xl font-black">{stats.total_orders || 0}</div>
                                <div className="text-[10px] sm:text-xs text-teal-200 font-medium uppercase tracking-wider">Total Orders</div>
                            </div>
                            <div className="px-3">
                                <div className="text-xl sm:text-2xl font-black">{formatMoney(stats.total_spent)}</div>
                                <div className="text-[10px] sm:text-xs text-teal-200 font-medium uppercase tracking-wider">Total Spent</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 1: Digital Asset Vault */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <HardDrive className="w-5 h-5 text-teal-600" /> Digital Asset Downloads
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Instant, tokenized access to your files and digital downloads.
                            </p>
                        </div>
                    </div>

                    {digitalAssets.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center space-y-3">
                            <HardDrive className="w-10 h-10 text-gray-400 mx-auto" />
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">No Digital Assets Found</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                Once you purchase digital products on any BotifyAI merchant storefront using your email ({user.email}), they will appear here automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {digitalAssets.map((asset) => (
                                <div
                                    key={asset.id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                                {asset.store_name}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {asset.purchased_at}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2">
                                            {asset.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                            File: {asset.file_name}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                            {asset.remaining_downloads !== null ? `${asset.remaining_downloads} downloads left` : 'Unlimited'}
                                        </span>

                                        <a
                                            href={asset.download_url}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section 2: Order History & Receipts */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-indigo-600" /> Order History & Receipts
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            View itemized receipts, transaction IDs, and merchant order records.
                        </p>
                    </div>

                    {orders.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 text-sm">
                            No orders placed yet.
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="py-3.5 px-5">Order #</th>
                                            <th className="py-3.5 px-5">Store</th>
                                            <th className="py-3.5 px-5">Items</th>
                                            <th className="py-3.5 px-5">Date</th>
                                            <th className="py-3.5 px-5">Total</th>
                                            <th className="py-3.5 px-5">Status</th>
                                            <th className="py-3.5 px-5 text-right">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-750 transition-colors">
                                                <td className="py-3.5 px-5 font-bold font-mono text-gray-900 dark:text-white">
                                                    #{order.number}
                                                </td>
                                                <td className="py-3.5 px-5 text-gray-700 dark:text-gray-300 font-medium">
                                                    {order.store_name}
                                                </td>
                                                <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400">
                                                    {order.items?.map(i => i.name).join(', ') || 'Item'}
                                                </td>
                                                <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400">
                                                    {order.placed_at}
                                                </td>
                                                <td className="py-3.5 px-5 font-bold text-gray-900 dark:text-white">
                                                    {formatMoney(order.total, order.currency)}
                                                </td>
                                                <td className="py-3.5 px-5">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        order.payment_status === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                    }`}>
                                                        {order.payment_status?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 text-right">
                                                    <a
                                                        href={order.receipt_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold hover:underline"
                                                    >
                                                        Receipt <ArrowUpRight className="w-3 h-3" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

