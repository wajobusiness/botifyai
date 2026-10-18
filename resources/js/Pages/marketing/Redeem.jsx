import { useState, useEffect } from 'react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import { useForm, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle2,
    AlertCircle,
    KeyRound,
    Sparkles,
    ShieldCheck,
    Layers,
    ArrowRight,
    UserCheck,
    HelpCircle,
    Check,
    Zap,
    MessageSquare,
    Bot,
} from 'lucide-react';
import { browserTz } from '@/Utils/datetime';

export default function Redeem({ initialCode = '', initialCodeDetails = null, currentUser = null }) {
    const { t } = useTranslation();
    const { flash } = usePage().props;

    const [activeTab, setActiveTab] = useState(currentUser ? 'existing' : 'new');
    const [code, setCode] = useState(initialCode);
    const [codeState, setCodeState] = useState(initialCodeDetails);
    const [isValidating, setIsValidating] = useState(false);
    const [validateError, setValidateError] = useState(null);

    // Form for new account redemption
    const newForm = useForm({
        code: initialCode,
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        agree_terms: false,
        timezone: browserTz() || 'UTC',
    });

    // Form for existing account redemption
    const existingForm = useForm({
        code: initialCode,
        email: currentUser?.email || '',
        password: '',
    });

    // Auto-validate code when initialCode is present or on blur/paste
    const validateLicenseCode = async (codeToVerify) => {
        const clean = (codeToVerify || '').trim().toUpperCase();
        if (!clean || clean.length < 8) {
            setCodeState(null);
            setValidateError(null);
            return;
        }

        setIsValidating(true);
        setValidateError(null);

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/redeem/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token || '',
                },
                body: JSON.stringify({ code: clean }),
            });

            const data = await res.json();
            if (res.ok && data.valid) {
                setCodeState(data);
                setValidateError(null);
                newForm.setData('code', clean);
                existingForm.setData('code', clean);
            } else {
                setCodeState(null);
                setValidateError(data.error || 'Invalid or already redeemed license code.');
            }
        } catch (err) {
            setValidateError('Could not verify code. Please check your internet connection.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleCodeChange = (e) => {
        const val = e.target.value.toUpperCase();
        setCode(val);
        newForm.setData('code', val);
        existingForm.setData('code', val);
        if (val.length >= 10) {
            validateLicenseCode(val);
        } else {
            setCodeState(null);
            setValidateError(null);
        }
    };

    const submitNewUser = (e) => {
        e.preventDefault();
        newForm.post('/redeem/new', {
            onFinish: () => newForm.reset('password', 'password_confirmation'),
        });
    };

    const submitExistingUser = (e) => {
        e.preventDefault();
        existingForm.post('/redeem/existing', {
            onFinish: () => existingForm.reset('password'),
        });
    };

    return (
        <LandingLayout>
            <SeoHead
                title="Redeem Your AppSumo Lifetime Deal | BotifyAI"
                description="Redeem your AppSumo license code to activate lifetime access to BotifyAI's omnichannel business automation and social commerce platform."
            />

            <div className="relative min-h-[85vh] bg-neutral-50 dark:bg-neutral-950 py-16 px-4 sm:px-6 lg:px-8">
                {/* Background decorative gradients */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-brand-500/10 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

                <div className="max-w-4xl mx-auto relative">
                    {/* Header Banner */}
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold mb-4 shadow-sm">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Official AppSumo Lifetime Deal Redemption
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                            Activate Your <span className="text-brand-600 dark:text-brand-400">Lifetime Access</span>
                        </h1>
                        <p className="mt-3 text-base text-neutral-600 dark:text-neutral-400">
                            Enter your AppSumo purchase code below to claim your lifetime deal or stack additional codes onto your existing workspace.
                        </p>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{flash.success}</p>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6 rounded-xl bg-coral-50 dark:bg-coral-950/40 border border-coral-200 dark:border-coral-800 p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-coral-600 dark:text-coral-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-coral-800 dark:text-coral-200">{flash.error}</p>
                        </div>
                    )}

                    {/* Main Card Container */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden">
                        {/* Step 1: Code Input Section */}
                        <div className="p-6 sm:p-8 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                                <span className="flex items-center gap-1.5">
                                    <KeyRound className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                                    AppSumo License Code
                                </span>
                            </label>
                            <div className="relative flex rounded-xl shadow-sm">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={handleCodeChange}
                                    onBlur={() => validateLicenseCode(code)}
                                    placeholder="e.g. BOTIFY-XXXX-XXXX-XXXX"
                                    className="block w-full px-4 py-3.5 text-base sm:text-lg font-mono font-medium rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 uppercase tracking-wider"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => validateLicenseCode(code)}
                                    disabled={isValidating || !code}
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    {isValidating ? 'Verifying...' : 'Verify Code'}
                                </button>
                            </div>

                            {/* Validation Result Feedback */}
                            {isValidating && (
                                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 animate-pulse">
                                    Checking license database...
                                </p>
                            )}

                            {validateError && (
                                <p className="mt-2 text-xs text-coral-600 dark:text-coral-400 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {validateError}
                                </p>
                            )}

                            {codeState?.valid && (
                                <div className="mt-4 rounded-xl bg-brand-50/80 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 rounded-full bg-brand-600 text-white">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-brand-900 dark:text-brand-200">
                                                    {codeState.plan?.name || 'AppSumo Lifetime Deal'}
                                                </h4>
                                                <span className="text-xs text-brand-700 dark:text-brand-300 capitalize font-medium">
                                                    {codeState.tier} Verified • Lifetime Access Unlocked
                                                </span>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-brand-200 dark:bg-brand-800 text-brand-900 dark:text-brand-100 text-xs font-bold uppercase">
                                            Ready To Redeem
                                        </span>
                                    </div>

                                    {/* Feature preview bullets */}
                                    {codeState.plan?.features && codeState.plan.features.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-brand-200/60 dark:border-brand-800/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                                            {codeState.plan.features.slice(0, 6).map((feat, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                                                    <span className="truncate">{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Account Selection / Creation Form */}
                        <div className="p-6 sm:p-8">
                            {/* Tabs for New vs Existing */}
                            <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-6">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('new')}
                                    className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                        activeTab === 'new'
                                            ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                                    }`}
                                >
                                    <Sparkles className="w-4 h-4 text-brand-600" />
                                    New Account Registration
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('existing')}
                                    className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                        activeTab === 'existing'
                                            ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                                    }`}
                                >
                                    <UserCheck className="w-4 h-4 text-brand-600" />
                                    Existing Account / Stacking
                                </button>
                            </div>

                            {/* TAB 1: New Account Form */}
                            {activeTab === 'new' && (
                                <form onSubmit={submitNewUser} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                            Full Name or Business Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newForm.data.name}
                                            onChange={(e) => newForm.setData('name', e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                            required
                                        />
                                        {newForm.errors.name && <p className="text-xs text-coral-600 mt-1">{newForm.errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                            Work Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={newForm.data.email}
                                            onChange={(e) => newForm.setData('email', e.target.value)}
                                            placeholder="you@company.com"
                                            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                            required
                                        />
                                        {newForm.errors.email && <p className="text-xs text-coral-600 mt-1">{newForm.errors.email}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                value={newForm.data.password}
                                                onChange={(e) => newForm.setData('password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                                required
                                            />
                                            {newForm.errors.password && <p className="text-xs text-coral-600 mt-1">{newForm.errors.password}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                                Confirm Password
                                            </label>
                                            <input
                                                type="password"
                                                value={newForm.data.password_confirmation}
                                                onChange={(e) => newForm.setData('password_confirmation', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newForm.data.agree_terms}
                                                onChange={(e) => newForm.setData('agree_terms', e.target.checked)}
                                                className="mt-1 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                                required
                                            />
                                            <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                                I agree to the{' '}
                                                <a href="/p/terms" target="_blank" className="text-brand-600 hover:underline">
                                                    Terms of Service
                                                </a>{' '}
                                                and{' '}
                                                <a href="/p/privacy" target="_blank" className="text-brand-600 hover:underline">
                                                    Privacy Policy
                                                </a>.
                                            </span>
                                        </label>
                                        {newForm.errors.agree_terms && (
                                            <p className="text-xs text-coral-600 mt-1">{newForm.errors.agree_terms}</p>
                                        )}
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={newForm.processing || !code}
                                            className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                            {newForm.processing ? 'Creating Workspace...' : 'Activate Lifetime Access & Enter Dashboard'}
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* TAB 2: Existing Account / Stacking Form */}
                            {activeTab === 'existing' && (
                                <form onSubmit={submitExistingUser} className="space-y-4">
                                    {currentUser ? (
                                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-800/40 mb-4">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Currently logged in as:</p>
                                            <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                                                {currentUser.name} ({currentUser.email})
                                            </p>
                                            <p className="text-xs text-brand-600 dark:text-brand-400 mt-2">
                                                Redeeming will apply this license or stack your tier on your active workspace immediately.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                                    Existing Account Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={existingForm.data.email}
                                                    onChange={(e) => existingForm.setData('email', e.target.value)}
                                                    placeholder="you@company.com"
                                                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                                    required
                                                />
                                                {existingForm.errors.email && (
                                                    <p className="text-xs text-coral-600 mt-1">{existingForm.errors.email}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                                    Account Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={existingForm.data.password}
                                                    onChange={(e) => existingForm.setData('password', e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                                    required
                                                />
                                                {existingForm.errors.password && (
                                                    <p className="text-xs text-coral-600 mt-1">{existingForm.errors.password}</p>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={existingForm.processing || !code}
                                            className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                            {existingForm.processing ? 'Applying License...' : 'Redeem & Stack License to Account'}
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* AppSumo FAQs & Information */}
                    <div className="mt-14 max-w-3xl mx-auto">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white text-center mb-6">
                            Frequently Asked Questions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                                    <HelpCircle className="w-4 h-4 text-brand-600" />
                                    How does code stacking work?
                                </h4>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Each AppSumo code upgrades your workspace limits. 1 code activates Tier 1, 2 codes elevate you to Tier 2, and 3 codes unlock Tier 3 with white-label capabilities.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                                    <KeyRound className="w-4 h-4 text-brand-600" />
                                    Where do I find my code?
                                </h4>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Your license code is located in your AppSumo account under Products / Purchases or inside your AppSumo order receipt email.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                                    <Zap className="w-4 h-4 text-brand-600" />
                                    Can I stack more codes later?
                                </h4>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    Yes! You can redeem additional codes anytime directly from your account billing settings under Subscriptions to upgrade your limits.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                                    <ShieldCheck className="w-4 h-4 text-brand-600" />
                                    Is there any recurring monthly charge?
                                </h4>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    No recurring fees. AppSumo lifetime deals give you permanent platform access with lifetime updates for your unlocked tier.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}

