import React from 'react';
import { Head, Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import { User, Clock, ArrowLeft, ArrowRight, BookOpen, Globe } from 'lucide-react';

export default function BlogAuthorPage({
    author,
    posts,
}) {
    return (
        <LandingLayout>
            <SeoHead
                title={`${author.name} — Articles & Author Profile | BotifyAI`}
                description={author.bio || `Read articles written by ${author.name} on the BotifyAI Blog.`}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
                {/* Author Bio Header Card (E-E-A-T) */}
                <div className="space-y-4 border-b border-neutral-200 dark:border-neutral-800 pb-10">
                    <Link
                        href={route('blog.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to All Articles
                    </Link>

                    <div className="p-8 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-600 text-white flex items-center justify-center font-bold text-3xl shrink-0 shadow-md">
                            {author.avatar_url ? (
                                <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" />
                            ) : (
                                author.name.charAt(0)
                            )}
                        </div>

                        <div className="space-y-2 flex-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400">
                                Verified Contributor
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                                {author.name}
                            </h1>
                            <p className="text-xs font-bold text-brand-600 dark:text-brand-400">
                                {author.title_role || 'Automation & SEO Specialist'}
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                                {author.bio || 'Author bio and background in AI customer engagement, marketing automation, and digital commerce.'}
                            </p>

                            {/* Social Links */}
                            {author.social_links && Object.keys(author.social_links).length > 0 && (
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-neutral-500">
                                    {author.social_links.twitter && (
                                        <a href={author.social_links.twitter} target="_blank" rel="noreferrer" className="hover:text-brand-600 transition">
                                            Twitter / X
                                        </a>
                                    )}
                                    {author.social_links.linkedin && (
                                        <a href={author.social_links.linkedin} target="_blank" rel="noreferrer" className="hover:text-brand-600 transition">
                                            LinkedIn
                                        </a>
                                    )}
                                    {author.social_links.website && (
                                        <a href={author.social_links.website} target="_blank" rel="noreferrer" className="hover:text-brand-600 transition">
                                            Website
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Articles Written by Author */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        Articles by {author.name} ({posts.total || posts.data.length})
                    </h2>

                    {posts.data.length === 0 ? (
                        <div className="p-12 text-center text-neutral-400 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            No articles published by this author yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.data.map((post) => (
                                <article
                                    key={post.id}
                                    className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition"
                                >
                                    <div>
                                        <Link href={route('blog.show', post.slug)} className="block aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                            {post.featured_image ? (
                                                <img
                                                    src={post.featured_image}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                    <BookOpen className="h-8 w-8 opacity-40" />
                                                </div>
                                            )}
                                        </Link>
                                        <div className="p-5 space-y-2">
                                            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                                                <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recent'}</span>
                                                <span>&bull;</span>
                                                <span>{post.reading_time_minutes}m read</span>
                                            </div>
                                            <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition line-clamp-2">
                                                <Link href={route('blog.show', post.slug)}>
                                                    {post.title}
                                                </Link>
                                            </h3>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                {post.excerpt}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/60 text-xs">
                                        <span className="text-[11px] text-brand-600 font-semibold">{post.category?.name}</span>
                                        <Link href={route('blog.show', post.slug)} className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1">
                                            Read <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </LandingLayout>
    );
}

