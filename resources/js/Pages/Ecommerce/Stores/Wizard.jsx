import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import {
    Store, Search, Share2, CreditCard, ShieldCheck,
    Bot, ArrowRight, ArrowLeft, Check, Sparkles,
    Eye, Globe, HelpCircle, CheckCircle2, Lock
} from 'lucide-react';

const STEPS = [
    { id: 1, name: 'Basic Info', icon: Store, desc: 'Identity & Branding' },
    { id: 2, name: 'SEO & Social', icon: Search, desc: 'Google Search Preview' },
    { id: 3, name: 'Pixels & CAPI', icon: Share2, desc: 'Meta, TikTok, GA4' },
    { id: 4, name: 'Payout Settlement', icon: CreditCard, desc: 'Bank Account' },
    { id: 5, name: 'Store Policies', icon: ShieldCheck, desc: '1-Click Legal Templates' },
    { id: 6, name: 'AI Sales Agents', icon: Bot, desc: 'Connect 24/7 Bots & Launch' },
];

export default function StoreWizard({
    store = null,
    bankAccounts = [],
    bots = [],
    isNew = false,
}) {
    const [currentStep, setCurrentStep] = useState(1);

    const { data, setData, post, processing, errors } = useForm({
        name: store?.name || '',
        slug: store?.slug || '',
        currency: store?.currency || 'NGN',
        support_email: store?.support_email || '',
        support_phone: store?.support_phone || '',
        brand_color: store?.brand_color || '#0D9488',
        logo_url: store?.logo_url || '',
        banner_url: store?.banner_url || '',
        description: store?.description || '',
        bank_account_id: store?.bank_account_id || (bankAccounts[0]?.id || ''),
        seo_meta: {
            meta_title: store?.seo_meta?.meta_title || store?.name || '',
            meta_description: store?.seo_meta?.meta_description || store?.description || '',
            keywords: store?.seo_meta?.keywords || '',
            og_image: store?.seo_meta?.og_image || '',
        },
        marketing_pixels: {
            meta_pixel_id: store?.marketing_pixels?.meta_pixel_id || '',
            meta_capi_token: store?.marketing_pixels?.meta_capi_token || '',
            tiktok_pixel_id: store?.marketing_pixels?.tiktok_pixel_id || '',
            tiktok_access_token: store?.marketing_pixels?.tiktok_access_token || '',
            ga4_measurement_id: store?.marketing_pixels?.ga4_measurement_id || '',
            gtm_container_id: store?.marketing_pixels?.gtm_container_id || '',
            clarity_project_id: store?.marketing_pixels?.clarity_project_id || '',
        },
        policies: {
            refund_policy: store?.policies?.refund_policy || '',
            privacy_policy: store?.policies?.privacy_policy || '',
            terms_of_service: store?.policies?.terms_of_service || '',
            delivery_terms: store?.policies?.delivery_terms || '',
        },
        connected_bot_ids: store?.connected_bot_ids || (bots.length > 0 ? [bots[0].id] : []),
    });

    const handleAutoPolicies = () => {
        setData('policies', {
            refund_policy: `We stand behind our digital products. If you experience technical defects preventing access or download that our support cannot resolve within 7 days, you are entitled to a full refund.`,
            privacy_policy: `Your privacy is protected. We collect your email and payment details strictly to deliver digital download access and order receipts. Your data is never sold or shared.`,
            terms_of_service: `By purchasing digital products from ${data.name || 'this store'}, you are granted a non-exclusive, non-transferable personal license to download and access the purchased content.`,
            delivery_terms: `Instant Digital Delivery: Download links and access tokens are generated immediately upon verified payment completion and accessible from your Buyer Vault 24/7.`,
        });
    };

    const handleBotToggle = (botId) => {
        const current = [...data.connected_bot_ids];
        const index = current.indexOf(botId);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(botId);
        }
        setData('connected_bot_ids', current);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const url = store?.uuid
            ? route('client.ecommerce.stores.wizard.update', { store: store.uuid })
            : route('client.ecommerce.stores.wizard.save');
        post(url);
    };

    return (
        <ClientLayout>
            <Head title={isNew ? 'Create New AI Commerce Store' : `Configure ${store?.name || 'Store'}`} />

            <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 pb-20">
                {/* Header Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link
                            href={route('client.ecommerce.stores.index')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Store Command Center
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Store className="w-7 h-7 text-teal-600" />
                            {isNew ? '6-Step Store Launch Wizard' : `Configure ${store?.name || 'Store'}`}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Configure your digital storefront, SEO previews, server-side marketing CAPI, and autonomous AI sales bots.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Sparkles className="w-4 h-4" /> Save & Launch Store
                        </button>
                    </div>
                </div>

                {/* Stepper Navigation */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => setCurrentStep(step.id)}
                                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                    isActive
                                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                                        : isCompleted
                                        ? 'bg-white dark:bg-gray-800 border-emerald-300 dark:border-emerald-800 text-gray-700 dark:text-gray-300'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-teal-600 text-white' : isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-gray-400">0{step.id}</span>
                                </div>
                                <div>
                                    <div className={`text-xs font-bold ${isActive ? 'text-teal-900 dark:text-teal-200' : 'text-gray-900 dark:text-white'}`}>
                                        {step.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                        {step.desc}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Form Container */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8 space-y-6">
                    {/* STEP 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Store className="w-5 h-5 text-teal-600" /> Step 1: Store Basics & Identity
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Set your public store name, web address slug, and customer support contacts.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Store Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Apex Digital Academy"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Store URL Slug
                                    </label>
                                    <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden text-sm">
                                        <span className="px-3 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-2.5">
                                            botifyai.cloud/buy/
                                        </span>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            placeholder="apex-digital"
                                            className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-white border-0 focus:ring-0 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Store Currency
                                    </label>
                                    <select
                                        value={data.currency}
                                        onChange={(e) => setData('currency', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="NGN">NGN (Nigerian Naira ₦)</option>
                                        <option value="USD">USD (US Dollar $)</option>
                                        <option value="GBP">GBP (British Pound £)</option>
                                        <option value="EUR">EUR (Euro €)</option>
                                        <option value="GHS">GHS (Ghanaian Cedi ₵)</option>
                                        <option value="KES">KES (Kenyan Shilling KSh)</option>
                                        <option value="ZAR">ZAR (South African Rand R)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Brand Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={data.brand_color}
                                            onChange={(e) => setData('brand_color', e.target.value)}
                                            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                                        />
                                        <input
                                            type="text"
                                            value={data.brand_color}
                                            onChange={(e) => setData('brand_color', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Customer Support Email
                                    </label>
                                    <input
                                        type="email"
                                        value={data.support_email}
                                        onChange={(e) => setData('support_email', e.target.value)}
                                        placeholder="support@yourbrand.com"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Support Phone / WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={data.support_phone}
                                        onChange={(e) => setData('support_phone', e.target.value)}
                                        placeholder="+234 800 000 0000"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Store Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe what your digital store offers..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Store Logo URL
                                    </label>
                                    <input
                                        type="url"
                                        value={data.logo_url}
                                        onChange={(e) => setData('logo_url', e.target.value)}
                                        placeholder="https://.../logo.png"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Store Banner URL
                                    </label>
                                    <input
                                        type="url"
                                        value={data.banner_url}
                                        onChange={(e) => setData('banner_url', e.target.value)}
                                        placeholder="https://.../banner.jpg"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SEO & Social Preview */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Search className="w-5 h-5 text-teal-600" /> Step 2: SEO & Google Search Snippet Preview
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Control how your store appears in Google Search, WhatsApp link previews, and Twitter/Facebook social cards.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Meta Title (Google Title)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.seo_meta.meta_title}
                                            onChange={(e) => setData('seo_meta', { ...data.seo_meta, meta_title: e.target.value })}
                                            placeholder={data.name || 'Store Title'}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Meta Description (Search Summary)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.seo_meta.meta_description}
                                            onChange={(e) => setData('seo_meta', { ...data.seo_meta, meta_description: e.target.value })}
                                            placeholder="Discover premium digital assets, templates, and courses..."
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Keywords (Comma Separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.seo_meta.keywords}
                                            onChange={(e) => setData('seo_meta', { ...data.seo_meta, keywords: e.target.value })}
                                            placeholder="ebooks, templates, software, ai tools"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Social Sharing Image URL (Open Graph)
                                        </label>
                                        <input
                                            type="url"
                                            value={data.seo_meta.og_image}
                                            onChange={(e) => setData('seo_meta', { ...data.seo_meta, og_image: e.target.value })}
                                            placeholder="https://.../og-cover.png"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Live Google Search & Social Preview Box */}
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                            <Globe className="w-3.5 h-3.5 text-blue-500" /> Google Search Preview
                                        </div>
                                        <div className="font-sans space-y-1">
                                            <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                                https://botifyai.cloud › buy › {data.slug || 'your-store'}
                                            </div>
                                            <div className="text-base text-blue-700 dark:text-blue-400 font-medium hover:underline cursor-pointer">
                                                {data.seo_meta.meta_title || data.name || 'Store Title'} | BotifyAI
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {data.seo_meta.meta_description || data.description || 'Discover exclusive digital products, tools, and courses.'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Social Card Preview */}
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Share2 className="w-3.5 h-3.5 text-teal-500" /> WhatsApp & Social Card Preview
                                        </div>
                                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                            {data.seo_meta.og_image ? (
                                                <img src={data.seo_meta.og_image} alt="" className="w-full h-32 object-cover" />
                                            ) : (
                                                <div className="w-full h-24 bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {data.name || 'BotifyAI Store'}
                                                </div>
                                            )}
                                            <div className="p-2.5">
                                                <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                    {data.seo_meta.meta_title || data.name || 'Store Title'}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                                                    {data.seo_meta.meta_description || 'Instant digital download & verified checkouts.'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Marketing Pixels & CAPI */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Share2 className="w-5 h-5 text-teal-600" /> Step 3: Marketing Pixels & Conversions API (CAPI)
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Track visitors, initiate checkouts, and dispatch server-side Purchase conversions to beat ad-blockers and iOS privacy restrictions.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Meta (Facebook & Instagram)
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Meta Pixel ID</label>
                                        <input
                                            type="text"
                                            value={data.marketing_pixels.meta_pixel_id}
                                            onChange={(e) => setData('marketing_pixels', { ...data.marketing_pixels, meta_pixel_id: e.target.value })}
                                            placeholder="e.g. 123456789012345"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                            Meta CAPI Access Token (Server-Side 100% Tracking)
                                        </label>
                                        <input
                                            type="password"
                                            value={data.marketing_pixels.meta_capi_token}
                                            onChange={(e) => setData('marketing_pixels', { ...data.marketing_pixels, meta_capi_token: e.target.value })}
                                            placeholder="EAA..."
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white" /> TikTok Ads & Events API
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">TikTok Pixel Code</label>
                                        <input
                                            type="text"
                                            value={data.marketing_pixels.tiktok_pixel_id}
                                            onChange={(e) => setData('marketing_pixels', { ...data.marketing_pixels, tiktok_pixel_id: e.target.value })}
                                            placeholder="e.g. C5XXXXXXXXXXXXXX"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">TikTok API Access Token</label>
                                        <input
                                            type="password"
                                            value={data.marketing_pixels.tiktok_access_token}
                                            onChange={(e) => setData('marketing_pixels', { ...data.marketing_pixels, tiktok_access_token: e.target.value })}
                                            placeholder="Access token..."
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Google Analytics 4 (GA4)
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">GA4 Measurement ID</label>
                                        <input
                                            type="text"
                                            value={data.marketing_pixels.ga4_measurement_id}
                                            onChange={(e) => setData('marketing_pixels', { ...data.marketing_pixels, ga4_measurement_id: e.target.value })}
                                            placeholder="G-XXXXXXXXXX"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Google Tag Manager (GTM)
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">GTM Container ID</label>
                                        <input
                                            type="text"
                                            value={data.marketing_pixels.gtm_container_id}
                                            onChange={(e) => setData('marketing_pixels', { ...data.marketing_pixels, gtm_container_id: e.target.value })}
                                            placeholder="GTM-XXXXXXX"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-3 md:col-span-2">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Microsoft Clarity (Session Replay & Heatmaps)
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Clarity Project ID</label>
                                        <input
                                            type="text"
                                            value={data.marketing_pixels.clarity_project_id}
                                            onChange={(e) => setData('marketing_pixels', { ...data.marketing_pixels, clarity_project_id: e.target.value })}
                                            placeholder="e.g. j7x..."
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Payout Settlement */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-teal-600" /> Step 4: Automated Bank Settlement
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Select which verified bank account receives automatic escrow payouts from sales made on this store.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-3">
                                <Lock className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Zero Gateway Complexity:</span> You do NOT need Paystack or Stripe developer keys. BotifyAI collects all customer payments securely, deducts a standard 5% platform fee, and credits 100% of your earnings to your linked bank account.
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Select Settlement Bank Account:
                                </label>
                                {bankAccounts.length === 0 ? (
                                    <div className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                                        <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">No Bank Account Linked Yet</p>
                                        <p className="text-xs text-gray-500 mt-1 mb-3">You can link your Nigerian NUBAN bank account from your wallet.</p>
                                        <Link
                                            href={route('client.ecommerce.wallet.index')}
                                            className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold text-xs"
                                        >
                                            Add Bank Account in Wallet Hub →
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {bankAccounts.map((acc) => (
                                            <label
                                                key={acc.id}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                    String(data.bank_account_id) === String(acc.id)
                                                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="bank_account_id"
                                                        value={acc.id}
                                                        checked={String(data.bank_account_id) === String(acc.id)}
                                                        onChange={(e) => setData('bank_account_id', e.target.value)}
                                                        className="text-teal-600 focus:ring-teal-500"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{acc.bank_name}</div>
                                                        <div className="text-xs font-mono text-gray-500">•••• {acc.account_number?.slice(-4)}</div>
                                                        <div className="text-xs text-gray-400">{acc.account_name}</div>
                                                    </div>
                                                </div>
                                                {acc.is_primary && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40">
                                                        Primary
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Store Policies */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-teal-600" /> Step 5: Store Policies & Legal Terms
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Reassure customers and boost checkout conversion with standard digital guarantees.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAutoPolicies}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 flex items-center gap-1.5"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> 1-Click Auto-Fill Best Practice Policies
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Refund & Satisfaction Guarantee Policy
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={data.policies.refund_policy}
                                        onChange={(e) => setData('policies', { ...data.policies, refund_policy: e.target.value })}
                                        placeholder="Outline your refund conditions for digital assets..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Digital Delivery & Instant Access Guarantee
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.policies.delivery_terms}
                                        onChange={(e) => setData('policies', { ...data.policies, delivery_terms: e.target.value })}
                                        placeholder="Instant download links and vault access..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Customer Privacy & Data Protection
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.policies.privacy_policy}
                                        onChange={(e) => setData('policies', { ...data.policies, privacy_policy: e.target.value })}
                                        placeholder="How customer emails and checkout data are protected..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Terms of Service & Personal License
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.policies.terms_of_service}
                                        onChange={(e) => setData('policies', { ...data.policies, terms_of_service: e.target.value })}
                                        placeholder="Personal usage licensing terms..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: AI Bot Assignment & 1-Click Launch */}
                    {currentStep === 6 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-teal-600" /> Step 6: Autonomous AI Sales Bot & Live Launch
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Select the AI bots that will serve as 24/7 commerce assistants on your store (answering customer questions, searching products, and generating checkout links).
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Available AI Chatbots in Workspace:
                                </label>
                                {bots.length === 0 ? (
                                    <div className="p-5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                                        <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">No AI Chatbots Created Yet</p>
                                        <p className="text-xs text-gray-500 mt-1">You can create an AI bot in the AI Agent Studio anytime.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {bots.map((b) => {
                                            const isSelected = data.connected_bot_ids.includes(b.id);
                                            return (
                                                <div
                                                    key={b.id}
                                                    onClick={() => handleBotToggle(b.id)}
                                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                        isSelected
                                                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20'
                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                                            <Bot className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{b.name}</div>
                                                            <div className="text-xs text-gray-500">Model: {b.model || 'Gemini 2.5'}</div>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {}}
                                                        className="rounded text-teal-600 focus:ring-teal-500"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Launch Summary Card */}
                            <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-900 to-gray-900 text-white shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-teal-400" />
                                        <h3 className="font-bold text-base">Store Ready for Immediate Deployment</h3>
                                    </div>
                                    <span className="text-xs font-mono bg-teal-800/80 px-2.5 py-1 rounded-full text-teal-200">
                                        botifyai.cloud/buy/{data.slug || 'store'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-300">
                                    Upon clicking Launch, your store will be instantly accessible globally with Paystack/Card checkout, real-time AI sales agent assistance, and server-side conversion tracking.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step Navigation Controls */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 flex items-center gap-1"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                            {currentStep < 6 ? (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow flex items-center gap-1.5"
                                >
                                    Next Step ({STEPS[currentStep].name}) <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 rounded-xl text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Save & Launch Store
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </ClientLayout>
    );
}

