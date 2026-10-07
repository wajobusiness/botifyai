<?php

namespace App\Modules\Ecommerce\Services\Import;

use App\Models\User;
use App\Models\Workspace;
use App\Modules\Ecommerce\Models\EcommerceDigitalAsset;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Ecommerce\Services\Import\Contracts\StoreAdapterInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class ExternalStoreImportService
{
    /**
     * Executes the product import from a configured adapter into the target user's store.
     *
     * @return array<string, mixed>
     */
    public function import(StoreAdapterInterface $adapter, string $storeUrl, User $user, bool $dryRun = false): array
    {
        $report = [
            'store_url' => $storeUrl,
            'platform' => $adapter->getPlatformName(),
            'target_user_id' => $user->id,
            'target_user_email' => $user->email,
            'dry_run' => $dryRun,
            'discovered_count' => 0,
            'created_count' => 0,
            'updated_count' => 0,
            'skipped_count' => 0,
            'failed_count' => 0,
            'products' => [],
            'errors' => [],
            'started_at' => now()->toIso8601String(),
            'completed_at' => null,
        ];

        // 1. Resolve target workspace
        $workspaceId = (int) ($user->current_workspace_id ?? $user->workspace_id);
        if (! $workspaceId) {
            $workspace = Workspace::where('owner_id', $user->id)->first();
            if (! $workspace) {
                if ($dryRun) {
                    $workspaceId = 1;
                } else {
                    $workspace = Workspace::create([
                        'owner_id' => $user->id,
                        'name' => ($user->name ?: 'My')."'s Workspace",
                        'currency_code' => 'NGN',
                    ]);
                    $workspaceId = $workspace->id;
                    $user->update(['workspace_id' => $workspaceId]);
                }
            } else {
                $workspaceId = $workspace->id;
            }
        }

        $report['workspace_id'] = $workspaceId;

        // 2. Resolve native store
        $storeId = null;
        if (! $dryRun) {
            $store = EcommerceStore::getOrCreateNativeStore($workspaceId, 'FINXHOST STORE');
            if (empty($store->slug) || str_contains($storeUrl, 'finxhost')) {
                $store->slug = 'finxhost-store';
                $store->name = 'FINXHOST STORE';
                $store->status = 'connected';
                $store->currency = 'NGN';
                $store->published_at = $store->published_at ?? now();
                $store->save();
            }
            $storeId = $store->id;
            $report['store_id'] = $storeId;
        }

        // 3. Extract products via adapter
        try {
            $rawProducts = $adapter->extractProducts($storeUrl);
        } catch (Throwable $e) {
            $report['errors'][] = 'Extraction failed: '.$e->getMessage();
            $report['completed_at'] = now()->toIso8601String();
            return $report;
        }

        $report['discovered_count'] = count($rawProducts);

        // 4. Process each product
        foreach ($rawProducts as $index => $raw) {
            $normalized = $adapter->normalizeProduct($raw);
            $externalId = $normalized['external_id'];
            $name = $normalized['name'];

            $productLog = [
                'index' => $index + 1,
                'external_id' => $externalId,
                'name' => $name,
                'price' => $normalized['price'],
                'compare_at_price' => $normalized['compare_at_price'],
                'currency' => $normalized['currency'],
                'product_type' => $normalized['product_type'],
                'action' => 'PENDING',
                'error' => null,
            ];

            if ($dryRun) {
                $productLog['action'] = 'DRY_RUN_READY';
                $report['products'][] = $productLog;
                continue;
            }

            try {
                DB::transaction(function () use ($workspaceId, $storeId, $normalized, &$productLog, &$report) {
                    // Check if product already exists (idempotency check by external_id or custom_fields code)
                    $existing = EcommerceProduct::where('workspace_id', $workspaceId)
                        ->where(function ($query) use ($normalized) {
                            $query->where('external_id', $normalized['external_id'])
                                ->orWhere('custom_fields->source_product_code', $normalized['external_id']);
                        })
                        ->first();

                    if ($existing) {
                        // Update existing product without creating duplicate
                        $existing->update([
                            'name' => $normalized['name'],
                            'price' => $normalized['price'],
                            'compare_at_price' => $normalized['compare_at_price'],
                            'currency' => $normalized['currency'],
                            'product_type' => $normalized['product_type'],
                            'description' => $normalized['description'],
                            'image_url' => $normalized['image_url'],
                            'status' => 'active',
                            'is_published' => true,
                            'custom_fields' => $normalized['custom_fields'],
                            'raw' => $normalized['raw'],
                        ]);

                        // Sync digital asset
                        if ($normalized['product_type'] === 'digital') {
                            EcommerceDigitalAsset::updateOrCreate(
                                ['product_id' => $existing->id],
                                [
                                    'workspace_id' => $workspaceId,
                                    'asset_type' => $normalized['asset_type'] ?? 'redirect_url',
                                    'external_redirect_url' => $normalized['external_redirect_url'],
                                ]
                            );
                        }

                        $productLog['action'] = 'UPDATED';
                        $productLog['product_id'] = $existing->id;
                        $productLog['slug'] = $existing->slug;
                        $report['updated_count']++;
                    } else {
                        // Generate unique slug
                        $baseSlug = Str::slug($normalized['name']);
                        $slug = $baseSlug;
                        $counter = 1;
                        while (EcommerceProduct::where('slug', $slug)->exists()) {
                            $slug = $baseSlug.'-'.$counter++;
                        }

                        $created = EcommerceProduct::create([
                            'workspace_id' => $workspaceId,
                            'store_id' => $storeId,
                            'external_id' => $normalized['external_id'],
                            'platform' => $normalized['platform'],
                            'name' => $normalized['name'],
                            'slug' => $slug,
                            'product_type' => $normalized['product_type'],
                            'description' => $normalized['description'],
                            'price' => $normalized['price'],
                            'compare_at_price' => $normalized['compare_at_price'],
                            'currency' => $normalized['currency'],
                            'status' => 'active',
                            'is_published' => true,
                            'affiliate_enabled' => (bool) ($normalized['affiliate_enabled'] ?? false),
                            'affiliate_commission_percentage' => $normalized['affiliate_commission_percentage'] ?? 15.0,
                            'image_url' => $normalized['image_url'],
                            'custom_fields' => $normalized['custom_fields'],
                            'raw' => $normalized['raw'],
                        ]);

                        if ($created->product_type === 'digital') {
                            EcommerceDigitalAsset::create([
                                'workspace_id' => $workspaceId,
                                'product_id' => $created->id,
                                'asset_type' => $normalized['asset_type'] ?? 'redirect_url',
                                'external_redirect_url' => $normalized['external_redirect_url'],
                            ]);
                        }

                        $productLog['action'] = 'CREATED';
                        $productLog['product_id'] = $created->id;
                        $productLog['slug'] = $created->slug;
                        $report['created_count']++;
                    }
                });
            } catch (Throwable $e) {
                $productLog['action'] = 'FAILED';
                $productLog['error'] = $e->getMessage();
                $report['failed_count']++;
                $report['errors'][] = "Product [{$externalId}] {$name} failed: {$e->getMessage()}";
            }

            $report['products'][] = $productLog;
        }

        $report['completed_at'] = now()->toIso8601String();

        return $report;
    }
}
