import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, MessageCircle, X, Send, Bot, Sparkles,
    ShoppingBag, ExternalLink, ChevronRight, ChevronLeft,
    User, Search, ArrowRight, Mail, Phone, ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import MarkdownLite from '@/Components/MarkdownLite';

export default function CommerceChatDrawer({ product = null, store = {} }) {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('hub'); // 'hub' | 'chat'
    const [config, setConfig] = useState(null);
    const [sessionToken, setSessionToken] = useState('');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const contextId = product?.id ? `p_${product.id}` : (store?.id ? `s_${store.id}` : 'store');

    // Initialize or restore session token
    useEffect(() => {
        let token = localStorage.getItem(`botify_chat_sess_${contextId}`);
        if (!token) {
            token = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem(`botify_chat_sess_${contextId}`, token);
        }
        setSessionToken(token);

        // Fetch widget configuration
        const query = product?.slug || product?.id
            ? `product=${product.slug || product.id}`
            : (store?.slug || store?.uuid ? `store=${store.slug || store.uuid}` : null);

        if (!query) return;

        axios.get(`/api/v1/public/widget/config?${query}`)
            .then(res => {
                if (res.data?.enabled) {
                    setConfig(res.data);
                    setMessages([
                        {
                            role: 'assistant',
                            content: res.data.greeting,
                        },
                    ]);
                }
            })
            .catch(() => {
                // Keep default fallback config if API is offline
                setConfig({
                    enabled: true,
                    bot: { name: 'AI Commerce Assistant' },
                    greeting: `Hi there! 👋 Welcome to ${store?.name || 'our store'}. How can we assist you with your purchase today?`,
                    suggested_prompts: [
                        'How do I make payment?',
                        'Is download instant?',
                        'How do I contact support?',
                    ],
                });
            });
    }, [contextId, product?.id, product?.slug, store?.id, store?.slug, store?.name]);

    useEffect(() => {
        if (isOpen && view === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, view]);

    const sendMessage = async (textToSend) => {
        const text = textToSend || input;
        if (!text.trim() || loading) return;

        setView('chat');
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSearchInput('');
        setLoading(true);

        try {
            const payload = {
                session_token: sessionToken,
                message: userMsg.content,
                history: messages,
            };
            if (product?.id) {
                payload.product_id = product.id;
            } else if (store?.id) {
                payload.store_id = store.id;
            }

            const res = await axios.post('/api/v1/public/widget/chat', payload);

            const reply = res.data?.reply || "I'm having trouble retrieving details at this moment. You can safely complete your purchase using the checkout form on this page!";
            const actions = res.data?.actions || [];

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: reply,
                    actions: actions,
                },
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: "Instant delivery is guaranteed immediately after payment confirmation. Please feel free to proceed with checkout!",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            sendMessage(searchInput.trim());
        }
    };

    const handleContactSeller = () => {
        if (store?.support_email) {
            window.location.href = `mailto:${store.support_email}`;
        } else if (store?.support_phone) {
            window.location.href = `tel:${store.support_phone}`;
        } else {
            sendMessage("How can I contact the seller for support?");
        }
    };

    const brandColor = store?.brand_color || '#4a154b';

    const quickQuestions = [
        {
            title: 'How to Buy',
            prompt: 'How do I purchase this product and complete my order?',
        },
        {
            title: 'Can I download this product?',
            prompt: 'Can I download this digital product immediately after payment?',
        },
        {
            title: 'Pay with Transfer or Card',
            prompt: 'How do I pay with Bank Transfer or Card?',
        },
        {
            title: 'Product Details & Delivery',
            prompt: product?.name ? `Tell me more about ${product.name} and delivery terms.` : 'Tell me more about your store and products.',
        },
    ];

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {/* Round Live Chat Floating Action Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-purple-500/30"
                style={{ backgroundColor: brandColor }}
                aria-label={isOpen ? "Close live chat" : "Open live chat"}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white transition-transform duration-200 rotate-0 hover:rotate-90" />
                ) : (
                    <>
                        <MessageSquare className="w-6 h-6 text-white transition-transform duration-200 group-hover:scale-110" />
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-neutral-900 rounded-full" />
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping opacity-75" />
                    </>
                )}
            </button>

            {/* Live Chat & Help Desk Modal Drawer */}
            {isOpen && (
                <div className="fixed inset-x-3 bottom-20 sm:inset-auto sm:right-5 sm:bottom-22 z-50 w-auto sm:w-[380px] max-w-[calc(100vw-24px)] h-[540px] max-h-[82vh] bg-white dark:bg-neutral-900 rounded-[28px] shadow-2xl border border-neutral-200/90 dark:border-neutral-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 antialiased">
                    {/* VIEW 1: Help Center Hub (Matches uploaded reference design) */}
                    {view === 'hub' ? (
                        <div className="flex flex-col h-full">
                            {/* Hub Header */}
                            <div
                                className="p-6 pb-8 text-white relative shadow-sm"
                                style={{ backgroundColor: brandColor }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                                            Hi there 👋
                                        </h2>
                                        <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium">
                                            How can we help you today?
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 rounded-full bg-black/15 hover:bg-black/25 transition text-white"
                                        aria-label="Close"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Hub Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-4 -mt-4 space-y-3.5 bg-neutral-50/80 dark:bg-neutral-950/80 rounded-t-[24px]">
                                {/* Quick Question List & Search Desk Card */}
                                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/80">
                                    {quickQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => sendMessage(q.prompt)}
                                            className="w-full px-4 py-3 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition group"
                                        >
                                            <span className="truncate">{q.title}</span>
                                            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                                        </button>
                                    ))}

                                    {/* Search / Ask Question Field */}
                                    <form onSubmit={handleSearchSubmit} className="p-3 bg-neutral-50/60 dark:bg-neutral-800/40 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            placeholder="Search our help desk for more..."
                                            className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none"
                                        />
                                        <button
                                            type="submit"
                                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                                            aria-label="Search"
                                        >
                                            <Search className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>

                                {/* Contact Product Seller Card */}
                                <div
                                    onClick={handleContactSeller}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-3.5 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 flex items-center justify-center font-bold shrink-0">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                                Contact Product Seller
                                            </h4>
                                            <p className="text-[11px] text-neutral-500 truncate">
                                                {store?.support_email || 'Reach out to seller'}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                                </div>

                                {/* 24/7 AI Live Chat Card */}
                                <div
                                    onClick={() => setView('chat')}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-3.5 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                                General Support & AI Chat
                                            </h4>
                                            <p className="text-[11px] text-neutral-500 truncate">
                                                Chat 24/7 with our AI assistant
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                                </div>

                                {/* Footer Branding */}
                                <div className="pt-2 pb-1 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1">
                                    <span>Powered by</span>
                                    <a
                                        href="https://botifyai.cloud"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-extrabold text-neutral-700 dark:text-neutral-300 hover:underline"
                                    >
                                        BotifyAI
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* VIEW 2: Active AI Conversation */
                        <div className="flex flex-col h-full">
                            {/* Chat Header */}
                            <div
                                className="px-4 py-3.5 text-white flex items-center justify-between shadow-sm shrink-0"
                                style={{ backgroundColor: brandColor }}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => setView('hub')}
                                        className="p-1 rounded-lg hover:bg-white/20 transition text-white shrink-0"
                                        title="Back to Help Hub"
                                        aria-label="Back to Help Hub"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs text-white shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-xs sm:text-sm leading-tight truncate">
                                            {config?.bot?.name || 'AI Commerce Assistant'}
                                        </h3>
                                        <p className="text-[10px] text-white/80 leading-none mt-0.5 flex items-center gap-1 truncate">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
                                            {store?.name || 'Botify Store'} · Online
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-lg hover:bg-white/20 transition text-white/90 shrink-0"
                                    aria-label="Close Chat"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Chat Messages Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/70 dark:bg-neutral-900/70">
                                {messages.map((m, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed max-w-[88%] shadow-xs ${
                                                m.role === 'user'
                                                    ? 'text-white rounded-tr-xs'
                                                    : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/60 rounded-tl-xs'
                                            }`}
                                            style={m.role === 'user' ? { backgroundColor: brandColor } : {}}
                                        >
                                            {m.role === 'user' ? m.content : <MarkdownLite content={m.content} />}
                                        </div>

                                        {/* Action Button Pills */}
                                        {m.actions && m.actions.length > 0 && (
                                            <div className="mt-2 space-y-1.5 w-full max-w-[88%]">
                                                {m.actions.map((act, actIdx) => {
                                                    const res = act.result || {};
                                                    if (res.checkout_url) {
                                                        return (
                                                            <a
                                                                key={actIdx}
                                                                href={res.checkout_url}
                                                                className="flex items-center justify-between gap-2 w-full p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition shadow-sm"
                                                            >
                                                                <span className="flex items-center gap-1.5">
                                                                    <ShoppingBag className="h-3.5 w-3.5" />
                                                                    Buy {res.product_name || 'Now'} ({res.currency} {res.total})
                                                                </span>
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                            </a>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 w-fit">
                                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggested Prompts Bar */}
                            {config?.suggested_prompts && messages.filter(m => m.role === 'user').length < 2 && (
                                <div className="px-3 py-2 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 overflow-x-auto flex gap-1.5 no-scrollbar">
                                    {config.suggested_prompts.map((prompt, pIdx) => (
                                        <button
                                            key={pIdx}
                                            type="button"
                                            onClick={() => sendMessage(prompt)}
                                            disabled={loading}
                                            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 transition"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Chat Input Footer */}
                            <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask a question..."
                                        className="flex-1 bg-transparent text-xs sm:text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => sendMessage()}
                                        disabled={loading || !input.trim()}
                                        className="p-1.5 rounded-lg text-white disabled:opacity-40 transition"
                                        style={{ backgroundColor: brandColor }}
                                        aria-label="Send message"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div className="text-[10px] text-center text-neutral-400 mt-1 flex items-center justify-center gap-1">
                                    <span>Powered by</span>
                                    <span className="font-bold text-neutral-600 dark:text-neutral-400">BotifyAI</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


