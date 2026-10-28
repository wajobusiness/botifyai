<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('blog_posts')) {
            return;
        }

        $slug = 'how-to-sell-notion-templates-digital-planners-blueprint';
        $now = now();

        $toc = json_encode([
            ['id' => 'snippet-answer', 'title' => 'Direct Answer: Why Templates Have the Best Unit Economics'],
            ['id' => 'unit-economics', 'title' => '1. The Unbeatable Math of Digital Templates'],
            ['id' => 'categories-that-sell', 'title' => '2. 7 Template Categories That Consistently Sell'],
            ['id' => 'creation-playbook', 'title' => '3. The 6-Step Template Creation Playbook'],
            ['id' => 'where-to-sell', 'title' => '4. Where to Sell: Direct Sales vs. Marketplaces'],
            ['id' => 'marketing-playbook', 'title' => '5. The Marketing Engine That Drives Consistent Sales'],
            ['id' => 'path-to-10k', 'title' => '6. The Realistic Roadmap to $10,000/Month'],
            ['id' => 'automation-advantage', 'title' => '7. Automating Template Sales on WhatsApp & Instagram with BotifyAI'],
            ['id' => 'faqs', 'title' => '8. Frequently Asked Questions'],
            ['id' => 'key-takeaways', 'title' => '9. Summary & Key Takeaways'],
        ]);

        $secondaryKeywords = json_encode([
            'how to sell notion templates',
            'digital planners business',
            'make money selling templates',
            'notion template marketplace',
            'sell digital products online',
            'passive income notion templates',
        ]);

        $htmlContent = <<<'HTML'
<div id="snippet-answer" class="p-5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 my-6">
<p class="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-1">Direct Answer: Why Sell Notion Templates & Digital Planners?</p>
<p class="text-base text-neutral-800 dark:text-neutral-200 leading-relaxed">
<strong>Templates are the highest-margin digital product in the modern creator economy.</strong> They save the buyer dozens of hours of manual labor, carry zero marginal cost per sale, and can be sold thousands of times with 95%+ profit margins. A well-designed Notion template or digital planner that took 30 hours to build and sells for $49 can easily generate $10,000+ in its first year if paired with targeted content and automated conversational distribution.
</p>
</div>

<p class="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
A Notion template that took 20 to 40 hours to create and sells for $49 can generate $10,000+ in its first year once it gains traction. This is the complete playbook for selling templates online—from identifying real market demand and designing high-converting assets, to setting up multi-channel distribution and reaching $10,000/month in sustainable revenue.
</p>

<h2 id="unit-economics">1. The Unbeatable Math of Digital Templates</h2>
<p>Unlike physical goods, freelance services, or client work, templates enjoy arguably the most attractive unit economics in modern commerce:</p>

<div class="overflow-x-auto my-6">
<table class="w-full text-left border-collapse border border-neutral-300 dark:border-neutral-700 text-sm">
<thead>
<tr class="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Economic Factor</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Reality for Template Sellers</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Why It Wins</th>
</tr>
</thead>
<tbody>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">Creation Cost</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">One-time investment of 20 &ndash; 80 hours</td>
<td class="p-3 text-emerald-600 font-medium">Build once, sell indefinitely without ongoing inventory costs.</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Marginal Cost per Sale</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">$0.00 (Standard payment processing only)</td>
<td class="p-3 text-emerald-600 font-medium">Selling 1 copy or 1,000 copies costs virtually the same.</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">Perceived Buyer Value</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Saves buyer 10 &ndash; 40 hours of tedious setup</td>
<td class="p-3 text-emerald-600 font-medium">Worth $500 &ndash; $2,000 in professional billable hourly rates.</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Price Sweet Spot</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">$29 &ndash; $199</td>
<td class="p-3 text-emerald-600 font-medium">Below $29 feels cheap; above $199 requires heavier justification.</td>
</tr>
</tbody>
</table>
</div>

<p><strong>The Compounding Math:</strong> A $49 template that took 40 hours to build and sells just 200 copies in its first year produces <strong>$9,800 in revenue at 95%+ net margin</strong>. The economics improve dramatically with each subsequent product because existing customers eagerly buy your new templates over time.</p>

<h2 id="categories-that-sell">2. 7 Template Categories That Consistently Sell</h2>
<p>If you want consistent buyers, build in proven categories with existing commercial intent:</p>

