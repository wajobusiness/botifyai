import { Head, router, usePage, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, RefreshCw, PackageCheck, MessageCircle, User,
    ShieldCheck, Download, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';

export default function OrderShow({ order }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};
    const [busy, setBusy] = useState(null);
    const [tracking, setTracking] = useState({ number: order.tracking_number ?? '', url: order.tracking_url ?? '' });
    const [showFulfill, setShowFulfill] = useState(false);

    const refresh = () => {
        setBusy('refresh');
        router.post(route('client.ecommerce.orders.refresh', order.id), {}, { preserveScroll: true, onFinish: () => setBusy(null) });
    };

    const fulfill = (e) => {
        e.preventDefault();
        setBusy('fulfill');
        router.post(route('client.ecommerce.orders.fulfill', order.id),
            { tracking_number: tracking.number || null, tracking_url: tracking.url || null },
            { preserveScroll: true, onFinish: () => { setBusy(null); setShowFulfill(false); } });
    };

    const isFulfilled = order.fulfillment_status === 'fulfilled';

    return (
        <ClientLayout title={`${t('ecommerce.order') || 'Order'} ${order.number}`}>
            <Head title={`Order ${order.number}`} />
            <div className="max-w-4xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('client.ecommerce.orders.index')} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{order.number}</h2>
                        <p className="text-sm text-neutral-500">{order.store?.name} · {order.placed_at ? new Date(order.placed_at).toLocaleString() : ''}</p>
                    </div>
                    <button onClick={refresh} disabled={busy !== null}
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60">
                        <RefreshCw className={`h-4 w-4 ${busy === 'refresh' ? 'animate-spin' : ''}`} /> {t('ecommerce.refresh') || 'Refresh'}
                    </button>
                    {!isFulfilled && (
                        <button onClick={() => setShowFulfill(v => !v)}
                            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                            <PackageCheck className="h-4 w-4" /> {t('ecommerce.mark_fulfilled') || 'Mark fulfilled'}
                        </button>
                    )}
                </div>

                {flash.success && <div className="rounded-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">{flash.success}</div>}
                {flash.error && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 text-sm">{flash.error}</div>}

                {showFulfill && (
                    <form onSubmit={fulfill} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{t('ecommerce.fulfill_order') || 'Fulfill order'}</p>
                        <p className="text-xs text-neutral-500">{t('ecommerce.fulfill_hint') || 'Pushes a fulfillment/shipped status to the store. The store webhook will confirm and may trigger your shipping automation.'}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input value={tracking.number} onChange={e => setTracking(s => ({ ...s, number: e.target.value }))} placeholder={t('ecommerce.tracking_number') || 'Tracking number (optional)'}
                                className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" />
                            <input value={tracking.url} onChange={e => setTracking(s => ({ ...s, url: e.target.value }))} placeholder={t('ecommerce.tracking_url') || 'Tracking URL (optional)'}
                                className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm" />
                        </div>
                        <button type="submit" disabled={busy === 'fulfill'} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
                            {busy === 'fulfill' ? (t('ecommerce.fulfilling') || 'Fulfilling…') : (t('ecommerce.confirm_fulfill') || 'Confirm fulfillment')}
                        </button>
                    </form>
                )}

                <div className="grid gap-5 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-5">
                        {/* Line Items Table */}
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs uppercase">
                                    <tr>
                                        <th className="text-left font-medium px-4 py-2.5">{t('ecommerce.item') || 'Item'}</th>
                                        <th className="text-center font-medium px-4 py-2.5">{t('ecommerce.qty') || 'Qty'}</th>
                                        <th className="text-right font-medium px-4 py-2.5">{t('ecommerce.price') || 'Price'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {(order.line_items ?? []).length === 0 && (
                                        <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-400">{t('ecommerce.no_items') || 'No line items.'}</td></tr>
                                    )}
                                    {(order.line_items ?? []).map((it, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2.5 text-neutral-800 dark:text-neutral-200">{it.name || it.title}</td>
                                            <td className="px-4 py-2.5 text-center text-neutral-500">{it.quantity}</td>
                                            <td className="px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-300">{it.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-neutral-200 dark:border-neutral-700">
                                        <td colSpan={2} className="px-4 py-3 text-right font-medium text-neutral-500">{t('ecommerce.total') || 'Total'}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-neutral-100">{order.currency} {order.total}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Audit Trail Timeline */}
                        {order.timeline && order.timeline.length > 0 && (
                            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 space-y-4">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                                    <span>Payment & Order Audit Trail</span>
                                </h3>
                                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
                                    {order.timeline.map((step, idx) => (
                                        <div key={idx} className="relative">
                                            <div className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center ${
                                                step.status === 'completed'
                                                    ? 'bg-green-500'
                                                    : step.status === 'failed'
                                                    ? 'bg-red-500'
                                                    : 'bg-amber-400'
                                            }`} />
                                            <div>
                                                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{step.title}</p>
                                                <p className="text-[11px] text-neutral-500">{step.description}</p>
                                                {step.timestamp && (
                                                    <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(step.timestamp).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Digital Downloads Vault */}
                        {order.downloads && order.downloads.length > 0 && (
                            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 space-y-3">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <Download className="h-4 w-4 text-teal-600" />
                                    <span>Digital Products Issued ({order.downloads.length})</span>
                                </h3>
                                <div className="space-y-2">
                                    {order.downloads.map(dl => (
                                        <div key={dl.id} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                                            <div>
                                                <p className="font-semibold text-neutral-800 dark:text-neutral-200">{dl.product_name}</p>
                                                <p className="text-neutral-400 text-[11px]">{dl.file_name} • {dl.download_count} / {dl.max_downloads} downloads used</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${dl.is_expired ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}`}>
                                                {dl.is_expired ? 'Expired' : 'Active'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Financial & Fulfillment Status Card */}
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
                            <p className="text-xs font-medium text-neutral-500 uppercase">{t('ecommerce.status') || 'Status'}</p>
                            <div className="text-sm text-neutral-700 dark:text-neutral-300 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500 text-xs">{t('ecommerce.payment') || 'Payment'}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        order.payment_status === 'paid'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                            : order.payment_status === 'failed'
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                    }`}>
                                        {order.payment_status ? order.payment_status.toUpperCase() : (order.financial_status || 'PENDING')}
                                    </span>
                                </div>
                                {order.payment_gateway && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-neutral-500">Gateway</span>
                                        <span className="font-medium text-neutral-800 dark:text-neutral-200 uppercase">{order.payment_gateway}</span>
                                    </div>
                                )}
                                {order.payment_reference && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-neutral-500">Reference</span>
                                        <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">{order.payment_reference}</span>
                                    </div>
                                )}
                                {order.failure_reason && (
                                    <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">
                                        <p className="font-medium flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Failure Reason</p>
                                        <p className="mt-0.5 text-[11px]">{order.failure_reason}</p>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-xs pt-1 border-t border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">{t('ecommerce.fulfillment') || 'Fulfillment'}</span>
                                    <span>{order.fulfillment_status || 'unfulfilled'}</span>
                                </div>
                                {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-xs block pt-1">{t('ecommerce.track') || 'Track shipment'} →</a>}
                            </div>
                        </div>

                        {/* Customer Information Card */}
                        {(order.contact || order.customer_name || order.customer_email) && (
                            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-2">
                                <p className="text-xs font-medium text-neutral-500 uppercase">{t('ecommerce.customer') || 'Customer'}</p>
                                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                    {order.contact?.name || order.customer_name || 'Customer'}
                                </p>
                                {(order.contact?.email || order.customer_email) && (
                                    <p className="text-xs text-neutral-500">{order.contact?.email || order.customer_email}</p>
                                )}
                                {(order.contact?.phone || order.customer_phone) && (
                                    <p className="text-xs text-neutral-500">{order.contact?.phone || order.customer_phone}</p>
                                )}
                                {order.contact?.uuid && (
                                    <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                        <Link href={route('client.contacts.show', order.contact.uuid)} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                                            <User className="h-3.5 w-3.5" /> {t('ecommerce.view_contact') || 'View contact'}
                                        </Link>
                                        <Link href={route('client.inbox.index')} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                                            <MessageCircle className="h-3.5 w-3.5" /> {t('ecommerce.message') || 'Message'}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
