import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';
import dotenv from 'dotenv';
import makeWASocket, {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    DisconnectReason,
    Browsers,
    delay
} from '@whiskeysockets/baileys';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.WHATSAPP_GATEWAY_PORT || process.env.PORT || '3100', 10);
const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://127.0.0.1:8000';
const GATEWAY_SECRET = process.env.WHATSAPP_GATEWAY_SECRET || process.env.APP_KEY || 'botifyai-whatsapp-secret-key';
const SESSIONS_DIR = path.resolve(__dirname, '../storage/app/whatsapp_sessions');

// Ensure base storage directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Authentication middleware for internal calls from Laravel
function authenticate(req, res, next) {
    const token = req.headers['x-gateway-secret'] || req.query.secret;
    if (GATEWAY_SECRET && token !== GATEWAY_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized gateway access.' });
    }
    next();
}

/**
 * In-memory active session manager:
 * Map<sessionUid, { sock, state, status, phoneNumber, pairingCode, expiresAt, reconnectAttempts }>
 */
const activeSessions = new Map();

const logger = pino({ level: process.env.LOG_LEVEL || 'error' });

/**
 * Clean phone number to digits only (E.164 without plus)
 */
function normalizePhoneNumber(phone) {
    return String(phone || '').replace(/[^0-9]/g, '');
}

/**
 * Session storage directory path
 */
function getSessionPath(sessionUid) {
    const safeUid = String(sessionUid).replace(/[^a-zA-Z0-9_-]/g, '');
    return path.join(SESSIONS_DIR, safeUid);
}

/**
 * Notify Laravel that a session has connected
 */
async function notifyLaravelConnected(sessionUid, payload) {
    try {
        const url = `${LARAVEL_API_URL}/webhooks/whatsapp-device/connected`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gateway-Secret': GATEWAY_SECRET,
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                session_uid: sessionUid,
                ...payload,
            }),
        });
        const data = await res.json().catch(() => ({}));
        console.log(`[Gateway] Notified Laravel for session ${sessionUid}:`, data);
    } catch (err) {
        console.error(`[Gateway] Error notifying Laravel for session ${sessionUid}:`, err.message);
    }
}

/**
 * Forward inbound message to Laravel
 */
async function notifyLaravelInboundMessage(sessionUid, messageData) {
    try {
        const url = `${LARAVEL_API_URL}/webhooks/whatsapp-device/inbound`;
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gateway-Secret': GATEWAY_SECRET,
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                session_uid: sessionUid,
                ...messageData,
            }),
        });
    } catch (err) {
        console.error(`[Gateway] Inbound message dispatch error:`, err.message);
    }
}

/**
 * Initialize or restore a Baileys WhatsApp socket
 */
async function initSessionSocket(sessionUid, { phoneNumber = null, autoReconnect = true } = {}) {
    const sessionDir = getSessionPath(sessionUid);

    // If active socket exists, check if already connected
    if (activeSessions.has(sessionUid)) {
        const existing = activeSessions.get(sessionUid);
        if (existing.status === 'connected' && existing.sock) {
            return existing;
        }
    }

    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
        },
        printQRInTerminal: false,
        logger: pino({ level: 'fatal' }),
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
    });

    const sessionObj = {
        sessionUid,
        sock,
        state,
        status: state.creds.registered ? 'connected' : 'pairing',
        phoneNumber: phoneNumber || (state.creds.me ? state.creds.me.id.split(':')[0] : null),
        pairingCode: null,
        expiresAt: null,
        reconnectAttempts: 0,
    };

    activeSessions.set(sessionUid, sessionObj);

    // Persist credentials whenever updated by Baileys
    sock.ev.on('creds.update', saveCreds);

    // Monitor connection events
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            sessionObj.qr = qr;
        }

        if (connection === 'open') {
            sessionObj.status = 'connected';
            sessionObj.reconnectAttempts = 0;
            const myJid = sock.user?.id || '';
            const phone = myJid.split(':')[0].split('@')[0];
            const pushName = sock.user?.name || 'WhatsApp Phone';
            sessionObj.phoneNumber = phone;

            console.log(`[Gateway] Session ${sessionUid} successfully connected as +${phone} (${pushName})`);

            await notifyLaravelConnected(sessionUid, {
                phone_number: phone,
                push_name: pushName,
                platform: 'whatsapp_web_multidevice',
            });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;

            console.log(`[Gateway] Session ${sessionUid} closed. StatusCode: ${statusCode}, shouldReconnect: ${shouldReconnect}`);

            if (shouldReconnect && autoReconnect && sessionObj.reconnectAttempts < 5) {
                sessionObj.status = 'reconnecting';
                sessionObj.reconnectAttempts++;
                const delayMs = Math.min(1000 * Math.pow(2, sessionObj.reconnectAttempts), 30000);
                setTimeout(() => {
                    initSessionSocket(sessionUid, { phoneNumber: sessionObj.phoneNumber, autoReconnect: true }).catch(console.error);
                }, delayMs);
            } else {
                sessionObj.status = 'disconnected';
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    // Purge session credentials on permanent logout
                    try {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                    } catch {}
                    activeSessions.delete(sessionUid);
                }
            }
        }
    });

    // Inbound messages handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            // Ignore messages sent by ourselves
            if (msg.key.fromMe) continue;

            const remoteJid = msg.key.remoteJid || '';
            // Only process individual or standard group chats
            if (remoteJid.endsWith('@s.whatsapp.net')) {
                const fromPhone = remoteJid.split('@')[0];
                const text = msg.message?.conversation ||
                             msg.message?.extendedTextMessage?.text ||
                             msg.message?.imageMessage?.caption ||
                             msg.message?.videoMessage?.caption || '';

                await notifyLaravelInboundMessage(sessionUid, {
                    message_id: msg.key.id,
                    from: fromPhone,
                    text: text,
                    timestamp: msg.messageTimestamp,
                    push_name: msg.pushName || null,
                    raw: msg,
                });
            }
        }
    });

    return sessionObj;
}

