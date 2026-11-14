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
    AlertCircle,
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
    Server,
    Check,
    FileText,
    Settings,
    Edit3,
    X,
    ChevronDown,
    Download,
    BookOpen,
    Compass,
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
        smtp_configuration_id: '',
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

    // Test Send state & SMTP Verification
    const [testEmail, setTestEmail] = useState('');
    const [testingCampaignId, setTestingCampaignId] = useState(null);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [smtpTestResult, setSmtpTestResult] = useState(null);

    // 30-Day Sequence Generator state
    const [sequenceTheme, setSequenceTheme] = useState('platform_mastery');
    const [sequenceAudience, setSequenceAudience] = useState('all_users');
    const [sequenceSmtpId, setSequenceSmtpId] = useState('');
    const [sequenceStartDate, setSequenceStartDate] = useState(
        new Date(Date.now() + 86400000).toISOString().split('T')[0]
    );
    const [sequenceSendTime, setSequenceSendTime] = useState('09:00');
    const [sequenceCadence, setSequenceCadence] = useState('daily');
    const [sequenceCustomPrompt, setSequenceCustomPrompt] = useState('');
    const [generatingSequence, setGeneratingSequence] = useState(false);
    const [savingSequence, setSavingSequence] = useState(false);
    const [sequenceData, setSequenceData] = useState(null);

    // Day editor modal state
    const [editingDay, setEditingDay] = useState(null);
    const [dayModalTab, setDayModalTab] = useState('preview'); // 'preview' | 'html'
    const [testingDayIndex, setTestingDayIndex] = useState(null);

    // Delivery Diagnostics Modal state
    const [viewingRecipientsCampaign, setViewingRecipientsCampaign] = useState(null);
    const [recipientsData, setRecipientsData] = useState([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);

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
                name: campaignForm.name.trim(),
                campaign_type: campaignForm.campaign_type,
                audience_type: campaignForm.audience_type,
                audience_ref: String(campaignForm.audience_ref || ''),
                subject: campaignForm.subject.trim(),
                preheader: campaignForm.preheader,
                body: campaignForm.body,
                smtp_configuration_id: campaignForm.smtp_configuration_id ? Number(campaignForm.smtp_configuration_id) : null,
                from_name: campaignForm.from_name.trim() || null,
                from_email: campaignForm.from_email.trim() || null,
                reply_to: campaignForm.reply_to.trim() || null,
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
                onError: (errs) => {
                    const firstErr = Object.values(errs || {})[0];
                    toast.error(firstErr || 'Could not save or launch campaign.');
                },
                onFinish: () => setSavingCampaign(false),
            }
        );
    };

    const handleTestSend = async (campaignId, customSmtpId = null) => {
        if (!testEmail.trim()) {
            toast.error('Enter an email address to receive the test send.');
            return;
        }
        setTestingCampaignId(campaignId);
        try {
            const { data } = await window.axios.post(`${basePath}/campaigns/${campaignId}/test-send`, {
                email: testEmail.trim(),
                smtp_configuration_id: customSmtpId || (campaignForm.smtp_configuration_id ? Number(campaignForm.smtp_configuration_id) : undefined),
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

    const handleTestSmtpConnection = async (smtpId = null) => {
        if (!testEmail.trim()) {
            toast.error('Please enter an email address in the test input to receive the verification email.');
            return;
        }
        setTestingSmtp(true);
        setSmtpTestResult(null);
        try {
            const chosenId = smtpId || (campaignForm.smtp_configuration_id ? Number(campaignForm.smtp_configuration_id) : undefined);
            const { data } = await window.axios.post(`${basePath}/test-smtp`, {
                email: testEmail.trim(),
                smtp_configuration_id: chosenId,
            });
            if (data.ok) {
                toast.success(data.message || 'SMTP verified successfully!');
                setSmtpTestResult({ ok: true, message: data.message, smtp: data.smtp });
            } else {
                toast.error(data.error || 'SMTP test delivery failed.');
                setSmtpTestResult({ ok: false, error: data.error });
            }
        } catch (err) {
            const msg = err?.response?.data?.error || err?.message || 'SMTP test failed.';
            toast.error(msg);
            setSmtpTestResult({ ok: false, error: msg });
        } finally {
            setTestingSmtp(false);
        }
    };

    const handleViewRecipients = async (campaign) => {
        setViewingRecipientsCampaign(campaign);
        setLoadingRecipients(true);
        setRecipientsData([]);
        try {
            const { data } = await window.axios.get(`${basePath}/campaigns/${campaign.id}/recipients`);
            setRecipientsData(data.recipients || []);
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to load delivery log.');
        } finally {
            setLoadingRecipients(false);
        }
    };

    const handleRetryFailed = (campaignId) => {
        router.post(
            `${basePath}/campaigns/${campaignId}/retry-failed`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Retrying failed recipients...');
                    if (viewingRecipientsCampaign) {
                        setViewingRecipientsCampaign(null);
                    }
                },
                onError: (err) => {
                    toast.error(err?.response?.data?.error || 'Failed to retry campaign delivery.');
                },
            }
        );
    };

    const handleGenerateSequence = async () => {
        setGeneratingSequence(true);
        try {
            const { data } = await window.axios.post(`${basePath}/generate-sequence`, {
                theme: sequenceTheme,
                start_date: sequenceStartDate,
                send_time: sequenceSendTime,
                cadence: sequenceCadence,
                custom_prompt: sequenceTheme === 'custom_ai' ? sequenceCustomPrompt : undefined,
                target_audience: sequenceAudience,
            });

            if (data.ok && data.sequence) {
                setSequenceData(data.sequence);
                toast.success(`Generated complete 30-day sequence: ${data.sequence.theme_name}!`);
            } else {
                toast.error('Could not generate 30-day curriculum.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to generate 30-day sequence.');
        } finally {
            setGeneratingSequence(false);
        }
    };

    const handleStoreSequence = async (status = 'queued') => {
        if (!sequenceData || !sequenceData.days || sequenceData.days.length === 0) {
            toast.error('Generate a 30-day sequence first.');
            return;
        }

        const enabledDays = sequenceData.days.filter((d) => d.enabled !== false);
        if (enabledDays.length === 0) {
            toast.error('At least one day in the sequence must be enabled.');
            return;
        }

        setSavingSequence(true);
        try {
            const selectedSmtp = smtpConfigs.find((s) => String(s.id) === String(sequenceSmtpId));
            const { data } = await window.axios.post(`${basePath}/store-sequence`, {
                theme: sequenceData.theme,
                sequence_name: sequenceData.sequence_name,
                audience_type: sequenceAudience,
                smtp_configuration_id: sequenceSmtpId ? Number(sequenceSmtpId) : null,
                from_name: selectedSmtp?.from_name || null,
                from_email: selectedSmtp?.from_email || null,
                status: status, // 'queued' (scheduled) or 'draft'
                days: sequenceData.days,
            });

            if (data.ok) {
                toast.success(data.message || '30-day sequence processed!');
                router.reload({ only: ['campaigns'] });
                setActiveTab('campaigns');
            } else {
                toast.error(data.error || 'Failed to save sequence.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to save sequence.');
        } finally {
            setSavingSequence(false);
        }
    };

    const toggleDayEnabled = (dayIndex) => {
        if (!sequenceData || !sequenceData.days) return;
        setSequenceData((prev) => {
            const nextDays = [...prev.days];
            const current = nextDays[dayIndex];
            nextDays[dayIndex] = {
                ...current,
                enabled: current.enabled === false ? true : false,
            };
            return { ...prev, days: nextDays };
        });
    };

    const handleUpdateDay = (updatedDay) => {
        if (!sequenceData || !sequenceData.days) return;
        setSequenceData((prev) => {
            const nextDays = prev.days.map((d) => (d.day === updatedDay.day ? updatedDay : d));
            return { ...prev, days: nextDays };
        });
        setEditingDay(null);
        toast.success(`Updated Day ${updatedDay.day} content.`);
    };

    const handleTestSendDay = async (dayItem, index) => {
        if (!testEmail.trim()) {
            toast.error('Enter an email address to receive the test send.');
            return;
        }
        setTestingDayIndex(index);
        try {
            const selectedSmtpId = sequenceSmtpId || campaignForm.smtp_configuration_id || undefined;
            const { data } = await window.axios.post(`${basePath}/test-smtp`, {
                email: testEmail.trim(),
                smtp_configuration_id: selectedSmtpId ? Number(selectedSmtpId) : undefined,
            });
            if (data.ok) {
                toast.success(`Test preview for Day ${dayItem.day} sent to ${testEmail}!`);
            } else {
                toast.error(data.error || 'Test send failed.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Test send failed.');
        } finally {
            setTestingDayIndex(null);
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
                            <button
                                type="button"
                                onClick={() => setActiveTab('sequences')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-bold text-indigo-950 shadow hover:from-amber-300 hover:to-amber-400 transition"
                            >
                                <Calendar className="h-4 w-4" />
                                30-Day Newsletters
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
                            { id: 'sequences', label: '30-Day Newsletters (Sequences)', icon: Calendar },
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

                                    {/* 0 Deliverable Warning */}
                                    {previewStats.deliverable === 0 && !loadingPreview && (
                                        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2.5">
                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                            <div>
                                                <strong className="font-bold">0 Deliverable Recipients:</strong> No contacts in this workspace matched the cohort &ldquo;{campaignForm.audience_type}&rdquo;. If you launch now, no emails will be sent.
                                                <div className="mt-1 font-medium text-amber-800 dark:text-amber-300">
                                                    Tip: Select <button type="button" onClick={() => setCampaignForm((prev) => ({ ...prev, audience_type: 'all_users' }))} className="underline font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900">All Registered Users</button> or click <button type="button" onClick={handleSyncAudience} className="underline font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900">Sync Audience</button> to refresh your contacts directory.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SMTP Delivery Server Selection & Sender Controls */}
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20 space-y-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-2">
                                            <Server className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                            <label className="text-xs font-bold text-neutral-900 dark:text-white">
                                                SMTP Delivery Server (Email Stream)
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleTestSmtpConnection()}
                                                disabled={testingSmtp}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:bg-neutral-800 dark:text-indigo-300"
                                            >
                                                <RefreshCw className={`h-3 w-3 ${testingSmtp ? 'animate-spin' : ''}`} />
                                                {testingSmtp ? 'Sending Test...' : 'Test SMTP Server'}
                                            </button>
                                            <Link
                                                href={isAppRoute ? '/app/email-server' : '/admin/email-system'}
                                                className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                Manage SMTPs →
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                                Select Active SMTP Server
                                            </label>
                                            <select
                                                value={campaignForm.smtp_configuration_id || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const selected = smtpConfigs.find((s) => String(s.id) === String(val));
                                                    setCampaignForm((prev) => ({
                                                        ...prev,
                                                        smtp_configuration_id: val,
                                                        from_name: selected?.from_name || prev.from_name,
                                                        from_email: selected?.from_email || prev.from_email,
                                                    }));
                                                }}
                                                className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                            >
                                                <option value="">Default Active Marketing SMTP (Automated Stream)</option>
                                                {smtpConfigs.map((s) => (
                                                    <option key={s.id} value={String(s.id)}>
                                                        {s.name || `${s.host}:${s.port}`} {s.is_active ? '★ (Active)' : ''} ({s.from_email || s.host})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                                Sender Name Override (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={campaignForm.from_name}
                                                onChange={(e) => setCampaignForm({ ...campaignForm, from_name: e.target.value })}
                                                placeholder={isAppRoute ? 'Workspace Team' : 'Botify AI'}
                                                className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                                From Email Address (Optional)
                                            </label>
                                            <input
                                                type="email"
                                                value={campaignForm.from_email}
                                                onChange={(e) => setCampaignForm({ ...campaignForm, from_email: e.target.value })}
                                                placeholder="e.g. broadcast@botifyai.cloud"
                                                className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    {smtpTestResult && (
                                        <div
                                            className={`rounded-lg p-2.5 text-xs ${
                                                smtpTestResult.ok
                                                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                    : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                            }`}
                                        >
                                            {smtpTestResult.ok ? `✅ ${smtpTestResult.message}` : `❌ ${smtpTestResult.error}`}
                                        </div>
                                    )}
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
                                                            {c.payload_json?.smtp_configuration_id && (
                                                                <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400">
                                                                    <Server className="h-3 w-3" />
                                                                    <span>
                                                                        SMTP #{c.payload_json.smtp_configuration_id}
                                                                        {smtpConfigs.find((s) => String(s.id) === String(c.payload_json.smtp_configuration_id))?.name
                                                                            ? ` (${smtpConfigs.find((s) => String(s.id) === String(c.payload_json.smtp_configuration_id)).name})`
                                                                            : ''}
                                                                    </span>
                                                                </div>
                                                            )}
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
                                                                        : c.status === 'paused'
                                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                                                }`}
                                                            >
                                                                {c.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                                {(totals.sent ?? 0) + (totals.delivered ?? 0) + (totals.read ?? 0)} sent •{' '}
                                                                <span className="text-emerald-600 dark:text-emerald-400">{totals.read ?? 0} opened</span> •{' '}
                                                                <span className="text-indigo-600 dark:text-indigo-400">{totals.clicked ?? 0} clicked</span>
                                                                {(totals.failed ?? 0) > 0 && (
                                                                    <> • <span className="font-bold text-red-600 dark:text-red-400">{totals.failed} failed</span></>
                                                                )}
                                                                {(totals.queued ?? 0) > 0 && (
                                                                    <> • <span className="text-blue-600 dark:text-blue-400">{totals.queued} queued</span></>
                                                                )}
                                                            </div>
                                                            {totals.failed_reason && (
                                                                <div className="mt-1 flex items-start gap-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                                                                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" />
                                                                    <span className="line-clamp-2 max-w-sm" title={totals.failed_reason}>{totals.failed_reason}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right space-x-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewRecipients(c)}
                                                                className="rounded-lg border border-neutral-200 px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                                                                title="View Delivery Log & Diagnostics"
                                                            >
                                                                Logs
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={testingCampaignId === c.id}
                                                                onClick={() => handleTestSend(c.id)}
                                                                className="rounded-lg border border-neutral-200 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                                                            >
                                                                Test
                                                            </button>
                                                            {c.status === 'failed' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRetryFailed(c.id)}
                                                                    className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 shadow-sm"
                                                                    title="Retry delivery for non-opted-out contacts"
                                                                >
                                                                    Retry
                                                                </button>
                                                            )}
                                                            {(c.status === 'draft' || c.status === 'paused' || c.status === 'failed') && (
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
                                                                                smtp_configuration_id: c.payload_json?.smtp_configuration_id ? String(c.payload_json.smtp_configuration_id) : '',
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
                                                                title="Delete Campaign"
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

                {/* =========================================================
                    TAB 5: 30-DAY NEWSLETTERS & DRIP SEQUENCES
                   ========================================================= */}
                {activeTab === 'sequences' && (
                    <div className="space-y-6">
                        {/* Theme Selection Section */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        AUTOMATED 30-DAY MARKETING CURRICULUMS
                                    </div>
                                    <h2 className="mt-2 text-lg font-bold text-neutral-900 dark:text-white">
                                        Choose Your 30-Day Sequence Blueprint
                                    </h2>
                                    <p className="text-xs text-neutral-500">
                                        Deploy an automated 30-day email newsletter series. Pick a curated blueprint or generate custom AI copy, configure your outbound SMTP server, and schedule or draft all 30 campaigns in 1 click.
                                    </p>
                                </div>
                            </div>

                            {/* Theme Cards Grid */}
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    {
                                        id: 'platform_mastery',
                                        title: 'Platform Mastery & Automation',
                                        subtitle: 'WhatsApp, Instagram, Flows & AI',
                                        description: 'Guides users step-by-step from channel connection to AI bot setup, omni-inbox mastery, and broadcast scaling.',
                                        audience: 'all_users',
                                        icon: Megaphone,
                                        badge: 'Most Popular',
                                        color: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20',
                                    },
                                    {
                                        id: 'saas_onboarding',
                                        title: 'SaaS Onboarding & Activation',
                                        subtitle: 'Trial to Paid Customer Conversion',
                                        description: 'Strategic daily value touches highlighting ROI, team collaboration, advanced triggers, and premium plan upgrades.',
                                        audience: 'only_registered_users',
                                        icon: Award,
                                        badge: 'High Conversion',
                                        color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
                                    },
                                    {
                                        id: 'ecommerce_growth',
                                        title: 'E-Commerce & Social Selling',
                                        subtitle: 'Catalog Sales, Carts & VIP Perks',
                                        description: 'Focuses on product checkouts, abandoned cart recovery, flash weekend offers, and repeat customer retention.',
                                        audience: 'only_buyers',
                                        icon: ShoppingBag,
                                        badge: 'Revenue Driver',
                                        color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
                                    },
                                    {
                                        id: 'agency_leadgen',
                                        title: 'Agency & Consultant Playbook',
                                        subtitle: 'Client Acquisition & Appointments',
                                        description: 'High-ticket inbound qualification, automated calendar bookings, case studies, and retainer selling strategies.',
                                        audience: 'all_users',
                                        icon: DollarSign,
                                        badge: 'High-Ticket',
                                        color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
                                    },
                                    {
                                        id: 'custom_ai',
                                        title: 'Custom AI-Generated Sequence',
                                        subtitle: 'Tailored to Your Specific Goal',
                                        description: 'Describe your exact product, industry, or launch goal and our AI assistant will design a 30-day custom curriculum.',
                                        audience: 'all_users',
                                        icon: Sparkles,
                                        badge: 'AI Powered',
                                        color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20',
                                    },
                                ].map((t) => {
                                    const Icon = t.icon;
                                    const isSelected = sequenceTheme === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                setSequenceTheme(t.id);
                                                setSequenceAudience(t.audience);
                                            }}
                                            className={`relative flex flex-col text-left rounded-2xl border-2 p-4 transition ${
                                                isSelected
                                                    ? `${t.color} border-indigo-600 shadow-md ring-2 ring-indigo-500/30 dark:border-indigo-400`
                                                    : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className={`rounded-xl p-2 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'}`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                        {t.badge}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                                                        <Check className="h-3 w-3" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3 font-bold text-sm text-neutral-900 dark:text-white">
                                                {t.title}
                                            </div>
                                            <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                                {t.subtitle}
                                            </div>
                                            <div className="mt-1 text-xs text-neutral-500 line-clamp-2">
                                                {t.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom AI Goal input if selected */}
                            {sequenceTheme === 'custom_ai' && (
                                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900 dark:bg-purple-950/20 space-y-2">
                                    <label className="block text-xs font-bold text-purple-900 dark:text-purple-200">
                                        Describe Your 30-Day Marketing Goal & Brand Niche
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={sequenceCustomPrompt}
                                        onChange={(e) => setSequenceCustomPrompt(e.target.value)}
                                        placeholder="e.g. 30-day email newsletter for a real estate automation agency targeting property managers with lead conversion case studies and weekly free checklists..."
                                        className="w-full rounded-xl border-purple-200 text-xs dark:border-purple-800 dark:bg-neutral-800 dark:text-white"
                                    />
                                </div>
                            )}

                            {/* Sequence Orchestration Controls */}
                            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                                    {/* 1. Target Audience */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                            Target Audience Cohort
                                        </label>
                                        <select
                                            value={sequenceAudience}
                                            onChange={(e) => setSequenceAudience(e.target.value)}
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        >
                                            {AUDIENCE_COHORT_OPTIONS.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 2. SMTP Delivery Server */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                            SMTP Delivery Server
                                        </label>
                                        <select
                                            value={sequenceSmtpId}
                                            onChange={(e) => setSequenceSmtpId(e.target.value)}
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        >
                                            <option value="">Default Active SMTP (Marketing)</option>
                                            {smtpConfigs.map((s) => (
                                                <option key={s.id} value={String(s.id)}>
                                                    {s.name || `${s.host}:${s.port}`} {s.is_active ? '★' : ''} ({s.from_email || s.host})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 3. Start Date */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                            Sequence Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={sequenceStartDate}
                                            onChange={(e) => setSequenceStartDate(e.target.value)}
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    </div>

                                    {/* 4. Daily Send Time */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                            Daily Send Time
                                        </label>
                                        <input
                                            type="time"
                                            value={sequenceSendTime}
                                            onChange={(e) => setSequenceSendTime(e.target.value)}
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    </div>

                                    {/* 5. Cadence */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                                            Cadence Spacing
                                        </label>
                                        <select
                                            value={sequenceCadence}
                                            onChange={(e) => setSequenceCadence(e.target.value)}
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        >
                                            <option value="daily">Daily (30 Days Total)</option>
                                            <option value="every_2_days">Every 2 Days (60 Days Total)</option>
                                            <option value="weekdays">Weekdays Only (Mon–Fri)</option>
                                            <option value="weekly">Weekly (30 Weeks Total)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                        <Clock className="h-4 w-4 text-indigo-600" />
                                        <span>
                                            Generates 30 structured, responsive HTML newsletters staggered across your schedule.
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={generatingSequence}
                                        onClick={handleGenerateSequence}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Sparkles className={`h-4 w-4 ${generatingSequence ? 'animate-spin' : ''}`} />
                                        {generatingSequence ? 'Generating 30 Days...' : 'Generate 30-Day Sequence Curriculum'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Generated Sequence Preview & Batch Actions */}
                        {sequenceData && sequenceData.days && (
                            <div className="space-y-4">
                                {/* Master Control Bar */}
                                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-900 to-purple-900 p-5 text-white shadow-md">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-indigo-100">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                                CURRICULUM READY FOR LAUNCH
                                            </div>
                                            <h3 className="mt-2 text-lg font-bold sm:text-xl">
                                                {sequenceData.sequence_name}
                                            </h3>
                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-indigo-200">
                                                <span>📅 Start: {new Date(sequenceData.start_date).toLocaleDateString()}</span>
                                                <span>⏰ Daily Time: {sequenceData.send_time}</span>
                                                <span>🔁 Cadence: {sequenceData.cadence.replace(/_/g, ' ')}</span>
                                                <span>👥 Audience: {sequenceAudience}</span>
                                                <span>
                                                    📧 SMTP:{' '}
                                                    {sequenceSmtpId
                                                        ? smtpConfigs.find((s) => String(s.id) === String(sequenceSmtpId))?.name || `Server #${sequenceSmtpId}`
                                                        : 'Default Active SMTP'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <button
                                                type="button"
                                                disabled={savingSequence}
                                                onClick={() => handleStoreSequence('draft')}
                                                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50 transition"
                                            >
                                                Save All 30 as Drafts
                                            </button>
                                            <button
                                                type="button"
                                                disabled={savingSequence}
                                                onClick={() => handleStoreSequence('queued')}
                                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-600 disabled:opacity-50 transition"
                                            >
                                                <Send className="h-4 w-4" />
                                                {savingSequence ? 'Scheduling Campaigns...' : 'Schedule All 30 Newsletters'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 30-Day Cards Grid */}
                                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                                    {sequenceData.days.map((d, idx) => {
                                        const isEnabled = d.enabled !== false;
                                        return (
                                            <div
                                                key={d.day}
                                                className={`flex flex-col justify-between rounded-2xl border p-4.5 shadow-sm transition ${
                                                    isEnabled
                                                        ? 'border-neutral-200 bg-white hover:border-indigo-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-700'
                                                        : 'border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-800/40'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                            Day {d.day} of 30
                                                        </span>
                                                        <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isEnabled}
                                                                onChange={() => toggleDayEnabled(idx)}
                                                                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            {isEnabled ? 'Active' : 'Skipped'}
                                                        </label>
                                                    </div>

                                                    <h4 className="mt-2.5 font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">
                                                        {d.title}
                                                    </h4>

                                                    <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 font-medium line-clamp-1">
                                                        ✉️ {d.subject}
                                                    </div>

                                                    <div className="mt-1 text-[11px] text-neutral-500 line-clamp-2">
                                                        {d.preheader || 'Includes action plan, pro tip, and dashboard CTA.'}
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-2.5">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-indigo-500" />
                                                            {d.scheduled_formatted || new Date(d.scheduled_at).toLocaleDateString()}
                                                        </span>
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                            Ready
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingDay(d);
                                                                setDayModalTab('preview');
                                                            }}
                                                            className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                                        >
                                                            Preview & Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={testingDayIndex === idx}
                                                            onClick={() => handleTestSendDay(d, idx)}
                                                            className="rounded-xl border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:text-indigo-300"
                                                        >
                                                            {testingDayIndex === idx ? 'Sending...' : 'Test Send'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* =========================================================
                    DAY PREVIEW & EDIT MODAL
                   ========================================================= */}
                {editingDay && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
                        <div className="relative w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 my-8">
                            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        Day {editingDay.day}
                                    </span>
                                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                        {editingDay.title}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingDay(null)}
                                    className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mt-4 flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setDayModalTab('preview')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        dayModalTab === 'preview'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                    }`}
                                >
                                    <Eye className="inline h-3.5 w-3.5 mr-1" />
                                    Rendered Email Preview
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDayModalTab('html')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        dayModalTab === 'html'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                    }`}
                                >
                                    <Edit3 className="inline h-3.5 w-3.5 mr-1" />
                                    Edit Copy & HTML
                                </button>
                            </div>

                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Subject Line
                                        </label>
                                        <input
                                            type="text"
                                            value={editingDay.subject}
                                            onChange={(e) =>
                                                setEditingDay({ ...editingDay, subject: e.target.value })
                                            }
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            Preheader (Preview Text)
                                        </label>
                                        <input
                                            type="text"
                                            value={editingDay.preheader || ''}
                                            onChange={(e) =>
                                                setEditingDay({ ...editingDay, preheader: e.target.value })
                                            }
                                            className="mt-1 w-full rounded-xl border-neutral-300 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {dayModalTab === 'preview' ? (
                                    <div
                                        className="max-h-[420px] rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950 overflow-y-auto"
                                        dangerouslySetInnerHTML={{ __html: editingDay.body }}
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                            Email HTML Source
                                        </label>
                                        <textarea
                                            rows={14}
                                            value={editingDay.body}
                                            onChange={(e) =>
                                                setEditingDay({ ...editingDay, body: e.target.value })
                                            }
                                            className="w-full rounded-xl border-neutral-300 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                                <div className="text-xs text-neutral-500">
                                    Scheduled for: {editingDay.scheduled_formatted || editingDay.scheduled_at}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingDay(null)}
                                        className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdateDay(editingDay)}
                                        className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700"
                                    >
                                        Save Day Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delivery Diagnostics & Recipients Modal */}
                {viewingRecipientsCampaign && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                                <div>
                                    <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                        <span>Delivery Diagnostics: &ldquo;{viewingRecipientsCampaign.name}&rdquo;</span>
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                            viewingRecipientsCampaign.status === 'completed'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                : viewingRecipientsCampaign.status === 'failed'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                        }`}>
                                            {viewingRecipientsCampaign.status}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Inspect recipient delivery status, delivery timestamps, and SMTP transmission error logs.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewingRecipientsCampaign(null)}
                                    className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Summary stat cards */}
                                <div className="grid grid-cols-4 gap-3 text-center">
                                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-800/50">
                                        <div className="text-[10px] font-semibold uppercase text-neutral-500">Total</div>
                                        <div className="text-lg font-bold text-neutral-900 dark:text-white">
                                            {viewingRecipientsCampaign.totals_json?.total ?? recipientsData.length}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                        <div className="text-[10px] font-semibold uppercase text-emerald-600">Sent</div>
                                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                            {viewingRecipientsCampaign.totals_json?.sent ?? 0}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-red-200 bg-red-50/60 p-2.5 dark:border-red-900/40 dark:bg-red-950/20">
                                        <div className="text-[10px] font-semibold uppercase text-red-600">Failed</div>
                                        <div className="text-lg font-bold text-red-700 dark:text-red-400">
                                            {viewingRecipientsCampaign.totals_json?.failed ?? 0}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                                        <div className="text-[10px] font-semibold uppercase text-blue-600">Queued</div>
                                        <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                            {viewingRecipientsCampaign.totals_json?.queued ?? 0}
                                        </div>
                                    </div>
                                </div>

                                {/* General Failure Reason banner if present */}
                                {viewingRecipientsCampaign.totals_json?.failed_reason && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                                        <div>
                                            <strong className="font-bold">Campaign Delivery Diagnostic:</strong>
                                            <div className="mt-0.5 font-mono text-[11px]">{viewingRecipientsCampaign.totals_json.failed_reason}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Recipient table */}
                                {loadingRecipients ? (
                                    <div className="py-12 text-center text-sm text-neutral-500">
                                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                                        Loading recipient logs...
                                    </div>
                                ) : recipientsData.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                                        No individual recipient records logged for this campaign.
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-neutral-50 text-[10px] font-bold uppercase text-neutral-500 dark:bg-neutral-800/50">
                                                <tr>
                                                    <th className="px-3 py-2">Recipient</th>
                                                    <th className="px-3 py-2">Status</th>
                                                    <th className="px-3 py-2">Error / Delivery Info</th>
                                                    <th className="px-3 py-2 text-right">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                {recipientsData.map((r) => (
                                                    <tr key={r.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                                                        <td className="px-3 py-2.5">
                                                            <div className="font-medium text-neutral-900 dark:text-white">{r.name}</div>
                                                            <div className="text-[11px] text-neutral-500">{r.email}</div>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                                                r.status === 'sent' || r.status === 'delivered' || r.status === 'read'
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : r.status === 'failed'
                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                            }`}>
                                                                {r.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 max-w-xs">
                                                            {r.failed_reason ? (
                                                                <div className="text-red-600 dark:text-red-400 font-mono text-[10px] break-words">
                                                                    {r.failed_reason}
                                                                </div>
                                                            ) : r.opened_at ? (
                                                                <span className="text-emerald-600">Opened</span>
                                                            ) : r.status === 'sent' ? (
                                                                <span className="text-emerald-600">Delivered</span>
                                                            ) : (
                                                                <span className="text-neutral-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right text-neutral-400 text-[10px]">
                                                            {r.sent_at ? new Date(r.sent_at).toLocaleTimeString() : 'Pending'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-3 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-800/30 rounded-b-2xl">
                                <div className="text-xs text-neutral-500">
                                    Campaign #{viewingRecipientsCampaign.id} &bull; {viewingRecipientsCampaign.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    {(viewingRecipientsCampaign.totals_json?.failed ?? 0) > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRetryFailed(viewingRecipientsCampaign.id)}
                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                                        >
                                            Retry Failed Sends
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setViewingRecipientsCampaign(null)}
                                        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </LayoutComponent>
    );
}

