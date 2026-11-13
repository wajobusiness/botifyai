import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ChannelBrandIcon } from '@/Components/BrandIcons';
import {
    LayoutDashboard, CreditCard, Package, FileText, Users, Settings,
    Layers, Webhook, Radio, Inbox, Bot, Zap, Share2, MapPin, Tag,
    LifeBuoy, ExternalLink, ShoppingBag, KanbanSquare, Wallet, Store,
    Sparkles, GraduationCap, Palette, BarChart3, ShieldCheck, PlugZap,
    MessageSquare, Mail
} from 'lucide-react';

const iconClass = 'h-4 w-4';
const whatsappNavIcon = <ChannelBrandIcon channel="whatsapp" className={iconClass} />;

function safeRoute(name, ...args) {
    try {
        if (typeof route !== 'undefined') {
            return route(name, ...args);
        }
        return '#';
    } catch {
        return '#';
    }
}

/**
 * Single source of truth for the client-panel sidebar navigation.
 *
 * Restructured based on high-conversion SaaS and creator architecture:
 * Consolidating 15 fragmented groups into 4 clear functional hubs:
 * 1. Audience & Leads (CRM, Segments, Scraper, Pipeline)
 * 2. Automation & Channels (Workflows, AI Chatbots, Campaigns, Inbox, Templates)
 * 3. Social Studio (Composer, Posts, Calendar, Brand Kit, Accounts)
 * 4. Commerce & Monetization (Stores, Products, Orders, Wallet & Payouts)
 * Plus Growth & Learning (Academy, Affiliates, Analytics) and System Settings.
 */
