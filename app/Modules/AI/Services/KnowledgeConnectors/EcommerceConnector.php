<?php

namespace App\Modules\AI\Services\KnowledgeConnectors;

use App\Modules\AI\Models\KnowledgeSource;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EcommerceConnector implements ConnectorInterface
{
    public function testConnection(array $details): array
    {
        $platform = $details['platform'] ?? 'shopify'; // shopify, woocommerce
        $storeUrl = rtrim($details['store_url'] ?? '', '/');

        if (! $storeUrl) {
            return ['success' => false, 'message' => 'Store URL is required.'];
        }

        try {
            if ($platform === 'shopify') {
                $accessToken = $details['access_token'] ?? '';
                if (! $accessToken) {
                    return ['success' => false, 'message' => 'Shopify Admin API access token required.'];
                }

                $res = Http::withHeaders([
                    'X-Shopify-Access-Token' => $accessToken,
                    'Content-Type' => 'application/json',
                ])->get("{$storeUrl}/admin/api/2024-01/shop.json");

                if ($res->successful()) {
                    $shopName = $res->json('shop.name') ?: 'Store';
                    return ['success' => true, 'message' => "Connected to Shopify store '{$shopName}'!"];
                }
                return ['success' => false, 'message' => 'Shopify authentication failed: HTTP '.$res->status()];
            } else {
                // WooCommerce
                $consumerKey = $details['consumer_key'] ?? '';
                $consumerSecret = $details['consumer_secret'] ?? '';

                $res = Http::withBasicAuth($consumerKey, $consumerSecret)
                    ->get("{$storeUrl}/wp-json/wc/v3/system_status");

                if ($res->successful()) {
                    return ['success' => true, 'message' => 'Connected to WooCommerce store successfully!'];
                }
                return ['success' => false, 'message' => 'WooCommerce authentication failed: HTTP '.$res->status()];
            }
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => 'Connection error: '.$e->getMessage()];
        }
    }

    public function extract(KnowledgeSource $source): array
    {
        $details = $source->connection_details ?? [];
        $platform = $details['platform'] ?? 'shopify';
        $storeUrl = rtrim($details['store_url'] ?? '', '/');
        $items = [];

        try {
            if ($platform === 'shopify') {
                $accessToken = $details['access_token'] ?? '';
                $res = Http::withHeaders(['X-Shopify-Access-Token' => $accessToken])
                    ->get("{$storeUrl}/admin/api/2024-01/products.json?limit=50");

                if ($res->successful()) {
                    $products = $res->json('products') ?? [];
                    foreach ($products as $p) {
                        $title = $p['title'] ?? 'Product';
                        $body = strip_tags($p['body_html'] ?? '');
                        $vendor = $p['vendor'] ?? '';
                        $price = $p['variants'][0]['price'] ?? '0.00';
                        $inventory = $p['variants'][0]['inventory_quantity'] ?? 'In Stock';

                        $content = "Product: {$title}\nVendor: {$vendor}\nPrice: \${$price}\nInventory Status: {$inventory}\nDescription: {$body}";
                        $items[] = [
                            'content' => $content,
                            'metadata' => [
                                'source' => $source->name,
                                'type' => 'shopify_product',
                                'product_id' => $p['id'] ?? null,
                                'title' => $title,
                            ],
                        ];
                    }
                }
            } else {
                // WooCommerce
                $key = $details['consumer_key'] ?? '';
                $secret = $details['consumer_secret'] ?? '';

                $res = Http::withBasicAuth($key, $secret)
                    ->get("{$storeUrl}/wp-json/wc/v3/products?per_page=50");

                if ($res->successful()) {
                    $products = $res->json() ?? [];
                    foreach ($products as $p) {
                        $name = $p['name'] ?? 'Product';
                        $price = $p['price'] ?? '0.00';
                        $desc = strip_tags($p['description'] ?? '');
                        $stock = $p['stock_status'] ?? 'instock';

                        $content = "Product: {$name}\nPrice: \${$price}\nStock Status: {$stock}\nDescription: {$desc}";
                        $items[] = [
                            'content' => $content,
                            'metadata' => [
                                'source' => $source->name,
                                'type' => 'woocommerce_product',
                                'product_id' => $p['id'] ?? null,
                                'name' => $name,
                            ],
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('EcommerceConnector extraction error: '.$e->getMessage());
        }

        return $items;
    }
}
