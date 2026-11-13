import ClientLayout from '@/Layouts/ClientLayout';
import { Button } from '@/Components/ui';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Bell, Download, PlugZap, MessageSquare, Mail, ExternalLink } from 'lucide-react';
import { browserTz } from '@/Utils/datetime';
import TimezonePicker from '@/Components/TimezonePicker';

export default function ClientSettingsIndex({
    preferences = {},
    supportedLocales = [],
    supportedCurrencies = [],
    client = null,
    digestEnabled = true,
}) {
    const { t } = useTranslation();
    const { flash = {} } = usePage().props;
    const form = useForm({
        locale: preferences.locale ?? 'en',
        display_currency: preferences.display_currency ?? 'USD',
        theme: preferences.theme ?? 'light',
        timezone: preferences.timezone ?? browserTz() ?? 'Asia/Dhaka',
        client_name: client?.name ?? '',
        client_email: client?.email ?? '',
        client_phone: client?.phone ?? '',
        client_address: client?.address ?? '',
        weekly_digest_enabled: digestEnabled,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.put(route('client.settings.update'));
    };

    return (
        <ClientLayout title={t('settings.page_title') || 'Settings'}>
            <Head title={t('settings.page_title') || 'Settings'} />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {t('settings.page_title') || 'Settings'}
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {t('client.settings_subtitle') || 'Preferences and organization'}
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-3 text-sm">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            {t('client.preferences') || 'Preferences'}
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('client.language') || 'Language'}
                                </label>
                                <select
                                    value={form.data.locale}
                                    onChange={e => form.setData('locale', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                >
                                    {supportedLocales.map((l) => (
                                        <option key={l.code} value={l.code}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('client.display_currency') || 'Display currency'}
                                </label>
                                <select
                                    value={form.data.display_currency}
                                    onChange={e => form.setData('display_currency', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                >
                                    {supportedCurrencies.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.code} {c.symbol ? `(${c.symbol})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('client.theme') || 'Theme'}
                                </label>
                                <select
                                    value={form.data.theme}
                                    onChange={e => form.setData('theme', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                >
                                    <option value="light">{t('client.theme_light') || 'Light'}</option>
                                    <option value="dark">{t('client.theme_dark') || 'Dark'}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('settings.timezone')}
                                </label>
                                <TimezonePicker
                                    value={form.data.timezone}
                                    onChange={tz => form.setData('timezone', tz)}
                                />
                                {form.errors.timezone && <p className="mt-1 text-xs text-red-500">{form.errors.timezone}</p>}
                                <p className="mt-1 text-xs text-neutral-400">{t('settings.timezone_hint')}</p>
                            </div>
                        </div>
                    </div>

                    {client && (
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                {t('client.organization') || 'Organization'}
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('client.organization_name') || 'Organization name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.client_name}
                                        onChange={e => form.setData('client_name', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('client.organization_email') || 'Email'}
                                    </label>
                                    <input
                                        type="email"
                                        value={form.data.client_email}
                                        onChange={e => form.setData('client_email', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('client.phone') || 'Phone'}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.client_phone}
                                        onChange={e => form.setData('client_phone', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('client.address') || 'Address'}
                                    </label>
                                    <textarea
                                        value={form.data.client_address}
                                        onChange={e => form.setData('client_address', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Digest */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 sm:p-5">
                        <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide mb-3">{t('settings.email_reports')}</h3>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!form.data.weekly_digest_enabled}
                                onChange={e => form.setData('weekly_digest_enabled', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                            />
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                {t('settings.weekly_digest_label')}
                            </span>
                        </label>
                    </div>

                    {(
                        <Button type="submit" variant="primary" disabled={form.processing}>
                            {t('client.save_settings') || 'Save settings'}
                        </Button>
                    )}
                </form>

                {/* Delivery Channels & Integrations */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                        <PlugZap className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        Channels & Message Delivery
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Connect and configure your outbound communication channels for WhatsApp, Facebook, Instagram, SMS, and Email broadcasts.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        <Link
                            href={route('client.inbox.setup')}
                            className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-brand-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center font-bold">
                                    <PlugZap className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Social & Chat</p>
                                    <p className="text-[11px] text-neutral-400">WhatsApp, Messenger, IG</p>
                                </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-neutral-300 group-hover:text-brand-600 transition" />
                        </Link>

                        <Link
                            href={route('client.sms-gateways.index')}
                            className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-brand-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">SMS Gateways</p>
                                    <p className="text-[11px] text-neutral-400">Twilio, Termii, Vonage</p>
                                </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-neutral-300 group-hover:text-brand-600 transition" />
                        </Link>

                        <Link
                            href={route('client.email-server.index')}
                            className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-brand-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Email Server</p>
                                    <p className="text-[11px] text-neutral-400">SMTP, Gmail, SendGrid</p>
                                </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-neutral-300 group-hover:text-brand-600 transition" />
                        </Link>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
                    <Link
                        href={route('client.settings.notifications')}
                        className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                        <Bell className="h-4 w-4" />
                        {t('settings.manage_notifications_link')} →
                    </Link>
                    <Link
                        href={route('client.settings.data-export')}
                        className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                        <Download className="h-4 w-4" />
                        {t('settings.export_data_link')} →
                    </Link>
                </div>
            </div>
        </ClientLayout>
    );
}
