<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

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

        // 1. Resolve author
        $author = DB::table('blog_authors')->where('slug', 'botifyai-editorial-team')->first();
        if (! $author) {
            $author = DB::table('blog_authors')->first();
        }

        // 2. Resolve category
        $category = DB::table('blog_categories')->where('slug', 'digital-commerce-sales')->first();
        if (! $category) {
            $category = DB::table('blog_categories')->first();
        }

        $now = now();
        $slug = '10-ways-nigerian-content-creators-make-money';

        $toc = json_encode([
            ['id' => 'snippet-answer', 'title' => 'Direct Answer: How Nigerian Creators Monetize'],
            ['id' => 'intro', 'title' => 'The Nigerian Creator Reality: Views vs. Monetization'],
            ['id' => 'brand-deals', 'title' => '1. Brand Collaborations & Influencer Sponsorships'],
            ['id' => 'digital-products', 'title' => '2. Selling Digital Products (E-books, Courses & Templates)'],
            ['id' => 'video-ads', 'title' => '3. Video Platform Monetization (YouTube & Facebook Ads)'],
            ['id' => 'paid-communities', 'title' => '4. Paid Subscriptions & VIP Communities'],
            ['id' => 'consultations', 'title' => '5. 1-on-1 Consultations & Coaching Sessions'],
            ['id' => 'affiliate-marketing', 'title' => '6. Affiliate Marketing & Tool Recommendations'],
            ['id' => 'branded-merch', 'title' => '7. Branded Physical Merchandise (Merch)'],
            ['id' => 'freelance-services', 'title' => '8. High-Income Freelance Services & UGC Creation'],
            ['id' => 'virtual-workshops', 'title' => '9. Virtual Workshops, Bootcamps & Masterclasses'],
            ['id' => 'fan-support', 'title' => '10. Direct Fan Support, Tipping & Live Gifts'],
            ['id' => 'creator-matrix', 'title' => 'Monetization Comparison Matrix for Nigerian Creators'],
            ['id' => 'automation-advantage', 'title' => 'The Secret Weapon: Automating Your Creator Business with AI'],
            ['id' => 'faqs', 'title' => 'Frequently Asked Questions'],
        ]);

        $secondaryKeywords = json_encode([
            'content creator monetization Nigeria',
            'sell digital products Nigeria',
            'creator economy Africa',
            'make money online Nigeria',
            'Instagram automation for creators',
            'WhatsApp sales automation Nigeria',
        ]);

        $htmlContent = <<<'HTML'
<div id="snippet-answer" class="p-5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 my-6">
<p class="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-1">Direct Answer: How Do Nigerian Content Creators Make Money?</p>
<p class="text-base text-neutral-800 dark:text-neutral-200 leading-relaxed">
Nigerian content creators monetize their audience through 10 primary avenues: <strong>brand sponsorships</strong>, <strong>selling digital products</strong> (e-books, video courses, templates via platforms like Selar and BotifyAI), <strong>platform ad revenue</strong> (YouTube Partner Program, Facebook In-Stream Ads), <strong>paid VIP communities</strong>, <strong>1-on-1 consultations</strong>, <strong>affiliate marketing commissions</strong>, <strong>branded physical merchandise</strong>, <strong>freelance/UGC services</strong>, <strong>virtual live masterclasses</strong>, and <strong>direct fan tipping/live gifts</strong>. Top-earning creators automate their lead capture and checkout flows using conversational AI chatbots on WhatsApp and Instagram to convert comments and DMs into revenue around the clock.
</p>
</div>

<h2 id="intro">The Nigerian Creator Reality: Views vs. Monetization</h2>
<p>Over the past few years, the Nigerian creator economy has exploded from a hobbyist playground into a multi-billion Naira creative powerhouse. From skit makers and culinary vloggers to tech reviewers, fashion curators, educators, and lifestyle streamers, Nigerian storytellers command massive cultural attention across West Africa and the global diaspora.</p>

