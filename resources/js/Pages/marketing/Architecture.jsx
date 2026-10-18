import { useState } from 'react';
import { Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from 'react-i18next';
import { useBranding } from '@/hooks/useBranding';
import {
    Cpu, Layers, Zap, Bot, Database, GitBranch, ShieldCheck, Share2,
    MessageSquare, ShoppingBag, BarChart3, LineChart, Code2, Globe,
    ArrowRight, CheckCircle2, Server, Cloud, Network, Check, Sparkles,
    Activity, ArrowDown, Lock, ChevronRight, Terminal, RefreshCw, Send,
    Workflow, Users, FileText, Smartphone, Mail, DollarSign
} from 'lucide-react';

export default function Architecture({ canRegister, landing = {} }) {
    const { t } = useTranslation();
    const { appName } = useBranding();

    const [activeFlowPath, setActiveFlowPath] = useState('pathA');
    const [selectedLayer, setSelectedLayer] = useState('gateway');

    const timelineEvents = [
        {
            year: '2024',
            period: 'Q1 – Q3 2024',
            title: 'Concept & Platform Foundations',
            points: [
                'BotifyAI concept and core architecture planning commenced by WAJO Limited.',
                'Engineered multi-tenant Laravel backend and relational persistence models on MySQL.',
                'Built event-driven webhook processing pipelines for WhatsApp Cloud API and Meta Graph APIs.',
                'Designed initial visual DAG workflow execution engine and stateful multi-turn memory.',
            ],
            badge: 'Engineering Foundation',
            badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        },
        {
            year: 'December 2024',
            period: 'Q4 2024',
            title: 'Commercial Production Launch',
            points: [
                'Commercial release of BotifyAI.cloud to digital businesses and merchants.',
                'Enabled live customer engagement automation, in-chat lead capture, and conversational sales workflows.',
                'Achieved production reliability across high-volume inbound messaging webhooks.',
                'Established operational multi-tenant customer workspaces.',
            ],
            badge: 'Commercial Launch',
            badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        },
        {
            year: '2025',
            period: 'Full Year 2025',
            title: 'Commerce & Ecosystem Expansion',
            points: [
                'Introduced native digital commerce layer: product catalogs, mobile-first checkout, and order lifecycle management.',
                'Engineered automated affiliate tracking engine with multi-currency balance ledgers.',
                'Integrated multi-provider LLM gateways (OpenAI, Claude, Gemini) with dynamic model routing.',
                'Scaled active business workflows, marketing broadcasts, and CRM segmentation pipelines.',
            ],
            badge: 'Scale & Commerce',
            badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        },
        {
            year: '2026',
            period: 'Ongoing 2026',
            title: 'Architecture Transparency & Creative Engine',
            points: [
                'Published engineering architecture documentation and selected platform components.',
                'Engineered the Deterministic AI Brand Design Engine for vector social creative generation.',
                'Expanded enterprise observability, automated quality gates, and multi-channel publishing.',
                'Continuous optimization of scalable SaaS automation infrastructure.',
            ],
            badge: 'Enterprise Evolution',
            badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        },
    ];

    const comparisonPoints = [
        {
            feature: 'Core Philosophy',
            traditional: 'Simple scripted chatbot or prompt wrapper with limited linear responses',
            botify: 'Full-stack AI business automation and social commerce operating infrastructure',
        },
        {
            feature: 'Conversation Scope',
            traditional: 'Single-session Q&A or FAQ lookups with no state continuity',
            botify: 'Stateful multi-turn conversation memory with entity extraction and slot filling',
        },
        {
            feature: 'Business Process Execution',
            traditional: 'Passive reply generation with minimal or no business logic automation',
            botify: 'Visual DAG node automation: lead scoring, multi-day drips, and CRM updates',
        },
        {
            feature: 'Commerce & Monetization',
            traditional: 'Requires separate external ecommerce stores or redirects out of chat',
            botify: 'Native product catalogs, in-chat checkouts, payment processing & affiliate ledgers',
        },
        {
            feature: 'Creative & Marketing Generation',
            traditional: 'Text only or unbranded stock image generation',
            botify: 'Deterministic vector Brand Design Engine with custom typography & WCAG contrast safety',
        },
        {
            feature: 'Channel Integration',
            traditional: 'Often limited to a single web widget or fragmented siloed tools',
            botify: 'Unified omnichannel gateway: WhatsApp, Instagram, Messenger, Web Chat, Email, SMS',
        },
        {
            feature: 'Revenue Attribution & BI',
            traditional: 'Basic message counting without financial context',
            botify: 'Real-time sales attribution linking conversations directly to closed transactions',
        },
    ];

    return (
        <LandingLayout>
            <SeoHead
                title={`Platform Architecture & Engineering Overview — ${appName}`}
                description="Comprehensive technical documentation of the AI automation infrastructure, omnichannel communication gateway, and social commerce architecture powering BotifyAI.cloud."
            />

            {/* SECTION 1: HERO HEADER */}
            <section className="relative overflow-hidden bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                {/* Subtle gradient backdrop */}
                <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
                     style={{
                         background: 'radial-gradient(circle 800px at 50% -100px, rgba(37,99,235,0.18), rgba(225,29,72,0.12), transparent)'
                     }}
                />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
                    {/* Badges Bar */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            AI Business Automation Infrastructure
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 font-mono">
                            v3.2 Production Release
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Commercial Operation
                        </span>
                        <span className="text-xs text-neutral-400 ms-auto hidden md:inline-block">
                            Proprietary Asset · WAJO Limited
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight max-w-4xl">
                        BotifyAI Platform Architecture
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl">
                        Engineering documentation of the AI automation infrastructure powering omnichannel communication, workflow automation, CRM processes, and social commerce operations.
                    </p>

                    {/* Architectural Highlights */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono">Omnichannel</div>
                            <div className="text-xs text-neutral-500 mt-1">WhatsApp, IG, Messenger, Web, SMS</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">DAG Runner</div>
                            <div className="text-xs text-neutral-500 mt-1">Node-based automation engine</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">Native Commerce</div>
                            <div className="text-xs text-neutral-500 mt-1">In-chat checkout & affiliate ledger</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">Deterministic</div>
                            <div className="text-xs text-neutral-500 mt-1">WCAG-compliant Brand Design Engine</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: PRODUCT HISTORY TIMELINE */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Provenance & Evolution</span>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                            Product Development Timeline
                        </h2>
                        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                            BotifyAI was engineered and deployed as a commercial software asset by WAJO Limited before the publication of technical components on GitHub.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                        {timelineEvents.map((item, idx) => (
                            <div key={idx} className="relative p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-mono font-bold text-neutral-400">{item.period}</span>
                                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                                            {item.badge}
                                        </span>
                                    </div>
                                    <div className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                                        {item.year}
                                    </div>
                                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                                        {item.title}
                                    </h4>
                                    <ul className="space-y-2">
                                        {item.points.map((p, i) => (
                                            <li key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5 leading-relaxed">
                                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 3: SYSTEM ARCHITECTURE DIAGRAM */}
            <section className="py-24 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Engineered Architecture</span>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                            End-to-End System Infrastructure
                        </h2>
                        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                            A decoupled multi-tier architecture ensuring deterministic execution, enterprise tenant isolation, and sub-second conversational latency.
                        </p>
                    </div>

                    {/* Interactive Multi-Tier SVG Architecture Graphic */}
                    <div className="p-8 rounded-3xl bg-neutral-950 border border-neutral-800 text-white shadow-2xl overflow-x-auto">
                        <div className="min-w-[760px] space-y-6">
                            {/* Layer 1: Customer Channels */}
                            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Layer 1: Omnichannel Customer Ingestion</span>
                                    <span className="text-[10px] text-blue-400 font-mono">External Client Surface</span>
                                </div>
                                <div className="grid grid-cols-6 gap-3">
                                    {['WhatsApp API', 'Instagram DM', 'Messenger', 'Web Chat', 'Email Relays', 'SMS Gateways'].map((ch, i) => (
                                        <div key={i} className="py-2.5 px-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-center text-xs font-medium text-neutral-200">
                                            {ch}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Down Connector */}
                            <div className="flex justify-center -my-2">
                                <ArrowDown className="w-5 h-5 text-blue-500 animate-bounce" />
                            </div>

                            {/* Layer 2: BotifyAI Integration Gateway */}
                            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-900/60">
                                <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Layer 2: BotifyAI Integration Gateway</span>
                                    <span className="text-[10px] text-blue-400 font-mono">HMAC Verification · Ingestion Rate Limiting</span>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {['Webhook Verification', 'Event Normalization', 'Tenant Router', 'Replay Protection'].map((item, i) => (
                                        <div key={i} className="py-2.5 px-3 rounded-xl bg-blue-900/40 border border-blue-800/60 text-center text-xs font-medium text-blue-200">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Down Connector */}
                            <div className="flex justify-center -my-2">
                                <ArrowDown className="w-5 h-5 text-indigo-500" />
                            </div>

                            {/* Layer 3: AI Orchestration Engine */}
                            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/60">
                                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Layer 3: AI Orchestration Engine</span>
                                    <span className="text-[10px] text-indigo-400 font-mono">Multi-Model Routing · Vector RAG</span>
                                </div>
                                <div className="grid grid-cols-5 gap-3">
                                    {['Intent Detection', 'Context Memory', 'Vector Search (RAG)', 'Decision Engine', 'Business Guardrails'].map((item, i) => (
                                        <div key={i} className="py-2.5 px-2 rounded-xl bg-indigo-900/40 border border-indigo-800/60 text-center text-xs font-medium text-indigo-200">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Down Connector */}
                            <div className="flex justify-center -my-2">
                                <ArrowDown className="w-5 h-5 text-rose-500" />
                            </div>

                            {/* Layer 4: Automation Workflow Engine */}
                            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/60">
                                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Layer 4: Automation Workflow Engine</span>
                                    <span className="text-[10px] text-rose-400 font-mono">DAG Execution · CRM State Machine</span>
                                </div>
                                <div className="grid grid-cols-5 gap-3">
                                    {['Lead Qualification', 'CRM Automation', 'Cart Recovery', 'Drip Campaigns', 'Social Scheduler'].map((item, i) => (
                                        <div key={i} className="py-2.5 px-2 rounded-xl bg-rose-900/40 border border-rose-800/60 text-center text-xs font-medium text-rose-200">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Down Connector */}
                            <div className="flex justify-center -my-2">
                                <ArrowDown className="w-5 h-5 text-emerald-500" />
                            </div>

                            {/* Layer 5 & 6 Split: Commerce + Analytics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-900/60">
                                    <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                                        Layer 5: Social Commerce Infrastructure
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Product Catalog', 'Direct Checkout', 'Payment Gateways', 'Affiliate Ledger'].map((item, i) => (
                                            <div key={i} className="py-2 px-2 rounded-lg bg-emerald-900/30 border border-emerald-800/50 text-center text-xs text-emerald-200">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-900/60">
                                    <div className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                                        Layer 6: Analytics & Business Intelligence
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Conversation BI', 'Revenue Attribution', 'Funnel Analytics', 'Campaign Telemetry'].map((item, i) => (
                                            <div key={i} className="py-2 px-2 rounded-lg bg-purple-900/30 border border-purple-800/50 text-center text-xs text-purple-200">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Explanatory Cards Below Diagram */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                Ingestion & Routing Guarantees
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Inbound webhooks from Meta and WhatsApp are validated with cryptographic HMAC-SHA256 signatures, normalized into unified message events, and dispatched through Redis queues to eliminate bottlenecks.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" />
                                Contextual Intent & RAG
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Instead of blind prompt chaining, customer queries undergo vector similarity matching over workspace document embeddings, validating intents against deterministic business policy before LLM generation.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                Conversational Commerce
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Orders generated inside chat sessions seamlessly interface with payment gateways and our double-entry ledger system, automatically accrediting affiliate commissions and updating sales attribution.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: CUSTOMER USER FLOW DIAGRAM */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-14">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Intelligent Journey</span>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                            Customer User Flow & Automated Decision Paths
                        </h2>
                        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                            See how incoming messages dynamically branch into automated sales, customer support, or lead qualification pipelines.
                        </p>
                    </div>

                    {/* Common Ingress Flow */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                        {[
                            { step: '01', title: 'Customer Initiates', desc: 'Message sent via WhatsApp, IG Direct, Messenger, or Web Chat' },
                            { step: '02', title: 'Gateway Ingestion', desc: 'HMAC validation, event normalization, tenant workspace scoping' },
                            { step: '03', title: 'AI Intent Analysis', desc: 'Semantic classification, slot extraction, sentiment detection' },
                            { step: '04', title: 'Workflow Decision', desc: 'Deterministic router triggers one of three specialized paths' },
                        ].map((s, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm relative">
                                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mb-1">Step {s.step}</div>
                                <div className="text-sm font-bold text-neutral-900 dark:text-white mb-1">{s.title}</div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Path Selector Tabs */}
                    <div className="flex justify-center gap-3 mb-8">
                        <button
                            type="button"
                            onClick={() => setActiveFlowPath('pathA')}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                                activeFlowPath === 'pathA'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                            }`}
                        >
                            Path A: Product Enquiry & In-Chat Commerce
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFlowPath('pathB')}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                                activeFlowPath === 'pathB'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                            }`}
                        >
                            Path B: Customer Support & Knowledge Retrieval
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFlowPath('pathC')}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                                activeFlowPath === 'pathC'
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                            }`}
                        >
                            Path C: High-Intent Sales Opportunity & CRM
                        </button>
                    </div>

                    {/* Active Path Visual Sequence */}
                    <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        {activeFlowPath === 'pathA' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                    <ShoppingBag className="w-5 h-5" />
                                    <span>Path A: Conversational Commerce & Checkout Execution</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                                    {[
                                        { label: 'Product Enquiry', detail: 'User asks for pricing, specs, or product availability' },
                                        { label: 'AI Recommendation', detail: 'Fetches catalog item, presents cards with specs & price' },
                                        { label: 'Direct Checkout', detail: 'Generates instant in-chat checkout token or mobile link' },
                                        { label: 'Payment Gateway', detail: 'Idempotent card/mobile payment via Stripe or Paystack' },
                                        { label: 'Fulfillment & Order', detail: 'Issues digital license/receipt and triggers CRM tag' },
                                    ].map((step, i) => (
                                        <div key={i} className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                                            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Step 4.{i+1}</div>
                                            <div className="text-xs font-semibold text-neutral-900 dark:text-white mt-0.5">{step.label}</div>
                                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{step.detail}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeFlowPath === 'pathB' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                                    <Bot className="w-5 h-5" />
                                    <span>Path B: Customer Support, Semantic RAG & Human Escalation</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                                    {[
                                        { label: 'Support Request', detail: 'Customer reports an issue, asks policy, or seeks instructions' },
                                        { label: 'Knowledge Retrieval', detail: 'Embeddings search across documents, FAQs, and ticket logs' },
                                        { label: 'Accredited Response', detail: 'Synthesizes accurate, citation-backed response strictly on facts' },
                                        { label: 'Human Escalation', detail: 'If confidence drops below threshold, alerts live agent in Inbox' },
                                    ].map((step, i) => (
                                        <div key={i} className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
                                            <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">Step 4.{i+1}</div>
                                            <div className="text-xs font-semibold text-neutral-900 dark:text-white mt-0.5">{step.label}</div>
                                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{step.detail}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeFlowPath === 'pathC' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                                    <Users className="w-5 h-5" />
                                    <span>Path C: Sales Pipeline Automation & Multi-Day Lead Nurturing</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                                    {[
                                        { label: 'Sales Opportunity', detail: 'High-intent buyer identifies requirements, team size, budget' },
                                        { label: 'Lead Capture & Enrichment', detail: 'Extracts contact details, assigns score, updates custom fields' },
                                        { label: 'CRM Pipeline Move', detail: 'Moves deal to Qualified stage in Lead Pipeline kanban' },
                                        { label: 'Drip Automation', detail: 'Schedules timed multi-day follow-ups via email or WhatsApp' },
                                    ].map((step, i) => (
                                        <div key={i} className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
                                            <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">Step 4.{i+1}</div>
                                            <div className="text-xs font-semibold text-neutral-900 dark:text-white mt-0.5">{step.label}</div>
                                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{step.detail}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Terminal Step */}
                        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                            <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                Step 5: Real-Time Business Intelligence & Revenue Dashboard Updated
                            </span>
                            <span className="font-mono">Metrics Latency: &lt; 250ms</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 5: CORE TECHNOLOGY COMPONENTS */}
            <section className="py-24 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Core Subsystems</span>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                            Platform Technology Components
                        </h2>
                        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                            Engineered as modular, independently scalable services that collaborate across an event-driven framework.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* AI Layer */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                                <Bot className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">AI Orchestration Layer</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Manages intent detection, conversational slot-filling, multi-turn context memory, and dynamic gateway routing between OpenAI, Claude, and Gemini with automated failover.
                            </p>
                            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Key Subsystems:</div>
                                <div className="text-[11px] text-neutral-500 font-mono">Semantic RAG · Multi-Turn Context · Policy Guardrails</div>
                            </div>
                        </div>

                        {/* Communication Layer */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Omnichannel Communication Layer</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Normalizes fragmented third-party protocols (Meta Cloud API, WhatsApp, SMS, Email, and WebSockets) into a single unified event format with cryptographic verification.
                            </p>
                            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Key Subsystems:</div>
                                <div className="text-[11px] text-neutral-500 font-mono">HMAC Ingestion · WebSocket Hub · Provider Adapters</div>
                            </div>
                        </div>

                        {/* Automation Layer */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
                                <Workflow className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Automation Workflow Engine</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Directed Acyclic Graph (DAG) visual runner that handles complex conditional branching, lead qualification, CRM contact tagging, multi-step drip campaigns, and scheduled tasks.
                            </p>
                            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Key Subsystems:</div>
                                <div className="text-[11px] text-neutral-500 font-mono">DAG Execution Engine · Lead Scorer · CRM Sync</div>
                            </div>
                        </div>

                        {/* Commerce Layer */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Commerce Infrastructure</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Digital product catalog management, self-hosted checkout pages, multi-currency payment collection, double-entry affiliate commission ledgers, and automated fulfillment.
                            </p>
                            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Key Subsystems:</div>
                                <div className="text-[11px] text-neutral-500 font-mono">In-Chat Checkout · Payment Gateways · Commission Ledger</div>
                            </div>
                        </div>

                        {/* Creative Engine */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Brand Design Engine</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Deterministic vector graphic rendering engine producing crisp multi-aspect ratio social media cards, quote graphics, and educational carousels with WCAG contrast verification.
                            </p>
                            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Key Subsystems:</div>
                                <div className="text-[11px] text-neutral-500 font-mono">Vector SVG Compositor · WCAG Contrast Engine · Brand Kits</div>
                            </div>
                        </div>

                        {/* Analytics Layer */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Analytics & Business Intelligence</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Real-time executive dashboards reporting message resolution times, conversion funnels, broadcast deliverability, and revenue attribution across all customer touchpoints.
                            </p>
                            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Key Subsystems:</div>
                                <div className="text-[11px] text-neutral-500 font-mono">Funnel Analytics · Conversion Tracking · Event Telemetry</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 6: WHY BOTIFYAI IS DIFFERENT */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Competitive Differentiation</span>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                            Why BotifyAI Is Fundamentally Different
                        </h2>
                        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                            Traditional chatbots answer questions; BotifyAI operates as an enterprise revenue and automation infrastructure.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-800/60">
                                        <th className="py-4 px-6 font-bold text-neutral-900 dark:text-white w-1/4">Evaluation Criterion</th>
                                        <th className="py-4 px-6 font-bold text-neutral-500 dark:text-neutral-400 w-3/8">Traditional Chatbot Platforms</th>
                                        <th className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 w-3/8 bg-blue-50/50 dark:bg-blue-950/20">BotifyAI.cloud Platform</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {comparisonPoints.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition">
                                            <td className="py-4 px-6 font-semibold text-neutral-900 dark:text-white">
                                                {row.feature}
                                            </td>
                                            <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">
                                                {row.traditional}
                                            </td>
                                            <td className="py-4 px-6 text-neutral-800 dark:text-neutral-200 font-medium bg-blue-50/20 dark:bg-blue-950/10">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <span>{row.botify}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 7: ENGINEERING PRINCIPLES */}
            <section className="py-24 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Core Foundations</span>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                            Architectural & Engineering Principles
                        </h2>
                        <blockquote className="mt-4 text-base italic text-neutral-700 dark:text-neutral-300 border-l-2 border-blue-500 pl-4 max-w-2xl mx-auto text-left">
                            "BotifyAI was designed as a scalable SaaS platform rather than a simple conversational interface."
                        </blockquote>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Modular Domain Architecture',
                                desc: 'Decoupled domain modules (Broadcasting, Automation, Ecommerce, Social, AI, CRM) maintain clean architectural boundaries and strict interface contracts.',
                                icon: <Layers className="w-5 h-5 text-blue-600" />,
                            },
                            {
                                title: 'API-First Multi-Tenancy',
                                desc: 'Every data access point, conversation context, and customer record is strictly isolated per workspace with multi-tenant row-level access control.',
                                icon: <Network className="w-5 h-5 text-indigo-600" />,
                            },
                            {
                                title: 'Automation-Driven Workflows',
                                desc: 'Event-driven architecture where inbound customer actions automatically trigger state transitions, queue jobs, and multi-channel marketing campaigns.',
                                icon: <Zap className="w-5 h-5 text-purple-600" />,
                            },
                            {
                                title: 'Scalable Infrastructure',
                                desc: 'Redis queue buffering, worker daemon isolation, and deterministic image synthesis (<16MB RAM) ensure predictable operating costs and sub-second latency.',
                                icon: <Server className="w-5 h-5 text-emerald-600" />,
                            },
                            {
                                title: 'Deterministic Safety Guards',
                                desc: 'AI outputs are constrained by hardcoded business policies, ensuring prices, discounts, and legal disclosures are never hallucinated or violated.',
                                icon: <ShieldCheck className="w-5 h-5 text-rose-600" />,
                            },
                            {
                                title: 'Extensible Business Modules',
                                desc: 'Plug-and-play architecture allows rapid onboarding of new channels, payment gateways, and third-party tools without refactoring core business logic.',
                                icon: <GitBranch className="w-5 h-5 text-amber-600" />,
                            },
                        ].map((principle, idx) => (
                            <div key={idx} className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                    {principle.icon}
                                </div>
                                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                                    {principle.title}
                                </h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    {principle.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 8: TECHNICAL EVALUATION & GOVERNANCE CTA */}
            <section className="py-20 bg-neutral-950 text-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/20">
                        Enterprise Architecture Reference
                    </span>

                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Built for Scale, Conversion & Autonomous Automation
                    </h2>

                    <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        BotifyAI.cloud is proprietary software developed and operated by <strong>WAJO Limited</strong>. For technical evaluation, institutional due diligence, or commercial partnership inquiries, contact our engineering office.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/30 active:scale-95"
                            >
                                Get Started with BotifyAI
                            </Link>
                        )}
                        <Link
                            href="/contact"
                            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition border border-white/20"
                        >
                            Contact Engineering Team
                        </Link>
                    </div>

                    <div className="pt-8 text-xs text-neutral-500">
                        Corporate Governance · WAJO Limited · All Rights Reserved
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

