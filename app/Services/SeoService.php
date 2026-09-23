<?php

namespace App\Services;

use App\Http\Controllers\Admin\LandingPageController;
use App\Models\CmsPage;
use App\Models\Plan;
use App\Models\SystemSetting;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Support\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SeoService
{
    /**
     * Runtime override metadata for the current request cycle.
     */
    protected static ?array $customMetadata = null;

    /**
     * Manually set metadata for the current request (e.g. from a controller).
     */
    public static function set(array $meta): void
    {
        static::$customMetadata = $meta;
    }

    /**
     * Reset runtime metadata.
     */
    public static function reset(): void
    {
        static::$customMetadata = null;
    }

    /**
     * Resolve comprehensive SEO metadata and Schema.org JSON-LD for the current request.
     */
    public function resolveForRequest(?Request $request = null): array
    {
        $request = $request ?? request();

        if (static::$customMetadata !== null) {
            return $this->formatMetadata(static::$customMetadata, $request);
        }

        $path = trim($request->path(), '/');

        // 1. Admin & Internal App routes -> Strict noindex
        if ($request->is('admin*', 'app*', 'buyer*', 'billing*') || Str::startsWith($path, ['admin', 'app', 'buyer', 'billing', 'broadcasting'])) {
            return [
                'title' => $this->getAppName(),
                'description' => '',
                'keywords' => '',
                'canonical' => $this->sanitizeCanonicalUrl($request->fullUrl()),
                'robots' => 'noindex, nofollow',
                'og' => [],
                'twitter' => [],
                'json_ld' => [],
            ];
        }

        // 2. Product Checkout Page: /buy/{slug}
        if (Str::startsWith($path, 'buy/')) {
            $slug = Str::after($path, 'buy/');
            $slug = explode('/', $slug)[0];
            return $this->resolveProductSeo($slug, $request);
        }

        // 3. Storefront Page: /store/{slug}
        if (Str::startsWith($path, 'store/')) {
            $slug = Str::after($path, 'store/');
            $slug = explode('/', $slug)[0];
            return $this->resolveStoreSeo($slug, $request);
        }

        // 4. CMS Page: /p/{slug}
        if (Str::startsWith($path, 'p/')) {
            $slug = Str::after($path, 'p/');
            $slug = explode('/', $slug)[0];
            return $this->resolveCmsPageSeo($slug, $request);
        }

        // 5. Marketing Subpages: /pricing, /faq, /use-cases, /about, /integrations, /contact
        if (in_array($path, ['pricing', 'faq', 'use-cases', 'about', 'integrations', 'contact'], true)) {
            return $this->resolveMarketingSubpageSeo($path, $request);
        }

        // 6. Homepage / Root Landing
        return $this->resolveHomepageSeo($request);
    }

    /**
     * Resolve SEO & Schema for Single Digital Product (/buy/{slug}).
     */
    protected function resolveProductSeo(string $slug, Request $request): array
    {
        try {
            $product = EcommerceProduct::with('store')
                ->where(function ($q) use ($slug) {
                    $q->where('slug', $slug);
                    if (is_numeric($slug) || str_starts_with($slug, 'p-')) {
                        $id = str_replace('p-', '', $slug);
                        $q->orWhere('id', (int) $id);
                    }
                })
                ->where('is_published', true)
                ->first();

            if ($product) {
                $storeName = $product->store?->name ?: $this->getAppName();
                $title = "Buy {$product->name} | {$storeName}";
                $description = Str::limit(strip_tags($product->description ?: "Instant digital checkout for {$product->name}"), 155);
                $imageUrl = $product->image_url ?: $this->getDefaultOgImage();
                $productUrl = route('public.checkout.show', ['slug' => $product->slug ?: $product->id]);

                $jsonLd = [
                    $this->generateProductSchema($product, $productUrl),
                    $this->generateBreadcrumbsSchema([
                        ['name' => 'Home', 'url' => url('/')],
                        ['name' => $storeName, 'url' => $product->store?->slug ? route('public.storefront.show', ['slug' => $product->store->slug]) : url('/')],
                        ['name' => $product->name, 'url' => $productUrl],
                    ]),
                ];

                return $this->formatMetadata([
                    'title' => $title,
                    'description' => $description,
                    'keywords' => "{$product->name}, {$storeName}, digital download, instant checkout",
                    'image' => $imageUrl,
                    'canonical' => $productUrl,
                    'type' => 'product',
                    'json_ld' => $jsonLd,
                ], $request);
            }
        } catch (\Throwable) {
            // Fallback to default
        }

        return $this->resolveHomepageSeo($request);
    }

    /**
     * Resolve SEO & Schema for Merchant Storefront (/store/{slug}).
     */
    protected function resolveStoreSeo(string $slug, Request $request): array
    {
        try {
            $store = EcommerceStore::where('slug', $slug)
                ->orWhere('uuid', $slug)
                ->first();

            if ($store) {
                $storeName = $store->name ?: 'Digital Storefront';
                $title = "{$storeName} — Official Digital Catalog & Storefront";
                $description = $store->seo_meta['meta_description'] ?? null;
                if (! $description) {
                    $description = $store->description 
                        ? Str::limit(strip_tags($store->description), 155)
                        : "Explore digital products, instant downloads, and resources from {$storeName} on {$this->getAppName()}.";
                }
                $imageUrl = $store->banner_url ?: $store->logo_url ?: $this->getDefaultOgImage();
                $storeUrl = route('public.storefront.show', ['slug' => $store->slug ?: $store->uuid]);

                $jsonLd = [
                    [
                        '@context' => 'https://schema.org',
                        '@type' => 'Store',
                        'name' => $storeName,
                        'url' => $storeUrl,
                        'description' => $description,
                        'image' => $imageUrl,
                    ],
                    $this->generateBreadcrumbsSchema([
                        ['name' => 'Home', 'url' => url('/')],
                        ['name' => 'Stores', 'url' => url('/store/'.$slug)],
                        ['name' => $storeName, 'url' => $storeUrl],
                    ]),
                ];

                return $this->formatMetadata([
                    'title' => $title,
                    'description' => $description,
                    'keywords' => "{$storeName}, online store, digital downloads, creator store",
                    'image' => $imageUrl,
                    'canonical' => $storeUrl,
                    'type' => 'website',
                    'json_ld' => $jsonLd,
                ], $request);
            }
        } catch (\Throwable) {
            // Fallback
        }

        return $this->resolveHomepageSeo($request);
    }

    /**
     * Resolve SEO & Schema for CMS pages (/p/{slug}).
     */
    protected function resolveCmsPageSeo(string $slug, Request $request): array
    {
        try {
            $page = CmsPage::where('slug', $slug)->where('published', true)->first();
            if ($page) {
                $appName = $this->getAppName();
                $title = Brand::apply($page->meta_title ?: $page->title);
                $fullTitle = "{$title} — {$appName}";
                $description = Brand::apply($page->meta_description ?: Str::limit(strip_tags($page->content), 155));
                $pageUrl = route('cms-page.show', ['slug' => $page->slug]);

                $jsonLd = [
                    [
                        '@context' => 'https://schema.org',
                        '@type' => 'Article',
                        'headline' => $title,
                        'description' => $description,
                        'mainEntityOfPage' => [
                            '@type' => 'WebPage',
                            '@id' => $pageUrl,
                        ],
                        'dateModified' => ($page->updated_at ?? now())->toIso8601String(),
                        'publisher' => [
                            '@type' => 'Organization',
                            'name' => $appName,
                            'url' => url('/'),
                            'logo' => [
                                '@type' => 'ImageObject',
                                'url' => $this->getDefaultOgImage(),
                            ],
                        ],
                    ],
                    $this->generateBreadcrumbsSchema([
                        ['name' => 'Home', 'url' => url('/')],
                        ['name' => $title, 'url' => $pageUrl],
                    ]),
                ];

                return $this->formatMetadata([
                    'title' => $fullTitle,
                    'description' => $description,
                    'canonical' => $pageUrl,
                    'type' => 'article',
                    'json_ld' => $jsonLd,
                ], $request);
            }
        } catch (\Throwable) {
            // Fallback
        }

        return $this->resolveHomepageSeo($request);
    }

    /**
     * Resolve SEO & Schema for marketing subpages (/pricing, /faq, etc.).
     */
    protected function resolveMarketingSubpageSeo(string $path, Request $request): array
    {
        $appName = $this->getAppName();
        $titles = [
            'pricing' => "Transparent Pricing Plans & Subscriptions — {$appName}",
            'faq' => "Frequently Asked Questions & Support — {$appName}",
            'use-cases' => "Omnichannel AI Solutions & Use Cases — {$appName}",
            'about' => "About Our Platform & Mission — {$appName}",
            'integrations' => "Connect WhatsApp, Meta & Cloud Services — {$appName}",
            'contact' => "Contact Us & Sales Inquiries — {$appName}",
        ];

        $descriptions = [
            'pricing' => "Simple, scalable pricing for teams of any size. Start your 14-day free trial on {$appName} with no credit card required.",
            'faq' => "Find answers about {$appName}, official Meta Business API integration, AI chatbots, automated broadcast campaigns, and pricing.",
            'use-cases' => "Discover how teams use {$appName} for automated customer service, ecommerce checkouts, lead generation, and team inboxes.",
            'about' => "Learn about {$appName}'s mission to streamline omnichannel customer conversations with AI-driven intelligence.",
            'integrations' => "Easily connect {$appName} with WhatsApp, Instagram, Messenger, payment gateways, and CRM systems.",
            'contact' => "Get in touch with our team for enterprise support, custom integrations, or platform inquiries.",
        ];

        $jsonLd = [
            $this->generateBreadcrumbsSchema([
                ['name' => 'Home', 'url' => url('/')],
                ['name' => ucfirst(str_replace('-', ' ', $path)), 'url' => url("/{$path}")],
            ]),
        ];

        if ($path === 'faq') {
            $jsonLd[] = $this->generateDefaultFaqSchema();
        } elseif ($path === 'pricing') {
            $jsonLd[] = $this->generateSoftwareApplicationSchema();
        }

        return $this->formatMetadata([
            'title' => $titles[$path] ?? "{$appName} — Omnichannel Automation",
            'description' => $descriptions[$path] ?? "Automate customer conversations with {$appName}.",
            'canonical' => url("/{$path}"),
            'type' => 'website',
            'json_ld' => $jsonLd,
        ], $request);
    }

    /**
     * Resolve SEO & Schema for Homepage.
     */
    protected function resolveHomepageSeo(Request $request): array
    {
        $appName = $this->getAppName();
        $landingSettings = LandingPageController::getPublicSettings();

        $title = $landingSettings['landing.seo_title'] ?? "{$appName} — One Inbox for WhatsApp, Messenger & Instagram";
        $description = $landingSettings['landing.seo_description'] ?? "{$appName} unifies WhatsApp, Messenger and Instagram in one inbox with AI chatbots, no-code automation, bulk broadcasting and a built-in CRM.";
        $keywords = $landingSettings['landing.seo_keywords'] ?? 'WhatsApp Business API, team inbox, WhatsApp marketing, AI chatbot, Messenger, Instagram DM, marketing automation, CRM';
        $image = ! empty($landingSettings['landing.seo_og_image']) ? $landingSettings['landing.seo_og_image'] : $this->getDefaultOgImage();

        $jsonLd = [
            $this->generateOrganizationSchema(),
            $this->generateWebSiteSchema(),
            $this->generateSoftwareApplicationSchema(),
        ];

        return $this->formatMetadata([
            'title' => Brand::apply($title),
            'description' => Brand::apply($description),
            'keywords' => Brand::apply($keywords),
            'image' => $image,
            'canonical' => url('/'),
            'type' => 'website',
            'json_ld' => $jsonLd,
        ], $request);
    }

    /**
     * Generate Schema.org Product & Offer microdata.
     */
    public function generateProductSchema(EcommerceProduct $product, string $url): array
    {
        $storeName = $product->store?->name ?: $this->getAppName();
        $currency = strtoupper($product->currency ?: 'NGN');
        $price = (float) $product->price;

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $product->name,
            'image' => $product->image_url ?: $this->getDefaultOgImage(),
            'description' => Str::limit(strip_tags($product->description ?: $product->name), 200),
            'sku' => "PROD-{$product->id}",
            'offers' => [
                '@type' => 'Offer',
                'url' => $url,
                'priceCurrency' => $currency,
                'price' => number_format($price, 2, '.', ''),
                'priceValidUntil' => now()->addYear()->format('Y-12-31'),
                'availability' => 'https://schema.org/InStock',
                'seller' => [
                    '@type' => 'Organization',
                    'name' => $storeName,
                ],
            ],
        ];
    }

    /**
     * Generate Schema.org Organization microdata.
     */
    public function generateOrganizationSchema(): array
    {
        $appName = $this->getAppName();

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $appName,
            'url' => url('/'),
            'logo' => $this->getDefaultOgImage(),
            'contactPoint' => [
                '@type' => 'ContactPoint',
                'contactType' => 'customer support',
                'email' => SystemSetting::get('support_email', config('saas.support_email', 'support@botifyai.cloud')),
                'url' => url('/contact'),
            ],
        ];
    }

    /**
     * Generate Schema.org WebSite with SearchAction microdata.
     */
    public function generateWebSiteSchema(): array
    {
        $appName = $this->getAppName();

        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $appName,
            'url' => url('/'),
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => url('/faq').'?q={search_term_string}',
                'query-input' => 'required name=search_term_string',
            ],
        ];
    }

    /**
     * Generate Schema.org SoftwareApplication microdata with subscription plans.
     */
    public function generateSoftwareApplicationSchema(): array
    {
        $appName = $this->getAppName();
        $offers = [];

        try {
            $plans = Plan::where('enabled', true)->orderBy('sort_order')->get();
            foreach ($plans as $plan) {
                $cents = $plan->priceCentsForCycle('month') ?? 0;
                $offers[] = [
                    '@type' => 'Offer',
                    'name' => $plan->name,
                    'price' => number_format($cents / 100, 2, '.', ''),
                    'priceCurrency' => $plan->currency_code ?? 'USD',
                    'description' => $plan->description ?? "{$plan->name} Subscription Plan",
                ];
            }
        } catch (\Throwable) {
            // Ignore if DB not ready
        }

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'SoftwareApplication',
            'name' => $appName,
            'operatingSystem' => 'All (Cloud / SaaS)',
            'applicationCategory' => 'BusinessApplication',
            'description' => "Unified Omnichannel Customer Engagement, AI Chatbots, and Digital Commerce Platform.",
            'url' => url('/'),
        ];

        if (! empty($offers)) {
            $schema['offers'] = $offers;
        }

        return $schema;
    }

    /**
     * Generate Schema.org FAQPage microdata.
     */
    public function generateDefaultFaqSchema(): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => [
                [
                    '@type' => 'Question',
                    'name' => 'What is BotifyAI?',
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text' => 'BotifyAI is an all-in-one omnichannel messaging, AI chatbot, and digital commerce platform that unifies WhatsApp, Messenger, and Instagram.',
                    ],
                ],
                [
                    '@type' => 'Question',
                    'name' => 'Do I need a credit card to start a free trial?',
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text' => 'No, you can get started immediately with a 14-day free trial without entering credit card details.',
                    ],
                ],
                [
                    '@type' => 'Question',
                    'name' => 'Can I sell digital products on BotifyAI?',
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text' => 'Yes! BotifyAI features built-in multi-currency digital storefronts, instant file delivery vaults, and secure payment gateway integrations with Paystack and Stripe.',
                    ],
                ],
            ],
        ];
    }

    /**
     * Generate Schema.org BreadcrumbList microdata.
     */
    public function generateBreadcrumbsSchema(array $crumbs): array
    {
        $items = [];
        foreach ($crumbs as $index => $crumb) {
            $items[] = [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $crumb['name'] ?? '',
                'item' => $crumb['url'] ?? url('/'),
            ];
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $items,
        ];
    }

    /**
     * Normalize metadata and format Open Graph & Twitter payloads.
     */
    protected function formatMetadata(array $data, Request $request): array
    {
        $appName = $this->getAppName();
        $title = $data['title'] ?? $appName;
        $description = $data['description'] ?? '';
        $keywords = $data['keywords'] ?? '';
        $canonical = $this->sanitizeCanonicalUrl($data['canonical'] ?? $request->fullUrl());
        $image = $data['image'] ?? $this->getDefaultOgImage();
        $type = $data['type'] ?? 'website';
        $robots = $data['robots'] ?? 'index, follow';
        $jsonLd = $data['json_ld'] ?? [];

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'canonical' => $canonical,
            'robots' => $robots,
            'og' => [
                'site_name' => $appName,
                'type' => $type,
                'title' => $title,
                'description' => $description,
                'url' => $canonical,
                'image' => $image,
            ],
            'twitter' => [
                'card' => filled($image) ? 'summary_large_image' : 'summary',
                'title' => $title,
                'description' => $description,
                'image' => $image,
            ],
            'json_ld' => $jsonLd,
        ];
    }

    /**
     * Render the server-side HTML meta tags and JSON-LD for insertion in app.blade.php.
     */
    public function renderHtmlTags(?Request $request = null): string
    {
        $meta = $this->resolveForRequest($request);

        $html = [];
        $html[] = "<!-- Server-Side SEO, OpenGraph & JSON-LD (BotifyAI SEO Engine) -->";
        $html[] = '<meta name="robots" content="'.e($meta['robots']).'">';

        if (filled($meta['description'])) {
            $html[] = '<meta name="description" content="'.e($meta['description']).'">';
        }
        if (filled($meta['keywords'])) {
            $html[] = '<meta name="keywords" content="'.e($meta['keywords']).'">';
        }
        if (filled($meta['canonical'])) {
            $html[] = '<link rel="canonical" href="'.e($meta['canonical']).'">';
        }

        // Open Graph
        if (! empty($meta['og'])) {
            $html[] = '<meta property="og:site_name" content="'.e($meta['og']['site_name'] ?? '').'">';
            $html[] = '<meta property="og:type" content="'.e($meta['og']['type'] ?? 'website').'">';
            $html[] = '<meta property="og:title" content="'.e($meta['og']['title'] ?? '').'">';
            if (filled($meta['og']['description'] ?? '')) {
                $html[] = '<meta property="og:description" content="'.e($meta['og']['description']).'">';
            }
            if (filled($meta['og']['url'] ?? '')) {
                $html[] = '<meta property="og:url" content="'.e($meta['og']['url']).'">';
            }
            if (filled($meta['og']['image'] ?? '')) {
                $html[] = '<meta property="og:image" content="'.e($meta['og']['image']).'">';
            }
        }

        // Twitter Cards
        if (! empty($meta['twitter'])) {
            $html[] = '<meta name="twitter:card" content="'.e($meta['twitter']['card'] ?? 'summary').'">';
            $html[] = '<meta name="twitter:title" content="'.e($meta['twitter']['title'] ?? '').'">';
            if (filled($meta['twitter']['description'] ?? '')) {
                $html[] = '<meta name="twitter:description" content="'.e($meta['twitter']['description']).'">';
            }
            if (filled($meta['twitter']['image'] ?? '')) {
                $html[] = '<meta name="twitter:image" content="'.e($meta['twitter']['image']).'">';
            }
        }

        // Schema.org JSON-LD structured data
        if (! empty($meta['json_ld'])) {
            foreach ($meta['json_ld'] as $schema) {
                if (! empty($schema)) {
                    $html[] = '<script type="application/ld+json">'.json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE).'</script>';
                }
            }
        }

        return implode("\n        ", $html);
    }

    /**
     * Render Search Engine Verification Tags and Head Tracking Scripts.
     */
    public function renderHeadTrackingScripts(): string
    {
        $html = [];

        try {
            // 1. Search Engine Verification Tags
            $googleVerify = SystemSetting::get('seo_google_verification_code');
            if (filled($googleVerify)) {
                $html[] = '<meta name="google-site-verification" content="'.e($googleVerify).'">';
            }

            $bingVerify = SystemSetting::get('seo_bing_verification_code');
            if (filled($bingVerify)) {
                $html[] = '<meta name="msvalidate.01" content="'.e($bingVerify).'">';
            }

            $yandexVerify = SystemSetting::get('seo_yandex_verification_code');
            if (filled($yandexVerify)) {
                $html[] = '<meta name="yandex-verification" content="'.e($yandexVerify).'">';
            }

            $pinterestVerify = SystemSetting::get('seo_pinterest_verification_code');
            if (filled($pinterestVerify)) {
                $html[] = '<meta name="p:domain_verify" content="'.e($pinterestVerify).'">';
            }

            // 2. Google Tag Manager (GTM)
            $gtmId = SystemSetting::get('seo_google_tag_manager_id');
            if (filled($gtmId)) {
                $html[] = "<!-- Google Tag Manager -->";
                $html[] = "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':";
                $html[] = "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],";
                $html[] = "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=";
                $html[] = "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);";
                $html[] = "})(window,document,'script','dataLayer','".e($gtmId)."');</script>";
                $html[] = "<!-- End Google Tag Manager -->";
            }

            // 3. Google Analytics 4 (GA4)
            $ga4Id = SystemSetting::get('seo_google_analytics_id');
            if (filled($ga4Id) && empty($gtmId)) {
                $html[] = "<!-- Google Analytics 4 -->";
                $html[] = '<script async src="https://www.googletagmanager.com/gtag/js?id='.e($ga4Id).'"></script>';
                $html[] = "<script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '".e($ga4Id)."');</script>";
            }

            // 4. Microsoft Clarity
            $clarityId = SystemSetting::get('seo_clarity_project_id', 'yky6jsr41d');
            if (filled($clarityId)) {
                $html[] = "<!-- Microsoft Clarity -->";
                $html[] = "<script type=\"text/javascript\">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src=\"https://www.clarity.ms/tag/\"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, \"clarity\", \"script\", \"".e($clarityId)."\");</script>";
            }

            // 5. Meta Pixel (Facebook)
            $metaPixelId = SystemSetting::get('seo_meta_pixel_id');
            if (filled($metaPixelId)) {
                $html[] = "<!-- Meta Pixel Code -->";
                $html[] = "<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '".e($metaPixelId)."');fbq('track', 'PageView');</script>";
            }

            // 6. TikTok Pixel
            $tiktokPixelId = SystemSetting::get('seo_tiktok_pixel_id');
            if (filled($tiktokPixelId)) {
                $html[] = "<!-- TikTok Pixel Code -->";
                $html[] = "<script>!function (w, d, t) { w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=[\"page\",\"track\",\"identify\",\"instances\",\"debug\",\"on\",\"off\",\"once\",\"ready\",\"alias\",\"group\",\"enableCookie\",\"disableCookie\"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i=\"https://analytics.tiktok.com/i18n/pixel/events.js\";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement(\"script\");o.type=\"text/javascript\",o.async=!0,o.src=i+\"?sdkid=\"+e+\"&lib=\"+t;var a=document.getElementsByTagName(\"script\")[0];a.parentNode.insertBefore(o,a)}; ttq.load('".e($tiktokPixelId)."'); ttq.page(); }(window, document, 'ttq');</script>";
            }

            // 7. Custom Head Scripts
            $customHead = SystemSetting::get('seo_custom_head_scripts');
            if (filled($customHead)) {
                $html[] = "<!-- Custom Head Scripts -->";
                $html[] = $customHead;
            }
        } catch (\Throwable) {
            // Graceful fallback
        }

        return implode("\n        ", $html);
    }

    /**
     * Render Body Tracking Scripts (GTM noscript, Meta noscript, custom body scripts).
     */
    public function renderBodyTrackingScripts(): string
    {
        $html = [];

        try {
            $gtmId = SystemSetting::get('seo_google_tag_manager_id');
            if (filled($gtmId)) {
                $html[] = '<!-- Google Tag Manager (noscript) -->';
                $html[] = '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id='.e($gtmId).'" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>';
            }

            $metaPixelId = SystemSetting::get('seo_meta_pixel_id');
            if (filled($metaPixelId)) {
                $html[] = '<!-- Meta Pixel (noscript) -->';
                $html[] = '<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id='.e($metaPixelId).'&ev=PageView&noscript=1"/></noscript>';
            }

            $customBody = SystemSetting::get('seo_custom_body_scripts');
            if (filled($customBody)) {
                $html[] = '<!-- Custom Body Scripts -->';
                $html[] = $customBody;
            }
        } catch (\Throwable) {
            // Graceful fallback
        }

        return implode("\n        ", $html);
    }

    /**
     * Clean tracking parameters from canonical URLs.
     */
    public function sanitizeCanonicalUrl(string $url): string
    {
        $parsed = parse_url($url);
        if (! $parsed || ! isset($parsed['scheme']) || ! isset($parsed['host'])) {
            return $url;
        }

        $scheme = $parsed['scheme'];
        $host = $parsed['host'];
        $port = isset($parsed['port']) ? ':'.$parsed['port'] : '';
        $path = $parsed['path'] ?? '';

        $cleanUrl = "{$scheme}://{$host}{$port}{$path}";

        if (isset($parsed['query'])) {
            parse_str($parsed['query'], $queryParams);
            $preservedParams = [];
            if (isset($queryParams['page']) && is_numeric($queryParams['page']) && (int) $queryParams['page'] > 1) {
                $preservedParams['page'] = (int) $queryParams['page'];
            }

            if (! empty($preservedParams)) {
                $cleanUrl .= '?'.http_build_query($preservedParams);
            }
        }

        return rtrim($cleanUrl, '/');
    }

    /**
     * Resolve default application name.
     */
    protected function getAppName(): string
    {
        try {
            return SystemSetting::get('app_name') ?: config('saas.app_name', config('app.name', 'BotifyAI'));
        } catch (\Throwable) {
            return config('app.name', 'BotifyAI');
        }
    }

    /**
     * Resolve default OG Image fallback.
     */
    protected function getDefaultOgImage(): string
    {
        try {
            $logoPath = SystemSetting::get('app_logo_path');
            $disk = SystemSetting::get('app_logo_disk', 'public');
            if ($logoPath) {
                return Storage::disk($disk)->url($logoPath);
            }
        } catch (\Throwable) {
            // Fallback
        }

        return url('/whatsmine-icon-512.png');
    }
}
