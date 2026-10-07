import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import {
    GraduationCap,
    Play,
    BookOpen,
    CheckCircle,
    Clock,
    Search,
    Sparkles,
    ArrowRight,
    Flame,
    Trophy,
    Video,
    BarChart3,
} from 'lucide-react';

export default function AcademyIndex({
    categories = [],
    courses = [],
    continueLearning = null,
    userStats = { enrolled_count: 0, completed_count: 0, completed_lessons_count: 0 },
    filters = { category: '', search: '' },
}) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [activeCategory, setActiveCategory] = useState(filters.category || '');

    const handleFilterChange = (catSlug, searchVal = searchTerm) => {
        setActiveCategory(catSlug);
        router.get(
            route('client.academy.index'),
            { category: catSlug || undefined, search: searchVal || undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilterChange(activeCategory, searchTerm);
    };

    return (
        <ClientLayout title="Botify Academy">
            <Head title="Botify Academy - Free Video Tutorials & Masterclasses" />

            <div className="space-y-8 pb-12">
                {/* Hero Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-6 sm:p-10 text-white shadow-xl">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase mb-4 text-purple-100 border border-white/10">
                            <Sparkles className="w-3.5 h-3.5" />
                            100% Free Video Masterclasses
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Master BotifyAI & Scale Your Business
                        </h1>
                        <p className="mt-3 text-sm sm:text-base text-purple-100 max-w-xl leading-relaxed">
                            Watch step-by-step video tutorials on building intelligent chatbots, automating social media workflows, selling digital products, and scaling customer support.
                        </p>

                        {/* Search Bar inside Hero */}
                        <form onSubmit={handleSearchSubmit} className="mt-6 flex max-w-md items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search tutorials, courses, topics..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-md"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-xl bg-white text-purple-800 font-semibold text-sm hover:bg-purple-50 transition shadow-md"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden lg:flex items-center justify-center">
                        <GraduationCap className="w-64 h-64 text-white" />
                    </div>
                </div>

                {/* Stats & Continue Learning Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Learning Stats */}
                    <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between shadow-sm">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    Your Learning Progress
                                </h2>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                                    Free Access
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center my-4">
                                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
                                    <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
                                        {userStats.enrolled_count}
                                    </p>
                                    <p className="text-[11px] font-medium text-purple-800 dark:text-purple-300 mt-0.5">
                                        Enrolled
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
                                        {userStats.completed_lessons_count}
                                    </p>
                                    <p className="text-[11px] font-medium text-blue-800 dark:text-blue-300 mt-0.5">
                                        Lessons Done
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                                        {userStats.completed_count}
                                    </p>
                                    <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mt-0.5">
                                        Completed
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                            Keep watching tutorials to level up your automation skills!
                        </p>
                    </div>

                    {/* Continue Learning Card */}
                    <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white p-6 shadow-sm flex flex-col justify-between border border-neutral-700/50">
                        {continueLearning ? (
                            <>
                                <div>
                                    <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                                        <Flame className="w-4 h-4 text-purple-400 animate-pulse" />
                                        Resume Where You Left Off
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">
                                        {continueLearning.course_title}
                                    </h3>
                                    <p className="text-sm text-neutral-300 line-clamp-1 mb-4">
                                        Next Lesson: {continueLearning.lesson_title}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5 mb-5">
                                        <div className="flex justify-between text-xs text-neutral-400">
                                            <span>Course Progress</span>
                                            <span className="font-semibold text-purple-300">
                                                {Math.round(continueLearning.progress_percentage)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-neutral-700 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                                style={{ width: `${continueLearning.progress_percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <Link
                                        href={route('client.academy.lessons.show', {
                                            courseSlug: continueLearning.course_slug,
                                            lessonSlug: continueLearning.lesson_slug,
                                        })}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-900/30"
                                    >
                                        <Play className="w-4 h-4 fill-white" />
                                        Continue Watching
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col justify-center items-start">
                                <div className="inline-flex p-3 rounded-xl bg-neutral-800 text-purple-400 mb-3">
                                    <Video className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">
                                    Ready to start learning?
                                </h3>
                                <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mb-4 leading-relaxed">
                                    Explore our high-definition masterclasses below. Pick any topic to start mastering chatbots, ecommerce automation, and marketing funnels.
                                </p>
                                {courses.length > 0 && (
                                    <Link
                                        href={route('client.academy.courses.show', courses[0].slug)}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs sm:text-sm transition"
                                    >
                                        Browse Featured Course <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => handleFilterChange('')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
                            activeCategory === ''
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        }`}
                    >
                        All Categories ({courses.length})
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleFilterChange(cat.slug)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
                                activeCategory === cat.slug
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Course Cards Grid */}
                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700/60 transition-all duration-300"
                            >
                                {/* Thumbnail Header */}
                                <div className="relative aspect-video w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                    {course.thumbnail_url ? (
                                        <img
                                            src={course.thumbnail_url}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-neutral-900 text-white p-4 text-center">
                                            <GraduationCap className="w-10 h-10 text-purple-300 mb-2 opacity-80" />
                                            <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                                                Botify Academy Masterclass
                                            </span>
                                        </div>
                                    )}

                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                        {course.badge_text && (
                                            <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider border border-white/20">
                                                {course.badge_text}
                                            </span>
                                        )}
                                        {course.category && (
                                            <span className="px-2.5 py-1 rounded-lg bg-purple-600/80 backdrop-blur-md text-[11px] font-semibold text-white">
                                                {course.category.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute bottom-3 right-3">
                                        <span className="px-2 py-1 rounded-md bg-black/75 backdrop-blur-sm text-[11px] font-medium text-white flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {course.total_duration_minutes} mins
                                        </span>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-xs text-neutral-500 dark:text-neutral-400">
                                            <span className="capitalize font-medium text-purple-600 dark:text-purple-400">
                                                {course.difficulty_level || 'Beginner'}
                                            </span>
                                            <span>•</span>
                                            <span>{course.total_lessons} Lessons</span>
                                        </div>

                                        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>

                                        {course.headline && (
                                            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                                {course.headline}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
                                        {course.progress_percentage > 0 && (
                                            <div className="mb-3 space-y-1">
                                                <div className="flex justify-between text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                                    <span>Progress</span>
                                                    <span>{Math.round(course.progress_percentage)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-600 rounded-full"
                                                        style={{ width: `${course.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <Link
                                            href={route('client.academy.courses.show', course.slug)}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white font-semibold text-xs sm:text-sm transition-all duration-200"
                                        >
                                            {course.progress_percentage > 0 ? (
                                                <>
                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                    Continue Course
                                                </>
                                            ) : (
                                                <>
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    View Curriculum
                                                </>
                                            )}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-12 text-center">
                        <div className="w-14 h-14 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                            <GraduationCap className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            No tutorials found
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                            We couldn't find any courses matching your criteria. Try adjusting your search query or category filter.
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                handleFilterChange('');
                            }}
                            className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}
