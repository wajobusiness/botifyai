import { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Smartphone, QrCode, KeyRound, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LinkedDevicePairingForm({ onSuccess, onCancel }) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const entitlements = auth?.entitlements ?? {};
    const isEntitled = entitlements.features ? entitlements.features.whatsapp_linked_devices !== false : true;

    const [mode, setMode] = useState('pairing_code'); // 'pairing_code' | 'qr_code'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Active session state
    const [session, setSession] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(180);
    const [copied, setCopied] = useState(false);
    const [isLinked, setIsLinked] = useState(false);
    const pollIntervalRef = useRef(null);

    // Countdown timer for pairing code
    useEffect(() => {
        if (!session || !session.expires_at) return;

        const updateTimer = () => {
            const diff = Math.max(0, Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000));
            setSecondsLeft(diff);
            if (diff <= 0 && pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [session]);

    // Polling session status
    useEffect(() => {
        if (!session || session.status === 'connected' || secondsLeft <= 0) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            return;
        }

        const checkStatus = async () => {
            try {
                const res = await fetch(route('client.whatsapp.devices.status', { sessionUid: session.session_uid }));
                const data = await res.json();
                if (data.success && data.status === 'connected') {
                    setIsLinked(true);
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    setTimeout(() => {
                        if (onSuccess) onSuccess();
                        else router.reload({ preserveScroll: true });
                    }, 1500);
                }
            } catch (e) {
                // Ignore transient network errors during poll
            }
        };

        pollIntervalRef.current = setInterval(checkStatus, 3000);
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [session, secondsLeft, onSuccess]);

    const handleRequestPairing = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const res = await fetch(route('client.whatsapp.devices.request-pairing'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    name: deviceName || undefined,
                    connection_type: mode,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Failed to request pairing code. Please check the number and try again.');
            } else {
                setSession(data);
                setSecondsLeft(data.expires_in_seconds || 180);
            }
        } catch (err) {
            setError('Network error connecting to WhatsApp pairing server. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (!session?.pairing_code) return;
        navigator.clipboard.writeText(session.pairing_code.replace('-', ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirmManual = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const res = await fetch(route('client.whatsapp.devices.confirm', { sessionUid: session.session_uid }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    push_name: deviceName || 'WhatsApp Phone',
                    platform: 'mobile',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setIsLinked(true);
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    else router.reload({ preserveScroll: true });
                }, 1200);
            } else {
                setError(data.message || 'Could not verify connection yet. Please check your phone.');
            }
        } catch {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isEntitled) {
        return (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Plan Upgrade Required</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                    Personal WhatsApp / Linked Devices connection is not enabled in your current plan. Please upgrade to link unlimited personal and business phones.
                </p>
                <div className="pt-2">
                    <a
                        href="/pricing"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 underline"
                    >
                        View Upgrade Options <ArrowRight className="h-3 w-3" />
                    </a>
                </div>
            </div>
        );
    }

    if (isLinked) {
        return (
            <div className="text-center py-6 space-y-3">
                <div className="mx-auto rounded-full w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    WhatsApp Connected Successfully!
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Your phone is now linked. All incoming and outgoing chats are automatically synchronized with your BotifyAI Inbox.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header / Mode Picker */}
            <div className="space-y-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Connect your existing WhatsApp number (Personal or Business App) using WhatsApp’s official Multi-Device feature without losing your chat history on your phone.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => { setMode('pairing_code'); setSession(null); }}
                        className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition ${
                            mode === 'pairing_code'
                                ? 'border-[#25D366] bg-green-50/50 dark:bg-green-950/20 text-neutral-900 dark:text-neutral-100'
                                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50'
                        }`}
                    >
                        <KeyRound className="h-4 w-4 text-[#25D366]" />
                        <span>Pairing Code (Mobile)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('qr_code'); setSession(null); }}
                        className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition ${
                            mode === 'qr_code'
                                ? 'border-[#25D366] bg-green-50/50 dark:bg-green-950/20 text-neutral-900 dark:text-neutral-100'
                                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50'
                        }`}
                    >
                        <QrCode className="h-4 w-4 text-[#25D366]" />
                        <span>QR Code (Desktop)</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {!session ? (
                /* Step 1: Input details & generate */
                <form onSubmit={handleRequestPairing} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            WhatsApp Phone Number (with Country Code)
                        </label>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+1 (555) 019-2834 or +44 7911 123456"
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
                            />
                        </div>
                        <p className="mt-1 text-[11px] text-neutral-400">
                            Enter the phone number currently active in your WhatsApp mobile app.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Account Label / Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            placeholder="e.g. Sales Desk, Support Line, John's WhatsApp"
                            className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !phoneNumber.trim()}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-60 text-white text-xs font-semibold py-2.5 shadow-sm transition"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Generating Code...</span>
                            </>
                        ) : (
                            <>
                                <KeyRound className="h-3.5 w-3.5" />
                                <span>Get 8-Digit Pairing Code</span>
                            </>
                        )}
                    </button>
                </form>
            ) : (
                /* Step 2: Show Pairing Code and Instructions */
                <div className="space-y-4 pt-1">
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 text-center space-y-2">
                        <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                            Enter this code on your phone
                        </span>
                        <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-2xl font-extrabold tracking-widest text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                {session.pairing_code}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyCode}
                                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 transition shadow-sm"
                                title="Copy code"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                            <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                            <span>Code expires in: <strong>{secondsLeft}s</strong></span>
                        </div>
                    </div>

                    {/* Step-by-step mobile instructions */}
                    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 p-3.5 space-y-2">
                        <h5 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                            How to enter on your phone:
                        </h5>
                        <ol className="list-decimal list-inside text-xs text-neutral-600 dark:text-neutral-400 space-y-1 leading-relaxed">
                            <li>Open <strong>WhatsApp</strong> on your phone.</li>
                            <li>Tap <strong>Settings</strong> (iPhone) or <strong>⋮ Menu</strong> (Android).</li>
                            <li>Select <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong>.</li>
                            <li>Tap <strong>"Link with phone number instead"</strong> at the bottom.</li>
                            <li>Type the 8-character code shown above.</li>
                        </ol>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleConfirmManual}
                            disabled={loading}
                            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 transition"
                        >
                            {loading ? 'Verifying...' : "I've Entered The Code"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSession(null)}
                            className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 transition"
                        >
                            New Code
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
