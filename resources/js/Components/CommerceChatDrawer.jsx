import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, ShoppingBag, ExternalLink, ChevronDown } from 'lucide-react';
import axios from 'axios';
import MarkdownLite from '@/Components/MarkdownLite';

export default function CommerceChatDrawer({ product = null, store = {} }) {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState(null);
    const [sessionToken, setSessionToken] = useState('');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
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
                    // Add initial greeting if no messages yet
                    setMessages([
                        {
                            role: 'assistant',
                            content: res.data.greeting,
                        },
                    ]);
                }
            })
            .catch(() => {
                // Assistant is offline or disabled
            });
    }, [contextId, product?.id, product?.slug, store?.id, store?.slug]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const sendMessage = async (textToSend) => {
        const text = textToSend || input;
        if (!text.trim() || loading || !config) return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
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

            const reply = res.data?.reply || "I'm having trouble getting that answer right now. Please feel free to use the checkout form on this page!";
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
                    content: "Sorry, I couldn't process your message. Please check the checkout details above!",
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

    if (!config || !config.enabled) {
        return null;
    }

    const brandColor = store.brand_color || '#0D9488';

    return (
        <div className="fixed bottom-5 right-5 z-40">
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-full text-white font-medium text-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 group"
                    style={{ backgroundColor: brandColor }}
                    aria-label="Ask AI Assistant"
                >
                    <div className="relative">
                        <Sparkles className="h-4 w-4 animate-pulse text-amber-200" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    </div>
                    <span className="tracking-tight">Ask AI about this product</span>
                </button>
            )}

            {/* Chat Drawer */}
            {isOpen && (
                <div className="fixed inset-x-4 bottom-4 sm:inset-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-96 max-w-lg h-[32rem] max-h-[85vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div
                        className="px-4 py-3 text-white flex items-center justify-between shadow-sm"
                        style={{ backgroundColor: brandColor }}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs text-white">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm leading-tight">{config.bot.name}</h3>
                                <p className="text-[11px] text-white/80 leading-none mt-0.5">
                                    {config.store.name} · Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded-lg hover:bg-white/20 transition text-white/90"
                            aria-label="Close Chat"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/50">
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

                                {/* Render Actions / Checkout Buttons */}
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

                    {/* Suggested Question Pills (shown if fewer than 3 user messages) */}
                    {config.suggested_prompts && messages.filter(m => m.role === 'user').length < 2 && (
                        <div className="px-3 py-2 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 overflow-x-auto flex gap-1.5 no-scrollbar">
                            {config.suggested_prompts.map((prompt, pIdx) => (
                                <button
                                    key={pIdx}
                                    onClick={() => sendMessage(prompt)}
                                    disabled={loading}
                                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 transition"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Footer */}
                    <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
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
                                onClick={() => sendMessage()}
                                disabled={loading || !input.trim()}
                                className="p-1.5 rounded-lg text-white disabled:opacity-40 transition"
                                style={{ backgroundColor: brandColor }}
                            >
                                <Send className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="text-[10px] text-center text-neutral-400 mt-1">
                            AI assistant powered by BotifyAI
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

