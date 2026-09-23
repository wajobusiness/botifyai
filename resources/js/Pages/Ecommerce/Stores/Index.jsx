import { Head, useForm, usePage, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Eye, EyeOff, CheckCircle, AlertCircle, Clock, Trash2, RefreshCw,
    PlugZap, Copy, Check, ShoppingBag, Store, Zap, Key, ExternalLink,
    Info, ShieldCheck, ArrowRight,
} from 'lucide-react';

const PLATFORM_META = {
    shopify: {
        color: '#95BF47',
        Icon: ShoppingBag,
        domainLabel: 'Shop domain',
        domainPlaceholder: 'your-store.myshopify.com',
        oauthName: 'Shopify App (OAuth)',
        guide: [
            'In your Shopify admin, go to Settings → Apps and sales channels → Develop apps.',
            'Create an app, then under "API credentials" install it and reveal the Admin API access token.',
            'Grant read access to Orders, Customers and Checkouts (read_orders, read_customers).',
            'Paste the access token and your *.myshopify.com domain below.',
        ],
    },
    woocommerce: {
        color: '#96588A',
        Icon: Store,
        domainLabel: 'Store URL',
        domainPlaceholder: 'https://yourstore.com',
        oauthName: 'WooCommerce REST OAuth',
        guide: [
            'In WordPress admin, go to WooCommerce → Settings → Advanced → REST API.',
            'Add a key with Read/Write permissions.',
            'Copy the Consumer Key and Consumer Secret.',
            'Paste them with your store URL below.',
        ],
    },
    bigcommerce: {
        color: '#34313F',
        Icon: Store,
        domainLabel: 'Store Hash',
        domainPlaceholder: 'abcde1234',
        oauthName: 'BigCommerce App (OAuth)',
        guide: [
            'In your BigCommerce control panel, go to Settings → API → Store-level API accounts.',
            'Create an API account with read scopes for Orders, Customers, Carts, and Webhooks (modify).',
            'Copy the Access Token, and the Store Hash (the code in the API Path: api.bigcommerce.com/stores/{hash}/).',
            'Paste the Store Hash and Access Token below.',
        ],
    },
};

function StatusBadge({ store }) {
    const { t } = useTranslation();
    if (store.status === 'connected') {
        return (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                <CheckCircle className="h-3.5 w-3.5" /> {t('ecommerce.connected') || 'Connected'}
            </span>
        );
    }
    if (store.status === 'error') {
        return (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                <AlertCircle className="h-3.5 w-3.5" /> {t('ecommerce.error') || 'Error'}
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
            <Clock className="h-3.5 w-3.5" /> {t('ecommerce.pending') || 'Pending'}
        </span>
    );
}

function CopyField({ value }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <div className="flex items-center gap-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
            <code className="flex-1 truncate text-[11px] text-neutral-500 dark:text-neutral-400">{value}</code>
            <button type="button" onClick={copy} className="text-neutral-400 hover:text-neutral-600 shrink-0">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
        </div>
    );
}