export default function useClientNav() {
    const { auth, branding } = usePage().props;
    const { t } = useTranslation();
    const user = auth?.user;
    const docsUrl = branding?.docs_url;
    const isClientAdmin = user?.client_role === 'administrator';

    // 1. Overview
    const dashboardItems = [
        {
            label: t('nav.dashboard', 'Dashboard'),
            href: safeRoute('client.dashboard'),
            icon: <LayoutDashboard className={iconClass} />,
            activePattern: 'client.dashboard'
        },
    ];

    // 2. Hub 1: Audience & Leads
    const audienceLeadsItems = [
        {
            label: t('nav.contacts', 'Contacts & Lists'),
            href: safeRoute('client.contacts.index'),
            icon: <Users className={iconClass} />,
            activePattern: 'client.contacts.*'
        },
        {
            label: t('nav.segments', 'Segments & Tags'),
            href: safeRoute('client.segments.index'),
            icon: <Tag className={iconClass} />,
            activePattern: 'client.segments.*'
        },
        {
            label: t('nav.lead_scraper', 'B2B Lead Scraper'),
            href: safeRoute('client.leads.index'),
            icon: <MapPin className={iconClass} />,
            activePattern: 'client.leads.index'
        },
        {
            label: t('nav.lead_pipeline', 'Deal Pipeline (CRM)'),
            href: safeRoute('client.leads.pipeline.index'),
            icon: <KanbanSquare className={iconClass} />,
            activePattern: 'client.leads.pipeline.*'
        },
    ];

    // 3. Hub 2: Automation & Channels
    const automationChannelsItems = [
        {
            label: t('nav.automations', 'Workflows & Flows'),
            href: safeRoute('client.automations.index'),
            icon: <Zap className={iconClass} />,
            activePattern: 'client.automations.*'
        },
        {
            label: t('nav.chatbots', 'WhatsApp AI Agents'),
            href: safeRoute('client.ai.chatbots.index'),
            icon: <Bot className={iconClass} />,
            activePattern: 'client.ai.chatbots.*'
        },
        {
            label: t('nav.campaigns', 'Broadcast & Campaigns'),
            href: safeRoute('client.campaigns.index'),
            icon: <Radio className={iconClass} />,
            activePattern: 'client.campaigns.*'
        },
        {
            label: t('nav.inbox', 'Team Unified Inbox'),
            href: safeRoute('client.inbox.index'),
            icon: <Inbox className={iconClass} />,
            activePattern: 'client.inbox.index'
        },
        {
            label: t('nav.channel_setup', 'Connected Channels'),
            href: safeRoute('client.inbox.setup'),
            icon: <PlugZap className={iconClass} />,
            activePattern: 'client.inbox.setup*'
        },
        {
            label: t('nav.sms_gateways', 'SMS Gateways'),
            href: safeRoute('client.sms-gateways.index'),
            icon: <MessageSquare className={iconClass} />,
            activePattern: 'client.sms-gateways.*'
        },
        {
            label: t('nav.email_server', 'Email Server (SMTP)'),
            href: safeRoute('client.email-server.index'),
            icon: <Mail className={iconClass} />,
            activePattern: 'client.email-server.*'
        },
        {
            label: t('nav.templates', 'Message Templates'),
            href: safeRoute('client.whatsapp.templates.index'),
            icon: whatsappNavIcon,
            activePattern: 'client.whatsapp.templates.*'
        },
        {
            label: t('nav.auto_replies', 'Instant Auto-Replies'),
            href: safeRoute('client.whatsapp.auto-replies.index'),
            icon: whatsappNavIcon,
            activePattern: 'client.whatsapp.auto-replies.*'
        },
    ];

    // 4. Hub 3: Social Studio
    const socialStudioItems = [
        {
            label: t('nav.post_composer', 'AI Post Composer'),
            href: safeRoute('client.social.composer'),
            icon: <FileText className={iconClass} />,
            activePattern: 'client.social.composer'
        },
        {
            label: t('nav.posts', 'Scheduled Posts'),
            href: safeRoute('client.social.posts.index'),
            icon: <Radio className={iconClass} />,
            activePattern: 'client.social.posts.*'
        },
        {
            label: t('nav.calendar', 'Social Calendar'),
            href: safeRoute('client.social.calendar'),
            icon: <LayoutDashboard className={iconClass} />,
            activePattern: 'client.social.calendar'
        },
        {
            label: t('nav.brand_kit', 'Brand Design Kit'),
            href: safeRoute('client.social.brand-kit.index'),
            icon: <Palette className={iconClass} />,
            activePattern: 'client.social.brand-kit.*'
        },
        {
            label: t('nav.social_accounts', 'Connected Channels'),
            href: safeRoute('client.social.accounts.index'),
            icon: <Share2 className={iconClass} />,
            activePattern: 'client.social.accounts.*'
        },
    ];

    // 5. Hub 4: Commerce & Monetization
    const commerceItems = [
        {
            label: t('nav.stores', 'Stores & Funnels'),
            href: safeRoute('client.ecommerce.stores.index'),
            icon: <Store className={iconClass} />,
            activePattern: 'client.ecommerce.stores.*'
        },
        {
            label: t('nav.products', 'Products & Vault'),
            href: safeRoute('client.ecommerce.products.index'),
            icon: <Package className={iconClass} />,
            activePattern: 'client.ecommerce.products.*'
        },
        {
            label: t('nav.orders', 'Orders & Sales'),
            href: safeRoute('client.ecommerce.orders.index'),
            icon: <ShoppingBag className={iconClass} />,
            activePattern: 'client.ecommerce.orders.*'
        },
        {
            label: t('nav.wallet', 'My Wallet & Payouts'),
            href: safeRoute('client.ecommerce.wallet.index'),
            icon: <Wallet className={iconClass} />,
            activePattern: 'client.ecommerce.wallet.*'
        },
    ];

    // 6. Growth & Learning (Stand-alone items)
    const growthItems = [
        {
            label: t('nav.academy', 'Botify Academy'),
            href: safeRoute('client.academy.index'),
            icon: <GraduationCap className={iconClass} />,
            activePattern: 'client.academy.*',
            badge: 'Free'
        },
        {
            label: t('nav.affiliates', 'Affiliate Hub'),
            href: safeRoute('client.affiliates.index'),
            icon: <Sparkles className={iconClass} />,
            activePattern: 'client.affiliates.*'
        },
        {
            label: t('nav.reports', 'Growth Analytics'),
            href: safeRoute('client.reports.campaigns.index'),
            icon: <BarChart3 className={iconClass} />,
            activePattern: 'client.reports.*'
        },
    ];

    // 7. System & Configuration
    const settingsItems = [
        {
            label: t('nav.settings', 'Settings & Channels'),
            href: safeRoute('client.settings.index'),
            icon: <Settings className={iconClass} />,
            activePattern: 'client.settings.*'
        },
        {
            label: t('nav.workspaces', 'Workspaces'),
            href: safeRoute('client.workspaces.index'),
            icon: <Layers className={iconClass} />,
            activePattern: 'client.workspaces.*'
        },
    ];

    if (isClientAdmin) {
        settingsItems.push(
            {
                label: t('nav.team', 'Team Members'),
                href: safeRoute('client.team.index'),
                icon: <Users className={iconClass} />,
                activePattern: 'client.team.*'
            },
            {
                label: t('nav.audit_log', 'Audit Log'),
                href: safeRoute('client.audit-log.index'),
                icon: <ShieldCheck className={iconClass} />,
                activePattern: 'client.audit-log.*'
            }
        );
    }

    settingsItems.push(
        {
            label: t('nav.billing', 'Billing & Plans'),
            href: safeRoute('client.subscription.show'),
            icon: <CreditCard className={iconClass} />,
            activePattern: 'client.subscription.*'
        },
        {
            label: t('nav.webhooks', 'Webhooks & API'),
            href: safeRoute('client.webhooks.index'),
            icon: <Webhook className={iconClass} />,
            activePattern: 'client.webhooks.*'
        },
        {
            label: t('nav.support_tickets', 'Help & Support'),
            href: safeRoute('client.support.index'),
            icon: <LifeBuoy className={iconClass} />,
            activePattern: 'client.support.*'
        }
    );

    if (docsUrl) {
        settingsItems.push({
            label: t('nav.help_docs', 'Documentation'),
            href: docsUrl,
            icon: <ExternalLink className={iconClass} />,
            external: true
        });
    }

    return [
        { type: 'group', label: t('nav.group_overview', 'Overview'), items: dashboardItems },
        { type: 'group', label: t('nav.group_audience_leads', 'Audience & Leads'), items: audienceLeadsItems },
        { type: 'group', label: t('nav.group_automation_channels', 'Automation & Channels'), items: automationChannelsItems },
        { type: 'group', label: t('nav.group_social_studio', 'Social Studio'), items: socialStudioItems },
        { type: 'group', label: t('nav.group_commerce', 'Commerce & Stores'), items: commerceItems },
        { type: 'group', label: t('nav.group_growth', 'Growth & Learning'), items: growthItems },
        { type: 'group', label: t('nav.group_system', 'Settings & System'), items: settingsItems },
    ];
}
