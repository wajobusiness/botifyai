import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import {
    Store, Plus, ExternalLink, Settings, Sparkles, DollarSign,
    ShoppingBag, Users, TrendingUp, CheckCircle2, AlertCircle,
    Activity, ArrowUpRight, Copy, Check, Bot, ShieldCheck,
    CreditCard, BarChart2, Eye, Share2, ChevronRight, Layers
} from 'lucide-react';

export default function StoreDashboard({
    stores = [],
    currentStore,
    stats = {},
    recentOrders = [],
    topProducts = [],
    pixelHealth = {},
    connectedBots = [],
    bankAccount = null
}) {
    const [copied, setCopied] = useState(false);

    const copyStoreLink = () => {
        if (!currentStore?.store_url) return;
        navigator.clipboard.writeText(currentStore.store_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatMoney = (val, curr = 'NGN') => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: curr || 'NGN',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <ClientLayout>
            <Head title={`${currentStore?.name || 'Store'} - Commerce Command Center`} />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Top Store Selector & Command Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-bold text-xl border border-teal-100 dark:border-teal-800 shadow-inner">
                            {currentStore?.logo_url ? (
                                <img src={currentStore.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <Store className="w-7 h-7" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    {currentStore?.name || 'My Store'}
                                </h1>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                                    {currentStore?.platform === 'native' ? 'Botify Native' : currentStore?.platform}
                                </span>
                                {currentStore?.is_published ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                        <CheckCircle2 className="w-3 h-3" /> Live & Published
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                        <AlertCircle className="w-3 h-3" /> Draft Mode
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                <span>{currentStore?.slug ? `botifyai.cloud/buy/${currentStore.slug}` : 'Setup your store link'}</span>
                                {currentStore?.store_url && (
                                    <button
                                        onClick={copyStoreLink}
                                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Copied!' : 'Copy Link'}
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Quick Store Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {stores.length > 1 && (
                            <select
                                value={currentStore?.uuid || ''}
                                onChange={(e) => router.visit(route('client.ecommerce.stores.show', { storeUuid: e.target.value }))}
                                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-teal-500"
                            >
                                {stores.map((s) => (
                                    <option key={s.uuid} value={s.uuid}>
                                        {s.name} ({s.platform})
                                    </option>
                                ))}
                            </select>
                        )}

                        <Link
                            href={currentStore?.wizard_url || route('client.ecommerce.stores.wizard.create')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 hover:bg-black text-white dark:bg-teal-600 dark:hover:bg-teal-500 shadow-sm transition-all"
                        >
                            <Settings className="w-4 h-4" /> Store Wizard & SEO
                        </Link>

                        <Link
                            href={route('client.ecommerce.products.index')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Product
                        </Link>

                        {currentStore?.store_url && (
                            <a
                                href={currentStore.store_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                title="Open Live Storefront"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Key Performance Metric Ribbons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
                            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                            {formatMoney(stats.total_revenue, currentStore?.currency)}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> Paid & Escrow Verified
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                            {stats.total_orders || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Completed checkouts
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Items</span>
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                            {stats.total_products || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Active digital & courses
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Customers</span>
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                            {stats.total_customers || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Unique buyer emails
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                            {stats.conversion_rate || 0}%
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                            Direct checkout flow
                        </div>
                    </div>
                </div>

                {/* Mid Section: Marketing Pixel Radar & AI Bot Integration */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Marketing Integrations Radar */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                                        <Share2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Tracking & Pixels</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">CAPI & Event Tracking Health</p>
                                    </div>
                                </div>
                                <Link
                                    href={currentStore?.wizard_url ? `${currentStore.wizard_url}#step3` : '#'}
                                    className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                                >
                                    Configure
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(pixelHealth).map(([key, item]) => (
                                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/60">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-2.5 h-2.5 rounded-full ${item.configured ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                            <div>
                                                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                    {item.configured ? (item.id || 'Active') : 'Not Configured'}
                                                </div>
                                            </div>
                                        </div>
                                        {item.has_capi || item.has_api ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                CAPI Active
                                            </span>
                                        ) : item.configured ? (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                Browser Only
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-400">Inactive</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                            <span>Server CAPI: Fail-Safe 100% Attrib</span>
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                        </div>
                    </div>

                    {/* AI Commerce Bot Integration Ribbon */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Connected AI Bots</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Autonomous Sales Agents</p>
                                    </div>
                                </div>
                                <Link
                                    href={currentStore?.wizard_url ? `${currentStore.wizard_url}#step6` : '#'}
                                    className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                                >
                                    Manage Bots
                                </Link>
                            </div>

                            {connectedBots.length === 0 ? (
                                <div className="p-6 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-dashed border-teal-200 dark:border-teal-800 text-center">
                                    <Sparkles className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">No AI Bots Connected</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                                        Empower an AI bot to autonomously search your catalog and close sales.
                                    </p>
                                    <Link
                                        href={currentStore?.wizard_url ? `${currentStore.wizard_url}` : '#'}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white shadow hover:bg-teal-700"
                                    >
                                        Connect AI Bot <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {connectedBots.map((bot) => (
                                        <div key={bot.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/60">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Bot className="w-4 h-4 text-teal-600" />
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{bot.name}</span>
                                                    {bot.is_default && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 font-semibold">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Ready
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                                <span>✓ Live Catalog Search</span>
                                                <span>✓ Instant Checkout Link</span>
                                                <span>✓ Order Tracking</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                            <span>RAG & Function Tools Enabled</span>
                            <span className="text-teal-600 font-bold">24/7 AI Sales</span>
                        </div>
                    </div>

                    {/* Settlement Bank & Payouts Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Payout Settlement</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Automated Escrow Withdrawals</p>
                                    </div>
                                </div>
                                <Link
                                    href={route('client.ecommerce.wallet.index')}
                                    className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                                >
                                    Wallet Hub
                                </Link>
                            </div>

                            {bankAccount ? (
                                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
                                    <div className="text-xs uppercase tracking-widest text-emerald-100 font-semibold">
                                        {bankAccount.bank_name}
                                    </div>
                                    <div className="text-lg font-mono font-bold tracking-wider my-2">
                                        •••• •••• •••• {bankAccount.account_number?.slice(-4) || '****'}
                                    </div>
                                    <div className="text-xs font-medium text-emerald-100">
                                        {bankAccount.account_name}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-dashed border-amber-200 dark:border-amber-800 text-center">
                                    <CreditCard className="w-7 h-7 text-amber-600 mx-auto mb-1.5" />
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">No Settlement Bank Linked</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 mb-2">
                                        Add your bank account to receive automatic revenue settlements.
                                    </p>
                                    <Link
                                        href={route('client.ecommerce.wallet.index')}
                                        className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                                    >
                                        Link Bank Account →
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                            <span>Zero Gateway Setup Needed</span>
                            <span className="text-emerald-600 font-bold">5% Platform Fee</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Top Products & Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Selling Products */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-teal-600" /> Top Selling Products
                            </h3>
                            <Link
                                href={route('client.ecommerce.products.index')}
                                className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                            >
                                All Products ({stats.total_products || 0})
                            </Link>
                        </div>

                        {topProducts.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">
                                No products with sales yet. Add products to start selling!
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {topProducts.map((product) => (
                                    <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ShoppingBag className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                    {product.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {product.sales_count} sales • {formatMoney(product.total_revenue, product.currency)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                {formatMoney(product.price, product.currency)}
                                            </div>
                                            <a
                                                href={product.checkout_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 justify-end"
                                            >
                                                Preview <ArrowUpRight className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Orders Feed */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-indigo-600" /> Recent Store Orders
                            </h3>
                            <Link
                                href={route('client.ecommerce.orders.index')}
                                className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                            >
                                All Orders ({stats.total_orders || 0})
                            </Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">
                                No orders yet. Your live storefront is ready for customer checkouts!
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {recentOrders.map((order) => (
                                    <div key={order.id} className="py-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <span>#{order.number}</span>
                                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate">
                                                    {order.customer_name} ({order.customer_email})
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {order.placed_at} • {order.items_count} items
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                {formatMoney(order.total, order.currency)}
                                            </div>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                order.payment_status === 'paid'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                            }`}>
                                                {order.payment_status?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}

