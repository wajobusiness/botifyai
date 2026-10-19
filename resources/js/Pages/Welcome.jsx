import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from 'react-i18next';
import { useBranding } from '@/hooks/useBranding';
import {
    Sparkles, ArrowRight, ShoppingBag, BookOpen, Bot,
    Zap, Users, CheckCircle2, ShieldCheck, Download,
    Layers, Video, Star, MessageSquare, Globe, TrendingUp,
    Store, Smartphone, CreditCard, Clock, ChevronRight,
    Check, X, Lock, FileText, Layout, Music, Code,
    Package, Headphones, Send, GraduationCap, ChevronDown
} from 'lucide-react';

// ─── Section Badge ─────────────────────────────────────────────────────────────

function SectionBadge({ text, icon: Icon = Sparkles }) {
    if (!text) return null;
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold px-3.5 py-1.5 border border-brand-500/20 uppercase tracking-wider">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {text}
        </span>
    );
}

// ─── Section 1: Hero Section ──────────────────────────────────────────────────

function HeroCreatorSection({ landing, canRegister, auth }) {
    const s = (key, def = '') => landing[`landing.${key}`] ?? def;
    if (s('hero_enabled', '1') !== '1') return null;

    const heroTitle = s('hero_title', 'Turn What You Know into an Automated Digital Business.');
    const heroSubtitle = s(
        'hero_subtitle',
        'Sell video courses, ebooks, and digital products with instant global checkouts—while your 24/7 autonomous AI agents market, answer questions, and close sales directly inside WhatsApp & Instagram DMs.'
    );

    return (
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-white dark:bg-neutral-950">
            {/* Soft Ambient Radial Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(239,68,68,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(239,68,68,0.12),rgba(0,0,0,0))] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                {/* Category Badge */}
                <div className="mb-6 flex justify-center">
                    <SectionBadge text="✨ THE AI-POWERED CREATOR COMMERCE PLATFORM" />
                </div>

                {/* Primary Hero Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white max-w-4xl mx-auto leading-[1.12]">
                    Turn What You Know into an{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-rose-600 to-amber-600">
                        Automated Digital Business.
                    </span>
                </h1>

                {/* Supporting Copy */}
                <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
                    {heroSubtitle}
                </p>

                {/* CTA Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    {auth?.user ? (
                        <Link
                            href={typeof route === 'function' && typeof route().has === 'function' && route().has('client.dashboard') ? route('client.dashboard') : '/app'}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
                        >
                            Go to Dashboard
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : (
                        <>
                            {canRegister && (
                                <Link
                                    href="/register"
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2 group"
                                >
                                    Start Selling for Free
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            )}
                            <Link
                                href="/creators"
                                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-white font-semibold text-base border border-neutral-300 dark:border-neutral-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="h-4 w-4 text-brand-600" />
                                Explore Live Demo Store
                            </Link>
                        </>
                    )}
                </div>

                {/* Trust Signals & Microcopy */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Zero platform fees on Pro
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Instant tokenized delivery
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Multi-currency: USD, NGN, KES, ZAR, GBP
                    </span>
                </div>

                {/* Dual Visual Showcase: Creator Storefront + WhatsApp Sale Moment */}
                <div className="mt-14 max-w-5xl mx-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 p-4 sm:p-7 shadow-xl backdrop-blur-sm text-left">
                    <div className="grid md:grid-cols-2 gap-6 items-stretch">
                        {/* Left Card: Verified Creator Storefront Preview */}
                        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex flex-col justify-between shadow-sm">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <Sparkles className="h-3 w-3" />
                                        Verified Creator Storefront
                                    </span>
                                    <span className="text-xs font-mono text-neutral-400">botifyai.cloud/store/marcus</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white leading-snug">
                                    Full-Stack AI Creator Masterclass & Template Vault
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    Comprehensive video course curriculum, downloadable prompt library, and tokenized automation recipes.
                                </p>

                                <div className="mt-4 space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        <span>12 HD Video Modules (Botify Academy)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        <span>Encrypted Single-Use Download Tokens</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        <span>Instant WhatsApp Fulfillment & Login Link</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <div>
                                    <span className="text-2xl font-black text-neutral-900 dark:text-white">$49</span>
                                    <span className="text-xs text-neutral-400 line-through ml-2">$120</span>
                                    <p className="text-[10px] text-neutral-500">One-time payment • Lifetime access</p>
                                </div>
                                <Link
                                    href="/creators"
                                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                                >
                                    <ShoppingBag className="h-3.5 w-3.5" />
                                    Buy Now
                                </Link>
                            </div>
                        </div>

                        {/* Right Card: Clean WhatsApp In-Chat Sales Closer */}
                        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-[#EFEAE2] dark:bg-[#0B141A] p-5 flex flex-col justify-between shadow-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-neutral-300/60 dark:border-neutral-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                        WA
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                                            Botify AI Sales Specialist
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                        </p>
                                        <p className="text-[10px] text-neutral-500">Official WhatsApp Business API</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                                    24/7 Active
                                </span>
                            </div>

                            {/* Message Exchange */}
                            <div className="my-4 space-y-3 text-xs">
                                <div className="flex justify-end">
                                    <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-[#DCF8C6] dark:bg-[#005C4B] text-neutral-900 dark:text-white p-3 shadow-sm">
                                        <p>Hi! Does this masterclass cover Laravel + React integrations, or is it just theory?</p>
                                        <span className="text-[9px] text-neutral-500 dark:text-white/60 block text-right mt-1">11:14 PM ✓✓</span>
                                    </div>
                                </div>

                                <div className="flex justify-start">
                                    <div className="max-w-[90%] rounded-2xl rounded-tl-none bg-white dark:bg-[#202C33] text-neutral-900 dark:text-neutral-100 p-3 shadow-sm border border-neutral-200/60 dark:border-neutral-700/50 space-y-2">
                                        <p className="leading-relaxed">
                                            Hello Sarah! Absolutely. Module 3 walks through complete production code using Laravel 11, Inertia.js, and React 18 with multi-tenant tokenized downloads.
                                        </p>
                                        <div className="p-2.5 rounded-xl border border-brand-500/20 bg-brand-50/50 dark:bg-brand-950/40">
                                            <div className="flex justify-between items-center font-bold text-neutral-900 dark:text-white">
                                                <span>AI Creator Masterclass</span>
                                                <span className="text-brand-600 dark:text-brand-400">$49 USD</span>
                                            </div>
                                            <span className="mt-2 block w-full text-center py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-neutral-950 font-bold text-xs shadow-sm transition">
                                                Complete Order in WhatsApp →
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-neutral-400 block text-right">11:14 PM</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-center text-neutral-500 dark:text-neutral-400">
                                💡 AI handles inquiries, answers syllabus questions, and closes orders 24/7.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Section 2: Social Proof & Trust Metrics Band ────────────────────────────

function SocialProofBand({ landing }) {
    const s = (key, def = '') => landing[`landing.${key}`] ?? def;
    if (s('stats_enabled', '1') !== '1') return null;

    const metrics = [
        { value: '$14.2M+', label: 'Creator Revenue Generated' },
        { value: '500,000+', label: 'Digital Downloads & Enrollments' },
        { value: '60+', label: 'Global Currencies Supported' },
        { value: '4.2x', label: 'Higher In-Chat Conversion Rate' },
    ];

    return (
        <section className="py-12 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-8">
                    TRUSTED BY OVER 12,000+ CREATORS, EDUCATORS, AND DIGITAL BUSINESSES WORLDWIDE
                </p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                    {metrics.map((m, idx) => (
                        <div key={idx} className="p-4">
                            <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                                {m.value}
                            </p>
                            <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                                {m.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-neutral-400 dark:text-neutral-500">
                    <span>⚡ Stripe Verified Partner</span>
                    <span>•</span>
                    <span>🔒 Paystack Official Integration</span>
                    <span>•</span>
                    <span>📱 Meta Business Tech Provider</span>
                    <span>•</span>
                    <span>🌐 PayPal Global Merchant</span>
                </div>
            </div>
        </section>
    );
}

// ─── Section 3: CREATE — "Turn Your Knowledge into Digital Assets" ───────────

function CreateVaultSection() {
    const productTypes = [
        {
            icon: Video,
            tag: 'ZERO STUDENT CAPS',
            title: 'Video Masterclasses & Courses (Botify Academy)',
            desc: 'Build structured video curriculums with modules, video lectures, downloadable resources, and student progress tracking. Never pay $159/month for Teachable or Kajabi again.',
            link: '/courses',
            cta: 'Explore Course Engine →',
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500/10',
        },
        {
            icon: BookOpen,
            tag: 'INSTANT TOKEN DELIVERY',
            title: 'Ebooks, Guides & Workbooks',
            desc: 'Distribute guides, research reports, workbooks, and checklists with single-use encrypted download links that prevent unauthorized link forwarding.',
            link: '/sell-digital-products',
            cta: 'Explore Ebook Vaults →',
            color: 'text-brand-600 dark:text-brand-400',
            bg: 'bg-brand-500/10',
        },
        {
            icon: Layout,
            tag: 'AUTOMATED ACCESS',
            title: 'Notion, Figma & Design Templates',
            desc: 'Perfect for UI designers, productivity creators, and developers. Deliver instant template duplication links and asset bundles the second payment confirms.',
            link: '/sell-digital-products',
            cta: 'Explore Template Delivery →',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10',
        },
        {
            icon: Package,
            tag: 'MULTI-FILE VAULTS',
            title: 'Presets, Audio & Asset Packs',
            desc: 'Package multiple compressed files into a single product vault. High-speed global CDN delivery ensures instant, frustration-free customer downloads.',
            link: '/sell-digital-products',
            cta: 'Explore Asset Delivery →',
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
        },
        {
            icon: Code,
            tag: 'AUTOMATED KEYS',
            title: 'Software, Plugins & Code Licenses',
            desc: 'Sell WordPress plugins, developer boilerplates, SaaS scripts, and automation recipes with automated single-seat license generation upon checkout.',
            link: '/sell-digital-products',
            cta: 'Explore Software Vaults →',
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
        },
    ];

    return (
        <section className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <SectionBadge text="STEP 01: CREATE" />
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                        If You Can Create It, You Can Monetize It on BotifyAI
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        No complicated web development, no expensive plugin licenses. Package your expertise into beautiful, high-converting digital assets in under 5 minutes.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productTypes.map((pt, i) => {
                        const Icon = pt.icon;
                        return (
                            <div
                                key={i}
                                className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/50 p-7 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`h-11 w-11 rounded-2xl ${pt.bg} ${pt.color} flex items-center justify-center`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                            {pt.tag}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors">
                                        {pt.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                                        {pt.desc}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-neutral-200/70 dark:border-neutral-800">
                                    <Link
                                        href={pt.link}
                                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:gap-2 transition-all"
                                    >
                                        {pt.cta}
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Section 4: SELL — "Your Branded Storefront & Frictionless Checkout" ─────

function StorefrontCheckoutSection() {
    const sellFeatures = [
        {
            icon: Store,
            title: 'Branded Creator Storefront',
            desc: 'Your dedicated home on the web (botifyai.cloud/store/yourname). Showcase your full catalog, bio, reviews, and featured bundles with customized brand colors and fonts.',
        },
        {
            icon: CreditCard,
            title: 'Multi-Currency Global Payments',
            desc: 'Accept payments via Credit Cards, Apple Pay, Google Pay, PayPal, and regional bank transfers in USD, EUR, GBP, NGN, KES, ZAR, GHS, and more.',
        },
        {
            icon: Lock,
            title: 'Cryptographic Tokenized Downloads',
            desc: 'Goodbye leaked Google Drive folders. BotifyAI generates single-use, time-expiring download tokens delivered straight to the buyer’s WhatsApp and email.',
        },
        {
            icon: Users,
            title: 'Built-In 1-Click Affiliate Engine',
            desc: 'Turn your community and students into your top sales team. Set custom commission percentages (10% to 75%), generate tracked referral links, and let BotifyAI handle payout accounting.',
        },
    ];

    return (
        <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <SectionBadge text="STEP 02: SELL" />
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                        A Frictionless Checkout Experience Built to Convert Worldwide
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Give your audience a lightning-fast buying experience. Accept local and international payments with zero drop-off, backed by automated anti-piracy delivery.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {sellFeatures.map((feat, i) => {
                        const Icon = feat.icon;
                        return (
                            <div
                                key={i}
                                className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                    {feat.title}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    {feat.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Section 5: GROW WITH AI — "The Engine Other Creator Platforms Don't Have" ──

function GrowWithAiSection() {
    return (
        <section className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <SectionBadge text="STEP 03: GROW WITH AI" />
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                        Why Traditional Creator Platforms Leave 70% of Your Revenue on the Table
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        On Gumroad or Selar, you post a link in bio and pray. On BotifyAI, your business has an active, autonomous AI sales force working for you 24/7.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                    {/* The Traditional Creator Way */}
                    <div className="rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-8 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                The Traditional Way (Passive & Leaky)
                            </span>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-2 mb-6">
                                Passive Links with Zero In-Chat Intelligence
                            </h3>
                            <ul className="space-y-4 text-sm text-neutral-700 dark:text-neutral-300">
                                <li className="flex items-start gap-3">
                                    <X className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <span>Prospect clicks link in bio at 11:30 PM with a question before buying.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <X className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <span>Nobody is awake to answer. The prospect hesitates and closes the tab.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <X className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <span>No automated in-chat cart recovery or objection handling.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <X className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <span>You are forced to buy ManyChat, Zapier, and Teachable just to connect the dots.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="mt-8 pt-4 border-t border-rose-200/60 dark:border-rose-900/40">
                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                                Result: Up to 70% lost sales due to slow responses and friction.
                            </p>
                        </div>
                    </div>

                    {/* The BotifyAI Way */}
                    <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-8 flex flex-col justify-between shadow-sm">
                        <div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                The BotifyAI Way (Active & Autonomous)
                            </span>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-2 mb-6">
                                24/7 AI Sales Reps Closing Deals In-Chat
                            </h3>
                            <ul className="space-y-4 text-sm text-neutral-700 dark:text-neutral-300">
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span>Prospect sends an Instagram DM or WhatsApp message at midnight.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span>Grounded AI answers instantly with syllabus details, pricing, and currency options.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span>AI drops an instant payment link directly in the chat with zero navigation friction.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span>Payment clears; download tokens and course login are sent instantly.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="mt-8 pt-4 border-t border-emerald-200/60 dark:border-emerald-900/40">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                Result: 4.2x higher conversion rate and continuous sales while you sleep.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Section 6: THE AI ADVANTAGE — "Your 24/7 Behind-the-Scenes Sales Team" ─

function AiAdvantageWorkflow() {
    const steps = [
        {
            num: '01',
            title: 'Instant Inbound Engagement',
            desc: 'A prospect DMs your WhatsApp or Instagram asking: "Does this masterclass cover React integrations?" Your AI agent replies in under 2 seconds with exact, verified curriculum facts.',
        },
        {
            num: '02',
            title: 'Intelligent Objection Handling',
            desc: 'When the prospect asks: "Can I pay with local currency?", the AI detects their location, explains regional pricing options (e.g. NGN, ZAR, KES, USD), and generates a direct mobile checkout link.',
        },
        {
            num: '03',
            title: 'In-Chat Purchase & Token Delivery',
            desc: 'The buyer completes checkout on their phone. The AI immediately delivers the cryptographically signed download token and Botify Academy magic login link inside the conversation.',
        },
        {
            num: '04',
            title: 'Automated CRM & Follow-Up',
            desc: 'The customer contact is automatically recorded, tagged in your BotifyAI CRM, and scheduled for automated onboarding reminders and review requests without lifting a finger.',
        },
    ];

    return (
        <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <SectionBadge text="AUTONOMOUS COMMERCE INTELLIGENCE" />
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                        Trained on Your Content. Fluent in Your Voice. Closing Sales 24/7.
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Upload your syllabus, product manuals, or FAQ docs. BotifyAI creates a private, grounded sales specialist that knows your offerings inside and out—with zero hallucinations.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((st, i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                <span className="text-3xl font-black text-brand-600/30 dark:text-brand-400/30">
                                    {st.num}
                                </span>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-3 mb-2">
                                    {st.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    {st.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Section 7: WHO IS IT FOR? — Tailored Creator Segments ──────────────────

function AudienceSegmentsSection() {
    const segments = [
        {
            title: 'Course Creators & Educators',
            desc: 'Replace expensive $159/month course platforms. Host unlimited video masterclasses, organize modules, and automate student credential delivery via WhatsApp.',
            icon: Video,
        },
        {
            title: 'Authors, Researchers & Writers',
            desc: 'Sell protected ebooks, industry reports, and whitepapers with single-use download tokens that prevent piracy and leaked files.',
            icon: BookOpen,
        },
        {
            title: 'Coaches & Consultants',
            desc: 'Monetize strategy blueprints, onboarding questionnaires, and group masterclasses with automated client intake and in-chat follow-up.',
            icon: Users,
        },
        {
            title: 'UI/UX & Template Designers',
            desc: 'Sell Notion workspaces, Figma UI kits, and Canva templates with instant duplication links and multi-file asset delivery.',
            icon: Layout,
        },
        {
            title: 'Developers & Technical Founders',
            desc: 'Sell code boilerplates, API scripts, and micro-SaaS software packages with automated license key fulfillment.',
            icon: Code,
        },
        {
            title: 'Agencies & Digital Communities',
            desc: 'Run private client resource portals, deliver recurring digital downloads, and mobilize hundreds of affiliates with real-time payout tracking.',
            icon: Globe,
        },
    ];

    return (
        <section className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <SectionBadge text="BUILT FOR KNOWLEDGE CREATORS" />
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                        Designed for Anyone Monetizing Digital Value
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Whether you are an individual educator, an indie hacker, or an established consulting agency, BotifyAI adapts to your monetization model.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {segments.map((seg, i) => {
                        const Icon = seg.icon;
                        return (
                            <div
                                key={i}
                                className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/50 p-6 shadow-sm hover:border-brand-500/40 transition-colors"
                            >
                                <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
                                    {seg.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    {seg.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Section 8: Comparison Positioning — "Why Creators Choose BotifyAI" ─────

function ComparisonTableSection() {
    const comparisons = [
        {
            feature: 'Digital Product Vault (Tokenized)',
            botify: true,
            gumroad: true,
            selar: true,
            kajabi: true,
            manychat: false,
        },
        {
            feature: 'Video Course Hosting & Progress',
            botify: true,
            gumroad: false,
            selar: 'Basic',
            kajabi: true,
            manychat: false,
        },
        {
            feature: 'Autonomous AI In-Chat Sales Rep',
            botify: true,
            gumroad: false,
            selar: false,
            kajabi: false,
            manychat: 'Basic Rules',
        },
        {
            feature: 'Meta Cloud WhatsApp & Instagram Integration',
            botify: true,
            gumroad: false,
            selar: false,
            kajabi: false,
            manychat: true,
        },
        {
            feature: 'Built-in Affiliate Network & Payouts',
            botify: true,
            gumroad: true,
            selar: true,
            kajabi: true,
            manychat: false,
        },
        {
            feature: 'Multi-Currency Checkouts (USD, NGN, KES, ZAR)',
            botify: true,
            gumroad: 'Limited',
            selar: true,
            kajabi: 'Limited',
            manychat: false,
        },
        {
            feature: 'Platform Transaction Fee',
            botifyText: '0% on Pro',
            gumroadText: '10% + fees',
            selarText: '4% - 10%',
            kajabiText: '0% ($159/mo)',
            manychatText: 'N/A',
        },
    ];

    return (
        <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <SectionBadge text="THE UNFAIR ADVANTAGE" />
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                        How BotifyAI Compares to Other Platforms
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        See why creators are ditching fragmented multi-tool setups for BotifyAI.
                    </p>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold">
                            <tr>
                                <th className="py-4 px-6">Capability</th>
                                <th className="py-4 px-6 text-brand-600 dark:text-brand-400 bg-brand-500/10">BotifyAI</th>
                                <th className="py-4 px-6 text-neutral-500">Gumroad</th>
                                <th className="py-4 px-6 text-neutral-500">Selar</th>
                                <th className="py-4 px-6 text-neutral-500">Kajabi</th>
                                <th className="py-4 px-6 text-neutral-500">ManyChat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {comparisons.map((row, i) => (
                                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                    <td className="py-4 px-6 font-semibold text-neutral-800 dark:text-neutral-200">
                                        {row.feature}
                                    </td>
                                    <td className="py-4 px-6 bg-brand-500/5 font-bold text-brand-600 dark:text-brand-400">
                                        {row.botifyText ? (
                                            row.botifyText
                                        ) : row.botify ? (
                                            <Check className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                        {row.gumroadText ? (
                                            row.gumroadText
                                        ) : row.gumroad ? (
                                            <Check className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-neutral-400" />
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                        {row.selarText ? (
                                            row.selarText
                                        ) : typeof row.selar === 'string' ? (
                                            row.selar
                                        ) : row.selar ? (
                                            <Check className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-neutral-400" />
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                        {row.kajabiText ? (
                                            row.kajabiText
                                        ) : row.kajabi ? (
                                            <Check className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-neutral-400" />
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                        {row.manychatText ? (
                                            row.manychatText
                                        ) : typeof row.manychat === 'string' ? (
                                            row.manychat
                                        ) : row.manychat ? (
                                            <Check className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-neutral-400" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

// ─── Section 9: Pricing Section ──────────────────────────────────────────────

function PricingSection({ plans }) {
    const { t } = useTranslation();
    const [yearly, setYearly] = useState(false);
    if (!plans || !plans.length) return null;

    return (
        <section id="pricing" className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <SectionBadge text="TRANSPARENT PLANS" />
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                        Simple, Honest Pricing. Zero Hidden Fees.
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
                        Keep 100% of your earnings on Pro. Upgrade or cancel anytime.
                    </p>

                    <div className="mt-8 inline-flex items-center gap-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1">
                        <button
                            onClick={() => setYearly(false)}
                            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                                !yearly
                                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                                    : 'text-neutral-500 dark:text-neutral-400'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setYearly(true)}
                            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                                yearly
                                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                                    : 'text-neutral-500 dark:text-neutral-400'
                            }`}
                        >
                            Yearly
                            <span className="ml-1.5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs px-2 py-0.5 font-bold">
                                -20%
                            </span>
                        </button>
                    </div>
                </div>

                <div className={`grid gap-6 ${plans.length <= 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                    {plans.map((plan) => {
                        const price = yearly ? plan.price_yearly : plan.price_monthly;
                        const priceDisplay = yearly ? plan.yearly_price_display : plan.monthly_price_display;
                        const isFree = plan.is_free || price === 0;

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-3xl border p-8 flex flex-col justify-between ${
                                    plan.is_featured
                                        ? 'border-brand-500 bg-brand-950 text-white shadow-2xl lg:scale-105'
                                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900'
                                }`}
                            >
                                {plan.is_featured && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <span className="rounded-full text-xs font-bold px-3 py-1 shadow bg-brand-600 text-white">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <h3 className={`text-xl font-bold ${plan.is_featured ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
                                        {plan.name}
                                    </h3>
                                    {plan.description && (
                                        <p className={`mt-2 text-xs sm:text-sm ${plan.is_featured ? 'text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                            {plan.description}
                                        </p>
                                    )}

                                    <div className="mt-5 mb-6">
                                        <span className={`text-4xl font-extrabold ${plan.is_featured ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
                                            {isFree ? 'Free' : (priceDisplay || `${plan.currency_symbol || '$'}${parseFloat(price).toLocaleString()}`)}
                                        </span>
                                        {!isFree && (
                                            <span className={`text-sm ml-1.5 ${plan.is_featured ? 'text-neutral-400' : 'text-neutral-400'}`}>
                                                {yearly ? '/year' : '/month'}
                                            </span>
                                        )}
                                    </div>

                                    {plan.features && plan.features.length > 0 && (
                                        <ul className="space-y-3 mb-8 text-xs sm:text-sm">
                                            {plan.features.map((feat, fi) => (
                                                <li key={fi} className="flex items-start gap-2.5">
                                                    <CheckCircle2
                                                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                                            plan.is_featured ? 'text-brand-400' : 'text-emerald-500'
                                                        }`}
                                                    />
                                                    <span className={plan.is_featured ? 'text-neutral-200' : 'text-neutral-700 dark:text-neutral-300'}>
                                                        {feat}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <Link
                                    href="/register"
                                    className={`block text-center rounded-2xl py-3.5 text-sm font-bold transition-all ${
                                        plan.is_featured
                                            ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                                            : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100'
                                    }`}
                                >
                                    {plan.is_featured ? 'Get Started Pro' : 'Choose Plan'}
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Section 10: Testimonials Section ────────────────────────────────────────

function TestimonialsSection({ landing }) {
    const s = (key, def = '') => landing[`landing.${key}`] ?? def;
    if (s('testimonials_enabled', '1') !== '1') return null;

    const testimonials = [
        {
            name: 'Marcus Vance',
            role: 'Fintech Educator & Consultant',
            text: 'Moving my video masterclass from Teachable to BotifyAI saved me $180 every month. Plus, the WhatsApp AI agent closed 42 students who abandoned their checkout.',
        },
        {
            name: 'Elena Rostova',
            role: 'UI/UX Design Kit Author',
            text: 'The tokenized download link is pure genius. No more shared Google Drive links leaking on Twitter. My digital design kit sales doubled in two weeks.',
        },
        {
            name: 'David Chen',
            role: 'Fitness Creator & Coach',
            text: 'I have 18 affiliates sending WhatsApp traffic to my fitness guides. The built-in affiliate engine handles tracking and payouts without any spreadsheets.',
        },
    ];

    return (
        <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <SectionBadge text="REAL CREATOR RESULTS" />
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                        Loved by Creators, Authors & Agency Owners
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, idx) => (
                        <div
                            key={idx}
                            className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 flex flex-col justify-between shadow-sm"
                        >
                            <div>
                                <div className="flex gap-1 text-amber-400 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-current" />
                                    ))}
                                </div>
                                <blockquote className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                                    &ldquo;{t.text}&rdquo;
                                </blockquote>
                            </div>
                            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <p className="text-sm font-bold text-neutral-900 dark:text-white">{t.name}</p>
                                <p className="text-xs text-neutral-500">{t.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Section 11: FAQ Section ──────────────────────────────────────────────────

function FaqSection({ landing }) {
    const s = (key, def = '') => landing[`landing.${key}`] ?? def;
    const [open, setOpen] = useState(null);
    if (s('faq_enabled', '1') !== '1') return null;

    const faqs = [
        {
            q: 'How is BotifyAI different from Gumroad, Selar, or Kajabi?',
            a: 'Traditional platforms give you a passive checkout page and take 5% to 10% of every sale, plus $150+/month for course hosting. BotifyAI gives you the complete digital product vault and course engine PLUS an autonomous 24/7 AI sales agent that directly chats with leads on WhatsApp & Instagram DM, answers questions, handles objections, and generates instant checkout links.',
        },
        {
            q: 'Can I host both video courses and downloadable files?',
            a: 'Yes! BotifyAI includes both the Digital Product Vault (tokenized PDF, ZIP, presets, templates) and Botify Academy (unlimited video courses, modules, lessons, student dashboards, and completion tracking) in one single account.',
        },
        {
            q: 'How does the 24/7 AI sales rep sell my products?',
            a: 'You upload your course curriculum, product description, or FAQ guide. BotifyAI trains a private, grounded RAG agent. When a follower sends a message on Instagram or WhatsApp, the AI answers questions in natural, friendly language and drops an instant multi-currency checkout link.',
        },
        {
            q: 'What payment gateways and currencies are supported?',
            a: 'We support global cards via Stripe, PayPal, and regional providers including Flutterwave and Paystack. You can sell in USD, EUR, GBP, NGN, KES, ZAR, and more, with instant automated delivery upon confirmation.',
        },
        {
            q: 'Are there platform fees on my sales?',
            a: 'On our Pro and Business plans, there are zero platform fees (0%). You keep 100% of your earnings minus standard payment processing fees.',
        },
        {
            q: 'Can I recruit affiliates to promote my digital products?',
            a: 'Yes! BotifyAI has a built-in Affiliate Network. Set custom commission percentages (e.g. 20% or 40%), generate trackable referral links, and our system tracks conversions and payouts automatically.',
        },
    ];

    return (
        <section id="faq" className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <SectionBadge text="GOT QUESTIONS?" />
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 overflow-hidden"
                        >
                            <button
                                className="w-full flex items-center justify-between p-5 text-left gap-4 font-bold text-neutral-900 dark:text-white text-base hover:text-brand-600 transition-colors"
                                onClick={() => setOpen(open === idx ? null : idx)}
                            >
                                <span>{faq.q}</span>
                                <ChevronDown
                                    className={`h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform duration-200 ${
                                        open === idx ? 'rotate-180 text-brand-600' : ''
                                    }`}
                                />
                            </button>
                            {open === idx && (
                                <div className="px-5 pb-5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 pt-3">
                                    <p>{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Section 12: Final Conversion CTA & Risk Reversal ────────────────────────

function FinalCtaSection({ canRegister }) {
    return (
        <section className="py-20 sm:py-28 bg-gradient-to-r from-brand-600 via-rose-600 to-brand-700 text-white text-center relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                    Your Knowledge is Valuable. Start Selling It Automatically.
                </h2>
                <p className="mt-4 text-base sm:text-lg text-rose-100 max-w-2xl mx-auto leading-relaxed">
                    Join thousands of creators who turned their knowledge, courses, and digital assets into a 24/7 revenue engine. Setup takes less than 15 minutes.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    {canRegister && (
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-brand-600 hover:bg-neutral-100 font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            Launch Your Digital Business Free
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                    <Link
                        href="/contact"
                        className="w-full sm:w-auto px-7 py-4 rounded-full bg-brand-700/60 hover:bg-brand-700 text-white font-semibold text-base border border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        Schedule a 1-on-1 Tour
                    </Link>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-rose-100 font-medium">
                    <span>✓ No credit card required</span>
                    <span>•</span>
                    <span>✓ 0% platform transaction fees on Pro</span>
                    <span>•</span>
                    <span>✓ Keep 100% ownership of your customers</span>
                </div>
            </div>
        </section>
    );
}

// ─── Main Welcome Page Component ──────────────────────────────────────────────

export default function Welcome({ auth, canLogin, canRegister, landing = {}, plans = [] }) {
    const { appName } = useBranding();
    const s = (key, def = '') => landing[`landing.${key}`] ?? def;

    const metaTitle = 'BotifyAI — The AI-Powered Creator Commerce Platform | Sell Courses & Digital Products';
    const metaDesc =
        'Create, sell, and automate your digital business. Host video courses, sell ebooks and templates, and deploy 24/7 AI sales agents on WhatsApp & Instagram with 0% platform fees.';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: appName || 'BotifyAI',
            url: origin || undefined,
            logo: origin ? `${origin}/favicon.ico` : undefined,
            description: metaDesc,
        },
        {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'BotifyAI Creator Commerce Platform',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: metaDesc,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '1280' },
        },
    ];

    return (
        <LandingLayout>
            <SeoHead
                title={metaTitle}
                description={metaDesc}
                keywords="creator commerce, sell digital products, course hosting platform, AI sales agent, WhatsApp ecommerce, sell ebooks online, Selar alternative, Gumroad alternative, Kajabi alternative, digital product vault"
                image={s('seo_og_image') || undefined}
                jsonLd={jsonLd}
            />

            {/* 1. Hero Section (Clean Light Canvas with Dual Storefront & Chat Preview) */}
            <HeroCreatorSection landing={landing} canRegister={canRegister} auth={auth} />

            {/* 2. Social Proof & Trust Metrics Band */}
            <SocialProofBand landing={landing} />

            {/* 3. STEP 01: CREATE — Turn Knowledge into Digital Assets */}
            <CreateVaultSection />

            {/* 4. STEP 02: SELL — Branded Storefront & Global Frictionless Checkout */}
            <StorefrontCheckoutSection />

            {/* 5. STEP 03: GROW WITH AI — The Engine Other Platforms Lack */}
            <GrowWithAiSection />

            {/* 6. THE AI ADVANTAGE — 4-Step Behind-the-Scenes Conversation Flow */}
            <AiAdvantageWorkflow />

            {/* 7. WHO IS IT FOR? — 6 Creator Segments */}
            <AudienceSegmentsSection />

            {/* 8. COMPARISON SHOWDOWN — BotifyAI vs Gumroad vs Selar vs Kajabi */}
            <ComparisonTableSection />

            {/* 9. PRICING — Simple, Transparent, 0% Platform Cut on Pro */}
            <PricingSection plans={plans} />

            {/* 10. TESTIMONIALS — Real Creator Wins */}
            <TestimonialsSection landing={landing} />

            {/* 11. FAQS — Comprehensive Answers */}
            <FaqSection landing={landing} />

            {/* 12. FINAL CTA & RISK REVERSAL */}
            <FinalCtaSection canRegister={canRegister} />
        </LandingLayout>
    );
}
