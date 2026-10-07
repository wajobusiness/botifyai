import { Link, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import Sidebar from '@/Components/Sidebar';
import Topbar from '@/Components/Topbar';
import CommandPalette from '@/Components/CommandPalette';
import {
    LayoutDashboard,
    Users,
    Package,
    CreditCard,
    Globe,
    Banknote,
    Settings,
    FileText,
    ShieldCheck,
    UserCog,
    Tag,
    Receipt,
    Percent,
    Server,
    LifeBuoy,
    Plug,
    Radio,
    Brain,
    Clock,
    KeyRound,
    LogOut,
    Wallet,
    ShoppingBag,
    Search,
    Award,
    GraduationCap,
    Newspaper,
} from 'lucide-react';

/** Nav item: { labelKey, route, href, icon, permission } - show only if user has permission (or no permission required). Order follows typical admin usage frequency. */
const ADMIN_NAV_ITEMS = [
    { labelKey: 'admin.dashboard', labelFallback: 'Dashboard', route: 'admin.dashboard', href: () => route('admin.dashboard'), icon: LayoutDashboard },
    { labelKey: 'admin.client_management', labelFallback: 'Clients', route: 'admin.clients.index', href: () => route('admin.clients.index'), icon: Users, permission: 'view_clients' },
    { labelKey: 'admin.nav.academy', labelFallback: 'Botify Academy', route: 'admin.academy.index', href: () => { try { return route('admin.academy.index'); } catch (_) { return '/admin/academy'; } }, icon: GraduationCap, permission: 'view_settings' },
    { labelKey: 'admin.nav.blog', labelFallback: 'Blog Management', route: 'admin.blog.index', href: () => { try { return route('admin.blog.index'); } catch (_) { return '/admin/blog'; } }, icon: Newspaper, permission: 'view_settings' },
    { labelKey: 'admin.seo_tracking', labelFallback: 'SEO & Tracking', route: 'admin.seo.index', href: () => { try { return route('admin.seo.index'); } catch (_) { return '/admin/seo'; } }, icon: Search, permission: 'view_settings' },
    { labelKey: 'admin.nav.subscriptions', labelFallback: 'Subscriptions', route: 'admin.subscriptions.index', href: () => route('admin.subscriptions.index'), icon: CreditCard, permission: 'view_subscriptions' },
    { labelKey: 'admin.nav.support', labelFallback: 'Support', route: 'admin.support.index', href: () => route('admin.support.index'), icon: LifeBuoy, permission: 'view_settings' },
    { labelKey: 'admin.nav.payments', labelFallback: 'Payments', route: 'admin.payments.index', href: () => route('admin.payments.index'), icon: Receipt, permission: 'view_payment_gateways' },
    { labelKey: 'admin.nav.commerce_orders', labelFallback: 'Commerce Orders', route: 'admin.ecommerce.orders.index', href: () => { try { return route('admin.ecommerce.orders.index'); } catch (_) { return '/admin/ecommerce/orders'; } }, icon: ShoppingBag, permission: 'view_payment_gateways' },
    { labelKey: 'admin.nav.merchant_payouts', labelFallback: 'Merchant Payouts', route: 'admin.ecommerce.payouts.index', href: () => { try { return route('admin.ecommerce.payouts.index'); } catch (_) { return '/admin/ecommerce/payouts'; } }, icon: Wallet, permission: 'view_payment_gateways' },
    { labelKey: 'admin.nav.affiliates', labelFallback: 'Affiliate Program', route: 'admin.affiliates.index', href: () => { try { return route('admin.affiliates.index'); } catch (_) { return '/admin/affiliates'; } }, icon: Award, permission: 'view_settings' },
    { labelKey: 'admin.nav.plans', labelFallback: 'Plans', route: 'admin.plans.index', href: () => route('admin.plans.index'), icon: Package, permission: 'view_plans' },
    { labelKey: 'admin.nav.coupons', labelFallback: 'Coupons', route: 'admin.coupons.index', href: () => route('admin.coupons.index'), icon: Tag, permission: 'view_plans' },
    { labelKey: 'admin.tax_rates', labelFallback: 'Tax Rates', route: 'admin.tax-rates.index', href: () => route('admin.tax-rates.index'), icon: Percent, permission: 'view_plans' },
    { labelKey: 'admin.payment_gateways', labelFallback: 'Payment Gateways', route: 'admin.payment-gateways.index', href: () => route('admin.payment-gateways.index'), icon: CreditCard, permission: 'view_payment_gateways' },
    { labelKey: 'admin.email', labelFallback: 'Email System', route: 'admin.email-system.index', href: () => route('admin.email-system.index'), icon: FileText, permission: 'view_email_settings' },
    { labelKey: 'admin.nav.currencies', labelFallback: 'Currencies', route: 'admin.currencies.index', href: () => route('admin.currencies.index'), icon: Banknote, permission: 'view_currencies' },
    { labelKey: 'admin.languages', labelFallback: 'Languages', route: 'admin.locales.index', href: () => route('admin.locales.index'), icon: Globe, permission: 'view_languages' },
    { labelKey: 'admin.roles_permissions', labelFallback: 'Roles & Permissions', route: 'admin.roles-permissions.index', href: () => route('admin.roles-permissions.index'), icon: ShieldCheck, permission: 'view_admin_roles', permissionAlt: 'manage_admin_roles' },
    { labelKey: 'admin.nav.admins', labelFallback: 'Admin Users', route: 'admin.admins.index', href: () => route('admin.admins.index'), icon: UserCog, permission: 'view_admins' },
    { labelKey: 'admin.landing_page', labelFallback: 'Landing Page', route: 'admin.landing-page.index', href: () => route('admin.landing-page.index'), icon: FileText, permission: 'view_settings' },
    { labelKey: 'admin.cms_pages', labelFallback: 'CMS Pages', route: 'admin.cms-pages.index', href: () => route('admin.cms-pages.index'), icon: FileText, permission: 'view_settings' },
    { labelKey: 'admin.nav.queue', labelFallback: 'Queue Monitor', route: 'admin.queue.index', href: () => route('admin.queue.index'), icon: Server, permission: 'view_settings' },
    { labelKey: 'admin.cron_setup', labelFallback: 'Cron Setup', route: 'admin.cron-setup.index', href: () => route('admin.cron-setup.index'), icon: Clock, permission: 'view_settings' },
    { labelKey: 'admin.pusher_settings', labelFallback: 'Pusher Settings', route: 'admin.pusher-settings.index', href: () => route('admin.pusher-settings.index'), icon: Radio, permission: 'manage_settings' },
    { labelKey: 'admin.nav.settings', labelFallback: 'Settings', route: 'admin.settings.index', href: () => route('admin.settings.index'), icon: Settings, permission: 'view_settings' },
    { labelKey: 'admin.license', labelFallback: 'License', route: 'admin.license.index', href: () => route('admin.license.index'), icon: KeyRound, permission: 'view_settings' },
    { labelKey: 'admin.audit_log', labelFallback: 'Audit Log', route: 'admin.audit-log.index', href: () => route('admin.audit-log.index'), icon: FileText, permission: 'view_settings' },
    { labelKey: 'admin.nav.integrations', labelFallback: 'Integrations', route: 'admin.integrations.index', href: () => route('admin.integrations.index'), icon: Plug, permission: 'manage_integrations' },
    { labelKey: 'admin.nav.ai', labelFallback: 'AI Configuration', route: 'admin.ai.index', href: () => route('admin.ai.index'), icon: Brain, permission: 'view_settings' },
];

/** Dedupe and order: Dashboard first, then a single entry per route (first match wins). */
function useAdminNav() {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const permissions = auth?.permissions ?? [];
    const isSuperAdmin = auth?.adminUser?.is_super_admin ?? (auth?.adminUser?.id === 1 || permissions.length === 0);
    const hasPermission = (key) => isSuperAdmin || permissions.length === 0 || permissions.includes(key);

    return useMemo(() => {
        return ADMIN_NAV_ITEMS.filter((item) => {
            const perm = item.permission;
            const alt = item.permissionAlt;
            if (!perm || isSuperAdmin || permissions.length === 0) return true;
            if (hasPermission(perm) || (alt && hasPermission(alt))) return true;
            return false;
        }).map((item) => {
            const translated = t(item.labelKey);
            const label = (!translated || translated === item.labelKey) ? (item.labelFallback || item.labelKey) : translated;
            return {
                label,
                route: item.route,
                href: typeof item.href === 'function' ? item.href() : item.href,
                icon: item.icon ? <item.icon className="h-5 w-5" /> : null,
            };
        });
    }, [t, permissions, isSuperAdmin]);
}

function AdminLayoutFooter() {
    const { t } = useTranslation();
    const { auth, app_version: appVersion } = usePage().props;
    const adminUser = auth?.adminUser;
    const initials = (() => {
        if (adminUser?.name) return adminUser.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
        if (adminUser?.email) return adminUser.email[0].toUpperCase();
        return 'A';
    })();
    return (
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 space-y-1">
            {adminUser && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-soft">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        {adminUser.name && (
                            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200 truncate">{adminUser.name}</p>
                        )}
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate" title={adminUser.email}>
                            {adminUser.email}
                        </p>
                    </div>
                </div>
            )}
            <Link
                href={route('admin.logout')}
                method="post"
                as="button"
                className="flex items-center gap-2 w-full text-left rtl:text-right rounded-soft px-3 py-2 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition duration-150"
            >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {t('nav.logout')}
            </Link>
            {appVersion && (
                <p className="px-3 pt-1 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
                    v{appVersion}
                </p>
            )}
        </div>
    );
}

