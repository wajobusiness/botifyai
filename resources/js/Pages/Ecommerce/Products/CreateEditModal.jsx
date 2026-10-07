import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    X, Upload, Link as LinkIcon, FileText, Image, AlertCircle,
    Sparkles, Award, Bold, Italic, Underline, Heading2, Heading3,
    List, ListOrdered, Link2, Eye, Code2, CheckSquare, Info,
} from 'lucide-react';

export default function CreateEditModal({ isOpen, onClose, product = null, defaultCurrency = 'NGN' }) {
    const isEdit = Boolean(product);
    const descTextareaRef = useRef(null);

    const [descTab, setDescTab] = useState('editor'); // 'editor' | 'preview'

    const [form, setForm] = useState({
        name: '',
        slug: '',
        product_type: 'digital',
        price: '',
        compare_at_price: '',
        currency: defaultCurrency,
        description: '',
        asset_type: 'file_upload',
        external_redirect_url: '',
        is_published: true,
        affiliate_enabled: false,
        affiliate_commission_percentage: '15',
    });

    const [digitalFile, setDigitalFile] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (product) {
            setForm({
                name: product.name || '',
                slug: product.slug || '',
                product_type: product.product_type || 'digital',
                price: product.price != null ? String(product.price) : '',
                compare_at_price: product.compare_at_price != null ? String(product.compare_at_price) : '',
                currency: product.currency || defaultCurrency,
                description: product.description || '',
                asset_type: product.digital_asset?.asset_type || 'file_upload',
                external_redirect_url: product.digital_asset?.external_redirect_url || '',
                is_published: product.is_published ?? true,
                affiliate_enabled: Boolean(product.affiliate_enabled),
                affiliate_commission_percentage: product.affiliate_commission_percentage != null
                    ? String(product.affiliate_commission_percentage)
                    : '15',
            });
        } else {
            setForm({
                name: '',
                slug: '',
                product_type: 'digital',
                price: '',
                compare_at_price: '',
                currency: defaultCurrency,
                description: '',
                asset_type: 'file_upload',
                external_redirect_url: '',
                is_published: true,
                affiliate_enabled: false,
                affiliate_commission_percentage: '15',
            });
            setDigitalFile(null);
            setCoverImage(null);
        }
        setDescTab('editor');
        setError(null);
    }, [product, isOpen, defaultCurrency]);

    if (!isOpen) return null;

    const insertHtml = (openTag, closeTag = '', defaultText = '') => {
        const textarea = descTextareaRef.current;
        if (!textarea) {
            setForm((prev) => ({
                ...prev,
                description: (prev.description || '') + openTag + defaultText + closeTag,
            }));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = form.description || '';
        const selectedText = currentVal.substring(start, end) || defaultText;
        const replacement = openTag + selectedText + closeTag;
        const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

        setForm((prev) => ({ ...prev, description: newVal }));

        setTimeout(() => {
            textarea.focus();
            const newCursor = start + openTag.length + selectedText.length + closeTag.length;
            textarea.setSelectionRange(newCursor, newCursor);
        }, 20);
    };

    const insertCalloutBox = () => {
        const calloutHtml = `\n<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; padding: 14px; border-radius: 8px; margin: 12px 0;">\n  <strong style="color: #166534; font-size: 14px;">✨ What's Included:</strong>\n  <ul style="margin-top: 6px; margin-bottom: 0; padding-left: 20px; color: #14532d;">\n    <li>Instant digital access</li>\n    <li>Full source files & materials</li>\n    <li>Step-by-step setup instructions</li>\n  </ul>\n</div>\n`;
        insertHtml(calloutHtml);
    };

    const insertLink = () => {
        const url = prompt('Enter the link URL (e.g. https://example.com):', 'https://');
        if (url) {
            insertHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0d9488; text-decoration: underline;">`, `</a>`, `Click here`);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const payload = new FormData();
        payload.append('name', form.name);
        if (form.slug) payload.append('slug', form.slug);
        payload.append('product_type', form.product_type || 'digital');
        payload.append('price', form.price);
        if (form.compare_at_price) payload.append('compare_at_price', form.compare_at_price);
        payload.append('currency', form.currency);
        payload.append('description', form.description || '');
        payload.append('asset_type', form.asset_type);
        if (form.asset_type === 'redirect_url' && form.external_redirect_url) {
            payload.append('external_redirect_url', form.external_redirect_url);
        }
        payload.append('is_published', form.is_published ? '1' : '0');
        payload.append('affiliate_enabled', form.affiliate_enabled ? '1' : '0');
        if (form.affiliate_enabled && form.affiliate_commission_percentage) {
            payload.append('affiliate_commission_percentage', form.affiliate_commission_percentage);
        } else {
            payload.append('affiliate_commission_percentage', '0');
        }

        if (digitalFile) {
            payload.append('digital_file', digitalFile);
        }
        if (coverImage) {
            payload.append('cover_image', coverImage);
        }

        const url = isEdit
            ? route('client.ecommerce.products.native.update', product.id)
            : route('client.ecommerce.products.native.store');

        router.post(url, payload, {
            forceFormData: true,
            onSuccess: () => {
                setLoading(false);
                onClose();
            },
            onError: (errs) => {
                setLoading(false);
                setError(Object.values(errs)[0] || 'An error occurred while saving.');
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {isEdit ? 'Edit Product & Affiliate Settings' : 'Create Native Digital Product'}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {isEdit
                                ? 'Update pricing, HTML description, delivery files, and affiliate commission.'
                                : 'Sell e-books, files, templates, or resources with instant chat & web checkout.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                            Product Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. AI Prompt Engineering Mastery (eBook)"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>

                    {/* Pricing & Currency Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Price <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                placeholder="3500.00"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Compare-at Price (Optional)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="5000.00"
                                value={form.compare_at_price}
                                onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Currency
                            </label>
                            <select
                                value={form.currency}
                                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            >
                                <option value="NGN">NGN (₦)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="GHS">GHS (GH₵)</option>
                                <option value="KES">KES (KSh)</option>
                            </select>
                        </div>
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                            Custom Checkout Slug (Optional)
                        </label>
                        <div className="flex items-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden text-sm">
                            <span className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-700/50 text-neutral-500 border-r border-neutral-200 dark:border-neutral-700">
                                /buy/
                            </span>
                            <input
                                type="text"
                                placeholder="ai-prompt-mastery"
                                value={form.slug}
                                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                className="w-full px-3 py-2 bg-transparent outline-none text-neutral-800 dark:text-neutral-200 text-sm"
                            />
                        </div>
                    </div>

                    {/* Cover Image */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                            Product Cover Image (Optional)
                        </label>
                        <div className="flex items-center gap-3">
                            {coverImage ? (
                                <img
                                    src={URL.createObjectURL(coverImage)}
                                    alt="Preview"
                                    className="h-14 w-14 rounded-lg object-cover bg-neutral-100 border border-neutral-200 dark:border-neutral-700"
                                />
                            ) : product?.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt="Current"
                                    className="h-14 w-14 rounded-lg object-cover bg-neutral-100 border border-neutral-200 dark:border-neutral-700"
                                />
                            ) : (
                                <div className="h-14 w-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                                    <Image className="h-6 w-6" />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCoverImage(e.target.files[0] || null)}
                                    className="text-xs text-neutral-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-900/30 dark:file:text-teal-300 cursor-pointer"
                                />
                                <p className="text-[11px] text-neutral-400 mt-1">
                                    Recommended: 800x800px or 1200x800px JPG/PNG image
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rich HTML Description & What's Included */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Description & What's Included <span className="text-teal-600 font-normal">(HTML Supported)</span>
                            </label>
                            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
                                <button
                                    type="button"
                                    onClick={() => setDescTab('editor')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                                        descTab === 'editor'
                                            ? 'bg-white dark:bg-neutral-700 text-teal-700 dark:text-teal-300 shadow-xs'
                                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                    }`}
                                >
                                    <Code2 className="h-3.5 w-3.5" />
                                    HTML / Code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDescTab('preview')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                                        descTab === 'preview'
                                            ? 'bg-white dark:bg-neutral-700 text-teal-700 dark:text-teal-300 shadow-xs'
                                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                    }`}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    Live Preview
                                </button>
                            </div>
                        </div>

                        {/* Toolbar */}
                        {descTab === 'editor' && (
                            <div className="flex flex-wrap items-center gap-1 p-1.5 bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-t-lg text-neutral-600 dark:text-neutral-300">
                                <button
                                    type="button"
                                    onClick={() => insertHtml('<strong>', '</strong>', 'Bold text')}
                                    title="Bold <strong>"
                                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-teal-600"
                                >
                                    <Bold className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertHtml('<em>', '</em>', 'Italic text')}
                                    title="Italic <em>"
                                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-teal-600"
                                >
                                    <Italic className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertHtml('<u>', '</u>', 'Underlined text')}
                                    title="Underline <u>"
                                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-teal-600"
                                >
                                    <Underline className="h-3.5 w-3.5" />
                                </button>

                                <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

                                <button
                                    type="button"
                                    onClick={() => insertHtml('<h2>', '</h2>', 'Main Heading')}
                                    title="Heading 2 <h2>"
                                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-teal-600 text-xs font-bold"
                                >
                                    <Heading2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertHtml('<h3>', '</h3>', 'Section Title')}
                                    title="Heading 3 <h3>"
                                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-teal-600 text-xs font-bold"
                                >
                                    <Heading3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertHtml('<p>', '</p>', 'Paragraph text')}
                                    title="Paragraph <p>"
                                    className="px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-teal-600 text-[11px] font-semibold"
                                >
                                    &lt;p&gt;
                                </button>

                                <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

                                <button
                                    type="button"
                                    onClick={() => insertHtml('<ul>\n  <li>', '</li>\n  <li>Feature 2</li>\n</ul>', 'Feature 1')}
                                    title="Bullet List <ul>"
                                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-teal-600"
                                >
                                    <List className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertHtml('<ol>\n  <li>', '</li>\n  <li>Step 2</li>\n</ol>', 'Step 1')}
                                    title="Numbered List <ol>"
                                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-teal-600"
                                >
                                    <ListOrdered className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={insertLink}
                                    title="Insert Link <a>"
                                    className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-teal-600"
                                >
                                    <Link2 className="h-3.5 w-3.5" />
                                </button>

                                <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

                                <button
                                    type="button"
                                    onClick={insertCalloutBox}
                                    title="Insert 'What's Included' Box"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-[10px] font-bold hover:bg-green-200"
                                >
                                    <CheckSquare className="h-3 w-3" />
                                    + What's Included Box
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertHtml('<span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px;">', '</span>', 'Instant Access')}
                                    title="Insert Highlight Badge"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold hover:bg-blue-200"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    + Badge
                                </button>
                            </div>
                        )}

                        {/* Editor vs Live Preview */}
                        {descTab === 'editor' ? (
                            <div>
                                <textarea
                                    ref={descTextareaRef}
                                    rows={5}
                                    placeholder="Write your product description or customize using HTML tags (<h3>, <p>, <ul>, <li>, <strong>, etc.)..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full rounded-b-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 text-sm font-mono text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                                <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1">
                                    <span>Tip: Write standard text or customize with HTML code.</span>
                                    <span>{form.description ? `${form.description.length} chars` : '0 chars'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 p-4 max-h-60 overflow-y-auto">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                                    Customer Checkout Preview
                                </div>
                                {form.description ? (
                                    <div
                                        className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed prose dark:prose-invert max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_a]:text-teal-600 [&_a]:underline"
                                        dangerouslySetInnerHTML={{ __html: form.description }}
                                    />
                                ) : (
                                    <p className="text-xs text-neutral-400 italic">
                                        No description written yet. Switch back to HTML / Code to add text or use formatting tools.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Digital File Delivery Configuration */}
                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-teal-600" />
                                Digital Fulfillment
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, asset_type: 'file_upload' })}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                                        form.asset_type === 'file_upload'
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                    }`}
                                >
                                    Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, asset_type: 'redirect_url' })}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                                        form.asset_type === 'redirect_url'
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                    }`}
                                >
                                    External URL
                                </button>
                            </div>
                        </div>

                        {form.asset_type === 'file_upload' ? (
                            <div>
                                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                                    Upload Digital Asset (PDF, ZIP, MP3, MP4, ePub - up to 100MB)
                                </label>
                                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-4 text-center hover:border-teal-500 transition relative">
                                    <input
                                        type="file"
                                        onChange={(e) => setDigitalFile(e.target.files[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <Upload className="h-6 w-6 mx-auto text-neutral-400 mb-1" />
                                    {digitalFile ? (
                                        <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
                                            Selected: {digitalFile.name} ({(digitalFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    ) : product?.digital_asset?.file_name ? (
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300">
                                            Current: <span className="font-medium text-teal-600">{product.digital_asset.file_name}</span> (Click to replace)
                                        </p>
                                    ) : (
                                        <p className="text-xs text-neutral-500">
                                            Click or drag your file here to upload securely
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                                    External Resource Link (Notion, Google Drive, Telegram/WhatsApp VIP group)
                                </label>
                                <div className="flex items-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2">
                                    <LinkIcon className="h-4 w-4 text-neutral-400" />
                                    <input
                                        type="url"
                                        placeholder="https://drive.google.com/..."
                                        value={form.external_redirect_url}
                                        onChange={(e) => setForm({ ...form, external_redirect_url: e.target.value })}
                                        className="w-full bg-transparent text-sm outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Affiliate & Partner Promotion Card */}
                    <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shrink-0 mt-0.5">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                            Allow Affiliates to Promote Product
                                        </span>
                                        {form.affiliate_enabled && (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                                                Active ({form.affiliate_commission_percentage || 0}%)
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        Enable to let registered affiliates promote your product and earn commission per sale.
                                    </p>
                                </div>
                            </div>

                            {/* iOS-style toggle switch */}
                            <button
                                type="button"
                                role="switch"
                                aria-checked={form.affiliate_enabled}
                                onClick={() => setForm({ ...form, affiliate_enabled: !form.affiliate_enabled })}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                    form.affiliate_enabled ? 'bg-purple-600' : 'bg-neutral-300 dark:bg-neutral-700'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                        form.affiliate_enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {form.affiliate_enabled ? (
                            <div className="pt-3 border-t border-purple-200/60 dark:border-purple-900/40 space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                            Affiliate Commission Percentage (%)
                                        </label>
                                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                                            {form.affiliate_commission_percentage || 0}% per sale
                                        </span>
                                    </div>

                                    {/* Preset quick buttons */}
                                    <div className="flex items-center gap-1.5 mb-2">
                                        {[10, 15, 20, 25, 30, 50].map((rate) => (
                                            <button
                                                key={rate}
                                                type="button"
                                                onClick={() => setForm({ ...form, affiliate_commission_percentage: String(rate) })}
                                                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                                                    String(form.affiliate_commission_percentage) === String(rate)
                                                        ? 'bg-purple-600 text-white shadow-xs'
                                                        : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                                }`}
                                            >
                                                {rate}%
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            required={form.affiliate_enabled}
                                            placeholder="15"
                                            value={form.affiliate_commission_percentage}
                                            onChange={(e) => setForm({ ...form, affiliate_commission_percentage: e.target.value })}
                                            className="w-full rounded-lg border border-purple-200 dark:border-purple-800/80 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                                            %
                                        </span>
                                    </div>
                                </div>

                                {/* Calculated payout preview */}
                                {Number(form.price) > 0 && Number(form.affiliate_commission_percentage) > 0 && (
                                    <div className="p-2.5 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-purple-100 dark:border-purple-900/40 text-xs flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                                        <span className="flex items-center gap-1 text-purple-900 dark:text-purple-300 font-medium">
                                            <Award className="h-3.5 w-3.5 text-purple-600" />
                                            Affiliate payout per sale:
                                        </span>
                                        <span className="font-bold text-purple-700 dark:text-purple-300 text-sm">
                                            {form.currency || 'NGN'} {((Number(form.price) * Number(form.affiliate_commission_percentage)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="pt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                                Affiliate promotion is currently disabled for this product.
                            </div>
                        )}
                    </div>

                    {/* Live status toggle */}
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="is_published"
                            checked={form.is_published}
                            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                            className="rounded border-neutral-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />
                        <label htmlFor="is_published" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                            Publish immediately (Make accessible at checkout link)
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 flex items-center gap-2 shadow-sm transition"
                        >
                            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create & Get Link'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

