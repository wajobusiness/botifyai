import { Head, router, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import Pagination from '@/Components/ui/Pagination';
import { useState } from 'react';
import {
    Wallet, ArrowUpRight, ArrowDownLeft, Clock, Building, Plus,
    AlertCircle, CheckCircle, XCircle, ShieldCheck, CreditCard, X,
} from 'lucide-react';

function currencySymbol(code) {
    const symbols = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
    return symbols[code] || code || '₦';
}

function StatCard({ label, value, sub, Icon, tone = 'neutral' }) {
    const tones = {
        teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
        neutral: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
    };
    return (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
                <div className={`p-2 rounded-xl ${tones[tone]}`}>
                    {Icon && <Icon className="h-5 w-5" />}
                </div>
            </div>
            <div className="mt-3">
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
                {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

export default function WalletIndex({
    wallet = {},
    ledgerEntries = { data: [] },
    bankAccounts = [],
    payoutRequests = [],
    minPayoutAmount = 5000,
}) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'payouts' | 'banks'
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [bankModalOpen, setBankModalOpen] = useState(false);

    // Payout form
    const [payoutAmount, setPayoutAmount] = useState('');
    const [selectedBankId, setSelectedBankId] = useState(bankAccounts[0]?.id || '');
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [payoutError, setPayoutError] = useState(null);

    // Bank form
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [bankLoading, setBankLoading] = useState(false);
    const [bankError, setBankError] = useState(null);

    const sym = currencySymbol(wallet.currency);

    const handleRequestPayout = (e) => {
        e.preventDefault();
        setPayoutError(null);
        setPayoutLoading(true);

        router.post(route('client.ecommerce.wallet.payouts.store'), {
            bank_account_id: selectedBankId,
            amount: payoutAmount,
            currency: wallet.currency,
        }, {
            onSuccess: () => {
                setPayoutLoading(false);
                setPayoutModalOpen(false);
                setPayoutAmount('');
            },
            onError: (errs) => {
                setPayoutLoading(false);
                setPayoutError(Object.values(errs)[0] || 'Error submitting payout request.');
            },
        });
    };

    const handleAddBank = (e) => {
        e.preventDefault();
        setBankError(null);
        setBankLoading(true);

        router.post(route('client.ecommerce.wallet.bank-accounts.store'), {
            bank_name: bankName,
            account_number: accountNumber,
            account_name: accountName,
            currency: wallet.currency,
        }, {
            onSuccess: () => {
                setBankLoading(false);
                setBankModalOpen(false);
                setBankName('');
                setAccountNumber('');
                setAccountName('');
            },
            onError: (errs) => {
                setBankLoading(false);
                setBankError(Object.values(errs)[0] || 'Error saving bank account.');
            },
        });
    };

    const handleDeleteBank = (bankId) => {
        if (confirm('Are you sure you want to delete this bank account?')) {
            router.delete(route('client.ecommerce.wallet.bank-accounts.destroy', bankId));
        }
    };

    return (
        <ClientLayout title="Merchant Wallet & Payouts">
            <Head title="Merchant Wallet & Escrow" />
            <div className="space-y-6">
                {/* Top Title & CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Wallet className="h-6 w-6 text-teal-600" />
                            <span>Merchant Wallet & Payouts</span>
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Transparent double-entry ledger of your digital sales, platform fees, and withdrawals.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setBankModalOpen(true)}
                            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 transition flex items-center gap-1.5"
                        >
                            <Building className="h-4 w-4 text-neutral-400" />
                            <span>Bank Accounts</span>
                        </button>
                        <button
                            onClick={() => setPayoutModalOpen(true)}
                            disabled={wallet.available_balance < minPayoutAmount || bankAccounts.length === 0}
                            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <ArrowUpRight className="h-4 w-4" />
                            <span>Request Withdrawal</span>
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {flash.success && (
                    <div className="rounded-xl bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 text-sm flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 text-sm flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Wallet Balance Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Available Balance"
                        value={`${sym}${Number(wallet.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        sub="Ready for instant withdrawal"
                        tone="teal"
                        Icon={Wallet}
                    />
                    <StatCard
                        label="Pending Clearance"
                        value={`${sym}${Number(wallet.pending_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        sub="Withdrawals awaiting processing"
                        tone="amber"
                        Icon={Clock}
                    />
                    <StatCard
                        label="Total Sales Earned"
                        value={`${sym}${Number(wallet.total_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        sub="Lifetime gross volume"
                        tone="green"
                        Icon={ArrowDownLeft}
                    />
                    <StatCard
                        label="Total Withdrawn"
                        value={`${sym}${Number(wallet.total_withdrawn || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        sub="Paid out to your bank"
                        tone="neutral"
                        Icon={ArrowUpRight}
                    />
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${
                            activeTab === 'ledger'
                                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                    >
                        Ledger & Audit History
                    </button>
                    <button
                        onClick={() => setActiveTab('payouts')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                            activeTab === 'payouts'
                                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                    >
                        <span>Payout Requests</span>
                        {payoutRequests.filter(p => p.status === 'pending').length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                                {payoutRequests.filter(p => p.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('banks')}
                        className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${
                            activeTab === 'banks'
                                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                    >
                        Saved Bank Accounts ({bankAccounts.length})
                    </button>
                </div>

                {/* Tab Content: Ledger */}
                {activeTab === 'ledger' && (
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-teal-600" />
                                Immutable Double-Entry Audit Log
                            </h3>
                            <span className="text-xs text-neutral-400">All sales, fee splits & debits are cryptographically recorded</span>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase">
                                <tr>
                                    <th className="text-left font-medium px-4 py-3">Date</th>
                                    <th className="text-left font-medium px-4 py-3">Description</th>
                                    <th className="text-right font-medium px-4 py-3">Gross</th>
                                    <th className="text-right font-medium px-4 py-3">Platform Fee</th>
                                    <th className="text-right font-medium px-4 py-3">Net Effect</th>
                                    <th className="text-right font-medium px-4 py-3">Running Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {ledgerEntries.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                                            No ledger transactions yet. Share your product links to make your first sale!
                                        </td>
                                    </tr>
                                )}
                                {ledgerEntries.data.map((entry) => {
                                    const isCredit = entry.entry_type === 'sale_credit';
                                    return (
                                        <tr key={entry.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                                            <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">{entry.created_at}</td>
                                            <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        isCredit
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                                                    }`}>
                                                        {entry.entry_type}
                                                    </span>
                                                    <span>{entry.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">
                                                {sym}{entry.amount}
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-neutral-400">
                                                {entry.fee !== '0.00' ? `-${sym}${entry.fee}` : '—'}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-semibold ${
                                                isCredit ? 'text-green-600 dark:text-green-400' : 'text-neutral-900 dark:text-neutral-100'
                                            }`}>
                                                {isCredit ? `+${sym}${entry.net_amount}` : `${sym}${entry.net_amount}`}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100">
                                                {sym}{entry.running_balance}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <Pagination data={ledgerEntries} />
                    </div>
                )}

                {/* Tab Content: Payout Requests */}
                {activeTab === 'payouts' && (
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase">
                                <tr>
                                    <th className="text-left font-medium px-4 py-3">Reference</th>
                                    <th className="text-left font-medium px-4 py-3">Date</th>
                                    <th className="text-left font-medium px-4 py-3">Bank Details</th>
                                    <th className="text-right font-medium px-4 py-3">Amount</th>
                                    <th className="text-center font-medium px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {payoutRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                                            No payout requests submitted yet.
                                        </td>
                                    </tr>
                                )}
                                {payoutRequests.map((payout) => (
                                    <tr key={payout.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                            {payout.reference}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-500">{payout.created_at}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{payout.bank_name}</p>
                                            <p className="text-xs text-neutral-400">{payout.account_number}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                                            {sym}{payout.amount}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                payout.status === 'completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : payout.status === 'rejected'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                            }`}>
                                                {payout.status.toUpperCase()}
                                            </span>
                                            {payout.rejection_reason && (
                                                <p className="text-[11px] text-red-500 mt-1 max-w-[200px] mx-auto truncate" title={payout.rejection_reason}>
                                                    {payout.rejection_reason}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab Content: Bank Accounts */}
                {activeTab === 'banks' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Earnings will be deposited directly to your selected default account.
                            </p>
                            <button
                                onClick={() => setBankModalOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium flex items-center gap-1.5 transition"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add Bank Account</span>
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {bankAccounts.length === 0 && (
                                <div className="col-span-full p-8 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl text-center">
                                    <Building className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                                    <p className="font-medium text-neutral-700 dark:text-neutral-300">No bank accounts added yet.</p>
                                    <p className="text-xs text-neutral-400 mt-1">Add your bank account details to enable withdrawals.</p>
                                    <button
                                        onClick={() => setBankModalOpen(true)}
                                        className="mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-medium"
                                    >
                                        Add Bank Account
                                    </button>
                                </div>
                            )}
                            {bankAccounts.map((bank) => (
                                <div key={bank.id} className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between shadow-sm">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{bank.bank_name}</span>
                                            {bank.is_default && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-mono text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-2">
                                            {bank.account_number}
                                        </p>
                                        <p className="text-xs text-neutral-500 uppercase mt-0.5">{bank.account_name}</p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                        <span className="text-xs text-neutral-400">{bank.currency} Account</span>
                                        <button
                                            onClick={() => handleDeleteBank(bank.id)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Payout Request Modal */}
            {payoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Request Payout Withdrawal</h3>
                            <button onClick={() => setPayoutModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {payoutError && (
                            <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">
                                {payoutError}
                            </div>
                        )}
                        <form onSubmit={handleRequestPayout} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Withdrawal Amount ({wallet.currency})
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-semibold">{sym}</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={minPayoutAmount}
                                        max={wallet.available_balance}
                                        required
                                        placeholder={`Min. ${minPayoutAmount}`}
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <p className="text-xs text-neutral-400 mt-1">
                                    Available: {sym}{Number(wallet.available_balance).toLocaleString()} | Minimum: {sym}{Number(minPayoutAmount).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Destination Bank Account
                                </label>
                                <select
                                    value={selectedBankId}
                                    onChange={(e) => setSelectedBankId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    {bankAccounts.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.bank_name} — {b.account_number} ({b.account_name})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setPayoutModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={payoutLoading}
                                    className="px-5 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                                >
                                    {payoutLoading ? 'Submitting...' : 'Confirm Withdrawal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Bank Modal */}
            {bankModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Add Payout Bank Account</h3>
                            <button onClick={() => setBankModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {bankError && (
                            <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">
                                {bankError}
                            </div>
                        )}
                        <form onSubmit={handleAddBank} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Access Bank, GTBank, Zenith Bank"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={20}
                                    placeholder="0123456789"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Account Holder Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Full Name as registered with bank"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setBankModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bankLoading}
                                    className="px-5 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                                >
                                    {bankLoading ? 'Saving...' : 'Save Bank Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ClientLayout>
    );
}

