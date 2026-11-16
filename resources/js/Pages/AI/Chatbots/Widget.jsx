import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import {
    Code, Copy, Check, Sparkles, MessageSquare, ShieldCheck,
    Palette, Sliders, ExternalLink, RefreshCw, Smartphone, Monitor
} from 'lucide-react';

const PRESET_COLORS = [
    '#0D9488', // Teal
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#18181B', // Dark Zinc
];

export default function ChatbotWidgetPage({ widget, chatbots = [], embedSnippet, appUrl }) {
    const [copied, setCopied] = useState(false);
    const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop | mobile
    const [previewOpen, setPreviewOpen] = useState(true);

    const { data, setData, post, processing, errors } = useForm({
        chatbot_id: widget?.chatbot_id || (chatbots[0]?.id ?? ''),
        theme: widget?.theme || 'modern',
        position: widget?.position || 'bottom_right',
        primary_color: widget?.primary_color || '#0D9488',
        welcome_message: widget?.welcome_message || "Hi there! 👋 How can I help you today? Ask me anything about our products, services, or pricing.",
        enable_lead_capture: widget?.enable_lead_capture ?? true,
        enable_human_takeover: widget?.enable_human_takeover ?? true,
        allowed_domains: widget?.allowed_domains || '',
        status: widget?.status || 'active',
    });

    const selectedBot = chatbots.find(b => String(b.id) === String(data.chatbot_id)) || chatbots[0];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('client.ai.widgets.store'));
    };

    const handleCopyCode = () => {
        if (!embedSnippet) return;
        navigator.clipboard.writeText(embedSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleRegenerateKey = () => {
        if (confirm('Regenerating your widget key will disconnect any existing installations until you replace the embed code. Continue?')) {
            router.post(route('client.ai.widgets.regenerate-key'));
        }
    };

    return (
        <ClientLayout>
            <Head title="Website AI Chat Widget Deployment" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
                            <Sparkles className="h-4 w-4" />
                            <span>Chatbot Deployment</span>
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            Website AI Chat Widget
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Deploy your AI agent to any external website, Shopify store, or WordPress blog with a single line of script.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRegenerateKey}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition"
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-neutral-400" />
                            Regenerate Key
                        </button>

                        <button
                            type="button"
                            onClick={handleCopyCode}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied to Clipboard!' : 'Copy Embed Code'}
                        </button>
                    </div>
                </div>

                {/* Embed Snippet Banner */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 p-5 text-neutral-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
                            <Code className="h-4 w-4 text-teal-400" />
                            <span>Copy & Paste Embed Script (Place before <code className="text-teal-300">&lt;/body&gt;</code>)</span>
                        </div>
                        <span className="text-xs text-neutral-400">Works with HTML, WordPress, Shopify, React, Vue, Next.js</span>
                    </div>

                    <div className="relative font-mono text-xs bg-neutral-950 p-4 rounded-lg overflow-x-auto border border-neutral-800 text-neutral-300">
                        <pre>{embedSnippet || '<!-- Widget key generating... -->'}</pre>
                        <button
                            type="button"
                            onClick={handleCopyCode}
                            className="absolute top-3 right-3 p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
                            title="Copy Code"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                    </div>
                </div>

                {/* Main 2-Column Layout: Form Left, Preview Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Form: Customization */}
                    <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                            <Sliders className="h-5 w-5 text-teal-600" />
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                Widget Configuration & Appearance
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Chatbot Selector */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                    Assigned AI Chatbot
                                </label>
                                <select
                                    value={data.chatbot_id}
                                    onChange={(e) => setData('chatbot_id', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    {chatbots.map((bot) => (
                                        <option key={bot.id} value={bot.id}>
                                            {bot.name} ({bot.purpose || 'General AI'})
                                        </option>
                                    ))}
                                </select>
                                {errors.chatbot_id && <p className="text-xs text-red-500 mt-1">{errors.chatbot_id}</p>}
                            </div>

                            {/* Status & Position */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                        Widget Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    >
                                        <option value="active">Active (Visible)</option>
                                        <option value="inactive">Inactive (Disabled)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                        Screen Position
                                    </label>
                                    <select
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    >
                                        <option value="bottom_right">Bottom Right (Recommended)</option>
                                        <option value="bottom_left">Bottom Left</option>
                                    </select>
                                </div>
                            </div>

                            {/* Theme Selection */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                    Theme Style
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['modern', 'clean', 'dark', 'minimal'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setData('theme', t)}
                                            className={`px-3 py-2 text-xs font-medium rounded-lg border text-center capitalize transition ${
                                                data.theme === t
                                                    ? 'border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                                                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brand Color */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                    Primary Brand Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        {PRESET_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setData('primary_color', c)}
                                                className={`h-7 w-7 rounded-full border-2 transition ${
                                                    data.primary_color === c ? 'scale-110 border-neutral-900 dark:border-white' : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={data.primary_color}
                                        onChange={(e) => setData('primary_color', e.target.value)}
                                        className="w-28 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                                    />
                                </div>
                            </div>

                            {/* Welcome Message */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                    Initial Welcome Message
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.welcome_message}
                                    onChange={(e) => setData('welcome_message', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Enter the greeting your visitors will see when opening the chat..."
                                />
                                {errors.welcome_message && <p className="text-xs text-red-500 mt-1">{errors.welcome_message}</p>}
                            </div>

                            {/* Toggles */}
                            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Lead Capture</p>
                                        <p className="text-xs text-neutral-500">Collect visitor email & phone during conversation.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={data.enable_lead_capture}
                                        onChange={(e) => setData('enable_lead_capture', e.target.checked)}
                                        className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-neutral-300"
                                    />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Human Agent Takeover</p>
                                        <p className="text-xs text-neutral-500">Allow customers to request speaking with a live human team member.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={data.enable_human_takeover}
                                        onChange={(e) => setData('enable_human_takeover', e.target.checked)}
                                        className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-neutral-300"
                                    />
                                </label>
                            </div>

                            {/* Save Button */}
                            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save & Publish Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right: Live Interactive Simulator */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                Live Interactive Simulator
                            </span>
                            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setPreviewDevice('desktop')}
                                    className={`p-1.5 rounded-md ${previewDevice === 'desktop' ? 'bg-white dark:bg-neutral-700 text-teal-600 shadow-xs' : 'text-neutral-400'}`}
                                    title="Desktop View"
                                >
                                    <Monitor className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewDevice('mobile')}
                                    className={`p-1.5 rounded-md ${previewDevice === 'mobile' ? 'bg-white dark:bg-neutral-700 text-teal-600 shadow-xs' : 'text-neutral-400'}`}
                                    title="Mobile View"
                                >
                                    <Smartphone className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Simulator Frame */}
                        <div className="relative border border-neutral-300 dark:border-neutral-700 rounded-2xl bg-neutral-100 dark:bg-neutral-950 p-4 min-h-[580px] flex flex-col justify-end overflow-hidden shadow-inner">
                            {/* Mock Website Background */}
                            <div className="absolute inset-0 p-5 opacity-40 pointer-events-none select-none text-xs text-neutral-500">
                                <div className="h-4 w-28 bg-neutral-300 dark:bg-neutral-700 rounded mb-4" />
                                <div className="h-8 w-60 bg-neutral-300 dark:bg-neutral-700 rounded mb-3" />
                                <div className="h-3 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                                <div className="h-3 w-36 bg-neutral-200 dark:bg-neutral-800 rounded mb-6" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                                    <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                                </div>
                            </div>

                            {/* Floating Chat Modal */}
                            {previewOpen && (
                                <div className={`relative z-10 mx-auto w-full max-w-[340px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-4 flex flex-col h-[460px]`}>
                                    {/* Modal Header */}
                                    <div
                                        className="p-3.5 text-white flex items-center justify-between"
                                        style={{ backgroundColor: data.primary_color }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                                                {selectedBot?.name ? selectedBot.name.charAt(0).toUpperCase() : 'B'}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold leading-none">{selectedBot?.name || 'Botify AI'}</h4>
                                                <p className="text-[10px] opacity-80 mt-1 flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                                                    Online & Active
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewOpen(false)}
                                            className="text-white/80 hover:text-white text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Takeover Notice */}
                                    {data.enable_human_takeover && (
                                        <div className="bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/40 px-3 py-1.5 text-[11px] text-sky-700 dark:text-sky-300 flex items-center justify-between">
                                            <span>Need human agent?</span>
                                            <button type="button" className="font-semibold underline">Request Human</button>
                                        </div>
                                    )}

                                    {/* Body */}
                                    <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-neutral-50 dark:bg-neutral-950/50 text-xs">
                                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2.5 rounded-xl rounded-bl-xs text-neutral-800 dark:text-neutral-200 max-w-[85%]">
                                            <span className="text-[9px] font-bold text-teal-600 uppercase block mb-1">🤖 {selectedBot?.name || 'AI Assistant'}</span>
                                            {data.welcome_message}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-1.5 rounded-md text-[11px] text-neutral-600 dark:text-neutral-300 hover:border-teal-500 cursor-pointer">
                                                Tell me about your services
                                            </div>
                                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-1.5 rounded-md text-[11px] text-neutral-600 dark:text-neutral-300 hover:border-teal-500 cursor-pointer">
                                                What are your pricing plans?
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-2.5 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                                        <input
                                            type="text"
                                            disabled
                                            placeholder="Type a message..."
                                            className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1.5 text-xs outline-none text-neutral-500"
                                        />
                                        <div
                                            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                                            style={{ backgroundColor: data.primary_color }}
                                        >
                                            ➤
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Floating Launcher Button */}
                            <div className={`relative z-10 flex ${data.position === 'bottom_left' ? 'justify-start' : 'justify-end'}`}>
                                <button
                                    type="button"
                                    onClick={() => setPreviewOpen(!previewOpen)}
                                    className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center text-white transition hover:scale-105"
                                    style={{ backgroundColor: data.primary_color }}
                                >
                                    <MessageSquare className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
