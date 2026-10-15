import { Head, useForm, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Palette, Type, Image as ImageIcon, Sparkles, Check, Upload, Eye,
    RefreshCw, Layers, ShieldCheck, Sliders, CheckCircle2, AlertCircle,
    Layout, ArrowRight, Share2, Globe, Tag, MessageSquare, Info
} from 'lucide-react';

const PRESET_THEMES = [
    {
        id: 'modern_minimalist',
        name: 'Modern Minimalist',
        colors: { primary: '#6366f1', secondary: '#0f172a', accent: '#38bdf8', bg: '#0b0f19', surface: '#1e293b' },
        heading: 'Poppins',
        body: 'Inter',
    },
    {
        id: 'tech_neon',
        name: 'Cyber & Tech Glow',
        colors: { primary: '#10b981', secondary: '#064e3b', accent: '#34d399', bg: '#022c22', surface: '#065f46' },
        heading: 'Space Grotesk',
        body: 'Inter',
    },
    {
        id: 'editorial_luxury',
        name: 'Editorial Luxury',
        colors: { primary: '#d97706', secondary: '#18181b', accent: '#fbbf24', bg: '#09090b', surface: '#27272a' },
        heading: 'Playfair Display',
        body: 'Inter',
    },
    {
        id: 'vibrant_electric',
        name: 'Vibrant Electric',
        colors: { primary: '#ec4899', secondary: '#312e81', accent: '#a855f7', bg: '#1e1b4b', surface: '#312e81' },
        heading: 'Montserrat',
        body: 'Poppins',
    },
    {
        id: 'clean_light',
        name: 'Clean Light Slate',
        colors: { primary: '#2563eb', secondary: '#1e293b', accent: '#60a5fa', bg: '#f1f5f9', surface: '#ffffff' },
        heading: 'Outfit',
        body: 'Inter',
    },
];

