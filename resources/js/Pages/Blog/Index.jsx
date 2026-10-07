import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import {
    Search,
    Clock,
    User,
    ArrowRight,
    Tag,
    Sparkles,
    BookOpen,
    Folder,
    TrendingUp,
    Rss,
} from 'lucide-react';

export default function BlogIndex({
    featuredPost = null,
    posts,
    categories = [],
    popularTags = [],
    filters = { search: '', category: '', tag: '' },
}) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('blog.index'),
            {
                search: searchTerm || undefined,
                category: filters.category || undefined,
                tag: filters.tag || undefined,
            },
            { preserveState: true }
        );
    };

    return (
        <LandingLayout>
            <SeoHead
                title="BotifyAI Blog — AI Chatbots, WhatsApp Automation & Growth Strategies"
                description="Discover authoritative guides, in-depth tutorials, and proven strategies on AI customer engagement, WhatsApp automation, digital products, and CRM workflows."
            />

            {/* 1. Blog Header & Hero */}
            <section
                className="relative overflow-hidden py-16 sm:py-24 text-center border-b border-neutral-200 dark:border-neutral-800"
                style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 0%, rgb(var(--brand-400) / 0.18) 0%, transparent 70%), rgb(var(--brand-950))' }}
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                        BotifyAI Knowledge & Growth Engine
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                        Insights on AI Chatbots, WhatsApp Automation & Scale
                    </h1>

                    <p className="text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                        Step-by-step blueprints, industry research, and actionable playbooks to automate customer engagement and monetize digital products.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="max-w-lg mx-auto pt-4 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search articles, tutorials, topics..."
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-900/80 border border-neutral-700 text-white text-xs placeholder-neutral-400 focus:ring-2 focus:ring-brand-500 focus:outline-none backdrop-blur-md"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition shrink-0"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </section>

            {/* 2. Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
                {/* Category Pills & RSS Feed Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('blog.index')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                                !filters.category && !filters.tag
                                    ? 'bg-brand-600 text-white shadow-sm'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                            }`}
                        >
                            All Articles
                        </Link>
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={route('blog.category', cat.slug)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                                    filters.category === cat.slug
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                                }`}
                            >
                                {cat.name} ({cat.posts_count})
                            </Link>
                        ))}
                    </div>

                    <a
                        href={route('blog.feed')}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 transition"
                        title="RSS 2.0 Feed"
                    >
                        <Rss className="h-3.5 w-3.5 text-amber-500" />
                        <span>RSS Feed</span>
                    </a>
                </div>

                {/* 3. Hero Featured Article (If available) */}
                {featuredPost && (
                    <div className="group relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl transition-all duration-300 hover:border-brand-500/50">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center">
                            <div className="lg:col-span-7 p-6 sm:p-10 space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500 text-white">
                                        Featured Masterclass
                                    </span>
                                    {featuredPost.category && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                                            {featuredPost.category.name}
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-brand-400 transition leading-snug">
                                    <Link href={route('blog.show', featuredPost.slug)}>
                                        {featuredPost.title}
                                    </Link>
                                </h2>

                                <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed">
                                    {featuredPost.excerpt}
                                </p>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                                            {featuredPost.author?.avatar_url ? (
                                                <img src={featuredPost.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                'B'
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">
                                                {featuredPost.author?.name || 'BotifyAI Editorial'}
                                            </div>
                                            <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                                                <span>{featuredPost.published_at}</span>
                                                <span>&bull;</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {featuredPost.reading_time_minutes} min read
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={route('blog.show', featuredPost.slug)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition"
                                    >
                                        Read Guide &rarr;
                                    </Link>
                                </div>
                            </div>

                            <div className="lg:col-span-5 h-64 lg:h-full min-h-[280px] relative overflow-hidden bg-neutral-800">
                                {featuredPost.featured_image ? (
                                    <img
                                        src={featuredPost.featured_image}
                                        alt={featuredPost.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-900 to-indigo-950 text-brand-300">
                                        <BookOpen className="h-16 w-16 opacity-40" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Google AdSense Top Responsive Banner Slot (Zero CLS Reserved Box) */}
                <div className="w-full min-h-[100px] sm:min-h-[120px] rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center p-4 text-center">
                    <div className="text-[11px] text-neutral-400 tracking-wider uppercase font-semibold">
                        Advertisement
                    </div>
                    {/* If AdSense script is enabled, the adsbygoogle tag renders here */}
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client="ca-pub-8605497211981606"
                        data-ad-slot="auto"
                        data-ad-format="auto"
                        data-full-width-responsive="true"
                    ></ins>
                </div>

                {/* 5. Article Grid */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-brand-600" />
                            Latest Articles & Guides
                        </h2>
                        {filters.tag && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                Tag: #{filters.tag}
                            </span>
                        )}
                    </div>

                    {posts.data.length === 0 ? (
                        <div className="p-12 text-center rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                            <BookOpen className="h-12 w-12 text-neutral-400 mx-auto" />
                            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                                No articles found matching your criteria.
                            </h3>
                            <p className="text-xs text-neutral-500">
                                Try adjusting your search query or browsing another category.
                            </p>
                            <Link
                                href={route('blog.index')}
                                className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold mt-2"
                            >
                                View All Articles
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.data.map((post) => (
                                <article
                                    key={post.id}
                                    className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:border-brand-500/40"
                                >
                                    <div>
                                        {/* Image */}
                                        <Link href={route('blog.show', post.slug)} className="block aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative">
                                            {post.featured_image ? (
                                                <img
                                                    src={post.featured_image}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                                                    <BookOpen className="h-8 w-8 opacity-50" />
                                                </div>
                                            )}
                                            {post.category && (
                                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-neutral-900/80 text-white backdrop-blur-md">
                                                    {post.category.name}
                                                </span>
                                            )}
                                        </Link>

                                        {/* Content */}
                                        <div className="p-5 space-y-2.5">
                                            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                                                <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                                                <span>&bull;</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {post.reading_time_minutes}m read
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition line-clamp-2 leading-snug">
                                                <Link href={route('blog.show', post.slug)}>
                                                    {post.title}
                                                </Link>
                                            </h3>

                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                                                {post.excerpt}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer / Author */}
                                    <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/60 text-xs">
                                        <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                                            {post.author?.name || 'BotifyAI Team'}
                                        </div>
                                        <Link
                                            href={route('blog.show', post.slug)}
                                            className="text-brand-600 dark:text-brand-400 font-bold text-xs hover:underline flex items-center gap-1"
                                        >
                                            Read <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {posts.links && posts.links.length > 3 && (
                        <div className="flex justify-center gap-1 pt-6">
                            {posts.links.map((l, i) => (
                                <Link
                                    key={i}
                                    href={l.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                    className={`px-4 py-2 text-xs rounded-xl border ${
                                        l.active
                                            ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-sm'
                                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50'
                                    } ${!l.url && 'opacity-40 pointer-events-none'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* 6. Popular Tag Cloud & Newsletter Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
                    <div className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-950 to-neutral-900 text-white border border-brand-800/40 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-semibold uppercase">
                                Stay Ahead of AI Automation
                            </span>
                            <h3 className="text-2xl font-bold">
                                Master Omnichannel Automation & Scale Revenue
                            </h3>
                            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
                                Join thousands of modern merchants, agency founders, and growth leaders scaling customer experience with BotifyAI.
                            </p>
                        </div>

                        <div className="pt-2">
                            <Link
                                href="/pricing"
                                className="inline-block px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs shadow-lg transition"
                            >
                                Get Started Free &rarr;
                            </Link>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                            <Tag className="h-4 w-4" /> Explore Popular Topics
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {popularTags.map((t) => (
                                <Link
                                    key={t.id}
                                    href={route('blog.tag', t.slug)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-neutral-700 transition"
                                >
                                    #{t.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}

