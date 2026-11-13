import ClientLayout from '@/Layouts/ClientLayout';
import ProductTour from '@/Components/ProductTour';
import { Head, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Users,
    CheckSquare,
    ArrowRight,
    Send,
    MessageSquare,
    Inbox,
    Contact as ContactIcon,
    Megaphone,
    Workflow,
    Sparkles,
    AlertCircle,
    Plus,
    CreditCard,
    ArrowUpRight,
    Share2,
    MapPin,
    Radio,
    ShieldAlert,
    TrendingUp
} from 'lucide-react';
import { LineChart, BarChart, DonutChart } from '@/Components/Charts';
import { WidgetCard, EmptyState } from '@/Components/Dashboard';

const fromCents = (c) => `$${((c || 0) / 100).toFixed(2)}`;
const spark = (arr, keys) =>
    (arr || []).map((d) => ({ v: keys.reduce((s, k) => s + Number(d[k] || 0), 0) }));
const sumRow = (d) => Object.entries(d).reduce((s, [k, v]) => (k === 'date' ? s : s + Number(v || 0)), 0);

function formatDate(iso) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

function relTime(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

const STEP_ROUTES = {
    verify_email: null,
    choose_plan: 'client.pricing',
    connect_first_channel: 'client.whatsapp.templates.index',
    import_first_contacts: 'client.contacts.index',
    send_first_message: 'client.campaigns.index',
    train_first_chatbot: 'client.ai.chatbots.index',
    connect_first_social_account: 'client.social.accounts.index',
};

const CONV_TONE = {
    open: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200',
    pending: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200',
    resolved: 'text-slate-600 bg-slate-100 dark:bg-neutral-800 dark:text-neutral-400 border-slate-200',
    snoozed: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200',
};

const CAMPAIGN_TONE = {
    completed: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
    sending: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300',
    queued: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
    paused: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
    draft: 'text-slate-600 bg-slate-100 dark:bg-neutral-800 dark:text-neutral-400',
    failed: 'text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300',
};

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

export default function Dashboard({
    range = 30,
    hasWorkspace = false,
    currentPlan = null,
    renewsAt = null,
    managedByAdmin = false,
    usage = {},
    isClientAdministrator = false,
    workspacesCount = 0,
    onboardingNextStep = null,
    onboardingPercent = 0,
    stats = null,
    charts = {},
    tables = {},
}) {
    const { t } = useTranslation();
    const page = usePage();
    const user = page.props.auth?.user;
    const { first_run = false } = page.props;
    const s = stats ?? {};

    const messageChannelKeys = [
        ...new Set((charts.messages ?? []).flatMap((d) => Object.keys(d).filter((k) => k !== 'date'))),
    ];
    const automationKeys = [
        ...new Set((charts.automation_runs ?? []).flatMap((d) => Object.keys(d).filter((k) => k !== 'date'))),
    ];
    const hasAutomationData = (charts.automation_runs ?? []).some((d) => sumRow(d) > 0);
    const hasSocialData = (charts.social_posts ?? []).length > 0;

    const quickActions = [
        {
            label: t('quick_action.campaign', 'New Campaign'),
            icon: Megaphone,
            href: safeRoute('client.campaigns.index'),
            color: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800',
        },
        {
            label: t('quick_action.social', 'Compose Post'),
            icon: Share2,
            href: safeRoute('client.social.composer'),
            color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        },
        {
            label: t('quick_action.workflow', 'Create Workflow'),
            icon: Workflow,
            href: safeRoute('client.automations.index'),
            color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        },
        {
            label: t('quick_action.leads', 'Scrape Leads'),
            icon: MapPin,
            href: safeRoute('client.leads.index'),
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        },
    ];

    return (
        <ClientLayout title={t('client.dashboard') || 'Dashboard'}>
            <ProductTour show={first_run} />
            <Head title={t('client.dashboard') || 'Dashboard'} />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* 1. Header & Segmented Range Filter */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-neutral-800 pb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {t('client.welcome_back', 'Welcome back')}, {user?.name?.split(' ')[0] || 'Marketer'} 👋
                            </h1>
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400">
                                ⚡ {onboardingPercent >= 100 ? '150 XP' : '30 XP'}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                            {t('client.dashboard_overview_sub', 'Your multi-channel growth metrics, active automations, and audience insights.')}
                        </p>
                    </div>

                    {/* Segmented Time Range Pills (Serlzo 24h / 7d / 30d / 90d style) */}
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
                        {[
                            { days: 7, label: '7 Days' },
                            { days: 30, label: '30 Days' },
                            { days: 90, label: '90 Days' },
                        ].map((item) => (
                            <Link
                                key={item.days}
                                href={safeRoute('client.dashboard', { range: item.days })}
                                preserveScroll
                                className={[
                                    'px-3 py-1.5 text-xs font-semibold rounded-md transition duration-150',
                                    range === item.days
                                        ? 'bg-slate-900 text-white shadow-xs dark:bg-brand-600'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white',
                                ].join(' ')}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 2. Onboarding / Next-Step Goal Nudge Banner */}
                {onboardingNextStep && onboardingPercent < 100 && (
                    <div className="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50/80 via-white to-brand-50/40 p-4 sm:p-5 shadow-xs dark:border-brand-900/50 dark:from-brand-950/30 dark:via-neutral-900 dark:to-brand-950/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                                            {t('onboarding.copilot_checklist', 'Botify Copilot Goal')}
                                        </span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                                            {onboardingPercent}% Complete
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                                        {t('client.next_step')}: {onboardingNextStep.label}
                                    </p>
                                    <div className="mt-2 h-1.5 w-48 sm:w-64 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-950">
                                        <div
                                            className="h-full rounded-full bg-brand-600 transition-all duration-500"
                                            style={{ width: `${onboardingPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {STEP_ROUTES[onboardingNextStep.key] && (
                                    <Link
                                        href={safeRoute(STEP_ROUTES[onboardingNextStep.key])}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition"
                                    >
                                        {t('client.complete_step', 'Complete Action')} <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                )}
                                <Link
                                    href={safeRoute('client.onboarding.show')}
                                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white underline underline-offset-4"
                                >
                                    {t('client.view_all_tasks', 'View Checklist')}
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Quick Action Launch Dock */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.label}
                                href={action.href}
                                className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:border-brand-300 hover:shadow-xs transition duration-150 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-700"
                            >
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${action.color} transition group-hover:scale-105`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-brand-600 dark:text-neutral-200 dark:group-hover:text-brand-400 transition">
                                        {action.label}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-neutral-500">
                                        {t('common.launch', 'Launch')} →
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* 4. Performance Snapshot - 4 Executive KPI Cards */}
                {hasWorkspace && stats && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Contacts / Audience */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                                <span className="text-xs font-semibold uppercase tracking-wider">{t('client.kpi_contacts', 'Total Contacts')}</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                    <Users className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                                    {(s.contacts_total ?? 0).toLocaleString()}
                                </span>
                                {s.contacts_new_delta !== undefined && (
                                    <span className={`text-xs font-semibold ${s.contacts_new_delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {s.contacts_new_delta >= 0 ? '+' : ''}{s.contacts_new_delta}%
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
                                <span>+{s.contacts_new ?? 0} in last {range}d</span>
                                <Link href={safeRoute('client.contacts.index')} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                                    View CRM →
                                </Link>
                            </div>
                        </div>

                        {/* Messages Sent */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                                <span className="text-xs font-semibold uppercase tracking-wider">{t('client.kpi_messages_sent', 'Messages Sent')}</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    <Send className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                                    {(s.messages_out ?? 0).toLocaleString()}
                                </span>
                                {s.messages_out_delta !== undefined && (
                                    <span className={`text-xs font-semibold ${s.messages_out_delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {s.messages_out_delta >= 0 ? '+' : ''}{s.messages_out_delta}%
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
                                <span>{(s.messages_in ?? 0).toLocaleString()} inbound replies</span>
                                <Link href={safeRoute('client.inbox.index')} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                                    Open Inbox →
                                </Link>
                            </div>
                        </div>

                        {/* Active Automations & Workflows */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                                <span className="text-xs font-semibold uppercase tracking-wider">{t('client.kpi_automations', 'Active Workflows')}</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                    <Workflow className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                                    {(s.automations_active ?? 0).toLocaleString()}
                                </span>
                                <span className="text-xs font-semibold text-emerald-600">Running 24/7</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
                                <span>Multi-channel flows</span>
                                <Link href={safeRoute('client.automations.index')} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                                    Manage →
                                </Link>
                            </div>
                        </div>

                        {/* AI Runs & Conversations Closed */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                                <span className="text-xs font-semibold uppercase tracking-wider">{t('client.kpi_ai_runs', 'AI Sales Runs')}</span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                                    {(s.ai_runs ?? 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-neutral-400">
                                    {fromCents(s.ai_cost_cents)} cost
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
                                <span>WhatsApp & Chatbots</span>
                                <Link href={safeRoute('client.ai.chatbots.index')} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                                    AI Agent →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Channel Alert / Local Payout Banner */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                                Ready to accept payments & run WhatsApp marketing?
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                Connect Paystack, Flutterwave or Stripe to activate 1-click checkout with Naira & local currency payouts.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={safeRoute('client.ecommerce.wallet.index')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition shrink-0"
                    >
                        Configure Wallet & Payouts <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {/* 6. Main Analytics Charts (3 Columns) */}
                {hasWorkspace && (
                    <>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <WidgetCard title={t('client.chart_messages') || 'Messages by Channel'}>
                                {messageChannelKeys.length > 0 ? (
                                    <LineChart data={charts.messages ?? []} xKey="date" yKeys={messageChannelKeys} height={200} />
                                ) : (
                                    <EmptyState>{t('client.no_data') || 'No messaging data for this period'}</EmptyState>
                                )}
                            </WidgetCard>
                            <WidgetCard title={t('client.chart_conversations') || 'Conversation Influx'}>
                                <LineChart
                                    data={charts.conversations ?? []}
                                    xKey="date"
                                    yKeys={['opened', 'resolved']}
                                    labels={{ opened: t('client.chart_opened', 'Opened'), resolved: t('client.chart_resolved', 'Resolved') }}
                                    height={200}
                                />
                            </WidgetCard>
                            <WidgetCard title={t('client.chart_channel_mix') || 'Channel Distribution'}>
                                {(charts.channel_mix ?? []).length > 0 ? (
                                    <DonutChart data={charts.channel_mix} nameKey="name" valueKey="value" height={200} innerRadius={48} outerRadius={80} />
                                ) : (
                                    <EmptyState>{t('client.no_data') || 'No channel distribution recorded'}</EmptyState>
                                )}
                            </WidgetCard>
                        </div>

                        {/* 7. Secondary Analytics & Activity Tables */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* Recent Conversations */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        {t('client.recent_conversations', 'Recent Conversations')}
                                    </h3>
                                    <Link href={safeRoute('client.inbox.index')} className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                                        {t('client.view_all', 'View all')} →
                                    </Link>
                                </div>
                                {(tables.recent_conversations ?? []).length === 0 ? (
                                    <p className="py-8 text-center text-xs text-slate-400 dark:text-neutral-500">
                                        No conversations recorded yet. Connect a channel to receive messages.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                                        {(tables.recent_conversations ?? []).slice(0, 5).map((conv) => (
                                            <div key={conv.id} className="flex items-center justify-between py-2.5">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-neutral-200">
                                                        {conv.contact?.name || conv.contact?.phone || 'Customer'}
                                                    </p>
                                                    <p className="truncate text-[11px] text-slate-400 dark:text-neutral-500">
                                                        {conv.snippet || 'No message snippet'}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CONV_TONE[conv.status] || CONV_TONE.resolved}`}>
                                                    {conv.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent Campaigns */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        {t('client.recent_campaigns', 'Recent Broadcast Campaigns')}
                                    </h3>
                                    <Link href={safeRoute('client.campaigns.index')} className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                                        {t('client.view_all', 'View all')} →
                                    </Link>
                                </div>
                                {(tables.recent_campaigns ?? []).length === 0 ? (
                                    <p className="py-8 text-center text-xs text-slate-400 dark:text-neutral-500">
                                        No campaigns sent yet. Create your first broadcast to reach your audience.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                                        {(tables.recent_campaigns ?? []).slice(0, 5).map((camp) => (
                                            <div key={camp.id} className="flex items-center justify-between py-2.5">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-neutral-200">
                                                        {camp.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                                                        {camp.channel?.toUpperCase()} • {relTime(camp.created_at)}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${CAMPAIGN_TONE[camp.status] || CAMPAIGN_TONE.draft}`}>
                                                    {camp.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </ClientLayout>
    );
}
