import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    FolderTree,
    Plus,
    Pencil,
    Trash2,
    ArrowLeft,
    Tag,
    Save,
    CheckCircle2,
} from 'lucide-react';

export default function BlogCategories({
    categories = [],
    tags = [],
}) {
    const [editingCat, setEditingCat] = useState(null);
    const [showCatModal, setShowCatModal] = useState(false);

    const { data: catData, setData: setCatData, post: postCat, put: putCat, reset: resetCat, processing: processingCat, errors: catErrors } = useForm({
        name: '',
        slug: '',
        description: '',
        icon: 'Folder',
        order: 0,
        is_active: true,
    });

    const openCreateCat = () => {
        setEditingCat(null);
        resetCat();
        setShowCatModal(true);
    };

    const openEditCat = (cat) => {
        setEditingCat(cat);
        setCatData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            icon: cat.icon || 'Folder',
            order: cat.order || 0,
            is_active: !!cat.is_active,
        });
        setShowCatModal(true);
    };

    const handleSaveCat = (e) => {
        e.preventDefault();
        if (editingCat) {
            putCat(route('admin.blog.categories.update', editingCat.id), {
                onSuccess: () => setShowCatModal(false),
            });
        } else {
            postCat(route('admin.blog.categories.store'), {
                onSuccess: () => setShowCatModal(false),
            });
        }
    };

    const handleDeleteCat = (cat) => {
        if (confirm(`Delete category "${cat.name}"? Articles in this category will become uncategorized.`)) {
            router.delete(route('admin.blog.categories.destroy', cat.id));
        }
    };

    const handleDeleteTag = (t) => {
        if (confirm(`Delete tag "${t.name}"?`)) {
            router.delete(route('admin.blog.tags.destroy', t.id));
        }
    };

    return (
        <AdminLayout title="Blog Categories & Tags">
            <Head title="Blog Categories & Tags — Admin" />

            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('admin.blog.index')}
                            className="p-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <FolderTree className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                Categories & Tag Taxonomy
                            </h1>
                            <p className="text-xs text-neutral-500">
                                Structure your blog content clusters for optimal SEO ranking and user navigation.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateCat}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition"
                    >
                        <Plus className="h-4 w-4" />
                        Add Category
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Categories List (2 Cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                                    Topic Categories ({categories.length})
                                </h3>
                            </div>

                            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {categories.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-neutral-400">
                                        No categories created yet.
                                    </div>
                                ) : (
                                    categories.map((cat) => (
                                        <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/60 dark:hover:bg-neutral-700/30 transition">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                                        {cat.name}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                                                        /{cat.slug}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-neutral-500 line-clamp-1">
                                                    {cat.description || 'No description entered.'}
                                                </p>
                                                <div className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                                                    {cat.posts_count} Articles Published
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditCat(cat)}
                                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCat(cat)}
                                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tags List (1 Col) */}
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-3">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                                <Tag className="h-4 w-4 text-neutral-500" />
                                Tag Cloud ({tags.length})
                            </h3>
                            <p className="text-xs text-neutral-500">
                                Tags are automatically created and assigned when you write articles.
                            </p>

                            <div className="flex flex-wrap gap-1.5 pt-2">
                                {tags.map((t) => (
                                    <span
                                        key={t.id}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-neutral-100 dark:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600"
                                    >
                                        <span>{t.name}</span>
                                        <span className="text-[9px] text-neutral-400 font-mono">({t.posts_count})</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTag(t)}
                                            className="hover:text-red-500 font-bold ml-0.5"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Create/Edit Modal */}
            {showCatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <form
                        onSubmit={handleSaveCat}
                        className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                                {editingCat ? 'Edit Category' : 'Create Category'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowCatModal(false)}
                                className="text-neutral-400 hover:text-neutral-600 text-sm font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                Category Name *
                            </label>
                            <input
                                type="text"
                                value={catData.name}
                                onChange={(e) => setCatData('name', e.target.value)}
                                placeholder="e.g. WhatsApp Automation"
                                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                required
                            />
                            {catErrors.name && <p className="text-red-500 text-xs mt-1">{catErrors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Slug (URL Path)
                            </label>
                            <input
                                type="text"
                                value={catData.slug}
                                onChange={(e) => setCatData('slug', e.target.value)}
                                placeholder="auto-generated-slug"
                                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Category Description (SEO & Archive Header)
                            </label>
                            <textarea
                                rows={3}
                                value={catData.description}
                                onChange={(e) => setCatData('description', e.target.value)}
                                placeholder="Brief overview of what readers will learn in this topic cluster..."
                                className="w-full text-xs p-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white resize-y"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Display Order
                                </label>
                                <input
                                    type="number"
                                    value={catData.order}
                                    onChange={(e) => setCatData('order', parseInt(e.target.value) || 0)}
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="cat_active"
                                    checked={catData.is_active}
                                    onChange={(e) => setCatData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-neutral-300 text-brand-600"
                                />
                                <label htmlFor="cat_active" className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                    Active / Visible
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={() => setShowCatModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processingCat}
                                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                            >
                                {editingCat ? 'Save Changes' : 'Create Category'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}

