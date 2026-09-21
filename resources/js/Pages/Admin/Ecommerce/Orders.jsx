import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Pagination } from '@/Components/ui';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ShoppingBag, DollarSign, CheckCircle2, AlertCircle,
    Clock, Search, ExternalLink, Mail, RefreshCw, PackageCheck,
} from 'lucide-react';

function StatCard({ label, value, Icon, tone = 'neutral' }) {
    const tones = {
        neutral: 'text-neutral-900 dark:text-neutral-100',
        green: 'text-green-600 dark:text-green-400',
        teal: 'text-teal-600 dark:text-teal-400',
        amber: 'text-amber-600 dark:text-amber-400',
    };
    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 flex items-center gap-3">
            {Icon && <Icon className={`h-5 w-5 ${tones[tone]}`} />}
            <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
                <p className={`text-xl font-semibold ${tones[tone]}`}>{value}</p>
            </div>
        </div>
    );
}

function PaymentBadge({ status }) {
    const map = {
        paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    const cls = map[status] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300';
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${cls}`}>
            {status || 'PENDING'}
        </span>
    );
}

export default function AdminEcommerceOrders({ orders, filters = {}, stats = {} }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};
    const [search, setSearch] = useState(filters.search ?? '');
    const [actionLoading, setActionLoading] = useState(null);

    const apply = (next) => {
        router.get(route('admin.ecommerce.orders.index'), { ...filters, ...next }, { preserveState: true, replace: true });
    };

    const handleResendReceipt = (orderId) => {
        if (!confirm('Resend payment receipt and digital access email to the customer?')) return;
        setActionLoading(`resend_${orderId}`);
        router.post(route('admin.ecommerce.orders.resend-receipt', orderId), {}, {
            preserveScroll: true,
            onFinish: () => setActionLoading(null),
        });
    };

    const handleFulfill = (orderId) => {
        setActionLoading(`fulfill_${orderId}`);
        router.post(route('admin.ecommerce.orders.fulfill', orderId), {}, {
            preserveScroll: true,
            onFinish: () => setActionLoading(null),
        });
    };

    return (
        <AdminLayout title="Commerce Orders & Transactions">
            <Head title="Commerce Orders · Admin" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Commerce Orders & Transactions
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Global overview of digital products sales, payment status, and customer fulfillments across all stores.
                        </p>
                    </div>
                    <Link
                        href={route('admin.ecommerce.payouts.index')}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                        View Merchant Payouts →
                    </Link>
                </div>

                {flash.success && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-3 text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid gap-3 sm:grid-cols-4">
                    <StatCard label="Total Orders" value={stats.total_orders ?? 0} Icon={ShoppingBag} />
                    <StatCard label="Paid Orders" value={stats.paid_orders ?? 0} Icon={CheckCircle2} tone="green" />
                    <StatCard label="Gross Volume (GMV)" value={`₦${Number(stats.total_gmv ?? 0).toLocaleString()}`} Icon={DollarSign} tone="teal" />
                    <StatCard label="Platform Fees Earned" value={`₦${Number(stats.platform_fees ?? 0).toLocaleString()}`} Icon={Clock} tone="amber" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={(e) => { e.preventDefault(); apply({ search }); }} className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search order #, customer, email, reference…"
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 pl-9 pr-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                    </form>

                    <select
                        value={filters.payment_status ?? ''}
                        onChange={(e) => apply({ payment_status: e.target.value || undefined })}
                        className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm"
                    >
                        <option value="">All Payment Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>

                    <select
                        value={filters.gateway ?? ''}
                        onChange={(e) => apply({ gateway: e.target.value || undefined })}
                        className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm"
                    >
                        <option value="">All Gateways</option>
                        <option value="paystack">Paystack</option>
                        <option value="stripe">Stripe</option>
                    </select>
                </div>

                {/* Orders Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400 text-xs uppercase">
                                    <th className="pb-3 pr-4 font-medium">Order # / Store</th>
                                    <th className="pb-3 pr-4 font-medium">Customer</th>
                                    <th className="pb-3 pr-4 font-medium">Amount</th>
                                    <th className="pb-3 pr-4 font-medium">Payment</th>
                                    <th className="pb-3 pr-4 font-medium">Gateway & Ref</th>
                                    <th className="pb-3 pr-4 font-medium">Date</th>
                                    <th className="pb-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {orders.data?.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-neutral-400">
                                            No commerce orders found.
                                        </td>
                                    </tr>
                                )}
                                {orders.data?.map((o) => (
                                    <tr key={o.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                        <td className="py-3 pr-4">
                                            <p className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-xs">{o.number}</p>
                                            <p className="text-[11px] text-neutral-500">{o.store_name}</p>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <p className="font-medium text-neutral-800 dark:text-neutral-200 text-xs">{o.customer_name}</p>
                                            <p className="text-[11px] text-neutral-400">{o.customer_email}</p>
                                            {o.customer_phone && <p className="text-[10px] text-neutral-400">{o.customer_phone}</p>}
                                        </td>
                                        <td className="py-3 pr-4 font-semibold text-neutral-900 dark:text-neutral-100">
                                            {o.currency} {Number(o.total).toLocaleString()}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <PaymentBadge status={o.payment_status} />
                                        </td>
                                        <td className="py-3 pr-4">
                                            <p className="text-xs font-medium uppercase text-neutral-700 dark:text-neutral-300">{o.payment_gateway || '—'}</p>
                                            <p className="font-mono text-[10px] text-neutral-400 truncate max-w-[140px]">{o.payment_reference || '—'}</p>
                                        </td>
                                        <td className="py-3 pr-4 text-xs text-neutral-500">
                                            {o.placed_at || '—'}
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <a
                                                    href={o.receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View Public Receipt"
                                                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>

                                                {o.customer_email && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResendReceipt(o.id)}
                                                        disabled={actionLoading === `resend_${o.id}`}
                                                        title="Resend Receipt & Download Link to Buyer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition"
                                                    >
                                                        <Mail className="h-3.5 w-3.5 text-teal-600" />
                                                        <span>{actionLoading === `resend_${o.id}` ? 'Sending…' : 'Resend Email'}</span>
                                                    </button>
                                                )}

                                                {o.downloads_count === 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFulfill(o.id)}
                                                        disabled={actionLoading === `fulfill_${o.id}`}
                                                        title="Issue Digital Downloads"
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 disabled:opacity-50 transition"
                                                    >
                                                        <PackageCheck className="h-3.5 w-3.5" />
                                                        <span>Issue Downloads</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination data={orders} />
                </Card>
            </div>
        </AdminLayout>
    );
}

