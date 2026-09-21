import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    ShieldCheck, Zap, Download, Lock, CheckCircle2,
    AlertCircle, Sparkles, MessageCircle, CreditCard,
} from 'lucide-react';
import axios from 'axios';

function currencySymbol(code) {
    const symbols = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
    return symbols[code] || code || '₦';
}

export default function ProductCheckout({ product, store = {}, gateways = [] }) {
    const sym = currencySymbol(product.currency);

    const [form, setForm] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        gateway: gateways[0]?.id || 'paystack',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await axios.post(`/buy/${product.slug || product.id}/checkout`, form);
            if (res.data?.url) {
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
            <Head title={`Buy ${product.name} | ${store.name || 'BotifyAI'}`} />

            {/* Top Bar */}
            <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
                            {store.name || 'BotifyAI Store'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Lock className="h-3.5 w-3.5 text-teal-600" />
                        <span>256-Bit SSL Encrypted</span>
                    </div>
                </div>
            </header>

            {/* Main Checkout Container */}
            <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Product Summary */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-56 sm:h-72 object-cover bg-neutral-100 dark:bg-neutral-800"
                                />
                            ) : (
                                <div className="w-full h-44 bg-gradient-to-br from-teal-500 to-teal-800 flex items-center justify-center p-6 text-white text-center">
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
                                    {product.file_name && (
                                        <span className="text-xs text-neutral-400">
                                            ({product.file_name} • {product.file_size})
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                                    {product.name}
                                </h1>

                                <div className="mt-4 flex items-baseline gap-3">
                                    <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                                        {sym}{Number(product.price).toLocaleString()}
                                    </span>
                                    {product.compare_at_price && (
                                        <span className="text-base text-neutral-400 line-through">
                                            {sym}{Number(product.compare_at_price).toLocaleString()}
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

                        {/* Value Props / Trust Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
                                <Zap className="h-4 w-4 text-teal-600 shrink-0" />
                                <span>Immediate Access upon Payment</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
                                <MessageCircle className="h-4 w-4 text-green-600 shrink-0" />
                                <span>Backup sent to your WhatsApp</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
                                <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                                <span>Secure Verified Processing</span>
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
                                Enter your details to receive instant access.
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
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Payment Method
                                </label>
                                <div className="space-y-2">
                                    {gateways.map((g) => (
                                        <label
                                            key={g.id}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                                form.gateway === g.id
                                                    ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-900/20'
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
                                    className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Lock className="h-4 w-4" />
                                    <span>
                                        {loading ? 'Processing...' : `Pay ${sym}${Number(product.price).toLocaleString()} Now`}
                                    </span>
                                </button>
                                <p className="text-center text-[11px] text-neutral-400 mt-2 flex items-center justify-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                                    <span>Instant receipt & access sent immediately.</span>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* Viral Footer */}
            <footer className="py-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400">
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
        </div>
    );
}

