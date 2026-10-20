import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import {
    Sparkles, ArrowRight, ShieldCheck, Download, Zap,
    Lock, CheckCircle2, FileText, Layout, Music, Code,
    Package, RefreshCw, Smartphone, CreditCard, ChevronDown, Check,
    HardDrive, Clock, KeyRound, ExternalLink, HelpCircle
} from 'lucide-react';

export default function DigitalProductsLanding({ canRegister = true, landing = {} }) {
    const [openFaq, setOpenFaq] = useState(null);
    const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

    const ASSET_TYPES = [
        {
            icon: FileText,
            title: "Ebooks & PDF Guides",
            desc: "Sell guides, workbooks, research reports, and checklists. Protect your intellectual property with automated single-buyer licensing.",
            badge: "PDF / EPUB"
        },
        {
            icon: Layout,
            title: "Notion & Figma Templates",
            desc: "Deliver duplicate-ready templates, wireframe kits, design systems, and productivity workspaces with automated access links.",
            badge: "TEMPLATES"
        },
        {
            icon: Package,
            title: "Presets & Graphics Kits",
            desc: "Sell Lightroom presets, 3D assets, icon packs, sound kits, and video LUTs with multi-file compressed delivery vaults.",
            badge: "ZIP / ASSETS"
        },
        {
            icon: Code,
            title: "Software & License Keys",
            desc: "Distribute scripts, WordPress plugins, source code packages, and automated single-use license activation keys upon checkout.",
            badge: "CODE / LICENSES"
        },
        {
            icon: Music,
            title: "Audiobooks & Meditations",
            desc: "Host audio sessions, podcast archives, sample packs, and musical stems with secure high-speed CDN delivery.",
            badge: "AUDIO / MP3"
        },
        {
            icon: HardDrive,
            title: "Spreadsheets & Calculators",
            desc: "Monetize financial models, SEO audit sheets, budgeting spreadsheets, and Notion trackers with instant customer fulfillment.",
            badge: "XLSX / SHEETS"
        }
    ];

    const HOW_IT_WORKS = [
        {
            step: "01",
            title: "Upload Your Digital Assets",
            desc: "Drag and drop your files into your BotifyAI Digital Vault. Set your price, currency, thumbnail, and optional bonus downloads."
        },
        {
            step: "02",
            title: "Share or Let AI Sell It",
            desc: "Get an instant, mobile-optimized checkout link. Or connect your WhatsApp & Instagram so your AI sales rep shares it when leads ask."
        },
        {
            step: "03",
            title: "Instant Multi-Currency Payment",
            desc: "Customers pay via Cards, Apple Pay, PayPal, or regional methods in USD, EUR, GBP, NGN, KES, ZAR with zero friction."
        },
        {
            step: "04",
            title: "Tokenized Anti-Piracy Delivery",
            desc: "BotifyAI generates a cryptographically signed, expiring download token delivered instantly to the buyer's WhatsApp and inbox."
        }
    ];

    const FAQS = [
        {
            q: "How does tokenized anti-piracy delivery work?",
            a: "Instead of sending raw public file URLs or unprotected Google Drive links, BotifyAI generates a unique cryptographic token for each purchase. The link is bound to the buyer's order, expires after a set timeframe or download count, and prevents unauthorized public link redistribution."
        },
        {
            q: "Can I bundle multiple files into one product?",
            a: "Yes! You can attach multiple downloadable files to a single product listing (e.g. an eBook PDF + an Excel calculation sheet + a bonus audio session)."
        },
        {
            q: "Can I sell in multiple currencies?",
            a: "Absolutely. You can price and sell your digital downloads in USD, EUR, GBP, NGN, KES, ZAR, and more through integrated gateways including Stripe, PayPal, Flutterwave, and Paystack."
        },
        {
            q: "Can the AI agent sell my digital downloads inside WhatsApp?",
            a: "Yes! BotifyAI's native integration allows your AI agent to recommend the right digital asset when a prospect asks a question in WhatsApp or Instagram DM, and supply the direct instant checkout link right in the conversation."
        },
        {
            q: "What are the platform transaction fees?",
            a: "On BotifyAI Pro and Business plans, there are 0% platform transaction fees. You keep 100% of your product revenue."
        }
    ];

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Sell Digital Products with Tokenized Anti-Piracy Vaults | BotifyAI',
            description: 'The secure digital product checkout engine. Sell ebooks, templates, presets, software, and audio with instant encrypted WhatsApp fulfillment and 0% platform fees.',
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.a,
                },
            })),
        },
    ];

    return (
        <LandingLayout>
            <SeoHead
                title="Sell Digital Products with Tokenized Anti-Piracy Vaults | BotifyAI"
                description="The secure digital product checkout engine. Sell ebooks, templates, presets, software, and audio with instant encrypted WhatsApp fulfillment and 0% platform fees."
                keywords="sell digital products, digital downloads, secure ebook sales, sell notion templates, anti-piracy downloads, sell presets, WhatsApp checkout, Gumroad alternative"
                jsonLd={jsonLd}
            />

            {/* HERO */}
            <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden bg-white dark:bg-neutral-950">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.2),rgba(0,0,0,0))] pointer-events-none" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold tracking-wide uppercase mb-6">
                        <Lock className="h-3.5 w-3.5" />
                        Tokenized Anti-Piracy Digital Vault
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
                        Sell Any Digital Asset with{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-brand-500">
                            Instant Encrypted Delivery
                        </span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                        Host ebooks, presets, templates, and software. Customers get single-use cryptographic download tokens delivered straight to WhatsApp and email. No leaked links. 0% platform fees.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 group"
                            >
                                Create Your Digital Vault
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        )}
                        <Link
                            href="/creators"
                            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-white font-medium text-base border border-neutral-300 dark:border-neutral-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Explore Creator OS
                        </Link>
                    </div>

                    {/* Security Pill Bar */}
                    <div className="mt-12 inline-flex flex-wrap items-center justify-center gap-6 py-3 px-6 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        <span className="flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-blue-500" /> Signed Download Tokens</span>
                        <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
                        <span className="flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-emerald-500" /> WhatsApp Instant Fulfillment</span>
                        <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
                        <span className="flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-purple-500" /> Multi-Currency Checkout</span>
                    </div>
                </div>
            </section>

            {/* WHAT YOU CAN SELL (GRID) */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            Universal Vault Support
                        </span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
                            What Digital Products Can You Monetize?
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ASSET_TYPES.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={idx}
                                    className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/40 transition-colors shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                            {item.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS / TOKEN SECURITY */}
            <section className="py-20 bg-white dark:bg-neutral-950">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            Frictionless & Protected
                        </span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
                            How the BotifyAI Digital Vault Operates
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {HOW_IT_WORKS.map((step, idx) => (
                            <div key={idx} className="relative p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                                <div className="text-3xl font-black text-blue-500/40 mb-3">
                                    {step.step}
                                </div>
                                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Token Security Showcase Box */}
                    <div className="mt-12 bg-neutral-900 text-white rounded-3xl p-8 border border-neutral-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">
                                <ShieldCheck className="h-4 w-4" /> Cryptographic URL Protection
                            </span>
                            <h3 className="text-xl font-bold">Say Goodbye to Leaked Google Drive Links</h3>
                            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                                When a buyer purchases, our backend generates an encrypted endpoint like <code className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-blue-400 font-mono">/buy/download/tok_948f29d...</code> with customizable download limits and auto-expiration.
                            </p>
                        </div>
                        {canRegister && (
                            <Link
                                href="/register"
                                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm whitespace-nowrap shadow-lg transition-all"
                            >
                                Start Selling Securely →
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* FAQS */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                            Digital Product FAQs
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {FAQS.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full py-4 px-6 text-left flex justify-between items-center font-bold text-neutral-900 dark:text-white text-base hover:text-blue-500 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-neutral-400 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-500' : ''}`}
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

            {/* CTA */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                        Start Selling Your Digital Assets in Minutes
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-blue-100 max-w-xl mx-auto">
                        No credit card required. Upload your first downloadable product and connect your payment gateway in seconds.
                    </p>
                    <div className="mt-8 flex justify-center">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="px-8 py-4 rounded-full bg-white text-blue-600 hover:bg-neutral-100 font-bold text-base shadow-xl transition-all flex items-center gap-2 group"
                            >
                                Get Started Free
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

