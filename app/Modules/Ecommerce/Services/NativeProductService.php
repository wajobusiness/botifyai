<?php

namespace App\Modules\Ecommerce\Services;

use App\Modules\Ecommerce\Models\EcommerceDigitalAsset;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Services\StorageManager;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NativeProductService
{
    public function __construct(
        private StorageManager $storageManager
    ) {}

    /**
     * Create a native digital or physical product.
     *
     * @param  array<string, mixed>  $data
     */
    public function createProduct(int $workspaceId, array $data, ?UploadedFile $digitalFile = null, ?UploadedFile $coverImage = null): EcommerceProduct
    {
        return DB::transaction(function () use ($workspaceId, $data, $digitalFile, $coverImage) {
            $store = EcommerceStore::getOrCreateNativeStore($workspaceId);

            // Handle cover image if uploaded
            $imageUrl = $data['image_url'] ?? null;
            if ($coverImage) {
                $disk = $this->storageManager->disk();
                $filename = 'cover_'.Str::random(20).'.'.$coverImage->getClientOriginalExtension();
                $path = "workspaces/{$workspaceId}/products/covers/{$filename}";
                $disk->put($path, file_get_contents($coverImage->getRealPath()));
                $imageUrl = $disk->url($path);
            }

            // Slug uniqueness
            $name = trim((string) $data['name']);
            $baseSlug = ! empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($name);
            $slug = $baseSlug;
            $counter = 1;
            while (EcommerceProduct::where('slug', $slug)->exists()) {
                $slug = $baseSlug.'-'.$counter++;
            }

            $product = EcommerceProduct::create([
                'workspace_id' => $workspaceId,
                'store_id' => $store->id,
                'external_id' => (string) Str::uuid(),
                'platform' => 'native',
                'name' => $name,
                'slug' => $slug,
                'product_type' => $data['product_type'] ?? 'digital',
                'description' => $data['description'] ?? null,
                'sku' => $data['sku'] ?? null,
                'price' => (float) ($data['price'] ?? 0),
                'compare_at_price' => ! empty($data['compare_at_price']) ? (float) $data['compare_at_price'] : null,
                'currency' => strtoupper((string) ($data['currency'] ?? $store->currency ?? 'NGN')),
                'inventory_quantity' => $data['inventory_quantity'] ?? null,
                'status' => 'active',
                'is_published' => (bool) ($data['is_published'] ?? true),
                'affiliate_enabled' => (bool) ($data['affiliate_enabled'] ?? false),
                'affiliate_commission_percentage' => isset($data['affiliate_commission_percentage']) && $data['affiliate_commission_percentage'] !== ''
                    ? (float) $data['affiliate_commission_percentage']
                    : null,
                'image_url' => $imageUrl,
            ]);

            // Handle digital asset
            if ($product->product_type === 'digital') {
                $assetType = $data['asset_type'] ?? ($digitalFile ? 'file_upload' : 'redirect_url');

                if ($assetType === 'file_upload' && $digitalFile) {
                    $disk = $this->storageManager->disk();
                    $fileHash = Str::random(32);
                    $ext = $digitalFile->getClientOriginalExtension();
                    $storagePath = "private/digital_products/{$workspaceId}/{$fileHash}.{$ext}";

                    $disk->put($storagePath, file_get_contents($digitalFile->getRealPath()));

                    EcommerceDigitalAsset::create([
                        'workspace_id' => $workspaceId,
                        'product_id' => $product->id,
                        'asset_type' => 'file_upload',
                        'file_path' => $storagePath,
                        'file_name' => $digitalFile->getClientOriginalName(),
                        'file_size_bytes' => $digitalFile->getSize(),
                        'mime_type' => $digitalFile->getMimeType(),
                    ]);
                } elseif ($assetType === 'redirect_url' && ! empty($data['external_redirect_url'])) {
                    EcommerceDigitalAsset::create([
                        'workspace_id' => $workspaceId,
                        'product_id' => $product->id,
                        'asset_type' => 'redirect_url',
                        'external_redirect_url' => $data['external_redirect_url'],
                    ]);
                }
            }

            return $product;
        });
    }

    /**
     * Update an existing product.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateProduct(EcommerceProduct $product, array $data, ?UploadedFile $digitalFile = null, ?UploadedFile $coverImage = null): EcommerceProduct
    {
        return DB::transaction(function () use ($product, $data, $digitalFile, $coverImage) {
            $workspaceId = $product->workspace_id;

            if ($coverImage) {
                $disk = $this->storageManager->disk();
                $filename = 'cover_'.Str::random(20).'.'.$coverImage->getClientOriginalExtension();
                $path = "workspaces/{$workspaceId}/products/covers/{$filename}";
                $disk->put($path, file_get_contents($coverImage->getRealPath()));
                $data['image_url'] = $disk->url($path);
            }

            if (! empty($data['slug']) && $data['slug'] !== $product->slug) {
                $baseSlug = Str::slug($data['slug']);
                $slug = $baseSlug;
                $counter = 1;
                while (EcommerceProduct::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                    $slug = $baseSlug.'-'.$counter++;
                }
                $data['slug'] = $slug;
            }

            $product->update([
                'name' => $data['name'] ?? $product->name,
                'slug' => $data['slug'] ?? $product->slug,
                'description' => array_key_exists('description', $data) ? $data['description'] : $product->description,
                'price' => isset($data['price']) ? (float) $data['price'] : $product->price,
                'compare_at_price' => array_key_exists('compare_at_price', $data) ? ($data['compare_at_price'] ? (float) $data['compare_at_price'] : null) : $product->compare_at_price,
                'currency' => isset($data['currency']) ? strtoupper((string) $data['currency']) : $product->currency,
                'is_published' => isset($data['is_published']) ? (bool) $data['is_published'] : $product->is_published,
                'affiliate_enabled' => array_key_exists('affiliate_enabled', $data) ? (bool) $data['affiliate_enabled'] : $product->affiliate_enabled,
                'affiliate_commission_percentage' => array_key_exists('affiliate_commission_percentage', $data)
                    ? ($data['affiliate_commission_percentage'] !== null && $data['affiliate_commission_percentage'] !== '' ? (float) $data['affiliate_commission_percentage'] : null)
                    : $product->affiliate_commission_percentage,
                'image_url' => $data['image_url'] ?? $product->image_url,
            ]);

            // Handle digital asset replacement
            if ($product->product_type === 'digital') {
                $asset = $product->digitalAsset;
                $assetType = $data['asset_type'] ?? ($asset?->asset_type ?: 'file_upload');

                if ($digitalFile) {
                    $disk = $this->storageManager->disk();
                    if ($asset && $asset->file_path && $disk->exists($asset->file_path)) {
                        $disk->delete($asset->file_path);
                    }

                    $fileHash = Str::random(32);
                    $ext = $digitalFile->getClientOriginalExtension();
                    $storagePath = "private/digital_products/{$workspaceId}/{$fileHash}.{$ext}";
                    $disk->put($storagePath, file_get_contents($digitalFile->getRealPath()));

                    if ($asset) {
                        $asset->update([
                            'asset_type' => 'file_upload',
                            'file_path' => $storagePath,
                            'file_name' => $digitalFile->getClientOriginalName(),
                            'file_size_bytes' => $digitalFile->getSize(),
                            'mime_type' => $digitalFile->getMimeType(),
                            'external_redirect_url' => null,
                        ]);
                    } else {
                        EcommerceDigitalAsset::create([
                            'workspace_id' => $workspaceId,
                            'product_id' => $product->id,
                            'asset_type' => 'file_upload',
                            'file_path' => $storagePath,
                            'file_name' => $digitalFile->getClientOriginalName(),
                            'file_size_bytes' => $digitalFile->getSize(),
                            'mime_type' => $digitalFile->getMimeType(),
                        ]);
                    }
                } elseif ($assetType === 'redirect_url' && ! empty($data['external_redirect_url'])) {
                    if ($asset) {
                        $asset->update([
                            'asset_type' => 'redirect_url',
                            'external_redirect_url' => $data['external_redirect_url'],
                        ]);
                    } else {
                        EcommerceDigitalAsset::create([
                            'workspace_id' => $workspaceId,
                            'product_id' => $product->id,
                            'asset_type' => 'redirect_url',
                            'external_redirect_url' => $data['external_redirect_url'],
                        ]);
                    }
                }
            }

            return $product;
        });
    }
}
