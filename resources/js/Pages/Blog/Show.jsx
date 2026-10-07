import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import {
    Clock,
    User,
    Calendar,
    ArrowLeft,
    Share2,
    Eye,
    Tag,
    BookOpen,
    Sparkles,
    Check,
    MessageSquare,
    ChevronRight,
    Copy,
} from 'lucide-react';

export default function BlogShow({
    post,
    relatedPosts = [],
}) {
    const [copied, setCopied] = useState(false);
    const [activeSection, setActiveSection] = useState('');

    const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://botifyai.cloud/blog/${post.slug}`;

    const handleCopyLink = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(pageUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Scroll spy for Table of Contents
    useEffect(() => {
        const handleScroll = () => {
            const headings = document.querySelectorAll('h2, h3');
            const scrollPos = window.scrollY + 120;

            headings.forEach((heading) => {
                const top = heading.offsetTop;
                const id = heading.id || heading.innerText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                if (!heading.id) heading.id = id;

                if (scrollPos >= top) {
                    setActiveSection(id);
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [post.content]);

    return (
        <LandingLayout>
            <SeoHead
                title={`${post.title} — BotifyAI Blog`}
                description={post.excerpt || `Read ${post.title} on the BotifyAI Blog.`}
            />

            <article className="min-h-screen bg-white dark:bg-neutral-950 pb-20">
                {/* 1. Header & Breadcrumbs */}
                <div className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 py-10 sm:py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-2 text-xs text-neutral-500">
                            <Link href="/" className="hover:text-brand-600 transition">Home</Link>
                            <ChevronRight className="h-3 w-3" />
                            <Link href={route('blog.index')} className="hover:text-brand-600 transition">Blog</Link>
                            {post.category && (
                                <>
                                    <ChevronRight className="h-3 w-3" />
                                    <Link href={route('blog.category', post.category.slug)} className="hover:text-brand-600 transition">
                                        {post.category.name}
                                    </Link>
                                </>
                            )}
                        </nav>

                        {/* Category Badge */}
                        {post.category && (
                            <Link
                                href={route('blog.category', post.category.slug)}
                                className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 transition"
                            >
                                {post.category.name}
                            </Link>
                        )}

                        {/* Title (H1) */}
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
                            {post.title}
                        </h1>

                        {/* Excerpt */}
                        {post.excerpt && (
                            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                                {post.excerpt}
                            </p>
                        )}

                        {/* Author & Meta Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                                    {post.author?.avatar_url ? (
                                        <img src={post.author.avatar_url} alt={post.author.name} className="w-full h-full object-cover" />
                                    ) : (
                                        'B'
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                                        {post.author ? (
                                            <Link href={route('blog.author', post.author.slug)} className="hover:underline">
                                                {post.author.name}
                                            </Link>
                                        ) : (
                                            'BotifyAI Editorial Team'
                                        )}
                                    </div>
                                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        {post.author?.title_role || 'Automation & SEO Specialist'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" /> Published {post.published_at}
                                </span>
                                <span>&bull;</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> {post.reading_time_minutes} min read
                                </span>
                                <span>&bull;</span>
                                <span className="flex items-center gap-1 font-mono">
                                    <Eye className="h-3.5 w-3.5" /> {Number(post.views_count || 0).toLocaleString()} views
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Featured Image */}
                {post.featured_image && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4 sm:-mt-6 mb-10">
                        <div className="rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 aspect-[16/9] bg-neutral-100 dark:bg-neutral-900">
                            <img
                                src={post.featured_image}
                                alt={post.featured_image_alt || post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* 3. Main Content & Sticky TOC Layout */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Table of Contents & Social Share (Desktop Sticky Sidebar) */}
                        <aside className="lg:col-span-4 space-y-6">
                            <div className="sticky top-24 space-y-6">
                                {/* Table of Contents Box */}
                                {post.table_of_contents && post.table_of_contents.length > 0 && (
                                    <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                                        <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                                            <BookOpen className="h-4 w-4 text-brand-600" />
                                            Table of Contents
                                        </h4>
                                        <nav className="space-y-1.5 max-h-80 overflow-y-auto text-xs">
                                            {post.table_of_contents.map((item, idx) => (
                                                <a
                                                    key={idx}
                                                    href={`#${item.anchor}`}
                                                    className={`block py-1 transition ${
                                                        item.level === 3 ? 'pl-4 text-[11px]' : 'font-medium'
                                                    } ${
                                                        activeSection === item.anchor
                                                            ? 'text-brand-600 dark:text-brand-400 font-bold'
                                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                                    }`}
                                                >
                                                    {item.title}
                                                </a>
                                            ))}
                                        </nav>
                                    </div>
                                )}

                                {/* Social Sharing */}
                                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                                        <Share2 className="h-4 w-4" /> Share This Guide
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${pageUrl}`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 text-center transition flex items-center justify-center gap-1.5"
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                                        </a>

                                        <a
                                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(pageUrl)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 text-center transition"
                                        >
                                            Twitter / X
                                        </a>

                                        <a
                                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-600 text-center transition"
                                        >
                                            LinkedIn
                                        </a>

                                        <button
                                            type="button"
                                            onClick={handleCopyLink}
                                            className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 text-center transition flex items-center justify-center gap-1"
                                        >
                                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                            {copied ? 'Copied!' : 'Copy Link'}
                                        </button>
                                    </div>
                                </div>

                                {/* Sidebar High-Converting CTA */}
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-900 to-indigo-950 text-white border border-brand-800/40 space-y-3 shadow-lg">
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-brand-300">
                                        <Sparkles className="h-3 w-3" /> Ready to Scale?
                                    </div>
                                    <h4 className="font-bold text-base leading-snug">
                                        Deploy AI Chatbots on WhatsApp & Instagram in 15 Minutes
                                    </h4>
                                    <p className="text-xs text-neutral-300 leading-relaxed">
                                        Automate customer support, capture leads, and recover abandoned carts 24/7.
                                    </p>
                                    <Link
                                        href="/pricing"
                                        className="block w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs text-center shadow-md transition"
                                    >
                                        Try BotifyAI Free
                                    </Link>
                                </div>
                            </div>
                        </aside>

                        {/* Main Article Body (8 Columns) */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Google AdSense In-Article Top Slot (Zero CLS Reserved Box) */}
                            <div className="w-full min-h-[90px] rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center p-3 text-center">
                                <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                                    Advertisement
                                </div>
                                <ins
                                    className="adsbygoogle"
                                    style={{ display: 'block', textAlign: 'center' }}
                                    data-ad-layout="in-article"
                                    data-ad-format="fluid"
                                    data-ad-client="ca-pub-8605497211981606"
                                    data-ad-slot="auto"
                                ></ins>
                            </div>

                            {/* Prose Article HTML */}
                            <div
                                className="prose prose-neutral dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 leading-relaxed prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 prose-blockquote:border-l-4 prose-blockquote:border-brand-500 prose-blockquote:bg-neutral-50 dark:prose-blockquote:bg-neutral-900 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />

                            {/* Tags Section */}
                            {post.tags && post.tags.length > 0 && (
                                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-neutral-500 flex items-center gap-1">
                                        <Tag className="h-3.5 w-3.5" /> Tags:
                                    </span>
                                    {post.tags.map((t) => (
                                        <Link
                                            key={t.slug}
                                            href={route('blog.tag', t.slug)}
                                            className="px-3 py-1 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-brand-50 hover:text-brand-600 transition"
                                        >
                                            #{t.name}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Author Bio Card (E-E-A-T Transparency) */}
                            {post.author && (
                                <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                                        {post.author.avatar_url ? (
                                            <img src={post.author.avatar_url} alt={post.author.name} className="w-full h-full object-cover" />
                                        ) : (
                                            post.author.name.charAt(0)
                                        )}
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <h4 className="font-bold text-base text-neutral-900 dark:text-white">
                                                    Written by {post.author.name}
                                                </h4>
                                                <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">
                                                    {post.author.title_role || 'BotifyAI Specialist'}
                                                </p>
                                            </div>
                                            <Link
                                                href={route('blog.author', post.author.slug)}
                                                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                                            >
                                                More from this author &rarr;
                                            </Link>
                                        </div>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                            {post.author.bio || 'Author bio and background in AI customer engagement and automation.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Google AdSense Bottom Banner */}
                            <div className="w-full min-h-[100px] rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center p-3 text-center">
                                <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                                    Advertisement
                                </div>
                                <ins
                                    className="adsbygoogle"
                                    style={{ display: 'block' }}
                                    data-ad-client="ca-pub-8605497211981606"
                                    data-ad-slot="auto"
                                    data-ad-format="auto"
                                    data-full-width-responsive="true"
                                ></ins>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Related Articles Section */}
                {relatedPosts.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 border-t border-neutral-200 dark:border-neutral-800 mt-16 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                                Recommended Reading
                            </h3>
                            <Link href={route('blog.index')} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
                                View all articles &rarr;
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedPosts.map((rPost) => (
                                <article
                                    key={rPost.id}
                                    className="group rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition"
                                >
                                    <Link href={route('blog.show', rPost.slug)} className="block aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                        {rPost.featured_image ? (
                                            <img
                                                src={rPost.featured_image}
                                                alt={rPost.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                                                <BookOpen className="h-6 w-6 opacity-50" />
                                            </div>
                                        )}
                                    </Link>
                                    <div className="p-4 space-y-2">
                                        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                                            <span>{rPost.published_at}</span>
                                            <span>&bull;</span>
                                            <span>{rPost.reading_time_minutes}m read</span>
                                        </div>
                                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition line-clamp-2">
                                            <Link href={route('blog.show', rPost.slug)}>
                                                {rPost.title}
                                            </Link>
                                        </h4>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </LandingLayout>
    );
}

