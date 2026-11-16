/**
 * Botify AI Embeddable Chat Widget
 * High-performance, zero-dependency async client script.
 * Compatible with HTML5, WordPress, Shopify, WooCommerce, Laravel, React, Vue, Webflow, etc.
 */
(function () {
    'use strict';

    if (window.__BotifyAIWidgetLoaded) return;
    window.__BotifyAIWidgetLoaded = true;

    // Helper to ensure DOM is ready
    function onReady(fn) {
        if (document.readyState === 'complete' || document.readyState === 'interactive' || document.body) {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    // Resolve API origin
    function resolveApiOrigin(config) {
        if (config.apiUrl) {
            return config.apiUrl.replace(/\/+$/, '');
        }

        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('widget.js') !== -1) {
                try {
                    var u = new URL(src);
                    return u.origin;
                } catch (e) {
                    var m = src.match(/^(https?:\/\/[^\/]+)/);
                    if (m) return m[1];
                }
            }
        }

        return 'https://botifyai.cloud';
    }

    // Wait for window.BotifyAIConfig with graceful retry (handles deferred or async WordPress script tags)
    var attempts = 0;
    var maxAttempts = 40; // 40 * 100ms = 4 seconds timeout

    function startBootstrap() {
        var config = window.BotifyAIConfig || {};
        var botId = config.botId || config.widgetKey || config.key || '';

        if (!botId) {
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(startBootstrap, 100);
            } else {
                console.warn('[Botify AI] Missing botId in window.BotifyAIConfig. Live chat initialization skipped.');
            }
            return;
        }

        onReady(function () {
            initWidget(config, botId);
        });
    }

    startBootstrap();

    function initWidget(config, botId) {
        var apiOrigin = resolveApiOrigin(config);
        var storageKey = 'botify_session_' + botId;
        var sessionToken = localStorage.getItem(storageKey);
        if (!sessionToken) {
            sessionToken = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            try { localStorage.setItem(storageKey, sessionToken); } catch (e) {}
        }

        var state = {
            isOpen: false,
            isLoading: false,
            widgetData: null,
            messages: [],
            position: config.position === 'left' ? 'left' : 'right',
            primaryColor: '#0D9488',
            mode: 'ai'
        };

        // Inject Styles with high specificity and reset
        var style = document.createElement('style');
        style.id = 'botify-ai-widget-css';
        style.innerHTML = `
            .botify-widget-container {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                position: fixed !important;
                z-index: 2147483647 !important;
                box-sizing: border-box !important;
                line-height: normal !important;
                text-transform: none !important;
                letter-spacing: normal !important;
            }
            .botify-widget-container * {
                box-sizing: border-box !important;
                font-family: inherit !important;
            }
            .botify-widget-pos-right {
                bottom: 24px !important;
                right: 24px !important;
            }
            .botify-widget-pos-left {
                bottom: 24px !important;
                left: 24px !important;
            }
            .botify-widget-launcher {
                width: 60px !important;
                height: 60px !important;
                border-radius: 50% !important;
                cursor: pointer !important;
                box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease !important;
                outline: none !important;
                border: none !important;
                color: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
                position: relative !important;
            }
            .botify-widget-launcher:hover {
                transform: scale(1.08) !important;
                box-shadow: 0 8px 25px rgba(0,0,0,0.28) !important;
            }
            .botify-widget-launcher svg {
                width: 30px !important;
                height: 30px !important;
                fill: currentColor !important;
            }
            .botify-widget-window {
                position: fixed !important;
                bottom: 96px !important;
                width: 380px !important;
                height: 600px !important;
                max-height: calc(100vh - 120px) !important;
                background: #ffffff !important;
                border-radius: 18px !important;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08) !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease !important;
                z-index: 2147483647 !important;
                border: 1px solid rgba(0,0,0,0.08) !important;
            }
            .botify-widget-window.botify-hidden {
                display: none !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
            .botify-widget-window.botify-pos-right {
                right: 24px !important;
            }
            .botify-widget-window.botify-pos-left {
                left: 24px !important;
            }
            .botify-widget-header {
                padding: 16px 18px !important;
                color: #ffffff !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
            }
            .botify-widget-header-title {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
            }
            .botify-widget-avatar {
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                background: rgba(255,255,255,0.25) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-weight: 700 !important;
                font-size: 17px !important;
                color: #ffffff !important;
            }
            .botify-widget-header-meta h4 {
                margin: 0 !important;
                font-size: 15px !important;
                font-weight: 700 !important;
                color: #ffffff !important;
                line-height: 1.2 !important;
            }
            .botify-widget-header-meta p {
                margin: 4px 0 0 0 !important;
                font-size: 12px !important;
                opacity: 0.9 !important;
                display: flex !important;
                align-items: center !important;
                gap: 5px !important;
                color: #ffffff !important;
                line-height: 1 !important;
            }
            .botify-widget-online-dot {
                width: 8px !important;
                height: 8px !important;
                background: #22c55e !important;
                border-radius: 50% !important;
                display: inline-block !important;
                box-shadow: 0 0 0 2px rgba(255,255,255,0.4) !important;
            }
            .botify-widget-close-btn {
                background: transparent !important;
                border: none !important;
                color: #ffffff !important;
                cursor: pointer !important;
                padding: 6px !important;
                border-radius: 8px !important;
                display: flex !important;
                align-items: center !important;
                opacity: 0.85 !important;
                transition: opacity 0.2s, background 0.2s !important;
            }
            .botify-widget-close-btn:hover {
                opacity: 1 !important;
                background: rgba(255,255,255,0.2) !important;
            }
            .botify-widget-takeover-bar {
                background: #f0fdf4 !important;
                border-bottom: 1px solid #bbf7d0 !important;
                padding: 8px 14px !important;
                font-size: 12px !important;
                color: #166534 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
            }
            .botify-widget-takeover-btn {
                background: #0d9488 !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 6px !important;
                padding: 4px 10px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: opacity 0.2s !important;
            }
            .botify-widget-takeover-btn:hover {
                opacity: 0.9 !important;
            }
            .botify-widget-body {
                flex: 1 !important;
                padding: 16px !important;
                overflow-y: auto !important;
                background: #f8fafc !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 12px !important;
            }
            .botify-widget-msg {
                max-width: 84% !important;
                padding: 11px 14px !important;
                border-radius: 14px !important;
                font-size: 14px !important;
                line-height: 1.45 !important;
                word-wrap: break-word !important;
            }
            .botify-widget-msg-customer {
                align-self: flex-end !important;
                background: #0D9488 !important;
                color: #ffffff !important;
                border-bottom-right-radius: 2px !important;
            }
            .botify-widget-msg-ai, .botify-widget-msg-human {
                align-self: flex-start !important;
                background: #ffffff !important;
                color: #1e293b !important;
                border: 1px solid #e2e8f0 !important;
                border-bottom-left-radius: 2px !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
            }
            .botify-widget-sender-tag {
                font-size: 11px !important;
                font-weight: 700 !important;
                margin-bottom: 5px !important;
                display: flex !important;
                align-items: center !important;
                gap: 4px !important;
            }
            .botify-widget-sender-ai {
                color: #0d9488 !important;
            }
            .botify-widget-sender-human {
                color: #f59e0b !important;
            }
            .botify-widget-prompts {
                display: flex !important;
                flex-direction: column !important;
                gap: 7px !important;
                margin-top: 10px !important;
            }
            .botify-widget-prompt-pill {
                background: #ffffff !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 10px !important;
                padding: 8px 12px !important;
                font-size: 13px !important;
                color: #334155 !important;
                cursor: pointer !important;
                text-align: left !important;
                transition: all 0.15s ease !important;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
            }
            .botify-widget-prompt-pill:hover {
                border-color: #0d9488 !important;
                color: #0d9488 !important;
                background: #f0fdfa !important;
            }
            .botify-widget-footer {
                padding: 12px 14px !important;
                background: #ffffff !important;
                border-top: 1px solid #e2e8f0 !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
            }
            .botify-widget-input {
                flex: 1 !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 22px !important;
                padding: 10px 16px !important;
                font-size: 14px !important;
                outline: none !important;
                background: #ffffff !important;
                color: #1e293b !important;
                transition: border-color 0.2s, box-shadow 0.2s !important;
            }
            .botify-widget-input:focus {
                border-color: #0d9488 !important;
                box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15) !important;
            }
            .botify-widget-send-btn {
                width: 38px !important;
                height: 38px !important;
                border-radius: 50% !important;
                background: #0d9488 !important;
                border: none !important;
                color: #ffffff !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                transition: transform 0.15s, opacity 0.15s !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .botify-widget-send-btn:hover {
                transform: scale(1.06) !important;
            }
            .botify-widget-typing {
                font-size: 12px !important;
                color: #64748b !important;
                font-style: italic !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .botify-widget-powered-by {
                text-align: center !important;
                font-size: 11px !important;
                color: #94a3b8 !important;
                padding: 6px !important;
                background: #ffffff !important;
                border-top: 1px solid #f1f5f9 !important;
            }
            .botify-widget-powered-by a {
                color: #0d9488 !important;
                text-decoration: none !important;
                font-weight: 600 !important;
            }
            @media (max-width: 480px) {
                .botify-widget-window {
                    width: 100vw !important;
                    height: 100vh !important;
                    max-height: 100vh !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    border-radius: 0 !important;
                }
            }
        `;
        document.head.appendChild(style);

        // Create Container
        var container = document.createElement('div');
        container.className = 'botify-widget-container botify-widget-pos-' + (state.position === 'left' ? 'left' : 'right');
        document.body.appendChild(container);

        // Fetch Widget Configuration
        fetch(apiOrigin + '/api/v1/widget/config?key=' + encodeURIComponent(botId))
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                if (!data.success) {
                    console.warn('[Botify AI] Initialization message:', data.error);
                    return;
                }
                state.widgetData = data;
                state.primaryColor = data.widget.primary_color || '#0D9488';
                renderWidget();
                loadHistory();
                console.log('[Botify AI] Live chat active for ' + (data.bot ? data.bot.name : 'Botify'));
            })
            .catch(function (err) {
                console.warn('[Botify AI] Could not reach Botify AI API (' + apiOrigin + '):', err.message);
                // Graceful fallback render so user sees live chat bubble even if temporarily offline
                state.widgetData = {
                    widget: {
                        welcome_message: "Hi there! 👋 How can I help you today?",
                        primary_color: config.themeColor || '#0D9488',
                        enable_human_takeover: true
                    },
                    bot: { name: 'AI Assistant', avatar_letter: 'B' },
                    business: { name: 'Botify AI' },
                    suggested_prompts: ['Tell me about your services', 'What are your pricing plans?', 'Talk to a human']
                };
                renderWidget();
            });

        function loadHistory() {
            fetch(apiOrigin + '/api/v1/widget/history?key=' + encodeURIComponent(botId) + '&session_token=' + encodeURIComponent(sessionToken))
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.success && Array.isArray(data.messages)) {
                        state.messages = data.messages;
                        state.mode = data.mode || 'ai';
                        updateMessageUI();
                    }
                })
                .catch(function () {});
        }

        function renderWidget() {
            if (document.getElementById('botify-widget-root')) return;

            var w = state.widgetData.widget;
            var b = state.widgetData.bot;
            var bus = state.widgetData.business;

            var wrapper = document.createElement('div');
            wrapper.id = 'botify-widget-root';

            var launcher = document.createElement('button');
            launcher.className = 'botify-widget-launcher';
            launcher.style.background = state.primaryColor;
            launcher.setAttribute('aria-label', 'Open Live Chat');
            launcher.innerHTML = `
                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
            `;

            var win = document.createElement('div');
            win.className = 'botify-widget-window botify-hidden botify-pos-' + (state.position === 'left' ? 'left' : 'right');

            win.innerHTML = `
                <div class="botify-widget-header" style="background: ${state.primaryColor}">
                    <div class="botify-widget-header-title">
                        <div class="botify-widget-avatar">${b.avatar_letter || 'B'}</div>
                        <div class="botify-widget-header-meta">
                            <h4>${b.name || 'AI Assistant'}</h4>
                            <p><span class="botify-widget-online-dot"></span> ${bus.name || 'Live Support'}</p>
                        </div>
                    </div>
                    <button class="botify-widget-close-btn" id="botify-close-btn" aria-label="Close Chat">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>
                ${w.enable_human_takeover ? `
                    <div class="botify-widget-takeover-bar" id="botify-takeover-bar">
                        <span>Need a personal team member?</span>
                        <button class="botify-widget-takeover-btn" id="botify-takeover-btn" style="background: ${state.primaryColor}">Connect Human</button>
                    </div>
                ` : ''}
                <div class="botify-widget-body" id="botify-msg-body">
                    <div class="botify-widget-msg botify-widget-msg-ai">
                        <div class="botify-widget-sender-tag botify-widget-sender-ai">🤖 ${b.name}</div>
                        <div>${w.welcome_message}</div>
                    </div>
                    <div class="botify-widget-prompts" id="botify-prompt-pills">
                        ${(state.widgetData.suggested_prompts || []).map(function (p) {
                            return '<div class="botify-widget-prompt-pill" data-prompt="' + escapeAttr(p) + '">' + escapeHtml(p) + '</div>';
                        }).join('')}
                    </div>
                </div>
                <div class="botify-widget-footer">
                    <input type="text" class="botify-widget-input" id="botify-chat-input" placeholder="Type your message..." />
                    <button class="botify-widget-send-btn" id="botify-send-btn" style="background: ${state.primaryColor}" aria-label="Send">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
                <div class="botify-widget-powered-by">
                    ⚡ Powered by <a href="https://botifyai.cloud" target="_blank" rel="noopener">Botify AI</a>
                </div>
            `;

            wrapper.appendChild(win);
            wrapper.appendChild(launcher);
            container.appendChild(wrapper);

            // Launcher open / close toggle
            launcher.onclick = function () {
                toggleChat();
            };

            document.getElementById('botify-close-btn').onclick = function () {
                closeChat();
            };

            function openChat() {
                state.isOpen = true;
                win.classList.remove('botify-hidden');
                var input = document.getElementById('botify-chat-input');
                if (input) input.focus();
            }

            function closeChat() {
                state.isOpen = false;
                win.classList.add('botify-hidden');
            }

            function toggleChat() {
                if (state.isOpen) closeChat();
                else openChat();
            }

            // Expose globally for site scripts
            window.BotifyAI = {
                open: openChat,
                close: closeChat,
                toggle: toggleChat,
                send: sendMessage
            };

            // Human Takeover Click
            var takeoverBtn = document.getElementById('botify-takeover-btn');
            if (takeoverBtn) {
                takeoverBtn.onclick = function () {
                    takeoverBtn.innerText = 'Connecting...';
                    fetch(apiOrigin + '/api/v1/widget/takeover', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: botId, session_token: sessionToken })
                    })
                    .then(function (res) { return res.json(); })
                    .then(function () {
                        takeoverBtn.innerText = 'Agent Notified ✓';
                        appendMessage({
                            sender_type: 'human',
                            body: 'You requested human assistance. An agent has been alerted and will respond right here in this thread.'
                        });
                    })
                    .catch(function () {
                        takeoverBtn.innerText = 'Connected';
                    });
                };
            }

            // Bind Prompt Pills
            bindPillEvents();

            // Bind Input & Send
            var input = document.getElementById('botify-chat-input');
            var sendBtn = document.getElementById('botify-send-btn');

            function triggerSend() {
                var text = input.value.trim();
                if (text && !state.isLoading) {
                    input.value = '';
                    sendMessage(text);
                }
            }

            sendBtn.onclick = triggerSend;
            input.onkeypress = function (e) {
                if (e.key === 'Enter') {
                    triggerSend();
                }
            };
        }

        function bindPillEvents() {
            var pills = document.querySelectorAll('.botify-widget-prompt-pill');
            for (var i = 0; i < pills.length; i++) {
                (function (pill) {
                    pill.onclick = function () {
                        var promptText = pill.getAttribute('data-prompt');
                        if (promptText) sendMessage(promptText);
                    };
                })(pills[i]);
            }
        }

        function appendMessage(msg) {
            state.messages.push(msg);
            updateMessageUI();
        }

        function updateMessageUI() {
            var body = document.getElementById('botify-msg-body');
            if (!body || !state.widgetData) return;

            var b = state.widgetData.bot || { name: 'AI Assistant' };
            var w = state.widgetData.widget || { welcome_message: 'Hi there!' };

            var html = `
                <div class="botify-widget-msg botify-widget-msg-ai">
                    <div class="botify-widget-sender-tag botify-widget-sender-ai">🤖 ${escapeHtml(b.name || 'AI Assistant')}</div>
                    <div>${escapeHtml(w.welcome_message || 'Hi there!')}</div>
                </div>
            `;

            state.messages.forEach(function (m) {
                var isCustomer = m.sender_type === 'customer' || m.direction === 'in';
                var isHuman = m.sender_type === 'human';
                var senderClass = isCustomer ? 'botify-widget-msg-customer' : (isHuman ? 'botify-widget-msg-human' : 'botify-widget-msg-ai');
                var senderTitle = isCustomer ? 'You' : (isHuman ? 'Support Agent' : b.name);
                var tagClass = isCustomer ? '' : (isHuman ? 'botify-widget-sender-human' : 'botify-widget-sender-ai');
                var icon = isCustomer ? '👤' : (isHuman ? '🧑‍💼' : '🤖');

                html += `
                    <div class="botify-widget-msg ${senderClass}" ${isCustomer ? 'style="background:' + state.primaryColor + '"' : ''}>
                        ${!isCustomer ? `<div class="botify-widget-sender-tag ${tagClass}">${icon} ${escapeHtml(senderTitle)}</div>` : ''}
                        <div>${escapeHtml(m.body || '')}</div>
                    </div>
                `;
            });

            if (state.isLoading) {
                html += `
                    <div class="botify-widget-msg botify-widget-msg-ai">
                        <div class="botify-widget-typing">
                            <span>${escapeHtml(b.name || 'Assistant')} is thinking</span>
                            <span>...</span>
                        </div>
                    </div>
                `;
            }

            body.innerHTML = html;
            body.scrollTop = body.scrollHeight;
        }

        function sendMessage(text) {
            state.isLoading = true;
            appendMessage({
                sender_type: 'customer',
                body: text
            });

            fetch(apiOrigin + '/api/v1/widget/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: botId,
                    session_token: sessionToken,
                    message: text
                })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                state.isLoading = false;
                if (data.reply) {
                    appendMessage({
                        sender_type: 'ai',
                        body: data.reply,
                        actions: data.actions
                    });
                } else if (data.notice) {
                    appendMessage({
                        sender_type: 'human',
                        body: data.notice
                    });
                }
            })
            .catch(function (err) {
                state.isLoading = false;
                appendMessage({
                    sender_type: 'ai',
                    body: 'Sorry, I am having trouble connecting right now. Please try again in a moment.'
                });
            });
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/\n/g, '<br/>');
        }

        function escapeAttr(str) {
            if (!str) return '';
            return String(str)
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    }
})();
