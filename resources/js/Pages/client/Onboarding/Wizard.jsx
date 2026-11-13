import ClientLayout from '@/Layouts/ClientLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2, Circle, ArrowRight, Sparkles, Store, Bot,
    Share2, MapPin, Zap, ExternalLink, ChevronRight, Check
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STEP_LINKS = {
    verify_email: null,
    choose_plan: 'client.pricing',
    connect_first_channel: 'client.whatsapp.templates.index',
    import_first_contacts: 'client.contacts.index',
    send_first_message: 'client.campaigns.index',
    train_first_chatbot: 'client.ai.chatbots.index',
    connect_first_social_account: 'client.social.accounts.index',
};

const GOAL_PATHS = [
    {
        id: 'ecommerce',
        title: 'Sell Digital Products & 1-Page Checkout',
        desc: 'Set up your hosted store, upload your digital vault, and accept payments across Africa with instant payouts.',
        icon: Store,
        targetRoute: 'client.ecommerce.stores.index',
        badge: 'Top Pick for Creators',
        color: 'from-blue-500/10 to-indigo-500/10 border-indigo-200 dark:border-indigo-800'
    },
    {
        id: 'whatsapp_ai',
        title: 'Deploy WhatsApp AI Sales Closer',
        desc: 'Connect your WhatsApp number (Meta Cloud API or Personal QR) and let autonomous AI close deals 24/7.',
        icon: Bot,
        targetRoute: 'client.ai.chatbots.index',
        badge: 'Most Popular',
        color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800'
    },
    {
        id: 'social',
        title: 'Plan & Schedule Multi-Network Socials',
        desc: 'Connect Facebook, Instagram, Twitter/X, and LinkedIn to schedule 30 days of viral content in minutes.',
        icon: Share2,
        targetRoute: 'client.social.composer',
        badge: 'Time Saver',
        color: 'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800'
    },
    {
        id: 'leads',
        title: 'Scrape B2B Leads & Fill Your Pipeline',
        desc: 'Scrape hundreds of verified business phone numbers and emails directly from Google Maps in any city.',
        icon: MapPin,
        targetRoute: 'client.leads.index',
        badge: 'High Conversion',
        color: 'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800'
    }
];

function safeRoute(name, ...args) {
    try {
        if (typeof route !== 'undefined') {
            return route(name, ...args);
        }
        return '#';
    } catch {
        return '#';
    }
}

export default function OnboardingWizard({ progress = {} }) {
    const { t } = useTranslation();
    const page = usePage();
    const user = page.props.auth?.user;
    const { steps = [], is_complete = false } = progress;
    const [selectedGoal, setSelectedGoal] = useState(GOAL_PATHS[0].id);

    const completedCount = steps.filter(s => s.completed).length;
    const totalCount = steps.length || 7;
    const currentPercent = Math.round((completedCount / totalCount) * 100);

    const markComplete = (stepKey) => {
        fetch(safeRoute('client.onboarding.complete'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
            },
            body: JSON.stringify({ step: stepKey }),
        }).then(() => router.reload());
    };

    return (
        <ClientLayout title={t('onboarding.title', 'Growth Copilot Onboarding')}>
            <Head title={t('onboarding.title', 'Growth Copilot Onboarding')} />

            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                {/* 1. Botify Copilot Welcome & Gamification Header */}
                <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-indigo-50/40 p-6 sm:p-8 shadow-xs dark:border-brand-900/50 dark:from-brand-950/40 dark:via-neutral-900 dark:to-indigo-950/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Let's get you set up, {user?.name?.split(' ')[0] || 'Creator'}!
                                    </h1>
                                    <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400">
                                        ⚡ +250 XP
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300 leading-relaxed max-w-xl">
                                    Hi, I'm your <strong>Botify Copilot</strong>. Select what you want to achieve first, and I will guide you through getting your growth engine running.
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            <Link
                                href={safeRoute('client.dashboard')}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 transition"
                            >
                                Skip to Dashboard →
                            </Link>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 pt-6 border-t border-brand-200/60 dark:border-brand-900/40">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-2">
                            <span>Setup Progress: {completedCount} of {totalCount} completed</span>
                            <span className="text-brand-600 dark:text-brand-400 font-bold">{currentPercent}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-brand-950">
                            <div
                                className="h-full rounded-full bg-brand-600 transition-all duration-500"
                                style={{ width: `${currentPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Choose Your Primary Goal (Serlzo Sio Branching Pattern) */}
                <div>
                    <div className="mb-4">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            What is your primary marketing goal?
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">
                            Pick the outcome you want to unlock first. You can always use all other tools anytime.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {GOAL_PATHS.map((goal) => {
                            const Icon = goal.icon;
                            const isSelected = selectedGoal === goal.id;
                            return (
                                <div
                                    key={goal.id}
                                    onClick={() => setSelectedGoal(goal.id)}
                                    className={[
                                        'cursor-pointer rounded-xl border p-5 transition-all duration-150 relative bg-gradient-to-br',
                                        goal.color,
                                        isSelected
                                            ? 'border-brand-600 ring-2 ring-brand-600/20 bg-white dark:bg-neutral-900 shadow-sm'
                                            : 'bg-white/80 dark:bg-neutral-900/60 hover:border-slate-300 dark:hover:border-neutral-700'
                                    ].join(' ')}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs dark:bg-neutral-800 text-brand-600 dark:text-brand-400">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                                            {goal.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                        {goal.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed mb-4">
                                        {goal.desc}
                                    </p>
                                    <Link
                                        href={safeRoute(goal.targetRoute)}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                    >
                                        Launch Setup <ChevronRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Actionable Milestone Checklist */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                {t('onboarding.checklist_title', 'Core Activation Checklist')}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-neutral-400">
                                Complete these steps to qualify for higher campaign sending limits and verified status.
                            </p>
                        </div>
                        {is_complete && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> All Done!
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {steps.map((step, i) => {
                            const linkRoute = STEP_LINKS[step.key];
                            const href = linkRoute ? safeRoute(linkRoute) : null;

                            return (
                                <div
                                    key={step.key}
                                    className={[
                                        'flex items-center justify-between gap-4 p-4 rounded-xl border transition duration-150',
                                        step.completed
                                            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                            : 'border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 hover:border-slate-300'
                                    ].join(' ')}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="shrink-0">
                                            {step.completed ? (
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            ) : (
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-300 text-xs font-bold text-slate-400 dark:border-neutral-700">
                                                    {i + 1}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-semibold truncate ${step.completed ? 'text-emerald-800 dark:text-emerald-300 line-through opacity-80' : 'text-slate-900 dark:text-white'}`}>
                                                {step.label}
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                                                {step.completed ? 'Completed • +35 XP earned' : 'Required for activation • Worth 35 XP'}
                                            </p>
                                        </div>
                                    </div>

                                    {!step.completed && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            {href && (
                                                <Link
                                                    href={href}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 transition"
                                                >
                                                    Start <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => markComplete(step.key)}
                                                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline px-2 py-1"
                                            >
                                                {t('onboarding.mark_done', 'Mark Done')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
