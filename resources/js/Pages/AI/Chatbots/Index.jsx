import { Head, useForm, router, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import EmptyState from '@/Components/EmptyState';
import {
    Plus, Bot, Trash2, Play, Settings, Send, X, BookOpen, Zap,
    MessageSquare, Store, ShoppingBag, Wrench, ExternalLink, Sliders, Check
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownLite from '@/Components/MarkdownLite';

const TONE_OPTIONS = ['professional', 'friendly', 'formal', 'casual'];

const PURPOSE_BADGES = {
    sales: { label: 'Sales Assistant', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
    support: { label: 'Customer Support', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
    recommendation: { label: 'Product Advisor', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
    general: { label: 'General Assistant', color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300' },
};

function ToggleSwitch({ checked, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? 'bg-brand-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
    );
}

function PlaygroundPanel({ chatbot, products = [] }) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const send = async () => {
        if (!input.trim() || loading) return;
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const res = await fetch(route('client.ai.chatbots.playground', chatbot.uuid), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.content,
                },
                body: JSON.stringify({
                    message: userMsg.content,
                    history: messages,
                    product_id: selectedProduct ? parseInt(selectedProduct, 10) : null,
                }),
            });
            const data = await res.json();
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.reply ?? data.error ?? t('ai.playground_error'),
                    actions: data.actions || [],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <div className="flex flex-col h-[32rem] bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {/* Header & Product Simulator */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {chatbot.name} — Interactive Test
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">Context:</span>
                    <select
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(e.target.value)}
                        className="text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 text-neutral-700 dark:text-neutral-300 outline-none"
                    >
                        <option value="">Store General Context</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>Product: {p.name}</option>
                        ))}
                    </select>
                    {messages.length > 0 && (
                        <button onClick={() => setMessages([])} className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition">
                            {t('ai.clear')}
                        </button>
                    )}
                </div>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                        <MessageSquare className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-sm text-neutral-400 dark:text-neutral-500">
                            Ask anything! Try: "What products do you have?", "Can I get a discount?", or "Check my order ORD-..."
                        </p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}`}>
                                {m.role === 'user' ? 'U' : <Bot className="h-3.5 w-3.5" />}
                            </div>
                            <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === 'user' ? 'max-w-[75%] bg-brand-600 text-white rounded-tr-sm whitespace-pre-wrap break-words' : 'max-w-[85%] bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm rounded-tl-sm'}`}>
                                {m.role === 'user' ? m.content : <MarkdownLite content={m.content} />}
                            </div>
                        </div>

                        {/* Visual display of executed tools */}
                        {m.actions && m.actions.length > 0 && (
                            <div className="mt-1.5 ml-9 flex flex-wrap gap-1.5">
                                {m.actions.map((act, actIdx) => (
                                    <div key={actIdx} className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                                        <Wrench className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                                        <span>Tool: <strong>{act.tool}</strong></span>
                                        {act.result?.checkout_url && (
                                            <a
                                                href={act.result.checkout_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-0.5 text-brand-600 font-semibold hover:underline ml-1"
                                            >
                                                <span>Buy Link</span>
                                                <ExternalLink className="h-2.5 w-2.5" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-2">
                        <div className="shrink-0 w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                            <Bot className="h-3.5 w-3.5 text-neutral-500" />
                        </div>
                        <div className="bg-white dark:bg-neutral-700 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder={t('ai.type_a_message')}
                        className="flex-1 bg-transparent text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                    />
                    <button
                        onClick={send}
                        disabled={loading || !input.trim()}
                        className="shrink-0 w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
                    >
                        <Send className="h-3.5 w-3.5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ChatbotCard({ chatbot, knowledgeBases = [], stores = [], products = [], availableTools = [] }) {
    const { t } = useTranslation();
    const [panel, setPanel] = useState(null); // null | 'playground' | 'settings'
    const [settingsTab, setSettingsTab] = useState('persona'); // 'persona' | 'kb' | 'stores' | 'products'

    // Initial bound IDs
    const initialKbIds = (chatbot.knowledge_bases || []).map(kb => kb.id);
    if (chatbot.ai_kb_id && !initialKbIds.includes(chatbot.ai_kb_id)) {
        initialKbIds.push(chatbot.ai_kb_id);
    }
    const initialStoreIds = (chatbot.store_connections || []).map(sc => sc.store_id);
    const initialProductIds = (chatbot.product_assignments || []).map(pa => pa.product_id);
    const initialTools = (chatbot.tool_permissions || [])
        .filter(tp => tp.is_allowed)
        .map(tp => tp.tool_name);
    const defaultActiveTools = initialTools.length > 0 ? initialTools : availableTools.map(t => t.name);

    const { data, setData, put, processing } = useForm({
        name: chatbot.name,
        purpose: chatbot.purpose || 'sales',
        tone: chatbot.tone || 'professional',
        temperature: chatbot.temperature !== undefined ? chatbot.temperature : 0.70,
        max_context_chunks: chatbot.max_context_chunks || 5,
        fallback_reply: chatbot.fallback_reply || '',
        system_prompt: chatbot.system_prompt || '',
        is_default: chatbot.is_default || false,
        enabled: chatbot.enabled,
        knowledge_base_ids: initialKbIds,
        store_ids: initialStoreIds,
        product_ids: initialProductIds,
        tools: defaultActiveTools,
    });

    const save = (e) => {
        e.preventDefault();
        put(route('client.ai.chatbots.update', chatbot.uuid), { preserveScroll: true });
    };

    const handleDelete = () => {
        if (confirm(t('ai.delete_chatbot_confirm', { name: chatbot.name }))) {
            router.delete(route('client.ai.chatbots.destroy', chatbot.uuid), { preserveScroll: true });
        }
    };

    const toggleKb = (id) => {
        const next = data.knowledge_base_ids.includes(id)
            ? data.knowledge_base_ids.filter(x => x !== id)
            : [...data.knowledge_base_ids, id];
        setData('knowledge_base_ids', next);
    };

    const toggleStore = (id) => {
        const next = data.store_ids.includes(id)
            ? data.store_ids.filter(x => x !== id)
            : [...data.store_ids, id];
        setData('store_ids', next);
    };

    const toggleProduct = (id) => {
        const next = data.product_ids.includes(id)
            ? data.product_ids.filter(x => x !== id)
            : [...data.product_ids, id];
        setData('product_ids', next);
    };

    const toggleTool = (toolName) => {
        const next = data.tools.includes(toolName)
            ? data.tools.filter(x => x !== toolName)
            : [...data.tools, toolName];
        setData('tools', next);
    };

    const purposeInfo = PURPOSE_BADGES[chatbot.purpose] || PURPOSE_BADGES.sales;

    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden transition hover:shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{chatbot.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${purposeInfo.color}`}>
                            {purposeInfo.label}
                        </span>
                        {chatbot.is_default && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                Default Bot
                            </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${chatbot.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                            {chatbot.enabled ? t('common.active') : t('ai.disabled')}
                        </span>
                    </div>

                    {/* Metadata Subtitle */}
                    <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                        <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {data.knowledge_base_ids.length} Knowledge {data.knowledge_base_ids.length === 1 ? 'Source' : 'Sources'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {data.store_ids.length} Connected {data.store_ids.length === 1 ? 'Store' : 'Stores'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            {data.tools.length} Tools Active
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setPanel(prev => prev === 'playground' ? null : 'playground')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${panel === 'playground' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                        <Play className="h-3.5 w-3.5" /> Test Chat
                    </button>
                    <button
                        onClick={() => setPanel(prev => prev === 'settings' ? null : 'settings')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${panel === 'settings' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                        <Settings className="h-3.5 w-3.5" /> Manage
                    </button>
                    <button onClick={handleDelete} className="rounded-lg p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Test Playground Panel */}
            {panel === 'playground' && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 px-5 pb-5 pt-4">
                    <PlaygroundPanel chatbot={chatbot} products={products} />
                </div>
            )}

            {/* Multi-Tab Settings Panel */}
            {panel === 'settings' && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 px-5 pb-5 pt-4 space-y-4">
                    {/* Sub-tabs nav */}
                    <div className="flex border-b border-neutral-200 dark:border-neutral-700 gap-4 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setSettingsTab('persona')}
                            className={`pb-2 border-b-2 transition ${settingsTab === 'persona' ? 'border-brand-600 text-brand-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                        >
                            Persona & Directives
                        </button>
                        <button
                            type="button"
                            onClick={() => setSettingsTab('kb')}
                            className={`pb-2 border-b-2 transition ${settingsTab === 'kb' ? 'border-brand-600 text-brand-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                        >
                            Knowledge Bases ({data.knowledge_base_ids.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSettingsTab('stores')}
                            className={`pb-2 border-b-2 transition ${settingsTab === 'stores' ? 'border-brand-600 text-brand-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                        >
                            Stores & Tools ({data.tools.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSettingsTab('products')}
                            className={`pb-2 border-b-2 transition ${settingsTab === 'products' ? 'border-brand-600 text-brand-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                        >
                            Product Overrides ({data.product_ids.length})
                        </button>
                    </div>

                    <form onSubmit={save} className="space-y-4">
                        {/* Tab 1: Persona */}
                        {settingsTab === 'persona' && (
                            <div className="space-y-4">
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase">Bot Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase">Purpose</label>
                                        <select
                                            value={data.purpose}
                                            onChange={e => setData('purpose', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                        >
                                            <option value="sales">Sales Assistant (Pre-sales, Checkout, Recommender)</option>
                                            <option value="support">Customer Support (Tracking, FAQs, Returns)</option>
                                            <option value="recommendation">Product Advisor / Specialist</option>
                                            <option value="general">General Assistant</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase">Tone</label>
                                        <select
                                            value={data.tone}
                                            onChange={e => setData('tone', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                        >
                                            {TONE_OPTIONS.map(tone => <option key={tone} value={tone}>{tone.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-neutral-500 uppercase">System Prompt Directives</label>
                                    <textarea
                                        value={data.system_prompt}
                                        onChange={e => setData('system_prompt', e.target.value)}
                                        rows={3}
                                        placeholder="You are an expert commerce assistant. Answer buyer questions accurately and encourage purchases..."
                                        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase">Fallback Reply</label>
                                        <input
                                            type="text"
                                            value={data.fallback_reply}
                                            onChange={e => setData('fallback_reply', e.target.value)}
                                            placeholder="I'm having trouble retrieving that. Let me connect you with our team."
                                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                        />
                                    </div>
                                    <div className="flex items-center gap-6 pt-5">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                            <input
                                                type="checkbox"
                                                checked={data.is_default}
                                                onChange={e => setData('is_default', e.target.checked)}
                                                className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            Default Storefront Bot
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <ToggleSwitch checked={data.enabled} onChange={v => setData('enabled', v)} />
                                            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Knowledge Bases */}
                        {settingsTab === 'kb' && (
                            <div className="space-y-3">
                                <p className="text-xs text-neutral-500">
                                    Select the knowledge bases this bot should search across when answering questions (policies, guides, brand FAQs).
                                </p>
                                <div className="grid sm:grid-cols-2 gap-2">
                                    {knowledgeBases.map(kb => {
                                        const isChecked = data.knowledge_base_ids.includes(kb.id);
                                        return (
                                            <label
                                                key={kb.id}
                                                onClick={() => toggleKb(kb.id)}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${isChecked ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'}`}
                                            >
                                                <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-neutral-300'}`}>
                                                    {isChecked && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{kb.name}</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                    {knowledgeBases.length === 0 && (
                                        <p className="text-xs text-neutral-400 italic">No knowledge bases found in this workspace.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Stores & Commerce Tools */}
                        {settingsTab === 'stores' && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-2">Connected Stores</h4>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                        {stores.map(st => {
                                            const isChecked = data.store_ids.includes(st.id);
                                            return (
                                                <label
                                                    key={st.id}
                                                    onClick={() => toggleStore(st.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${isChecked ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-neutral-300'}`}>
                                                        {isChecked && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{st.name || 'Botify Store'}</p>
                                                        <p className="text-xs text-neutral-400 uppercase">{st.platform} · {st.currency}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-2">Real-Time Commerce Tools</h4>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                        {availableTools.map(tl => {
                                            const isChecked = data.tools.includes(tl.name);
                                            return (
                                                <div
                                                    key={tl.name}
                                                    onClick={() => toggleTool(tl.name)}
                                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${isChecked ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'}`}
                                                >
                                                    <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-teal-600 border-teal-600 text-white' : 'border-neutral-300'}`}>
                                                        {isChecked && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 font-mono">{tl.name}</p>
                                                        <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{tl.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: Product Overrides */}
                        {settingsTab === 'products' && (
                            <div className="space-y-3">
                                <p className="text-xs text-neutral-500">
                                    Assign specific products to this bot. When a buyer visits the selected product page, this specialized bot handles their questions automatically.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                    {products.map(p => {
                                        const isChecked = data.product_ids.includes(p.id);
                                        return (
                                            <label
                                                key={p.id}
                                                onClick={() => toggleProduct(p.id)}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition ${isChecked ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'}`}
                                            >
                                                <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-neutral-300'}`}>
                                                    {isChecked && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="flex-1 truncate">
                                                    <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">{p.name}</p>
                                                    <p className="text-xs text-neutral-400">{p.currency} {Number(p.price).toLocaleString()}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition"
                            >
                                {processing ? t('ai.saving') : t('ai.save_changes')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPanel(null)}
                                className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function AiChatbotsIndex({ chatbots = [], knowledgeBases = [], stores = [], products = [], availableTools = [] }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};
    const [showCreate, setShowCreate] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        purpose: 'sales',
    });

    const handleCreate = (e) => {
        e.preventDefault();
        post(route('client.ai.chatbots.store'), {
            onSuccess: () => {
                reset();
                setShowCreate(false);
            },
        });
    };

    return (
        <ClientLayout title="Multi-Tenant AI Commerce Bots">
            <Head title="AI Commerce Bots · BotifyAI" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">AI Commerce Agents</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Create specialized AI bots trained on your store knowledge and equipped with real-time commerce tools (catalog search, live pricing, and 1-click checkout).
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition shadow-sm"
                    >
                        <Plus className="h-4 w-4" /> Create Bot
                    </button>
                </div>

                {/* Stats Bar */}
                {chatbots.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'Total Bots', value: chatbots.length, icon: Bot, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
                            { label: 'Active Bots', value: chatbots.filter(c => c.enabled).length, icon: Zap, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                            { label: 'Store Connections', value: stores.length, icon: Store, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                            { label: 'Catalog Products', value: products.length, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                        ].map(stat => (
                            <div key={stat.label} className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                                    <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">{stat.value}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {flash.success && (
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        {flash.success}
                    </div>
                )}

                {/* Chatbots list */}
                <div className="space-y-3">
                    {chatbots.map(cb => (
                        <ChatbotCard
                            key={cb.id}
                            chatbot={cb}
                            knowledgeBases={knowledgeBases}
                            stores={stores}
                            products={products}
                            availableTools={availableTools}
                        />
                    ))}
                    {chatbots.length === 0 && (
                        <EmptyState
                            icon={<Bot className="h-8 w-8" />}
                            title="No AI Commerce Bots Created"
                            description="Create specialized sales, customer support, or product recommendation bots for your stores."
                            action={{ label: 'Create First Bot', onClick: () => setShowCreate(true) }}
                        />
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                                </div>
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Create AI Commerce Bot</h3>
                            </div>
                            <button onClick={() => setShowCreate(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Bot Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                    autoFocus
                                    placeholder="e.g. Fashion Sales Specialist"
                                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Primary Purpose</label>
                                <select
                                    value={data.purpose}
                                    onChange={e => setData('purpose', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                                >
                                    <option value="sales">Sales Assistant (Catalog & 1-Click Checkout)</option>
                                    <option value="support">Customer Support (Order Tracking & Care)</option>
                                    <option value="recommendation">Product Recommender</option>
                                    <option value="general">General Commerce Assistant</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition"
                                >
                                    {processing ? 'Creating...' : 'Create Bot'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ClientLayout>
    );
}