export default function AdminLayout({ title = 'Admin', header, children }) {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const adminNav = useAdminNav();
    const { demo_mode: demoMode, branding } = usePage().props;
    const logoUrl = branding?.logo_url;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                title={t('nav.admin')}
                logo={logoUrl ? <img src={logoUrl} alt="Logo" className="h-8 max-w-[160px] object-contain" /> : null}
                showCreateButton={false}
                navItems={adminNav.map((item, i) => ({
                    ...item,
                    key: `${item.route}-${item.label}-${i}`,
                    active: () => {
                        try {
                            return route().current(item.route);
                        } catch (_) {
                            return typeof window !== 'undefined' && window.location.pathname.startsWith(item.href);
                        }
                    },
                }))}
                footer={<AdminLayoutFooter />}
            />

            <div className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64">
                <Topbar
                    showLogo={false}
                    title={title}
                    showWorkspace={false}
                    showLocale={false}
                    showCurrency={false}
                    showAccount={false}
                />

                <main className={`p-4 sm:p-6 lg:p-8 ${demoMode ? 'pb-16' : ''}`}>
                    {header && typeof header === 'object' && (
                        <div className="mb-6">
                            {header}
                        </div>
                    )}
                    {children}
                </main>
            </div>

            <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-soft-lg bg-white dark:bg-neutral-900 border border-soft border-gray-200 dark:border-neutral-800 shadow-soft-lg text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800 lg:hidden rtl:right-auto rtl:left-4"
                aria-label={t('open_menu')}
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <CommandPalette searchRoute={route('admin.search')} />
            <Toaster richColors position="top-right" />
            {/* Demo notice — pinned to the bottom of the viewport */}
            {demoMode && (
                <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 bg-amber-500/90 text-amber-950 px-4 py-2 text-sm font-medium pointer-events-none">
                    <span>{t('demo.banner') || 'Demo mode: changes are disabled.'}</span>
                </div>
            )}
        </div>
    );
}
