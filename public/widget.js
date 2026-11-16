/**
 * Botify AI Embeddable Chat Widget
 * High-performance, zero-dependency async client script.
 * Compatible with HTML5, WordPress, Shopify, Laravel, React, Vue, Webflow, etc.
 */
(function () {
    'use strict';

    if (window.__BotifyAIWidgetLoaded) return;
    window.__BotifyAIWidgetLoaded = true;

    var config = window.BotifyAIConfig || {};
    var botId = config.botId || '';
    if (!botId) {
        console.warn('[Botify AI] Missing botId in window.BotifyAIConfig');
        return;
    }

    // Determine API origin based on the script source tag or window location
    var scripts = document.getElementsByTagName('script');
    var scriptUrl = '';
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
            scriptUrl = scripts[i].src;
            break;
        }
    }
    var apiOrigin = scriptUrl ? scriptUrl.replace(/\/widget\.js.*$/, '') : window.location.origin;

    // Session storage key
    var storageKey = 'botify_session_' + botId;
    var sessionToken = localStorage.getItem(storageKey);
    if (!sessionToken) {
        sessionToken = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(storageKey, sessionToken);
    }

    var state = {
        isOpen: false,
        isLoading: false,
        widgetData: null,
        messages: [],
        position: config.position || 'right',
        primaryColor: '#0D9488',
        mode: 'ai',
        unreadCount: 0
    };

    // Inject styles
    var style = document.createElement('style');
    style.id = 'botify-ai-widget-css';
    style.innerHTML = `
        .botify-widget-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            position: fixed;
            z-index: 999999;
            box-sizing: border-box;
        }
        .botify-widget-container * {
            box-sizing: border-box;
        }
        .botify-widget-pos-right {
            bottom: 24px;
            right: 24px;
        }
        .botify-widget-pos-left {
            bottom: 24px;
            left: 24px;
        }
        .botify-widget-launcher {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(0,0,0,0.16);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
            outline: none;
            border: none;
            color: #ffffff;
        }
        .botify-widget-launcher:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 20px rgba(0,0,0,0.22);
        }
        .botify-widget-launcher svg {
            width: 28px;
            height: 28px;
            fill: currentColor;
        }
        .botify-widget-badge {
            position: absolute;
            top: -2px;
            right: -2px;
            background: #ef4444;
            color: white;
            font-size: 11px;
            font-weight: 700;
            border-radius: 10px;
            padding: 2px 6px;
            border: 2px solid #ffffff;
        }
        .botify-widget-window {
            position: fixed;
            bottom: 96px;
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.25s ease;
            z-index: 999999;
            border: 1px solid rgba(0,0,0,0.06);
        }
        .botify-widget-window.botify-hidden {
            display: none !important;
        }
        .botify-widget-window.botify-pos-right {
            right: 24px;
        }
        .botify-widget-window.botify-pos-left {
            left: 24px;
        }
        .botify-widget-header {
            padding: 16px;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .botify-widget-header-title {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .botify-widget-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: rgba(255,255,255,0.22);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 16px;
        }
        .botify-widget-header-meta h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
        }
        .botify-widget-header-meta p {
            margin: 2px 0 0 0;
            font-size: 12px;
            opacity: 0.85;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .botify-widget-online-dot {
            width: 7px;
            height: 7px;
            background: #22c55e;
            border-radius: 50%;
            display: inline-block;
        }
        .botify-widget-close-btn {
            background: transparent;
            border: none;
            color: #ffffff;
            cursor: pointer;
            padding: 4px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        .botify-widget-close-btn:hover {
            opacity: 1;
            background: rgba(255,255,255,0.15);
        }
        .botify-widget-body {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .botify-widget-msg {
            max-width: 82%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 14px;
            line-height: 1.45;
            word-wrap: break-word;
        }
        .botify-widget-msg-customer {
            align-self: flex-end;
            background: #0D9488;
            color: #ffffff;
            border-bottom-right-radius: 2px;
        }
        .botify-widget-msg-ai, .botify-widget-msg-human {
            align-self: flex-start;
            background: #ffffff;
            color: #1e293b;
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 2px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .botify-widget-sender-tag {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .botify-widget-sender-ai {
            color: #0d9488;
        }
        .botify-widget-sender-human {
            color: #f59e0b;
        }
        .botify-widget-prompts {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 8px;
        }
        .botify-widget-prompt-pill {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            color: #334155;
            cursor: pointer;
            text-align: left;
            transition: all 0.15s ease;
        }
        .botify-widget-prompt-pill:hover {
            border-color: #0d9488;
            color: #0d9488;
            background: #f0fdfa;
        }
        .botify-widget-takeover-bar {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            color: #1e40af;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .botify-widget-takeover-btn {
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
        }
        .botify-widget-footer {
            padding: 12px;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .botify-widget-input {
            flex: 1;
            border: 1px solid #cbd5e1;
            border-radius: 20px;
            padding: 10px 14px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }
        .botify-widget-input:focus {
            border-color: #0d9488;
        }
        .botify-widget-send-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #0d9488;
            border: none;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.15s;
        }
        .botify-widget-send-btn:hover {
            transform: scale(1.08);
        }
        .botify-widget-typing {
            font-size: 12px;
            color: #64748b;
            font-style: italic;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .botify-widget-powered-by {
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            padding: 4px;
            background: #ffffff;
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

    // Create container element
    var container = document.createElement('div');
    container.className = 'botify-widget-container botify-widget-pos-' + (state.position === 'left' ? 'left' : 'right');
    document.body.appendChild(container);

    // Fetch Widget Config
    fetch(apiOrigin + '/api/v1/widget/config?key=' + encodeURIComponent(botId))
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data.success) {
                console.warn('[Botify AI] Failed to initialize:', data.error);
                return;
            }
            state.widgetData = data;
            state.primaryColor = data.widget.primary_color || '#0D9488';
            renderWidget();
            loadHistory();
        })
        .catch(function (err) {
            console.error('[Botify AI] Connection error:', err);
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
        var w = state.widgetData.widget;
        var b = state.widgetData.bot;
        var bus = state.widgetData.business;

        var launcher = document.createElement('button');
        launcher.className = 'botify-widget-launcher';
        launcher.style.background = state.primaryColor;
        launcher.setAttribute('aria-label', 'Open Botify AI Chat');
        launcher.innerHTML = `
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
        `;

        var win = document.createElement('div');
        win.className = 'botify-widget-window botify-hidden botify-pos-' + (state.position === 'left' ? 'left' : 'right');

        win.innerHTML = `
            <div class="botify-widget-header" style="background: ${state.primaryColor}">
                <div class="botify-widget-header-title">
                    <div class="botify-widget-avatar">${b.avatar_letter}</div>
                    <div class="botify-widget-header-meta">
                        <h4>${b.name}</h4>
                        <p><span class="botify-widget-online-dot"></span> ${bus.name || 'Botify AI Assistant'}</p>
                    </div>
                </div>
                <button class="botify-widget-close-btn" id="botify-close-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            ${w.enable_human_takeover ? `
                <div class="botify-widget-takeover-bar" id="botify-takeover-bar">
                    <span>Need personal assistance?</span>
                    <button class="botify-widget-takeover-btn" id="botify-takeover-btn">Talk to Human</button>
                </div>
            ` : ''}
            <div class="botify-widget-body" id="botify-msg-body">
                <div class="botify-widget-msg botify-widget-msg-ai">
                    <div class="botify-widget-sender-tag botify-widget-sender-ai">🤖 ${b.name}</div>
                    <div>${w.welcome_message}</div>
                </div>
                <div class="botify-widget-prompts" id="botify-prompt-pills">
                    ${(state.widgetData.suggested_prompts || []).map(function (p) {
                        return '<div class="botify-widget-prompt-pill" data-prompt="' + p + '">' + p + '</div>';
                    }).join('')}
                </div>
            </div>
            <div class="botify-widget-footer">
                <input type="text" class="botify-widget-input" id="botify-chat-input" placeholder="Type your message..." />
                <button class="botify-widget-send-btn" id="botify-send-btn" style="background: ${state.primaryColor}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
            <div class="botify-widget-powered-by">
                ⚡ Powered by <strong>Botify AI</strong>
            </div>
        `;

        container.appendChild(win);
        container.appendChild(launcher);

        // Events
        launcher.onclick = function () {
            state.isOpen = !state.isOpen;
            if (state.isOpen) {
                win.classList.remove('botify-hidden');
                document.getElementById('botify-chat-input').focus();
            } else {
                win.classList.add('botify-hidden');
            }
        };

        document.getElementById('botify-close-btn').onclick = function () {
            state.isOpen = false;
            win.classList.add('botify-hidden');
        };

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
                    takeoverBtn.innerText = 'Agent Notified';
                    appendMessage({
                        sender_type: 'human',
                        body: 'You requested human assistance. An agent has been alerted and will respond right here in this thread.'
                    });
                });
            };
        }

        // Prompt pills
        var pills = document.querySelectorAll('.botify-widget-prompt-pill');
        pills.forEach(function (pill) {
            pill.onclick = function () {
                var promptText = pill.getAttribute('data-prompt');
                sendMessage(promptText);
            };
        });

        // Send message
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

    function appendMessage(msg) {
        state.messages.push(msg);
        updateMessageUI();
    }

    function updateMessageUI() {
        var body = document.getElementById('botify-msg-body');
        if (!body || !state.widgetData) return;

        var b = state.widgetData.bot;
        var w = state.widgetData.widget;

        var html = `
            <div class="botify-widget-msg botify-widget-msg-ai">
                <div class="botify-widget-sender-tag botify-widget-sender-ai">🤖 ${b.name}</div>
                <div>${w.welcome_message}</div>
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
                    ${!isCustomer ? `<div class="botify-widget-sender-tag ${tagClass}">${icon} ${senderTitle}</div>` : ''}
                    <div>${escapeHtml(m.body || '')}</div>
                </div>
            `;
        });

        if (state.isLoading) {
            html += `
                <div class="botify-widget-msg botify-widget-msg-ai">
                    <div class="botify-widget-typing">
                        <span>${b.name} is thinking</span>
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
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br/>');
    }
})();
