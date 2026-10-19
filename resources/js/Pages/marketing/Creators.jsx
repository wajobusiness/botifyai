import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import {
    Sparkles, ArrowRight, ShieldCheck, Zap, Download,
    Video, Bot, Users, CheckCircle2, ChevronDown, Check,
    DollarSign, Globe, Star, TrendingUp, Layers, MessageSquare,
    Store, Smartphone, CreditCard, Lock, RefreshCw, BarChart3
} from 'lucide-react';

export default function CreatorsLanding({ canRegister = true, landing = {}, plans = [] }) {
    const s = (key, def = '') => landing[`landing.${key}`] ?? def;

    // Interactive Earnings Calculator
    const [audience, setAudience] = useState(5000);
    const [price, setPrice] = useState(49);
    const [conversion, setConversion] = useState(2.5);

    const monthlySales = Math.round(audience * (conversion / 100));
    const grossRevenue = monthlySales * price;
    const gumroadTake = Math.round(grossRevenue * 0.10); // 10% Gumroad fee
    const botifySavings = gumroadTake;

    // FAQ State
    const [openFaq, setOpenFaq] = useState(null);
    const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

    const CREATOR_FAQS = [
        {
            q: "How does BotifyAI differ from Gumroad, Selar, or Kajabi?",
            a: "Traditional platforms give you a passive checkout page and take 5% to 10% of every sale, plus $150+/month for course hosting. BotifyAI gives you the complete digital product vault and course engine PLUS an autonomous 24/7 AI sales agent that directly chats with leads on WhatsApp & Instagram DM, answers questions, handles objections, and generates instant checkout links."
        },
        {
            q: "Can I host both video courses and downloadable files?",
            a: "Yes! BotifyAI includes both the Digital Product Vault (tokenized PDF, ZIP, presets, templates) and Botify Academy (unlimited video courses, modules, lessons, student dashboards, and completion tracking) in one single account."
        },
        {
            q: "How does the 24/7 AI sales rep sell my products?",
            a: "You upload your course curriculum, product description, or FAQ guide. BotifyAI trains a private, grounded RAG agent. When a follower sends a message on Instagram or WhatsApp, the AI answers questions in natural, friendly language and drops an instant multi-currency checkout link."
        },
        {
            q: "What payment gateways are supported?",
            a: "We support global cards via Stripe, PayPal, and regional providers including Flutterwave and Paystack. You can sell in USD, EUR, GBP, NGN, KES, ZAR, and more, with instant automated delivery upon confirmation."
        },
        {
            q: "Are there platform fees on my sales?",
            a: "On our Pro and Business plans, there are zero platform fees (0%). You keep 100% of your earnings minus standard gateway payment processing fees."
        },
        {
            q: "Can I recruit affiliates to promote my digital products?",
            a: "Yes! BotifyAI has a built-in Affiliate Network. Set custom commission percentages (e.g. 20% or 40%), generate trackable referral links, and our system tracks conversions and payouts automatically."
        }
    ];

    const COMPARISONS = [
        {
            feature: "Digital Product Vault (Tokenized Downloads)",
            botify: true,
            gumroad: true,
            kajabi: true,
            manychat: false,
        },
        {
            feature: "Video Course Hosting & Student Progress",
            botify: true,
            gumroad: false,
            kajabi: true,
            manychat: false,
        },
        {
            feature: "Autonomous AI Sales Agent (WhatsApp & Instagram)",
            botify: true,
            gumroad: false,
            kajabi: false,
            manychat: "Basic rules only",
        },
        {
            feature: "Multi-Channel Broadcasts & Follow-ups",
            botify: true,
            gumroad: "Email only",
            kajabi: "Email only",
            manychat: true,
        },
        {
            feature: "Multi-Currency Checkout (USD, EUR, NGN, KES, ZAR)",
            botify: true,
            gumroad: "Limited",
            kajabi: "Limited",
            manychat: false,
        },
        {
            feature: "Built-in Affiliate Tracking & Payouts",
            botify: true,
            gumroad: true,
            kajabi: true,
            manychat: false,
        },
        {
            feature: "Transaction Fees",
            botifyText: "0% on Pro",
            gumroadText: "10% + fees",
            kajabiText: "0% ($159/mo)",
            manychatText: "N/A (No commerce)",
        },
    ];

    return (
        <LandingLayout>
            <SeoHead
                title="AI-Powered Creator Commerce Platform — Sell Courses & Digital Products | BotifyAI"
                description="The complete AI operating system for creators. Host digital products, launch video courses, and deploy 24/7 autonomous AI sales agents on WhatsApp & Instagram."
                keywords="creator commerce, sell digital products, course hosting platform, AI sales agent, WhatsApp ecommerce, Gumroad alternative, Kajabi alternative, Selar alternative"
            />

            {/* HERO SECTION */}
            <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden bg-white dark:bg-neutral-950">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.2),rgba(0,0,0,0))] pointer-events-none" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-bold tracking-wide uppercase mb-6 animate-pulse">
                        <Sparkles className="h-3.5 w-3.5" />
                        The AI-Powered Creator Commerce Platform
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
                        Turn Your Knowledge & Content into an{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-rose-500 to-amber-500">
                            Automated Digital Business
                        </span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                        Host downloadable assets, launch video courses without student limits, and let 24/7 AI sales agents answer questions and close customers directly in WhatsApp & Instagram DMs.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-semibold text-base shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2 group"
                            >
                                Start Selling for Free
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        )}
                        <a
                            href="#calculator"
                            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-white font-medium text-base border border-neutral-300 dark:border-neutral-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            Calculate Your Revenue
                        </a>
                    </div>

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>Zero platform tax on Pro</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>Instant WhatsApp token delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>Multi-currency: USD, NGN, KES, ZAR, GBP</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4 CREATOR PILLARS GRID */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                            One All-Inclusive Stack
                        </span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
                            Replace 5 Disconnected Subscriptions
                        </h2>
                        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
                            Stop paying $250+/month for Teachable, Gumroad, ManyChat, and Zapier. BotifyAI builds the complete ecosystem under one roof.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Pillar 1: Digital Vault */}
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-6">
                                <Download className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                Digital Product Vault
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                                Upload ebooks, notion templates, software licenses, graphics kits, and presets. Every customer receives an encrypted, time-expiring single-use download link via WhatsApp and email that prevents piracy.
                            </p>
                            <Link
                                href="/sell-digital-products"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600"
                            >
                                Learn about Digital Vaults →
                            </Link>
                        </div>

                        {/* Pillar 2: Course Academy */}
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                                <Video className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                Botify Video Academy
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                                Host structured video curriculums with modules, video lessons, downloadable worksheets, and student progress tracking. Zero student seat caps or bandwidth penalty fees.
                            </p>
                            <Link
                                href="/courses"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-600"
                            >
                                Learn about Course Engine →
                            </Link>
                        </div>

                        {/* Pillar 3: AI Sales Agent */}
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
                                <Bot className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                24/7 Autonomous AI Sales Agent
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                                Grounded directly in your knowledge base. When a prospect DMs "How does this compare to course X?", your AI agent explains the difference, handles doubts, and drops a direct checkout link right in the chat.
                            </p>
                            <Link
                                href="/ai-sales-agent"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-500 hover:text-purple-600"
                            >
                                Learn about AI Sales Agents →
                            </Link>
                        </div>

                        {/* Pillar 4: Affiliate Engine */}
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                Built-In Affiliate Network
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                                Let your community and top students promote your products. Set custom commission cuts (10% to 75%), generate unique referral links, and automate payout accounting with one click.
                            </p>
                            <Link
                                href="/affiliates"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-500 hover:text-emerald-600"
                            >
                                Explore Affiliate Program →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* INTERACTIVE EARNINGS CALCULATOR */}
            <section id="calculator" className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-3xl p-8 sm:p-12 border border-neutral-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                                Revenue Potential
                            </span>
                            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
                                How Much Could You Earn with BotifyAI?
                            </h2>
                            <p className="mt-3 text-neutral-400 text-sm sm:text-base">
                                Adjust the sliders below to see your projected monthly sales and how much you save by ditching 10% platform cuts.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-8 items-center">
                            {/* Sliders */}
                            <div className="lg:col-span-7 space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-neutral-300">Audience / Followers Reach</label>
                                        <span className="text-base font-bold text-brand-400">{audience.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="500"
                                        max="50000"
                                        step="500"
                                        value={audience}
                                        onChange={(e) => setAudience(Number(e.target.value))}
                                        className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                    />
                                    <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                                        <span>500</span>
                                        <span>50,000+</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-neutral-300">Average Product Price ($)</label>
                                        <span className="text-base font-bold text-brand-400">${price}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="299"
                                        step="5"
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                    />
                                    <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                                        <span>$10</span>
                                        <span>$299</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-neutral-300">WhatsApp / In-Chat Conversion Rate (%)</label>
                                        <span className="text-base font-bold text-brand-400">{conversion}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="6.0"
                                        step="0.5"
                                        value={conversion}
                                        onChange={(e) => setConversion(Number(e.target.value))}
                                        className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                    />
                                    <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                                        <span>0.5% (Passive Web)</span>
                                        <span>6.0% (AI In-Chat DM)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Results Card */}
                            <div className="lg:col-span-5 bg-neutral-800/80 rounded-2xl p-6 border border-neutral-700/80 text-center">
                                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                    Projected Monthly Earnings
                                </span>
                                <div className="mt-2 text-4xl sm:text-5xl font-black text-white">
                                    ${grossRevenue.toLocaleString()}
                                </div>
                                <p className="text-xs text-neutral-400 mt-1">
                                    Based on ~{monthlySales.toLocaleString()} monthly orders
                                </p>

                                <div className="mt-6 pt-6 border-t border-neutral-700/60 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-400">Gumroad 10% Platform Cut:</span>
                                        <span className="font-semibold text-rose-400">-${gumroadTake.toLocaleString()}/mo</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-400">BotifyAI Platform Cut (Pro):</span>
                                        <span className="font-semibold text-emerald-400">$0 (0%)</span>
                                    </div>
                                    <div className="pt-2 flex justify-between items-center font-bold text-sm sm:text-base border-t border-neutral-700">
                                        <span className="text-emerald-400">Your Annual Savings:</span>
                                        <span className="text-emerald-400">+${(botifySavings * 12).toLocaleString()}/yr</span>
                                    </div>
                                </div>

                                {canRegister && (
                                    <Link
                                        href="/register"
                                        className="mt-6 w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        Keep 100% of Your Revenue
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* COMPARISON TABLE */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                            Competitive Showdown
                        </span>
                        <h2 className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white">
                            Why Creators Choose BotifyAI Over the Rest
                        </h2>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold">
                                <tr>
                                    <th className="py-4 px-6">Feature Capability</th>
                                    <th className="py-4 px-6 text-brand-600 dark:text-brand-400 bg-brand-500/10">BotifyAI</th>
                                    <th className="py-4 px-6 text-neutral-500">Gumroad</th>
                                    <th className="py-4 px-6 text-neutral-500">Kajabi</th>
                                    <th className="py-4 px-6 text-neutral-500">ManyChat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {COMPARISONS.map((row, i) => (
                                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-neutral-800 dark:text-neutral-200">
                                            {row.feature}
                                        </td>
                                        <td className="py-4 px-6 bg-brand-500/5 font-semibold text-brand-600 dark:text-brand-400">
                                            {row.botifyText ? (
                                                row.botifyText
                                            ) : row.botify ? (
                                                <Check className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                            {row.gumroadText ? (
                                                row.gumroadText
                                            ) : row.gumroad ? (
                                                <Check className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                <span className="text-neutral-400">✕</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                            {row.kajabiText ? (
                                                row.kajabiText
                                            ) : row.kajabi ? (
                                                <Check className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                <span className="text-neutral-400">✕</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                            {row.manychatText ? (
                                                row.manychatText
                                            ) : row.manychat ? (
                                                <Check className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                <span className="text-neutral-400">✕</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CREATOR TESTIMONIALS */}
            <section className="py-20 bg-white dark:bg-neutral-950">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                            Real Creator Results
                        </span>
                        <h2 className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white">
                            Trusted by Course Creators, Authors & Agency Owners
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800">
                            <div className="flex gap-1 text-amber-400 mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed mb-6">
                                "Moving my video masterclass from Teachable to BotifyAI saved me $180 every month. Plus, the WhatsApp AI agent closed 42 students who abandoned their cart."
                            </p>
                            <div>
                                <h4 className="font-bold text-neutral-900 dark:text-white text-sm">Marcus Vance</h4>
                                <p className="text-xs text-neutral-500">Fintech Educator & Consultant</p>
                            </div>
                        </div>

                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800">
                            <div className="flex gap-1 text-amber-400 mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed mb-6">
                                "The tokenized download link is pure genius. No more shared Google Drive links leaking on Twitter. My digital design kit sales doubled in two weeks."
                            </p>
                            <div>
                                <h4 className="font-bold text-neutral-900 dark:text-white text-sm">Elena Rostova</h4>
                                <p className="text-xs text-neutral-500">UI/UX Design Kit Author</p>
                            </div>
                        </div>

                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800">
                            <div className="flex gap-1 text-amber-400 mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed mb-6">
                                "I have 18 affiliates sending WhatsApp traffic to my fitness guides. The built-in affiliate engine handles tracking and payouts without any spreadsheets."
                            </p>
                            <div>
                                <h4 className="font-bold text-neutral-900 dark:text-white text-sm">David Chen</h4>
                                <p className="text-xs text-neutral-500">Fitness Creator & Coach</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CREATOR FAQ */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                            Got Questions?
                        </span>
                        <h2 className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {CREATOR_FAQS.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full py-4 px-6 text-left flex justify-between items-center font-bold text-neutral-900 dark:text-white text-base hover:text-brand-500 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-neutral-400 transition-transform ${openFaq === idx ? 'rotate-180 text-brand-500' : ''}`}
                                    />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-6 pb-5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/50 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA BANNER */}
            <section className="py-20 bg-gradient-to-r from-brand-600 to-rose-600 text-white text-center relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                        Ready to Build Your Autonomous Creator Empire?
                    </h2>
                    <p className="mt-4 text-lg text-rose-100 max-w-2xl mx-auto">
                        Launch your storefront, upload your products, and deploy your 24/7 AI sales agent in under 15 minutes.
                    </p>
                    <div className="mt-8 flex justify-center">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="px-8 py-4 rounded-full bg-white text-brand-600 hover:bg-neutral-100 font-bold text-base shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 group"
                            >
                                Get Started Free Today
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

