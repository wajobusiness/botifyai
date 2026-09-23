import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    Store, ShoppingBag, Sparkles, Search, Lock,
    Globe, Coins, ArrowRight, ShieldCheck, Zap,
    CheckCircle2, Mail, Phone, ExternalLink, ChevronDown,
    Layers, Tag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import Dropdown from '@/Components/ui/Dropdown';
import CommerceChatDrawer from '@/Components/CommerceChatDrawer';

export default function Storefront({ store = {}, products = [], header_pixels_html = '' }) {
    const { t } = useTranslation();
    const { locale: currentLocale, setLocale } = useLocale();
    const page = usePage();

    const supportedLocales = page.props.supportedLocales ?? { en: 'English' };
    const localeEntries = Object.entries(supportedLocales);
    const currencies = page.props.currencies ?? [
        { code: 'NGN', symbol: '₦', decimals: 2, exchange_rate: 1 },
        { code: 'USD', symbol: '$', decimals: 2, exchange_rate: 0.00065 },
        { code: 'EUR', symbol: '€', decimals: 2, exchange_rate: 0.00060 },
        { code: 'GBP', symbol: '£', decimals: 2, exchange_rate: 0.00052 },
    ];
    const initialCurrency = page.props.displayCurrency ?? store.currency ?? 'NGN';
    const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [activePolicyModal, setActivePolicyModal] = useState(null);

    const handleCurrencyChange = (code) => {
        setSelectedCurrency(code);
        router.put(route('currency.update'), { currency: code }, { preserveScroll: true });
    };

    // Calculate dynamic converted price
    const formatPrice = (price, baseCurrency = 'NGN') => {
        const baseCur = baseCurrency || 'NGN';
        const targetCur = selectedCurrency || baseCur;

        const baseCurObj = currencies.find((c) => c.code === baseCur);
        const targetCurObj = currencies.find((c) => c.code === targetCur);

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

    // Filter products by search and type
    const productTypes = useMemo(() => {
        const types = new Set();
        products.forEach((p) => {
            if (p.product_type) types.add(p.product_type);
        });
        return ['all', ...Array.from(types)];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesType = selectedType === 'all' || p.product_type === selectedType;

            return matchesSearch && matchesType;
        });
    }, [products, searchQuery, selectedType]);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between antialiased">
            <Head>
                <title>{`${store.name || 'Store'} - Official Digital Catalog & Storefront`}</title>
                {store.seo_meta?.meta_description && (
                    <meta name="description" content={store.seo_meta.meta_description} />
                )}
            </Head>

            {/* Server-Side Marketing Pixels Injection */}
            {header_pixels_html && (
                <div dangerouslySetInnerHTML={{ __html: header_pixels_html }} />
            )}

            {/* Top Navigation Bar */}
            <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    {/* Store Logo / Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden shrink-0 border border-teal-500/30">
                            {store.logo_url ? (
                                <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                (store.name || 'S')[0]?.toUpperCase()
                            )}
                        </div>
                        <div className="min-w-0">
                            <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100 truncate block">
                                {store.name || 'BotifyAI Store'}
                            </span>
                        </div>
                    </div>

                    {/* Multi-Language & Multi-Currency Switchers */}
                    <div className="flex items-center gap-2">
                        {/* Currency Switcher */}
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

                        {/* Language Switcher */}
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

            {/* Store Hero Banner */}
            <section className="relative bg-gradient-to-b from-teal-900 via-teal-950 to-neutral-950 text-white pt-12 pb-16 px-4 overflow-hidden">
                <div
                    className="absolute inset-0 opacity-15 bg-center bg-cover"
                    style={{
                        backgroundImage: store.banner_url ? `url(${store.banner_url})` : undefined,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-black/40" />

                <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-neutral-800 p-1 shadow-2xl border-2 border-teal-400/40 shrink-0">
                            {store.logo_url ? (
                                <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 flex items-center justify-center text-white text-3xl font-extrabold shadow-inner">
                                    {(store.name || 'S')[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    {store.name || 'Digital Storefront'}
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 backdrop-blur-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Verified Merchant
                                </span>
                            </div>

                            <p className="text-sm text-neutral-300 max-w-xl line-clamp-2 leading-relaxed">
                                {store.description || 'Welcome to our verified digital storefront. Explore our premium digital downloads, software tools, and courses with instant access upon purchase.'}
                            </p>

                            {/* Trust Highlights */}
                            <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-teal-200/80">
                                <span className="flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5 text-teal-400" /> Instant Digital Delivery
                                </span>
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Verified Escrow
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Store Policy Quick Buttons */}
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        {store.policies?.refund_policy && (
                            <button
                                type="button"
                                onClick={() => setActivePolicyModal('refund')}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm transition"
                            >
                                Refund Policy
                            </button>
                        )}
                        {store.policies?.delivery_terms && (
                            <button
                                type="button"
                                onClick={() => setActivePolicyModal('delivery')}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm transition"
                            >
                                Delivery Terms
                            </button>
                        )}
                        {store.support_email && (
                            <a
                                href={`mailto:${store.support_email}`}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm transition flex items-center gap-1"
                            >
                                <Mail className="w-3 h-3" /> Contact Support
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* Catalog Showcase Section */}
            <main className="max-w-6xl mx-auto px-4 py-10 w-full flex-1 space-y-8">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search store products..."
                            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    {/* Product Type Filter Pills */}
                    {productTypes.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                            {productTypes.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSelectedType(type)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition ${
                                        selectedType === type
                                            ? 'bg-teal-600 text-white shadow-sm'
                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                    }`}
                                >
                                    {type === 'all' ? 'All Products' : type}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="py-16 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
                        <ShoppingBag className="w-12 h-12 text-neutral-400 mx-auto mb-3 opacity-60" />
                        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">No products found</h3>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                            {searchQuery ? `No products matching "${searchQuery}". Try a different keyword.` : 'This store has not published any products yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/* Cover Image / Gradient */}
                                    <div className="relative aspect-[16/10] bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-teal-600/80 to-teal-900 flex items-center justify-center p-6 text-white text-center">
                                                <Sparkles className="w-10 h-10 opacity-70" />
                                            </div>
                                        )}

                                        {/* Product Type Tag */}
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 capitalize flex items-center gap-1">
                                                <Tag className="w-3 h-3 text-teal-400" /> {product.product_type || 'Digital Product'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-5 space-y-2">
                                        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition line-clamp-1">
                                            {product.name}
                                        </h3>

                                        {product.description && (
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                                                {product.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Pricing & Buy Action */}
                                <div className="p-5 pt-0">
                                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-lg font-extrabold text-teal-600 dark:text-teal-400">
                                                {formatPrice(product.price, product.currency)}
                                            </div>
                                            {product.compare_at_price && (
                                                <div className="text-xs text-neutral-400 line-through">
                                                    {formatPrice(product.compare_at_price, product.currency)}
                                                </div>
                                            )}
                                        </div>

                                        <a
                                            href={product.checkout_url}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white shadow-sm transition"
                                        >
                                            Buy Now <ArrowRight className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Policy Modals */}
            {activePolicyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 capitalize">
                                {activePolicyModal === 'refund' ? 'Refund & Guarantee Policy' : 'Digital Delivery Terms'}
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
                                : (store.policies?.delivery_terms || 'Digital download tokens and receipt links are issued instantly upon successful payment verification.')}
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
            <footer className="py-8 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 space-y-2">
                <p>
                    © {new Date().getFullYear()} {store.name || 'Merchant'}. All rights reserved.
                </p>
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
                    — Autonomous AI Commerce & Omnichannel Sales.
                </p>
            </footer>

            {/* Embedded Conversational AI Sales Agent */}
            <CommerceChatDrawer store={store} />
        </div>
    );
}
