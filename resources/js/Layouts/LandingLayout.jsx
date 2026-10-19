import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@/Components/ui';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/hooks/useLocale';
import { useBranding } from '@/hooks/useBranding';
import { Globe, Coins } from 'lucide-react';

function SunIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
    );
}

function MoonIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
    );
}

function MenuIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

export default function LandingLayout({ children }) {
    const { t } = useTranslation();

    const CREATOR_LINKS = [
        { label: 'For Creators', desc: 'Monetize your audience & knowledge', href: '/creators' },
        { label: 'Sell Digital Products', desc: 'Ebooks, templates & file vaults', href: '/sell-digital-products' },
        { label: 'Online Courses', desc: 'Video curriculum & Academy', href: '/courses' },
        { label: 'Affiliate Network', desc: 'Recruit partners & track sales', href: '/affiliates' },
    ];

    const COMMERCE_LINKS = [
        { label: '24/7 AI Sales Agent', desc: 'Autonomous sales on WhatsApp & IG', href: '/ai-sales-agent' },
        { label: 'WhatsApp Commerce', desc: 'In-chat checkout & broadcast', href: '/#channels' },
        { label: 'Visual Automation', desc: 'No-code funnels & workflows', href: '/#features' },
    ];

    const RESOURCE_LINKS = [
        { label: 'Platform Architecture', desc: 'Engineering & system design', href: '/architecture' },
        { label: 'Integrations', desc: 'Connect to 100+ platforms', href: '/integrations' },
        { label: 'Botify Academy', desc: 'Tutorials & creator masterclasses', href: '/academy' },
        { label: 'Blog', desc: 'Growth strategies & guides', href: '/blog' },
        { label: 'FAQ', desc: 'Answers to common questions', href: '/faq' },
    ];

    const page = usePage();
    const auth = page.props.auth;
    const { theme, setTheme } = useTheme();
    const { locale: currentLocale, setLocale } = useLocale();
    const supportedLocales = page.props.supportedLocales ?? { en: 'English' };
    const localeEntries = Object.entries(supportedLocales);
    const currencies = page.props.currencies ?? [];
    const displayCurrency = page.props.displayCurrency ?? 'USD';

    const handleCurrencyChange = (code) => {
        router.put(route('currency.update'), { currency: code }, { preserveScroll: true });
    };
    const { appName, logoUrl } = useBranding();
    const brandMark = (className) =>
        logoUrl ? (
            <img src={logoUrl} alt={appName} className={className} />
        ) : (
            <span className="text-xl font-semibold text-white truncate max-w-[180px]">{appName}</span>
        );
    const [mobileOpen, setMobileOpen] = useState(false);
    const landing = page.props.landing ?? {};

    const signinLabel = landing['landing.signin_label'] || 'Sign In';
    const signinHref = landing['landing.signin_link_type'] === 'static' && landing['landing.signin_link_url']
        ? landing['landing.signin_link_url']
        : '/login';
    const signinIsExternal = landing['landing.signin_link_type'] === 'static' && landing['landing.signin_link_url'];

    const getStartedLabel = landing['landing.getstarted_label'] || 'Get Started Free';
    const getStartedHref = landing['landing.getstarted_link_type'] === 'static' && landing['landing.getstarted_link_url']
        ? landing['landing.getstarted_link_url']
        : '/register';
    const getStartedIsExternal = landing['landing.getstarted_link_type'] === 'static' && landing['landing.getstarted_link_url'];

    const handleThemeToggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        if (auth?.user) {
            router.post(route('theme.update'), { theme: next }, { preserveScroll: true });
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col">
            {/* ── Header ── */}
            <header className="sticky top-0 z-50 border-b border-white/10" style={{ background: 'rgb(var(--brand-950))' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group flex-shrink-0">
                        {brandMark('h-9 w-auto max-w-[180px] object-contain transition-opacity group-hover:opacity-80')}
                    </Link>

                    {/* Desktop nav links */}
                    <nav className="hidden lg:flex items-center gap-1.5 flex-1">
                        {/* Creator Economy Dropdown */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-soft px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition duration-150 font-medium"
                                >
                                    <span>Creator Economy</span>
                                    <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="left" width="64" contentClasses="py-2 bg-neutral-900 border border-white/10 shadow-xl rounded-xl">
                                {CREATOR_LINKS.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="block px-4 py-2.5 hover:bg-white/10 transition"
                                    >
                                        <div className="text-sm font-semibold text-white">{item.label}</div>
                                        <div className="text-xs text-neutral-400">{item.desc}</div>
                                    </Link>
                                ))}
                            </Dropdown.Content>
                        </Dropdown>

                        {/* AI Commerce Dropdown */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-soft px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition duration-150 font-medium"
                                >
                                    <span>AI Commerce</span>
                                    <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="left" width="64" contentClasses="py-2 bg-neutral-900 border border-white/10 shadow-xl rounded-xl">
                                {COMMERCE_LINKS.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="block px-4 py-2.5 hover:bg-white/10 transition"
                                    >
                                        <div className="text-sm font-semibold text-white">{item.label}</div>
                                        <div className="text-xs text-neutral-400">{item.desc}</div>
                                    </Link>
                                ))}
                            </Dropdown.Content>
                        </Dropdown>

                        {/* Direct Links */}
                        <Link
                            href="/use-cases"
                            className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition duration-150 font-medium"
                        >
                            Use Cases
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition duration-150 font-medium"
                        >
                            Pricing
                        </Link>

                        {/* Resources Dropdown */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-soft px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition duration-150 font-medium"
                                >
                                    <span>Resources</span>
                                    <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="left" width="64" contentClasses="py-2 bg-neutral-900 border border-white/10 shadow-xl rounded-xl">
                                {RESOURCE_LINKS.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="block px-4 py-2.5 hover:bg-white/10 transition"
                                    >
                                        <div className="text-sm font-semibold text-white">{item.label}</div>
                                        <div className="text-xs text-neutral-400">{item.desc}</div>
                                    </Link>
                                ))}
                            </Dropdown.Content>
                        </Dropdown>
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-1">
                        {/* Theme toggle */}
                        <button
                            type="button"
                            onClick={handleThemeToggle}
                            className="flex items-center justify-center rounded-soft p-2 text-white/70 hover:text-white hover:bg-white/10 transition duration-150"
                            aria-label={t('topbar.switch_theme')}
                        >
                            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                        </button>

                        {/* Locale */}
                        {localeEntries.length > 1 && (
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="hidden sm:flex items-center gap-1.5 rounded-soft px-2.5 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition duration-150"
                                        aria-label={t('topbar.language')}
                                    >
                                        <Globe className="h-4 w-4" />
                                        <span>{currentLocale.toUpperCase()}</span>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="48">
                                    {localeEntries.map(([code, label]) => (
                                        <Dropdown.Item
                                            key={code}
                                            as="button"
                                            onClick={() => setLocale(code)}
                                            className={currentLocale === code ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium' : ''}
                                        >
                                            {label}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Content>
                            </Dropdown>
                        )}

                        {/* Currency */}
                        {currencies.length > 1 && (
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="hidden sm:flex items-center gap-1.5 rounded-soft px-2.5 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition duration-150"
                                        aria-label={t('topbar.currency', 'Currency')}
                                    >
                                        <Coins className="h-4 w-4" />
                                        <span>{displayCurrency}</span>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="48">
                                    {currencies.map((c) => (
                                        <Dropdown.Item
                                            key={c.code}
                                            as="button"
                                            onClick={() => handleCurrencyChange(c.code)}
                                            className={displayCurrency === c.code ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium' : ''}
                                        >
                                            <span className="font-semibold mr-1.5">{c.symbol}</span>
                                            <span>{c.code}</span>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Content>
                            </Dropdown>
                        )}

                        {/* Auth links — desktop */}
                        <div className="hidden sm:flex items-center gap-1 ms-1 ps-2 border-l border-white/20">
                            {auth?.user ? (
                                <>
                                    <Link
                                        href={typeof route === 'function' && typeof route().has === 'function' && route().has('client.dashboard') ? route('client.dashboard') : '/app'}
                                        className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition duration-150"
                                    >
                                        {t('nav.dashboard')}
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="rounded-soft bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-all duration-150"
                                    >
                                        {t('nav.sign_out')}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {signinIsExternal ? (
                                        <a
                                            href={signinHref}
                                            className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition duration-150 font-medium"
                                        >
                                            {signinLabel}
                                        </a>
                                    ) : (
                                        <Link
                                            href={signinHref}
                                            className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition duration-150 font-medium"
                                        >
                                            {signinLabel}
                                        </Link>
                                    )}
                                    {getStartedIsExternal ? (
                                        <a
                                            href={getStartedHref}
                                            className="rounded-soft bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-all duration-150"
                                        >
                                            {getStartedLabel}
                                        </a>
                                    ) : (
                                        <Link
                                            href={getStartedHref}
                                            className="rounded-soft bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-all duration-150"
                                        >
                                            {getStartedLabel}
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            type="button"
                            className="sm:hidden flex items-center justify-center rounded-soft p-2 text-white/70 hover:text-white hover:bg-white/10 transition duration-150 ms-1"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label={t('open_menu')}
                        >
                            {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="lg:hidden border-t border-white/10 bg-brand-950/95 backdrop-blur-md px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto">
                        <div>
                            <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider px-3 mb-1">Creator Economy</div>
                            <div className="space-y-0.5">
                                {CREATOR_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="block rounded-soft px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition"
                                    >
                                        <div>{link.label}</div>
                                        <div className="text-xs text-neutral-400">{link.desc}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-3 mb-1">AI & Commerce</div>
                            <div className="space-y-0.5">
                                {COMMERCE_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="block rounded-soft px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition"
                                    >
                                        <div>{link.label}</div>
                                        <div className="text-xs text-neutral-400">{link.desc}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-1">Platform & Resources</div>
                            <div className="grid grid-cols-2 gap-1 px-1">
                                <Link href="/use-cases" onClick={() => setMobileOpen(false)} className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">Use Cases</Link>
                                <Link href="/pricing" onClick={() => setMobileOpen(false)} className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">Pricing</Link>
                                <Link href="/architecture" onClick={() => setMobileOpen(false)} className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">Architecture</Link>
                                <Link href="/integrations" onClick={() => setMobileOpen(false)} className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">Integrations</Link>
                                <Link href="/academy" onClick={() => setMobileOpen(false)} className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">Academy</Link>
                                <Link href="/blog" onClick={() => setMobileOpen(false)} className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">Blog</Link>
                                <Link href="/faq" onClick={() => setMobileOpen(false)} className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">FAQ</Link>
                                <Link href="/contact" onClick={() => setMobileOpen(false)} className="rounded-soft px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">Contact</Link>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 space-y-2">
                            {auth?.user ? (
                                <>
                                    <Link href={typeof route === 'function' && typeof route().has === 'function' && route().has('client.dashboard') ? route('client.dashboard') : '/app'} onClick={() => setMobileOpen(false)} className="block rounded-soft px-3 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition">
                                        {t('nav.dashboard')}
                                    </Link>
                                    <Link href="/logout" method="post" as="button" className="block w-full text-left rounded-soft px-3 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition">
                                        {t('nav.sign_out')}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {signinIsExternal ? (
                                        <a href={signinHref} onClick={() => setMobileOpen(false)} className="block rounded-soft px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition">
                                            {signinLabel}
                                        </a>
                                    ) : (
                                        <Link href={signinHref} onClick={() => setMobileOpen(false)} className="block rounded-soft px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition">
                                            {signinLabel}
                                        </Link>
                                    )}
                                    {getStartedIsExternal ? (
                                        <a href={getStartedHref} onClick={() => setMobileOpen(false)} className="block rounded-soft bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition text-center">
                                            {getStartedLabel}
                                        </a>
                                    ) : (
                                        <Link href={getStartedHref} onClick={() => setMobileOpen(false)} className="block rounded-soft bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition text-center">
                                            {getStartedLabel}
                                        </Link>
                                    )}
                                </>
                            )}
                            {currencies.length > 1 && (
                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm px-2 text-white/80">
                                    <span className="flex items-center gap-1.5"><Coins className="h-4 w-4" /> {t('topbar.currency', 'Currency')}</span>
                                    <select
                                        value={displayCurrency}
                                        onChange={(e) => handleCurrencyChange(e.target.value)}
                                        className="bg-brand-900/60 text-white rounded-md px-2.5 py-1 text-xs border border-white/20 focus:outline-none"
                                    >
                                        {currencies.map((c) => (
                                            <option key={c.code} value={c.code} className="text-neutral-900 bg-white">
                                                {c.code} ({c.symbol})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* ── Main content ── */}
            <main className="flex-1">{children}</main>

            {/* ── Footer ── */}
            <footer style={{ background: 'rgb(var(--brand-950))', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                        {/* Brand */}
                        <div className="col-span-2">
                            <Link href="/" className="flex items-center mb-4">
                                {brandMark('h-9 w-auto max-w-[180px] object-contain')}
                            </Link>
                            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm mb-4">
                                The AI-powered platform where creators, educators, and businesses create, sell, market, and automate their digital products and courses.
                            </p>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                                Official Meta WhatsApp & Instagram API Partner
                            </div>
                            {/* Social icons */}
                            <div className="flex items-center gap-3 mt-5">
                                {[
                                    { label: 'Twitter', path: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' },
                                    { label: 'Facebook', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                                    { label: 'Instagram', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
                                ].map((s) => (
                                    <a key={s.label} href="#" aria-label={s.label} className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={s.path} />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Creator Commerce */}
                        <div>
                            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Creator Commerce</h4>
                            <ul className="space-y-2.5">
                                {[
                                    { label: 'For Creators', href: '/creators' },
                                    { label: 'Sell Digital Products', href: '/sell-digital-products' },
                                    { label: 'Online Courses', href: '/courses' },
                                    { label: 'Affiliate Network', href: '/affiliates' },
                                    { label: 'Creator Pricing', href: '/pricing' },
                                ].map((l) => (
                                    <li key={l.href}>
                                        <Link href={l.href} className="text-sm text-neutral-400 hover:text-white transition">{l.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* AI & Automation */}
                        <div>
                            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">AI & Automation</h4>
                            <ul className="space-y-2.5">
                                {[
                                    { label: '24/7 AI Sales Agent', href: '/ai-sales-agent' },
                                    { label: 'WhatsApp Commerce', href: '/#channels' },
                                    { label: 'Visual Automations', href: '/#features' },
                                    { label: 'Platform Architecture', href: '/architecture' },
                                    { label: 'Integrations', href: '/integrations' },
                                ].map((l) => (
                                    <li key={l.href}>
                                        <Link href={l.href} className="text-sm text-neutral-400 hover:text-white transition">{l.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources & Legal */}
                        <div>
                            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Resources & Legal</h4>
                            <ul className="space-y-2.5">
                                {[
                                    { label: 'Botify Academy', href: '/academy' },
                                    { label: 'Blog', href: '/blog' },
                                    { label: 'Use Cases', href: '/use-cases' },
                                    { label: 'About Us', href: '/about' },
                                    { label: 'Contact Team', href: '/contact' },
                                    { label: 'Privacy Policy', href: '/p/privacy' },
                                    { label: 'Terms of Service', href: '/p/terms' },
                                ].map((l) => (
                                    <li key={l.href}>
                                        <Link href={l.href} className="text-sm text-neutral-400 hover:text-white transition">{l.label}</Link>
                                    </li>
                                ))}
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                                        className="text-sm text-neutral-400 hover:text-white transition text-left"
                                    >
                                        Cookie Settings
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-xs text-neutral-500">
                            &copy; {new Date().getFullYear()} {appName}. {t('nav.all_rights_reserved')}
                        </p>
                        <button
                            type="button"
                            onClick={handleThemeToggle}
                            className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1.5 transition"
                        >
                            {theme === 'dark' ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
                            {theme === 'dark' ? t('nav.light_mode') : t('nav.dark_mode')}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
