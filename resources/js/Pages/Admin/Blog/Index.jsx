import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Newspaper,
    Plus,
    Search,
    Filter,
    Pencil,
    Trash2,
    Eye,
    FolderTree,
    Users,
    Sparkles,
    CheckCircle2,
    Clock,
    FileText,
    TrendingUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BlogIndex({
    posts,
    categories = [],
    authors = [],
    stats = { total: 0, published: 0, draft: 0, total_views: 0 },
    filters = { search: '', status: '', category_id: '' },
}) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category_id || '');
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiCluster, setAiCluster] = useState('all');
    const [aiTopics, setAiTopics] = useState([]);
    const [loadingAi, setLoadingAi] = useState(false);

    const handleFilter = (search = searchTerm, status = statusFilter, cat = categoryFilter) => {
        router.get(
            route('admin.blog.index'),
            {
                search: search || undefined,
                status: status || undefined,
                category_id: cat || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleDelete = (post) => {
        if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
            router.delete(route('admin.blog.destroy', post.id));
        }
    };

    const handleGenerateTopics = async () => {
        setLoadingAi(true);
        try {
            const res = await window.axios.post(route('admin.blog.ai.topics'), {
                cluster: aiCluster,
                count: 5,
            });
            if (res.data?.topics) {
                setAiTopics(res.data.topics);
            }
        } catch (e) {
            alert('Failed to generate AI topics: ' + (e.response?.data?.message || e.message));
        } finally {
            setLoadingAi(false);
        }
    };

    return (
        <AdminLayout title="Blog Management">
            <Head title="Blog Management — Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Newspaper className="h-7 w-7 text-brand-600 dark:text-brand-400" />
                            Blog & SEO Content Engine
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Publish high-ranking articles, manage authors, and accelerate organic growth with AI SEO.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setShowAiModal(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-semibold hover:bg-purple-100 transition shadow-sm"
                        >
                            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            AI Topic Ideas
                        </button>

                        <Link
                            href={route('admin.blog.categories.index')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition"
                        >
                            <FolderTree className="h-4 w-4 text-neutral-500" />
                            Categories & Tags
                        </Link>

                        <Link
                            href={route('admin.blog.authors.index')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition"
                        >
                            <Users className="h-4 w-4 text-neutral-500" />
                            Authors (E-E-A-T)
                        </Link>

                        <Link
                            href={route('admin.blog.create')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition"
                        >
                            <Plus className="h-4 w-4" />
                            New Article
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Articles</span>
                            <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">{stats.total}</div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Published Live</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.published}</div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Drafts / In Review</span>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats.draft}</div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Pageviews</span>
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">{Number(stats.total_views || 0).toLocaleString()}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by title, keyword, or excerpt..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilter(e.target.value, statusFilter, categoryFilter)}
                            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                handleFilter(searchTerm, statusFilter, e.target.value);
                            }}
                            className="w-full md:w-48 text-xs py-2 px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                handleFilter(searchTerm, e.target.value, categoryFilter);
                            }}
                            className="w-full md:w-36 text-xs py-2 px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>

                {/* Posts Table */}
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-5 py-3.5">Article</th>
                                    <th className="px-4 py-3.5">Category</th>
                                    <th className="px-4 py-3.5">Author</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                    <th className="px-4 py-3.5 text-right">Views</th>
                                    <th className="px-4 py-3.5">Date</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {posts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-12 text-neutral-400">
                                            No articles found. Click &quot;New Article&quot; to write your first post.
                                        </td>
                                    </tr>
                                ) : (
                                    posts.data.map((post) => (
                                        <tr key={post.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-700/30 transition">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {post.featured_image ? (
                                                        <img
                                                            src={post.featured_image}
                                                            alt={post.title}
                                                            className="w-12 h-9 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 max-w-sm">
                                                        <div className="font-semibold text-neutral-900 dark:text-white truncate" title={post.title}>
                                                            {post.title}
                                                        </div>
                                                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                                                            /{post.slug} &bull; {post.reading_time_minutes}m read
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {post.category ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40">
                                                        {post.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-neutral-600 dark:text-neutral-300">
                                                {post.author?.name || 'Botify Team'}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {post.status === 'published' ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                        Published
                                                    </span>
                                                ) : post.status === 'scheduled' ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                                                        Scheduled
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                                                        Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-medium text-neutral-600 dark:text-neutral-300">
                                                {Number(post.views_count || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-neutral-500 dark:text-neutral-400 text-[11px]">
                                                {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <a
                                                        href={route('blog.show', post.slug)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                                                        title="View Live Article"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                    <Link
                                                        href={route('admin.blog.edit', post.id)}
                                                        className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                                                        title="Edit Article"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(post)}
                                                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                                                        title="Delete Article"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {posts.links && posts.links.length > 3 && (
                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <span className="text-xs text-neutral-500">
                                Showing {posts.from} to {posts.to} of {posts.total} entries
                            </span>
                            <div className="flex gap-1">
                                {posts.links.map((l, i) => (
                                    <Link
                                        key={i}
                                        href={l.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: l.label }}
                                        className={`px-3 py-1 text-xs rounded-lg border ${
                                            l.active
                                                ? 'bg-brand-600 text-white border-brand-600 font-bold'
                                                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'
                                        } ${!l.url && 'opacity-40 pointer-events-none'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Topic Generator Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                                    AI SEO Content Intelligence & Topic Discovery
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Select a target semantic topic cluster. The AI Content Agent will analyze search intent, estimated ranking difficulty, and keyword opportunities.
                        </p>

                        <div className="flex items-center gap-3">
                            <select
                                value={aiCluster}
                                onChange={(e) => setAiCluster(e.target.value)}
                                className="flex-1 text-xs py-2 px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                            >
                                <option value="all">All Growth Clusters</option>
                                <option value="AI Chatbots & Agents">AI Chatbots & Agents</option>
                                <option value="WhatsApp Automation">WhatsApp Automation</option>
                                <option value="Digital Commerce & Sales">Digital Commerce & Sales</option>
                                <option value="Affiliate Growth & Monetization">Affiliate Growth & Monetization</option>
                                <option value="Marketing & CRM">Marketing & CRM</option>
                            </select>

                            <button
                                type="button"
                                disabled={loadingAi}
                                onClick={handleGenerateTopics}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                            >
                                <Sparkles className="h-4 w-4" />
                                {loadingAi ? 'Analyzing Trends...' : 'Discover Topics'}
                            </button>
                        </div>

                        {aiTopics.length > 0 && (
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                {aiTopics.map((topic, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 flex items-start justify-between gap-4"
                                    >
                                        <div className="space-y-1">
                                            <div className="font-bold text-xs text-neutral-900 dark:text-white">
                                                {topic.topic_title}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 items-center text-[10px] text-neutral-500">
                                                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-semibold uppercase">
                                                    {topic.search_intent}
                                                </span>
                                                <span>Difficulty: {topic.difficulty_score}/100</span>
                                                <span>&bull;</span>
                                                <span>Keywords: {topic.target_keywords?.join(', ')}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={route('admin.blog.create')}
                                            className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold shrink-0 transition"
                                            onClick={() => {
                                                sessionStorage.setItem('ai_seed_topic', JSON.stringify(topic));
                                            }}
                                        >
                                            Write Article
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={() => setShowAiModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