<div class="space-y-4 my-6">
<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">1. Notion Templates & Life Operating Systems</h3>
<p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">The largest and most viral template market. Notion users actively search for ready-to-use systems. Top categories: freelance client portals, content creation hubs, second-brain knowledge management, personal habit/fitness trackers, and investment portfolio trackers. <strong>Typical Pricing:</strong> $19 &ndash; $99 for individual templates; $99 &ndash; $199 for master OS bundles.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">2. Web & UI Templates (Figma, Framer, Webflow)</h3>
<p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Landing page templates, agency portfolios, SaaS dashboard kits, and mobile UI kits. Buyers: design agencies, solo founders, and indie hackers looking to launch MVPs quickly. <strong>Typical Pricing:</strong> $49 &ndash; $299 for single templates; $299 &ndash; $999 for full design systems.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">3. Email & Copywriting Swipe Files</h3>
<p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Cold outbound email sequences, welcome drips, SaaS onboarding flows, and abandoned cart email templates. Buyers: B2B sales reps, e-commerce brands, and agency owners. <strong>Typical Pricing:</strong> $29 &ndash; $99 for packs; $99 &ndash; $299 for comprehensive email libraries.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">4. Professional Document & Contract Templates</h3>
<p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Freelance service agreements, client proposal decks, NDA templates, resume & CV builders, and pitch deck templates. Buyers: job seekers, consultants, and agencies. <strong>Typical Pricing:</strong> $19 &ndash; $99 each.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">5. Financial & Spreadsheet Models (Excel, Google Sheets)</h3>
<p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">SaaS financial forecasting models, cash flow forecasting sheets, real estate ROI calculators, and e-commerce inventory trackers. Buyers: startup founders and small business owners. <strong>Typical Pricing:</strong> $29 &ndash; $99 for simple models; $99 &ndash; $499 for complex financial models.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">6. Code Boilerplates & Starter Kits</h3>
<p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Next.js/Laravel SaaS boilerplates, React Native mobile starter kits, and Tailwind component kits. Buyers: software developers and technical founders. <strong>Typical Pricing:</strong> $49 &ndash; $299 for basic kits; $299 &ndash; $899 for enterprise packages.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">7. Design Kits & Social Media Templates</h3>
<p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Canva Instagram carousel packs, Pinterest pins, YouTube thumbnail templates, and slide decks. Buyers: content creators, social media managers, and local businesses. <strong>Typical Pricing:</strong> $19 &ndash; $99 per pack.</p>
</div>
</div>

<h2 id="creation-playbook">3. The 6-Step Template Creation Playbook</h2>
<p>Follow this disciplined process to build a template that sells from day one:</p>

<ol class="space-y-4 my-6 list-decimal pl-6 text-neutral-700 dark:text-neutral-300">
<li>
<strong>Identify Real Demand:</strong>
<p class="text-sm mt-1">Don't guess. Look at common questions in your niche, repetitive tasks people complain about on Reddit or Twitter, and manual workflows companies outsource. The best-selling templates almost always start with: <em>"I built this system for myself to solve my own problem, and colleagues kept begging for the link."</em></p>
</li>
<li>
<strong>Build for a Specific Niche (Not the Whole World):</strong>
<p class="text-sm mt-1">A generic <em>"Life Planner"</em> gets lost in the noise. A <em>"Notion Client Hub & Invoicing OS for Freelance Web Designers"</em> commands instant attention and higher prices because it solves specific, urgent headaches.</p>
</li>
<li>
<strong>Make It Immediately Usable Out of the Box:</strong>
<p class="text-sm mt-1">The first 5 minutes after purchase determine whether you get a 5-star review or a refund request. Pre-populate your template with realistic sample data so the buyer understands how it works immediately. Include a 1-page quickstart guide and a short Loom walkthrough video.</p>
</li>
<li>
<strong>Polish the Visual Design & Typography:</strong>
<p class="text-sm mt-1">Templates are design-driven products. A template with great logic but messy formatting will struggle to sell. A clean, aesthetically polished template with modern typography and custom cover icons sells 3x to 5x better.</p>
</li>
<li>
<strong>Test with 3–5 Beta Users:</strong>
<p class="text-sm mt-1">Give free early access to 3 to 5 people in your target audience in exchange for candid feedback. Observe where they get confused, what fields they ignore, and what questions they ask. Polish these friction points before your public launch.</p>
</li>
<li>
<strong>Craft a Frictionless Sales Page:</strong>
<p class="text-sm mt-1">Show high-resolution screenshots and video GIFs of the template in action. Detail exactly what components are included, state who the template is for (and who it is NOT for), and offer a clear satisfaction guarantee to eliminate buying hesitation.</p>
</li>
</ol>

<h2 id="where-to-sell">4. Where to Sell: Direct Sales vs. Marketplaces</h2>
<p>Successful template creators rarely rely on a single channel. They use a smart hybrid strategy:</p>

