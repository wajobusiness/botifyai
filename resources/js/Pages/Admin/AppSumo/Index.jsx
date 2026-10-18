import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    KeyRound,
    Plus,
    Download,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    Copy,
    Check,
    Layers,
    User,
    Building2,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { formatDateTz } from '@/Utils/datetime';

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            title="Copy Code"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}

function GenerateModal({ isOpen, onClose, plans = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        tier: 'tier1',
        plan_id: plans[0]?.id || '',
        count: 50,
        prefix: 'BOTIFY',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.appsumo.generate'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Generate AppSumo Codes</h3>
                        <p className="text-xs text-neutral-500">Batch generate unique lifetime license codes</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                            License Tier
                        </label>
                        <select
                            value={data.tier}
                            onChange={(e) => {
                                const selectedTier = e.target.value;
                                setData('tier', selectedTier);
                                const matchPlan = plans.find((p) => p.slug === `appsumo-${selectedTier}`);
                                if (matchPlan) setData('plan_id', matchPlan.id);
                            }}
                            className="w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2"
                        >
                            <option value="tier1">Tier 1 (Single Code)</option>
                            <option value="tier2">Tier 2 (Double Code)</option>
                            <option value="tier3">Tier 3 (Multiple / White Label)</option>
                            <option value="tier4">Tier 4 (Custom Enterprise)</option>
                            <option value="tier5">Tier 5 (Ultimate)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                            Target Plan Entitlement
                        </label>
                        <select
                            value={data.plan_id}
                            onChange={(e) => setData('plan_id', e.target.value)}
                            className="w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2"
                        >
                            {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.slug})
                                </option>
                            ))}
                        </select>
                        {errors.plan_id && <p className="text-xs text-coral-600 mt-1">{errors.plan_id}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Code Prefix
                            </label>
                            <input
                                type="text"
                                value={data.prefix}
                                onChange={(e) => setData('prefix', e.target.value.toUpperCase())}
                                placeholder="BOTIFY"
                                className="w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 uppercase font-mono"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="5000"
                                value={data.count}
                                onChange={(e) => setData('count', parseInt(e.target.value) || 1)}
                                className="w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg shadow-sm"
                        >
                            {processing ? 'Generating...' : `Generate ${data.count} Codes`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RevokeModal({ license, onClose }) {
    const { data, setData, post, processing } = useForm({
        reason: 'refunded',
    });

    if (!license) return null;

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.appsumo.revoke', license.id), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-coral-50 dark:bg-coral-950/60 text-coral-600">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Revoke / Refund License</h3>
                        <p className="text-xs font-mono text-neutral-500">{license.code}</p>
                    </div>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                    Revoking this license will terminate the lifetime access associated with it and downgrade the client workspace.
                </p>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                            Action Reason
                        </label>
                        <select
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            className="w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2"
                        >
                            <option value="refunded">AppSumo 60-Day Refund</option>
                            <option value="revoked">Revoked by Administrator / Policy Violation</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm font-semibold text-white bg-coral-600 hover:bg-coral-700 disabled:opacity-50 rounded-lg shadow-sm"
                        >
                            {processing ? 'Processing...' : 'Confirm Revocation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AppSumoIndex({ licenses, stats = {}, plans = [], filters = {} }) {
    const { t } = useTranslation();
    const { flash, timezone } = usePage().props;
    const userTz = timezone || 'UTC';
    const formatDate = (iso) => (iso ? formatDateTz(iso, userTz) : '—');

    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [revokingLicense, setRevokingLicense] = useState(null);

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [tierFilter, setTierFilter] = useState(filters.tier || 'all');

    const applyFilters = (newStatus, newTier, newSearch) => {
        router.get(
            route('admin.appsumo.index'),
            {
                status: newStatus !== 'all' ? newStatus : undefined,
                tier: newTier !== 'all' ? newTier : undefined,
                search: newSearch || undefined,
            },
            { preserveState: true }
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters(statusFilter, tierFilter, search);
    };

    const handleExport = () => {
        const url = new URL(route('admin.appsumo.export'), window.location.origin);
        if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
        if (tierFilter !== 'all') url.searchParams.set('tier', tierFilter);
        window.location.href = url.toString();
    };

    return (
        <AdminLayout>
            <Head title="AppSumo Lifetime Deals & Licenses | Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                            <KeyRound className="w-6 h-6 text-brand-600" />
                            AppSumo Deals & License Management
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500">
                            Monitor lifetime deal redemptions, generate batch codes, and manage AppSumo customer licenses.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExport}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm"
                        >
                            <Download className="w-4 h-4 text-neutral-500" />
                            Export CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsGenerateOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Generate Codes
                        </button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                        {flash.success}
                    </div>
                )}

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Codes</p>
                        <p className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-white">
                            {stats.total?.toLocaleString() ?? 0}
                        </p>
                        <span className="text-[11px] text-neutral-400">All registered lifetime keys</span>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Available / Unredeemed</p>
                        <p className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                            {stats.unredeemed?.toLocaleString() ?? 0}
                        </p>
                        <span className="text-[11px] text-neutral-400">Ready for AppSumo buyers</span>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Redeemed & Active</p>
                        <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            {stats.redeemed?.toLocaleString() ?? 0}
                        </p>
                        <span className="text-[11px] text-neutral-400">Active lifetime workspaces</span>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Refunded / Revoked</p>
                        <p className="mt-2 text-2xl font-extrabold text-coral-600 dark:text-coral-400">
                            {stats.refunded?.toLocaleString() ?? 0}
                        </p>
                        <span className="text-[11px] text-neutral-400">Cancelled lifetime access</span>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by code, user email or name..."
                            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        />
                    </form>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                applyFilters(e.target.value, tierFilter, search);
                            }}
                            className="text-xs sm:text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2"
                        >
                            <option value="all">All Statuses</option>
                            <option value="unredeemed">Available (Unredeemed)</option>
                            <option value="redeemed">Redeemed</option>
                            <option value="refunded">Refunded</option>
                            <option value="revoked">Revoked</option>
                        </select>

                        <select
                            value={tierFilter}
                            onChange={(e) => {
                                setTierFilter(e.target.value);
                                applyFilters(statusFilter, e.target.value, search);
                            }}
                            className="text-xs sm:text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2"
                        >
                            <option value="all">All Tiers</option>
                            <option value="tier1">Tier 1</option>
                            <option value="tier2">Tier 2</option>
                            <option value="tier3">Tier 3</option>
                            <option value="tier4">Tier 4</option>
                            <option value="tier5">Tier 5</option>
                        </select>
                    </div>
                </div>

                {/* Licenses Table */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 font-semibold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="px-4 py-3">License Code</th>
                                    <th className="px-4 py-3">Tier</th>
                                    <th className="px-4 py-3">Entitlement Plan</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Redeemed By</th>
                                    <th className="px-4 py-3">Redeemed At</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                                {licenses?.data && licenses.data.length > 0 ? (
                                    licenses.data.map((lic) => (
                                        <tr key={lic.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-900 dark:text-white text-xs">
                                                    <span>{lic.code}</span>
                                                    <CopyButton text={lic.code} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                                                    {lic.tier}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                                                {lic.plan_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {lic.status === 'redeemed' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Redeemed
                                                    </span>
                                                ) : lic.status === 'unredeemed' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Available
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-coral-100 dark:bg-coral-950/60 text-coral-800 dark:text-coral-300 capitalize">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        {lic.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {lic.redeemed_by ? (
                                                    <div>
                                                        <p className="font-semibold text-neutral-900 dark:text-white text-xs">
                                                            {lic.redeemed_by.name}
                                                        </p>
                                                        <p className="text-[11px] text-neutral-500">{lic.redeemed_by.email}</p>
                                                        {lic.client_name && (
                                                            <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-0.5">
                                                                Org: {lic.client_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-500">
                                                {formatDate(lic.redeemed_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {lic.status === 'redeemed' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setRevokingLicense(lic)}
                                                        className="px-2.5 py-1 text-xs font-semibold text-coral-600 hover:text-coral-700 hover:bg-coral-50 dark:hover:bg-coral-950/40 rounded transition-colors"
                                                    >
                                                        Revoke / Refund
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-neutral-400 text-sm">
                                            No AppSumo licenses found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {licenses?.links && licenses.links.length > 3 && (
                        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                            <span>
                                Showing {licenses.from || 0} to {licenses.to || 0} of {licenses.total} licenses
                            </span>
                            <div className="flex gap-1">
                                {licenses.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`px-2.5 py-1 rounded text-xs ${
                                            link.active
                                                ? 'bg-brand-600 text-white font-bold'
                                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-40'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <GenerateModal
                isOpen={isGenerateOpen}
                onClose={() => setIsGenerateOpen(false)}
                plans={plans}
            />

            <RevokeModal
                license={revokingLicense}
                onClose={() => setRevokingLicense(null)}
            />
        </AdminLayout>
    );
}

