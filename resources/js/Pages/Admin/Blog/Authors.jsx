import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Users,
    Plus,
    Pencil,
    Trash2,
    ArrowLeft,
    ShieldCheck,
    Globe,
    UploadCloud,
    UserCheck,
} from 'lucide-react';

export default function BlogAuthors({
    authors = [],
    adminUsers = [],
}) {
    const [editingAuthor, setEditingAuthor] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        admin_user_id: '',
        name: '',
        slug: '',
        title_role: '',
        avatar_url: '',
        bio: '',
        email: '',
        social_links: { twitter: '', linkedin: '', website: '' },
        is_active: true,
    });

    const openCreate = () => {
        setEditingAuthor(null);
        reset();
        setShowModal(true);
    };

    const openEdit = (author) => {
        setEditingAuthor(author);
        setData({
            admin_user_id: author.admin_user_id || '',
            name: author.name,
            slug: author.slug,
            title_role: author.title_role || '',
            avatar_url: author.avatar_url || '',
            bio: author.bio || '',
            email: author.email || '',
            social_links: author.social_links || { twitter: '', linkedin: '', website: '' },
            is_active: !!author.is_active,
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (editingAuthor) {
            put(route('admin.blog.authors.update', editingAuthor.id), {
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route('admin.blog.authors.store'), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const handleDelete = (author) => {
        if (confirm(`Delete author "${author.name}"? Articles written by this author will remain published.`)) {
            router.delete(route('admin.blog.authors.destroy', author.id));
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await window.axios.post(route('admin.blog.upload-image'), formData);
            if (res.data?.url) {
                setData('avatar_url', res.data.url);
            }
        } catch (err) {
            alert('Avatar upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploadingAvatar(false);
        }
    };

    return (
        <AdminLayout title="Blog Authors (E-E-A-T)">
            <Head title="Blog Authors — E-E-A-T Compliance" />

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
                                <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                Author Profiles & E-E-A-T Transparency
                            </h1>
                            <p className="text-xs text-neutral-500">
                                Google Search Essentials and AdSense reward verified subject matter experts with bios and credentials.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition"
                    >
                        <Plus className="h-4 w-4" />
                        Add Author
                    </button>
                </div>

                {/* Authors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {authors.map((author) => (
                        <div
                            key={author.id}
                            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-base border border-brand-200 shrink-0">
                                            {author.avatar_url ? (
                                                <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" />
                                            ) : (
                                                author.name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                                                {author.name}
                                            </h3>
                                            <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                                                {author.title_role || 'Content Contributor'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(author)}
                                            className="p-1 rounded-lg text-neutral-400 hover:text-brand-600 transition"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(author)}
                                            className="p-1 rounded-lg text-neutral-400 hover:text-red-600 transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                                    {author.bio || 'No bio entered.'}
                                </p>
                            </div>

                            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between text-[11px] text-neutral-400">
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                    {author.posts_count} Articles Published
                                </span>
                                <Link
                                    href={route('blog.author', author.slug)}
                                    target="_blank"
                                    className="text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                                >
                                    View Profile &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Author Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <form
                        onSubmit={handleSave}
                        className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                                {editingAuthor ? 'Edit Author Profile' : 'Create Author Profile'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-neutral-400 hover:text-neutral-600 text-sm font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Author Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Alex Rivera"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Professional Title / Role
                                </label>
                                <input
                                    type="text"
                                    value={data.title_role}
                                    onChange={(e) => setData('title_role', e.target.value)}
                                    placeholder="e.g. Head of Conversational AI"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Author Slug (URL)
                                </label>
                                <input
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="auto-generated-slug"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Link to Admin Account (Optional)
                                </label>
                                <select
                                    value={data.admin_user_id}
                                    onChange={(e) => setData('admin_user_id', e.target.value)}
                                    className="w-full text-xs py-2 px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                >
                                    <option value="">No linked admin</option>
                                    {adminUsers.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Author Biography (E-E-A-T Expertise & Background)
                            </label>
                            <textarea
                                rows={3}
                                value={data.bio}
                                onChange={(e) => setData('bio', e.target.value)}
                                placeholder="Describe the author's background, industry experience, and expertise in automation..."
                                className="w-full text-xs p-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white resize-y"
                            />
                        </div>

                        {/* Avatar Image Upload */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Avatar Image URL
                                </label>
                                <input
                                    type="text"
                                    value={data.avatar_url}
                                    onChange={(e) => setData('avatar_url', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Or Upload Photo
                                </label>
                                <label className="border border-neutral-300 dark:border-neutral-600 rounded-xl px-3 py-2 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700">
                                    <UploadCloud className="h-4 w-4" />
                                    <span>{uploadingAvatar ? 'Uploading...' : 'Choose File'}</span>
                                    <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-medium text-neutral-500 mb-1">Twitter / X</label>
                                <input
                                    type="text"
                                    value={data.social_links.twitter || ''}
                                    onChange={(e) => setData('social_links', { ...data.social_links, twitter: e.target.value })}
                                    placeholder="https://x.com/..."
                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-neutral-500 mb-1">LinkedIn</label>
                                <input
                                    type="text"
                                    value={data.social_links.linkedin || ''}
                                    onChange={(e) => setData('social_links', { ...data.social_links, linkedin: e.target.value })}
                                    placeholder="https://linkedin.com/..."
                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-neutral-500 mb-1">Website</label>
                                <input
                                    type="text"
                                    value={data.social_links.website || ''}
                                    onChange={(e) => setData('social_links', { ...data.social_links, website: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                            >
                                {editingAuthor ? 'Save Author' : 'Create Author'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}

