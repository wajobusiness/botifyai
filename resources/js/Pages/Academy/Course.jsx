import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import {
    GraduationCap,
    Play,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    Sparkles,
    BookOpen,
    Video,
    Award,
    Check,
} from 'lucide-react';

export default function CourseCurriculum({ course = {} }) {
    const [openModules, setOpenModules] = useState(
        course.modules?.reduce((acc, mod) => ({ ...acc, [mod.id]: true }), {}) || {}
    );

    const toggleModule = (modId) => {
        setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
    };

    const targetLessonSlug = course.first_lesson_slug || (course.modules?.[0]?.lessons?.[0]?.slug) || (course.standalone_lessons?.[0]?.slug);

    return (
        <ClientLayout title={course.title || 'Course Overview'}>
            <Head title={`${course.title} - Botify Academy`} />

            <div className="space-y-8 pb-16 max-w-5xl mx-auto">
                {/* Back Link */}
                <div>
                    <Link
                        href={route('client.academy.index')}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-500 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-400 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Academy Dashboard
                    </Link>
                </div>

                {/* Course Header Banner */}
                <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                        {/* Left Details */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {course.badge_text && (
                                    <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
                                        {course.badge_text}
                                    </span>
                                )}
                                {course.category && (
                                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold">
                                        {course.category.name}
                                    </span>
                                )}
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold capitalize">
                                    {course.difficulty_level || 'Beginner'}
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                                {course.title}
                            </h1>

                            {course.headline && (
                                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 font-medium">
                                    {course.headline}
                                </p>
                            )}

                            {/* Meta Metrics */}
                            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 pt-1">
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-purple-500" />
                                    {course.total_lessons} Lessons
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-purple-500" />
                                    {course.total_duration_minutes} Mins Total
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <Sparkles className="w-4 h-4" />
                                    100% Free
                                </span>
                            </div>

                            {/* Progress bar if user has progress */}
                            {course.progress_percentage > 0 && (
                                <div className="pt-2 max-w-md space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        <span>Your Progress</span>
                                        <span>{Math.round(course.progress_percentage)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                                            style={{ width: `${course.progress_percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action CTA */}
                            <div className="pt-3">
                                {targetLessonSlug ? (
                                    <Link
                                        href={route('client.academy.lessons.show', {
                                            courseSlug: course.slug,
                                            lessonSlug: targetLessonSlug,
                                        })}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
                                    >
                                        <Play className="w-4 h-4 fill-white" />
                                        {course.progress_percentage > 0 ? 'Continue Lesson' : 'Start Learning Free'}
                                    </Link>
                                ) : (
                                    <span className="text-xs text-neutral-400 italic">
                                        Lessons are being added to this masterclass. Check back soon!
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right Thumbnail Preview */}
                        <div className="lg:col-span-1">
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-md">
                                {course.thumbnail_url ? (
                                    <img
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-4 text-center">
                                        <GraduationCap className="w-12 h-12 text-purple-300 mb-2" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                                            Botify Masterclass
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Description & Content */}
                {course.description && (
                    <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">
                            About This Masterclass
                        </h2>
                        <div
                            className="prose dark:prose-invert max-w-none text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line"
                            dangerouslySetInnerHTML={{ __html: course.description }}
                        />
                    </div>
                )}

                {/* Course Curriculum Breakdown */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                            Course Curriculum
                        </h2>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                            {course.total_lessons} Lessons total
                        </span>
                    </div>

                    {/* Modules Accordion */}
                    {course.modules && course.modules.length > 0 ? (
                        <div className="space-y-3">
                            {course.modules.map((mod, index) => {
                                const isOpen = openModules[mod.id] ?? true;
                                const completedCount = mod.lessons?.filter((l) => l.is_completed).length || 0;
                                const totalCount = mod.lessons?.length || 0;

                                return (
                                    <div
                                        key={mod.id}
                                        className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleModule(mod.id)}
                                            className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-800 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                                                    0{index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                                                        {mod.title}
                                                    </h3>
                                                    {mod.description && (
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                                                            {mod.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                                    {completedCount}/{totalCount} completed
                                                </span>
                                                {isOpen ? (
                                                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                                                )}
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                                                {mod.lessons?.map((lesson, lIndex) => (
                                                    <Link
                                                        key={lesson.id}
                                                        href={route('client.academy.lessons.show', {
                                                            courseSlug: course.slug,
                                                            lessonSlug: lesson.slug,
                                                        })}
                                                        className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {lesson.is_completed ? (
                                                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center shrink-0 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 group-hover:text-purple-600">
                                                                    <Play className="w-3 h-3 fill-current ml-0.5" />
                                                                </div>
                                                            )}
                                                            <span className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                                                                {lesson.title}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {lesson.duration_seconds && (
                                                                <span className="text-xs text-neutral-400 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {Math.round(lesson.duration_seconds / 60)} min
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}

                    {/* Standalone Lessons (lessons outside of any module) */}
                    {course.standalone_lessons && course.standalone_lessons.length > 0 && (
                        <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm divide-y divide-neutral-100 dark:divide-neutral-800/80">
                            {course.standalone_lessons.map((lesson) => (
                                <Link
                                    key={lesson.id}
                                    href={route('client.academy.lessons.show', {
                                        courseSlug: course.slug,
                                        lessonSlug: lesson.slug,
                                    })}
                                    className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        {lesson.is_completed ? (
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center shrink-0 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 group-hover:text-purple-600">
                                                <Play className="w-3 h-3 fill-current ml-0.5" />
                                            </div>
                                        )}
                                        <span className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                                            {lesson.title}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {lesson.duration_seconds && (
                                            <span className="text-xs text-neutral-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {Math.round(lesson.duration_seconds / 60)} min
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ClientLayout>
    );
}
