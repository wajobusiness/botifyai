<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /** Inventory at or below this is flagged as low stock. */
    public const LOW_STOCK_THRESHOLD = 5;

    public function index(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);
        $nativeStore = EcommerceStore::getOrCreateNativeStore($workspaceId);

        $query = EcommerceProduct::with(['digitalAsset', 'store'])
            ->where('ecommerce_products.workspace_id', $workspaceId)
            ->when($request->input('store_id'), fn ($q, $id) => $q->where('store_id', $id))
            ->when($request->input('platform'), fn ($q, $p) => $q->where('platform', $p))
            ->when($request->input('search'), fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$s}%")
                ->orWhere('sku', 'like', "%{$s}%")
                ->orWhere('slug', 'like', "%{$s}%")))
            ->when($request->boolean('low_stock'), fn ($q) => $q
                ->whereNotNull('inventory_quantity')
                ->where('inventory_quantity', '<=', self::LOW_STOCK_THRESHOLD));

        $products = (clone $query)
            ->orderByDesc('id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (EcommerceProduct $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'product_type' => $p->product_type ?: 'digital',
                'sku' => $p->sku,
                'price' => (float) $p->price,
                'compare_at_price' => $p->compare_at_price ? (float) $p->compare_at_price : null,
                'currency' => $p->currency ?: ($p->store?->currency ?: 'NGN'),
                'inventory_quantity' => $p->inventory_quantity,
                'status' => $p->status,
                'is_published' => (bool) $p->is_published,
                'image_url' => $p->image_url,
                'platform' => $p->platform,
                'description' => $p->description,
                'checkout_url' => $p->getCheckoutUrl(),
                'digital_asset' => $p->digitalAsset ? [
                    'id' => $p->digitalAsset->id,
                    'asset_type' => $p->digitalAsset->asset_type,
                    'file_name' => $p->digitalAsset->file_name,
                    'file_size' => $p->digitalAsset->formatted_file_size,
                    'external_redirect_url' => $p->digitalAsset->external_redirect_url,
                ] : null,
            ]);

        return Inertia::render('Ecommerce/Products/Index', [
            'products' => $products,
            'filters' => $request->only('store_id', 'search', 'low_stock', 'platform'),
            'stores' => $this->workspaceStores($workspaceId),
            'nativeStore' => [
                'id' => $nativeStore->id,
                'name' => $nativeStore->name,
                'currency' => $nativeStore->currency,
            ],
            'stats' => [
                'total' => (clone $query)->count(),
                'digital' => EcommerceProduct::where('workspace_id', $workspaceId)->where('product_type', 'digital')->count(),
                'low_stock' => EcommerceProduct::where('workspace_id', $workspaceId)
                    ->whereNotNull('inventory_quantity')
                    ->where('inventory_quantity', '<=', self::LOW_STOCK_THRESHOLD)
                    ->count(),
                'out_of_stock' => EcommerceProduct::where('workspace_id', $workspaceId)
                    ->whereNotNull('inventory_quantity')
                    ->where('inventory_quantity', '<=', 0)
                    ->count(),
            ],
            'lowStockThreshold' => self::LOW_STOCK_THRESHOLD,
        ]);
    }

    /**
     * Lightweight product search for the Inbox "share product" picker (JSON).
     */
    public function search(Request $request): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);
        $q = trim((string) $request->input('q', ''));

        $products = EcommerceProduct::with('store:id,external_meta,currency')
            ->where('workspace_id', $workspaceId)
            ->when($q !== '', fn ($query) => $query->where(fn ($w) => $w
                ->where('name', 'like', "%{$q}%")
                ->orWhere('sku', 'like', "%{$q}%")
                ->orWhere('slug', 'like', "%{$q}%")))
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'store_id', 'name', 'slug', 'product_type', 'sku', 'price', 'currency', 'inventory_quantity', 'status', 'image_url', 'platform'])
            ->map(fn (EcommerceProduct $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'sku' => $p->sku,
                'price' => (float) $p->price,
                'currency' => $p->currency ?: ($p->store?->currency ?: ($p->store?->external_meta['currency'] ?? 'NGN')),
                'inventory_quantity' => $p->inventory_quantity,
                'status' => $p->status,
                'image_url' => $p->image_url,
                'platform' => $p->platform,
                'checkout_url' => $p->getCheckoutUrl(),
            ]);

        return response()->json($products);
    }

    /**
     * @return array<int, array{id: int, name: string, platform: string}>
     */
    private function workspaceStores(int $workspaceId): array
    {
        return EcommerceStore::where('workspace_id', $workspaceId)
            ->get(['id', 'name', 'platform'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'platform' => $s->platform])
            ->all();
    }

    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }
}