<div class="overflow-x-auto my-6">
<table class="w-full text-left border-collapse border border-neutral-300 dark:border-neutral-700 text-sm">
<thead>
<tr class="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Platform / Channel</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Platform Fee</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Core Benefit</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Best Used For</th>
</tr>
</thead>
<tbody>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">Direct Storefront (BotifyAI / Selar)</td>
<td class="p-3 text-emerald-600 font-medium">Payment gateway only (~3&ndash;5%)</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Keep 95%+ of revenue, own customer data, automate WhatsApp/IG checkouts</td>
<td class="p-3 text-emerald-600 font-bold">Your primary high-margin sales engine</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Gumroad</td>
<td class="p-3 text-red-600 font-medium">10% + processing fee</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Simple setup, global checkout, built-in audience discovery</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Secondary marketplace channel</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">Notion Template Gallery</td>
<td class="p-3 text-emerald-600 font-medium">0% (Free to list)</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">High brand trust and official Notion user traffic</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Discovery channel linking to your direct checkout</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Etsy</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Listing fee + 6.5% transaction</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Huge built-in consumer search volume for planners and templates</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Digital planners, Canva kits, budgeting sheets</td>
</tr>
</tbody>
</table>
</div>

<h2 id="marketing-playbook">5. The Marketing Engine That Drives Consistent Sales</h2>
<p>Building a great template is only 30% of the battle; the remaining 70% is consistent distribution. Here is how top sellers maintain daily sales momentum:</p>

<ul class="list-disc pl-6 space-y-3 text-neutral-700 dark:text-neutral-300 my-4">
<li><strong>Problem-First Content Marketing:</strong> Film short screen recordings demonstrating how your template solves a painful problem in 60 seconds (e.g., <em>"How I manage 8 freelance clients without dropping a ball using this Notion dashboard"</em>). Post across TikTok, Instagram Reels, and YouTube Shorts.</li>
<li><strong>Affiliate Partnerships:</strong> Recruit creators, bloggers, and YouTubers in your niche with a generous 20% to 35% commission. The top 10 affiliates often generate 30% to 50% of your total monthly sales.</li>
<li><strong>Lead Magnet "Lite" Versions:</strong> Release a free stripped-down version of your template on your socials. Capture buyer emails and WhatsApp numbers, then deliver an automated follow-up introducing the $49 "Pro" system.</li>
<li><strong>Smart Bundling:</strong> Group complementary templates together at a bundled discount (e.g., 3 separate $39 templates bundled for $79). Bundling instantly lifts your average order value (AOV) by 40% to 65%.</li>
</ul>

<h2 id="path-to-10k">6. The Realistic Roadmap to $10,000/Month</h2>
<p>Reaching $10K/month does not happen overnight with one template; it is achieved through catalog expansion, bundling, and automated customer acquisition:</p>

<div class="overflow-x-auto my-6">
<table class="w-full text-left border-collapse border border-neutral-300 dark:border-neutral-700 text-sm">
<thead>
<tr class="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Phase</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Core Focus</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Typical Monthly Revenue</th>
</tr>
</thead>
<tbody>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">Months 1 &ndash; 3</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Launch Template #1. Validate product-market fit and gather first 50 customer reviews.</td>
<td class="p-3 text-emerald-600 font-medium">$500 &ndash; $2,000 / month</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Months 4 &ndash; 6</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Launch Templates #2 and #3 in the same category. Cross-sell to your existing customer base.</td>
<td class="p-3 text-emerald-600 font-medium">$2,000 &ndash; $4,500 / month</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">Months 7 &ndash; 12</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Introduce bundles, launch an affiliate program, and optimize marketplace listings.</td>
<td class="p-3 text-emerald-600 font-medium">$4,500 &ndash; $8,000 / month</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Months 12 &ndash; 24</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Full catalog of 8 &ndash; 12 templates, recurring affiliate traffic, and automated in-chat checkouts.</td>
<td class="p-3 text-emerald-600 font-bold">$10,000 &ndash; $15,000+ / month</td>
</tr>
</tbody>
</table>
</div>

<h2 id="automation-advantage">7. Automating Template Sales on WhatsApp & Instagram with BotifyAI</h2>
<p>The biggest obstacle to scaling a template business is losing potential buyers between social media viewing and checkout. When you tell followers to click the link in your bio, up to 70% drop off before ever viewing your product.</p>

<p><strong><a href="/" class="text-brand-600 dark:text-brand-400 font-semibold underline">BotifyAI</a></strong> solves this with autonomous conversational commerce:</p>

<ul class="list-disc pl-6 space-y-3 text-neutral-700 dark:text-neutral-300 my-4">
<li><strong>Instant Comment-to-DM Sales:</strong> Post a screen walkthrough of your Notion template and tell viewers: <em>"Comment NOTION to get the template."</em> BotifyAI's AI chatbot automatically DMs the viewer within 3 seconds with the checkout link and answers any questions.</li>
<li><strong>24/7 WhatsApp Storefront:</strong> Allow buyers to browse templates, view preview screenshots, and complete payments via Paystack, Stripe, or local mobile money directly on WhatsApp.</li>
<li><strong>Instant Automated Access:</strong> As soon as payment is confirmed, BotifyAI immediately sends the Notion duplicate link or planner download file without requiring manual intervention from you.</li>
</ul>

