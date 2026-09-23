import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import {
    ShieldCheck, Zap, Download, Lock, CheckCircle2,
    AlertCircle, Sparkles, MessageCircle, CreditCard,
    Store, Globe, Coins, ArrowRight, ChevronDown, ExternalLink,
    HelpCircle, FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import Dropdown from '@/Components/ui/Dropdown';
import axios from 'axios';
import CommerceChatDrawer from '@/Components/CommerceChatDrawer';

export default function ProductCheckout(props = {}) {
    const product = props?.product || {};
    const store = props?.store || {};
    const gateways = Array.isArray(props?.gateways) ? props.gateways : [];
    const header_pixels_html = props?.header_pixels_html || '';

    const { t } = useTranslation();
    const { locale: currentLocale, setLocale } = useLocale();
    const page = usePage();

    const supportedLocales = page.props?.supportedLocales ?? { en: 'English' };
    const localeEntries = Object.entries(supportedLocales);
    const currencies = Array.isArray(page.props?.currencies) && page.props.currencies.length > 0
        ? page.props.currencies
        : [
            { code: 'NGN', symbol: '₦', decimals: 2, exchange_rate: 1 },
            { code: 'USD', symbol: '$', decimals: 2, exchange_rate: 0.00065 },
            { code: 'EUR', symbol: '€', decimals: 2, exchange_rate: 0.00060 },
            { code: 'GBP', symbol: '£', decimals: 2, exchange_rate: 0.00052 },
        ];
    const initialCurrency = page.props?.displayCurrency ?? product?.currency ?? 'NGN';
    const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);

    const [form, setForm] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        gateway: gateways[0]?.id || 'paystack',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pendingOrderUuid, setPendingOrderUuid] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [activePolicyModal, setActivePolicyModal] = useState(null);

    const storeUrl = store?.store_url || (store?.slug ? `/store/${store.slug}` : (store?.uuid ? `/store/${store.uuid}` : '#'));

    const handleCurrencyChange = (code) => {
        setSelectedCurrency(code);
        router.put('/currency', { currency: code }, { preserveScroll: true });
    };

    // Calculate dynamic converted price
    const formatPrice = (price, baseCurrency = 'NGN') => {
        if (price === undefined || price === null || isNaN(Number(price))) {
            return '';
        }
        const baseCur = baseCurrency || 'NGN';
        const targetCur = selectedCurrency || baseCur;

        const baseCurObj = (currencies || []).find((c) => c?.code === baseCur);
        const targetCurObj = (currencies || []).find((c) => c?.code === targetCur);

        let convertedAmount = Number(price);
        if (baseCur !== targetCur && baseCurObj?.exchange_rate && targetCurObj?.exchange_rate) {
            const amountInRef = Number(price) * (baseCurObj.exchange_rate || 1);
            convertedAmount = amountInRef / (targetCurObj.exchange_rate || 1);
        }

        const sym = targetCurObj?.symbol || targetCur;
        const decimals = targetCurObj?.decimals ?? (targetCur === 'NGN' ? 0 : 2);

        return `${sym}${convertedAmount.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}`;
    };

    const isDifferentCurrency = (selectedCurrency || '').toUpperCase() !== (product?.currency || 'NGN').toUpperCase();

    useEffect(() => {
        if (!pendingOrderUuid || !isPolling) return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`/buy/orders/${pendingOrderUuid}/status`);
                if (res.data?.is_paid && res.data?.receipt_url) {
                    clearInterval(interval);
                    window.location.href = res.data.receipt_url;
                }
            } catch (err) {
                // Ignore polling errors while payment is completing
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [pendingOrderUuid, isPolling]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await axios.post(`/buy/${product.slug || product.id}/checkout`, form);
            if (res.data?.url) {
                if (res.data?.order_uuid) {
                    setPendingOrderUuid(res.data.order_uuid);
                    setIsPolling(true);
                }
                window.location.href = res.data.url;
            } else {
                setError('Could not initialize payment session.');
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Payment initialization failed. Please try again.';
            setError(msg);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between antialiased">
            <Head>
                <title>{`Buy ${product.name} | ${store.name || 'BotifyAI Store'}`}</title>
                {product.description && (
                    <meta name="description" content={product.description.slice(0, 160)} />
                )}
            </Head>

            {/* Server-Side Marketing Pixels Injection */}
            {header_pixels_html && (
                <div dangerouslySetInnerHTML={{ __html: header_pixels_html }} />
            )}

            {/* Top Navigation Bar */}
            <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    {/* Seller Store Link */}
                    <a
                        href={storeUrl}
                        className="flex items-center gap-2.5 group hover:opacity-85 transition min-w-0"
                        title="View seller's store catalog"
                    >
                        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-xs shadow-sm overflow-hidden shrink-0 border border-teal-500/30">
                            {store.logo_url ? (
                                <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                (store.name || 'S')[0]?.toUpperCase()
                            )}
                        </div>
                        <div className="min-w-0">
                            <span className="font-bold text-sm sm:text-base tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition truncate block">
                                {store.name || 'BotifyAI Store'}
                            </span>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800/60 shrink-0">
                            <Store className="w-3 h-3" /> Visit Store
                        </span>
                    </a>

                    {/* Multi-Currency & Multi-Language Controls */}
                    <div className="flex items-center gap-2">
                        {/* Currency Selector */}
                        {currencies.length > 0 && (
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 transition"
                                        aria-label="Select Currency"
                                    >
                                        <Coins className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                        <span>{selectedCurrency}</span>
                                        <ChevronDown className="h-3 w-3 text-neutral-400" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="48">
                                    {currencies.map((c) => (
                                        <Dropdown.Item
                                            key={c.code}
                                            as="button"
                                            onClick={() => handleCurrencyChange(c.code)}
                                            className={selectedCurrency === c.code ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 font-semibold' : ''}
                                        >
                                            <span className="font-bold mr-1.5">{c.symbol}</span>
                                            <span>{c.code}</span>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Content>
                            </Dropdown>
                        )}

                        {/* Language Selector */}
                        {localeEntries.length > 1 && (
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 transition"
                                        aria-label="Select Language"
                                    >
                                        <Globe className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                        <span>{currentLocale.toUpperCase()}</span>
                                        <ChevronDown className="h-3 w-3 text-neutral-400" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="48">
                                    {localeEntries.map(([code, label]) => (
                                        <Dropdown.Item
                                            key={code}
                                            as="button"
                                            onClick={() => setLocale(code)}
                                            className={currentLocale === code ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 font-semibold' : ''}
                                        >
                                            {label}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Content>
                            </Dropdown>
                        )}

                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 border-l border-neutral-200 dark:border-neutral-800 pl-3">
                            <Lock className="h-3.5 w-3.5 text-teal-600" />
                            <span>SSL Secure</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Checkout Container */}
            <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Product Summary & Seller Card */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Main Product Card */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-56 sm:h-72 object-cover bg-neutral-100 dark:bg-neutral-800"
                                />
                            ) : (
                                <div className="w-full h-44 bg-gradient-to-br from-teal-600 to-teal-900 flex items-center justify-center p-6 text-white text-center">
                                    <div>
                                        <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-80" />
                                        <h2 className="text-xl font-bold">{product.name}</h2>
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                                        ⚡ Instant Digital Delivery
                                    </span>
                                    {product.product_type && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 capitalize">
                                            {product.product_type}
                                        </span>
                                    )}
                                    {product.file_name && (
                                        <span className="text-xs text-neutral-400">
                                            ({product.file_name} • {product.file_size})
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                                    {product.name}
                                </h1>

                                {/* Price Display with Converted Currency */}
                                <div className="mt-4 flex flex-wrap items-baseline gap-3">
                                    <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                                        {formatPrice(product.price, product.currency)}
                                    </span>

                                    {isDifferentCurrency && (
                                        <span className="text-xs text-neutral-400 font-medium">
                                            (Base: {product.currency || 'NGN'} {Number(product.price).toLocaleString()})
                                        </span>
                                    )}

                                    {product.compare_at_price && (
                                        <span className="text-base text-neutral-400 line-through">
                                            {formatPrice(product.compare_at_price, product.currency)}
                                        </span>
                                    )}
                                </div>

                                {product.description && (
                                    <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                                        {product.description}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dedicated Seller Store Profile Box */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-lg border border-teal-100 dark:border-teal-800 shrink-0">
                                    {store.logo_url ? (
                                        <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        (store.name || 'S')[0]?.toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                        Sold & Verified By
                                    </div>
                                    <a
                                        href={storeUrl}
                                        className="text-sm font-bold text-neutral-900 dark:text-neutral-100 hover:text-teal-600 dark:hover:text-teal-400 transition truncate block"
                                    >
                                        {store.name || 'BotifyAI Verified Seller'}
                                    </a>
                                </div>
                            </div>

                            <a
                                href={storeUrl}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition flex items-center justify-center gap-1.5 shrink-0"
                            >
                                <Store className="w-3.5 h-3.5" /> View Store Catalog <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>

                        {/* Value Props / Trust Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
                                <Zap className="h-4 w-4 text-teal-600 shrink-0" />
                                <span>Immediate Download Link</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
                                <MessageCircle className="h-4 w-4 text-green-600 shrink-0" />
                                <span>Backup sent to WhatsApp</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
                                <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                                <span>256-Bit Escrow Security</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Checkout Form */}
                    <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-md sticky top-20">
                        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-5">
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                Complete Your Purchase
                            </h2>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                Enter your details below for instant delivery.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Jane Doe"
                                    value={form.customer_name}
                                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Email Address (For Download Link) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="jane@example.com"
                                    value={form.customer_email}
                                    onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    WhatsApp Phone (Optional Backup)
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+234 801 234 5678"
                                    value={form.customer_phone}
                                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                                />
                            </div>

                            {/* Payment Gateway Selector */}
                            <div className="pt-2">
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                                    Payment Method
                                </label>
                                <div className="space-y-2">
                                    {gateways.map((g) => (
                                        <label
                                            key={g.id}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                                form.gateway === g.id
                                                    ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-900/20 ring-2 ring-teal-500/20'
                                                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="gateway"
                                                    value={g.id}
                                                    checked={form.gateway === g.id}
                                                    onChange={() => setForm({ ...form, gateway: g.id })}
                                                    className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                                                />
                                                <div>
                                                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{g.name}</p>
                                                    <p className="text-[11px] text-neutral-500">{g.description}</p>
                                                </div>
                                            </div>
                                            <CreditCard className="h-4 w-4 text-neutral-400" />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Lock className="h-4 w-4" />
                                    <span>
                                        {loading ? 'Processing...' : `Pay ${formatPrice(product.price, product.currency)} Now`}
                                    </span>
                                </button>
                                <p className="text-center text-[11px] text-neutral-400 mt-2.5 flex items-center justify-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                                    <span>Instant receipt & access sent immediately.</span>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* Policy Modals */}
            {activePolicyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 capitalize">
                                {activePolicyModal === 'refund' ? 'Refund Policy' : 'Delivery Terms'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActivePolicyModal(null)}
                                className="text-neutral-400 hover:text-neutral-600 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">
                            {activePolicyModal === 'refund'
                                ? (store.policies?.refund_policy || 'All digital purchases are covered by our standard customer satisfaction guarantee.')
                                : (store.policies?.delivery_terms || 'Digital download tokens and receipt links are issued instantly upon payment.')}
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setActivePolicyModal(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="py-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 space-y-2">
                <div className="flex items-center justify-center gap-4 text-xs text-neutral-500 flex-wrap">
                    {store.policies?.refund_policy && (
                        <button
                            type="button"
                            onClick={() => setActivePolicyModal('refund')}
                            className="hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline"
                        >
                            Refund Policy
                        </button>
                    )}
                    {store.policies?.delivery_terms && (
                        <button
                            type="button"
                            onClick={() => setActivePolicyModal('delivery')}
                            className="hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline"
                        >
                            Delivery Terms
                        </button>
                    )}
                    <a
                        href={storeUrl}
                        className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                        {store.name || 'Store Catalog'}
                    </a>
                </div>
                <p>
                    Powered by{' '}
                    <a
                        href="https://botifyai.cloud"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-teal-600 hover:underline"
                    >
                        BotifyAI Commerce
                    </a>{' '}
                    — Sell digital products directly in chat & social media.
                </p>
            </footer>

            {/* Embedded Conversational AI Assistant */}
            <CommerceChatDrawer product={product} store={store} />
        </div>
    );
}
