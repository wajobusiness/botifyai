<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AI\Models\AiChatbot;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Ecommerce\Models\MerchantBankAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreDashboardController extends Controller
{
    public function index(Request $request, ?string $storeUuid = null): Response
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);

        // Ensure native store exists
        $nativeStore = EcommerceStore::getOrCreateNativeStore($workspaceId, $request->user()->name . "'s Digital Store");

        // Fetch all stores in workspace
        $stores = EcommerceStore::where('workspace_id', $workspaceId)
            ->withCount(['products', 'orders'])
            ->orderBy('created_at')
            ->get();

        // Select target store
        $currentStore = null;
        if ($storeUuid) {
            $currentStore = $stores->firstWhere('uuid', $storeUuid);
        }
        if (! $currentStore) {
            $currentStore = $stores->firstWhere('platform', 'native') ?? $stores->first();
        }

        // Stats for current store
        $paidOrdersQuery = EcommerceOrder::where('store_id', $currentStore->id)
            ->where(function ($q) {
                $q->whereIn('payment_status', ['paid', 'completed'])
                  ->orWhere('financial_status', 'paid');
            });

        $totalRevenue = (float) (clone $paidOrdersQuery)->sum('total');
        $totalOrders = (clone $paidOrdersQuery)->count();
        $totalProducts = EcommerceProduct::where('store_id', $currentStore->id)->count();
        $totalCustomers = EcommerceOrder::where('store_id', $currentStore->id)
            ->distinct('customer_email')
            ->count('customer_email');

        // Recent Orders
        $recentOrders = EcommerceOrder::where('store_id', $currentStore->id)
            ->with('items')
            ->latest('placed_at')
            ->take(6)
            ->get()
            ->map(fn (EcommerceOrder $o) => [
                'id' => $o->id,
                'uuid' => $o->uuid,
                'number' => $o->number,
                'customer_name' => $o->customer_name ?: 'Customer',
                'customer_email' => $o->customer_email,
                'total' => (float) $o->total,
                'currency' => $o->currency ?: 'NGN',
                'payment_status' => $o->payment_status ?: ($o->financial_status === 'paid' ? 'paid' : 'pending'),
                'placed_at' => ($o->placed_at ?? $o->created_at)?->format('M d, H:i'),
                'items_count' => $o->items->count(),
            ]);

        // Top Selling Products
        $topProducts = EcommerceProduct::where('store_id', $currentStore->id)
            ->where('is_published', true)
            ->orderByDesc('sales_count')
            ->take(5)
            ->get()
            ->map(fn (EcommerceProduct $p) => [
                'id' => $p->id,
                'uuid' => $p->uuid,
                'name' => $p->name,
                'price' => (float) $p->price,
                'currency' => $p->currency ?: 'NGN',
                'sales_count' => $p->sales_count ?? 0,
                'total_revenue' => (float) (($p->sales_count ?? 0) * (float) $p->price),
                'product_type' => $p->product_type,
                'image_url' => $p->image_url,
                'checkout_url' => $p->getCheckoutUrl(),
            ]);

        // Marketing Pixel Health
        $pixels = $currentStore->marketing_pixels ?? [];
        $pixelHealth = [
            'meta' => [
                'name' => 'Meta Pixel & CAPI',
                'configured' => ! empty($pixels['meta_pixel_id']),
                'has_capi' => ! empty($pixels['meta_capi_token']),
                'id' => $pixels['meta_pixel_id'] ?? null,
            ],
            'ga4' => [
                'name' => 'Google Analytics 4',
                'configured' => ! empty($pixels['ga4_measurement_id']),
                'id' => $pixels['ga4_measurement_id'] ?? null,
            ],
            'tiktok' => [
                'name' => 'TikTok Pixel & Events API',
                'configured' => ! empty($pixels['tiktok_pixel_id']),
                'has_api' => ! empty($pixels['tiktok_access_token']),
                'id' => $pixels['tiktok_pixel_id'] ?? null,
            ],
            'gtm' => [
                'name' => 'Google Tag Manager',
                'configured' => ! empty($pixels['gtm_container_id']),
                'id' => $pixels['gtm_container_id'] ?? null,
            ],
            'clarity' => [
                'name' => 'Microsoft Clarity',
                'configured' => ! empty($pixels['clarity_project_id']),
                'id' => $pixels['clarity_project_id'] ?? null,
            ],
        ];

        // Connected AI Bots
        $connectedBots = $currentStore->bots()
            ->get()
            ->map(fn (AiChatbot $bot) => [
                'id' => $bot->id,
                'name' => $bot->name,
                'is_default' => (bool) $bot->pivot->is_store_default,
                'enable_catalog_search' => (bool) $bot->pivot->enable_catalog_search,
                'enable_cart_creation' => (bool) $bot->pivot->enable_cart_creation,
                'enable_order_tracking' => (bool) $bot->pivot->enable_order_tracking,
            ]);

        // Available AI Bots in workspace for connection modal
        $availableBots = AiChatbot::where('workspace_id', $workspaceId)->get(['id', 'name', 'model', 'status']);

        // Linked bank account for settlement
        $bankAccount = $currentStore->bankAccount;

        return Inertia::render('Ecommerce/Stores/Dashboard', [
            'stores' => $stores->map(fn (EcommerceStore $s) => [
                'id' => $s->id,
                'uuid' => $s->uuid,
                'name' => $s->name,
                'slug' => $s->slug,
                'platform' => $s->platform,
                'status' => $s->status,
                'currency' => $s->currency ?: 'NGN',
                'products_count' => $s->products_count ?? 0,
                'orders_count' => $s->orders_count ?? 0,
            ]),
            'currentStore' => [
                'id' => $currentStore->id,
                'uuid' => $currentStore->uuid,
                'name' => $currentStore->name,
                'slug' => $currentStore->slug,
                'platform' => $currentStore->platform,
                'domain' => $currentStore->domain,
                'currency' => $currentStore->currency ?: 'NGN',
                'support_email' => $currentStore->support_email,
                'support_phone' => $currentStore->support_phone,
                'brand_color' => $currentStore->brand_color ?: '#0D9488',
                'logo_url' => $currentStore->logo_url,
                'banner_url' => $currentStore->banner_url,
                'description' => $currentStore->description,
                'status' => $currentStore->status,
                'published_at' => $currentStore->published_at?->format('M d, Y'),
                'is_published' => $currentStore->isPublished(),
                'seo_meta' => $currentStore->seo_meta,
                'marketing_pixels' => $currentStore->marketing_pixels,
                'policies' => $currentStore->policies,
                'store_url' => $currentStore->slug ? route('public.checkout.show', ['slug' => $currentStore->slug]) : null,
                'wizard_url' => route('client.ecommerce.stores.wizard.edit', ['store' => $currentStore->uuid]),
            ],
            'stats' => [
                'total_revenue' => $totalRevenue,
                'total_orders' => $totalOrders,
                'total_products' => $totalProducts,
                'total_customers' => $totalCustomers,
                'conversion_rate' => $totalProducts > 0 ? round(($totalOrders / max(1, $totalProducts * 10)) * 100, 1) : 0,
            ],
            'recentOrders' => $recentOrders,
            'topProducts' => $topProducts,
            'pixelHealth' => $pixelHealth,
            'connectedBots' => $connectedBots,
            'availableBots' => $availableBots,
            'bankAccount' => $bankAccount ? [
                'id' => $bankAccount->id,
                'bank_name' => $bankAccount->bank_name,
                'account_number' => $bankAccount->account_number,
                'account_name' => $bankAccount->account_name,
            ] : null,
        ]);
    }
}