<p>Yet, an uncomfortable truth remains: <strong>viral views and follower counts do not pay fuel, electricity, or internet subscription bills.</strong> Relying entirely on unpredictable social media algorithms is dangerous. The creators building sustainable, seven-figure businesses are those who treat their content as the top of an automated business funnel rather than the end product.</p>

<p>Whether you have 3,000 engaged followers or 300,000 fans, here are the 10 proven ways Nigerian content creators make money today—and how you can scale each revenue stream.</p>

<h2 id="brand-deals">1. Brand Collaborations & Influencer Sponsorships</h2>
<p>Brand deals remain the most recognized and immediate revenue channel for creators in Nigeria. Corporate brands in telecommunications, fintech, banking, fast-moving consumer goods (FMCG), beauty, and fashion actively look for creators with authentic audience trust.</p>

<div class="my-4 space-y-3">
<p><strong>Common Sponsorship Formats:</strong></p>
<ul class="list-disc pl-6 space-y-2 text-neutral-700 dark:text-neutral-300">
<li><strong>Native Skit Integrations:</strong> Naturally weaving a banking app or beverage into a comedic storyline or relatable daily struggle.</li>
<li><strong>Product Reviews & Unboxings:</strong> Providing in-depth hands-on testing of smartphones, gadgets, beauty routines, or kitchen tools.</li>
<li><strong>Brand Ambassadorships:</strong> Structured 6 to 12-month retainers where a creator serves as the recurring public face of a brand across social campaigns and offline activations.</li>
</ul>
</div>

<div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 my-4 text-sm">
<strong>Micro-Creator Opportunity:</strong> You do not need 100,000 followers to secure brand deals. Brands increasingly prefer micro-influencers (5,000 to 25,000 followers) in specialized niches like culinary arts, personal finance, coding, and parenting because their conversion rates and community trust often surpass celebrity endorsements.
</div>

<h2 id="digital-products">2. Selling Digital Products (E-books, Courses & Templates)</h2>
<p>If you want high-margin income that is not tied to your physical hours, digital products are the gold standard. Once created, a digital asset can be replicated and sold thousands of times with zero manufacturing cost and zero shipping hassle.</p>

<div class="overflow-x-auto my-6">
<table class="w-full text-left border-collapse border border-neutral-300 dark:border-neutral-700 text-sm">
<thead>
<tr class="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Creator Niche</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Digital Product Idea</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Typical Price Range (NGN)</th>
</tr>
</thead>
<tbody>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">Food & Cooking</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Nigerian Meal Prep E-book, Low-Carb Recipe PDF, Commercial Baking Manual</td>
<td class="p-3 text-emerald-600 font-medium">&#8358;3,500 &ndash; &#8358;15,000</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Video & Photography</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">CapCut Video Editing Presets, Smartphone Videography Masterclass, LUTs</td>
<td class="p-3 text-emerald-600 font-medium">&#8358;5,000 &ndash; &#8358;30,000</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">Tech & Freelancing</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Upwork Proposal Templates, UI/UX Design Kits, Remote Job Guides</td>
<td class="p-3 text-emerald-600 font-medium">&#8358;10,000 &ndash; &#8358;50,000</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Business & Finance</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Personal Budgeting Spreadsheet, Small Business Tax Guide, Investment Checklist</td>
<td class="p-3 text-emerald-600 font-medium">&#8358;5,000 &ndash; &#8358;25,000</td>
</tr>
</tbody>
</table>
</div>

<p>Platforms like Selar and <a href="/digital-products" class="text-brand-600 dark:text-brand-400 font-medium underline">BotifyAI Digital Commerce</a> enable Nigerian creators to accept payments through local debit cards, bank transfers, USSD, and foreign cards in USD, GBP, and African mobile money currencies.</p>

<h2 id="video-ads">3. Video Platform Monetization (YouTube & Facebook Ads)</h2>
<p>Direct platform revenue sharing allows creators to earn passive income from the views their long-form video content generates:</p>

