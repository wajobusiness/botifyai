import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from 'react-i18next';
import {
    Sparkles, ArrowRight, Store, ShoppingBag,
    Layers, LineChart, Copy, Share2,
    CheckCircle2, DollarSign, Clock, Calendar,
    CreditCard, ShieldCheck, ChevronDown, Check,
    ExternalLink, Zap, HelpCircle, Award
} from 'lucide-react';

function Badge({ text, icon: Icon = Sparkles }) {
    if (!text) return null;
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 text-brand-400 text-xs font-bold px-3.5 py-1.5 border border-brand-500/30">
            {Icon && <Icon className="h-3.5 w-3.5 text-brand-400" />}
            {text}
        </span>
    );
}

export default function AffiliatesLanding({
    landing = {},
    accessFee = 0,
    accessCurrency = 'USD',
    accessCycle = 'yearly',
    isLoggedIn = false,
    joinUrl = '/app/affiliates/join',
    loginUrl = '/login?redirect=/app/affiliates',
    canRegister = true,
}) {
    const { t } = useTranslation();
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const WHY_JOIN_ITEMS = [
        {
            icon: Store,
            title: 'A growing multi-vendor catalog',
            desc: 'Real products from real, verified sellers across dozens of categories. Browse freely and choose only what resonates with your audience.',
            color: 'from-purple-500/20 to-purple-500/5',
            border: 'border-purple-200 dark:border-purple-800/60',
            iconColor: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
        },
        {
            icon: Layers,
            title: 'One dashboard for everything',
            desc: 'No more juggling separate affiliate portals, logins, and accounts per vendor. Manage your full promotion catalog in one centralized hub.',
            color: 'from-blue-500/20 to-blue-500/5',
            border: 'border-blue-200 dark:border-blue-800/60',
            iconColor: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
        },
        {
            icon: LineChart,
            title: 'Real-time tracking & transparent payouts',
            desc: 'Instant click attribution, conversion metrics, and detailed payout summaries across every individual product in your link list.',
            color: 'from-emerald-500/20 to-emerald-500/5',
            border: 'border-emerald-200 dark:border-emerald-800/60',
            iconColor: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
        },
        {
            icon: Copy,
            title: 'Ready-made marketing assets',
            desc: 'Pre-written swipe copy, promotional banners, product images, and unique tracking links provided per item. Zero design work needed.',
            color: 'from-amber-500/20 to-amber-500/5',
            border: 'border-amber-200 dark:border-amber-800/60',
            iconColor: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
        },
    ];

    const HOW_IT_WORKS_STEPS = [
        {
            step: '01',
            title: 'Join the network',
            desc: 'Enroll in seconds with seamless onboarding. Free instant access or a simple transparent pass depending on current platform settings.',
        },
        {
            step: '02',
            title: 'Browse the catalog',
            desc: 'Explore high-converting digital products, courses, ebooks, software, and vendor services with transparent commission rates.',
        },
        {
            step: '03',
            title: 'Pick what fits your audience',
            desc: 'Grab your 1-click custom affiliate tracking link for any product or whole storefronts to share with your audience.',
        },
        {
            step: '04',
            title: 'Share & earn commissions',
            desc: 'Every completed referral automatically attributes to your account with guaranteed payouts on our regular schedule.',
        },
    ];

    const DASHBOARD_FEATURES = [
        {
            title: 'Full Product Catalog & Filters',
            desc: 'Filter by category, price point, seller rating, and commission percentage to find the highest-converting offers.',
        },
        {
            title: 'Per-Product Real-Time Tracking',
            desc: 'Granular analytics showing impressions, link clicks, conversion rates, and revenue for each promoted link.',
        },
        {
            title: 'Unified Earnings & Payout History',
            desc: 'Clear ledger of earned commissions, pending payouts, completed withdrawals, and lifetime revenue analytics.',
        },
        {
            title: 'Creative Assets & Swipe Copy Library',
            desc: 'Instant access to vendor-supplied creatives, captions, email swipe copy, and promotional assets for easy sharing.',
        },
    ];

    const FAQS = [
        {
            q: 'Is it free to join?',
            a: 'Joining depends on the current platform access settings set by the network admin — it is clearly shown before you register. If the access fee is set to $0, access is 100% free and instant.',
        },
        {
            q: 'Can I promote more than one product?',
            a: 'Yes, absolutely! You have full access to our entire multi-vendor marketplace. You can pick and promote as many individual products or entire stores as you want.',
        },
        {
            q: 'How and when do I get paid?',
            a: 'Commissions are accumulated in your affiliate wallet and disbursed on our regular payout schedule (bi-weekly or monthly) directly to your linked bank account or preferred payment method upon reaching the minimum threshold.',
        },
        {
            q: 'How long does my referral link stay credited to me?',
            a: 'We use a 30-day cookie tracking window. When a customer clicks your affiliate link, any eligible purchase they make within 30 days is automatically credited to you.',
        },
        {
            q: 'What is not allowed in the affiliate program?',
            a: 'Spamming, unsolicited mass messaging, bidding on a seller\'s trademark or brand name in search ads, and making misleading or false claims are strictly prohibited and will result in immediate account revocation.',
        },
    ];

    return (
        <LandingLayout>
            <SeoHead
                title="BotifyAI Affiliate Network — Promote & Earn Commissions"
                description="One network, hundreds of products. Browse the multi-vendor catalog, pick what fits your audience, and earn commissions on every sale."
            />

            {/* ── 1. Hero Section ── */}
            <section
                className="relative overflow-hidden py-24 sm:py-32 text-center"
                style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 0%, rgb(var(--brand-400) / 0.22) 0%, transparent 70%), rgb(var(--brand-950))' }}
            >
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                        maskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 50%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 50% 0%, black 50%, transparent 100%)',
                    }}
                />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Badge text="Official Affiliate Partner Network" />

                    <h1 className="mt-6 text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none">
                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-teal-300">BotifyAI Affiliate Network</span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                        One network, hundreds of products. Browse the catalog, pick what fits your audience, and earn a commission on every sale.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={joinUrl}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-purple-600/25 hover:from-purple-500 hover:to-indigo-500 transition-all transform active:scale-98"
                        >
                            <span>Join the Network</span>
                            <ArrowRight className="h-5 w-5" />
                        </Link>

                        <Link
                            href={loginUrl}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 px-6 py-4 text-sm font-semibold text-white/90 backdrop-blur-md border border-white/15 transition-all"
                        >
                            <span>Already an affiliate? Log in</span>
                        </Link>
                    </div>

                    {/* Trust indicators */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-neutral-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Verified Multi-Vendor Catalog</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Instant 30-Day Attribution</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Guaranteed Regular Payouts</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 2. Why Join Section ── */}
            <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-neutral-900/60 border-y border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <Badge text="Why Join Our Network" icon={Award} />
                        <h2 className="mt-4 text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                            Built for Creators, Promoters & Affiliates
                        </h2>
                        <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-sm sm:text-base">
                            Skip the friction of managing dozens of individual affiliate programs. We give you a single unified engine to monetize your audience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {WHY_JOIN_ITEMS.map((item, idx) => (
                            <div
                                key={idx}
                                className={`p-8 rounded-3xl bg-white dark:bg-neutral-900 border ${item.border} shadow-sm hover:shadow-md transition-all space-y-4`}
                            >
                                <div className={`p-3 w-fit rounded-2xl ${item.iconColor}`}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 3. How It Works Section ── */}
            <section className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <Badge text="Simple 4-Step Flow" icon={Zap} />
                        <h2 className="mt-4 text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                            How the Network Works
                        </h2>
                        <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-sm sm:text-base">
                            From sign-up to your first commission payout in four straightforward steps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        {HOW_IT_WORKS_STEPS.map((step, idx) => (
                            <div
                                key={idx}
                                className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 relative group hover:border-purple-500/50 transition-all"
                            >
                                <span className="text-3xl font-black text-purple-600/40 dark:text-purple-400/30 group-hover:text-purple-600 transition-colors">
                                    {step.step}
                                </span>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                    {step.title}
                                </h3>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 4. Commission & Payouts Section ── */}
            <section className="py-20 sm:py-28 bg-neutral-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <Badge text="Transparent Economics" icon={DollarSign} />
                        <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
                            Commission & Payout Policy
                        </h2>
                        <p className="mt-3 text-neutral-400 text-sm sm:text-base leading-relaxed">
                            Commission isn’t one flat number — it’s set per product by whoever’s selling it. Below are our platform-wide standards governing every transaction.
                        </p>
                    </div>

                    {/* Platform Standards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                        <div className="p-6 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                                <Clock className="h-4 w-4" />
                                Cookie Window
                            </div>
                            <div className="text-2xl font-black text-white">30 Days</div>
                            <p className="text-xs text-neutral-400">
                                Purchases made within 30 days of clicking your link are credited to you.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 space-y-2">
                            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                <Calendar className="h-4 w-4" />
                                Payout Schedule
                            </div>
                            <div className="text-2xl font-black text-white">Bi-Weekly / Monthly</div>
                            <p className="text-xs text-neutral-400">
                                Consistent, reliable disbursements distributed directly to your account.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                <DollarSign className="h-4 w-4" />
                                Minimum Payout
                            </div>
                            <div className="text-2xl font-black text-white">₦10,000 / $25</div>
                            <p className="text-xs text-neutral-400">
                                Low threshold making it fast and simple to withdraw your initial earnings.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 space-y-2">
                            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                                <CreditCard className="h-4 w-4" />
                                Payment Methods
                            </div>
                            <div className="text-2xl font-black text-white">Bank, Paystack, Stripe</div>
                            <p className="text-xs text-neutral-400">
                                Direct electronic bank transfers and supported online gateways.
                            </p>
                        </div>
                    </div>

                    {/* Catalog Commission Callout Banner */}
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-neutral-800 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                            <h4 className="font-bold text-base text-white flex items-center justify-center md:justify-start gap-2">
                                <Sparkles className="h-4 w-4 text-yellow-400" />
                                Compare Rates Transparently
                            </h4>
                            <p className="text-xs text-neutral-300">
                                Each product's commission rate is displayed clearly on its catalog listing so you can compare earnings before picking what to promote.
                            </p>
                        </div>

                        <Link
                            href={joinUrl}
                            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
                        >
                            Browse Products & Rates
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── 5. Affiliate Dashboard Preview Section ── */}
            <section className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Left: Description & Bullets */}
                        <div className="lg:col-span-6 space-y-6">
                            <Badge text="Affiliate Dashboard" icon={Layers} />
                            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                                Your Command Center for Earning
                            </h2>
                            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                Once enrolled, you gain instant access to our modern, intuitive partner dashboard designed to maximize your promotion efficiency.
                            </p>

                            <div className="space-y-4 pt-2">
                                {DASHBOARD_FEATURES.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3.5">
                                        <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                                                {feature.title}
                                            </h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                {feature.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4">
                                <Link
                                    href={joinUrl}
                                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all"
                                >
                                    <span>Access Your Dashboard</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Right: Visual Dashboard Mockup Card */}
                        <div className="lg:col-span-6">
                            <div className="rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-6 sm:p-8 shadow-2xl text-white space-y-6">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs">
                                            AFF
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold">Partner Hub Preview</div>
                                            <div className="text-[10px] text-neutral-400">Live Analytics & Catalog</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Active Network
                                    </span>
                                </div>

                                {/* Mock Stats Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-[10px] text-neutral-400">Total Clicks</div>
                                        <div className="text-lg font-black mt-0.5">1,420</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-[10px] text-neutral-400">Conversion</div>
                                        <div className="text-lg font-black mt-0.5 text-emerald-400">8.4%</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-[10px] text-neutral-400">Earnings</div>
                                        <div className="text-lg font-black mt-0.5 text-purple-300">₦184,500</div>
                                    </div>
                                </div>

                                {/* Mock Catalog Row */}
                                <div className="space-y-2">
                                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                                        Featured Marketplace Items
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                                        <div>
                                            <div className="font-bold text-white">Full-Stack AI SaaS Masterclass</div>
                                            <div className="text-[10px] text-neutral-400">Digital Course · 30% Commission</div>
                                        </div>
                                        <span className="text-xs font-black text-emerald-400">₦15,000 / sale</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                                        <div>
                                            <div className="font-bold text-white">E-Commerce Automation Toolkit</div>
                                            <div className="text-[10px] text-neutral-400">Software Asset · 25% Commission</div>
                                        </div>
                                        <span className="text-xs font-black text-emerald-400">₦8,750 / sale</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 6. FAQ Section ── */}
            <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <Badge text="Frequently Asked Questions" icon={HelpCircle} />
                        <h2 className="mt-4 text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                            Got Questions? We’ve Got Answers.
                        </h2>
                        <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-sm sm:text-base">
                            Everything you need to know about joining, promoting, tracking, and getting paid.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {FAQS.map((faq, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown
                                            className={`h-5 w-5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                                                isOpen ? 'rotate-180 text-purple-600' : ''
                                            }`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── 7. Closing CTA Section ── */}
            <section
                className="py-20 sm:py-28 text-center relative overflow-hidden"
                style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgb(var(--brand-400) / 0.25) 0%, transparent 70%), rgb(var(--brand-950))' }}
            >
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
                    <Badge text="Start Today" />

                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                        Ready to start earning across a whole network of products?
                    </h2>

                    <p className="text-sm sm:text-base text-neutral-300 max-w-xl mx-auto leading-relaxed">
                        Join the BotifyAI Affiliate Network today. Access top-performing products, copy your unique links, and earn recurring payouts.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={joinUrl}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-purple-600/25 hover:from-purple-500 hover:to-indigo-500 transition-all transform active:scale-98"
                        >
                            <span>Join the Network</span>
                            <ArrowRight className="h-5 w-5" />
                        </Link>

                        <Link
                            href={loginUrl}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 px-6 py-4 text-sm font-semibold text-white/90 backdrop-blur-md border border-white/15 transition-all"
                        >
                            <span>Log In to Dashboard</span>
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
