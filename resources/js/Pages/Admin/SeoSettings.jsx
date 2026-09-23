import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Tabs } from '@/Components/ui';
import { Head, useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Search, BarChart2, CheckCircle2, Globe, ArrowRightLeft,
    Shield, Code, RefreshCw, Plus, Trash2, Edit2, ExternalLink,
    AlertCircle, Sparkles
} from 'lucide-react';

export default function SeoSettings({ settings = {}, redirects = [], sitemapUrls = {}, robotsUrl = '' }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('general');
    const [isClearingSitemap, setIsClearingSitemap] = useState(false);

    // Form for General SEO & Tracking
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        seo_site_title_suffix: settings.seo_site_title_suffix || '— BotifyAI',
        seo_default_meta_description: settings.seo_default_meta_description || '',
        seo_default_meta_keywords: settings.seo_default_meta_keywords || '',
        seo_google_analytics_id: settings.seo_google_analytics_id || '',
        seo_google_tag_manager_id: settings.seo_google_tag_manager_id || '',
        seo_clarity_project_id: settings.seo_clarity_project_id || '',
        seo_meta_pixel_id: settings.seo_meta_pixel_id || '',
        seo_tiktok_pixel_id: settings.seo_tiktok_pixel_id || '',
        seo_linkedin_partner_id: settings.seo_linkedin_partner_id || '',
        seo_google_verification_code: settings.seo_google_verification_code || '',
        seo_bing_verification_code: settings.seo_bing_verification_code || '',
        seo_yandex_verification_code: settings.seo_yandex_verification_code || '',
        seo_pinterest_verification_code: settings.seo_pinterest_verification_code || '',
        seo_custom_head_scripts: settings.seo_custom_head_scripts || '',
        seo_custom_body_scripts: settings.seo_custom_body_scripts || '',
    });

    // Form for New / Edit Redirect
    const [redirectModalOpen, setRedirectModalOpen] = useState(false);
    const [editingRedirect, setEditingRedirect] = useState(null);
    const redirectForm = useForm({
        source_path: '',
        target_url: '',
        status_code: '301',
        is_active: true,
    });

    const handleSettingsSubmit = (e) => {
        e.preventDefault();
        put(route('admin.seo.update'), {
            preserveScroll: true,
        });
    };

    const handleClearSitemap = () => {
        setIsClearingSitemap(true);
        router.post(route('admin.seo.clear-sitemap-cache'), {}, {
            preserveScroll: true,
            onFinish: () => setIsClearingSitemap(false),
        });
    };

    const openCreateRedirect = () => {
        setEditingRedirect(null);
        redirectForm.reset();
        redirectForm.setData({
            source_path: '',
            target_url: '',
            status_code: '301',
            is_active: true,
        });
        setRedirectModalOpen(true);
    };

    const openEditRedirect = (r) => {
        setEditingRedirect(r);
        redirectForm.setData({
            source_path: r.source_path,
            target_url: r.target_url,
            status_code: String(r.status_code),
            is_active: Boolean(r.is_active),
        });
        setRedirectModalOpen(true);
    };

    const handleRedirectSubmit = (e) => {
        e.preventDefault();
        if (editingRedirect) {
            redirectForm.put(route('admin.seo.redirects.update', editingRedirect.id), {
                preserveScroll: true,
                onSuccess: () => setRedirectModalOpen(false),
            });
        } else {
            redirectForm.post(route('admin.seo.redirects.store'), {
                preserveScroll: true,
                onSuccess: () => setRedirectModalOpen(false),
            });
        }
    };

    const handleDeleteRedirect = (id) => {
        if (confirm('Are you sure you want to delete this redirect?')) {
            router.delete(route('admin.seo.redirects.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const tabs = [
        { id: 'general', label: 'General SEO', icon: Search },
        { id: 'analytics', label: 'Tracking Pixels & Analytics', icon: BarChart2 },
        { id: 'verification', label: 'Search Verification', icon: Shield },
        { id: 'custom_code', label: 'Custom Scripts', icon: Code },
        { id: 'redirects', label: '301/302 Redirects', icon: ArrowRightLeft },
    ];

    return (
        <AdminLayout>
            <Head title="SEO & Analytics Management" />

            <div className="max-w-6xl mx-auto space-y-6 pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                            <Search className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                            SEO & Tracking Control Center
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Configure global search meta, multi-platform tracking pixels, search console verification, and 301 redirects.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClearSitemap}
                            disabled={isClearingSitemap}
                            className="flex items-center gap-2 text-xs"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isClearingSitemap ? 'animate-spin' : ''}`} />
                            Purge Sitemap Cache
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-neutral-200 dark:border-neutral-800 flex gap-2 overflow-x-auto pb-px">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                    active
                                        ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400 font-semibold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab 1: General SEO */}
                {activeTab === 'general' && (
                    <form onSubmit={handleSettingsSubmit} className="space-y-6">
                        <Card className="p-6 space-y-6">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                Global Title & Fallback Metadata
                            </h2>

                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Site Title Suffix
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_site_title_suffix}
                                        onChange={(e) => setData('seo_site_title_suffix', e.target.value)}
                                        placeholder="— BotifyAI"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500/20"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">Appended to page titles when formatting search previews.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Default Meta Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={data.seo_default_meta_description}
                                        onChange={(e) => setData('seo_default_meta_description', e.target.value)}
                                        placeholder="BotifyAI unifies WhatsApp, Messenger, and Instagram with AI chatbots and digital ecommerce..."
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Default Meta Keywords
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_default_meta_keywords}
                                        onChange={(e) => setData('seo_default_meta_keywords', e.target.value)}
                                        placeholder="WhatsApp CRM, AI Chatbots, Omnichannel Marketing, Digital Products"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Sitemap & Robots Status */}
                        <Card className="p-6 space-y-4">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                Live Sitemap & Robots Endpoints
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <a
                                    href={sitemapUrls.index}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition group"
                                >
                                    <div>
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Master Sitemap Index</div>
                                        <div className="text-xs text-neutral-500 font-mono">/sitemap.xml</div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-teal-600" />
                                </a>

                                <a
                                    href={sitemapUrls.products}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition group"
                                >
                                    <div>
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Products & Images Sitemap</div>
                                        <div className="text-xs text-neutral-500 font-mono">/sitemaps/products.xml</div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-teal-600" />
                                </a>

                                <a
                                    href={sitemapUrls.stores}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition group"
                                >
                                    <div>
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Stores Sitemap</div>
                                        <div className="text-xs text-neutral-500 font-mono">/sitemaps/stores.xml</div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-teal-600" />
                                </a>

                                <a
                                    href={robotsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition group"
                                >
                                    <div>
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Robots Directives</div>
                                        <div className="text-xs text-neutral-500 font-mono">/robots.txt</div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-teal-600" />
                                </a>
                            </div>
                        </Card>

                        <div className="flex items-center justify-end gap-3">
                            {recentlySuccessful && (
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Settings Saved
                                </span>
                            )}
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save General Settings'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Tab 2: Analytics & Pixels */}
                {activeTab === 'analytics' && (
                    <form onSubmit={handleSettingsSubmit} className="space-y-6">
                        <Card className="p-6 space-y-6">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                Analytics & Ad Platform Tracking
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Google Tag Manager (GTM Container ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_google_tag_manager_id}
                                        onChange={(e) => setData('seo_google_tag_manager_id', e.target.value)}
                                        placeholder="GTM-XXXXXXX"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500/20"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">Takes precedence over GA4 script if configured.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Google Analytics 4 (Measurement ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_google_analytics_id}
                                        onChange={(e) => setData('seo_google_analytics_id', e.target.value)}
                                        placeholder="G-XXXXXXXXXX"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500/20"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">Direct GA4 gtag.js integration.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Microsoft Clarity (Project ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_clarity_project_id}
                                        onChange={(e) => setData('seo_clarity_project_id', e.target.value)}
                                        placeholder="yky6jsr41d"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500/20"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">Heatmaps, click maps, and session recordings.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Meta Pixel ID (Facebook / Instagram)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_meta_pixel_id}
                                        onChange={(e) => setData('seo_meta_pixel_id', e.target.value)}
                                        placeholder="123456789012345"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500/20"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">Standard PageView & event tracking.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        TikTok Pixel ID
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_tiktok_pixel_id}
                                        onChange={(e) => setData('seo_tiktok_pixel_id', e.target.value)}
                                        placeholder="CXXXXXXXXXXXXXXX"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        LinkedIn Insight Partner ID
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_linkedin_partner_id}
                                        onChange={(e) => setData('seo_linkedin_partner_id', e.target.value)}
                                        placeholder="1234567"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>
                            </div>
                        </Card>

                        <div className="flex items-center justify-end gap-3">
                            {recentlySuccessful && (
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Settings Saved
                                </span>
                            )}
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Tracking Settings'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Tab 3: Search Verification */}
                {activeTab === 'verification' && (
                    <form onSubmit={handleSettingsSubmit} className="space-y-6">
                        <Card className="p-6 space-y-6">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                Webmaster & Search Console Verification Meta
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Google Search Console Token
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_google_verification_code}
                                        onChange={(e) => setData('seo_google_verification_code', e.target.value)}
                                        placeholder="google-site-verification token..."
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Bing Webmaster Tools (msvalidate.01)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_bing_verification_code}
                                        onChange={(e) => setData('seo_bing_verification_code', e.target.value)}
                                        placeholder="msvalidate.01 token..."
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Yandex Webmaster Token
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_yandex_verification_code}
                                        onChange={(e) => setData('seo_yandex_verification_code', e.target.value)}
                                        placeholder="yandex-verification token..."
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Pinterest Domain Verify Token
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_pinterest_verification_code}
                                        onChange={(e) => setData('seo_pinterest_verification_code', e.target.value)}
                                        placeholder="p:domain_verify token..."
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>
                            </div>
                        </Card>

                        <div className="flex items-center justify-end gap-3">
                            {recentlySuccessful && (
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Settings Saved
                                </span>
                            )}
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Verification Tokens'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Tab 4: Custom Scripts */}
                {activeTab === 'custom_code' && (
                    <form onSubmit={handleSettingsSubmit} className="space-y-6">
                        <Card className="p-6 space-y-6">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                Raw HTML / JS Injection
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Header Code (<code className="text-teal-600 dark:text-teal-400">&lt;head&gt;</code>)
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={data.seo_custom_head_scripts}
                                        onChange={(e) => setData('seo_custom_head_scripts', e.target.value)}
                                        placeholder="<!-- Custom meta, fonts, or tracking scripts -->"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono text-xs p-3 focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Body Code (<code className="text-teal-600 dark:text-teal-400">&lt;body&gt;</code>)
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={data.seo_custom_body_scripts}
                                        onChange={(e) => setData('seo_custom_body_scripts', e.target.value)}
                                        placeholder="<!-- Custom noscript or chat widgets -->"
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono text-xs p-3 focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>
                            </div>
                        </Card>

                        <div className="flex items-center justify-end gap-3">
                            {recentlySuccessful && (
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Settings Saved
                                </span>
                            )}
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Custom Scripts'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Tab 5: 301/302 Redirect Manager */}
                {activeTab === 'redirects' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                    URL Redirect Manager
                                </h2>
                                <p className="text-xs text-neutral-500">
                                    Create permanent (301) or temporary (302) redirects to preserve link equity and prevent 404s.
                                </p>
                            </div>
                            <Button onClick={openCreateRedirect} className="flex items-center gap-2 text-xs">
                                <Plus className="w-4 h-4" /> Add Redirect
                            </Button>
                        </div>

                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase border-b border-neutral-200 dark:border-neutral-800">
                                        <tr>
                                            <th className="px-4 py-3">Source Path</th>
                                            <th className="px-4 py-3">Target Destination</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Hits</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {redirects.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500 text-sm">
                                                    No URL redirects configured yet. Click "Add Redirect" to create one.
                                                </td>
                                            </tr>
                                        ) : (
                                            redirects.map((r) => (
                                                <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                                    <td className="px-4 py-3 font-mono text-xs text-neutral-900 dark:text-neutral-100">
                                                        {r.source_path}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-xs">
                                                        {r.target_url}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                            r.status_code === 301
                                                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                                        }`}>
                                                            {r.status_code}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                            r.is_active
                                                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                                        }`}>
                                                            {r.is_active ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                        {r.hit_count.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => openEditRedirect(r)}
                                                                className="p-1.5 rounded-lg text-neutral-500 hover:text-teal-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                                title="Edit Redirect"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRedirect(r.id)}
                                                                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                                title="Delete Redirect"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Redirect Create/Edit Modal */}
                {redirectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
                            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                {editingRedirect ? 'Edit URL Redirect' : 'Add New URL Redirect'}
                            </h3>

                            <form onSubmit={handleRedirectSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Source Path (e.g. /old-product-slug)
                                    </label>
                                    <input
                                        type="text"
                                        value={redirectForm.data.source_path}
                                        onChange={(e) => redirectForm.setData('source_path', e.target.value)}
                                        placeholder="/old-page"
                                        required
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500/20"
                                    />
                                    {redirectForm.errors.source_path && (
                                        <p className="text-xs text-red-500 mt-1">{redirectForm.errors.source_path}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Target Destination (e.g. /buy/new-product or full URL)
                                    </label>
                                    <input
                                        type="text"
                                        value={redirectForm.data.target_url}
                                        onChange={(e) => redirectForm.setData('target_url', e.target.value)}
                                        placeholder="/buy/new-page or https://..."
                                        required
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500/20"
                                    />
                                    {redirectForm.errors.target_url && (
                                        <p className="text-xs text-red-500 mt-1">{redirectForm.errors.target_url}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                            Status Code
                                        </label>
                                        <select
                                            value={redirectForm.data.status_code}
                                            onChange={(e) => redirectForm.setData('status_code', e.target.value)}
                                            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm"
                                        >
                                            <option value="301">301 Permanent</option>
                                            <option value="302">302 Temporary</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center pt-5">
                                        <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={redirectForm.data.is_active}
                                                onChange={(e) => redirectForm.setData('is_active', e.target.checked)}
                                                className="rounded text-teal-600 focus:ring-teal-500"
                                            />
                                            Active
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setRedirectModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={redirectForm.processing}
                                    >
                                        {redirectForm.processing ? 'Saving...' : 'Save Redirect'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
