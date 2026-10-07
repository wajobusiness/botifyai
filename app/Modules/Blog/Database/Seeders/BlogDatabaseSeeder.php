<?php

namespace App\Modules\Blog\Database\Seeders;

use App\Models\AdminUser;
use App\Modules\Blog\Models\BlogAuthor;
use App\Modules\Blog\Models\BlogCategory;
use App\Modules\Blog\Models\BlogPost;
use App\Modules\Blog\Models\BlogTag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Categories
        $categoriesData = [
            [
                'name' => 'AI Chatbots & Agents',
                'slug' => 'ai-chatbots-agents',
                'description' => 'Discover how autonomous AI chatbots and intelligent agents automate customer inquiries, qualify leads, and boost sales 24/7.',
                'icon' => 'Brain',
                'order' => 1,
            ],
            [
                'name' => 'WhatsApp Automation',
                'slug' => 'whatsapp-automation',
                'description' => 'Strategies, tutorials, and workflows for scaling business engagement using the official WhatsApp Business API.',
                'icon' => 'MessageSquare',
                'order' => 2,
            ],
            [
                'name' => 'Digital Commerce & Sales',
                'slug' => 'digital-commerce-sales',
                'description' => 'Guides on selling digital products, e-books, courses, and software with high-converting automated checkouts.',
                'icon' => 'ShoppingBag',
                'order' => 3,
            ],
            [
                'name' => 'Marketing & CRM',
                'slug' => 'marketing-crm',
                'description' => 'Omnichannel broadcasting, drip sequences, audience segmentation, and CRM automation tactics.',
                'icon' => 'Target',
                'order' => 4,
            ],
            [
                'name' => 'Affiliate Growth & Monetization',
                'slug' => 'affiliate-growth-monetization',
                'description' => 'How to launch high-yield affiliate programs, recruit affiliates, and scale passive recurring revenue.',
                'icon' => 'TrendingUp',
                'order' => 5,
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['slug']] = BlogCategory::updateOrCreate(
                ['slug' => $c['slug']],
                $c
            );
        }

        // 2. Seed Default Author (E-E-A-T Compliant)
        $admin = AdminUser::first();
        $author = BlogAuthor::updateOrCreate(
            ['slug' => 'botifyai-editorial-team'],
            [
                'admin_user_id' => $admin?->id,
                'name' => 'BotifyAI Editorial & Research Team',
                'slug' => 'botifyai-editorial-team',
                'title_role' => 'AI Automation & Growth Specialists',
                'avatar_url' => '/storage/branding/avatar-default.png',
                'bio' => 'The BotifyAI Research Team analyzes customer engagement trends, conversational AI architectures, and growth automation for modern online businesses.',
                'email' => 'editorial@botifyai.cloud',
                'social_links' => [
                    'twitter' => 'https://twitter.com/botifyai',
                    'linkedin' => 'https://linkedin.com/company/botifyai',
                    'website' => 'https://botifyai.cloud',
                ],
                'is_active' => true,
            ]
        );

        // 3. Seed Core Tags
        $tagNames = [
            'AI Chatbot',
            'WhatsApp API',
            'Marketing Automation',
            'Digital Products',
            'Customer Support',
            'Lead Generation',
            'Affiliate Marketing',
            'CRM Automation',
            'Omnichannel Inbox',
            'SaaS Growth',
        ];

        $tags = [];
        foreach ($tagNames as $name) {
            $slug = Str::slug($name);
            $tags[$slug] = BlogTag::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'slug' => $slug]
            );
        }

        // 4. Seed Foundational In-Depth Pillar Articles (Google Search & AdSense Quality Compliant)
        $articles = [
            [
                'title' => 'How to Automate Customer Engagement with AI Chatbots on WhatsApp & Instagram',
                'slug' => 'how-to-automate-customer-engagement-with-ai-chatbots',
                'category_slug' => 'ai-chatbots-agents',
                'author_id' => $author->id,
                'is_featured' => true,
                'focus_keyword' => 'AI chatbots WhatsApp Instagram',
                'secondary_keywords' => ['conversational AI', 'WhatsApp business automation', 'Instagram DM automation', 'customer support AI'],
                'meta_title' => 'Automate Customer Engagement with AI Chatbots on WhatsApp & Instagram',
                'meta_description' => 'Learn how modern businesses deploy autonomous AI chatbots across WhatsApp and Instagram to resolve customer inquiries, qualify leads, and close sales 24/7.',
                'reading_time_minutes' => 7,
                'excerpt' => 'Modern consumers expect instant responses across social channels. Here is how to configure autonomous AI agents that handle FAQs, recommend products, and book appointments without human intervention.',
                'tags' => ['ai-chatbot', 'whatsapp-api', 'customer-support', 'lead-generation'],
                'content' => <<<'HTML'
<h2>The Rise of Conversational Customer Experience</h2>
<p>Modern consumers no longer want to wait 24 to 48 hours for an email response or sit on hold with a call center. Over 75% of online shoppers expect immediate assistance when evaluating a purchase. Messaging platforms like WhatsApp, Facebook Messenger, and Instagram Direct have emerged as the primary touchpoints for direct customer engagement.</p>

<p>However, scaling a 24/7 human support team across multiple time zones is cost-prohibitive for most growing businesses. This is where <strong>Autonomous AI Chatbots and Omnichannel Inbox Automation</strong> transform your customer service operations from a cost center into a continuous revenue generator.</p>

<h2>Key Benefits of Deploying AI Chatbots on WhatsApp & Instagram</h2>
<ul>
    <li><strong>Instant 24/7 Response Time:</strong> Answer routine queries, pricing inquiries, order lookups, and booking requests in under two seconds.</li>
    <li><strong>Intelligent Lead Qualification:</strong> Gather customer requirements, verify phone numbers and emails, and route hot leads directly to your sales CRM.</li>
    <li><strong>Multilingual Support:</strong> Converse fluently with international customers in over 50 languages without hiring specialized translators.</li>
    <li><strong>Reduced Operational Overhead:</strong> Deflect up to 80% of repetitive support tickets, allowing your human team to focus on complex, high-value negotiations.</li>
</ul>

<h2>Step-by-Step Architecture for AI Chatbot Deployment</h2>
<h3>1. Connecting Official Business Channels</h3>
<p>Ensure your company connects via the official WhatsApp Business Cloud API and Meta Graph API. This guarantees high deliverability, verified green checkmark eligibility, and zero risk of phone number bans.</p>

<h3>2. Ingesting Your Domain Knowledge Base</h3>
<p>Train your AI chatbot on your specific product catalog, return policies, shipping timelines, and company documents (PDFs, URLs, spreadsheets). Using Retrieval-Augmented Generation (RAG), the bot retrieves exact factual answers directly from your business data rather than hallucinating generic responses.</p>

<h3>3. Defining Human Handoff Guardrails</h3>
<p>Even the most intelligent AI agents encounter edge cases. Establish clear trigger conditions where the chatbot automatically tags a live support agent and transitions the active conversation into your team's unified shared inbox.</p>

<h2>Real-World Use Cases Driving Revenue</h2>
<p>Leading e-commerce stores, service providers, and SaaS startups leverage BotifyAI to automate their messaging funnels. From sending automated abandoned cart recovery messages on WhatsApp to qualifying incoming Instagram DM leads, conversational automation drives measurable ROI.</p>

<blockquote><p><strong>Pro Tip:</strong> Integrate your AI chatbot directly with your digital product checkout to allow customers to purchase, download products, and receive access credentials directly inside their messaging thread.</p></blockquote>

<h2>Conclusion: Getting Started Today</h2>
<p>Implementing AI chatbots is no longer an enterprise-only luxury. With BotifyAI's no-code visual builder and pre-trained LLM integrations, you can launch a fully customized AI assistant across WhatsApp and Instagram in less than 15 minutes.</p>
HTML
            ],
            [
                'title' => 'The Ultimate Guide to Selling Digital Products with Automated Checkouts in 2026',
                'slug' => 'ultimate-guide-selling-digital-products-automated-checkouts',
                'category_slug' => 'digital-commerce-sales',
                'author_id' => $author->id,
                'is_featured' => true,
                'focus_keyword' => 'selling digital products automated checkout',
                'secondary_keywords' => ['digital downloads', 'e-commerce automation', 'instant file delivery', 'payment gateways'],
                'meta_title' => 'How to Sell Digital Products with Automated Checkouts in 2026',
                'meta_description' => 'A complete, step-by-step blueprint for selling e-books, templates, software, and video courses with automated payment processing and instant digital fulfillment.',
                'reading_time_minutes' => 6,
                'excerpt' => 'Discover how creators and merchants build scalable digital product storefronts with multi-currency checkout, fraud protection, and automated instant file delivery.',
                'tags' => ['digital-products', 'marketing-automation', 'saas-growth'],
                'content' => <<<'HTML'
<h2>Why Digital Products are the Highest-Margin Business Model</h2>
<p>Digital products—ranging from PDF guides, video masterclasses, Figma design kits, to custom software licenses—have near-zero marginal production costs. Once created, a digital product can be sold thousands of times without inventory management, warehouse costs, or physical shipping logistics.</p>

<p>To succeed in today's competitive landscape, your purchasing workflow must be frictionless. Complex checkout forms with redundant registration requirements kill conversion rates. Modern buyers demand a 1-click checkout experience that accepts local bank transfers, cards, and mobile wallets with instant file delivery.</p>

<h2>Essential Features of a High-Converting Digital Storefront</h2>
<ul>
    <li><strong>Optimized One-Page Checkout:</strong> Remove unnecessary cart stages. Allow customers to input their email and pay in seconds.</li>
    <li><strong>Multi-Currency Support & Dynamic Pricing:</strong> Display prices in USD, NGN, GBP, EUR, and other localized currencies automatically based on the buyer's region.</li>
    <li><strong>Secure, Expiring Download Links:</strong> Protect your intellectual property by serving download URLs with cryptographic time limits and download attempt caps.</li>
    <li><strong>Automated Email & WhatsApp Delivery:</strong> Instantly dispatch order invoices and direct download links to the customer's inbox and mobile chat.</li>
</ul>

<h2>Maximizing Conversions with Rich HTML Descriptions & Live Previews</h2>
<p>Visual presentation is paramount when selling intangible assets. Use rich formatting—including high-resolution product preview mockups, feature check-lists, video walkthroughs, and verified customer testimonials—to build buyer trust before they complete the checkout.</p>

<h2>Turning Customers into Brand Advocates with Affiliate Integration</h2>
<p>Supercharge your digital product sales by enabling an in-house affiliate program. Offer influencers and industry advocates a 20% to 50% commission for every sale they refer. Your checkout platform should handle tracking cookies, affiliate attribution, and automated commission calculations seamlessly.</p>
HTML
            ],
            [
                'title' => 'Omnichannel Marketing Automation: Unifying WhatsApp, Messenger & Email',
                'slug' => 'omnichannel-marketing-automation-whatsapp-messenger-email',
                'category_slug' => 'marketing-crm',
                'author_id' => $author->id,
                'is_featured' => false,
                'focus_keyword' => 'omnichannel marketing automation',
                'secondary_keywords' => ['multi-channel CRM', 'WhatsApp broadcast', 'automated drip campaigns', 'customer engagement'],
                'meta_title' => 'Omnichannel Marketing Automation: WhatsApp, Messenger & Email Guide',
                'meta_description' => 'Master omnichannel marketing automation. Learn how to synchronize customer conversations, broadcast targeted campaigns, and nurture leads across WhatsApp, Messenger, and Email.',
                'reading_time_minutes' => 5,
                'excerpt' => 'Siloed marketing channels confuse buyers and cause lost leads. Discover how unified omnichannel workflows deliver personalized messages at the exact right moment.',
                'tags' => ['marketing-automation', 'crm-automation', 'omnichannel-inbox', 'whatsapp-api'],
                'content' => <<<'HTML'
<h2>Breaking Down Channel Silos in Modern Customer Journeys</h2>
<p>Customers don't think in terms of channels; they think in terms of conversations. A prospect might discover your brand through an Instagram Ad, send a direct message on WhatsApp for pricing, and later check their email for an official quote.</p>

<p>When customer data is scattered across separate apps, sales reps lack context, resulting in fragmented communication and dropped deals. An omnichannel platform unifies customer history, tags, and previous orders into a single coherent contact profile.</p>

<h2>3 Rules for High-ROI Omnichannel Campaigns</h2>
<ol>
    <li><strong>Respect Channel Context:</strong> WhatsApp has an average open rate of 98% and is best suited for urgent updates, order confirmations, and high-intent chats. Email is ideal for comprehensive newsletters, invoices, and long-form education.</li>
    <li><strong>Segment by Behavioral Intent:</strong> Rather than blasting your entire list, filter contacts by specific tags, previous purchase value, or recent interaction history.</li>
    <li><strong>Automate Drip Sequences Across Touchpoints:</strong> If a customer fails to open an important update via email within 24 hours, trigger an automated gentle WhatsApp nudge with a personalized link.</li>
</ol>

<h2>Conclusion</h2>
<p>Unifying your communications in BotifyAI creates a seamless experience that builds brand loyalty and dramatically increases customer lifetime value (LTV).</p>
HTML
            ],
            [
                'title' => 'How to Launch and Scale a High-Converting Multi-Vendor Affiliate Network',
                'slug' => 'how-to-launch-and-scale-multi-vendor-affiliate-network',
                'category_slug' => 'affiliate-growth-monetization',
                'author_id' => $author->id,
                'is_featured' => false,
                'focus_keyword' => 'multi-vendor affiliate network growth',
                'secondary_keywords' => ['affiliate program setup', 'commission tracking', 'creator monetization', 'performance marketing'],
                'meta_title' => 'How to Launch a Multi-Vendor Affiliate Network That Scales',
                'meta_description' => 'Learn the blueprint for launching a high-converting affiliate network. Manage merchant catalogs, automate commission tracking, and motivate top affiliates.',
                'reading_time_minutes' => 6,
                'excerpt' => 'Affiliate marketing accounts for over 15% of all digital media revenue. Here is how to structure commission tiers, prevent fraud, and build a thriving multi-vendor marketplace.',
                'tags' => ['affiliate-marketing', 'digital-products', 'saas-growth'],
                'content' => <<<'HTML'
<h2>The Power of Performance-Based Marketing</h2>
<p>Traditional pay-per-click advertising costs continue to rise year over year. In contrast, affiliate marketing offers pure ROI: you only pay when an actual sale or verified lead is delivered.</p>

<p>By transforming your platform into a multi-vendor affiliate hub, you empower product creators to tap into an army of motivated creators, bloggers, and media buyers who promote their products for a performance commission.</p>

<h2>Key Components of a Thriving Affiliate Platform</h2>
<ul>
    <li><strong>Transparent Commission Structures:</strong> Clear percentage or flat-fee earnings displayed prominently on every catalog listing.</li>
    <li><strong>Robust 30-Day Cookie Tracking:</strong> Ensure affiliates receive reliable attribution even if the customer returns days later to complete their purchase.</li>
    <li><strong>Real-Time Analytics Dashboard:</strong> Provide affiliates with immediate visibility into clicks, conversion rates, pending earnings, and historical payouts.</li>
    <li><strong>Automated Payout Safeguards:</strong> Incorporate refund buffer windows before final commission disbursement to eliminate chargeback risks.</li>
</ul>

<h2>Recruiting and Retaining Top Performing Affiliates</h2>
<p>Provide your promotional partners with high-quality creatives, swipe copy, banner graphics, and dedicated product tutorials in your Academy hub to make selling effortless.</p>
HTML
            ],
        ];

        foreach ($articles as $artData) {
            $catSlug = $artData['category_slug'];
            $category = $categories[$catSlug] ?? null;
            $tagSlugs = $artData['tags'] ?? [];

            unset($artData['category_slug'], $artData['tags']);

            $post = BlogPost::updateOrCreate(
                ['slug' => $artData['slug']],
                array_merge($artData, [
                    'category_id' => $category?->id,
                    'status' => 'published',
                    'published_at' => now()->subDays(rand(1, 10)),
                ])
            );

            // Sync tags
            $tagIds = [];
            foreach ($tagSlugs as $tSlug) {
                if (isset($tags[$tSlug])) {
                    $tagIds[] = $tags[$tSlug]->id;
                }
            }
            if (! empty($tagIds)) {
                $post->tags()->sync($tagIds);
            }
        }
    }
}

