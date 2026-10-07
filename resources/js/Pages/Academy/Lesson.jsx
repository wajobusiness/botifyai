import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import {
    Play,
    CheckCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    BookOpen,
    FileText,
    Download,
    ExternalLink,
    List,
    Clock,
    Sparkles,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LessonPlayer({
    course = {},
    lesson = {},
    prevLesson = null,
    nextLesson = null,
}) {
    const [isCompleted, setIsCompleted] = useState(Boolean(lesson.is_completed));
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('notes');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleToggleComplete = () => {
        setSubmitting(true);
        router.post(
            route('client.academy.lessons.complete', lesson.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCompleted(true);
                    toast.success('Lesson marked as completed! 🎉');
                    setSubmitting(false);
                },
                onError: () => {
                    toast.error('Unable to update progress.');
                    setSubmitting(false);
                },
            }
        );
    };

    return (
        <ClientLayout title={`${lesson.title} - ${course.title}`}>
            <Head title={`${lesson.title} - Botify Academy`} />

            <div className="space-y-6 pb-16">
                {/* Navigation Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link
                            href={route('client.academy.courses.show', course.slug)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to {course.title}
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                            {lesson.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {prevLesson && (
                            <Link
                                href={route('client.academy.lessons.show', {
                                    courseSlug: course.slug,
                                    lessonSlug: prevLesson.slug,
                                })}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Link>
                        )}

                        <button
                            onClick={handleToggleComplete}
                            disabled={submitting}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition shadow-sm ${
                                isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                        >
                            {isCompleted ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Completed
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Mark as Completed
                                </>
                            )}
                        </button>

                        {nextLesson && (
                            <Link
                                href={route('client.academy.lessons.show', {
                                    courseSlug: course.slug,
                                    lessonSlug: nextLesson.slug,
                                })}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                            >
                                Next Lesson
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Main Player & Curriculum Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left 8 Cols: Video Player & Notes */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Video Player Container */}
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-neutral-800">
                            {lesson.youtube_video_id ? (
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${lesson.youtube_video_id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                                    title={lesson.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="w-full h-full border-0"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-neutral-900 to-black text-white">
                                    <Play className="w-12 h-12 text-purple-400 mb-3 opacity-60" />
                                    <h3 className="text-base font-bold text-neutral-200">
                                        Video is currently processing
                                    </h3>
                                    <p className="text-xs text-neutral-400 max-w-sm mt-1">
                                        The video for this lesson will be ready shortly. You can review the lesson notes and resources below in the meantime.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Lesson Tabs (Notes, Resources) */}
                        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
                            <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-5">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('notes')}
                                    className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-bold transition border-b-2 -mb-[13px] ${
                                        activeTab === 'notes'
                                            ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                                    }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    Lesson Notes & Summary
                                </button>
                                {lesson.resources && lesson.resources.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('resources')}
                                        className={`flex items-center gap-2 pb-2 text-xs sm:text-sm font-bold transition border-b-2 -mb-[13px] ${
                                            activeTab === 'resources'
                                                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                                        }`}
                                    >
                                        <Download className="w-4 h-4" />
                                        Downloads & Resources ({lesson.resources.length})
                                    </button>
                                )}
                            </div>

                            {/* Tab 1: Notes Content */}
                            {activeTab === 'notes' && (
                                <div className="space-y-4">
                                    {lesson.description && (
                                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            {lesson.description}
                                        </p>
                                    )}

                                    {lesson.lesson_notes ? (
                                        <div
                                            className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line"
                                            dangerouslySetInnerHTML={{ __html: lesson.lesson_notes }}
                                        />
                                    ) : (
                                        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400">
                                            Follow along with the video above. Check off the lesson when you've practiced the steps in your BotifyAI workspace.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 2: Resources Content */}
                            {activeTab === 'resources' && (
                                <div className="space-y-3">
                                    {lesson.resources?.map((res, i) => (
                                        <a
                                            key={i}
                                            href={res.url || '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-200 transition group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                                        {res.title || res.name || 'Downloadable Resource'}
                                                    </h4>
                                                    {res.description && (
                                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                            {res.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-purple-600" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right 4 Cols: Course Curriculum Drawer */}
                    <div className="lg:col-span-4">
                        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden sticky top-6">
                            <div className="p-4 bg-neutral-50/70 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <List className="w-4 h-4 text-purple-600" />
                                    Course Curriculum
                                </h3>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/80 p-2">
                                {/* Modules List */}
                                {course.modules?.map((mod) => (
                                    <div key={mod.id} className="py-2">
                                        <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                            {mod.title}
                                        </p>
                                        <div className="space-y-1 mt-1">
                                            {mod.lessons?.map((l) => {
                                                const isActive = l.id === lesson.id;
                                                return (
                                                    <Link
                                                        key={l.id}
                                                        href={route('client.academy.lessons.show', {
                                                            courseSlug: course.slug,
                                                            lessonSlug: l.slug,
                                                        })}
                                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition ${
                                                            isActive
                                                                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                                                                : 'text-neutral-700 dark:text-neutral-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 truncate mr-2">
                                                            {l.is_completed ? (
                                                                <div
                                                                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                                                        isActive
                                                                            ? 'bg-white/20 text-white'
                                                                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                                                    }`}
                                                                >
                                                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                                </div>
                                                            ) : (
                                                                <Play
                                                                    className={`w-3.5 h-3.5 shrink-0 ${
                                                                        isActive
                                                                            ? 'fill-white text-white'
                                                                            : 'text-neutral-400'
                                                                    }`}
                                                                />
                                                            )}
                                                            <span className="truncate">{l.title}</span>
                                                        </div>

                                                        {l.duration_seconds && (
                                                            <span
                                                                className={`text-[10px] shrink-0 ${
                                                                    isActive
                                                                        ? 'text-purple-100'
                                                                        : 'text-neutral-400'
                                                                }`}
                                                            >
                                                                {Math.round(l.duration_seconds / 60)}m
                                                            </span>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Standalone Lessons */}
                                {course.standalone_lessons?.map((l) => {
                                    const isActive = l.id === lesson.id;
                                    return (
                                        <Link
                                            key={l.id}
                                            href={route('client.academy.lessons.show', {
                                                courseSlug: course.slug,
                                                lessonSlug: l.slug,
                                            })}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition ${
                                                isActive
                                                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 truncate mr-2">
                                                {l.is_completed ? (
                                                    <div
                                                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                                            isActive
                                                                ? 'bg-white/20 text-white'
                                                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                    </div>
                                                ) : (
                                                    <Play
                                                        className={`w-3.5 h-3.5 shrink-0 ${
                                                            isActive
                                                                ? 'fill-white text-white'
                                                                : 'text-neutral-400'
                                                        }`}
                                                    />
                                                )}
                                                <span className="truncate">{l.title}</span>
                                            </div>

                                            {l.duration_seconds && (
                                                <span
                                                    className={`text-[10px] shrink-0 ${
                                                        isActive ? 'text-purple-100' : 'text-neutral-400'
                                                    }`}
                                                >
                                                    {Math.round(l.duration_seconds / 60)}m
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