function ConnectedStoreCard({ store }) {
    const { t } = useTranslation();
    const meta = PLATFORM_META[store.platform] ?? {};
    const Icon = meta.Icon ?? Store;
    const [busy, setBusy] = useState(null);

    const act = (name, verb) => {
        setBusy(verb);
        router.post(route(name, store.id), {}, {
            preserveScroll: true,
            onFinish: () => setBusy(null),
        });
    };

    const disconnect = () => {
        if (!confirm(t('ecommerce.confirm_disconnect') || 'Disconnect this store?')) return;
        router.delete(route('client.ecommerce.stores.destroy', store.id), { preserveScroll: true });
    };

    return (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 shadow-sm" style={{ backgroundColor: meta.color ?? '#6b7280' }}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">{store.name}</h3>
                        <p className="text-xs text-neutral-400 truncate">{store.domain}</p>
                    </div>
                </div>
                <StatusBadge store={store} />
            </div>

            {store.last_test_message && (
                <p className={`text-xs ${store.last_test_status === 'ok' ? 'text-neutral-500 dark:text-neutral-400' : 'text-red-500'}`}>
                    {store.last_test_message}
                </p>
            )}

            <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1.5 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between">
                    <span>{t('ecommerce.customers_synced') || 'Customers synced'}:</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{store.customers_synced_at ? new Date(store.customers_synced_at).toLocaleString() : '—'}</span>
                </div>
                <div className="flex justify-between">
                    <span>{t('ecommerce.orders_synced') || 'Orders synced'}:</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{store.orders_synced_at ? new Date(store.orders_synced_at).toLocaleString() : '—'}</span>
                </div>
                <div className="flex justify-between">
                    <span>{t('ecommerce.products_synced') || 'Products synced'}:</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{store.products_synced_at ? new Date(store.products_synced_at).toLocaleString() : '—'}</span>
                </div>
            </div>

            <div>
                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">{t('ecommerce.webhook_url') || 'Webhook URL'}</p>
                <CopyField value={store.webhook_url} />
            </div>

            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={() => act('client.ecommerce.stores.test', 'test')}
                    disabled={busy !== null}
                    className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60 transition"
                >
                    {busy === 'test' ? '…' : (t('ecommerce.test') || 'Test Connection')}
                </button>
                <button
                    type="button"
                    onClick={() => act('client.ecommerce.stores.sync', 'sync')}
                    disabled={busy !== null}
                    className="flex items-center justify-center gap-1.5 flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60 transition"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${busy === 'sync' ? 'animate-spin' : ''}`} />
                    {t('ecommerce.sync') || 'Sync Data'}
                </button>
                <button
                    type="button"
                    onClick={disconnect}
                    className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-neutral-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-900 transition"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function ConnectForm({ platforms, oauth = {}, isAdmin = false }) {
    const { t } = useTranslation();
    const [showSecrets, setShowSecrets] = useState({});
    const [platform, setPlatform] = useState(platforms[0]?.platform ?? 'shopify');
    const [connectMode, setConnectMode] = useState('oauth'); // 'oauth' | 'manual'
    const [oauthDomain, setOauthDomain] = useState('');

    const current = platforms.find(p => p.platform === platform) ?? platforms[0];
    const meta = PLATFORM_META[platform] ?? {};
    const oauthAvailable = !!oauth[platform];

    const { data, setData, post, processing, errors, reset } = useForm({
        platform,
        name: '',
        domain: '',
        credentials: {},
    });

    const changePlatform = (p) => {
        setPlatform(p);
        setData(d => ({ ...d, platform: p, credentials: {} }));
        setOauthDomain('');
    };

    const startOAuth = () => {
        const param = platform === 'shopify' ? 'shop' : 'store_url';
        if (!oauthDomain.trim()) return;
        window.location.href = route('client.ecommerce.oauth.connect', { platform }) + `?${param}=${encodeURIComponent(oauthDomain.trim())}`;
    };

    const submitManual = (e) => {
        e.preventDefault();
        post(route('client.ecommerce.stores.store'), {
            preserveScroll: true,
            onSuccess: () => reset('name', 'domain', 'credentials'),
        });
    };

    return (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                    <PlugZap className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        {t('ecommerce.connect_store') || 'Connect E-Commerce Store'}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('ecommerce.connect_store_hint') || 'Choose your e-commerce platform & connection method.'}
                    </p>
                </div>
            </div>

            {/* Platform Selection */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('ecommerce.select_platform', '1. Select Platform')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {platforms.map(p => {
                        const PIcon = (PLATFORM_META[p.platform] ?? {}).Icon ?? Store;
                        const active = p.platform === platform;
                        return (
                            <button
                                key={p.platform}
                                type="button"
                                onClick={() => changePlatform(p.platform)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                                    active
                                        ? 'border-brand-500 bg-brand-50/70 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                }`}
                            >
                                <PIcon className="h-5 w-5 mb-1.5" style={{ color: active ? undefined : (PLATFORM_META[p.platform]?.color || 'currentColor') }} />
                                <span>{p.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Connection Mode Selector (OAuth vs Manual API Token) */}
            <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('ecommerce.connection_method', '2. Connection Method')}
                </label>
                <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 text-xs">
                    <button
                        type="button"
                        onClick={() => setConnectMode('oauth')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition ${
                            connectMode === 'oauth'
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        {t('ecommerce.mode_oauth', '1-Click OAuth')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConnectMode('manual')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition ${
                            connectMode === 'manual'
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <Key className="h-3.5 w-3.5 text-blue-500" />
                        {t('ecommerce.mode_manual', 'Manual API Keys')}
                    </button>
                </div>
            </div>

            {/* ── MODE 1: OAUTH ── */}
            {connectMode === 'oauth' && (
                <div className="space-y-4 pt-1">
                    {platform === 'shopify' && (
                        <>
                            {oauthAvailable ? (
                                <div className="space-y-3">
                                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
                                        <p className="font-semibold flex items-center gap-1.5 mb-1">
                                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                            Shopify App (OAuth) Active
                                        </p>
                                        <p className="text-emerald-700 dark:text-emerald-400">
                                            Authorize your store in 1-click. You will be redirected to Shopify to approve the connection.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                            {meta.domainLabel || 'Shop Domain'} *
                                        </label>
                                        <input
                                            type="text"
                                            value={oauthDomain}
                                            onChange={e => setOauthDomain(e.target.value)}
                                            placeholder={meta.domainPlaceholder}
                                            className="mt-1 w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-brand-500/20"
                                        />
                                        <p className="mt-1 text-[11px] text-neutral-400">
                                            Example: <code className="text-neutral-600 dark:text-neutral-300">my-brand-store.myshopify.com</code>
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={startOAuth}
                                        disabled={!oauthDomain.trim()}
                                        className="w-full rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition hover:opacity-95 disabled:opacity-50"
                                        style={{ backgroundColor: meta.color ?? '#95BF47' }}
                                    >
                                        <ShoppingBag className="h-4 w-4" />
                                        Connect with Shopify OAuth
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                                        <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                                            <Info className="h-4 w-4 text-amber-600 shrink-0" />
                                            Shopify App (OAuth) Not Yet Configured
                                        </div>
                                        <p className="leading-relaxed text-amber-700 dark:text-amber-400">
                                            1-Click Shopify OAuth requires the platform administrator to configure the Shopify Partner App credentials.
                                        </p>
                                        <div className="pt-1 flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setConnectMode('manual')}
                                                className="px-3 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/60 font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-300 transition text-xs"
                                            >
                                                Use Manual API Token
                                            </button>
                                            {isAdmin && (
                                                <a
                                                    href="/admin/integrations/oauth_shopify"
                                                    className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition text-xs inline-flex items-center gap-1"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    Admin: Configure Shopify OAuth
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {platform === 'woocommerce' && (
                        <div className="space-y-3">
                            <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 p-3.5 text-xs text-purple-800 dark:text-purple-300">
                                <p className="font-semibold flex items-center gap-1.5 mb-1">
                                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                                    WooCommerce 1-Click OAuth Ready
                                </p>
                                <p className="text-purple-700 dark:text-purple-400">
                                    Enter your WordPress store URL. You will be redirected to your WooCommerce admin to approve read/write API access.
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                    {meta.domainLabel || 'Store URL'} *
                                </label>
                                <input
                                    type="url"
                                    value={oauthDomain}
                                    onChange={e => setOauthDomain(e.target.value)}
                                    placeholder={meta.domainPlaceholder}
                                    className="mt-1 w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-brand-500/20"
                                />
                                <p className="mt-1 text-[11px] text-neutral-400">
                                    Example: <code className="text-neutral-600 dark:text-neutral-300">https://myboutique.com</code>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={startOAuth}
                                disabled={!oauthDomain.trim()}
                                className="w-full rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition hover:opacity-95 disabled:opacity-50"
                                style={{ backgroundColor: meta.color ?? '#96588A' }}
                            >
                                <Store className="h-4 w-4" />
                                Connect with WooCommerce OAuth
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    {platform === 'bigcommerce' && (
                        <div className="space-y-3">
                            {oauthAvailable ? (
                                <div className="rounded-xl border border-brand-200 dark:border-brand-900/40 bg-brand-50/50 dark:bg-brand-900/10 p-4 text-xs text-neutral-700 dark:text-neutral-300 space-y-2">
                                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                        <Zap className="h-4 w-4 text-brand-600" />
                                        BigCommerce 1-Click App Install
                                    </p>
                                    <p className="leading-relaxed">
                                        Install the Botify app directly from your BigCommerce control panel (under <strong className="font-semibold text-neutral-900 dark:text-neutral-100">Apps → My Apps</strong>). Your store will be authorized and connected automatically upon installation.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                                        <Info className="h-4 w-4 text-amber-600 shrink-0" />
                                        BigCommerce OAuth Not Configured
                                    </div>
                                    <p className="leading-relaxed text-amber-700 dark:text-amber-400">
                                        Please switch to the <strong>Manual API Keys</strong> tab to connect using your BigCommerce Store Hash &amp; Access Token, or configure BigCommerce OAuth in Admin Integrations.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setConnectMode('manual')}
                                        className="px-3 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/60 font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-300 transition text-xs"
                                    >
                                        Use Manual API Token
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── MODE 2: MANUAL API CREDENTIALS ── */}
            {connectMode === 'manual' && (
                <form onSubmit={submitManual} className="space-y-3.5 pt-1">
                    <div>
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            {t('ecommerce.store_name') || 'Store Name'}
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder={current?.label}
                            className="mt-1 w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            {meta.domainLabel || 'Domain'} *
                        </label>
                        <input
                            type="text"
                            value={data.domain}
                            onChange={e => setData('domain', e.target.value)}
                            placeholder={meta.domainPlaceholder}
                            className="mt-1 w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400"
                        />
                        {errors.domain && <p className="mt-1 text-xs text-red-500">{errors.domain}</p>}
                    </div>

                    {(current?.fields ?? []).map(field => (
                        <div key={field.key}>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {field.label}{field.required && ' *'}
                            </label>
                            <div className="relative mt-1">
                                <input
                                    type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                                    value={data.credentials[field.key] ?? ''}
                                    onChange={e => setData('credentials', { ...data.credentials, [field.key]: e.target.value })}
                                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 pr-10 text-sm text-neutral-900 dark:text-white placeholder-neutral-400"
                                />
                                {field.type === 'password' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowSecrets(s => ({ ...s, [field.key]: !s[field.key] }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                    >
                                        {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                )}
                            </div>
                            {errors[`credentials.${field.key}`] && (
                                <p className="mt-1 text-xs text-red-500">{errors[`credentials.${field.key}`]}</p>
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-60 transition shadow-sm"
                    >
                        {processing ? (t('ecommerce.connecting') || 'Connecting…') : (t('ecommerce.connect') || 'Connect & Test')}
                    </button>

                    {meta.guide && (
                        <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 p-3.5 space-y-1.5">
                            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Setup Instructions:
                            </p>
                            <ol className="space-y-1">
                                {meta.guide.map((step, i) => (
                                    <li key={i} className="flex gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                                        <span className="shrink-0 font-medium text-brand-600 dark:text-brand-400">{i + 1}.</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}

export default function EcommerceStoresIndex({ stores = [], platforms = [], oauth = {} }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};
    const isAdmin = props.auth?.user?.role === 'admin' || !!props.auth?.user?.is_admin;

    return (
        <ClientLayout title={t('ecommerce.title') || 'E-Commerce'}>
            <Head title={t('ecommerce.title') || 'E-Commerce'} />
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        {t('ecommerce.title') || 'E-Commerce Stores'}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {t('ecommerce.subtitle') || 'Connect Shopify, WooCommerce, or BigCommerce via 1-Click OAuth or API keys to sync customers, track orders, and automate messaging.'}
                    </p>
                </div>

                {flash.success && (
                    <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-300 px-4 py-3 text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 px-4 py-3 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2 content-start">
                        {stores.length === 0 && (
                            <div className="col-span-2 p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-2">
                                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 w-fit mx-auto">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                                    {t('ecommerce.no_stores') || 'No stores connected yet.'}
                                </h4>
                                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                                    Use the connection panel to connect your Shopify, WooCommerce, or BigCommerce store in 1-click.
                                </p>
                            </div>
                        )}
                        {stores.map(s => <ConnectedStoreCard key={s.id} store={s} />)}
                    </div>
                    <div>
                        <ConnectForm platforms={platforms} oauth={oauth} isAdmin={isAdmin} />
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
