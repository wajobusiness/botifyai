import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Cookie, Settings, X } from 'lucide-react';

const STORAGE_KEY = 'botify_cookie_consent_v1';

function updateGoogleConsent(preferences) {
    try {
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
                analytics_storage: preferences.analytics ? 'granted' : 'denied',
                ad_storage: preferences.marketing ? 'granted' : 'denied',
                ad_user_data: preferences.marketing ? 'granted' : 'denied',
                ad_personalization: preferences.marketing ? 'granted' : 'denied',
            });
        }
    } catch {
        // Silently catch if gtag is not defined
    }
}

export default function CookieConsent() {
    const { t } = useTranslation();
    const [bannerVisible, setBannerVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [preferences, setPreferences] = useState({
        essential: true, // Always required
        analytics: true,
        marketing: true,
    });

    const loadConsent = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setPreferences({
                    essential: true,
                    analytics: !!parsed.analytics,
                    marketing: !!parsed.marketing,
                });
                updateGoogleConsent(parsed);
                setBannerVisible(false);
            } else {
                setBannerVisible(true);
            }
        } catch {
            setBannerVisible(true);
        }
    }, []);

    useEffect(() => {
        loadConsent();

        const handleOpenSettings = () => {
            setModalVisible(true);
        };

        window.addEventListener('open-cookie-settings', handleOpenSettings);
        return () => {
            window.removeEventListener('open-cookie-settings', handleOpenSettings);
        };
    }, [loadConsent]);

    const handleAcceptAll = () => {
        const fullConsent = {
            status: 'allowed',
            essential: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullConsent));
        setPreferences({ essential: true, analytics: true, marketing: true });
        updateGoogleConsent(fullConsent);
        setBannerVisible(false);
        setModalVisible(false);
    };

    const handleDeclineAll = () => {
        const minimalConsent = {
            status: 'disallowed',
            essential: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalConsent));
        setPreferences({ essential: true, analytics: false, marketing: false });
        updateGoogleConsent(minimalConsent);
        setBannerVisible(false);
        setModalVisible(false);
    };

    const handleSaveCustom = () => {
        const customConsent = {
            status: 'custom',
            essential: true,
            analytics: preferences.analytics,
            marketing: preferences.marketing,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customConsent));
        updateGoogleConsent(customConsent);
        setBannerVisible(false);
        setModalVisible(false);
    };

    return (
        <>
            {/* ── Cookie Banner ── */}
            {bannerVisible && !modalVisible && (
                <div
                    role="region"
                    aria-label="Cookie consent banner"
                    className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 transition-all duration-300 pointer-events-none"
                >
                    <div className="max-w-4xl mx-auto pointer-events-auto bg-neutral-900/95 dark:bg-neutral-950/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl p-4 sm:p-6 text-white text-sm">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5 flex-1">
                                <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 shrink-0 mt-0.5">
                                    <Cookie className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-white text-base flex items-center gap-2">
                                        {t('cookie_consent.title', 'Cookie & Privacy Preferences')}
                                    </h3>
                                    <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                                        {t(
                                            'cookie_consent.description',
                                            'We use cookies to ensure site functionality, personalize content and ads, analyze web traffic, and optimize your experience. You can choose to allow all cookies, decline non-essential cookies, or manage your preferences.'
                                        )}{' '}
                                        <a
                                            href="/p/privacy"
                                            className="text-brand-400 hover:text-brand-300 underline font-medium"
                                        >
                                            {t('ui.cookie_privacy_policy', 'Privacy Policy')}
                                        </a>{' '}
                                        &amp;{' '}
                                        <a
                                            href="/p/cookies"
                                            className="text-brand-400 hover:text-brand-300 underline font-medium"
                                        >
                                            {t('cookie_consent.policy_link', 'Cookie Policy')}
                                        </a>.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0 border-t border-neutral-800 md:border-t-0">
                                <button
                                    type="button"
                                    onClick={() => setModalVisible(true)}
                                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition inline-flex items-center gap-1.5"
                                >
                                    <Settings className="h-3.5 w-3.5" />
                                    {t('cookie_consent.manage', 'Preferences')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeclineAll}
                                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition"
                                >
                                    {t('cookie_consent.decline_all', 'Disallow Non-Essential')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAcceptAll}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition"
                                >
                                    {t('cookie_consent.accept_all', 'Allow All Cookies')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Granular Preferences Modal ── */}
            {modalVisible && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cookie-preferences-title"
                >
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100">
                        {/* Header */}
                        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 id="cookie-preferences-title" className="text-base font-bold text-neutral-900 dark:text-white">
                                        {t('cookie_consent.modal_title', 'Cookie Preferences')}
                                    </h2>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {t('cookie_consent.modal_subtitle', 'Choose which cookies you allow us to use.')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalVisible(false)}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 overflow-y-auto text-sm">
                            {/* Strictly Necessary */}
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">
                                            {t('cookie_consent.necessary_title', 'Strictly Necessary')}
                                        </h4>
                                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                            {t('cookie_consent.always_active', 'Always Active')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        {t(
                                            'cookie_consent.necessary_desc',
                                            'These cookies are necessary for core website operation, security, CSRF protection, and account login. They cannot be turned off.'
                                        )}
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={true}
                                    disabled
                                    className="h-4 w-4 text-brand-600 rounded opacity-60 cursor-not-allowed mt-1"
                                />
                            </div>

                            {/* Analytics Cookies */}
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">
                                        {t('cookie_consent.analytics_title', 'Analytics & Performance')}
                                    </h4>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        {t(
                                            'cookie_consent.analytics_desc',
                                            'Allows us to measure website traffic, monitor page performance, and discover how visitors interact with our features to improve the platform.'
                                        )}
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer mt-1">
                                    <input
                                        type="checkbox"
                                        checked={preferences.analytics}
                                        onChange={(e) =>
                                            setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                                </label>
                            </div>

                            {/* Marketing / AdSense Cookies */}
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">
                                        {t('cookie_consent.marketing_title', 'Targeting & Advertising')}
                                    </h4>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        {t(
                                            'cookie_consent.marketing_desc',
                                            'Used by advertising partners (including Google AdSense) to deliver relevant advertisements and measure ad performance.'
                                        )}
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer mt-1">
                                    <input
                                        type="checkbox"
                                        checked={preferences.marketing}
                                        onChange={(e) =>
                                            setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleDeclineAll}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                            >
                                {t('cookie_consent.disallow_all', 'Disallow All Non-Essential')}
                            </button>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveCustom}
                                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                                >
                                    {t('cookie_consent.save_preferences', 'Save Preferences')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAcceptAll}
                                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-sm transition"
                                >
                                    {t('cookie_consent.allow_all', 'Allow All')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