<div class="my-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white space-y-3 shadow-lg">
<h3 class="text-lg font-bold">Ready to Launch Your $10K/Month Template Business?</h3>
<p class="text-sm text-emerald-100 leading-relaxed">
Don't let manual sales and complicated funnels slow down your growth. Set up your digital storefront on BotifyAI, automate your social DMs, and start selling your templates around the clock.
</p>
<div class="pt-2">
<a href="/pricing" class="inline-block px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-sm hover:bg-neutral-100 shadow transition">
Get Started with BotifyAI Free &rarr;
</a>
</div>
</div>

<h2 id="faqs">8. Frequently Asked Questions</h2>
<div class="space-y-4 my-6">
<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">What is the realistic revenue from a single template?</h3>
<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Most creators earn between $500 and $5,000 from a single template in its first year. Highly optimized templates with strong search or social traction frequently surpass $20,000+. Building a catalog of 3 to 5 templates is the secret to dependable five-figure annual revenue.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">Should I offer a free version of my template?</h3>
<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Yes! A free "Lite" version serves as a high-converting lead magnet. It allows buyers to evaluate your design quality and organization logic with zero financial risk while building your email and WhatsApp subscriber list for future paid product drops.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">How do I prevent buyers from illegally sharing or reselling my template?</h3>
<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Include clear terms of use inside the template and deliver unique duplicate links through protected digital downloads. Remember that 98% of buyers purchase for the direct convenience, updates, and documentation. Focus your energy on delivering overwhelming value rather than worrying about piracy.</p>
</div>
</div>

<h2 id="key-takeaways">9. Summary & Key Takeaways</h2>
<ul class="list-disc pl-6 space-y-2 text-neutral-700 dark:text-neutral-300 my-4">
<li><strong>Highest Margins in Digital Products:</strong> Templates require one-time creation, carry $0 marginal cost per sale, and provide 95%+ profit margins.</li>
<li><strong>Focus on Niche Utility:</strong> Build for a specific audience (e.g., freelance designers, real estate agents) rather than generic planners.</li>
<li><strong>Hybrid Channel Strategy:</strong> Run your own direct storefront with BotifyAI for maximum profit margins while leveraging Notion galleries and Gumroad for secondary discovery.</li>
<li><strong>Conversational Automation:</strong> Turn social media comments and WhatsApp chats into automated checkout funnels to capture impulse buyers before intent cools off.</li>
</ul>
HTML;

        $post = DB::table('blog_posts')->where('slug', $slug)->first();

        $postData = [
            'title' => 'How to Sell Notion Templates & Digital Planners: From Idea to $10,000/Month',
            'excerpt' => 'Templates are the highest-margin digital product because they save the buyer time and can be sold thousands of times with zero marginal cost. Discover the complete playbook from creation to $10K/month.',
            'content' => $htmlContent,
            'featured_image' => '/images/blog/how-to-sell-notion-templates-digital-planners-blueprint.jpg',
            'featured_image_alt' => 'How to Sell Notion Templates & Digital Planners: From Idea to $10,000/Month - BotifyAI Blueprint',
            'status' => 'published',
            'reading_time_minutes' => 12,
            'is_featured' => true,
            'meta_title' => 'How to Sell Notion Templates & Digital Planners ($10k/mo Playbook)',
            'meta_description' => 'Templates are the highest-margin digital product. Discover the complete playbook to build, price, launch, and scale Notion templates and digital planners to $10K/month.',
            'focus_keyword' => 'sell Notion templates digital planners blueprint',
            'secondary_keywords' => $secondaryKeywords,
            'canonical_url' => url('/blog/'.$slug),
            'og_image' => '/images/blog/how-to-sell-notion-templates-digital-planners-blueprint.jpg',
            'table_of_contents' => $toc,
            'updated_at' => $now,
        ];

        if ($post) {
            DB::table('blog_posts')->where('id', $post->id)->update($postData);
        } else {
            // If post does not exist yet, find category and author
            $author = DB::table('blog_authors')->where('slug', 'botifyai-editorial-team')->first() ?: DB::table('blog_authors')->first();
            $category = DB::table('blog_categories')->where('slug', 'digital-commerce-sales')->first() ?: DB::table('blog_categories')->first();

            $postData['slug'] = $slug;
            $postData['author_id'] = $author?->id;
            $postData['category_id'] = $category?->id;
            $postData['published_at'] = $now;
            $postData['created_at'] = $now;
            $postData['views_count'] = 0;

            DB::table('blog_posts')->insert($postData);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down action needed for post update
    }
};
