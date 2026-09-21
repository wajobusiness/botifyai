import { Head } from '@inertiajs/react';
import {
    CheckCircle, Download, ExternalLink, ShieldCheck,
    Clock, Mail, ArrowRight, Sparkles, FileText, MessageCircle,
} from 'lucide-react';

function currencySymbol(code) {
    const symbols = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
    return symbols[code] || code || '₦';
}

export default function OrderReceipt({ order = {}, store = {}, downloads = [] }) {
    const sym = currencySymbol(order.currency);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between antialiased">
            <Head title={`Receipt for Order ${order.number} | ${store.name || 'BotifyAI'}`} />

            <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16 w-full flex-1">
                {/* Success Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-10 shadow-lg text-center">
                    <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-10 w-10" />
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                        Payment Successful!
                    </h1>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        Thank you, <span className="font-semibold text-neutral-800 dark:text-neutral-200">{order.customer_name}</span>.
                        Your purchase is complete and your digital assets are ready below.
                    </p>

                    {/* Order Metadata Pill */}
                    <div className="mt-6 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between text-xs gap-3">
                        <div className="text-left">
                            <span className="text-neutral-400 block">Order Number</span>
                            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{order.number}</span>
                        </div>
                        <div className="text-left">
                            <span className="text-neutral-400 block">Total Paid</span>
                            <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                                {sym}{Number(order.total || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="text-left">
                            <span className="text-neutral-400 block">Delivery Email</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">{order.customer_email}</span>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle className="h-2.5 w-2.5" /> Sent
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Digital Vault Downloads */}
                    <div className="mt-8 text-left">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-teal-600" />
                                <span>Your Digital Vault</span>
                            </h2>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Here is my receipt and digital product download for Order #${order.number}: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-xs font-medium hover:bg-green-100 transition"
                            >
                                <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                                <span>Send to WhatsApp</span>
                            </a>
                        </div>

                        <div className="space-y-3">
                            {downloads.length === 0 && (
                                <p className="text-sm text-neutral-400 italic">No files available for download.</p>
                            )}
                            {downloads.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-2xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 flex items-center justify-center shrink-0">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                                {item.product_name}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                                                {item.file_name && <span>{item.file_name}</span>}
                                                {item.file_size && <span>• {item.file_size}</span>}
                                                <span className="text-teal-600 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {item.download_count} of {item.max_downloads} downloads used
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {item.can_download ? (
                                            <a
                                                href={item.download_url}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition active:scale-95 w-full sm:w-auto"
                                            >
                                                {item.asset_type === 'redirect_url' ? (
                                                    <>
                                                        <span>Access Resource</span>
                                                        <ExternalLink className="h-4 w-4" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4" />
                                                        <span>Download File</span>
                                                    </>
                                                )}
                                            </a>
                                        ) : (
                                            <span className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-lg">
                                                Download Link Expired
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support note */}
                    <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-neutral-400" />
                            <span>A copy of this receipt has been emailed to you.</span>
                        </div>
                        {store.support_email && (
                            <div>
                                Need help?{' '}
                                <a href={`mailto:${store.support_email}`} className="text-teal-600 font-semibold hover:underline">
                                    Contact {store.name}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400">
                <p>
                    Powered by{' '}
                    <a href="https://botifyai.cloud" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-600">
                        BotifyAI Commerce
                    </a>
                </p>
            </footer>
        </div>
    );
}

