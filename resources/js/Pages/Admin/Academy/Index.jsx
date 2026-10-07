import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    GraduationCap,
    BookOpen,
    Video,
    Users,
    CheckCircle2,
    Plus,
    Edit2,
    Trash2,
    ExternalLink,
    ChevronDown,
    ChevronRight,
    Layers,
    Clock,
    Sparkles,
    Search,
    Youtube,
    FolderPlus,
    Folder,
    FilePlus,
    Check,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAcademyIndex({
    stats = {
        total_courses: 0,
        published_courses: 0,
        total_lessons: 0,
        total_enrollments: 0,
        total_completions: 0,
    },
    categories = [],
    courses = [],
    enrollments = { data: [] },
}) {
    const [activeTab, setActiveTab] = useState('courses'); // 'courses', 'categories', 'enrollments'
    const [expandedCourses, setExpandedCourses] = useState({});

    // Modal States
    const [courseModal, setCourseModal] = useState({ open: false, mode: 'create', data: null });
    const [moduleModal, setModuleModal] = useState({ open: false, mode: 'create', courseId: null, data: null });
    const [lessonModal, setLessonModal] = useState({ open: false, mode: 'create', courseId: null, moduleId: null, data: null });
    const [categoryModal, setCategoryModal] = useState({ open: false, mode: 'create', data: null });

    const toggleExpandCourse = (courseId) => {
        setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    // ─── Course Form ────────────────────────────────────────────────────────
    const courseForm = useForm({
        category_id: '',
        title: '',
        slug: '',
        headline: '',
        description: '',
        thumbnail_url: '',
        badge_text: 'Free Masterclass',
        difficulty_level: 'beginner',
        is_published: true,
        is_featured: false,
        order: 0,
    });

    const openCreateCourse = () => {
        courseForm.reset();
        courseForm.setData({
            category_id: categories[0]?.id || '',
            title: '',
            slug: '',
            headline: '',
            description: '',
            thumbnail_url: '',
            badge_text: 'Free Masterclass',
            difficulty_level: 'beginner',
            is_published: true,
            is_featured: false,
            order: courses.length,
        });
        setCourseModal({ open: true, mode: 'create', data: null });
    };

    const openEditCourse = (course) => {
        courseForm.setData({
            category_id: course.category_id || '',
            title: course.title || '',
            slug: course.slug || '',
            headline: course.headline || '',
            description: course.description || '',
            thumbnail_url: course.thumbnail_url || '',
            badge_text: course.badge_text || '',
            difficulty_level: course.difficulty_level || 'beginner',
            is_published: Boolean(course.is_published),
            is_featured: Boolean(course.is_featured),
            order: course.order || 0,
        });
        setCourseModal({ open: true, mode: 'edit', data: course });
    };

    const handleCourseSubmit = (e) => {
        e.preventDefault();
        if (courseModal.mode === 'create') {
            courseForm.post(route('admin.academy.courses.store'), {
                onSuccess: () => {
                    toast.success('Course created successfully');
                    setCourseModal({ open: false, mode: 'create', data: null });
                },
                onError: () => toast.error('Please check the course form inputs'),
            });
        } else {
            courseForm.put(route('admin.academy.courses.update', courseModal.data.id), {
                onSuccess: () => {
                    toast.success('Course updated successfully');
                    setCourseModal({ open: false, mode: 'create', data: null });
                },
                onError: () => toast.error('Please check the course form inputs'),
            });
        }
    };

    const handleDeleteCourse = (course) => {
        if (!confirm(`Are you sure you want to delete "${course.title}"? All associated modules and lessons will also be deleted.`)) return;
        router.delete(route('admin.academy.courses.destroy', course.id), {
            onSuccess: () => toast.success('Course deleted'),
        });
    };

    // ─── Module Form ────────────────────────────────────────────────────────
    const moduleForm = useForm({
        course_id: '',
        title: '',
        slug: '',
        description: '',
        order: 0,
        is_published: true,
    });

    const openCreateModule = (courseId) => {
        moduleForm.reset();
        moduleForm.setData({
            course_id: courseId,
            title: '',
            slug: '',
            description: '',
            order: 0,
            is_published: true,
        });
        setModuleModal({ open: true, mode: 'create', courseId, data: null });
    };

    const openEditModule = (module) => {
        moduleForm.setData({
            course_id: module.course_id,
            title: module.title || '',
            slug: module.slug || '',
            description: module.description || '',
            order: module.order || 0,
            is_published: Boolean(module.is_published),
        });
        setModuleModal({ open: true, mode: 'edit', courseId: module.course_id, data: module });
    };

    const handleModuleSubmit = (e) => {
        e.preventDefault();
        if (moduleModal.mode === 'create') {
            moduleForm.post(route('admin.academy.modules.store'), {
                onSuccess: () => {
                    toast.success('Module created successfully');
                    setModuleModal({ open: false, mode: 'create', courseId: null, data: null });
                },
                onError: () => toast.error('Please check the module form inputs'),
            });
        } else {
            moduleForm.put(route('admin.academy.modules.update', moduleModal.data.id), {
                onSuccess: () => {
                    toast.success('Module updated successfully');
                    setModuleModal({ open: false, mode: 'create', courseId: null, data: null });
                },
                onError: () => toast.error('Please check the module form inputs'),
            });
        }
    };

    const handleDeleteModule = (module) => {
        if (!confirm(`Are you sure you want to delete module "${module.title}"?`)) return;
        router.delete(route('admin.academy.modules.destroy', module.id), {
            onSuccess: () => toast.success('Module deleted'),
        });
    };

    // ─── Lesson Form ────────────────────────────────────────────────────────
    const lessonForm = useForm({
        course_id: '',
        module_id: '',
        title: '',
        slug: '',
        youtube_video_url: '',
        duration_seconds: 600,
        description: '',
        lesson_notes: '',
        order: 0,
        is_published: true,
    });

    const openCreateLesson = (courseId, moduleId = '') => {
        lessonForm.reset();
        lessonForm.setData({
            course_id: courseId,
            module_id: moduleId || '',
            title: '',
            slug: '',
            youtube_video_url: '',
            duration_seconds: 600,
            description: '',
            lesson_notes: '',
            order: 0,
            is_published: true,
        });
        setLessonModal({ open: true, mode: 'create', courseId, moduleId, data: null });
    };

    const openEditLesson = (lesson) => {
        lessonForm.setData({
            course_id: lesson.course_id,
            module_id: lesson.module_id || '',
            title: lesson.title || '',
            slug: lesson.slug || '',
            youtube_video_url: lesson.youtube_video_url || '',
            duration_seconds: lesson.duration_seconds || 600,
            description: lesson.description || '',
            lesson_notes: lesson.lesson_notes || '',
            order: lesson.order || 0,
            is_published: Boolean(lesson.is_published),
        });
        setLessonModal({ open: true, mode: 'edit', courseId: lesson.course_id, moduleId: lesson.module_id, data: lesson });
    };

    const handleLessonSubmit = (e) => {
        e.preventDefault();
        if (lessonModal.mode === 'create') {
            lessonForm.post(route('admin.academy.lessons.store'), {
                onSuccess: () => {
                    toast.success('Lesson added successfully');
                    setLessonModal({ open: false, mode: 'create', courseId: null, moduleId: null, data: null });
                },
                onError: () => toast.error('Please check the lesson form inputs'),
            });
        } else {
            lessonForm.put(route('admin.academy.lessons.update', lessonModal.data.id), {
                onSuccess: () => {
                    toast.success('Lesson updated successfully');
                    setLessonModal({ open: false, mode: 'create', courseId: null, moduleId: null, data: null });
                },
                onError: () => toast.error('Please check the lesson form inputs'),
            });
        }
    };

    const handleDeleteLesson = (lesson) => {
        if (!confirm(`Are you sure you want to delete lesson "${lesson.title}"?`)) return;
        router.delete(route('admin.academy.lessons.destroy', lesson.id), {
            onSuccess: () => toast.success('Lesson deleted'),
        });
    };

    // ─── Category Form ──────────────────────────────────────────────────────
    const categoryForm = useForm({
        name: '',
        slug: '',
        description: '',
        icon: '',
        order: 0,
        is_active: true,
    });

    const openCreateCategory = () => {
        categoryForm.reset();
        categoryForm.setData({
            name: '',
            slug: '',
            description: '',
            icon: '',
            order: categories.length,
            is_active: true,
        });
        setCategoryModal({ open: true, mode: 'create', data: null });
    };

    const openEditCategory = (cat) => {
        categoryForm.setData({
            name: cat.name || '',
            slug: cat.slug || '',
            description: cat.description || '',
            icon: cat.icon || '',
            order: cat.order || 0,
            is_active: Boolean(cat.is_active),
        });
        setCategoryModal({ open: true, mode: 'edit', data: cat });
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        if (categoryModal.mode === 'create') {
            categoryForm.post(route('admin.academy.categories.store'), {
                onSuccess: () => {
                    toast.success('Category created');
                    setCategoryModal({ open: false, mode: 'create', data: null });
                },
                onError: () => toast.error('Failed to create category'),
            });
        } else {
            categoryForm.put(route('admin.academy.categories.update', categoryModal.data.id), {
                onSuccess: () => {
                    toast.success('Category updated');
                    setCategoryModal({ open: false, mode: 'create', data: null });
                },
                onError: () => toast.error('Failed to update category'),
            });
        }
    };

    const handleDeleteCategory = (cat) => {
        if (!confirm(`Delete category "${cat.name}"?`)) return;
        router.delete(route('admin.academy.categories.destroy', cat.id), {
            onSuccess: () => toast.success('Category deleted'),
        });
    };

    return (
        <AdminLayout title="Botify Academy Administration">
            <Head title="Botify Academy - Admin Command Center" />

            <div className="space-y-8 pb-16">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            Botify Academy Manager
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Create, organize, and manage video tutorials and structured learning masterclasses for your users.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href={route('client.academy.index')}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 text-xs font-bold transition shadow-sm"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Academy Frontend
                        </a>
                        <button
                            onClick={openCreateCourse}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Course
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Courses</p>
                        <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{stats.total_courses}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Published</p>
                        <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{stats.published_courses}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Lessons</p>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.total_lessons}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Enrollments</p>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.total_enrollments}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Completions</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.total_completions}</p>
                    </div>
                </div>

                {/* Tabs Header */}
                <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                            activeTab === 'courses'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Courses & Curriculum ({courses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                            activeTab === 'categories'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                    >
                        <Folder className="w-4 h-4" />
                        Categories ({categories.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('enrollments')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                            activeTab === 'enrollments'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Student Enrollments ({stats.total_enrollments})
                    </button>
                </div>

                {/* Tab 1: Courses Management */}
                {activeTab === 'courses' && (
                    <div className="space-y-4">
                        {courses.length > 0 ? (
                            courses.map((course) => {
                                const isExpanded = Boolean(expandedCourses[course.id]);
                                return (
                                    <div
                                        key={course.id}
                                        className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden"
                                    >
                                        {/* Course Header Bar */}
                                        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-800/40">
                                            <div className="flex items-start gap-4">
                                                <button
                                                    onClick={() => toggleExpandCourse(course.id)}
                                                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-600 transition shrink-0 mt-0.5"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                </button>

                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                                                            {course.title}
                                                        </h3>
                                                        {course.badge_text && (
                                                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wide">
                                                                {course.badge_text}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                                                course.is_published
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                                            }`}
                                                        >
                                                            {course.is_published ? 'Published' : 'Draft'}
                                                        </span>
                                                        {course.is_featured && (
                                                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold">
                                                                Featured
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        Category: <strong className="text-neutral-700 dark:text-neutral-300">{course.category_name || 'Uncategorized'}</strong> •
                                                        Level: <span className="capitalize">{course.difficulty_level}</span> •
                                                        Lessons: <strong>{course.lessons_count}</strong> •
                                                        Enrollments: <strong>{course.enrollments_count}</strong>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                                                <button
                                                    onClick={() => openCreateModule(course.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-neutral-700 dark:text-neutral-300 hover:text-purple-600 text-xs font-semibold transition"
                                                >
                                                    <FolderPlus className="w-3.5 h-3.5" />
                                                    Add Module
                                                </button>
                                                <button
                                                    onClick={() => openCreateLesson(course.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-neutral-700 dark:text-neutral-300 hover:text-purple-600 text-xs font-semibold transition"
                                                >
                                                    <FilePlus className="w-3.5 h-3.5" />
                                                    Add Lesson
                                                </button>
                                                <button
                                                    onClick={() => openEditCourse(course)}
                                                    className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-purple-600 transition"
                                                    title="Edit Course"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCourse(course)}
                                                    className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-red-600 transition"
                                                    title="Delete Course"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Curriculum Tree */}
                                        {isExpanded && (
                                            <div className="p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                                                {/* Modules */}
                                                {course.modules?.map((mod) => {
                                                    const moduleLessons = course.lessons?.filter((l) => l.module_id === mod.id) || [];
                                                    return (
                                                        <div
                                                            key={mod.id}
                                                            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-4 space-y-3"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Folder className="w-4 h-4 text-purple-600" />
                                                                    <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                                                        Module: {mod.title}
                                                                    </h4>
                                                                    <span className="text-[10px] text-neutral-400">
                                                                        ({moduleLessons.length} lessons)
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => openCreateLesson(course.id, mod.id)}
                                                                        className="text-xs text-purple-600 hover:underline font-semibold flex items-center gap-1 mr-2"
                                                                    >
                                                                        <Plus className="w-3 h-3" /> Add Lesson
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openEditModule(mod)}
                                                                        className="p-1 text-neutral-400 hover:text-purple-600"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteModule(mod)}
                                                                        className="p-1 text-neutral-400 hover:text-red-600"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Module Lessons */}
                                                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 pl-4 space-y-1">
                                                                {moduleLessons.map((l) => (
                                                                    <div
                                                                        key={l.id}
                                                                        className="py-2 flex items-center justify-between"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Video className="w-3.5 h-3.5 text-blue-500" />
                                                                            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                                                                {l.title}
                                                                            </span>
                                                                            {l.youtube_video_id ? (
                                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold flex items-center gap-1">
                                                                                    <Youtube className="w-3 h-3" /> YouTube ID: {l.youtube_video_id}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[10px] text-amber-500 italic">No video</span>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[11px] text-neutral-400">
                                                                                {Math.round((l.duration_seconds || 0) / 60)} mins
                                                                            </span>
                                                                            <button
                                                                                onClick={() => openEditLesson(l)}
                                                                                className="p-1 text-neutral-400 hover:text-purple-600"
                                                                            >
                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteLesson(l)}
                                                                                className="p-1 text-neutral-400 hover:text-red-600"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Standalone Lessons */}
                                                {course.lessons?.filter((l) => !l.module_id).length > 0 && (
                                                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-4 space-y-2">
                                                        <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-2">
                                                            Standalone Lessons (No Module)
                                                        </h4>
                                                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                            {course.lessons?.filter((l) => !l.module_id).map((l) => (
                                                                <div
                                                                    key={l.id}
                                                                    className="py-2 flex items-center justify-between"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Video className="w-3.5 h-3.5 text-blue-500" />
                                                                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                                                            {l.title}
                                                                        </span>
                                                                        {l.youtube_video_id && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold flex items-center gap-1">
                                                                                <Youtube className="w-3 h-3" /> {l.youtube_video_id}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => openEditLesson(l)}
                                                                            className="p-1 text-neutral-400 hover:text-purple-600"
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteLesson(l)}
                                                                            className="p-1 text-neutral-400 hover:text-red-600"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800">
                                <GraduationCap className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">No Courses Created Yet</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                                    Click "Add New Course" above or run the Academy database seeder to populate default courses.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Categories Management */}
                {activeTab === 'categories' && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button
                                onClick={openCreateCategory}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Category
                            </button>
                        </div>

                        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="p-4 font-bold">Category Name</th>
                                        <th className="p-4 font-bold">Slug</th>
                                        <th className="p-4 font-bold">Description</th>
                                        <th className="p-4 font-bold">Courses</th>
                                        <th className="p-4 font-bold">Status</th>
                                        <th className="p-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {categories.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                                            <td className="p-4 font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                <Folder className="w-4 h-4 text-purple-600" />
                                                {cat.name}
                                            </td>
                                            <td className="p-4 text-neutral-500 font-mono">{cat.slug}</td>
                                            <td className="p-4 text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                                                {cat.description || '-'}
                                            </td>
                                            <td className="p-4 font-semibold text-neutral-800 dark:text-neutral-200">
                                                {cat.courses_count || 0}
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        cat.is_active
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                            : 'bg-neutral-200 text-neutral-600'
                                                    }`}
                                                >
                                                    {cat.is_active ? 'Active' : 'Hidden'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditCategory(cat)}
                                                        className="p-1 text-neutral-400 hover:text-purple-600"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat)}
                                                        className="p-1 text-neutral-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 3: Student Enrollments */}
                {activeTab === 'enrollments' && (
                    <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="p-4 font-bold">Student</th>
                                    <th className="p-4 font-bold">Course</th>
                                    <th className="p-4 font-bold">Progress</th>
                                    <th className="p-4 font-bold">Last Lesson</th>
                                    <th className="p-4 font-bold">Last Active</th>
                                    <th className="p-4 font-bold">Completed Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {enrollments.data?.length > 0 ? (
                                    enrollments.data.map((enr) => (
                                        <tr key={enr.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                                            <td className="p-4">
                                                <p className="font-bold text-neutral-900 dark:text-white">{enr.user_name}</p>
                                                <p className="text-[11px] text-neutral-400">{enr.user_email}</p>
                                            </td>
                                            <td className="p-4 font-semibold text-neutral-800 dark:text-neutral-200">
                                                {enr.course_title}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-purple-600 rounded-full"
                                                            style={{ width: `${enr.progress_percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-bold text-purple-600 dark:text-purple-400">
                                                        {Math.round(enr.progress_percentage)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-neutral-600 dark:text-neutral-400">
                                                {enr.last_lesson || '-'}
                                            </td>
                                            <td className="p-4 text-neutral-500">{enr.last_accessed_at || '-'}</td>
                                            <td className="p-4">
                                                {enr.completed_at ? (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold text-[10px]">
                                                        {enr.completed_at}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-400 italic">In Progress</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-neutral-400 italic">
                                            No active enrollments recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── Course Modal ─────────────────────────────────────────── */}
            {courseModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                                {courseModal.mode === 'create' ? 'Create New Course' : 'Edit Course'}
                            </h2>
                            <button
                                onClick={() => setCourseModal({ open: false, mode: 'create', data: null })}
                                className="p-1 text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCourseSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Course Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={courseForm.data.title}
                                        onChange={(e) => courseForm.setData('title', e.target.value)}
                                        placeholder="e.g. Chatbot Masterclass"
                                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={courseForm.data.category_id}
                                        onChange={(e) => courseForm.setData('category_id', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Headline / Subtitle
                                </label>
                                <input
                                    type="text"
                                    value={courseForm.data.headline}
                                    onChange={(e) => courseForm.setData('headline', e.target.value)}
                                    placeholder="e.g. Build, test, and deploy lead generation chatbots in under 20 minutes"
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Badge Text
                                    </label>
                                    <input
                                        type="text"
                                        value={courseForm.data.badge_text}
                                        onChange={(e) => courseForm.setData('badge_text', e.target.value)}
                                        placeholder="e.g. Free Masterclass"
                                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Difficulty Level
                                    </label>
                                    <select
                                        value={courseForm.data.difficulty_level}
                                        onChange={(e) => courseForm.setData('difficulty_level', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Order Sequence
                                    </label>
                                    <input
                                        type="number"
                                        value={courseForm.data.order}
                                        onChange={(e) => courseForm.setData('order', parseInt(e.target.value) || 0)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Thumbnail Image URL
                                </label>
                                <input
                                    type="text"
                                    value={courseForm.data.thumbnail_url}
                                    onChange={(e) => courseForm.setData('thumbnail_url', e.target.value)}
                                    placeholder="https://... (PNG/JPG URL)"
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Description & Course Notes (HTML or plain text)
                                </label>
                                <textarea
                                    rows={4}
                                    value={courseForm.data.description}
                                    onChange={(e) => courseForm.setData('description', e.target.value)}
                                    placeholder="Detailed description of what students will master..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                    <input
                                        type="checkbox"
                                        checked={courseForm.data.is_published}
                                        onChange={(e) => courseForm.setData('is_published', e.target.checked)}
                                        className="rounded border-neutral-300 text-purple-600 focus:ring-purple-600"
                                    />
                                    Published (Visible to Users)
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                    <input
                                        type="checkbox"
                                        checked={courseForm.data.is_featured}
                                        onChange={(e) => courseForm.setData('is_featured', e.target.checked)}
                                        className="rounded border-neutral-300 text-purple-600 focus:ring-purple-600"
                                    />
                                    Featured on Top
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setCourseModal({ open: false, mode: 'create', data: null })}
                                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={courseForm.processing}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                                >
                                    {courseModal.mode === 'create' ? 'Create Course' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Module Modal ─────────────────────────────────────────── */}
            {moduleModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-8 space-y-5">
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                {moduleModal.mode === 'create' ? 'Add Module Section' : 'Edit Module'}
                            </h2>
                            <button
                                onClick={() => setModuleModal({ open: false, mode: 'create', courseId: null, data: null })}
                                className="p-1 text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleModuleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Module Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={moduleForm.data.title}
                                    onChange={(e) => moduleForm.setData('title', e.target.value)}
                                    placeholder="e.g. Section 1: Setting up AI WhatsApp Automation"
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Module Description
                                </label>
                                <input
                                    type="text"
                                    value={moduleForm.data.description}
                                    onChange={(e) => moduleForm.setData('description', e.target.value)}
                                    placeholder="Summary of topics in this module..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setModuleModal({ open: false, mode: 'create', courseId: null, data: null })}
                                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={moduleForm.processing}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                                >
                                    Save Module
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Lesson Modal ─────────────────────────────────────────── */}
            {lessonModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-8 space-y-5 my-8">
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                {lessonModal.mode === 'create' ? 'Add Video Lesson' : 'Edit Video Lesson'}
                            </h2>
                            <button
                                onClick={() => setLessonModal({ open: false, mode: 'create', courseId: null, moduleId: null, data: null })}
                                className="p-1 text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleLessonSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Lesson Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={lessonForm.data.title}
                                        onChange={(e) => lessonForm.setData('title', e.target.value)}
                                        placeholder="e.g. Connecting Your First WhatsApp Channel"
                                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Duration (in seconds)
                                    </label>
                                    <input
                                        type="number"
                                        value={lessonForm.data.duration_seconds}
                                        onChange={(e) => lessonForm.setData('duration_seconds', parseInt(e.target.value) || 0)}
                                        placeholder="600"
                                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                                    <Youtube className="w-4 h-4 text-red-500" />
                                    YouTube Video URL or Video ID *
                                </label>
                                <input
                                    type="text"
                                    value={lessonForm.data.youtube_video_url}
                                    onChange={(e) => lessonForm.setData('youtube_video_url', e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                />
                                <p className="text-[11px] text-neutral-400 mt-1">
                                    You can paste unlisted or public YouTube video URLs. BotifyAI will automatically extract the responsive player ID.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Lesson Summary & Key Takeaways (HTML supported)
                                </label>
                                <textarea
                                    rows={4}
                                    value={lessonForm.data.lesson_notes}
                                    onChange={(e) => lessonForm.setData('lesson_notes', e.target.value)}
                                    placeholder="Step 1: Navigate to Channels. Step 2: Scan the QR code..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setLessonModal({ open: false, mode: 'create', courseId: null, moduleId: null, data: null })}
                                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={lessonForm.processing}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                                >
                                    Save Lesson
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Category Modal ───────────────────────────────────────── */}
            {categoryModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                {categoryModal.mode === 'create' ? 'Add Category' : 'Edit Category'}
                            </h2>
                            <button
                                onClick={() => setCategoryModal({ open: false, mode: 'create', data: null })}
                                className="p-1 text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCategorySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.data.name}
                                    onChange={(e) => categoryForm.setData('name', e.target.value)}
                                    placeholder="e.g. Chatbots & Automations"
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={categoryForm.data.description}
                                    onChange={(e) => categoryForm.setData('description', e.target.value)}
                                    placeholder="Short summary of this category"
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setCategoryModal({ open: false, mode: 'create', data: null })}
                                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={categoryForm.processing}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                                >
                                    Save Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