<ul class="list-disc pl-6 space-y-2 text-neutral-700 dark:text-neutral-300 my-4">
<li><strong>YouTube Partner Program (YPP):</strong> Requires 1,000 subscribers and 4,000 valid public watch hours within 12 months (or 10 million Shorts views in 90 days). Earnings are paid via Google AdSense into a domiciliary USD account or local bank account.</li>
<li><strong>Facebook In-Stream Ads:</strong> Meta has rolled out monetization tools to Nigerian creators, enabling eligible pages to monetize videos with ad breaks, performance bonuses, and reel incentives.</li>
</ul>

<p><strong>Geographic CPM Strategy:</strong> Traffic from Nigeria typically generates a lower CPM ($0.50 &ndash; $2.50 per 1,000 views) compared to traffic from the US, UK, or Canada ($8.00 &ndash; $25.00+). Many Nigerian creators deliberately optimize their video titles, thumbnails, and topics to reach both local viewers and the vast African diaspora worldwide to maximize earnings.</p>

<h2 id="paid-communities">4. Paid Subscriptions & VIP Communities</h2>
<p>Instead of hoping social media algorithms show your content to all your followers, you can build a recurring revenue stream with gated communities.</p>

<ul class="list-disc pl-6 space-y-2 text-neutral-700 dark:text-neutral-300 my-4">
<li><strong>Instagram Close Friends:</strong> Charging a monthly subscription (e.g., &#8358;3,000 &ndash; &#8358;10,000/month) for exclusive daily vlogs, unedited business breakdowns, or fitness routines.</li>
<li><strong>VIP Telegram & WhatsApp Groups:</strong> Providing weekly market analysis for forex/crypto traders, study groups, or mentorship hubs.</li>
<li><strong>Paid Newsletters & Podcasting:</strong> Charging subscribers for premium written essays, industry trend reports, or subscriber-only audio episodes.</li>
</ul>

<p>If you retain just 150 dedicated community members paying &#8358;5,000 each month, you generate a dependable &#8358;750,000 in monthly recurring revenue (MRR) regardless of platform algorithm shifts.</p>

<h2 id="consultations">5. 1-on-1 Consultations & Coaching Sessions</h2>
<p>When you consistently create authoritative content in any field, your followers will inevitably reach out asking for personalized advice. Offering paid one-on-one sessions transforms casual inquiry messages into high-ticket revenue.</p>

<div class="my-4 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-sm">
<h4 class="font-bold text-neutral-900 dark:text-white mb-2">Popular Consultation Niches in Nigeria:</h4>
<ul class="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
<li>Social media profile audits and content strategy calls (&#8358;25,000 &ndash; &#8358;75,000 per hour)</li>
<li>Tech career transitions, international CV reviews, and mock interviews (&#8358;30,000 &ndash; &#8358;100,000 per session)</li>
<li>Small business bookkeeping and legal registration advisory (&#8358;40,000 &ndash; &#8358;150,000 per session)</li>
<li>Diet, fitness, and lifestyle meal planning assessments (&#8358;20,000 &ndash; &#8358;50,000 per session)</li>
</ul>
</div>

<h2 id="affiliate-marketing">6. Affiliate Marketing & Tool Recommendations</h2>
<p>Affiliate marketing allows you to monetize product recommendations without having to create, manufacture, or support the product yourself. You earn a pre-agreed commission every time a follower clicks your unique tracking link and completes an order.</p>

<div class="space-y-3 my-4">
<p><strong>Top Affiliate Opportunities for Nigerian Creators:</strong></p>
<ul class="list-disc pl-6 space-y-2 text-neutral-700 dark:text-neutral-300">
<li><strong>Software & SaaS Tools:</strong> Video editing tools, AI writing tools, domain registrars, and web hosting platforms offering recurring 20% to 40% monthly commissions.</li>
<li><strong>Fintech & Banking Apps:</strong> Referral bonuses for onboarding new users onto dollar virtual cards, savings apps, or investment platforms.</li>
<li><strong>Hardware & Studio Equipment:</strong> Recommending cameras, ring lights, microphones, and smartphones via Amazon or Jumia affiliate programs.</li>
<li><strong>Digital Courses:</strong> Promoting digital products created by other educators on platforms like Selar for a 30% to 50% commission split.</li>
</ul>
</div>

<h2 id="branded-merch">7. Branded Physical Merchandise (Merch)</h2>
<p>When a creator builds a distinctive voice, their signature catchphrases and branding become badges of belonging for fans. Top skit makers, podcasters, and lifestyle vloggers regularly launch limited-run merchandise collections:</p>

<ul class="list-disc pl-6 space-y-2 text-neutral-700 dark:text-neutral-300 my-4">
<li>Streetwear collections: Graphic tees, hoodies, trackpants, and embroidered caps.</li>
<li>Kitchen & Culinary items: Branded aprons, chef hats, recipe binders, and custom mugs.</li>
<li>Stationery: Goal-setting planners, affirmation notebooks, and branded desk pads.</li>
</ul>

<p>With print-on-demand fulfillment centers now operating across Lagos and Abuja, creators can launch pre-order campaigns without having to risk upfront capital on unsold stock.</p>

<h2 id="freelance-services">8. High-Income Freelance Services & UGC Creation</h2>
<p>Your social media channel is the most convincing portfolio you will ever own. Many creators leverage their organic reach to win high-paying freelance contracts and enterprise corporate retainers:</p>

<ul class="list-disc pl-6 space-y-2 text-neutral-700 dark:text-neutral-300 my-4">
<li><strong>User-Generated Content (UGC):</strong> Filming casual, authentic TikTok/Reel style video reviews for brands to run inside paid Meta/TikTok advertising campaigns (creators are paid &#8358;50,000 &ndash; &#8358;250,000 per short video without posting it to their personal feeds).</li>
<li><strong>Video Editing & Post-Production:</strong> Offering short-form viral editing for business owners and podcasters.</li>
<li><strong>Social Media Management & Ghostwriting:</strong> Managing LinkedIn accounts and Twitter/X channels for startup founders and corporate executives.</li>
</ul>

<h2 id="virtual-workshops">9. Virtual Workshops, Bootcamps & Masterclasses</h2>
<p>While pre-recorded courses offer passive income, live cohort learning creates urgency and commands significantly higher ticket prices. Viewers are eager to pay for live interaction, real-time feedback, and group accountability.</p>

<p>A creator who organizes a 3-day weekend Zoom bootcamp on <em>"Smartphone Content Creation & CapCut Mastery"</em> charging &#8358;15,000 per seat with 60 registered participants generates &#8358;900,000 in a single weekend.</p>

<h2 id="fan-support">10. Direct Fan Support, Tipping & Live Gifts</h2>
<p>Never underestimate the desire of super-fans to support creators whose content enriches their daily lives:</p>

<ul class="list-disc pl-6 space-y-2 text-neutral-700 dark:text-neutral-300 my-4">
<li><strong>TikTok LIVE Gifting:</strong> Viewers send digital gifts during live broadcasts (cooking sessions, music sessions, interactive debates) which creators exchange for withdrawable cash.</li>
<li><strong>Buy Me a Coffee & Tipping Links:</strong> Inserting local and international tip links in video descriptions and social media bios.</li>
<li><strong>Community Crowdfunding:</strong> Rallying fans to fund high-budget productions like independent documentaries, web series, or community charity initiatives.</li>
</ul>

<h2 id="creator-matrix">Monetization Comparison Matrix for Nigerian Creators</h2>
<div class="overflow-x-auto my-6">
<table class="w-full text-left border-collapse border border-neutral-300 dark:border-neutral-700 text-sm">
<thead>
<tr class="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Monetization Stream</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Startup Effort</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Revenue Potential</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Payout Currency</th>
<th class="p-3 border border-neutral-300 dark:border-neutral-700 font-bold">Best For</th>
</tr>
</thead>
<tbody>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">Brand Collaborations</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Medium</td>
<td class="p-3 text-emerald-600 font-bold">Very High</td>
<td class="p-3 font-medium">NGN / USD</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Skit makers, reviewers, vloggers</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Digital Products</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Medium (One-time)</td>
<td class="p-3 text-emerald-600 font-bold">High (Passive)</td>
<td class="p-3 font-medium">NGN / USD / Multi</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Educators, chefs, niche specialists</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">YouTube & Facebook Ads</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">High (Consistent)</td>
<td class="p-3 text-emerald-600 font-bold">Medium to High</td>
<td class="p-3 font-medium">USD</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Long-form video producers, podcasters</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">Affiliate Marketing</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Low</td>
<td class="p-3 text-emerald-600 font-bold">Medium (Passive)</td>
<td class="p-3 font-medium">USD / NGN</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Tech reviewers, bloggers, educators</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700">
<td class="p-3 font-semibold">1-on-1 Consultations</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Low</td>
<td class="p-3 text-emerald-600 font-bold">High (Per Session)</td>
<td class="p-3 font-medium">NGN / USD</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Consultants, strategists, designers</td>
</tr>
<tr class="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850">
<td class="p-3 font-semibold">VIP Communities</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">High (Ongoing)</td>
<td class="p-3 text-emerald-600 font-bold">Recurring (MRR)</td>
<td class="p-3 font-medium">NGN / USD</td>
<td class="p-3 text-neutral-600 dark:text-neutral-400">Mentors, analysts, fitness trainers</td>
</tr>
</tbody>
</table>
</div>

<h2 id="automation-advantage">The Secret Weapon: Automating Your Creator Business with AI</h2>
<p>Every creator who begins monetizing their audience quickly runs into the same painful bottleneck: <strong>the manual DM grind</strong>.</p>

<p>When you publish a viral Reel or TikTok with a call-to-action like <em>"Comment RECIPE to get my meal guide"</em> or <em>"DM me to book a session"</em>, hundreds of comments and DMs flood your inbox simultaneously. Answering each message manually while pasting payment account details is physically exhausting, slow, and results in lost sales when followers lose interest waiting for a reply.</p>

<p>This is where conversational AI agents and automated sales bots provide a decisive competitive edge. Platforms like <strong><a href="/" class="text-brand-600 dark:text-brand-400 font-semibold underline">BotifyAI</a></strong> empower Nigerian creators to automate their entire monetization pipeline:</p>

<ul class="list-disc pl-6 space-y-3 text-neutral-700 dark:text-neutral-300 my-4">
<li><strong>Automated Comment-to-DM Delivery:</strong> When a follower comments a specific trigger word (e.g., <code>EBOOK</code>, <code>LINK</code>, or <code>RECIPE</code>) on your Instagram post or Reel, your AI bot instantly slides into their DM within 3 seconds, delivering the purchase link and answering questions.</li>
<li><strong>24/7 WhatsApp Storefront:</strong> Connect your digital product catalog, consultation calendar, or merch store directly to the official WhatsApp Business Cloud API. Prospects can browse, buy, and receive their download access automatically—even while you are asleep.</li>
<li><strong>Intelligent Lead Qualification:</strong> The AI chatbot answers common buyer objections (<em>"Do you accept bank transfer?", "How do I access the files?"</em>) and provides instant customer support without requiring you to hire a full-time assistant.</li>
</ul>

<div class="my-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white space-y-3 shadow-lg">
<h3 class="text-lg font-bold">Scale Your Creator Income on Autopilot</h3>
<p class="text-sm text-emerald-100 leading-relaxed">
Stop losing paying customers in unanswered DMs. Connect your Instagram and WhatsApp to BotifyAI in less than 15 minutes, automate your digital product checkouts, and watch your creative work convert into predictable revenue.
</p>
<div class="pt-2">
<a href="/pricing" class="inline-block px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-sm hover:bg-neutral-100 shadow transition">
Get Started with BotifyAI Free &rarr;
</a>
</div>
</div>

<h2 id="faqs">Frequently Asked Questions</h2>
<div class="space-y-4 my-6">
<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">How many followers do I need to start making money as a creator in Nigeria?</h3>
<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">You can start making money with as few as 1,000 to 3,000 targeted followers by selling digital products, hosting live masterclasses, or offering 1-on-1 consultations. Follower count matters far less than audience engagement and relevance.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">How do Nigerian creators receive payments from international fans?</h3>
<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Creators use multi-currency platforms like Selar, BotifyAI, Paystack, and Stripe-supported virtual dollar accounts to seamlessly accept payments in USD, GBP, EUR, and regional African currencies like GHS, KES, and ZAR.</p>
</div>

<div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
<h3 class="font-bold text-neutral-900 dark:text-white">Can I monetize content creation alongside a full-time 9-to-5 job?</h3>
<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Yes! Many of Nigeria's top creators started as side-hustlers. By packaging knowledge into digital products and setting up automated DM and WhatsApp checkout bots, your sales funnel runs passively while you focus on your day job.</p>
</div>
</div>
HTML;

        $post = DB::table('blog_posts')->where('slug', $slug)->first();

        $postData = [
            'category_id' => $category?->id,
            'author_id' => $author?->id,
            'title' => '10 Ways Nigerian Content Creators Make Money in 2026 (And How to Scale Your Revenue)',
            'slug' => $slug,
            'excerpt' => 'Likes and views do not pay bills. Discover the 10 proven ways Nigerian content creators monetize their audience in 2026—from digital products and sponsorships to automated WhatsApp and Instagram DM checkouts.',
            'content' => $htmlContent,
            'featured_image' => '/images/blog/10-ways-nigerian-content-creators-make-money.jpg',
            'featured_image_alt' => '10 Ways Nigerian Content Creators Make Money - BotifyAI Guide for Creators',
            'status' => 'published',
            'published_at' => $now,
            'reading_time_minutes' => 11,
            'is_featured' => true,
            'meta_title' => '10 Ways Nigerian Content Creators Make Money in 2026 | BotifyAI',
            'meta_description' => 'Discover the 10 proven ways Nigerian content creators make money through brand deals, digital products, YouTube, affiliate marketing, and automated conversational sales.',
            'focus_keyword' => 'how Nigerian content creators make money',
            'secondary_keywords' => $secondaryKeywords,
            'canonical_url' => url('/blog/'.$slug),
            'og_image' => '/images/blog/10-ways-nigerian-content-creators-make-money.jpg',
            'table_of_contents' => $toc,
            'updated_at' => $now,
        ];

        if ($post) {
            DB::table('blog_posts')->where('id', $post->id)->update($postData);
            $postId = $post->id;
        } else {
            $postData['created_at'] = $now;
            $postData['views_count'] = 0;
            $postId = DB::table('blog_posts')->insertGetId($postData);
        }

        // 3. Link tags if blog_tags & blog_post_tag exist
        if (Schema::hasTable('blog_tags') && Schema::hasTable('blog_post_tag')) {
            $tagSlugs = ['digital-products', 'marketing-automation', 'affiliate-marketing', 'ai-chatbot', 'whatsapp-api'];
            foreach ($tagSlugs as $tSlug) {
                $tag = DB::table('blog_tags')->where('slug', $tSlug)->first();
                if (! $tag) {
                    $tagId = DB::table('blog_tags')->insertGetId([
                        'name' => ucwords(str_replace('-', ' ', $tSlug)),
                        'slug' => $tSlug,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                } else {
                    $tagId = $tag->id;
                }

                $pivotExists = DB::table('blog_post_tag')
                    ->where('post_id', $postId)
                    ->where('tag_id', $tagId)
                    ->exists();

                if (! $pivotExists) {
                    DB::table('blog_post_tag')->insert([
                        'post_id' => $postId,
                        'tag_id' => $tagId,
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('blog_posts')) {
            DB::table('blog_posts')->where('slug', '10-ways-nigerian-content-creators-make-money')->delete();
        }
    }
};

