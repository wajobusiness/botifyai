<?php

namespace App\Modules\Ecommerce\Services\Import\Adapters;

use App\Modules\Ecommerce\Services\Import\Contracts\StoreAdapterInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SelarStoreAdapter implements StoreAdapterInterface
{
    public function getPlatformName(): string
    {
        return 'selar';
    }

    /**
     * Discover and extract all products from the given Selar store URL.
     *
     * @return array<int, array<string, mixed>>
     */
    public function extractProducts(string $storeUrl): array
    {
        $products = [];
        $page = 1;
        $totalPages = 1;

        // Normalize base store URL
        $baseUrl = rtrim($storeUrl, '/');

        do {
            $url = "{$baseUrl}?page={$page}&currency=NGN";

            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            ])->timeout(25)->get($url);

            if (! $response->successful()) {
                break;
            }

            $html = $response->body();
            $pageData = $this->parseNuxtData($html);

            if (! $pageData || empty($pageData['products'])) {
                break;
            }

            $totalPages = $pageData['pagination']['total_pages'] ?? 1;

            foreach ($pageData['products'] as $item) {
                $products[] = $item;
            }

            $page++;
        } while ($page <= $totalPages);

        return $products;
    }

    /**
     * Normalizes raw Selar product data into BotifyAI's standard ecommerce schema.
     *
     * @param  array<string, mixed>  $rawProduct
     * @return array<string, mixed>
     */
    public function normalizeProduct(array $rawProduct): array
    {
        $code = (string) ($rawProduct['code'] ?? Str::random(10));
        $name = trim((string) ($rawProduct['name'] ?? 'Untitled Product'));

        // Parse price in NGN
        $price = 0.0;
        if (isset($rawProduct['price'])) {
            if (is_numeric($rawProduct['price'])) {
                $price = (float) $rawProduct['price'];
            } elseif (is_string($rawProduct['price'])) {
                if (strtolower($rawProduct['price']) === 'free') {
                    $price = 0.0;
                } else {
                    $cleaned = preg_replace('/[^\d.]/', '', $rawProduct['price']);
                    $price = (float) $cleaned;
                }
            }
        } elseif (isset($rawProduct['priceRaw']) && is_numeric($rawProduct['priceRaw'])) {
            $price = (float) $rawProduct['priceRaw'];
        }

        // Parse compare_at_price / original price
        $compareAtPrice = null;
        if (isset($rawProduct['oldPrice']) && $rawProduct['oldPrice'] !== '-1' && $rawProduct['oldPrice'] !== -1) {
            if (is_numeric($rawProduct['oldPrice'])) {
                $compareAtPrice = (float) $rawProduct['oldPrice'];
            } elseif (is_string($rawProduct['oldPrice'])) {
                $cleaned = preg_replace('/[^\d.]/', '', $rawProduct['oldPrice']);
                $compareAtPrice = ! empty($cleaned) ? (float) $cleaned : null;
            }
        }

        // Product type detection
        $typeLabel = strtolower((string) ($rawProduct['typeLabel'] ?? $rawProduct['type'] ?? ''));
        $productType = 'digital';
        if (str_contains($typeLabel, 'service')) {
            $productType = 'service';
        } elseif (str_contains($typeLabel, 'physical')) {
            $productType = 'physical';
        }

        // Sanitized HTML description
        $rawDescription = (string) ($rawProduct['description'] ?? $rawProduct['fullDescription'] ?? '');
        $description = $this->sanitizeHtml($rawDescription);

        // Product images
        $imageUrl = $rawProduct['image'] ?? null;
        if (empty($imageUrl) && ! empty($rawProduct['images']) && is_array($rawProduct['images'])) {
            $imageUrl = $rawProduct['images'][0] ?? null;
        }

        // External redirect or origin url
        $externalUrl = "https://selar.com/{$code}";

        return [
            'external_id' => $code,
            'platform' => 'selar',
            'name' => $name,
            'slug' => Str::slug($name),
            'product_type' => $productType,
            'price' => $price,
            'compare_at_price' => $compareAtPrice,
            'currency' => 'NGN',
            'description' => $description,
            'image_url' => $imageUrl,
            'status' => 'active',
            'is_published' => true,
            'affiliate_enabled' => false,
            'affiliate_commission_percentage' => 15.0,
            'asset_type' => 'redirect_url',
            'external_redirect_url' => $externalUrl,
            'custom_fields' => [
                'source' => 'selar',
                'source_store' => 'https://selar.com/m/finxhost',
                'source_product_code' => $code,
                'source_product_url' => $externalUrl,
                'selar_type_label' => $rawProduct['typeLabel'] ?? null,
                'is_free' => (bool) ($rawProduct['isFree'] ?? ($price === 0.0)),
                'imported_at' => now()->toIso8601String(),
            ],
            'raw' => $rawProduct,
        ];
    }

    /**
     * Parse and deserialize Nuxt 3 SSR state payload from HTML.
     */
    public function parseNuxtData(string $html): ?array
    {
        if (! preg_match('/<script type="application\/json"[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/', $html, $matches)) {
            return null;
        }

        $raw = json_decode($matches[1], true);
        if (! is_array($raw)) {
            return null;
        }

        $unpacked = $this->unflattenNuxtArray($raw);
        $data = $unpacked['data'] ?? [];

        foreach ($data as $key => $val) {
            if (str_contains((string) $key, 'store-products') && is_array($val) && isset($val['products'])) {
                return $val;
            }
        }

        return null;
    }

    /**
     * Recursive un-flattener for Nuxt 3 serialized arrays.
     */
    private function unflattenNuxtArray(array $data): array
    {
        $cache = [];

        $resolve = function ($idx) use (&$resolve, &$cache, $data) {
            if (! is_int($idx) || $idx < 0 || $idx >= count($data)) {
                return $idx;
            }
            if (array_key_exists($idx, $cache)) {
                return $cache[$idx];
            }

            $val = $data[$idx];
            if ($val === null || ! is_array($val) && ! is_object($val)) {
                return $val;
            }

            if (is_array($val)) {
                if (isset($val[0]) && ($val[0] === 'ShallowReactive' || $val[0] === 'Reactive')) {
                    return $resolve($val[1]);
                }
                $arr = [];
                $cache[$idx] = &$arr;
                foreach ($val as $item) {
                    $arr[] = $resolve($item);
                }
                return $arr;
            }

            $obj = [];
            $cache[$idx] = &$obj;
            foreach ($val as $k => $v) {
                $obj[$k] = $resolve($v);
            }
            return $obj;
        };

        return (array) $resolve(0);
    }

    /**
     * Sanitizes untrusted external HTML to prevent XSS while keeping rich text styles.
     */
    private function sanitizeHtml(string $html): string
    {
        // Strip script and iframe tags
        $html = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $html);
        $html = preg_replace('#<iframe(.*?)>(.*?)</iframe>#is', '', $html);

        // Strip inline JS event handlers (e.g., onload, onclick, onerror)
        $html = preg_replace('/\s*on\w+="[^"]*"/i', '', $html);
        $html = preg_replace('/\s*on\w+=\'[^\']*\'/i', '', $html);

        return trim($html);
    }
}
