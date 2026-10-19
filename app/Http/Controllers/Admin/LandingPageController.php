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
            'landing.seo_title'       => ':brand — AI-Powered Creator Commerce & Business Automation Platform',
            'landing.seo_description' => 'Create, sell, and automate your digital business with :brand. Host video courses, sell digital downloads & ebooks, recruit affiliates, and deploy 24/7 autonomous AI sales agents on WhatsApp & Instagram.',
            'landing.seo_keywords'    => 'AI creator platform, sell digital products, online courses, WhatsApp commerce, AI sales chatbot, digital product downloads, affiliate marketing software, omnichannel inbox, :brand',
            'landing.seo_og_image'    => '',

            // ── Hero ────────────────────────────────────────────────
            'landing.hero_enabled'       => '1',
            'landing.hero_badge'         => '✨ The AI-Powered Creator Commerce Platform',
            'landing.hero_title'         => 'Create, Sell, and Automate Your Digital Business with AI',
            'landing.hero_subtitle'      => 'The all-in-one platform for creators, entrepreneurs, and modern businesses. Host courses, sell digital downloads, recruit affiliates, and let autonomous AI sales agents close deals 24/7 on WhatsApp, Instagram, and web.',
            'landing.hero_cta_primary'   => 'Start Free 14-Day Trial',
            'landing.hero_cta_secondary' => 'Explore Creator Storefront Demo',
            'landing.hero_trust_1'       => 'No credit card required',
            'landing.hero_trust_2'       => 'Zero transaction fees on Pro',
            'landing.hero_trust_3'       => 'Official Meta WhatsApp & Instagram API',

            // ── Metrics (numbers band) ──────────────────────────────
            'landing.metrics_enabled' => '1',
            'landing.metric_1_value'  => '$14.2M+',
            'landing.metric_1_label'  => 'Creator & Merchant Sales',
            'landing.metric_2_value'  => '50M+',
            'landing.metric_2_label'  => 'Messages & Broadcasts Sent',
            'landing.metric_3_value'  => '88%',
            'landing.metric_3_label'  => 'Faster Response with AI Reps',
            'landing.metric_4_value'  => '4.2x',
            'landing.metric_4_label'  => 'Higher WhatsApp Conversion',

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
            'landing.problems_title'   => 'Running a Digital Business Shouldn’t Require 6 Broken Subscriptions',
            'landing.problem_1'        => 'Paying $400+/mo for Gumroad, Teachable, ManyChat, Mailchimp, and Zapier before making a single dollar',
            'landing.problem_2'        => 'Forcing buyers off WhatsApp or Instagram to slow external websites kills mobile conversion by 45%',
            'landing.problem_3'        => '60% of buyers DM questions while you are asleep — by morning, their purchase intent has vanished',
            'landing.problem_4'        => 'Juggling separate affiliate portals, coupon codes, and manual spreadsheets wastes 15+ hours weekly',
            'landing.solution_title'   => ':brand Unifies Your Entire Creator Commerce Engine',
            'landing.solution_desc'    => 'Everything you need to host courses, deliver digital files, automate sales chats, and scale affiliate revenue in one system.',
            'landing.solution_1'       => 'Branded digital storefronts and video courses with instant, secure tokenized download vaults',
            'landing.solution_2'       => 'Autonomous RAG AI sales agents that resolve objections, share links, and close deals 24/7 in 60+ languages',
            'landing.solution_3'       => 'Frictionless in-chat checkout and direct WhatsApp file delivery with 0% transaction fees on Pro',
            'landing.solution_4'       => 'Built-in multi-tier affiliate marketplace, automated payouts, and omnichannel social brand scheduler',

            // ── Features ────────────────────────────────────────────
            'landing.features_enabled'   => '1',
            'landing.features_badge'     => 'Platform Capabilities',
            'landing.features_title'     => 'Everything You Need to Create, Sell, Automate & Grow',
            'landing.features_subtitle'  => 'From hosting video courses and digital downloads to deploying 24/7 AI sales agents and scaling affiliate revenue.',
            'landing.feature_1_icon'     => 'layout',
            'landing.feature_1_title'    => 'Digital Storefront & Vault',
            'landing.feature_1_desc'     => 'Launch a custom branded store in minutes. Sell ebooks, templates, presets, and digital files with instant, tokenized download vaults.',
            'landing.feature_2_icon'     => 'cpu',
            'landing.feature_2_title'    => 'Botify Academy & Video Courses',
            'landing.feature_2_desc'     => 'Host structured courses with video lessons, curriculum modules, downloadable assets, student progress, and zero monthly student caps.',
            'landing.feature_3_icon'     => 'message-square',
            'landing.feature_3_title'    => '24/7 Autonomous AI Sales Agent',
            'landing.feature_3_desc'     => 'RAG-powered conversational agents that engage buyers on WhatsApp, Instagram & web, resolve objections, and share checkout links.',
            'landing.feature_4_icon'     => 'trending-up',
            'landing.feature_4_title'    => 'In-Chat Checkout & Mobile Pay',
            'landing.feature_4_desc'     => 'Sell directly inside WhatsApp & Instagram with mobile-friendly checkouts supporting global cards, mobile money, and local currencies.',
            'landing.feature_5_icon'     => 'users',
            'landing.feature_5_title'    => 'Built-in Affiliate Network',
            'landing.feature_5_desc'     => 'Recruit promoters, configure custom commission splits, track referral clicks automatically, and automate creator payouts.',
            'landing.feature_6_icon'     => 'zap',
            'landing.feature_6_title'    => 'Visual Workflow Automation',
            'landing.feature_6_desc'     => 'Build drag-and-drop conversational funnels, lead scoring, automated abandoned cart recovery, and condition-based routing.',
            'landing.feature_7_icon'     => 'share-2',
            'landing.feature_7_title'    => 'Autonomous Social Design Engine',
            'landing.feature_7_desc'     => 'Generate on-brand social graphics and auto-publish across Instagram, TikTok, LinkedIn, Facebook, and X from a unified calendar.',
            'landing.feature_8_icon'     => 'globe',
            'landing.feature_8_title'    => 'Omnichannel Shared Team Inbox',
            'landing.feature_8_desc'     => 'Unify WhatsApp, Instagram DMs, Messenger, SMS, and Email with live collision detection and team collaboration tools.',
            'landing.feature_9_icon'     => 'bar-chart-2',
            'landing.feature_9_title'    => 'Revenue Analytics & Attribution',
            'landing.feature_9_desc'     => 'Track course completions, conversion funnels, affiliate performance, and closed-loop e-commerce revenue attribution.',

            // ── How it works ────────────────────────────────────────
            'landing.howitworks_enabled'  => '1',
            'landing.howitworks_badge'    => 'Creator Workflow',
            'landing.howitworks_title'    => 'From Product Upload to Automated Revenue in 4 Steps',
            'landing.howitworks_subtitle' => 'No complex webhooks or engineering needed — launch your entire AI creator commerce stack in minutes.',
            'landing.step_1_title'        => 'Upload Your Digital Products & Courses',
            'landing.step_1_desc'         => 'Add your ebooks, templates, consulting sessions, or video course modules with custom branding and pricing.',
            'landing.step_2_title'        => 'Connect Social & WhatsApp Channels',
            'landing.step_2_desc'         => 'Link your official WhatsApp Business number, Instagram account, and Facebook page with one-click authorization.',
            'landing.step_3_title'        => 'Train Your 24/7 AI Sales Specialist',
            'landing.step_3_desc'         => 'Upload your syllabus, FAQs, and product details so your AI agent answers customer objections accurately on autopilot.',
            'landing.step_4_title'        => 'Scale Sales & Affiliate Distribution',
            'landing.step_4_desc'         => 'Let AI close sales in chat, deliver download tokens, recover abandoned carts, and mobilize affiliates automatically.',

            // ── Integrations strip ──────────────────────────────────
            'landing.integrations_strip_enabled'  => '1',
            'landing.integrations_strip_title'    => 'Works Seamlessly With Your Entire Tech Stack',
            'landing.integrations_strip_subtitle' => 'Connect :brand to 100+ platforms via native connectors, webhooks, and our enterprise REST API.',

            // ── Why us ──────────────────────────────────────────────
            'landing.why_enabled'   => '1',
            'landing.why_badge'     => 'Why :brand',
            'landing.why_title'     => 'Engineered for Creators & High-Growth Businesses',
            'landing.why_subtitle'  => 'Why thousands of course creators, authors, coaches, and digital entrepreneurs choose :brand.',
            'landing.why_1_icon'    => 'zap',
            'landing.why_1_title'   => 'Zero Transaction Fees on Pro',
            'landing.why_1_desc'    => 'Unlike legacy platforms charging 10% platform cuts, keep 100% of your net creator revenue on our Pro and Enterprise plans.',
            'landing.why_2_icon'    => 'message-square',
            'landing.why_2_title'   => 'Proactive 24/7 AI Sales Reps',
            'landing.why_2_desc'    => 'Static stores wait for traffic. BotifyAI actively engages Instagram and WhatsApp visitors, answers questions, and closes sales 24/7.',
            'landing.why_3_icon'    => 'trending-up',
            'landing.why_3_title'   => 'Instant In-Chat Digital Vault Delivery',
            'landing.why_3_desc'    => 'Buyers receive cryptographically secure download tokens, lesson links, and receipts directly in WhatsApp and SMS within 5 seconds.',
            'landing.why_4_icon'    => 'users',
            'landing.why_4_title'   => 'Built-in Affiliate Army',
            'landing.why_4_desc'    => 'Recruit promoters effortlessly, configure automatic commission splits, and track affiliate conversions without extra software.',
            'landing.why_5_icon'    => 'shield-check',
            'landing.why_5_title'   => 'Official Meta Cloud API Partner',
            'landing.why_5_desc'    => 'Built directly on official WhatsApp & Instagram Business APIs ensuring 100% deliverability and zero account ban risks.',
            'landing.why_6_icon'    => 'server',
            'landing.why_6_title'   => '99.9% Enterprise Cloud SLA',
            'landing.why_6_desc'    => 'Enterprise infrastructure engineered to handle millions of transactions, course streams, and messaging broadcasts seamlessly.',

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
            'landing.testimonials_badge'     => 'Creator Stories',
            'landing.testimonials_title'     => 'Loved by Creators, Course Sellers & Growth Brands',
            'landing.testimonials_subtitle'  => 'See how digital entrepreneurs are driving 4.2x higher sales with :brand.',
            'landing.testimonial_1_name'     => 'Marcus Vance',
            'landing.testimonial_1_role'     => 'Founder & Creator, CreatorFlow Academy',
            'landing.testimonial_1_text'     => 'Moving our 4 video courses and masterclasses from Kajabi and ManyChat to :brand cut our monthly software bill from $680 to $49. Our WhatsApp checkout conversions jumped 42% because students get instant access in chat.',
            'landing.testimonial_1_avatar'   => '',
            'landing.testimonial_2_name'     => 'Amara Nwosu',
            'landing.testimonial_2_role'     => 'Author & Digital Strategist, DigitalMastery',
            'landing.testimonial_2_text'     => 'Our affiliates generated over $38,000 in ebook downloads last quarter. The built-in affiliate portal and automated commission tracking saved our team 15+ hours of manual spreadsheet bookkeeping every week.',
            'landing.testimonial_2_avatar'   => '',
            'landing.testimonial_3_name'     => 'Tariq Chen',
            'landing.testimonial_3_role'     => 'Head of Admissions, FutureSkills Online',
            'landing.testimonial_3_text'     => 'The AI sales agent on our Instagram DMs feels like a full-time sales executive who never sleeps. It answered 1,400+ prospective student questions last month and closed 190 course sales completely unassisted.',
            'landing.testimonial_3_avatar'   => '',
            'landing.testimonial_4_name'     => 'Sarah Jenkins',
            'landing.testimonial_4_role'     => 'Growth Marketing Lead, SaaSMatrix',
            'landing.testimonial_4_text'     => 'The combination of automated social posting and multi-channel WhatsApp broadcast funnels saves us 35+ hours a week. It feels like an entire automated growth team.',
            'landing.testimonial_4_avatar'   => '',
            'landing.testimonial_5_name'     => 'Aisha Al-Mansoor',
            'landing.testimonial_5_role'     => 'E-Commerce Merchant, LuxeBoutique',
            'landing.testimonial_5_text'     => 'Cart recovery reminders sent automatically over WhatsApp recovered 26% of abandoned checkouts. It paid for our annual subscription within the first 48 hours.',
            'landing.testimonial_5_avatar'   => '',
            'landing.testimonial_6_name'     => 'Carlos Mendez',
            'landing.testimonial_6_role'     => 'Managing Director, OmniGrowth Agency',
            'landing.testimonial_6_text'     => 'Finally one unified workspace for WhatsApp, Instagram DMs, courses, and affiliates. Our average first response time dropped from 3 hours to under 30 seconds.',
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