export default function BrandKit({ brand_profile, archetypes = [], aspect_ratios = [], font_catalog = [] }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('preview');
    const [selectedArchetype, setSelectedArchetype] = useState('tip');
    const [selectedRatio, setSelectedRatio] = useState(brand_profile?.aspect_ratios?.[0] || '1:1');
    const [previewSvg, setPreviewSvg] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [contrastData, setContrastData] = useState({ ratio: 7.2, rating: 'AAA' });
    const [uploadingAsset, setUploadingAsset] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        brand_name: brand_profile.brand_name || '',
        website_url: brand_profile.website_url || '',
        primary_handle: brand_profile.primary_handle || '',
        niche: brand_profile.niche || '',
        target_audience: brand_profile.target_audience || '',
        tone: brand_profile.tone || 'professional',
        writing_style: brand_profile.writing_style || '',
        primary_color: brand_profile.primary_color || '#6366f1',
        secondary_color: brand_profile.secondary_color || '#0f172a',
        accent_color: brand_profile.accent_color || '#38bdf8',
        bg_color: brand_profile.bg_color || '#0b0f19',
        surface_color: brand_profile.surface_color || '#1e293b',
        heading_font: brand_profile.heading_font || 'Poppins',
        body_font: brand_profile.body_font || 'Inter',
        accent_font: brand_profile.accent_font || 'Playfair Display',
        logo_url: brand_profile.logo_url || '',
        dark_logo_url: brand_profile.dark_logo_url || '',
        watermark_url: brand_profile.watermark_url || '',
        watermark_opacity: brand_profile.watermark_opacity || 40,
        watermark_position: brand_profile.watermark_position || 'bottom-right',
        visual_theme: brand_profile.visual_theme || 'modern_minimalist',
        aspect_ratios: brand_profile.aspect_ratios || ['1:1', '4:5'],
        content_pillars: brand_profile.content_pillars || ['Educational Insights', 'Industry Trends', 'Actionable Tips', 'Case Studies'],
        cta_templates: brand_profile.cta_templates || ['Save this post for later ↗', 'Follow for daily growth insights', 'Link in bio to learn more'],
        active_templates: brand_profile.active_templates || ['tip', 'quote', 'data', 'promo', 'announcement', 'carousel'],
        requires_approval: brand_profile.requires_approval || false,
        auto_replenish: brand_profile.auto_replenish !== false,
    });

    const [newPillar, setNewPillar] = useState('');
    const [newCta, setNewCta] = useState('');

    // Fetch dynamic vector preview
    const fetchPreview = async () => {
        setPreviewLoading(true);
        try {
            const res = await fetch(route('client.social.brand-kit.preview'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    template: selectedArchetype,
                    payload: {
                        brand_name: data.brand_name,
                        primary_handle: data.primary_handle,
                        website_url: data.website_url,
                        logo_url: data.logo_url,
                        watermark_url: data.watermark_url,
                        watermark_opacity: data.watermark_opacity,
                        watermark_position: data.watermark_position,
                        primary_color: data.primary_color,
                        secondary_color: data.secondary_color,
                        accent_color: data.accent_color,
                        bg_color: data.bg_color,
                        surface_color: data.surface_color,
                        heading_font: data.heading_font,
                        body_font: data.body_font,
                        aspect_ratio: selectedRatio,
                        pillar: data.niche ? data.niche.toUpperCase() : 'GROWTH INSIGHT',
                        headline: selectedArchetype === 'quote'
                            ? 'The secret to compounding scale is not working harder, but building systems that execute while you sleep.'
                            : (selectedArchetype === 'data'
                                ? 'Automated social distribution drives 4.8x higher consistent organic reach over manual posting.'
                                : 'Mastering Autonomous AI Social Distribution for Growing Brands'),
                        subheadline: 'Eliminate creative bottlenecks, enforce brand consistency across every channel, and publish high-converting content effortlessly.',
                        cta_text: data.cta_templates[0] || 'Save for later ↗',
                    },
                }),
            });
            const json = await res.json();
            if (json.svg) {
                setPreviewSvg(json.svg);
                setContrastData({
                    ratio: json.contrast_ratio || 7.2,
                    rating: json.contrast_rating || 'AAA',
                });
            }
        } catch (e) {
            console.error('Failed to load preview:', e);
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        fetchPreview();
    }, [selectedArchetype, selectedRatio, data.primary_color, data.secondary_color, data.surface_color, data.heading_font, data.logo_url, data.watermark_opacity]);

    const handleApplyPreset = (preset) => {
        setData(prev => ({
            ...prev,
            visual_theme: preset.id,
            primary_color: preset.colors.primary,
            secondary_color: preset.colors.secondary,
            accent_color: preset.colors.accent,
            bg_color: preset.colors.bg,
            surface_color: preset.colors.surface,
            heading_font: preset.heading,
            body_font: preset.body,
        }));
    };

    const handleFileUpload = async (e, assetType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAsset(assetType);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('asset_type', assetType);

        try {
            const res = await fetch(route('client.social.brand-kit.upload-asset'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: formData,
            });
            const json = await res.json();
            if (json.url) {
                if (assetType === 'logo') setData('logo_url', json.url);
                if (assetType === 'dark_logo') setData('dark_logo_url', json.url);
                if (assetType === 'watermark') setData('watermark_url', json.url);
                setSuccessMessage(t('social.asset_uploaded', 'Asset uploaded successfully.'));
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setUploadingAsset(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('client.social.brand-kit.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setSuccessMessage(t('social.brand_kit_saved', 'Brand Design Kit saved successfully!'));
                setTimeout(() => setSuccessMessage(''), 4000);
            },
        });
    };

    const addPillar = () => {
        if (!newPillar.trim()) return;
        setData('content_pillars', [...data.content_pillars, newPillar.trim()]);
        setNewPillar('');
    };

    const removePillar = (idx) => {
        setData('content_pillars', data.content_pillars.filter((_, i) => i !== idx));
    };

    const addCta = () => {
        if (!newCta.trim()) return;
        setData('cta_templates', [...data.cta_templates, newCta.trim()]);
        setNewCta('');
    };

    const removeCta = (idx) => {
        setData('cta_templates', data.cta_templates.filter((_, i) => i !== idx));
    };

    const toggleTemplate = (tplId) => {
        const cur = [...data.active_templates];
        if (cur.includes(tplId)) {
            if (cur.length > 1) {
                setData('active_templates', cur.filter(x => x !== tplId));
            }
        } else {
            setData('active_templates', [...cur, tplId]);
        }
    };

    return (
        <ClientLayout>
            <Head title="AI Brand Design Kit - Social Creative Architecture" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                                <Palette className="w-6 h-6" />
                            </span>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                AI Brand Design Kit & Creative Engine
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Configure your workspace identity, vector typography, brand palettes, logos, and dynamic templates for autonomous social auto-posting.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {successMessage && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {successMessage}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 active:scale-95 transition shadow-sm disabled:opacity-50"
                        >
                            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {t('common.save_changes', 'Save Brand Kit')}
                        </button>
                    </div>
                </div>

                {/* Navigation Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-100 dark:border-neutral-800/60">
                    {[
                        { id: 'preview', label: 'Live Creative Preview', icon: <Eye className="w-4 h-4" /> },
                        { id: 'colors', label: 'Colors & Palettes', icon: <Palette className="w-4 h-4" /> },
                        { id: 'typography', label: 'Typography', icon: <Type className="w-4 h-4" /> },
                        { id: 'logos', label: 'Logos & Watermarks', icon: <ImageIcon className="w-4 h-4" /> },
                        { id: 'identity', label: 'Brand & Handles', icon: <Globe className="w-4 h-4" /> },
                        { id: 'templates', label: 'Content Archetypes', icon: <Layers className="w-4 h-4" /> },
                        { id: 'automation', label: 'Publishing Rules', icon: <ShieldCheck className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB 1: LIVE CREATIVE PREVIEW */}
                {activeTab === 'preview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Preview Controls */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                                    <span>Creative Archetype</span>
                                    <button
                                        type="button"
                                        onClick={fetchPreview}
                                        className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
                                        Re-render
                                    </button>
                                </h3>

                                <div className="grid grid-cols-2 gap-2">
                                    {archetypes.map(arc => (
                                        <button
                                            key={arc.id}
                                            type="button"
                                            onClick={() => setSelectedArchetype(arc.id)}
                                            className={`p-3 text-left rounded-xl border text-xs transition ${
                                                selectedArchetype === arc.id
                                                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-semibold'
                                                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
                                            }`}
                                        >
                                            <div className="font-medium text-xs mb-0.5">{arc.name}</div>
                                            <span className="text-[10px] text-neutral-400 line-clamp-1">{arc.badge}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-2">
                                        Aspect Ratio Format
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {aspect_ratios.map(ar => (
                                            <button
                                                key={ar.id}
                                                type="button"
                                                onClick={() => setSelectedRatio(ar.id)}
                                                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition ${
                                                    selectedRatio === ar.id
                                                        ? 'border-brand-600 bg-brand-600 text-white'
                                                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                                }`}
                                            >
                                                {ar.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* WCAG Contrast Badge */}
                                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            WCAG Accessibility Score
                                        </div>
                                        <div className="text-[11px] text-neutral-500 mt-0.5">
                                            Contrast ratio: <span className="font-mono font-medium">{contrastData.ratio}:1</span>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                        {contrastData.rating} Verified
                                    </span>
                                </div>
                            </div>

                            {/* Theme Quick Switcher */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                                    Preset Color Palettes
                                </h4>
                                <div className="space-y-2">
                                    {PRESET_THEMES.map(preset => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => handleApplyPreset(preset)}
                                            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-brand-400 transition text-left"
                                        >
                                            <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                                {preset.name}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {Object.values(preset.colors).map((c, i) => (
                                                    <span key={i} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Visual SVG Output Container */}
                        <div className="lg:col-span-7 flex flex-col items-center">
                            <div className="w-full p-4 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center min-h-[520px]">
                                {previewLoading ? (
                                    <div className="flex flex-col items-center gap-3 py-24 text-neutral-400">
                                        <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
                                        <span className="text-sm font-medium">Synthesizing vector brand creative...</span>
                                    </div>
                                ) : previewSvg ? (
                                    <div
                                        className="w-full max-w-[540px] rounded-2xl overflow-hidden shadow-lg transition-all"
                                        dangerouslySetInnerHTML={{ __html: previewSvg }}
                                    />
                                ) : (
                                    <div className="text-neutral-500 text-sm py-20">Click Re-render to generate preview</div>
                                )}
                            </div>
                            <span className="mt-3 text-xs text-neutral-400 flex items-center gap-1">
                                <Info className="w-3.5 h-3.5" />
                                Pixel-perfect vector canvas rendered with Google Web Fonts and live brand assets.
                            </span>
                        </div>
                    </div>
                )}

                {/* TAB 2: COLOR PALETTES */}
                {activeTab === 'colors' && (
                    <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Workspace Color Palette</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                These exact hex codes are strictly applied across all generated social cards, dividers, badges, and CTA buttons.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { key: 'primary_color', label: 'Primary Identity', desc: 'Hero accents, badge fills, CTA buttons' },
                                { key: 'secondary_color', label: 'Secondary Foundation', desc: 'Canvas gradients & dark card borders' },
                                { key: 'accent_color', label: 'Accent Highlight', desc: 'Quotation marks & metric highlights' },
                                { key: 'bg_color', label: 'Canvas Background', desc: 'Outer social canvas fill' },
                                { key: 'surface_color', label: 'Card Surface', desc: 'Floating inner card surface' },
                            ].map(item => (
                                <div key={item.key} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{item.label}</span>
                                        <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: data[item.key] }} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={data[item.key]}
                                            onChange={e => setData(item.key, e.target.value)}
                                            className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={data[item.key]}
                                            onChange={e => setData(item.key, e.target.value)}
                                            className="w-full text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2 py-1.5 uppercase"
                                        />
                                    </div>
                                    <p className="text-[11px] text-neutral-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 3: TYPOGRAPHY */}
                {activeTab === 'typography' && (
                    <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Typography Hierarchy</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                Select high-fidelity TrueType & Google Web Fonts for crisp headlines and readable multi-line body text.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                                        Heading Font (Headlines, Hooks, Stat Figures)
                                    </label>
                                    <select
                                        value={data.heading_font}
                                        onChange={e => setData('heading_font', e.target.value)}
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3"
                                    >
                                        {font_catalog.map(f => (
                                            <option key={f.name} value={f.name}>{f.name} ({f.mood})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                                        Body Font (Paragraphs, Key Takeaways, Citations)
                                    </label>
                                    <select
                                        value={data.body_font}
                                        onChange={e => setData('body_font', e.target.value)}
                                        className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3"
                                    >
                                        {font_catalog.map(f => (
                                            <option key={f.name} value={f.name}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Live Type Preview Box */}
                            <div className="p-5 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Typography Preview</span>
                                <div style={{ fontFamily: data.heading_font }} className="text-2xl font-extrabold text-white">
                                    The 1% Rule of Autonomous Scaling
                                </div>
                                <p style={{ fontFamily: data.body_font }} className="text-xs text-neutral-300 leading-relaxed">
                                    Compound execution produces exponential business differentiation. High-converting creative systems maintain visual clarity across all screen sizes.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: LOGOS & WATERMARKS */}
                {activeTab === 'logos' && (
                    <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Brand Assets & Watermark Placement</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                Upload transparent vector PNG/SVG logos and configure automatic watermarking.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Primary Logo */}
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Primary Brand Logo</span>
                                <div className="h-28 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-dashed border-neutral-300 dark:border-neutral-700">
                                    {data.logo_url ? (
                                        <img src={data.logo_url} alt="Logo" className="max-h-20 max-w-[80%] object-contain" />
                                    ) : (
                                        <span className="text-xs text-neutral-400">No logo uploaded</span>
                                    )}
                                </div>
                                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-xs font-medium cursor-pointer transition">
                                    <Upload className="w-3.5 h-3.5" />
                                    {uploadingAsset === 'logo' ? 'Uploading...' : 'Upload Logo'}
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'logo')} />
                                </label>
                            </div>

                            {/* Watermark Asset */}
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Brand Watermark / Favicon</span>
                                <div className="h-28 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-dashed border-neutral-300 dark:border-neutral-700">
                                    {data.watermark_url ? (
                                        <img src={data.watermark_url} alt="Watermark" className="max-h-20 max-w-[80%] object-contain" />
                                    ) : (
                                        <span className="text-xs text-neutral-400">No watermark uploaded</span>
                                    )}
                                </div>
                                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-xs font-medium cursor-pointer transition">
                                    <Upload className="w-3.5 h-3.5" />
                                    {uploadingAsset === 'watermark' ? 'Uploading...' : 'Upload Watermark'}
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'watermark')} />
                                </label>
                            </div>

                            {/* Watermark Settings */}
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Watermark Controls</span>
                                <div>
                                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                                        <span>Opacity</span>
                                        <span className="font-mono">{data.watermark_opacity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={data.watermark_opacity}
                                        onChange={e => setData('watermark_opacity', parseInt(e.target.value))}
                                        className="w-full accent-brand-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 block mb-1">Corner Placement</label>
                                    <select
                                        value={data.watermark_position}
                                        onChange={e => setData('watermark_position', e.target.value)}
                                        className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-1.5 px-2"
                                    >
                                        <option value="bottom-right">Bottom Right</option>
                                        <option value="bottom-left">Bottom Left</option>
                                        <option value="top-right">Top Right</option>
                                        <option value="top-left">Top Left</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: BRAND & HANDLES */}
                {activeTab === 'identity' && (
                    <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Brand Metadata & Social Signatures</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                Printed on the bottom signature footer of every creative to build recognition and drive website traffic.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Brand Name</label>
                                <input
                                    type="text"
                                    value={data.brand_name}
                                    onChange={e => setData('brand_name', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3"
                                    placeholder="e.g. BotifyAI"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Primary Social Handle</label>
                                <input
                                    type="text"
                                    value={data.primary_handle}
                                    onChange={e => setData('primary_handle', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3"
                                    placeholder="e.g. @botifyai"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Website URL</label>
                                <input
                                    type="text"
                                    value={data.website_url}
                                    onChange={e => setData('website_url', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3"
                                    placeholder="e.g. botify.ai"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <div>
                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Industry Niche</label>
                                <input
                                    type="text"
                                    value={data.niche}
                                    onChange={e => setData('niche', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3"
                                    placeholder="e.g. B2B SaaS, Marketing Automation, AI Software"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Target Audience</label>
                                <input
                                    type="text"
                                    value={data.target_audience}
                                    onChange={e => setData('target_audience', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3"
                                    placeholder="e.g. Agency owners, marketing leaders, founders"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 6: CONTENT ARCHETYPES & PILLARS */}
                {activeTab === 'templates' && (
                    <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Active Design Archetypes</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                The AI engine intelligently rotates through enabled archetypes to eliminate design fatigue.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {archetypes.map(arc => {
                                const active = data.active_templates.includes(arc.id);
                                return (
                                    <div
                                        key={arc.id}
                                        onClick={() => toggleTemplate(arc.id)}
                                        className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                                            active
                                                ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/20'
                                                : 'border-neutral-200 dark:border-neutral-800 opacity-60'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={active}
                                            onChange={() => {}}
                                            className="mt-1 rounded text-brand-600 focus:ring-brand-500"
                                        />
                                        <div>
                                            <div className="text-xs font-semibold text-neutral-900 dark:text-white">{arc.name}</div>
                                            <p className="text-[11px] text-neutral-500 mt-1">{arc.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Content Pillars */}
                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                                Content Pillars & Ideation Topics
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {data.content_pillars.map((pillar, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                    >
                                        {pillar}
                                        <button type="button" onClick={() => removePillar(i)} className="text-neutral-400 hover:text-red-500">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 max-w-md">
                                <input
                                    type="text"
                                    value={newPillar}
                                    onChange={e => setNewPillar(e.target.value)}
                                    placeholder="Add content pillar (e.g. Growth Hacking)"
                                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-1.5 px-3"
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPillar(); } }}
                                />
                                <button
                                    type="button"
                                    onClick={addPillar}
                                    className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg text-xs font-medium"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 7: PUBLISHING RULES */}
                {activeTab === 'automation' && (
                    <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Publishing & Quality Gate Rules</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                Control whether auto-generated social posts publish automatically or queue for your visual approval.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                                <div>
                                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Require Visual Approval for Auto-Generated Posts</div>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">
                                        When enabled, AI-created posts are saved as Drafts in your Social Calendar and Composer for 1-click review and approval before publishing.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.requires_approval}
                                    onChange={e => setData('requires_approval', e.target.checked)}
                                    className="h-4 w-4 text-brand-600 rounded focus:ring-brand-500"
                                />
                            </div>

                            <div className="flex items-start justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                                <div>
                                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">Auto-Replenish Scheduled Queue</div>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">
                                        Continuously computes upcoming optimal posting times and maintains a buffer of upcoming branded creatives.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.auto_replenish}
                                    onChange={e => setData('auto_replenish', e.target.checked)}
                                    className="h-4 w-4 text-brand-600 rounded focus:ring-brand-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}

