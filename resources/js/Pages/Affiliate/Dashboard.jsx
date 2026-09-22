import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Sparkles, Copy, Check, DollarSign, TrendingUp,
    Users, Link as LinkIcon, ShoppingBag, Store,
    ArrowUpRight, ShieldCheck, Share2, Award
} from 'lucide-react';

export default function AffiliateDashboard({
    affiliate = {},
    stats = {},
    marketplaceProducts = []
}) {
    const [copiedRef, setCopiedRef] = useState(false);
    const [copiedProduct, setCopiedProduct] = useState(null);

    const handleRoleSwitch = (role) => {
        router.post(route('client.role.switch'), { role });
    };

    const copyGeneralLink = () => {
        if (!affiliate.referral_link) return;
        navigator.clipboard.writeText(affiliate.referral_link);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
    };

    const copyProductLink = (id, link) => {
        navigator.clipboard.writeText(link);
        setCopiedProduct(id);
        setTimeout(() => setCopiedProduct(null), 2000);
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
            <Head title="Affiliate Partner Portal - BotifyAI" />

            {/* Affiliate Navbar */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                            A
                        </div>
                        <div>
                            <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">BotifyAI</span>
                            <span className="text-xs font-semibold px-2 py-0.5 ml-2 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                Affiliate Partner Hub
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
                            onClick={() => handleRoleSwitch('customer')}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                        >
                            <ShoppingBag className="w-3.5 h-3.5" /> Customer Mode
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Hero Referral Header */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-800/60 border border-purple-500/30 text-purple-200 text-xs font-semibold mb-3">
                                <Award className="w-3.5 h-3.5 text-yellow-400" /> 15% Standard Commission on All Referrals
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                                Promote & Earn with BotifyAI
                            </h1>
                            <p className="text-sm text-purple-100/80 mt-1">
                                Share your personal referral link or promote high-converting digital products from our verified marketplace.
                            </p>
                        </div>

                        {/* Referral Link Box */}
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
                            <div className="text-xs text-purple-200 font-semibold flex items-center justify-between">
                                <span>Your Primary Referral Link:</span>
                                <span className="font-mono">{affiliate.referral_code}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1.5 border border-white/10 text-xs">
                                <span className="px-2 truncate text-purple-200 max-w-[220px]">
                                    {affiliate.referral_link}
                                </span>
                                <button
                                    onClick={copyGeneralLink}
                                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 flex-shrink-0 transition-colors"
                                >
                                    {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedRef ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Affiliate Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-xs text-purple-200">Total Referrals</div>
                            <div className="text-xl font-black mt-1">{stats.total_referrals || 0}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-xs text-purple-200">Pending Commission</div>
                            <div className="text-xl font-black mt-1">{formatMoney(stats.pending_commission)}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-xs text-purple-200">Paid Commission</div>
                            <div className="text-xl font-black mt-1">{formatMoney(stats.paid_commission)}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-xs text-purple-200">Commission Rate</div>
                            <div className="text-xl font-black mt-1">{stats.commission_rate || '15%'}</div>
                        </div>
                    </div>
                </div>

                {/* Section: Marketplace Products to Promote */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-purple-600" /> Marketplace Products Ready for Promotion
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Grab your custom affiliate link for top-performing digital products and earn commission per sale.
                            </p>
                        </div>
                    </div>

                    {marketplaceProducts.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 text-sm">
                            No marketplace products available for promotion currently.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {marketplaceProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                {product.store_name}
                                            </span>
                                            <span className="text-xs font-black text-gray-900 dark:text-white">
                                                {formatMoney(product.price, product.currency)}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <div className="mt-2 p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/40 flex items-center justify-between text-xs">
                                            <span className="text-purple-900 dark:text-purple-200 font-medium">Earn per sale:</span>
                                            <span className="font-black text-purple-700 dark:text-purple-300">
                                                {formatMoney(product.estimated_commission, product.currency)} ({product.commission_rate}%)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => copyProductLink(product.id, product.affiliate_link)}
                                            className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
                                        >
                                            {copiedProduct === product.id ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                                            {copiedProduct === product.id ? 'Affiliate Link Copied!' : 'Copy Affiliate Link'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

