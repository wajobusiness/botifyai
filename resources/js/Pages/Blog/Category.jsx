import React from 'react';
import { Head, Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import { Folder, Clock, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

export default function BlogCategoryPage({
    category,
    posts,
}) {
    return (
        <LandingLayout>
            <SeoHead
                title={`${category.name} Articles & Tutorials — BotifyAI Blog`}
                description={category.description || `Browse in-depth guides and articles about ${category.name} on the BotifyAI Blog.`}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
                {/* Breadcrumb & Header */}
                <div className="space-y-4 border-b border-neutral-200 dark:border-neutral-800 pb-8">
                    <Link
                        href={route('blog.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to All Articles
                    </Link>

                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                            <Folder className="h-3.5 w-3.5" /> Topic Category
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
                            {category.name}
                        </h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed">
                            {category.description || `Explore our comprehensive tutorials, case studies, and guides on ${category.name}.`}
                        </p>
                    </div>
                </div>

                {/* Posts Grid */}
                {posts.data.length === 0 ? (
                    <div className="p-12 text-center text-neutral-400 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        No articles published in this category yet.
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
                                    <span className="text-[11px] text-neutral-500">{post.author?.name || 'BotifyAI'}</span>
                                    <Link href={route('blog.show', post.slug)} className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1">
                                        Read <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </LandingLayout>
    );
}