// ─────────────────────────────────────────────────────────────────────────────
// REST Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'botifyai-whatsapp-gateway',
        status: 'healthy',
        active_sessions_count: activeSessions.size,
        timestamp: new Date().toISOString(),
    });
});

/**
 * Request real 8-character pairing code from WhatsApp servers
 */
app.post('/sessions/request-pairing', authenticate, async (req, res) => {
    const { session_id, phone_number, name } = req.body;

    if (!session_id || !phone_number) {
        return res.status(400).json({ success: false, message: 'session_id and phone_number are required.' });
    }

    const cleanPhone = normalizePhoneNumber(phone_number);
    if (cleanPhone.length < 8) {
        return res.status(422).json({ success: false, message: 'Invalid phone number format.' });
    }

    console.log(`[Gateway] Requesting genuine pairing code for session ${session_id} (+${cleanPhone})...`);

    try {
        const sessionDir = getSessionPath(session_id);

        // Terminate any active socket for this session before creating a fresh one
        if (activeSessions.has(session_id)) {
            const old = activeSessions.get(session_id);
            try { old.sock?.end?.(); } catch {}
            activeSessions.delete(session_id);
        }

        // Always remove non-registered session directory to guarantee a clean cryptographic handshake
        if (fs.existsSync(sessionDir)) {
            const credsPath = path.join(sessionDir, 'creds.json');
            let isRegistered = false;
            if (fs.existsSync(credsPath)) {
                try {
                    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                    isRegistered = !!creds.registered;
                } catch {}
            }
            if (!isRegistered) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
        }

        // Initialize fresh socket with canonical Ubuntu Chrome profile
        const session = await initSessionSocket(session_id, { phoneNumber: cleanPhone, autoReconnect: false });

        // Wait 3.5 seconds for the WebSocket connection and Noise handshake to reach ready state
        await delay(3500);

        if (session.sock.authState.creds.registered) {
            return res.json({
                success: true,
                session_id,
                status: 'connected',
                message: 'This device is already connected.',
                phone_number: '+' + cleanPhone,
            });
        }

        // Request genuine cryptographic pairing code from WhatsApp servers
        const rawCode = await session.sock.requestPairingCode(cleanPhone);
        
        // Format as XXXX-XXXX (e.g. ABCD-1234)
        const formattedCode = rawCode?.length === 8
            ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`.toUpperCase()
            : String(rawCode).toUpperCase();

        const expiresInSeconds = 160;
        session.pairingCode = formattedCode;
        session.expiresAt = Date.now() + expiresInSeconds * 1000;
        session.status = 'pairing';

        console.log(`[Gateway] WhatsApp Server generated pairing code for +${cleanPhone}: ${formattedCode}`);

        return res.json({
            success: true,
            session_id,
            pairing_code: formattedCode,
            phone_number: '+' + cleanPhone,
            expires_in_seconds: expiresInSeconds,
            expires_at: new Date(session.expiresAt).toISOString(),
            instructions: [
                '1. Open WhatsApp on your mobile phone.',
                '2. Go to Settings (iPhone) or tap ⋮ Menu (Android).',
                '3. Select "Linked Devices" → tap "Link a Device".',
                '4. Tap "Link with phone number instead" at the bottom.',
                `5. Enter this 8-character code: ${formattedCode}`,
            ],
        });
    } catch (err) {
        console.error(`[Gateway] Error in requestPairingCode for ${session_id}:`, err);
        return res.status(500).json({
            success: false,
            message: 'WhatsApp pairing code generation failed: ' + (err.message || 'Unknown socket error'),
        });
    }
});

/**
 * Request real QR code string for desktop QR scanning
 */
app.post('/sessions/request-qr', authenticate, async (req, res) => {
    const { session_id, name } = req.body;
    if (!session_id) {
        return res.status(400).json({ success: false, message: 'session_id is required.' });
    }

    try {
        const sessionDir = getSessionPath(session_id);
        if (activeSessions.has(session_id)) {
            const old = activeSessions.get(session_id);
            try { old.sock?.end?.(); } catch {}
            activeSessions.delete(session_id);
        }

        if (fs.existsSync(sessionDir)) {
            const credsPath = path.join(sessionDir, 'creds.json');
            let isRegistered = false;
            if (fs.existsSync(credsPath)) {
                try {
                    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                    isRegistered = !!creds.registered;
                } catch {}
            }
            if (!isRegistered) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
        }

        const session = await initSessionSocket(session_id, { autoReconnect: false });

        // Wait up to 6 seconds for QR code emission
        let waitTime = 0;
        while (!session.qr && waitTime < 6000) {
            await delay(400);
            waitTime += 400;
            if (session.sock.authState.creds.registered) {
                return res.json({ success: true, status: 'connected' });
            }
        }

        if (session.qr) {
            return res.json({
                success: true,
                session_id,
                qr_raw: session.qr,
                expires_in_seconds: 60,
                expires_at: new Date(Date.now() + 60000).toISOString(),
            });
        }

        return res.status(504).json({
            success: false,
            message: 'Timed out waiting for QR code from WhatsApp servers. Please retry.',
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'QR code generation failed: ' + err.message,
        });
    }
});

/**
 * Get live status of a session
 */
app.get('/sessions/:sessionId/status', authenticate, async (req, res) => {
    const { sessionId } = req.params;
    const sessionDir = getSessionPath(sessionId);

    let status = 'disconnected';
    let phoneNumber = null;

    if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        status = session.status;
        phoneNumber = session.phoneNumber;
    } else if (fs.existsSync(path.join(sessionDir, 'creds.json'))) {
        try {
            const creds = JSON.parse(fs.readFileSync(path.join(sessionDir, 'creds.json'), 'utf8'));
            if (creds.registered) {
                status = 'connected';
                phoneNumber = creds.me?.id?.split(':')?.[0];
                // Start background socket to keep connection alive
                initSessionSocket(sessionId, { phoneNumber, autoReconnect: true }).catch(() => {});
            }
        } catch {}
    }

    return res.json({
        success: true,
        session_id: sessionId,
        status,
        phone_number: phoneNumber ? '+' + phoneNumber : null,
    });
});

/**
 * Send an outbound WhatsApp text or media message through this linked session
 */
app.post('/sessions/send-message', authenticate, async (req, res) => {
    const { session_id, to, body } = req.body;

    if (!session_id || !to || !body) {
        return res.status(400).json({ success: false, message: 'session_id, to, and body are required.' });
    }

    const cleanTo = normalizePhoneNumber(to);
    const jid = `${cleanTo}@s.whatsapp.net`;

    let session = activeSessions.get(session_id);
    if (!session || !session.sock || session.status !== 'connected') {
        // Attempt to restore from disk credentials
        try {
            session = await initSessionSocket(session_id, { autoReconnect: true });
            await delay(2000);
        } catch {}
    }

    if (!session || !session.sock || session.status !== 'connected') {
        return res.status(503).json({
            success: false,
            message: 'WhatsApp device session is not connected or socket is unavailable. Please link the device again.',
        });
    }

    try {
        const result = await session.sock.sendMessage(jid, { text: String(body) });
        return res.json({
            success: true,
            message_id: result.key.id,
            to: '+' + cleanTo,
            timestamp: result.messageTimestamp,
        });
    } catch (err) {
        console.error(`[Gateway] Send message error on session ${session_id}:`, err);
        return res.status(500).json({
            success: false,
            message: 'Failed to send WhatsApp message: ' + err.message,
        });
    }
});

/**
 * Disconnect and remove session permanently
 */
app.delete('/sessions/:sessionId', authenticate, async (req, res) => {
    const { sessionId } = req.params;
    const sessionDir = getSessionPath(sessionId);

    if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        try {
            await session.sock?.logout?.();
        } catch {}
        try {
            session.sock?.end?.();
        } catch {}
        activeSessions.delete(sessionId);
    }

    if (fs.existsSync(sessionDir)) {
        try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (e) {
            console.error(`[Gateway] Error deleting session dir:`, e);
        }
    }

    return res.json({
        success: true,
        message: 'WhatsApp device session destroyed successfully.',
    });
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`[BotifyAI] WhatsApp Multi-Device Gateway running on http://127.0.0.1:${PORT}`);
});
