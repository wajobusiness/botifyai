import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Tabs } from '@/Components/ui';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Upload, X, Image, Globe, Palette, Settings2, Code2, Flame,
    Search, BarChart2, Shield, Code, ArrowRightLeft, RefreshCw,
    Plus, Trash2, Edit2, ExternalLink, CheckCircle2
} from 'lucide-react';

// ─── Appearance controls ──────────────────────────────────────────────────────

function ColorField({ label, hint, value, onChange, error, placeholder }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-16 shrink-0 cursor-pointer rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    maxLength={7}
                    className="w-32 rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

/**
 * Shows the picked colours and font before they are saved. The swatches render the
 * exact chosen hex — that value becomes the 600 stop of the generated palette, and
 * the lighter/darker stops the UI also uses are derived from it server-side
 * (App\Support\BrandPalette), so this previews the anchor rather than the full ramp.
 */
function ThemePreview({ primary, secondary, fontSlug, fontName }) {
    const { t } = useTranslation();
    const valid = (c) => /^#[0-9A-Fa-f]{6}$/.test(c ?? '');

    // The chosen font is only in the document if it happens to be the saved one, so
    // pull it from the CDN on demand to make the preview truthful. Bunny dedupes by
    // href, and the browser drops the sheet when this unmounts.
    useEffect(() => {
        if (!fontSlug) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.bunny.net/css?family=${encodeURIComponent(fontSlug)}:400,500,600,700&display=swap`;
        document.head.appendChild(link);

        return () => link.remove();
    }, [fontSlug]);

    return (
        <div className="rounded-soft-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t('settings.theme_preview')}
            </p>
            <div className="flex flex-wrap items-center gap-3" style={fontName ? { fontFamily: `'${fontName}', sans-serif` } : undefined}>
                <span
                    className="rounded-soft px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: valid(primary) ? primary : '#467235' }}
                >
                    {t('settings.preview_primary_button')}
                </span>
                <span
                    className="rounded-soft px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: valid(secondary) ? secondary : '#283f24' }}
                >
                    {t('settings.preview_secondary_button')}
                </span>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {t('settings.preview_sample_text')}
                </span>
            </div>
        </div>
    );
}

// ─── General Settings Tab ─────────────────────────────────────────────────────

function GeneralTab({ general, fonts, flash }) {
    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm({
        app_name:        general?.app_name        ?? '',
        app_tagline:     general?.app_tagline     ?? '',
        support_email:   general?.support_email   ?? '',
        primary_color:   general?.primary_color   ?? '#467235',
        secondary_color: general?.secondary_color ?? '#283f24',
        font_family:     general?.font_family     ?? 'space-grotesk',
    });

    const fontEntries = Object.entries(fonts ?? {});

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.settings.general.update'), {
            preserveScroll: true,
            // The palette and font are injected into the document <head> by the Blade
            // layout. Inertia visits swap the page component but never re-run Blade,
            // so a full browser reload is what makes a saved theme take effect
            // immediately instead of on the next hard navigation.
            onSuccess: () => window.location.reload(),
        });
    };

    return (
        <div className="space-y-6">
            {flash?.success && (
                <div className="rounded-soft-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">
                    {flash.success}
                </div>
            )}

            <form onSubmit={submit}>
                <Card>
                    <Card.Body className="space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                            <Globe className="h-5 w-5 text-brand-500" />
                            <div>
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t('settings.site_information')}</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('settings.site_info_desc')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('settings.app_name')}</label>
                                <input
                                    type="text"
                                    value={data.app_name}
                                    onChange={(e) => setData('app_name', e.target.value)}
                                    placeholder={t('settings.app_name_placeholder')}
                                    className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                />
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('settings.app_name_hint')}</p>
                                {errors.app_name && <p className="text-xs text-red-500">{errors.app_name}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('settings.support_email')}</label>
                                <input
                                    type="email"
                                    value={data.support_email}
                                    onChange={(e) => setData('support_email', e.target.value)}
                                    placeholder="support@example.com"
                                    className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                />
                                {errors.support_email && <p className="text-xs text-red-500">{errors.support_email}</p>}
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('settings.tagline')}</label>
                                <input
                                    type="text"
                                    value={data.app_tagline}
                                    onChange={(e) => setData('app_tagline', e.target.value)}
                                    placeholder={t('settings.tagline_placeholder')}
                                    className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                />
                                {errors.app_tagline && <p className="text-xs text-red-500">{errors.app_tagline}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pb-4 pt-2 border-b border-neutral-100 dark:border-neutral-800">
                            <Palette className="h-5 w-5 text-brand-500" />
                            <div>
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t('settings.appearance')}</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('settings.appearance_desc')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <ColorField
                                label={t('settings.primary_brand_color')}
                                hint={t('settings.primary_color_hint')}
                                value={data.primary_color}
                                onChange={(v) => setData('primary_color', v)}
                                error={errors.primary_color}
                                placeholder="#467235"
                            />
                            <ColorField
                                label={t('settings.secondary_brand_color')}
                                hint={t('settings.secondary_color_hint')}
                                value={data.secondary_color}
                                onChange={(v) => setData('secondary_color', v)}
                                error={errors.secondary_color}
                                placeholder="#283f24"
                            />
                        </div>

                        <div className="space-y-1 sm:max-w-xs">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('settings.font_family')}</label>
                            <select
                                value={data.font_family}
                                onChange={(e) => setData('font_family', e.target.value)}
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            >
                                {fontEntries.map(([slug, name]) => (
                                    <option key={slug} value={slug}>{name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('settings.font_family_hint')}</p>
                            {errors.font_family && <p className="text-xs text-red-500">{errors.font_family}</p>}
                        </div>

                        <ThemePreview
                            primary={data.primary_color}
                            secondary={data.secondary_color}
                            fontSlug={data.font_family}
                            fontName={fonts?.[data.font_family]}
                        />

                        <div className="flex justify-end pt-2">
                            <Button type="submit" variant="primary" disabled={processing}>
                                {processing ? t('settings.saving') : t('settings.save_general')}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </form>

            <Card>
                <Card.Body className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                        <Image className="h-5 w-5 text-brand-500" />
                        <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t('settings.logo_favicon')}</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('settings.logo_favicon_desc')}</p>
                        </div>
                    </div>

                    <ImageUploadWidget
                        label={t('settings.app_logo')}
                        description={t('settings.app_logo_desc')}
                        accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                        currentUrl={general?.logo_url}
                        uploadRoute="admin.settings.logo.upload"
                        deleteRoute="admin.settings.logo.delete"
                        fieldName="logo"
                    />

                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
                        <ImageUploadWidget
                            label={t('settings.favicon')}
                            description={t('settings.favicon_desc')}
                            accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/gif,image/webp"
                            currentUrl={general?.favicon_url}
                            uploadRoute="admin.settings.favicon.upload"
                            deleteRoute="admin.settings.favicon.delete"
                            fieldName="favicon"
                        />
                    </div>
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        <strong className="text-neutral-700 dark:text-neutral-300">{t('settings.logo_usage_title')}</strong>
                        {' '}{t('settings.logo_usage_hint')}
                    </p>
                </Card.Body>
            </Card>
        </div>
    );
}

// ─── Image Upload Widget ───────────────────────────────────────────────────────

function ImageUploadWidget({ label, description, accept, currentUrl, uploadRoute, deleteRoute, fieldName }) {
    const { t } = useTranslation();
    const fileRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleFile = (file) => {
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        const fd = new FormData();
        fd.append(fieldName, file);
        setUploading(true);
        router.post(route(uploadRoute), fd, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploading(false);
                setPreview(null);
            },
        });
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route(deleteRoute), {
            preserveScroll: true,
            onFinish: () => setDeleting(false),
        });
    };

    const displayUrl = preview || currentUrl;

    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>
            </div>

            <div className="flex items-start gap-4">
                {/* Preview box */}
                <div className="relative flex-shrink-0 w-24 h-24 rounded-soft-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center overflow-hidden">
                    {displayUrl ? (
                        <>
                            <img src={displayUrl} alt={label} className="w-full h-full object-contain p-1" />
                            {!uploading && currentUrl && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-0.5 hover:bg-red-600 transition"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </>
                    ) : (
                        <Image className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                    )}
                    {(uploading || deleting) && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-neutral-900/60 flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-brand-500" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 justify-center">
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading || deleting}
                        className="inline-flex items-center gap-2 rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition disabled:opacity-50"
                    >
                        <Upload className="h-4 w-4" />
                        {currentUrl ? t('settings.replace') : t('settings.upload')}
                    </button>
                    {currentUrl && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting || uploading}
                            className="inline-flex items-center gap-2 rounded-soft border border-red-200 dark:border-red-900 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                            {t('settings.remove')}
                        </button>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Advanced Tab ─────────────────────────────────────────────────────────────

function AdvancedTab({ settingsByGroup, flash }) {
    const { t } = useTranslation();
    const flat = Object.entries(settingsByGroup).flatMap(([group, items]) =>
        items.map((s) => ({ ...s, group }))
    );
    const { data, setData, put, processing } = useForm({ settings: flat });

    if (flat.length === 0) {
        return (
            <Card>
                <Card.Body>
                    <div className="text-center py-8">
                        <Code2 className="h-10 w-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('settings.no_advanced')}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{t('settings.no_advanced_desc')}</p>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                put(route('admin.settings.update'), { preserveScroll: true });
            }}
            className="space-y-6"
        >
            {flash?.success && (
                <div className="rounded-soft-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">
                    {flash.success}
                </div>
            )}

            {Object.entries(
                data.settings.reduce((acc, s, i) => {
                    const g = s.group || 'Ungrouped';
                    if (!acc[g]) acc[g] = [];
                    acc[g].push({ ...s, _index: i });
                    return acc;
                }, {})
            ).map(([group, items]) => (
                <Card key={group}>
                    <Card.Body className="space-y-3">
                        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                            <Settings2 className="h-4 w-4 text-neutral-400" />
                            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 capitalize">{group}</h3>
                        </div>
                        {items.map((s) => {
                            const i = s._index;
                            return (
                                <div key={s.id || i} className="flex flex-wrap gap-2 items-center border-b border-neutral-100 dark:border-neutral-800 pb-2 last:border-0 last:pb-0">
                                    <span className="font-mono text-xs w-44 text-neutral-600 dark:text-neutral-400 truncate" title={s.key}>{s.key}</span>
                                    <input
                                        type={s.is_secret ? 'password' : 'text'}
                                        value={s.value}
                                        onChange={(e) => {
                                            const next = [...data.settings];
                                            next[i] = { ...next[i], value: e.target.value };
                                            setData('settings', next);
                                        }}
                                        placeholder={s.is_secret ? t('admin.secret_value') : t('admin.value_label')}
                                        className="rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-1.5 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                                        <input
                                            type="checkbox"
                                            checked={s.is_secret}
                                            onChange={(e) => {
                                                const n = [...data.settings];
                                                n[i] = { ...n[i], is_secret: e.target.checked };
                                                setData('settings', n);
                                            }}
                                            className="rounded border-neutral-300 dark:border-neutral-600 text-brand-500"
                                        />
                                        {t('settings.secret')}
                                    </label>
                                    <input
                                        type="text"
                                        value={s.group ?? ''}
                                        onChange={(e) => {
                                            const n = [...data.settings];
                                            n[i] = { ...n[i], group: e.target.value };
                                            setData('settings', n);
                                        }}
                                        placeholder={t('admin.group_label')}
                                        className="rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 w-24 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                            );
                        })}
                    </Card.Body>
                </Card>
            ))}

            <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={processing}>
                    {processing ? t('settings.saving') : t('settings.save_advanced')}
                </Button>
            </div>
        </form>
    );
}

// ─── Firebase Tab ─────────────────────────────────────────────────────────────

function FirebaseTab({ firebase, flash }) {
    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm({
        firebase_enabled:     firebase?.enabled    ? 'true' : 'false',
        firebase_api_key:     firebase?.apiKey     ?? '',
        firebase_auth_domain: firebase?.authDomain ?? '',
        firebase_project_id:  firebase?.projectId  ?? '',
        firebase_app_id:      firebase?.appId      ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.settings.firebase.update'), { preserveScroll: true });
    };

    const field = (label, key, description, placeholder = '') => (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
            {description && <p className="text-xs text-neutral-400 dark:text-neutral-500">{description}</p>}
            <input
                type="text"
                value={data[key]}
                onChange={(e) => setData(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
        </div>
    );

    return (
        <form onSubmit={submit} className="space-y-6">
            {flash?.success && (
                <div className="rounded-soft-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">
                    {flash.success}
                </div>
            )}

            <Card>
                <Card.Body className="space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t('settings.firebase_auth')}</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {t('settings.firebase_auth_desc')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-soft border border-neutral-200 dark:border-neutral-700 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('settings.enable_firebase')}</p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{t('settings.enable_firebase_desc')}</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={data.firebase_enabled === 'true'}
                            onClick={() => setData('firebase_enabled', data.firebase_enabled === 'true' ? 'false' : 'true')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                                data.firebase_enabled === 'true' ? 'bg-brand-500' : 'bg-neutral-300 dark:bg-neutral-600'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    data.firebase_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {field(t('settings.api_key'), 'firebase_api_key', t('settings.firebase_api_key_desc'), 'AIzaSy...')}
                        {field(t('settings.auth_domain'), 'firebase_auth_domain', t('settings.firebase_auth_domain_desc'), 'your-project.firebaseapp.com')}
                        {field(t('settings.project_id'), 'firebase_project_id', t('settings.firebase_project_id_desc'), 'your-project-id')}
                        {field(t('settings.app_id'), 'firebase_app_id', t('settings.firebase_app_id_desc'), '1:123456:web:abc...')}
                    </div>

                    <div className="rounded-soft border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                        <p className="font-semibold">{t('settings.setup_checklist')}</p>
                        <ol className="list-decimal list-inside space-y-0.5 mt-1">
                            <li>{t('settings.firebase_step_1')}</li>
                            <li>{t('settings.firebase_step_2')}</li>
                            <li>{t('settings.firebase_step_3')}</li>
                        </ol>
                    </div>
                </Card.Body>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={processing}>
                    {processing ? t('settings.saving') : t('settings.save_firebase')}
                </Button>
            </div>
        </form>
    );
}

// ─── SEO & Tracking Tab ───────────────────────────────────────────────────────

function SeoTab({ seo = {}, redirects = [], sitemapUrls = {}, robotsUrl = '', flash }) {
    const { t } = useTranslation();
    const [subTab, setSubTab] = useState('general');
    const [isClearingSitemap, setIsClearingSitemap] = useState(false);

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        seo_site_title_suffix: seo.seo_site_title_suffix || '— BotifyAI',
        seo_default_meta_description: seo.seo_default_meta_description || '',
        seo_default_meta_keywords: seo.seo_default_meta_keywords || '',
        seo_google_analytics_id: seo.seo_google_analytics_id || '',
        seo_google_tag_manager_id: seo.seo_google_tag_manager_id || '',
        seo_clarity_project_id: seo.seo_clarity_project_id || '',
        seo_meta_pixel_id: seo.seo_meta_pixel_id || '',
        seo_tiktok_pixel_id: seo.seo_tiktok_pixel_id || '',
        seo_linkedin_partner_id: seo.seo_linkedin_partner_id || '',
        seo_google_verification_code: seo.seo_google_verification_code || '',
        seo_bing_verification_code: seo.seo_bing_verification_code || '',
        seo_yandex_verification_code: seo.seo_yandex_verification_code || '',
        seo_pinterest_verification_code: seo.seo_pinterest_verification_code || '',
        seo_custom_head_scripts: seo.seo_custom_head_scripts || '',
        seo_custom_body_scripts: seo.seo_custom_body_scripts || '',
    });

    const [redirectModalOpen, setRedirectModalOpen] = useState(false);
    const [editingRedirect, setEditingRedirect] = useState(null);
    const redirectForm = useForm({
        source_path: '',
        target_url: '',
        status_code: '301',
        is_active: true,
    });

    const handleSettingsSubmit = (e) => {
        e.preventDefault();
        put(route('admin.seo.update'), { preserveScroll: true });
    };

    const handleClearSitemap = () => {
        setIsClearingSitemap(true);
        router.post(route('admin.seo.clear-sitemap-cache'), {}, {
            preserveScroll: true,
            onFinish: () => setIsClearingSitemap(false),
        });
    };

    const openCreateRedirect = () => {
        setEditingRedirect(null);
        redirectForm.reset();
        redirectForm.setData({
            source_path: '',
            target_url: '',
            status_code: '301',
            is_active: true,
        });
        setRedirectModalOpen(true);
    };

    const openEditRedirect = (r) => {
        setEditingRedirect(r);
        redirectForm.setData({
            source_path: r.source_path,
            target_url: r.target_url,
            status_code: String(r.status_code),
            is_active: Boolean(r.is_active),
        });
        setRedirectModalOpen(true);
    };

    const handleRedirectSubmit = (e) => {
        e.preventDefault();
        if (editingRedirect) {
            redirectForm.put(route('admin.seo.redirects.update', editingRedirect.id), {
                preserveScroll: true,
                onSuccess: () => setRedirectModalOpen(false),
            });
        } else {
            redirectForm.post(route('admin.seo.redirects.store'), {
                preserveScroll: true,
                onSuccess: () => setRedirectModalOpen(false),
            });
        }
    };

    const handleDeleteRedirect = (id) => {
        if (confirm('Are you sure you want to delete this redirect?')) {
            router.delete(route('admin.seo.redirects.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const subTabs = [
        { id: 'general', label: 'Meta & Sitemaps', icon: Search },
        { id: 'analytics', label: 'Tracking Pixels', icon: BarChart2 },
        { id: 'verification', label: 'Search Verification', icon: Shield },
        { id: 'custom_code', label: 'Custom Scripts', icon: Code },
        { id: 'redirects', label: '301 Redirects', icon: ArrowRightLeft },
    ];

    return (
        <div className="space-y-6">
            {flash?.success && (
                <div className="rounded-soft-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">
                    {flash.success}
                </div>
            )}

            {/* Sub Tabs Pill Navigation */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 overflow-x-auto">
                    {subTabs.map((st) => {
                        const Icon = st.icon;
                        const active = subTab === st.id;
                        return (
                            <button
                                key={st.id}
                                type="button"
                                onClick={() => setSubTab(st.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    active
                                        ? 'bg-brand-500 text-white shadow-sm'
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {st.label}
                            </button>
                        );
                    })}
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClearSitemap}
                    disabled={isClearingSitemap}
                    className="flex items-center gap-1.5 text-xs py-1 px-3"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isClearingSitemap ? 'animate-spin' : ''}`} />
                    Purge Sitemap Cache
                </Button>
            </div>

            {/* SubTab 1: General & Sitemaps */}
            {subTab === 'general' && (
                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                    <Card>
                        <Card.Body className="space-y-5">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                Global Search Metadata
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Site Title Suffix
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_site_title_suffix}
                                        onChange={(e) => setData('seo_site_title_suffix', e.target.value)}
                                        placeholder="— BotifyAI"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">Appended to page titles across public pages.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Default Meta Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={data.seo_default_meta_description}
                                        onChange={(e) => setData('seo_default_meta_description', e.target.value)}
                                        placeholder="BotifyAI unifies WhatsApp, Messenger, and Instagram with AI chatbots and digital ecommerce..."
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Default Meta Keywords
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_default_meta_keywords}
                                        onChange={(e) => setData('seo_default_meta_keywords', e.target.value)}
                                        placeholder="WhatsApp CRM, AI Chatbots, Omnichannel Marketing, Digital Products"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Body className="space-y-4">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                XML Sitemaps & Crawler Directives
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <a
                                    href={sitemapUrls.index || '/sitemap.xml'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 rounded-soft border border-neutral-200 dark:border-neutral-700 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                                >
                                    <div>
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Master Sitemap Index</div>
                                        <div className="text-neutral-400 font-mono">/sitemap.xml</div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-neutral-400" />
                                </a>

                                <a
                                    href={sitemapUrls.products || '/sitemaps/products.xml'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 rounded-soft border border-neutral-200 dark:border-neutral-700 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                                >
                                    <div>
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Products & Images Sitemap</div>
                                        <div className="text-neutral-400 font-mono">/sitemaps/products.xml</div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-neutral-400" />
                                </a>

                                <a
                                    href={sitemapUrls.stores || '/sitemaps/stores.xml'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 rounded-soft border border-neutral-200 dark:border-neutral-700 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                                >
                                    <div>
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Stores Sitemap</div>
                                        <div className="text-neutral-400 font-mono">/sitemaps/stores.xml</div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-neutral-400" />
                                </a>

                                <a
                                    href={robotsUrl || '/robots.txt'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 rounded-soft border border-neutral-200 dark:border-neutral-700 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                                >
                                    <div>
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Robots Directives</div>
                                        <div className="text-neutral-400 font-mono">/robots.txt</div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-neutral-400" />
                                </a>
                            </div>
                        </Card.Body>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Meta Settings'}
                        </Button>
                    </div>
                </form>
            )}

            {/* SubTab 2: Tracking Pixels */}
            {subTab === 'analytics' && (
                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                    <Card>
                        <Card.Body className="space-y-5">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                Analytics & Ad Tracking Pixels
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Google Tag Manager (Container ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_google_tag_manager_id}
                                        onChange={(e) => setData('seo_google_tag_manager_id', e.target.value)}
                                        placeholder="GTM-XXXXXXX"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    <p className="text-xs text-neutral-400">Takes precedence over standalone GA4.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Google Analytics 4 (Measurement ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_google_analytics_id}
                                        onChange={(e) => setData('seo_google_analytics_id', e.target.value)}
                                        placeholder="G-XXXXXXXXXX"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                    <p className="text-xs text-neutral-400">Direct gtag.js integration.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Microsoft Clarity (Project ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_clarity_project_id}
                                        onChange={(e) => setData('seo_clarity_project_id', e.target.value)}
                                        placeholder="yky6jsr41d"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Meta Pixel ID (Facebook / Instagram)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_meta_pixel_id}
                                        onChange={(e) => setData('seo_meta_pixel_id', e.target.value)}
                                        placeholder="123456789012345"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        TikTok Pixel ID
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_tiktok_pixel_id}
                                        onChange={(e) => setData('seo_tiktok_pixel_id', e.target.value)}
                                        placeholder="CXXXXXXXXXXXXXXX"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        LinkedIn Insight Partner ID
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_linkedin_partner_id}
                                        onChange={(e) => setData('seo_linkedin_partner_id', e.target.value)}
                                        placeholder="1234567"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Tracking Settings'}
                        </Button>
                    </div>
                </form>
            )}

            {/* SubTab 3: Search Verification */}
            {subTab === 'verification' && (
                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                    <Card>
                        <Card.Body className="space-y-5">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                Webmaster Verification Tokens
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Google Search Console Token
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_google_verification_code}
                                        onChange={(e) => setData('seo_google_verification_code', e.target.value)}
                                        placeholder="google-site-verification token..."
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Bing Webmaster Tools (msvalidate.01)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_bing_verification_code}
                                        onChange={(e) => setData('seo_bing_verification_code', e.target.value)}
                                        placeholder="msvalidate.01 token..."
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Yandex Webmaster Token
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_yandex_verification_code}
                                        onChange={(e) => setData('seo_yandex_verification_code', e.target.value)}
                                        placeholder="yandex-verification token..."
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Pinterest Domain Verification
                                    </label>
                                    <input
                                        type="text"
                                        value={data.seo_pinterest_verification_code}
                                        onChange={(e) => setData('seo_pinterest_verification_code', e.target.value)}
                                        placeholder="p:domain_verify token..."
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Verification Tokens'}
                        </Button>
                    </div>
                </form>
            )}

            {/* SubTab 4: Custom Code */}
            {subTab === 'custom_code' && (
                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                    <Card>
                        <Card.Body className="space-y-4">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                Custom HTML / Script Injection
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Header Scripts (injected into &lt;head&gt;)
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={data.seo_custom_head_scripts}
                                        onChange={(e) => setData('seo_custom_head_scripts', e.target.value)}
                                        placeholder="<!-- Custom header tags, fonts, or tracking scripts -->"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Body Scripts (injected into top of &lt;body&gt;)
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={data.seo_custom_body_scripts}
                                        onChange={(e) => setData('seo_custom_body_scripts', e.target.value)}
                                        placeholder="<!-- Custom noscript or chat widgets -->"
                                        className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Custom Scripts'}
                        </Button>
                    </div>
                </form>
            )}

            {/* SubTab 5: Redirects */}
            {subTab === 'redirects' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                301/302 URL Redirects
                            </h3>
                            <p className="text-xs text-neutral-400">
                                Prevent broken backlinks and preserve SEO authority by redirecting legacy URLs.
                            </p>
                        </div>
                        <Button onClick={openCreateRedirect} variant="primary" className="flex items-center gap-1.5 text-xs">
                            <Plus className="w-3.5 h-3.5" /> Add Redirect
                        </Button>
                    </div>

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 font-semibold uppercase border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-4 py-2.5">Source Path</th>
                                        <th className="px-4 py-2.5">Destination</th>
                                        <th className="px-4 py-2.5">Type</th>
                                        <th className="px-4 py-2.5">Status</th>
                                        <th className="px-4 py-2.5 text-right">Hits</th>
                                        <th className="px-4 py-2.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {redirects.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-6 text-center text-neutral-400 text-xs">
                                                No URL redirects created yet. Click "Add Redirect" above.
                                            </td>
                                        </tr>
                                    ) : (
                                        redirects.map((r) => (
                                            <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                                <td className="px-4 py-2.5 font-mono text-neutral-900 dark:text-neutral-100">
                                                    {r.source_path}
                                                </td>
                                                <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400 truncate max-w-xs">
                                                    {r.target_url}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                        r.status_code === 301
                                                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                                    }`}>
                                                        {r.status_code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                        r.is_active
                                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                                                    }`}>
                                                        {r.is_active ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                                                    {r.hit_count.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openEditRedirect(r)}
                                                            className="p-1 rounded text-neutral-400 hover:text-brand-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRedirect(r.id)}
                                                            className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {redirectModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-soft-lg p-5 max-w-md w-full space-y-4 shadow-xl">
                                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                    {editingRedirect ? 'Edit Redirect' : 'Add Redirect'}
                                </h4>

                                <form onSubmit={handleRedirectSubmit} className="space-y-3 text-xs">
                                    <div>
                                        <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                            Source Path (e.g. /old-page)
                                        </label>
                                        <input
                                            type="text"
                                            value={redirectForm.data.source_path}
                                            onChange={(e) => redirectForm.setData('source_path', e.target.value)}
                                            placeholder="/old-page"
                                            required
                                            className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                        {redirectForm.errors.source_path && (
                                            <p className="text-red-500 mt-1">{redirectForm.errors.source_path}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                            Target Destination (e.g. /buy/new-product or full URL)
                                        </label>
                                        <input
                                            type="text"
                                            value={redirectForm.data.target_url}
                                            onChange={(e) => redirectForm.setData('target_url', e.target.value)}
                                            placeholder="/buy/new-page or https://..."
                                            required
                                            className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                        {redirectForm.errors.target_url && (
                                            <p className="text-red-500 mt-1">{redirectForm.errors.target_url}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 items-center">
                                        <div>
                                            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                                Status Code
                                            </label>
                                            <select
                                                value={redirectForm.data.status_code}
                                                onChange={(e) => redirectForm.setData('status_code', e.target.value)}
                                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-xs"
                                            >
                                                <option value="301">301 Permanent</option>
                                                <option value="302">302 Temporary</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center pt-4">
                                            <label className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={redirectForm.data.is_active}
                                                    onChange={(e) => redirectForm.setData('is_active', e.target.checked)}
                                                    className="rounded border-neutral-300 dark:border-neutral-600 text-brand-500"
                                                />
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setRedirectModalOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={redirectForm.processing}
                                        >
                                            {redirectForm.processing ? 'Saving...' : 'Save Redirect'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsIndex({ general = {}, fonts = {}, settingsByGroup = {}, firebase = {}, seo = {}, redirects = [], sitemapUrls = {}, robotsUrl = '' }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};

    const tabs = [
        { key: 'general',  label: t('settings.tab_general') },
        { key: 'seo',      label: 'SEO & Tracking' },
        { key: 'firebase', label: t('settings.tab_firebase') },
        { key: 'advanced', label: t('settings.tab_advanced') },
    ];

    const [activeIndex, setActiveIndex] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'seo') return 1;
            if (params.get('tab') === 'firebase') return 2;
            if (params.get('tab') === 'advanced') return 3;
        }
        return 0;
    });

    return (
        <AdminLayout title={t('admin.system_settings')}>
            <Head title={`${t('admin.nav.settings')} · ${t('head.admin')}`} />
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('admin.system_settings')}</h2>

                <Tabs tabs={tabs} defaultIndex={activeIndex} onChange={(i) => setActiveIndex(i)}>
                    <Tabs.Panel index={0} activeIndex={activeIndex}>
                        <GeneralTab general={general} fonts={fonts} flash={flash} />
                    </Tabs.Panel>
                    <Tabs.Panel index={1} activeIndex={activeIndex}>
                        <SeoTab seo={seo} redirects={redirects} sitemapUrls={sitemapUrls} robotsUrl={robotsUrl} flash={flash} />
                    </Tabs.Panel>
                    <Tabs.Panel index={2} activeIndex={activeIndex}>
                        <FirebaseTab firebase={firebase} flash={flash} />
                    </Tabs.Panel>
                    <Tabs.Panel index={3} activeIndex={activeIndex}>
                        <AdvancedTab settingsByGroup={settingsByGroup} flash={flash} />
                    </Tabs.Panel>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
