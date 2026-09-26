import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Award, CheckCircle2, ShieldCheck, Zap,
    TrendingUp, DollarSign, Lock, ArrowRight,
    Store, ShoppingBag, Globe, CreditCard, Sparkles
} from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { toast } from 'sonner';

export default function AffiliateJoin({
    accessFee = 0,
    accessCurrency = 'USD',
    accessCycle = 'yearly',
    currencies = [],
    pricingByCurrency = {},
    gateways = [],
    user = {}
}) {
    // Default selected currency: user default / platform default or NGN/USD
    const initialCurrency = pricingByCurrency['NGN'] ? 'NGN' : (pricingByCurrency[accessCurrency] ? accessCurrency : (currencies[0]?.code || 'USD'));
    const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);
    const [selectedGateway, setSelectedGateway] = useState(gateways[0]?.id || 'paystack');
    const [processing, setProcessing] = useState(false);

    const activePrice = pricingByCurrency[selectedCurrency] || {
        amount: accessFee,
        formatted: `${accessCurrency} ${accessFee.toFixed(2)}`,
        symbol: accessCurrency,
    };

    const handleRoleSwitch = (role) => {
        router.post(route('client.role.switch'), { role });
    };

    const handleCheckout = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post(route('client.affiliates.join.checkout'), {
            currency: selectedCurrency,
            gateway: selectedGateway,
        }, {
            preserveScroll: true,
            onError: (errors) => {
                setProcessing(false);
                const msg = errors.error || Object.values(errors)[0] || 'Payment initiation failed. Please try again.';
                toast.error(msg);
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
            <Head title="Join Affiliate Partner Hub - BotifyAI" />

            {/* Top Navigation */}
            <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('home')} className="flex items-center group shrink-0">
                            <ApplicationLogo className="h-8 w-auto max-w-[160px] object-contain transition-opacity group-hover:opacity-85" />
                        </Link>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Partner Network
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleRoleSwitch('merchant')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
                        >
                            <Store className="w-3.5 h-3.5" /> Merchant Mode
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleSwitch('customer')}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all"
                        >
                            <ShoppingBag className="w-3.5 h-3.5" /> Customer Mode
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Value Prop & Benefits */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                Exclusive Affiliate Partner Network
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                                Promote verified digital products & earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">recurring commissions.</span>
                            </h1>
                            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                                Join hundreds of top affiliates generating income by promoting high-converting digital products, tools, and courses from our verified global marketplace.
                            </p>
                        </div>

                        {/* Feature Badges Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 space-y-2">
                                <div className="p-2 w-fit rounded-xl bg-purple-500/20 text-purple-400">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-sm text-white">Up to 50% Commission</h3>
                                <p className="text-xs text-neutral-400">
                                    Earn lucrative commission payouts on every customer referred to marketplace sellers.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 space-y-2">
                                <div className="p-2 w-fit rounded-xl bg-blue-500/20 text-blue-400">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-sm text-white">Custom Referral Links</h3>
                                <p className="text-xs text-neutral-400">
                                    Get unique 1-click links for individual products or entire vendor stores with 30-day cookie tracking.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 space-y-2">
                                <div className="p-2 w-fit rounded-xl bg-emerald-500/20 text-emerald-400">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-sm text-white">Live Real-Time Analytics</h3>
                                <p className="text-xs text-neutral-400">
                                    Track click-throughs, lead conversions, referral sales, and pending payouts in real time.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 space-y-2">
                                <div className="p-2 w-fit rounded-xl bg-amber-500/20 text-amber-400">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-sm text-white">Guaranteed Payouts</h3>
                                <p className="text-xs text-neutral-400">
                                    Withdraw accumulated commission balance straight to your connected bank account or wallet.
                                </p>
                            </div>
                        </div>

                        {/* Testimonial / Trust banner */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/20 border border-purple-800/40 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                                ⭐️
                            </div>
                            <div className="text-xs">
                                <p className="font-semibold text-purple-200">
                                    "BotifyAI affiliates earn an average of ₦120,000 / $250+ monthly on active promotions."
                                </p>
                                <p className="text-neutral-400 mt-0.5">Instant automated activation upon checkout completion.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pricing & Checkout Card */}
                    <div className="lg:col-span-5">
                        <div className="bg-neutral-800 border border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                            {/* Decorative glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                                    Partner Access Pass
                                </span>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    {accessCycle === 'yearly' ? 'Annual Plan' : 'Monthly Plan'}
                                </span>
                            </div>

                            {/* Price Presentation */}
                            <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                                        {activePrice.formatted}
                                    </span>
                                    <span className="text-neutral-400 text-sm font-medium">
                                        / {accessCycle === 'yearly' ? 'year' : 'month'}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-400">
                                    Billed {accessCycle === 'yearly' ? 'annually' : 'monthly'}. Full, unlimited access to promote all marketplace products.
                                </p>
                            </div>

                            <form onSubmit={handleCheckout} className="space-y-5">
                                {/* Currency Selector */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center justify-between">
                                        <span>Display Currency</span>
                                        <span className="text-[10px] text-neutral-400 font-normal">Live conversion rate applied</span>
                                    </label>
                                    <select
                                        value={selectedCurrency}
                                        onChange={(e) => setSelectedCurrency(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-600 bg-neutral-900 text-white font-medium text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    >
                                        {currencies.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} ({c.symbol}) - {pricingByCurrency[c.code]?.formatted || c.code}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Gateway Selector */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                                        Select Payment Method
                                    </label>
                                    <div className="space-y-2.5">
                                        {gateways.map((gw) => (
                                            <label
                                                key={gw.id}
                                                className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                                                    selectedGateway === gw.id
                                                        ? 'border-purple-500 bg-purple-500/10'
                                                        : 'border-neutral-700 bg-neutral-900/60 hover:border-neutral-600'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="gateway"
                                                    value={gw.id}
                                                    checked={selectedGateway === gw.id}
                                                    onChange={() => setSelectedGateway(gw.id)}
                                                    className="mt-1 text-purple-600 focus:ring-purple-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                                                        <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                                                        {gw.name}
                                                    </div>
                                                    <p className="text-[11px] text-neutral-400 mt-0.5">
                                                        {gw.description}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* User Info summary */}
                                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-700/60 text-xs text-neutral-400">
                                    Subscribing as: <strong className="text-white">{user.name}</strong> ({user.email})
                                </div>

                                {/* Submit CTA */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
                                >
                                    {processing ? (
                                        'Redirecting to Secure Gateway...'
                                    ) : (
                                        <>
                                            <span>Unlock Partner Access</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Trust badges */}
                            <div className="pt-4 border-t border-neutral-700 flex items-center justify-center gap-4 text-[11px] text-neutral-400">
                                <span className="flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Secured
                                </span>
                                <span>•</span>
                                <span>Instant Access</span>
                                <span>•</span>
                                <span>Official Verified Hub</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
                &copy; {new Date().getFullYear()} BotifyAI. All rights reserved.
            </footer>
        </div>
    );
}
