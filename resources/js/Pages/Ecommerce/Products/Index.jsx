import { Head, router, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import Pagination from '@/Components/ui/Pagination';
import CreateEditModal from './CreateEditModal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Search, Package, AlertTriangle, XOctagon, Plus, Copy,
    Check, ExternalLink, Edit2, Trash2, Share2, Sparkles,
} from 'lucide-react';

function StatCard({ label, value, tone = 'neutral', Icon }) {
    const tones = {
        neutral: 'text-neutral-900 dark:text-neutral-100',
        amber: 'text-amber-600 dark:text-amber-400',
        red: 'text-red-600 dark:text-red-400',
        teal: 'text-teal-600 dark:text-teal-400',
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

function currencySymbol(code) {
    const symbols = { NGN: '₦', USD: '$', EUR: '€', GBP: '£', GHS: 'GH₵', KES: 'KSh' };
    return symbols[code] || code || '₦';
}

export default function ProductsIndex({
    products,
    filters = {},
    stores = [],
    nativeStore = {},
    stats = {},
    lowStockThreshold = 5,
}) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [search, setSearch] = useState(filters.search ?? '');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const apply = (next) => {
        router.get(route('client.ecommerce.products.index'), { ...filters, ...next }, { preserveState: true, replace: true });
    };

    const copyBuyLink = (product) => {
        const url = product.checkout_url || `${window.location.origin}/buy/${product.slug || product.id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(product.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const shareOnWhatsApp = (product) => {
        const url = product.checkout_url || `${window.location.origin}/buy/${product.slug || product.id}`;
        const text = encodeURIComponent(`Hi! Check out *${product.name}* here: ${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleDelete = (product) => {
        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
            router.delete(route('client.ecommerce.products.native.destroy', product.id));
        }
    };

    return (
        <ClientLayout title={t('ecommerce.products') || 'Products'}>
            <Head title={t('ecommerce.products') || 'Products & Catalog'} />
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            {t('ecommerce.products') || 'Products & Inventory'}
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage native digital products and synced store inventory.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-sm transition self-start sm:self-auto"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Digital Product</span>
                    </button>
                </div>

                {flash.success && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm flex items-center justify-between">
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 text-sm">
                        {flash.error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-4">
                    <StatCard label="Total Products" value={stats.total ?? 0} Icon={Package} />
                    <StatCard label="Digital Products" value={stats.digital ?? 0} tone="teal" Icon={Sparkles} />
                    <StatCard label="Low Stock" value={stats.low_stock ?? 0} tone="amber" Icon={AlertTriangle} />
                    <StatCard label="Out of Stock" value={stats.out_of_stock ?? 0} tone="red" Icon={XOctagon} />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={(e) => { e.preventDefault(); apply({ search }); }} className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, SKU, or slug…"
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 pl-9 pr-3 py-2 text-sm"
                        />
                    </form>
                    <select
                        value={filters.platform ?? ''}
                        onChange={(e) => apply({ platform: e.target.value || undefined })}
                        className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                    >
                        <option value="">All Types & Platforms</option>
                        <option value="native">Native Digital Products</option>
                        <option value="shopify">Shopify</option>
                        <option value="woocommerce">WooCommerce</option>
                    </select>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">Product</th>
                                <th className="text-left font-medium px-4 py-3">Type / Channel</th>
                                <th className="text-right font-medium px-4 py-3">Price</th>
                                <th className="text-center font-medium px-4 py-3">Checkout & Share</th>
                                <th className="text-right font-medium px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {products.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                                        <Package className="h-8 w-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                                        <p className="font-medium text-neutral-600 dark:text-neutral-400">No products found.</p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                            Click "+ Add Digital Product" to create your first product.
                                        </p>
                                    </td>
                                </tr>
                            )}
                            {products.data.map((p) => {
                                const isNative = p.platform === 'native';
                                const sym = currencySymbol(p.currency);
                                return (
                                    <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                                        {/* Name & Photo */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover bg-neutral-100 shrink-0" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center shrink-0">
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">{p.name}</p>
                                                    {p.slug && <p className="text-xs text-neutral-400">/buy/{p.slug}</p>}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Platform / Type & Affiliate */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        isNative
                                                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
                                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                    }`}>
                                                        {isNative ? 'Digital Download' : p.platform}
                                                    </span>
                                                    {p.affiliate_enabled ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                                            <Sparkles className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                                                            {p.affiliate_commission_percentage ?? 15}% Affiliate
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800/80">
                                                            Affiliate Off
                                                        </span>
                                                    )}
                                                </div>
                                                {p.digital_asset?.file_name && (
                                                    <span className="text-[11px] text-neutral-400 truncate max-w-[160px]">
                                                        📁 {p.digital_asset.file_name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Price */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                {sym}{Number(p.price).toLocaleString()}
                                            </div>
                                            {p.compare_at_price && (
                                                <div className="text-xs text-neutral-400 line-through">
                                                    {sym}{Number(p.compare_at_price).toLocaleString()}
                                                </div>
                                            )}
                                        </td>

                                        {/* Checkout & Share */}
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => copyBuyLink(p)}
                                                    title="Copy Checkout Link"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                                                >
                                                    {copiedId === p.id ? (
                                                        <>
                                                            <Check className="h-3.5 w-3.5 text-green-600" />
                                                            <span className="text-green-600 font-medium">Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3.5 w-3.5 text-neutral-500" />
                                                            <span>Copy Link</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => shareOnWhatsApp(p)}
                                                    title="Share on WhatsApp"
                                                    className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 transition"
                                                >
                                                    <Share2 className="h-3.5 w-3.5" />
                                                </button>
                                                <a
                                                    href={p.checkout_url || `/buy/${p.slug || p.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View Checkout Page"
                                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            {isNative && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProduct(p);
                                                            setModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                        title="Edit Product"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p)}
                                                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <Pagination data={products} />
                </div>
            </div>

            {/* Create / Edit Modal */}
            <CreateEditModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingProduct(null);
                }}
                product={editingProduct}
                defaultCurrency={nativeStore?.currency || 'NGN'}
            />
        </ClientLayout>
    );
}
