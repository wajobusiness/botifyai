<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Support\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandingPageController extends Controller
{
    /**
     * Single source of truth for every editable marketing-site setting.
     * Public pages, the admin "Site Content" manager, and the LandingPageSeeder
     * all derive their keys/defaults from here so the three never drift.
     */
    public static function defaults(): array
    {
        // Default copy carries the `:brand` token rather than a literal name.
        // LandingPageSeeder writes these defaults straight into system_settings, so
        // interpolating here would freeze whatever the brand was at install time and
        // leave the stored copy stale after a rename. The token is resolved on read
        // (see brandify()), which keeps saved content correct across future renames.
        return [
            // Master switch — when '0', public marketing pages redirect to login
            'landing.page_enabled' => '1',

            // ── Navbar ──────────────────────────────────────────────
            'landing.signin_label'         => 'Sign In',
            'landing.signin_link_type'     => 'dynamic',
            'landing.signin_link_url'      => '',
            'landing.getstarted_label'     => 'Start Free Trial',
            'landing.getstarted_link_type' => 'dynamic',
            'landing.getstarted_link_url'  => '',

            // ── SEO ─────────────────────────────────────────────────
            'landing.seo_title'       => ':brand — Omnichannel AI Inbox, Lead Discovery, WhatsApp Store & Affiliates',
            'landing.seo_description' => ':brand unifies WhatsApp, Messenger, Instagram, LinkedIn, X, TikTok, SMS & Email in one AI-powered inbox. Discover B2B leads, automate sales with RAG chatbots, sell digital products, and scale with affiliates.',
            'landing.seo_keywords'    => 'WhatsApp business automation, omnichannel inbox, AI sales chatbot, B2B lead discovery, WhatsApp store, sell digital products, affiliate software, social media scheduler, contact CRM, bulk messaging',
            'landing.seo_og_image'    => '',

            // ── Hero ────────────────────────────────────────────────
            'landing.hero_enabled'       => '1',
            'landing.hero_badge'         => '🚀 All-in-One AI Revenue Engine & Omnichannel Platform',
            'landing.hero_title'         => 'One AI Inbox to Find Leads, Automate Chats, Sell Products & Scale Affiliates',
            'landing.hero_subtitle'      => 'Unify WhatsApp, Instagram, Messenger, LinkedIn, X, TikTok, SMS and Email into one shared inbox. Discover verified leads, close deals 24/7 with custom AI chatbots, sell digital products directly, and grow with a built-in affiliate network.',
            'landing.hero_cta_primary'   => 'Start Free 14-Day Trial',
            'landing.hero_cta_secondary' => 'Explore Live Pricing',
            'landing.hero_trust_1'       => 'No credit card required',
            'landing.hero_trust_2'       => 'Official Meta & WhatsApp Cloud APIs',
            'landing.hero_trust_3'       => 'Instant 2-minute setup',

            // ── Metrics (numbers band) ──────────────────────────────
            'landing.metrics_enabled' => '1',
            'landing.metric_1_value'  => '50M+',
            'landing.metric_1_label'  => 'Messages Delivered',
            'landing.metric_2_value'  => '12,000+',
            'landing.metric_2_label'  => 'Active Businesses & Merchants',
            'landing.metric_3_value'  => '99.9%',
            'landing.metric_3_label'  => 'Enterprise Uptime SLA',
            'landing.metric_4_value'  => '5x',
            'landing.metric_4_label'  => 'Higher Conversion vs Email',

            // ── Trusted By (brand logos) ────────────────────────────
            'landing.stats_enabled'  => '1',
            'landing.stats_heading'  => 'Trusted by 12,000+ businesses and global merchants',
            'landing.stats_1_label'  => 'Acme',
            'landing.stats_2_label'  => 'TechStart',
            'landing.stats_3_label'  => 'GrowthLab',
            'landing.stats_4_label'  => 'Marketly',
            'landing.stats_5_label'  => 'SalesHQ',
            'landing.stats_6_label'  => 'ReachMore',

            // ── Channels showcase ───────────────────────────────────
            'landing.channels_enabled'  => '1',
            'landing.channels_badge'    => 'Omnichannel Connectivity',
            'landing.channels_title'    => 'Meet Your Customers Everywhere They Message',
            'landing.channels_subtitle' => 'Consolidate all 8 major channels into a single unified workspace. Never lose a lead to tab switching or missed notifications.',
            'landing.channel_1_key'   => 'whatsapp',
            'landing.channel_1_title' => 'WhatsApp Business',
            'landing.channel_1_desc'  => 'Official Meta WhatsApp Cloud API. Send broadcast campaigns, automate customer support, and confirm orders with zero ban risk.',
            'landing.channel_2_key'   => 'messenger',
            'landing.channel_2_title' => 'Facebook Messenger',
            'landing.channel_2_desc'  => 'Respond to Facebook Page messages, ad clicks, post comments, and direct customer inquiries in real time.',
            'landing.channel_3_key'   => 'instagram',
            'landing.channel_3_title' => 'Instagram Direct & Mentions',
            'landing.channel_3_desc'  => 'Turn story mentions, reel comments, and direct messages into qualified buyers automatically.',
            'landing.channel_4_key'   => 'sms',
            'landing.channel_4_title' => 'SMS & High-Deliverability Alerts',
            'landing.channel_4_desc'  => 'Reach customers instantly with high-open-rate SMS broadcast campaigns, OTPs, and urgent alerts.',
            'landing.channel_5_key'   => 'email',
            'landing.channel_5_title' => 'Transactional & Marketing Email',
            'landing.channel_5_desc'  => 'Send unified marketing emails, receipts, and order updates from the same centralized contact timeline.',

            // ── Problem / Solution ──────────────────────────────────
            'landing.problems_enabled' => '1',
            'landing.problems_title'   => 'The Chaos of Disconnected Business Tools',
            'landing.problem_1'        => 'Customer conversations scattered across 8 different apps with zero centralized context',
            'landing.problem_2'        => 'High-value leads go cold because your team cannot respond to inquiries 24/7',
            'landing.problem_3'        => 'Paying thousands monthly for separate lead scrapers, CRM tools, checkout carts, and affiliate systems',
            'landing.problem_4'        => 'Zero visibility into agent response times, customer histories, or campaign revenue attribution',
            'landing.solution_title'   => ':brand Unifies Your Entire Revenue Stack',
            'landing.solution_desc'    => 'Everything you need to discover prospects, engage customers, close sales, and scale referrals in one platform.',
            'landing.solution_1'       => 'One shared team inbox for WhatsApp, Social DMs, SMS, and Email with collision detection',
            'landing.solution_2'       => 'Autonomous RAG AI chatbots that resolve inquiries and close sales 24/7 in any language',
            'landing.solution_3'       => 'Built-in B2B lead discovery, native digital store checkout, and multi-tier affiliate program',
            'landing.solution_4'       => 'Real-time analytics on delivery rates, response velocity, and closed-loop e-commerce revenue',

            // ── Features ────────────────────────────────────────────
            'landing.features_enabled'   => '1',
            'landing.features_badge'     => 'Platform Capabilities',
            'landing.features_title'     => 'Everything You Need to Scale Sales, Support & Commerce',
            'landing.features_subtitle'  => 'From B2B lead discovery to multi-channel chat, automated digital checkout, and affiliate distribution.',
            'landing.feature_1_icon'     => 'message-square',
            'landing.feature_1_title'    => 'Unified Omnichannel Inbox',
            'landing.feature_1_desc'     => 'Consolidate WhatsApp, Instagram, Messenger, SMS & Email into one collaborative shared inbox with collision detection and notes.',
            'landing.feature_2_icon'     => 'cpu',
            'landing.feature_2_title'    => 'RAG-Powered AI Chatbots',
            'landing.feature_2_desc'     => 'Train custom AI agents on your documents, catalogs, and FAQs to resolve support and close sales 24/7 in 60+ languages.',
            'landing.feature_3_icon'     => 'trending-up',
            'landing.feature_3_title'    => 'B2B Lead Discovery & Scraping',
            'landing.feature_3_desc'     => 'Discover and extract verified local business and company leads with phone numbers, emails, and websites directly into your CRM.',
            'landing.feature_4_icon'     => 'layout',
            'landing.feature_4_title'    => 'Built-in Online Store & Checkout',
            'landing.feature_4_desc'     => 'Launch a high-converting storefront in minutes. Sell digital files, courses, and physical goods with instant WhatsApp download delivery.',
            'landing.feature_5_icon'     => 'users',
            'landing.feature_5_title'    => 'Multi-Tier Affiliate Program',
            'landing.feature_5_desc'     => 'Empower merchants to set custom commission percentages, recruit affiliates, provide tracked referral links, and automate payouts.',
            'landing.feature_6_icon'     => 'zap',
            'landing.feature_6_title'    => 'Visual No-Code Automation',
            'landing.feature_6_desc'     => 'Build drag-and-drop conversational funnels, automated follow-ups, keyword triggers, and condition-based routing in minutes.',
            'landing.feature_7_icon'     => 'share-2',
            'landing.feature_7_title'    => 'Smart Bulk Broadcasting',
            'landing.feature_7_desc'     => 'Deliver personalized WhatsApp and SMS campaigns to thousands of contacts with smart throttling and high deliverability.',
            'landing.feature_8_icon'     => 'globe',
            'landing.feature_8_title'    => 'Multi-Platform Social Scheduler',
            'landing.feature_8_desc'     => 'Plan, create, and auto-publish content across Facebook, Instagram, LinkedIn, X, and TikTok from a single calendar.',
            'landing.feature_9_icon'     => 'bar-chart-2',
            'landing.feature_9_title'    => 'Revenue Analytics & Attribution',
            'landing.feature_9_desc'     => 'Track open rates, response velocity, agent efficiency, conversion funnels, and exact e-commerce revenue attribution.',

            // ── How it works ────────────────────────────────────────
            'landing.howitworks_enabled'  => '1',
            'landing.howitworks_badge'    => 'Instant Setup',
            'landing.howitworks_title'    => 'From Setup to Automated Revenue in 3 Steps',
            'landing.howitworks_subtitle' => 'No complex setup or engineering needed — launch your entire omnichannel sales engine in minutes.',
            'landing.step_1_title'        => 'Connect Your Channels',
            'landing.step_1_desc'         => 'Connect your official WhatsApp Cloud API, Instagram, Messenger, and social profiles in a few clicks.',
            'landing.step_2_title'        => 'Discover Leads or Upload Products',
            'landing.step_2_desc'         => 'Find verified prospect lists with built-in lead discovery or add your products to your native digital store.',
            'landing.step_3_title'        => 'Automate, Sell & Scale',
            'landing.step_3_desc'         => 'Deploy AI chatbots, launch targeted broadcasts, and let affiliates multiply your store revenue automatically.',

            // ── Integrations strip ──────────────────────────────────
            'landing.integrations_strip_enabled'  => '1',
            'landing.integrations_strip_title'    => 'Works Seamlessly With Your Entire Tech Stack',
            'landing.integrations_strip_subtitle' => 'Connect :brand to 100+ platforms via native connectors, webhooks, and our enterprise REST API.',

            // ── Why us ──────────────────────────────────────────────
            'landing.why_enabled'   => '1',
            'landing.why_badge'     => 'Why :brand',
            'landing.why_title'     => 'Engineered for Serious Business Growth',
            'landing.why_subtitle'  => 'Why thousands of modern merchants, agencies, and sales teams choose :brand.',
            'landing.why_1_icon'    => 'shield-check',
            'landing.why_1_title'   => 'Official Meta Cloud API',
            'landing.why_1_desc'    => 'Built exclusively on official Meta Business APIs to guarantee 100% compliance, deliverability, and zero account ban risks.',
            'landing.why_2_icon'    => 'zap',
            'landing.why_2_title'   => '5-in-1 Platform Cost Savings',
            'landing.why_2_desc'    => 'Replace 5 separate subscriptions (Inbox, AI Bot, Lead Scraper, E-Commerce Store, and Affiliate Software) with one tool.',
            'landing.why_3_icon'    => 'trending-up',
            'landing.why_3_title'   => 'Instant Digital Delivery in Chat',
            'landing.why_3_desc'    => 'Customers buy and receive download tokens, receipts, and order updates instantly inside WhatsApp and SMS.',
            'landing.why_4_icon'    => 'globe',
            'landing.why_4_title'   => 'Multi-Language AI Translation',
            'landing.why_4_desc'    => 'Converse with global customers in over 60 languages with real-time AI contextual translation.',
            'landing.why_5_icon'    => 'users',
            'landing.why_5_title'   => 'Team Collaboration & Routing',
            'landing.why_5_desc'    => 'Prevent double replies with live collision detection, assign chats to specific agents, and leave private team notes.',
            'landing.why_6_icon'    => 'server',
            'landing.why_6_title'   => '99.9% Enterprise Uptime SLA',
            'landing.why_6_desc'    => 'High-availability cloud infrastructure engineered to handle millions of monthly transactions seamlessly.',

            // ── Security & Compliance ───────────────────────────────
            'landing.security_enabled'  => '1',
            'landing.security_badge'    => 'Security & Governance',
            'landing.security_title'    => 'Enterprise-Grade Security by Default',
            'landing.security_subtitle' => 'Your proprietary data, customer records, and payment transactions are safeguarded at every tier.',
            'landing.security_1_icon'  => 'shield-check',
            'landing.security_1_title' => 'End-to-End Encryption',
            'landing.security_1_desc'  => 'All messages, customer records, and API credentials are encrypted in transit (TLS 1.3) and at rest (AES-256).',
            'landing.security_2_icon'  => 'check-circle',
            'landing.security_2_title' => 'GDPR & Privacy Compliant',
            'landing.security_2_desc'  => 'Built-in consent controls, automated data deletion, and full support for European and international data rights.',
            'landing.security_3_icon'  => 'users',
            'landing.security_3_title' => 'Role-Based Access & 2FA',
            'landing.security_3_desc'  => 'Granular user permissions, mandatory 2FA authentication, and complete activity audit logging across workspaces.',
            'landing.security_4_icon'  => 'server',
            'landing.security_4_title' => 'Bank-Grade Payment Security',
            'landing.security_4_desc'  => 'Seamless integration with Stripe, Paystack, and trusted gateways with zero storage of raw credit card data.',

            // ── Testimonials ────────────────────────────────────────
            'landing.testimonials_enabled'   => '1',
            'landing.testimonials_badge'     => 'Customer Stories',
            'landing.testimonials_title'     => 'Trusted by High-Growth Merchants & Sales Teams',
            'landing.testimonials_subtitle'  => 'See how modern businesses drive 5x higher revenue with :brand.',
            'landing.testimonial_1_name'     => 'David Okafor',
            'landing.testimonial_1_role'     => 'Founder, Digital Growth Hub',
            'landing.testimonial_1_text'     => 'Selling digital products directly over WhatsApp with automated download delivery doubled our conversion rate. The built-in affiliate system brought us 40+ promoters in our first month.',
            'landing.testimonial_1_avatar'   => '',
            'landing.testimonial_2_name'     => 'Elena Rostova',
            'landing.testimonial_2_role'     => 'Managing Director, Apex Agency',
            'landing.testimonial_2_text'     => 'The combination of B2B lead discovery and automated WhatsApp follow-ups transformed our outreach. We booked 3x more discovery calls with zero manual data entry.',
            'landing.testimonial_2_avatar'   => '',
            'landing.testimonial_3_name'     => 'Marcus Turner',
            'landing.testimonial_3_role'     => 'Head of Customer Experience, RetailX',
            'landing.testimonial_3_text'     => 'The RAG AI chatbot resolves 78% of our routine customer inquiries across WhatsApp and Instagram instantly. Our support team can now focus entirely on high-value clients.',
            'landing.testimonial_3_avatar'   => '',
            'landing.testimonial_4_name'     => 'Sarah Jenkins',
            'landing.testimonial_4_role'     => 'Growth Marketing Lead, SaaSMatrix',
            'landing.testimonial_4_text'     => 'Automations and smart broadcasts save us 35+ hours a week. It feels like having an entire dedicated 24/7 sales and support team.',
            'landing.testimonial_4_avatar'   => '',
            'landing.testimonial_5_name'     => 'Aisha Al-Mansoor',
            'landing.testimonial_5_role'     => 'E-Commerce Merchant, LuxeBoutique',
            'landing.testimonial_5_text'     => 'Cart recovery reminders sent automatically over WhatsApp recovered 24% of abandoned checkouts. It paid for our annual subscription within 48 hours.',
            'landing.testimonial_5_avatar'   => '',
            'landing.testimonial_6_name'     => 'Carlos Mendez',
            'landing.testimonial_6_role'     => 'Head of Sales, OmniTech Solutions',
            'landing.testimonial_6_text'     => 'Finally one unified workspace for WhatsApp, Instagram DMs, and SMS. Our average first response time dropped from 3 hours to under 45 seconds.',
            'landing.testimonial_6_avatar'   => '',

            // ── FAQ ─────────────────────────────────────────────────
            'landing.faq_enabled'   => '1',
            'landing.faq_badge'     => 'Got Questions?',
            'landing.faq_title'     => 'Frequently Asked Questions',
            'landing.faq_subtitle'  => 'Everything you need to know about getting started with :brand.',
            'landing.faq_1_q'       => 'Which communication and social channels does :brand support?',
            'landing.faq_1_a'       => ':brand unifies official WhatsApp Business Cloud API, Facebook Messenger, Instagram Direct Messages, LinkedIn, X (Twitter), TikTok, SMS, and Email into a single collaborative shared inbox.',
            'landing.faq_2_q'       => 'How does the built-in Lead Discovery tool work?',
            'landing.faq_2_a'       => 'Our Lead Discovery engine allows you to search for local businesses, companies, and industry niches by location and keyword. It extracts verified contact information (phone numbers, emails, addresses, and websites) directly into your CRM pipeline for immediate outreach.',
            'landing.faq_3_q'       => 'Can I sell digital files, courses, and products directly on :brand?',
            'landing.faq_3_a'       => 'Yes! You can launch a branded digital store in minutes, accept secure online payments, and automatically deliver instant download links, access keys, or order confirmations to buyers via WhatsApp and email.',
            'landing.faq_4_q'       => 'How does the merchant affiliate program work?',
            'landing.faq_4_a'       => 'As a merchant, you can enable affiliates on your store or specific products and choose your commission percentage (e.g., 10%, 20%, 30%). Affiliates get unique referral links, and :brand automatically tracks clicks, sales, and commissions.',
            'landing.faq_5_q'       => 'How do I train the AI chatbots on my business knowledge?',
            'landing.faq_5_a'       => 'You can upload PDF manuals, website URLs, product catalogs, and FAQ documents to your Knowledge Base. Our AI uses RAG (Retrieval-Augmented Generation) to answer customer questions accurately and on-brand without hallucinations.',
            'landing.faq_6_q'       => 'Is there a free trial, and do I need a credit card?',
            'landing.faq_6_a'       => 'Yes, every plan includes a 14-day free trial with full access to the platform. No credit card is required to get started.',

            // ── CTA ─────────────────────────────────────────────────
            'landing.cta_enabled'   => '1',
            'landing.cta_title'     => 'Ready to Put Your Sales & Customer Conversations on Autopilot?',
            'landing.cta_subtitle'  => 'Join 12,000+ businesses using :brand to find leads, engage customers across every channel, sell digital products, and scale partner revenue.',
            'landing.cta_primary'   => 'Start Free 14-Day Trial',
            'landing.cta_secondary' => 'Contact Sales Team',

            // ── About page ──────────────────────────────────────────
            'landing.about_badge'       => 'About :brand',
            'landing.about_title'       => 'We are on a mission to make business conversations effortless',
            'landing.about_subtitle'    => ':brand helps thousands of businesses turn everyday messages into lasting customer relationships.',
            'landing.about_story_title' => 'Our story',
            'landing.about_story_body'  => ":brand started with a simple frustration: customer conversations were scattered across too many apps, and great leads were slipping through the cracks.\n\nWe set out to build one platform where every WhatsApp, Messenger and Instagram conversation lives together — supercharged with AI and automation. Today, teams in over 60 countries use :brand to reply faster, sell more and build relationships that last.",
            'landing.about_value_1_icon'  => 'zap',
            'landing.about_value_1_title' => 'Move Fast',
            'landing.about_value_1_desc'  => 'We ship quickly and obsess over making complex things feel simple.',
            'landing.about_value_2_icon'  => 'users',
            'landing.about_value_2_title' => 'Customer First',
            'landing.about_value_2_desc'  => 'Every decision starts with the people who use our product every day.',
            'landing.about_value_3_icon'  => 'shield-check',
            'landing.about_value_3_title' => 'Trust & Privacy',
            'landing.about_value_3_desc'  => 'We protect customer data like it is our own — because it matters.',
            'landing.about_value_4_icon'  => 'globe',
            'landing.about_value_4_title' => 'Built for Everyone',
            'landing.about_value_4_desc'  => 'Accessible, multi-language and designed for teams of every size.',
            'landing.about_stat_1_value' => '12,000+',
            'landing.about_stat_1_label' => 'Businesses served',
            'landing.about_stat_2_value' => '60+',
            'landing.about_stat_2_label' => 'Countries',
            'landing.about_stat_3_value' => '50M+',
            'landing.about_stat_3_label' => 'Messages delivered',
            'landing.about_stat_4_value' => '99.9%',
            'landing.about_stat_4_label' => 'Uptime',
            'landing.about_cta_title'    => 'Want to join our journey?',
            'landing.about_cta_subtitle' => 'Start free today or get in touch — we would love to hear from you.',

            // ── Integrations page ───────────────────────────────────
            'landing.integrations_page_badge'    => 'Integrations',
            'landing.integrations_page_title'    => 'Connect :brand to your entire stack',
            'landing.integrations_page_subtitle' => 'Native integrations, webhooks and a full REST API — bring :brand into the tools your team already loves.',
            'landing.intcat_1_title' => 'Messaging Channels',
            'landing.intcat_1_items' => "WhatsApp Business\nFacebook Messenger\nInstagram Direct\nSMS\nEmail",
            'landing.intcat_2_title' => 'AI Providers',
            'landing.intcat_2_items' => "OpenAI\nAnthropic Claude\nGoogle Gemini\nQdrant",
            'landing.intcat_3_title' => 'E-commerce',
            'landing.intcat_3_items' => "Shopify\nWooCommerce\nMagento\nBigCommerce",
            'landing.intcat_4_title' => 'Payments & Billing',
            'landing.intcat_4_items' => "Stripe\nPayPal\nPaddle",
            'landing.intcat_5_title' => 'CRM & Automation',
            'landing.intcat_5_items' => "Zapier\nHubSpot\nGoogle Sheets\nWebhooks",
            'landing.intcat_6_title' => 'Developer Tools',
            'landing.intcat_6_items' => "REST API\nWebhooks\nOAuth 2.0\nFirebase",
            'landing.intcat_7_title' => 'Social Media',
            'landing.intcat_7_items' => "Facebook\nInstagram\nLinkedIn\nX (Twitter)\nYouTube\nTikTok",
        ];
    }

    public function index(): Response
    {
        $settings = [];
        foreach (self::defaults() as $key => $default) {
            $settings[$key] = SystemSetting::get($key, $default);
        }

        return Inertia::render('Admin/LandingPage/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'settings'   => ['required', 'array'],
            'settings.*' => ['nullable', 'string', 'max:5000'],
        ]);

        foreach ($data['settings'] as $key => $value) {
            if (str_starts_with($key, 'landing.')) {
                SystemSetting::set($key, $value ?? '', false, 'landing');
            }
        }

        return back()->with('success', 'Site content saved.');
    }

    /**
     * Substitute the `:brand` token with the admin-configured brand name.
     * Applied when marketing copy is rendered, never when it is stored, so the
     * copy follows the brand instead of freezing the name that was set at install.
     */
    public static function brandify(?string $value): string
    {
        return Brand::apply($value);
    }

    /**
     * Resolve every public marketing setting (DB value, falling back to defaults).
     * Keys are derived from defaults() so they can never drift.
     */
    public static function getPublicSettings(): array
    {
        $defaults = self::defaults();
        $result   = [];
        foreach ($defaults as $key => $default) {
            // The master toggle is read separately by LandingController; skip it here.
            if ($key === 'landing.page_enabled') {
                continue;
            }
            $result[$key] = self::brandify(SystemSetting::get($key, $default));
        }

        return $result;
    }
}
