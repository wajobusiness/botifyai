<?php

namespace App\Http\Controllers\Seo;

use App\Http\Controllers\Controller;
use App\Models\CmsPage;
use App\Models\SystemSetting;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    /**
     * Cache TTL in seconds (6 hours).
     */
    protected const CACHE_TTL = 21600;

    /**
     * Master Sitemap Index: /sitemap.xml
     */
    public function index(): Response
    {
        $xml = Cache::remember('seo_sitemap_index', self::CACHE_TTL, function () {
            $now = now()->toAtomString();
            $sitemaps = [
                ['loc' => route('sitemap.pages'), 'lastmod' => $now],
                ['loc' => route('sitemap.cms'), 'lastmod' => $now],
                ['loc' => route('sitemap.stores'), 'lastmod' => $now],
                ['loc' => route('sitemap.products'), 'lastmod' => $now],
            ];

            $out = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            $out .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
            foreach ($sitemaps as $sitemap) {
                $out .= "  <sitemap>\n";
                $out .= '    <loc>'.htmlspecialchars($sitemap['loc']).'</loc>'."\n";
                $out .= '    <lastmod>'.$sitemap['lastmod'].'</lastmod>'."\n";
                $out .= "  </sitemap>\n";
            }
            $out .= '</sitemapindex>';

            return $out;
        });

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Core Marketing Pages Sitemap: /sitemaps/pages.xml
     */
    public function pages(): Response
    {
        $xml = Cache::remember('seo_sitemap_pages', self::CACHE_TTL, function () {
            $landingEnabled = true;
            try {
                $landingEnabled = SystemSetting::get('landing.page_enabled', '1') === '1';
            } catch (\Throwable) {
                // Ignore
            }

            $entries = [];
            $now = now()->toAtomString();

            if ($landingEnabled) {
                $entries[] = ['loc' => url('/'), 'priority' => '1.0', 'changefreq' => 'daily', 'lastmod' => $now];
                $entries[] = ['loc' => url('/pricing'), 'priority' => '0.9', 'changefreq' => 'weekly', 'lastmod' => $now];
                $entries[] = ['loc' => url('/use-cases'), 'priority' => '0.8', 'changefreq' => 'weekly', 'lastmod' => $now];
                $entries[] = ['loc' => url('/integrations'), 'priority' => '0.8', 'changefreq' => 'weekly', 'lastmod' => $now];
                $entries[] = ['loc' => url('/faq'), 'priority' => '0.7', 'changefreq' => 'monthly', 'lastmod' => $now];
                $entries[] = ['loc' => url('/about'), 'priority' => '0.6', 'changefreq' => 'monthly', 'lastmod' => $now];
                $entries[] = ['loc' => url('/contact'), 'priority' => '0.5', 'changefreq' => 'monthly', 'lastmod' => $now];
            }

            return $this->buildUrlsetXml($entries);
        });

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * CMS Knowledge Pages Sitemap: /sitemaps/cms.xml
     */
    public function cms(): Response
    {
        $xml = Cache::remember('seo_sitemap_cms', self::CACHE_TTL, function () {
            $entries = [];
            try {
                $pages = CmsPage::where('published', true)->get();
                foreach ($pages as $page) {
                    $entries[] = [
                        'loc' => route('cms-page.show', ['slug' => $page->slug]),
                        'priority' => '0.5',
                        'changefreq' => 'monthly',
                        'lastmod' => ($page->updated_at ?? now())->toAtomString(),
                    ];
                }
            } catch (\Throwable) {
                // Table might not be ready
            }

            return $this->buildUrlsetXml($entries);
        });

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Merchant Storefronts Sitemap: /sitemaps/stores.xml
     */
    public function stores(): Response
    {
        $xml = Cache::remember('seo_sitemap_stores', self::CACHE_TTL, function () {
            $entries = [];
            try {
                $stores = EcommerceStore::where('is_active', true)
                    ->whereNotNull('slug')
                    ->where('slug', '!=', '')
                    ->get();

                foreach ($stores as $store) {
                    $entries[] = [
                        'loc' => route('public.storefront.show', ['slug' => $store->slug]),
                        'priority' => '0.8',
                        'changefreq' => 'weekly',
                        'lastmod' => ($store->updated_at ?? now())->toAtomString(),
                    ];
                }
            } catch (\Throwable) {
                // Ignore
            }

            return $this->buildUrlsetXml($entries);
        });

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Ecommerce Products Sitemap: /sitemaps/products.xml (with Image metadata)
     */
    public function products(): Response
    {
        $xml = Cache::remember('seo_sitemap_products', self::CACHE_TTL, function () {
            $entries = [];
            try {
                $products = EcommerceProduct::with('store')
                    ->where('is_published', true)
                    ->whereNotNull('slug')
                    ->where('slug', '!=', '')
                    ->get();

                foreach ($products as $product) {
                    $entry = [
                        'loc' => route('public.checkout.show', ['slug' => $product->slug]),
                        'priority' => '0.9',
                        'changefreq' => 'daily',
                        'lastmod' => ($product->updated_at ?? now())->toAtomString(),
                    ];

                    if (! empty($product->image_url)) {
                        $entry['image'] = [
                            'loc' => $product->image_url,
                            'title' => $product->name,
                        ];
                    }

                    $entries[] = $entry;
                }
            } catch (\Throwable) {
                // Ignore
            }

            return $this->buildUrlsetXml($entries, true);
        });

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Build valid XML Urlset markup.
     */
    protected function buildUrlsetXml(array $entries, bool $includeImageNamespace = false): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        if ($includeImageNamespace) {
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'."\n";
        } else {
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
        }

        foreach ($entries as $entry) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>'.htmlspecialchars($entry['loc']).'</loc>'."\n";
            $xml .= '    <lastmod>'.$entry['lastmod'].'</lastmod>'."\n";
            $xml .= '    <changefreq>'.$entry['changefreq'].'</changefreq>'."\n";
            $xml .= '    <priority>'.$entry['priority'].'</priority>'."\n";

            if (! empty($entry['image'])) {
                $xml .= "    <image:image>\n";
                $xml .= '      <image:loc>'.htmlspecialchars($entry['image']['loc']).'</image:loc>'."\n";
                if (! empty($entry['image']['title'])) {
                    $xml .= '      <image:title>'.htmlspecialchars($entry['image']['title']).'</image:title>'."\n";
                }
                $xml .= "    </image:image>\n";
            }

            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Purge all cached sitemap files.
     */
    public static function clearCache(): void
    {
        Cache::forget('seo_sitemap_index');
        Cache::forget('seo_sitemap_pages');
        Cache::forget('seo_sitemap_cms');
        Cache::forget('seo_sitemap_stores');
        Cache::forget('seo_sitemap_products');
    }
}

