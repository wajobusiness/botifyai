import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import ClientLayout from '@/Layouts/ClientLayout';
import { toast } from 'sonner';
import {
    Megaphone,
    Users,
    UserCheck,
    ShoppingBag,
    CreditCard,
    Sparkles,
    Send,
    Clock,
    Filter,
    Plus,
    Trash2,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    Mail,
    BarChart3,
    Layers,
    Tag,
    Search,
    Eye,
    Play,
    Pause,
    FlaskConical,
    TrendingUp,
    ShieldCheck,
    Award,
    DollarSign,
    Calendar,
    ChevronRight,
} from 'lucide-react';

const CAMPAIGN_TYPE_OPTIONS = [
    { value: 'newsletter', label: 'Newsletter', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    { value: 'product_launch', label: 'Product Launch', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
    { value: 'announcement', label: 'Announcement', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
    { value: 'educational_series', label: 'Educational Series', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    { value: 'promotional_offer', label: 'Promotional Offer', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' },
    { value: 'holiday_campaign', label: 'Holiday Campaign', badge: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' },
    { value: 'customer_update', label: 'Customer Updates', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' },
    { value: 'feature_release', label: 'Feature Releases', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
    { value: 'maintenance_notice', label: 'Maintenance Notices', badge: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300' },
];

const AUDIENCE_COHORT_OPTIONS = [
    { value: 'all_users', label: 'All Contacts & Users', description: 'Every unified contact in the platform marketing directory' },
    { value: 'only_registered_users', label: 'Only Registered Users', description: 'Everyone with a registered platform account' },
    { value: 'verified_users', label: 'Only Verified Users', description: 'Registered users with verified email addresses' },
    { value: 'only_buyers', label: 'Only Buyers (Customers)', description: 'Customers who have completed at least one purchase' },
    { value: 'only_subscribers', label: 'Only Subscribers (All)', description: 'Users with current or past SaaS subscriptions' },
    { value: 'only_active_subscribers', label: 'Only Active Subscribers', description: 'Users with active or trialing SaaS subscriptions' },
    { value: 'product_buyers', label: 'Only Specific Product Buyers', description: 'Customers who purchased specific courses or products' },
    { value: 'high_value_customers', label: 'Only High-Value Customers (VIP)', description: 'Customers above the lifetime spending threshold' },
    { value: 'inactive_users', label: 'Only Inactive Customers', description: 'Registered users who have never completed a purchase' },
    { value: 'recent_customers', label: 'Only Recent Customers', description: 'Customers who purchased within the last N days' },
    { value: 'affiliates', label: 'Only Affiliates', description: 'Active and comped affiliate partners' },
    { value: 'segment', label: 'Only Custom Filter / Segment', description: 'Contacts matching a saved dynamic or static segment' },
    { value: 'tag', label: 'Only Specific Tag', description: 'Contacts with a specific CRM lifecycle tag' },
    { value: 'selected_contacts', label: 'Only Selected Contacts', description: 'Hand-picked contacts from the Audience Explorer' },
];

const SEGMENT_FIELD_OPTIONS = [
    { value: 'is_registered_user', label: 'Registered User (1 or 0)', operators: ['=', '!='] },
    { value: 'email_verified', label: 'Email Verified (1 or 0)', operators: ['=', '!='] },
    { value: 'subscription_status', label: 'Subscription Status (active, trialing, none, expired)', operators: ['=', '!='] },
    { value: 'plan_id', label: 'Subscription Plan ID', operators: ['=', '!='] },
    { value: 'purchased_product_id', label: 'Purchased Product ID', operators: ['=', '!='] },
    { value: 'order_count', label: 'Completed Order Count', operators: ['=', '!=', '>=', '<=', '>', '<'] },
    { value: 'lifetime_value', label: 'Lifetime Spending ($)', operators: ['>=', '<=', '>', '<', '='] },
    { value: 'last_order_at', label: 'Last Purchase Date (YYYY-MM-DD)', operators: ['>=', '<=', 'is_null', 'is_not_null'] },
    { value: 'created_at', label: 'Registration Date (YYYY-MM-DD)', operators: ['>=', '<='] },
    { value: 'country', label: 'Country Code (e.g. US, NG, GB)', operators: ['=', '!='] },
    { value: 'tag_id', label: 'CRM Tag ID', operators: ['=', '!='] },
    { value: 'affiliate_status', label: 'Affiliate Status (active, comped, inactive)', operators: ['=', '!='] },
];

export default function AdminMarketingIndex({
    scope = null,
    kpis = {},
    campaignPerformance = {},
    productBuyerCohorts = [],
    recentSales = [],
    recentSignups = [],
    audienceGrowth = [],
    contacts = { data: [], links: [] },
    segments = [],
    tags = [],
    campaigns = [],
    products = [],
    plans = [],
    coupons = [],
    smtpConfigs = [],
    contactTokens = [],
    filters = {},
}) {
    const { flash } = usePage().props;
    const isAppRoute = scope === 'workspace' || (scope !== 'admin' && typeof window !== 'undefined' && window.location.pathname.startsWith('/app'));
    const basePath = isAppRoute ? '/app/marketing' : '/admin/marketing';
    const LayoutComponent = isAppRoute ? ClientLayout : AdminLayout;
    const [activeTab, setActiveTab] = useState(filters.tab || 'overview');
    const [syncing, setSyncing] = useState(false);

    // Audience Explorer filter state
    const [explorerPreset, setExplorerPreset] = useState(filters.preset || 'all_users');
    const [explorerRef, setExplorerRef] = useState(filters.preset_ref || '');
    const [searchQuery, setSearchQuery] = useState(filters.q || '');
    const [optInFilter, setOptInFilter] = useState(filters.opt_in || '');
    const [selectedContactIds, setSelectedContactIds] = useState([]);

    // Custom Segment Builder state
    const [segmentForm, setSegmentForm] = useState({
        id: null,
        name: '',
        type: 'dynamic',
        combinator: 'AND',
        conditions: [{ field: 'order_count', operator: '>=', value: '1' }],
    });
    const [savingSegment, setSavingSegment] = useState(false);

    // Campaign Builder & AI Studio state
    const [campaignForm, setCampaignForm] = useState({
        id: null,
        name: '',
        campaign_type: 'newsletter',
        audience_type: 'all_users',
        audience_ref: '',
        subject: '',
        preheader: '',
        body: '',
        from_name: '',
        from_email: '',
        reply_to: '',
        track_opens: true,
        track_clicks: true,
        schedule_mode: 'immediate', // immediate | scheduled | recurring
        schedule_at: '',
        recurrence_frequency: 'weekly',
    });
    const [previewStats, setPreviewStats] = useState({ matched: 0, deliverable: 0, suppressed: 0, sample: [] });
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showHtmlPreview, setShowHtmlPreview] = useState(false);
    const [savingCampaign, setSavingCampaign] = useState(false);

    // AI Assistant state
    const [aiGoal, setAiGoal] = useState('');
    const [aiTone, setAiTone] = useState('professional & engaging');
    const [aiProductId, setAiProductId] = useState('');
    const [aiCouponCode, setAiCouponCode] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSubjectSuggestions, setAiSubjectSuggestions] = useState([]);
    const [aiRecommendation, setAiRecommendation] = useState(null);

    // Test Send state
    const [testEmail, setTestEmail] = useState('');
    const [testingCampaignId, setTestingCampaignId] = useState(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Fetch live audience preview whenever campaign audience changes on the Campaigns tab
    useEffect(() => {
        if (activeTab !== 'campaigns') return;
        let cancelled = false;
        setLoadingPreview(true);

        window.axios
            .post(`${basePath}/audience-preview`, {
                audience_type: campaignForm.audience_type,
                audience_ref: String(campaignForm.audience_ref || ''),
            })
            .then((res) => {
                if (!cancelled && res.data) {
                    setPreviewStats(res.data);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setLoadingPreview(false);
            });

        return () => {
            cancelled = true;
        };
    }, [activeTab, campaignForm.audience_type, campaignForm.audience_ref, basePath]);

    const handleSyncAudience = () => {
        setSyncing(true);
        router.post(
            `${basePath}/sync`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSyncing(false),
            }
        );
    };

    const applyExplorerFilters = (nextPreset = explorerPreset, nextRef = explorerRef, nextQ = searchQuery, nextOptIn = optInFilter) => {
        router.get(
            basePath,
            {
                tab: 'audience',
                preset: nextPreset,
                preset_ref: nextRef || undefined,
                q: nextQ || undefined,
                opt_in: nextOptIn || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const startCampaignForCohort = (audienceType, audienceRef = '', defaultName = '', campaignType = 'newsletter') => {
        setCampaignForm((prev) => ({
            ...prev,
            name: defaultName || prev.name || `Campaign - ${new Date().toLocaleDateString()}`,
            campaign_type: campaignType,
            audience_type: audienceType,
            audience_ref: String(audienceRef || ''),
        }));
        setActiveTab('campaigns');
    };

    const toggleSelectContact = (id) => {
        setSelectedContactIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const handleSaveSegment = (e) => {
        e.preventDefault();
        if (!segmentForm.name.trim()) {
            toast.error('Please enter a segment name.');
            return;
        }
        setSavingSegment(true);
        router.post(
            `${basePath}/segments`,
            {
                id: segmentForm.id,
                name: segmentForm.name,
                type: segmentForm.type,
                rules_json: {
                    combinator: segmentForm.combinator,
                    conditions: segmentForm.conditions,
                },
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSegmentForm({
                        id: null,
                        name: '',
                        type: 'dynamic',
                        combinator: 'AND',
                        conditions: [{ field: 'order_count', operator: '>=', value: '1' }],
                    });
                },
                onFinish: () => setSavingSegment(false),
            }
        );
    };

    const handleAiAssist = async (action = 'generate_campaign') => {
        if (!aiGoal.trim() && !campaignForm.subject.trim()) {
            toast.error('Enter a campaign goal or topic for the AI Assistant.');
            return;
        }
        setAiLoading(true);
        try {
            const { data } = await window.axios.post(`${basePath}/ai-assist`, {
                action,
                campaign_type: campaignForm.campaign_type,
                goal: aiGoal || campaignForm.subject || campaignForm.name,
                tone: aiTone,
                product_id: aiProductId ? Number(aiProductId) : null,
                coupon_code: aiCouponCode || null,
                current_subject: campaignForm.subject || null,
            });

            if (action === 'improve_subject' && data.suggestions) {
                setAiSubjectSuggestions(data.suggestions);
                toast.success('Generated 5 high-converting subject line angles!');
            } else if (data.campaign) {
                setCampaignForm((prev) => ({
                    ...prev,
                    name: prev.name || aiGoal.slice(0, 60),
                    subject: data.campaign.subject || prev.subject,
                    preheader: data.campaign.preheader || prev.preheader,
                    body: data.campaign.body || prev.body,
                }));
                setAiRecommendation({
                    recommended_audience: data.campaign.recommended_audience,
                    recommended_send_time: data.campaign.recommended_send_time,
                    cta_text: data.campaign.cta_text,
                });
                toast.success('AI campaign draft generated!');
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'AI Assistant could not generate content.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSaveCampaign = (launchNow = false) => {
        if (!campaignForm.name.trim() || !campaignForm.subject.trim() || !campaignForm.body.trim()) {
            toast.error('Campaign Name, Subject Line, and Email Body are required.');
            return;
        }
        setSavingCampaign(true);
        router.post(
            `${basePath}/campaigns`,
            {
                id: campaignForm.id,
                name: campaignForm.name,
                campaign_type: campaignForm.campaign_type,
                audience_type: campaignForm.audience_type,
                audience_ref: String(campaignForm.audience_ref || ''),
                subject: campaignForm.subject,
                preheader: campaignForm.preheader,
                body: campaignForm.body,
                from_name: campaignForm.from_name,
                from_email: campaignForm.from_email,
                reply_to: campaignForm.reply_to,
                track_opens: campaignForm.track_opens,
                track_clicks: campaignForm.track_clicks,
                schedule_at: campaignForm.schedule_mode !== 'immediate' ? campaignForm.schedule_at : null,
                recurrence_rule:
                    campaignForm.schedule_mode === 'recurring'
                        ? { frequency: campaignForm.recurrence_frequency }
                        : null,
                launch_now: launchNow,
            },
            {
                preserveScroll: true,
                onFinish: () => setSavingCampaign(false),
            }
        );
    };

    const handleTestSend = async (campaignId) => {
        if (!testEmail.trim()) {
            toast.error('Enter an email address to receive the test send.');
            return;
        }
        setTestingCampaignId(campaignId);
        try {
            const { data } = await window.axios.post(`${basePath}/campaigns/${campaignId}/test-send`, {
                email: testEmail,
            });
            if (data.ok) {
                toast.success(data.message || 'Test email sent!');
            } else {
                toast.error(data.error || 'Test send failed.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Test send failed.');
        } finally {
            setTestingCampaignId(null);
        }
    };

    const insertToken = (tokenKey) => {
        setCampaignForm((prev) => ({
            ...prev,
            body: `${prev.body}${prev.body ? ' ' : ''}${tokenKey}`,
        }));
        toast.success(`Inserted ${tokenKey}`);
    };

    const maxGrowthVal = Math.max(
        1,
        ...audienceGrowth.map((d) => Math.max(Number(d.signups || 0), Number(d.orders || 0)))
    );

    return (
        <LayoutComponent title="Marketing Hub">
            <Head title={isAppRoute ? 'Marketing Hub & Customer Segmentation' : 'Admin Marketing Hub & Customer Segmentation'} />

            <div className="space-y-6">
                {/* Hero Header */}
                <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-900 p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-200">
                                <Megaphone className="h-3.5 w-3.5" />
                                {isAppRoute ? 'WORKSPACE MARKETING & CRM CONTROL CENTER' : 'CENTRALIZED PLATFORM MARKETING CONTROL CENTER'}
                            </div>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                                {isAppRoute ? 'Marketing Hub & Customer Segmentation' : 'Admin Marketing Hub & Customer Segmentation'}
                            </h1>
                            <p className="mt-1 max-w-3xl text-sm text-indigo-200/90">
                                {isAppRoute
                                    ? 'Manage your workspace contacts, store buyers, custom segments, and AI-powered email campaigns from a single command center.'
                                    : 'Unified customer intelligence across Registered Users, SaaS Subscribers, Digital & Ecommerce Product Buyers, and Affiliates—powered by AI campaign generation and isolated bulk email streams.'}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleSyncAudience}
                                disabled={syncing}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/20 disabled:opacity-50 transition"
                            >
                                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing
                                    ? 'Syncing Audience...'
                                    : isAppRoute
                                    ? 'Sync Store Buyers'
                                    : 'Sync Platform Audience'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('segments')}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/25 transition"
                            >
                                <Filter className="h-4 w-4" />
                                Build Segment
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('campaigns')}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-950 shadow hover:bg-indigo-50 transition"
                            >
                                <Plus className="h-4 w-4" />
                                Create Campaign
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                        {[
                            { id: 'overview', label: 'Control Center Dashboard', icon: BarChart3 },
                            { id: 'audience', label: `Audience & Buyers (${kpis.total_contacts ?? 0})`, icon: Users },
                            { id: 'segments', label: `Segments (${segments.length})`, icon: Layers },
                            { id: 'campaigns', label: `Campaign Builder & AI Studio (${campaigns.length})`, icon: Send },
                        ].map((t) => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                                        isActive
                                            ? 'bg-white text-indigo-950 shadow-sm'
                                            : 'text-indigo-100 hover:bg-white/10'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* =========================================================
                    TAB 1: CONTROL CENTER DASHBOARD
                   ========================================================= */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Primary Audience & Revenue KPI Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-neutral-500">
                                        {isAppRoute ? 'Total Contacts' : 'Registered Users'}
                                    </span>
                                    <Users className="h-4 w-4 text-blue-500" />
                                </div>
                                <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                                    {(kpis.total_users ?? 0).toLocaleString()}
                                </p>
                                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                    {(kpis.verified_users ?? 0).toLocaleString()} {isAppRoute ? 'opted-in' : 'verified'} • +{kpis.todays_registrations ?? 0} today
                                </p>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-neutral-500">Customers / Buyers</span>
                                    <ShoppingBag className="h-4 w-4 text-pink-500" />
                                </div>
                                <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                                    {(kpis.total_customers ?? 0).toLocaleString()}
                                </p>
                                <p className="mt-1 text-xs text-pink-600 dark:text-pink-400">
                                    +{kpis.todays_purchases ?? 0} orders today (${(kpis.todays_revenue ?? 0).toLocaleString()})
                                </p>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-neutral-500">
                                        {isAppRoute ? 'Email Subscribers' : 'Active Subscribers'}
                                    </span>
                                    <CreditCard className="h-4 w-4 text-purple-500" />
                                </div>
                                <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                                    {(kpis.active_subscribers ?? 0).toLocaleString()}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => startCampaignForCohort('only_active_subscribers', '', 'Subscriber Update', 'customer_update')}
                                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline dark:text-purple-400"
                                >
                                    Message subscribers <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-neutral-500">High-Value (VIP)</span>
                                    <Award className="h-4 w-4 text-amber-500" />
                                </div>
                                <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                                    {(kpis.high_value_customers ?? 0).toLocaleString()}
                                </p>
                                <p className="mt-1 text-xs text-neutral-500">
                                    LTV ≥ ${kpis.vip_threshold ?? 500}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-neutral-500">
                                        {isAppRoute ? 'Non-Buyer Contacts' : 'Inactive Registered'}
                                    </span>
                                    <Clock className="h-4 w-4 text-orange-500" />
                                </div>
                                <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                                    {(kpis.inactive_users ?? 0).toLocaleString()}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => startCampaignForCohort('inactive_users', '', 'Win-Back Offer', 'promotional_offer')}
                                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
                                >
                                    Send activation offer <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-neutral-500">Deliverable Opt-In</span>
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                </div>
                                <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                                    {(kpis.deliverable_contacts ?? 0).toLocaleString()}
                                </p>
                                <p className="mt-1 text-xs text-neutral-500">
                                    {kpis.suppressed_contacts ?? 0} unsubscribed / bounced
                                </p>
                            </div>
                        </div>

                        {/* Campaign Performance Summary Strip */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                        {isAppRoute ? 'Workspace Campaign Performance & Deliverability' : 'Platform Campaign Performance & Deliverability'}
                                    </h2>
                                    <p className="text-xs text-neutral-500">
                                        Real-time engagement telemetry across {campaignPerformance.total_campaigns ?? 0} {isAppRoute ? 'workspace' : 'admin'} marketing campaigns
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                                    <div className="rounded-xl bg-neutral-50 px-4 py-2.5 dark:bg-neutral-800/60">
                                        <span className="text-[11px] font-medium uppercase text-neutral-400">Sent</span>
                                        <p className="text-lg font-bold text-neutral-900 dark:text-white">
                                            {(campaignPerformance.sent ?? 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-emerald-50/70 px-4 py-2.5 dark:bg-emerald-950/30">
                                        <span className="text-[11px] font-medium uppercase text-emerald-600 dark:text-emerald-400">Opened</span>
                                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                            {(campaignPerformance.opened ?? 0).toLocaleString()} ({campaignPerformance.open_rate ?? 0}%)
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-indigo-50/70 px-4 py-2.5 dark:bg-indigo-950/30">
                                        <span className="text-[11px] font-medium uppercase text-indigo-600 dark:text-indigo-400">Clicked</span>
                                        <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                                            {(campaignPerformance.clicked ?? 0).toLocaleString()} ({campaignPerformance.click_rate ?? 0}%)
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-amber-50/70 px-4 py-2.5 dark:bg-amber-950/30">
                                        <span className="text-[11px] font-medium uppercase text-amber-600 dark:text-amber-400">Unsubscribed</span>
                                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                            {(campaignPerformance.unsubscribed ?? 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-red-50/70 px-4 py-2.5 dark:bg-red-950/30">
                                        <span className="text-[11px] font-medium uppercase text-red-600 dark:text-red-400">Failed / Bounced</span>
                                        <p className="text-lg font-bold text-red-700 dark:text-red-300">
                                            {(campaignPerformance.failed ?? 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Grid: Product Buyer Cohorts + 14-Day Audience Growth */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            {/* Product Buyers Breakdown (Course A Buyers, Course B Buyers, etc.) */}
                            <div className="lg:col-span-7 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                            Product & Course Buyer Cohorts
                                        </h3>
                                        <p className="text-xs text-neutral-500">
                                            Customers grouped by the products or courses they purchased—launch targeted product updates or upsells in 1 click.
                                        </p>
                                    </div>
                                </div>

                                {productBuyerCohorts.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-500 dark:border-neutral-800">
                                        No paid product orders recorded yet. As customers purchase courses, digital downloads, or store items, their product cohorts will appear here automatically.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
                                            <thead>
                                                <tr className="text-left text-xs font-semibold uppercase text-neutral-500">
                                                    <th className="pb-2.5">Product / Course</th>
                                                    <th className="pb-2.5">Unique Buyers</th>
                                                    <th className="pb-2.5">Revenue</th>
                                                    <th className="pb-2.5 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                                                {productBuyerCohorts.map((row, idx) => (
                                                    <tr key={`${row.product_id || idx}`} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                                                        <td className="py-3 font-medium text-neutral-900 dark:text-white">
                                                            {row.product_name || `Product #${row.product_id}`}
                                                        </td>
                                                        <td className="py-3">
                                                            <span className="inline-flex items-center rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-semibold text-pink-700 dark:bg-pink-950/50 dark:text-pink-300">
                                                                {row.buyers_count} buyers
                                                            </span>
                                                        </td>
                                                        <td className="py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                                                            ${Number(row.total_revenue || 0).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 text-right space-x-2">
                                                            {row.product_id && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setExplorerPreset('product_buyers');
                                                                            setExplorerRef(String(row.product_id));
                                                                            setActiveTab('audience');
                                                                            applyExplorerFilters('product_buyers', String(row.product_id));
                                                                        }}
                                                                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                                                    >
                                                                        View Buyers
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            startCampaignForCohort(
                                                                                'product_buyers',
                                                                                String(row.product_id),
                                                                                `${row.product_name} Buyers Update`,
                                                                                'customer_update'
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                                                                    >
                                                                        <Send className="h-3 w-3" /> Email Buyers
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* 14-Day Audience Growth & Email Stream Isolation Status */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                                14-Day Audience & Sales Growth
                                            </h3>
                                            <p className="text-xs text-neutral-500">
                                                Daily new user registrations vs completed orders
                                            </p>
                                        </div>
                                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <div className="flex items-end gap-1.5 h-36 pt-4">
                                        {audienceGrowth.map((point, idx) => {
                                            const signupH = Math.max(6, Math.round((Number(point.signups || 0) / maxGrowthVal) * 100));
                                            const orderH = Math.max(4, Math.round((Number(point.orders || 0) / maxGrowthVal) * 100));
                                            return (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                                    <div className="w-full flex items-end justify-center gap-0.5 h-24">
                                                        <div
                                                            style={{ height: `${signupH}%` }}
                                                            title={`${point.date}: ${point.signups} signups`}
                                                            className="w-2 rounded-t bg-indigo-500"
                                                        />
                                                        <div
                                                            style={{ height: `${orderH}%` }}
                                                            title={`${point.date}: ${point.orders} orders`}
                                                            className="w-2 rounded-t bg-pink-500"
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-neutral-400 truncate max-w-full">
                                                        {point.date.split(' ')[1]}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 flex items-center justify-center gap-4 text-xs text-neutral-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> New Signups
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="h-2.5 w-2.5 rounded-sm bg-pink-500" /> Paid Orders
                                        </span>
                                    </div>
                                </div>

                                {/* Deliverability & Stream Isolation Card */}
                                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                                            Email Stream Isolation & Compliance
                                        </h3>
                                        <Link
                                            href={isAppRoute ? '/app/email-server' : '/admin/email-system'}
                                            className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                            Configure SMTP →
                                        </Link>
                                    </div>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        Marketing campaigns run on the isolated <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">broadcast</code> queue with RFC 8058 One-Click Unsubscribe headers so transactional receipts & password resets are never delayed.
                                    </p>
                                    <div className="mt-3 space-y-2">
                                        {smtpConfigs.length === 0 ? (
                                            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                Using default system mailer. Add a dedicated Marketing SMTP configuration in Email System for stream separation.
                                            </div>
                                        ) : (
                                            smtpConfigs.map((cfg) => (
                                                <div
                                                    key={cfg.id}
                                                    className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/70 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-800/50"
                                                >
                                                    <div>
                                                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                            {cfg.name || cfg.host}
                                                        </span>
                                                        <span className="ml-2 text-neutral-400">({cfg.from_email})</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                            {cfg.purpose || 'both'}
                                                        </span>
                                                        {cfg.is_active && (
                                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                                ACTIVE
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Grid: Recent Sales & Recent Signups */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3">
                                    Recent Paid Sales
                                </h3>
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {recentSales.length === 0 ? (
                                        <p className="py-6 text-center text-xs text-neutral-400">No paid orders yet.</p>
                                    ) : (
                                        recentSales.map((order) => (
                                            <div key={order.id} className="flex items-center justify-between py-2.5 text-xs">
                                                <div>
                                                    <p className="font-semibold text-neutral-900 dark:text-white">
                                                        {order.customer_name || order.customer_email}{' '}
                                                        <span className="font-normal text-neutral-400">({order.order_number})</span>
                                                    </p>
                                                    <p className="text-neutral-500">
                                                        {(order.items || []).map((i) => i.product_name).join(', ') || 'Store Purchase'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {order.currency} {Number(order.total_amount || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3">
                                    {isAppRoute ? 'Recent Contacts & Leads' : 'Recent User Signups'}
                                </h3>
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {recentSignups.length === 0 ? (
                                        <p className="py-6 text-center text-xs text-neutral-400">No contacts recorded yet.</p>
                                    ) : (
                                        recentSignups.map((u) => (
                                            <div key={u.id} className="flex items-center justify-between py-2.5 text-xs">
                                                <div>
                                                    <p className="font-semibold text-neutral-900 dark:text-white">{u.name}</p>
                                                    <p className="text-neutral-500">{u.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {u.email_verified_at ? (
                                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                            {isAppRoute ? 'Opted-In' : 'Verified'}
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                                            {isAppRoute ? 'Unsubscribed' : 'Unverified'}
                                                        </span>
                                                    )}
                                                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                        {u.active_role || u.role}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================
                    TAB 2: AUDIENCE & BUYERS EXPLORER
                   ========================================================= */}
                {activeTab === 'audience' && (
                    <div className="space-y-5">
                        {/* Smart Audience Preset Pills */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                        Unified Customer & Audience Directory
                                    </h2>
                                    <p className="text-xs text-neutral-500">
                                        Filter by lifecycle stage, subscription status, product purchased, or spending—then launch a targeted campaign.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {selectedContactIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                startCampaignForCohort(
                                                    'selected_contacts',
                                                    selectedContactIds.join(','),
                                                    `Selected Contacts (${selectedContactIds.length})`
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            Campaign Selected ({selectedContactIds.length})
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            startCampaignForCohort(
                                                explorerPreset,
                                                explorerRef,
                                                `Campaign - ${explorerPreset.replace(/_/g, ' ')}`
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        Campaign This Cohort
                                    </button>
                                </div>
                            </div>

                            {/* Preset Cohort Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'all_users', label: 'All Contacts' },
                                    { key: 'only_registered_users', label: 'Registered Users' },
                                    { key: 'verified_users', label: 'Verified Users' },
                                    { key: 'only_buyers', label: 'All Buyers / Customers' },
                                    { key: 'only_active_subscribers', label: 'Active Subscribers' },
                                    { key: 'only_subscribers', label: 'All Subscribers' },
                                    { key: 'product_buyers', label: 'Product / Course Buyers' },
                                    { key: 'high_value_customers', label: 'High-Value (VIP)' },
                                    { key: 'inactive_users', label: 'Inactive (Never Purchased)' },
                                    { key: 'recent_customers', label: 'Recent Buyers (30d)' },
                                    { key: 'affiliates', label: 'Affiliates' },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => {
                                            setExplorerPreset(item.key);
                                            const defaultRef =
                                                item.key === 'product_buyers' && products[0] ? String(products[0].id) : '';
                                            setExplorerRef(defaultRef);
                                            applyExplorerFilters(item.key, defaultRef);
                                        }}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                            explorerPreset === item.key
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {/* Secondary Filter Bar: Product Picker (if product_buyers), Search, Opt-In */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 pt-2">
                                {explorerPreset === 'product_buyers' && (
                                    <div>
                                        <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                                            Purchased Product / Course
                                        </label>
                                        <select
                                            value={explorerRef}
                                            onChange={(e) => {
                                                setExplorerRef(e.target.value);
                                                applyExplorerFilters('product_buyers', e.target.value);
                                            }}
                                            className="w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        >
                                            <option value="">Select a product...</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.currency} {p.price})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                                        Search Name, Email, or Phone
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && applyExplorerFilters()}
                                            placeholder="Search customer email or name..."
                                            className="w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => applyExplorerFilters()}
                                            className="rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-700"
                                        >
                                            Filter
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                                        Marketing Consent
                                    </label>
                                    <select
                                        value={optInFilter}
                                        onChange={(e) => {
                                            setOptInFilter(e.target.value);
                                            applyExplorerFilters(explorerPreset, explorerRef, searchQuery, e.target.value);
                                        }}
                                        className="w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    >
                                        <option value="">All Consent States</option>
                                        <option value="subscribed">Subscribed & Deliverable</option>
                                        <option value="unsubscribed">Unsubscribed / Suppressed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Contacts Table */}
                        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-neutral-200 text-xs dark:divide-neutral-800">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/60">
                                        <tr className="text-left font-semibold uppercase text-neutral-500">
                                            <th className="px-4 py-3 w-8">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedContactIds((contacts.data || []).map((c) => c.id));
                                                        } else {
                                                            setSelectedContactIds([]);
                                                        }
                                                    }}
                                                    checked={
                                                        (contacts.data || []).length > 0 &&
                                                        selectedContactIds.length === (contacts.data || []).length
                                                    }
                                                    className="rounded border-neutral-300"
                                                />
                                            </th>
                                            <th className="px-4 py-3">Customer / User</th>
                                            <th className="px-4 py-3">Account & Subscription</th>
                                            <th className="px-4 py-3">Purchases & LTV</th>
                                            <th className="px-4 py-3">Tags</th>
                                            <th className="px-4 py-3 text-right">Marketing Consent</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {(contacts.data || []).map((c) => {
                                            const cf = c.custom_fields || {};
                                            const isSubscribed = c.opt_in_email && !c.bounced_at && !c.complained_at;
                                            return (
                                                <tr key={c.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedContactIds.includes(c.id)}
                                                            onChange={() => toggleSelectContact(c.id)}
                                                            className="rounded border-neutral-300"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-neutral-900 dark:text-white">
                                                            {[c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unnamed Contact'}
                                                        </div>
                                                        <div className="text-neutral-500">{c.email}</div>
                                                    </td>
                                                    <td className="px-4 py-3 space-y-1">
                                                        <div className="flex flex-wrap gap-1">
                                                            {cf.is_registered_user ? (
                                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                                                    Registered
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                                    Guest Buyer
                                                                </span>
                                                            )}
                                                            {cf.email_verified && (
                                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                    Verified
                                                                </span>
                                                            )}
                                                            {cf.subscription_status && cf.subscription_status !== 'none' && (
                                                                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                                                    Sub: {cf.subscription_status} {cf.plan_name ? `(${cf.plan_name})` : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-neutral-900 dark:text-white">
                                                            {Number(cf.order_count || 0)} orders • ${Number(cf.lifetime_value || 0).toLocaleString()}
                                                        </div>
                                                        {Array.isArray(cf.purchased_product_names) && cf.purchased_product_names.length > 0 && (
                                                            <div className="mt-0.5 text-[11px] text-pink-600 dark:text-pink-400 truncate max-w-xs">
                                                                {cf.purchased_product_names.join(', ')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {(c.tags || []).map((t) => (
                                                                <span
                                                                    key={t.id}
                                                                    className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                                                >
                                                                    {t.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.post(
                                                                    `${basePath}/contacts/${c.id}/toggle-opt-in`,
                                                                    {},
                                                                    { preserveScroll: true }
                                                                )
                                                            }
                                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                                                                isSubscribed
                                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300'
                                                            }`}
                                                        >
                                                            {isSubscribed ? 'Subscribed' : 'Suppressed'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================
                    TAB 3: CUSTOM SEGMENT BUILDER
                   ========================================================= */}
                {activeTab === 'segments' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Create / Edit Dynamic Segment Form */}
                        <div className="lg:col-span-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                Build Custom Audience Segment
                            </h2>
                            <p className="mt-1 text-xs text-neutral-500">
                                Combine registration date, purchase history, subscription status, country, tags, and lifetime spending.
                            </p>

                            <form onSubmit={handleSaveSegment} className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Segment Name
                                    </label>
                                    <input
                                        type="text"
                                        value={segmentForm.name}
                                        onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                                        placeholder="e.g., Course A Buyers with LTV >= $100"
                                        className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Rule Match Combinator
                                    </label>
                                    <select
                                        value={segmentForm.combinator}
                                        onChange={(e) => setSegmentForm({ ...segmentForm, combinator: e.target.value })}
                                        className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    >
                                        <option value="AND">Match ALL conditions (AND)</option>
                                        <option value="OR">Match ANY condition (OR)</option>
                                    </select>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Filter Conditions
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSegmentForm({
                                                    ...segmentForm,
                                                    conditions: [
                                                        ...segmentForm.conditions,
                                                        { field: 'is_registered_user', operator: '=', value: '1' },
                                                    ],
                                                })
                                            }
                                            className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                            + Add Condition
                                        </button>
                                    </div>

                                    {segmentForm.conditions.map((cond, idx) => (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-12 gap-2 rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800"
                                        >
                                            <div className="col-span-5">
                                                <select
                                                    value={cond.field}
                                                    onChange={(e) => {
                                                        const updated = [...segmentForm.conditions];
                                                        updated[idx].field = e.target.value;
                                                        setSegmentForm({ ...segmentForm, conditions: updated });
                                                    }}
                                                    className="w-full rounded-lg border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                >
                                                    {SEGMENT_FIELD_OPTIONS.map((f) => (
                                                        <option key={f.value} value={f.value}>
                                                            {f.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <select
                                                    value={cond.operator}
                                                    onChange={(e) => {
                                                        const updated = [...segmentForm.conditions];
                                                        updated[idx].operator = e.target.value;
                                                        setSegmentForm({ ...segmentForm, conditions: updated });
                                                    }}
                                                    className="w-full rounded-lg border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                >
                                                    {['=', '!=', '>=', '<=', '>', '<', 'like', 'is_null', 'is_not_null'].map((op) => (
                                                        <option key={op} value={op}>
                                                            {op}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="text"
                                                    value={cond.value}
                                                    onChange={(e) => {
                                                        const updated = [...segmentForm.conditions];
                                                        updated[idx].value = e.target.value;
                                                        setSegmentForm({ ...segmentForm, conditions: updated });
                                                    }}
                                                    placeholder="Value"
                                                    className="w-full rounded-lg border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                />
                                            </div>
                                            <div className="col-span-1 flex items-center justify-center">
                                                {segmentForm.conditions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSegmentForm({
                                                                ...segmentForm,
                                                                conditions: segmentForm.conditions.filter((_, i) => i !== idx),
                                                            })
                                                        }
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingSegment}
                                    className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {savingSegment ? 'Saving Segment...' : 'Save Segment & Calculate Audience'}
                                </button>
                            </form>
                        </div>

                        {/* Saved Segments List */}
                        <div className="lg:col-span-7 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
                                Saved Platform Segments ({segments.length})
                            </h2>
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {segments.map((seg) => (
                                    <div key={seg.id} className="flex items-center justify-between py-3.5">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                                    {seg.name}
                                                </span>
                                                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                    {seg.contact_count} contacts
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-neutral-500">
                                                {seg.type === 'dynamic' && seg.rules_json?.conditions
                                                    ? seg.rules_json.conditions
                                                          .map((c) => `${c.field} ${c.operator} ${c.value ?? ''}`)
                                                          .join(` ${seg.rules_json.combinator || 'AND'} `)
                                                    : 'Static segment'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    startCampaignForCohort('segment', String(seg.id), `Campaign - ${seg.name}`)
                                                }
                                                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                                            >
                                                <Send className="h-3 w-3" /> Send Campaign
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.delete(`${basePath}/segments/${seg.id}`, {
                                                        preserveScroll: true,
                                                    })
                                                }
                                                className="rounded-xl p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================
                    TAB 4: CAMPAIGN BUILDER, AI STUDIO & ANALYTICS
                   ========================================================= */}
                {activeTab === 'campaigns' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            {/* Left 7 Cols: Campaign Composer */}
                            <div className="lg:col-span-7 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-5">
                                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                                    <div>
                                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                                            Campaign Builder & Recipient Targeting
                                        </h2>
                                        <p className="text-xs text-neutral-500">
                                            Create newsletters, product launches, announcements, promotional offers, or scheduled sequences.
                                        </p>
                                    </div>
                                    {campaignForm.id && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCampaignForm({
                                                    ...campaignForm,
                                                    id: null,
                                                    name: '',
                                                    subject: '',
                                                    body: '',
                                                })
                                            }
                                            className="text-xs font-semibold text-indigo-600 hover:underline"
                                        >
                                            + New Blank Campaign
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Campaign Internal Name
                                        </label>
                                        <input
                                            type="text"
                                            value={campaignForm.name}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                                            placeholder="e.g., October Product Launch & Offer"
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Campaign Type
                                        </label>
                                        <select
                                            value={campaignForm.campaign_type}
                                            onChange={(e) =>
                                                setCampaignForm({ ...campaignForm, campaign_type: e.target.value })
                                            }
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        >
                                            {CAMPAIGN_TYPE_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Recipient Cohort Selection */}
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-950 dark:bg-indigo-950/20 space-y-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200">
                                                Target Recipient Audience
                                            </label>
                                            <select
                                                value={campaignForm.audience_type}
                                                onChange={(e) =>
                                                    setCampaignForm({
                                                        ...campaignForm,
                                                        audience_type: e.target.value,
                                                        audience_ref: '',
                                                    })
                                                }
                                                className="mt-1 w-full rounded-xl border-indigo-200 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                            >
                                                {AUDIENCE_COHORT_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Dynamic Ref Selector based on audience_type */}
                                        {campaignForm.audience_type === 'product_buyers' && (
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200">
                                                    Select Product / Course
                                                </label>
                                                <select
                                                    value={campaignForm.audience_ref}
                                                    onChange={(e) =>
                                                        setCampaignForm({ ...campaignForm, audience_ref: e.target.value })
                                                    }
                                                    className="mt-1 w-full rounded-xl border-indigo-200 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                >
                                                    <option value="">Choose product...</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={String(p.id)}>
                                                            {p.name} ({p.currency} {p.price})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {campaignForm.audience_type === 'segment' && (
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200">
                                                    Select Saved Segment
                                                </label>
                                                <select
                                                    value={campaignForm.audience_ref}
                                                    onChange={(e) =>
                                                        setCampaignForm({ ...campaignForm, audience_ref: e.target.value })
                                                    }
                                                    className="mt-1 w-full rounded-xl border-indigo-200 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                >
                                                    <option value="">Choose segment...</option>
                                                    {segments.map((s) => (
                                                        <option key={s.id} value={String(s.id)}>
                                                            {s.name} ({s.contact_count} contacts)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {campaignForm.audience_type === 'tag' && (
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200">
                                                    Select CRM Tag
                                                </label>
                                                <select
                                                    value={campaignForm.audience_ref}
                                                    onChange={(e) =>
                                                        setCampaignForm({ ...campaignForm, audience_ref: e.target.value })
                                                    }
                                                    className="mt-1 w-full rounded-xl border-indigo-200 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                >
                                                    <option value="">Choose tag...</option>
                                                    {tags.map((t) => (
                                                        <option key={t.id} value={String(t.id)}>
                                                            {t.name} ({t.contacts_count ?? 0})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Live Deliverable Count Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-indigo-950 dark:text-indigo-200">
                                                {loadingPreview
                                                    ? 'Calculating audience...'
                                                    : `${previewStats.deliverable} Deliverable Email Recipients`}
                                            </span>
                                            <span className="text-neutral-500">
                                                ({previewStats.matched} total matched • {previewStats.suppressed} suppressed/unsubscribed excluded)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Subject & Preheader */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Email Subject Line
                                        </label>
                                        <input
                                            type="text"
                                            value={campaignForm.subject}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                                            placeholder="e.g., {{contact.first_name}}, meet our newest automation tools"
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Inbox Preheader (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={campaignForm.preheader}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, preheader: e.target.value })}
                                            placeholder="Short preview text shown beside subject line"
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Personalization Tokens & HTML Body */}
                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Campaign Email Content (HTML + Personalization Tokens)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            {showHtmlPreview ? 'Edit HTML Source' : 'Preview Rendered Email'}
                                        </button>
                                    </div>

                                    <div className="mb-2 flex flex-wrap gap-1.5">
                                        {contactTokens.map((tok) => (
                                            <button
                                                key={tok.key}
                                                type="button"
                                                onClick={() => insertToken(tok.key)}
                                                className="rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-mono text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-neutral-800 dark:text-neutral-300"
                                            >
                                                + {tok.label} ({tok.key})
                                            </button>
                                        ))}
                                    </div>

                                    {showHtmlPreview ? (
                                        <div
                                            className="min-h-[280px] rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950 overflow-auto"
                                            dangerouslySetInnerHTML={{ __html: campaignForm.body }}
                                        />
                                    ) : (
                                        <textarea
                                            rows={11}
                                            value={campaignForm.body}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })}
                                            placeholder="Write or generate your HTML email campaign content here..."
                                            className="w-full rounded-xl border-neutral-300 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    )}
                                </div>

                                {/* Scheduling Options */}
                                <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 space-y-3">
                                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                        Delivery Schedule & Cadence
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: 'immediate', label: 'Send Immediately (Queued)' },
                                            { id: 'scheduled', label: 'Schedule for Later' },
                                            { id: 'recurring', label: 'Recurring Newsletter / Sequence' },
                                        ].map((mode) => (
                                            <label key={mode.id} className="inline-flex items-center gap-2 text-xs font-medium">
                                                <input
                                                    type="radio"
                                                    name="schedule_mode"
                                                    checked={campaignForm.schedule_mode === mode.id}
                                                    onChange={() => setCampaignForm({ ...campaignForm, schedule_mode: mode.id })}
                                                />
                                                {mode.label}
                                            </label>
                                        ))}
                                    </div>

                                    {campaignForm.schedule_mode !== 'immediate' && (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-neutral-500">
                                                    First Launch Date & Time
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={campaignForm.schedule_at}
                                                    onChange={(e) =>
                                                        setCampaignForm({ ...campaignForm, schedule_at: e.target.value })
                                                    }
                                                    className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                />
                                            </div>
                                            {campaignForm.schedule_mode === 'recurring' && (
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-neutral-500">
                                                        Recurrence Cadence
                                                    </label>
                                                    <select
                                                        value={campaignForm.recurrence_frequency}
                                                        onChange={(e) =>
                                                            setCampaignForm({
                                                                ...campaignForm,
                                                                recurrence_frequency: e.target.value,
                                                            })
                                                        }
                                                        className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                                    >
                                                        <option value="weekly">Weekly Newsletter</option>
                                                        <option value="monthly">Monthly Newsletter</option>
                                                        <option value="product_launch_sequence">Product Launch Drip</option>
                                                        <option value="anniversary">Customer Anniversary</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        disabled={savingCampaign}
                                        onClick={() => handleSaveCampaign(false)}
                                        className="rounded-xl border border-neutral-300 px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                                    >
                                        Save as Draft
                                    </button>
                                    <button
                                        type="button"
                                        disabled={savingCampaign}
                                        onClick={() => handleSaveCampaign(true)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                        {campaignForm.schedule_mode === 'immediate'
                                            ? `Launch Campaign (${previewStats.deliverable} Recipients)`
                                            : 'Schedule Campaign'}
                                    </button>
                                </div>
                            </div>

                            {/* Right 5 Cols: AI Campaign Assistant */}
                            <div className="lg:col-span-5 rounded-2xl border border-purple-200 bg-gradient-to-b from-purple-50/70 to-white p-6 shadow-sm dark:border-purple-900/50 dark:from-purple-950/20 dark:to-neutral-900 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-purple-600 p-2 text-white">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                            AI Campaign Assistant
                                        </h3>
                                        <p className="text-xs text-neutral-500">
                                            Generate subject lines, newsletters, CTAs, follow-ups, and segmentation suggestions.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        What is this campaign about?
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={aiGoal}
                                        onChange={(e) => setAiGoal(e.target.value)}
                                        placeholder="e.g., Announce our new AI Social Automation & Course bundle with 20% off for existing users..."
                                        className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Featured Product / Course
                                        </label>
                                        <select
                                            value={aiProductId}
                                            onChange={(e) => setAiProductId(e.target.value)}
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        >
                                            <option value="">None</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.currency} {p.price})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Attach Coupon Code
                                        </label>
                                        <select
                                            value={aiCouponCode}
                                            onChange={(e) => setAiCouponCode(e.target.value)}
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        >
                                            <option value="">None</option>
                                            {coupons.map((c) => (
                                                <option key={c.id} value={c.code}>
                                                    {c.code} ({c.type === 'percentage' ? `${c.value}% OFF` : `$${c.value} OFF`})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-1">
                                    <button
                                        type="button"
                                        disabled={aiLoading}
                                        onClick={() => handleAiAssist('generate_campaign')}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        {aiLoading ? 'Generating with AI...' : 'Generate Complete Email Campaign'}
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            disabled={aiLoading}
                                            onClick={() => handleAiAssist('improve_subject')}
                                            className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-neutral-800 dark:text-purple-300"
                                        >
                                            Generate 5 Subject Lines
                                        </button>
                                        <button
                                            type="button"
                                            disabled={aiLoading}
                                            onClick={() => handleAiAssist('generate_followup')}
                                            className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-neutral-800 dark:text-purple-300"
                                        >
                                            Generate Follow-Up Email
                                        </button>
                                    </div>
                                </div>

                                {/* AI Recommendations Box */}
                                {aiRecommendation && (
                                    <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 text-xs dark:border-purple-900 dark:bg-purple-950/40 space-y-1.5">
                                        <div className="font-bold text-purple-900 dark:text-purple-200">
                                            AI Strategy Recommendations:
                                        </div>
                                        {aiRecommendation.recommended_audience && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-neutral-600 dark:text-neutral-300">
                                                    Recommended Segment:{' '}
                                                    <strong>{aiRecommendation.recommended_audience}</strong>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCampaignForm((prev) => ({
                                                            ...prev,
                                                            audience_type: aiRecommendation.recommended_audience,
                                                        }))
                                                    }
                                                    className="text-purple-700 font-semibold hover:underline dark:text-purple-300"
                                                >
                                                    Apply Cohort
                                                </button>
                                            </div>
                                        )}
                                        {aiRecommendation.recommended_send_time && (
                                            <p className="text-neutral-600 dark:text-neutral-300">
                                                Optimal Send Window: <strong>{aiRecommendation.recommended_send_time}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* AI Subject Suggestions */}
                                {aiSubjectSuggestions.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                            Click any subject line to apply:
                                        </span>
                                        {aiSubjectSuggestions.map((s, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() =>
                                                    setCampaignForm((prev) => ({
                                                        ...prev,
                                                        subject: s.subject,
                                                        preheader: s.preheader || prev.preheader,
                                                    }))
                                                }
                                                className="w-full text-left rounded-xl border border-neutral-200 bg-white p-2.5 text-xs hover:border-purple-400 dark:border-neutral-800 dark:bg-neutral-800"
                                            >
                                                <div className="font-semibold text-neutral-900 dark:text-white">
                                                    {s.subject}
                                                </div>
                                                <div className="text-[11px] text-neutral-500">{s.preheader}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Campaign History & Analytics Table */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                        Platform Campaigns & Delivery Telemetry
                                    </h3>
                                    <p className="text-xs text-neutral-500">
                                        Monitor sent, opened, clicked, unsubscribed, and test-send any campaign.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="Enter email for test sends..."
                                        className="rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-neutral-200 text-xs dark:divide-neutral-800">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/60">
                                        <tr className="text-left font-semibold uppercase text-neutral-500">
                                            <th className="px-4 py-3">Campaign</th>
                                            <th className="px-4 py-3">Type & Cohort</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Sent / Opened / Clicked</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {campaigns.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                                                    No platform marketing campaigns created yet. Use the Campaign Builder above to launch your first campaign.
                                                </td>
                                            </tr>
                                        ) : (
                                            campaigns.map((c) => {
                                                const totals = c.totals_json || {};
                                                return (
                                                    <tr key={c.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-neutral-900 dark:text-white">
                                                                {c.name}
                                                            </div>
                                                            <div className="text-neutral-500">
                                                                {c.payload_json?.subject || 'No subject'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                                {(c.campaign_type || 'newsletter').replace(/_/g, ' ')}
                                                            </span>
                                                            <div className="mt-1 text-neutral-500">
                                                                Cohort: {c.audience_type} {c.audience_ref ? `(#${c.audience_ref})` : ''}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                                                    c.status === 'completed'
                                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                        : c.status === 'sending' || c.status === 'queued'
                                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                                        : c.status === 'failed'
                                                                        ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                                                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                                                }`}
                                                            >
                                                                {c.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 font-medium">
                                                            {(totals.sent ?? 0) + (totals.delivered ?? 0) + (totals.read ?? 0)} sent •{' '}
                                                            <span className="text-emerald-600">{totals.read ?? 0} opened</span> •{' '}
                                                            <span className="text-indigo-600">{totals.clicked ?? 0} clicked</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right space-x-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={testingCampaignId === c.id}
                                                                onClick={() => handleTestSend(c.id)}
                                                                className="rounded-lg border border-neutral-200 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                                                            >
                                                                Test
                                                            </button>
                                                            {(c.status === 'draft' || c.status === 'paused') && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setCampaignForm({
                                                                                id: c.id,
                                                                                name: c.name,
                                                                                campaign_type: c.campaign_type || 'newsletter',
                                                                                audience_type: c.audience_type,
                                                                                audience_ref: c.audience_ref || '',
                                                                                subject: c.payload_json?.subject || '',
                                                                                preheader: c.payload_json?.preheader || '',
                                                                                body: c.payload_json?.body || '',
                                                                                from_name: c.payload_json?.from_name || '',
                                                                                from_email: c.payload_json?.from_email || '',
                                                                                reply_to: c.payload_json?.reply_to || '',
                                                                                track_opens: c.payload_json?.track_opens ?? true,
                                                                                track_clicks: c.payload_json?.track_clicks ?? true,
                                                                                schedule_mode: c.schedule_at ? 'scheduled' : 'immediate',
                                                                                schedule_at: c.schedule_at ? c.schedule_at.slice(0, 16) : '',
                                                                                recurrence_frequency: c.recurrence_rule?.frequency || 'weekly',
                                                                            })
                                                                        }
                                                                        className="rounded-lg border border-neutral-200 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            router.post(
                                                                                `${basePath}/campaigns/${c.id}/launch`,
                                                                                {},
                                                                                { preserveScroll: true }
                                                                            )
                                                                        }
                                                                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                                                                    >
                                                                        Launch
                                                                    </button>
                                                                </>
                                                            )}
                                                            {(c.status === 'queued' || c.status === 'sending') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        router.post(
                                                                            `${basePath}/campaigns/${c.id}/pause`,
                                                                            {},
                                                                            { preserveScroll: true }
                                                                        )
                                                                    }
                                                                    className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600"
                                                                >
                                                                    Pause
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    router.delete(
                                                                        `${basePath}/campaigns/${c.id}`,
                                                                        { preserveScroll: true }
                                                                    )
                                                                }
                                                                className="rounded-lg p-1 text-neutral-400 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 inline" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </LayoutComponent>
    );
}

