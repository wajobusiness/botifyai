import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Newspaper,
    Save,
    ArrowLeft,
    Sparkles,
    Image as ImageIcon,
    Eye,
    Globe,
    Clock,
    Tag,
    User,
    Folder,
    CheckCircle2,
    Search,
    Wand2,
    UploadCloud,
} from 'lucide-react';

export default function BlogCreateEdit({
    post = null,
    categories = [],
    authors = [],
    tags = [],
}) {
    const isEditing = !!post;

    const { data, setData, post: submitPost, put: submitPut, processing, errors } = useForm({
        title: post?.title || '',
        slug: post?.slug || '',
        category_id: post?.category_id || (categories[0]?.id ?? ''),
        author_id: post?.author_id || (authors[0]?.id ?? ''),
        excerpt: post?.excerpt || '',
        content: post?.content || '',
        featured_image: post?.featured_image || '',
        featured_image_alt: post?.featured_image_alt || '',
        status: post?.status || 'published',
        published_at: post?.published_at || new Date().toISOString().slice(0, 16),
        reading_time_minutes: post?.reading_time_minutes || 5,
        is_featured: post?.is_featured ?? false,
        meta_title: post?.meta_title || '',
        meta_description: post?.meta_description || '',
        focus_keyword: post?.focus_keyword || '',
        secondary_keywords: post?.secondary_keywords || [],
        tags: post?.tags || [],
    });

    const [tagInput, setTagInput] = useState('');
    const [activeTab, setActiveTab] = useState('editor'); // editor, preview, seo
    const [uploadingImage, setUploadingImage] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);
    const [aiCopilotOpen, setAiCopilotOpen] = useState(false);

    // Auto-fill from AI Topic discovery if session seed exists
    useEffect(() => {
        if (!isEditing) {
            const seed = sessionStorage.getItem('ai_seed_topic');
            if (seed) {
                try {
                    const parsed = JSON.parse(seed);
                    if (parsed.topic_title) {
                        setData((prev) => ({
                            ...prev,
                            title: parsed.topic_title,
                            focus_keyword: parsed.target_keywords?.[0] || '',
                            secondary_keywords: parsed.target_keywords?.slice(1) || [],
                            tags: parsed.target_keywords || [],
                        }));
                    }
                } catch (_) {}
                sessionStorage.removeItem('ai_seed_topic');
            }
        }
    }, [isEditing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            submitPut(route('admin.blog.update', post.id));
        } else {
            submitPost(route('admin.blog.store'));
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await window.axios.post(route('admin.blog.upload-image'), formData);
            if (res.data?.url) {
                setData('featured_image', res.data.url);
            }
        } catch (err) {
            alert('Image upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim().replace(',', '');
            if (val && !data.tags.includes(val)) {
                setData('tags', [...data.tags, val]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setData('tags', data.tags.filter((t) => t !== tagToRemove));
    };

    const handleInsertTag = (tagToInsert) => {
        const textarea = document.getElementById('blog-content-area');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = data.content;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const selected = text.substring(start, end);

        let replacement = '';
        if (tagToInsert === 'h2') replacement = `<h2>${selected || 'Heading 2'}</h2>\n`;
        else if (tagToInsert === 'h3') replacement = `<h3>${selected || 'Heading 3'}</h3>\n`;
        else if (tagToInsert === 'p') replacement = `<p>${selected || 'Paragraph text...'}</p>\n`;
        else if (tagToInsert === 'b') replacement = `<strong>${selected || 'bold text'}</strong>`;
        else if (tagToInsert === 'i') replacement = `<em>${selected || 'italic text'}</em>`;
        else if (tagToInsert === 'ul') replacement = `<ul>\n  <li>${selected || 'Point 1'}</li>\n  <li>Point 2</li>\n</ul>\n`;
        else if (tagToInsert === 'quote') replacement = `<blockquote><p>${selected || 'Important note or quote'}</p></blockquote>\n`;
        else if (tagToInsert === 'cta') replacement = `<div class="p-6 my-6 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-center"><h3 class="font-bold text-lg text-brand-900 dark:text-brand-200">Start Free with BotifyAI Today</h3><p class="text-sm text-neutral-600 dark:text-neutral-300 mt-1">Deploy intelligent AI chatbots on WhatsApp & Instagram in 15 minutes.</p><a href="/pricing" class="inline-block mt-4 px-6 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md">Get Started Free &rarr;</a></div>\n`;

        setData('content', before + replacement + after);
    };

    // AI Copilot Actions
    const handleAiGenerateOutline = async () => {
        if (!data.title) {
            alert('Please enter an Article Title first.');
            return;
        }
        setLoadingAi(true);
        try {
            const res = await window.axios.post(route('admin.blog.ai.outline'), {
                topic_title: data.title,
                focus_keyword: data.focus_keyword,
            });
            if (res.data?.outline) {
                const outline = res.data.outline;
                setData((prev) => ({
                    ...prev,
                    meta_title: outline.meta_title || prev.meta_title,
                    meta_description: outline.meta_description || prev.meta_description,
                    focus_keyword: outline.focus_keyword || prev.focus_keyword,
                }));
                alert('✓ AI Outline & Meta Tags generated successfully!');
            }
        } catch (e) {
            alert('AI error: ' + (e.response?.data?.message || e.message));
        } finally {
            setLoadingAi(false);
        }
    };

    const handleAiGenerateDraft = async () => {
        if (!data.title) {
            alert('Please enter an Article Title first.');
            return;
        }
        if (data.content && !confirm('This will overwrite the current content with a new AI draft. Proceed?')) {
            return;
        }
        setLoadingAi(true);
        try {
            const res = await window.axios.post(route('admin.blog.ai.draft'), {
                topic_title: data.title,
                keywords: [data.focus_keyword, ...data.secondary_keywords].filter(Boolean),
            });
            if (res.data?.draft) {
                const d = res.data.draft;
                setData((prev) => ({
                    ...prev,
                    content: d.content || prev.content,
                    excerpt: d.excerpt || prev.excerpt,
                    meta_title: d.meta_title || prev.meta_title,
                    meta_description: d.meta_description || prev.meta_description,
                    reading_time_minutes: d.reading_time_minutes || prev.reading_time_minutes,
                    tags: d.tags && d.tags.length > 0 ? d.tags : prev.tags,
                }));
                alert('✓ Comprehensive AI draft generated! You can now review and edit.');
            }
        } catch (e) {
            alert('AI error: ' + (e.response?.data?.message || e.message));
        } finally {
            setLoadingAi(false);
        }
    };

    const handleAiOptimizeSeo = async () => {
        if (!data.title || !data.content) {
            alert('Please enter a Title and Content first.');
            return;
        }
        setLoadingAi(true);
        try {
            const res = await window.axios.post(route('admin.blog.ai.optimize-seo'), {
                title: data.title,
                content: data.content,
            });
            if (res.data?.seo) {
                const s = res.data.seo;
                setData((prev) => ({
                    ...prev,
                    meta_title: s.meta_title || prev.meta_title,
                    meta_description: s.meta_description || prev.meta_description,
                    focus_keyword: s.focus_keyword || prev.focus_keyword,
                    secondary_keywords: s.secondary_keywords || prev.secondary_keywords,
                }));
                alert(`✓ SEO Optimized (Estimated Score: ${s.seo_score}/100)`);
            }
        } catch (e) {
            alert('AI error: ' + (e.response?.data?.message || e.message));
        } finally {
            setLoadingAi(false);
        }
    };

    return (
        <AdminLayout title={isEditing ? 'Edit Article' : 'New Article'}>
            <Head title={isEditing ? `Edit: ${post.title}` : 'New Article — Blog'} />

            <form onSubmit={handleSubmit} className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-20 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur py-3 px-1 -mx-1">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('admin.blog.index')}
                            className="p-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                                {isEditing ? 'Edit Article' : 'Create New Article'}
                            </h1>
                            <p className="text-xs text-neutral-500">
                                {data.status === 'published' ? 'Will be publicly visible' : 'Draft / in progress'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setAiCopilotOpen(!aiCopilotOpen)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-semibold hover:bg-purple-100 transition shadow-sm"
                        >
                            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            AI Copilot
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : isEditing ? 'Update Article' : 'Publish Article'}
                        </button>
                    </div>
                </div>

                {/* AI Copilot Drawer */}
                {aiCopilotOpen && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-neutral-800 border border-purple-500/30 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-yellow-400" />
                                <h3 className="font-bold text-sm text-white">AI SEO Content Copilot</h3>
                            </div>
                            <span className="text-[11px] text-purple-300">Google Search & AdSense Compliant Generator</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                type="button"
                                disabled={loadingAi}
                                onClick={handleAiGenerateDraft}
                                className="p-3 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-left text-xs space-y-1 transition disabled:opacity-50"
                            >
                                <div className="font-bold flex items-center gap-1.5">
                                    <Wand2 className="h-3.5 w-3.5" /> 1-Click Full Draft
                                </div>
                                <div className="text-[11px] text-purple-200">
                                    Generates 1,000+ word structured HTML guide with examples.
                                </div>
                            </button>

                            <button
                                type="button"
                                disabled={loadingAi}
                                onClick={handleAiGenerateOutline}
                                className="p-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-left text-xs space-y-1 transition disabled:opacity-50"
                            >
                                <div className="font-bold flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" /> Generate SEO Outline
                                </div>
                                <div className="text-[11px] text-indigo-200">
                                    Creates H2/H3 hierarchy & FAQ schema targets.
                                </div>
                            </button>

                            <button
                                type="button"
                                disabled={loadingAi}
                                onClick={handleAiOptimizeSeo}
                                className="p-3 rounded-xl bg-neutral-700/80 hover:bg-neutral-700 text-white text-left text-xs space-y-1 transition disabled:opacity-50"
                            >
                                <div className="font-bold flex items-center gap-1.5">
                                    <Search className="h-3.5 w-3.5" /> Optimize Meta & Keywords
                                </div>
                                <div className="text-[11px] text-neutral-300">
                                    Analyzes keyword density & generates meta tags.
                                </div>
                            </button>
                        </div>
                        {loadingAi && (
                            <div className="text-center py-2 text-xs font-semibold text-yellow-300 animate-pulse">
                                AI Copilot is thinking and generating content...
                            </div>
                        )}
                    </div>
                )}

                {/* Main Content & Sidebar Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Main Editor */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title & Slug */}
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Article Title *
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. How to Automate Customer Engagement with AI Chatbots"
                                    className="w-full text-base font-bold px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    required
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                        Slug (URL Permalink)
                                    </label>
                                    <div className="flex items-center text-xs rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-neutral-500">
                                        <span>/blog/</span>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            placeholder="auto-generated-slug"
                                            className="w-full bg-transparent border-none p-0 text-xs text-neutral-900 dark:text-white font-mono focus:ring-0"
                                        />
                                    </div>
                                    {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                        Estimated Reading Time (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.reading_time_minutes}
                                        onChange={(e) => setData('reading_time_minutes', parseInt(e.target.value) || 1)}
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Article Excerpt */}
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-2">
                            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                Short Excerpt & Summary
                            </label>
                            <p className="text-[11px] text-neutral-400">
                                Displayed in blog cards, social shares, and search engine snippets.
                            </p>
                            <textarea
                                rows={3}
                                value={data.excerpt}
                                onChange={(e) => setData('excerpt', e.target.value)}
                                placeholder="A 2-3 sentence teaser introducing the core takeaway..."
                                className="w-full text-xs p-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white resize-y"
                            />
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('editor')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                            activeTab === 'editor'
                                                ? 'bg-brand-600 text-white'
                                                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                                        }`}
                                    >
                                        HTML / Markdown Editor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('preview')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                            activeTab === 'preview'
                                                ? 'bg-brand-600 text-white'
                                                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                                        }`}
                                    >
                                        Live Render Preview
                                    </button>
                                </div>

                                {/* Quick HTML Toolbar */}
                                {activeTab === 'editor' && (
                                    <div className="flex flex-wrap items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleInsertTag('h2')}
                                            className="px-2 py-1 text-[11px] font-bold rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200"
                                        >
                                            H2
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleInsertTag('h3')}
                                            className="px-2 py-1 text-[11px] font-bold rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200"
                                        >
                                            H3
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleInsertTag('p')}
                                            className="px-2 py-1 text-[11px] font-semibold rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200"
                                        >
                                            &lt;p&gt;
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleInsertTag('b')}
                                            className="px-2 py-1 text-[11px] font-bold rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200"
                                        >
                                            Bold
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleInsertTag('ul')}
                                            className="px-2 py-1 text-[11px] rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200"
                                        >
                                            • List
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleInsertTag('quote')}
                                            className="px-2 py-1 text-[11px] italic rounded bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200"
                                        >
                                            Quote
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleInsertTag('cta')}
                                            className="px-2 py-1 text-[11px] font-bold rounded bg-brand-100 text-brand-700 hover:bg-brand-200"
                                        >
                                            + Product CTA Box
                                        </button>
                                    </div>
                                )}
                            </div>

                            {activeTab === 'editor' ? (
                                <textarea
                                    id="blog-content-area"
                                    rows={22}
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    placeholder="Write your article in semantic HTML (<h2>, <h3>, <p>, <ul>, <blockquote>)..."
                                    className="w-full text-xs font-mono p-4 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white leading-relaxed resize-y focus:ring-2 focus:ring-brand-500"
                                    required
                                />
                            ) : (
                                <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 min-h-[400px]">
                                    <div
                                        className="prose dark:prose-invert max-w-none text-xs leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: data.content || '<p class="text-neutral-400">No content entered yet.</p>' }}
                                    />
                                </div>
                            )}
                            {errors.content && <p className="text-red-500 text-xs">{errors.content}</p>}
                        </div>

                        {/* SEO Inspector & Google Snippet Simulator */}
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                                <Search className="h-5 w-5 text-brand-600" />
                                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                                    SEO & Google Search Snippet Simulation
                                </h3>
                            </div>

                            {/* Google Preview Card */}
                            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-1">
                                <div className="text-[11px] text-neutral-500 font-sans flex items-center gap-1.5">
                                    <span>https://botifyai.cloud</span>
                                    <span>&rsaquo;</span>
                                    <span>blog</span>
                                    <span>&rsaquo;</span>
                                    <span className="text-neutral-700 dark:text-neutral-300">{data.slug || 'article-slug'}</span>
                                </div>
                                <div className="text-base font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">
                                    {data.meta_title || data.title || 'Your Article Title'}
                                </div>
                                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                                    {data.meta_description || data.excerpt || 'Enter a meta description to see how this article will appear in Google search results...'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        SEO Meta Title ({data.meta_title.length}/60)
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={70}
                                        value={data.meta_title}
                                        onChange={(e) => setData('meta_title', e.target.value)}
                                        placeholder="Target keyword at start | Brand"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Focus Keyword
                                    </label>
                                    <input
                                        type="text"
                                        value={data.focus_keyword}
                                        onChange={(e) => setData('focus_keyword', e.target.value)}
                                        placeholder="e.g. AI chatbot WhatsApp"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    SEO Meta Description ({data.meta_description.length}/155)
                                </label>
                                <textarea
                                    rows={2}
                                    maxLength={165}
                                    value={data.meta_description}
                                    onChange={(e) => setData('meta_description', e.target.value)}
                                    placeholder="Compelling 150-character summary that drives clicks from Google..."
                                    className="w-full text-xs p-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white resize-y"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right 1 Column: Meta Settings, Publishing & Featured Image */}
                    <div className="space-y-6">
                        {/* Publishing Status Box */}
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                                Publish Settings
                            </h3>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full text-xs py-2 px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                >
                                    <option value="published">Published (Live)</option>
                                    <option value="draft">Draft (Private)</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Publish Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.published_at}
                                    onChange={(e) => setData('published_at', e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
                                <input
                                    type="checkbox"
                                    id="is_featured"
                                    checked={data.is_featured}
                                    onChange={(e) => setData('is_featured', e.target.checked)}
                                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                />
                                <label htmlFor="is_featured" className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                    Feature on Blog Hero
                                </label>
                            </div>
                        </div>

                        {/* Category & Author Box */}
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                                Taxonomy & Attribution
                            </h3>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Category
                                </label>
                                <select
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full text-xs py-2 px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Author (E-E-A-T Profile)
                                </label>
                                <select
                                    value={data.author_id}
                                    onChange={(e) => setData('author_id', e.target.value)}
                                    className="w-full text-xs py-2 px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                >
                                    <option value="">Select Author</option>
                                    {authors.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tags Input */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Tags (Press Enter or Comma)
                                </label>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    placeholder="Add tag and press Enter..."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                                {data.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {data.tags.map((t) => (
                                            <span
                                                key={t}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium"
                                            >
                                                {t}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(t)}
                                                    className="hover:text-red-500 font-bold"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Featured Image Box */}
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                                Featured Image & OpenGraph
                            </h3>

                            {data.featured_image ? (
                                <div className="space-y-2">
                                    <img
                                        src={data.featured_image}
                                        alt={data.featured_image_alt || 'Featured'}
                                        className="w-full h-40 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setData('featured_image', '')}
                                        className="text-xs text-red-500 hover:underline font-semibold"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            ) : (
                                <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition">
                                    <UploadCloud className="h-7 w-7 text-neutral-400" />
                                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                        {uploadingImage ? 'Uploading...' : 'Click to Upload Image'}
                                    </span>
                                    <span className="text-[10px] text-neutral-400">PNG, JPG, WebP up to 5MB</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Or Paste Image URL
                                </label>
                                <input
                                    type="text"
                                    value={data.featured_image}
                                    onChange={(e) => setData('featured_image', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Image Alt Text (SEO Requirement)
                                </label>
                                <input
                                    type="text"
                                    value={data.featured_image_alt}
                                    onChange={(e) => setData('featured_image_alt', e.target.value)}
                                    placeholder="Descriptive alt text for Google Image search..."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}

