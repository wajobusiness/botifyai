import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import {
    Sparkles, ArrowRight, Bot, MessageSquare, Zap,
    ShieldCheck, CheckCircle2, ChevronDown, Check,
    Smartphone, Globe, Clock, DollarSign, BrainCircuit,
    Headphones, Send, ShoppingBag, Lock
} from 'lucide-react';

export default function AiSalesAgentLanding({ canRegister = true, landing = {} }) {
    const [openFaq, setOpenFaq] = useState(null);
    const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

    const AGENT_CAPABILITIES = [
        {
            icon: BrainCircuit,
            title: "Grounded RAG Knowledge Base",
            desc: "Upload PDFs, course syllabi, pricing guides, and FAQs. The agent answers strictly from your verified facts—preventing hallucinations and rogue claims."
        },
        {
            icon: Smartphone,
            title: "Native WhatsApp & Instagram DM",
            desc: "Engage where your customers actually live. Connect official Meta Cloud WhatsApp and Instagram messaging with zero third-party bridging lag."
        },
        {
            icon: ShoppingBag,
            title: "Direct In-Chat Checkout",
            desc: "The agent generates instant, multi-currency payment checkout links inside the chat conversation so prospects can buy without navigating complex funnels."
        },
        {
            icon: Clock,
            title: "Sub-Second 24/7 Response Time",
            desc: "Never lose a high-intent buyer who messages at 2 AM. The agent responds within 2 seconds while the prospect's purchase intent is highest."
        },
        {
            icon: Globe,
            title: "60+ Languages Supported",
            desc: "Sell to customers worldwide. The AI detects the incoming language automatically and responds natively with cultural nuance."
        },
        {
            icon: Headphones,
            title: "Instant Human Live Handoff",
            desc: "Whenever a complex custom inquiry or VIP request arrives, the AI gracefully assigns the ticket to your live team inbox with full conversation context."
        }
    ];

    const SIMULATOR_CONVERSATION = [
        {
            sender: "prospect",
            text: "Hi! I saw your post on Instagram. Does your Digital Architecture masterclass cover Laravel + React integrations, or is it just theory?",
            time: "10:14 PM"
        },
        {
            sender: "agent",
            text: "Hello Sarah! Absolutely. Module 3 is dedicated entirely to full-stack implementation using Laravel 11, Inertia.js, and React 18, including production multi-tenant setups and tokenized downloads. You also get the complete GitHub source code repository.",
            time: "10:14 PM"
        },
        {
            sender: "prospect",
            text: "That's exactly what I need. Can I pay in GBP or USD?",
            time: "10:15 PM"
        },
        {
            sender: "agent",
            text: "Yes, we support both USD ($99) and GBP (£79). You can complete your enrollment securely right here. Your course login will be sent immediately to this chat upon payment:",
            time: "10:15 PM",
            action: {
                title: "Enroll in SaaS Masterclass",
                price: "$99 USD / £79 GBP",
                cta: "Secure Checkout →"
            }
        }
    ];

    const FAQS = [
        {
            q: "How does the AI agent know what to say?",
            a: "You provide your business documents, course outlines, product descriptions, or website links. BotifyAI indexes this information into a private RAG (Retrieval-Augmented Generation) vector index. The agent strictly retrieves answers from your grounded material."
        },
        {
            q: "Will the agent invent discounts or make false promises?",
            a: "No. You configure strict operational guardrails (e.g., maximum approved discount codes, supported return policies, and supported currencies). The agent stays within your defined guidelines."
        },
        {
            q: "What happens if a customer asks something the AI doesn't know?",
            a: "When confidence is low or the user asks to speak with a human, the agent politely informs the customer that a team member is reviewing the conversation, and tags the chat for your human agents in the BotifyAI Live Inbox."
        },
        {
            q: "Can the AI agent initiate conversations or only respond?",
            a: "Both! The agent can automatically respond to incoming inbound DMs and comments, or send automated WhatsApp broadcast campaigns and abandoned checkout reminders."
        },
        {
            q: "Do I need Meta developer credentials?",
            a: "BotifyAI provides guided Meta Cloud onboarding, allowing you to connect your official WhatsApp Business number and Instagram account in just a few clicks."
        }
    ];

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'BotifyAI Autonomous AI Sales Agent',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, WhatsApp, Instagram',
            description: 'Turn your social channels into a 24/7 revenue engine. Deploy grounded RAG AI sales agents that handle objections and drop checkout links directly inside WhatsApp & Instagram.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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
                title="Autonomous 24/7 AI Sales Agent for WhatsApp & Instagram | BotifyAI"
                description="Turn your social channels into a 24/7 revenue engine. Deploy grounded RAG AI sales agents that handle objections and drop checkout links directly inside WhatsApp & Instagram."
                keywords="AI sales agent, WhatsApp AI bot, Instagram DM automation, conversational commerce, automated sales rep, ManyChat alternative, RAG chatbot for sales"
                jsonLd={jsonLd}
            />

            {/* HERO */}
            <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden bg-white dark:bg-neutral-950">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.2),rgba(0,0,0,0))] pointer-events-none" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold tracking-wide uppercase mb-6">
                        <Bot className="h-3.5 w-3.5" />
                        Autonomous In-Chat AI Sales Representative
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
                        Your Best Sales Rep, Working 24/7 on{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500">
                            WhatsApp & Instagram
                        </span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                        Stop losing leads while you sleep. Deploy grounded AI sales agents that answer complex product questions, handle objections, and close orders directly in the chat.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 group"
                            >
                                Deploy Your AI Sales Rep Free
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

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>1.8s average response time</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>Zero hallucinations (Grounded RAG)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>Direct in-chat payment links</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* LIVE CONVERSATION DEMO */}
            <section className="py-16 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                            Live Interaction
                        </span>
                        <h2 className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white">
                            See How the AI Closes Customers in WhatsApp
                        </h2>
                    </div>

                    {/* WhatsApp Style Simulated Container */}
                    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center text-white font-bold text-sm">
                                        AI
                                    </div>
                                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-emerald-700" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm leading-tight">Botify Sales Specialist</h4>
                                    <p className="text-[11px] text-emerald-200">Online • Typically replies instantly</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-100">
                                WhatsApp Verified
                            </span>
                        </div>

                        {/* Chat Messages */}
                        <div className="p-4 space-y-3.5 bg-neutral-100 dark:bg-neutral-950/80 min-h-[380px] text-xs">
                            {SIMULATOR_CONVERSATION.map((msg, i) => {
                                const isProspect = msg.sender === 'prospect';
                                return (
                                    <div
                                        key={i}
                                        className={`flex flex-col ${isProspect ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl p-3 ${
                                                isProspect
                                                    ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                                                    : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-none border border-neutral-200 dark:border-neutral-700 shadow-sm'
                                            }`}
                                        >
                                            <p className="leading-relaxed">{msg.text}</p>

                                            {msg.action && (
                                                <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-700">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-neutral-800 dark:text-white">{msg.action.title}</span>
                                                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{msg.action.price}</span>
                                                    </div>
                                                    <div className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center cursor-pointer transition-colors">
                                                        {msg.action.cta}
                                                    </div>
                                                </div>
                                            )}

                                            <span
                                                className={`block text-[9px] mt-1 text-right ${
                                                    isProspect ? 'text-emerald-100' : 'text-neutral-400'
                                                }`}
                                            >
                                                {msg.time}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input bar mockup */}
                        <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                            <input
                                type="text"
                                disabled
                                placeholder="Type a message..."
                                className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2 text-xs text-neutral-500 border-none outline-none"
                            />
                            <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                <Send className="h-3.5 w-3.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CAPABILITIES GRID */}
            <section className="py-20 bg-white dark:bg-neutral-950">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                            Enterprise AI Architecture
                        </span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
                            Engineered for High-Conversion Commerce
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {AGENT_CAPABILITIES.map((cap, idx) => {
                            const Icon = cap.icon;
                            return (
                                <div
                                    key={idx}
                                    className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                                        {cap.title}
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        {cap.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FAQS */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                            AI Sales Agent FAQs
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
                                    className="w-full py-4 px-6 text-left flex justify-between items-center font-bold text-neutral-900 dark:text-white text-base hover:text-emerald-500 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-neutral-400 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-500' : ''}`}
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
            <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                        Deploy Your 24/7 AI Sales Rep Today
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-emerald-100 max-w-xl mx-auto">
                        Connect your WhatsApp or Instagram, upload your product knowledge, and let AI close deals on autopilot.
                    </p>
                    <div className="mt-8 flex justify-center">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="px-8 py-4 rounded-full bg-white text-emerald-700 hover:bg-neutral-100 font-bold text-base shadow-xl transition-all flex items-center gap-2 group"
                            >
                                Start Free Trial
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

