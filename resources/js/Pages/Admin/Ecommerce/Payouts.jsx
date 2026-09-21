import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/ui/Pagination';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Building, ArrowUpRight, X } from 'lucide-react';

export default function AdminPayouts({ payouts = { data: [] }, counts = {}, currentStatus = 'pending' }) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [rejectingPayout, setRejectingPayout] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const filterStatus = (status) => {
        router.get(route('admin.ecommerce.payouts.index'), { status }, { preserveState: true });
    };

    const handleApprove = (payout) => {
        if (confirm(`Approve and mark payout #${payout.reference} (${payout.currency} ${payout.amount}) as completed?`)) {
            router.post(route('admin.ecommerce.payouts.approve', payout.id));
        }
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        if (!rejectionReason.trim()) return;

        setProcessing(true);
        router.post(route('admin.ecommerce.payouts.reject', rejectingPayout.id), {
            rejection_reason: rejectionReason,
        }, {
            onSuccess: () => {
                setProcessing(false);
                setRejectingPayout(null);
                setRejectionReason('');
            },
            onError: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout title="Merchant Payouts & Withdrawals">
            <Head title="Merchant Payouts · Admin" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        Merchant Payout Requests
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        Review and process merchant withdrawal requests from platform escrow.
                    </p>
                </div>

                {flash.success && (
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
                        {flash.error}
                    </div>
                )}

                {/* Status Tabs */}
                <div className="flex border-b border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={() => filterStatus('pending')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                            currentStatus === 'pending'
                                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        <span>Pending Approval</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
                            {counts.pending ?? 0}
                        </span>
                    </button>
                    <button
                        onClick={() => filterStatus('completed')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${
                            currentStatus === 'completed'
                                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        Completed ({counts.completed ?? 0})
                    </button>
                    <button
                        onClick={() => filterStatus('rejected')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${
                            currentStatus === 'rejected'
                                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        Rejected ({counts.rejected ?? 0})
                    </button>
                    <button
                        onClick={() => filterStatus('all')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${
                            currentStatus === 'all'
                                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        All
                    </button>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">Reference / Date</th>
                                <th className="text-left font-medium px-4 py-3">Workspace</th>
                                <th className="text-left font-medium px-4 py-3">Bank Destination</th>
                                <th className="text-right font-medium px-4 py-3">Amount</th>
                                <th className="text-center font-medium px-4 py-3">Status</th>
                                <th className="text-right font-medium px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {payouts.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                                        No payout requests found for this filter.
                                    </td>
                                </tr>
                            )}
                            {payouts.data.map((p) => (
                                <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                                    <td className="px-4 py-3">
                                        <p className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{p.reference}</p>
                                        <p className="text-xs text-neutral-400">{p.created_at}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                                        Workspace #{p.workspace_id}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{p.bank_name || '—'}</p>
                                        <p className="text-xs text-neutral-500 font-mono">{p.account_number} • {p.account_name}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                        {p.currency} {p.amount}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            p.status === 'completed'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : p.status === 'rejected'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                        }`}>
                                            {p.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {p.status === 'pending' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleApprove(p)}
                                                    className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition"
                                                >
                                                    Mark Paid
                                                </button>
                                                <button
                                                    onClick={() => setRejectingPayout(p)}
                                                    className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination data={payouts} />
                </div>
            </div>

            {/* Rejection Modal */}
            {rejectingPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                Reject Payout #{rejectingPayout.reference}
                            </h3>
                            <button onClick={() => setRejectingPayout(null)} className="text-neutral-400 hover:text-neutral-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
                            <p className="text-xs text-neutral-500">
                                Rejecting this payout will immediately restore {rejectingPayout.currency} {rejectingPayout.amount} back to the merchant's wallet balance.
                            </p>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Rejection Reason (Visible to merchant)
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="e.g. Invalid account number or bank rejected the transfer..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setRejectingPayout(null)}
                                    className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
                                >
                                    {processing ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

