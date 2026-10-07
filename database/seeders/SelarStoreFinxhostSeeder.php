<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workspace;
use App\Modules\Ecommerce\Models\EcommerceDigitalAsset;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SelarStoreFinxhostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $targetEmail = 'femiwale38@gmail.com';
        $user = User::where('email', $targetEmail)->first();

        if (! $user) {
            $user = User::first();
        }

        if (! $user) {
            $this->command->error("No valid user found to attach products to.");
            return;
        }

        $workspaceId = (int) ($user->current_workspace_id ?? $user->workspace_id);
        if (! $workspaceId) {
            $workspace = Workspace::where('owner_id', $user->id)->first() ?? Workspace::create([
                'owner_id' => $user->id,
                'name' => ($user->name ?: 'My')."'s Workspace",
                'currency_code' => 'NGN',
            ]);
            $workspaceId = $workspace->id;
            $user->update(['workspace_id' => $workspaceId]);
        }

        $store = EcommerceStore::getOrCreateNativeStore($workspaceId, 'FINXHOST STORE');
        $store->name = 'FINXHOST STORE';
        $store->slug = 'finxhost-store';
        $store->status = 'connected';
        $store->currency = 'NGN';
        $store->published_at = $store->published_at ?? now();
        $store->save();

        $dataPath = database_path('data/selar_finxhost_products.json');
        if (! file_exists($dataPath)) {
            $this->command->error("Data file not found at: {$dataPath}");
            return;
        }

        $products = json_decode(file_get_contents($dataPath), true);
        $this->command->info("Starting import of ".count($products)." products into Store #{$store->id} (User: {$user->email})...");

        $created = 0;
        $updated = 0;

        foreach ($products as $p) {
            DB::transaction(function () use ($workspaceId, $store, $p, &$created, &$updated) {
                $externalId = $p['external_id'];
                
                $existing = EcommerceProduct::where('workspace_id', $workspaceId)
                    ->where(function ($q) use ($externalId) {
                        $q->where('external_id', $externalId)
                          ->orWhere('custom_fields->source_product_code', $externalId);
                    })->first();

                if ($existing) {
                    $existing->update([
                        'name' => $p['name'],
                        'price' => $p['price'],
                        'compare_at_price' => $p['compare_at_price'],
                        'currency' => $p['currency'],
                        'product_type' => $p['product_type'],
                        'description' => $p['description'],
                        'image_url' => $p['image_url'],
                        'status' => 'active',
                        'is_published' => true,
                        'custom_fields' => $p['custom_fields'],
                    ]);

                    EcommerceDigitalAsset::updateOrCreate(
                        ['product_id' => $existing->id],
                        [
                            'workspace_id' => $workspaceId,
                            'asset_type' => 'redirect_url',
                            'external_redirect_url' => $p['external_redirect_url'],
                        ]
                    );

                    $updated++;
                } else {
                    $baseSlug = Str::slug($p['name']);
                    $slug = $baseSlug;
                    $c = 1;
                    while (EcommerceProduct::where('slug', $slug)->exists()) {
                        $slug = $baseSlug.'-'.$c++;
                    }

                    $product = EcommerceProduct::create([
                        'workspace_id' => $workspaceId,
                        'store_id' => $store->id,
                        'external_id' => $externalId,
                        'platform' => 'selar',
                        'name' => $p['name'],
                        'slug' => $slug,
                        'product_type' => $p['product_type'],
                        'description' => $p['description'],
                        'price' => $p['price'],
                        'compare_at_price' => $p['compare_at_price'],
                        'currency' => $p['currency'],
                        'status' => 'active',
                        'is_published' => true,
                        'affiliate_enabled' => false,
                        'affiliate_commission_percentage' => 15.0,
                        'image_url' => $p['image_url'],
                        'custom_fields' => $p['custom_fields'],
                    ]);

                    EcommerceDigitalAsset::create([
                        'workspace_id' => $workspaceId,
                        'product_id' => $product->id,
                        'asset_type' => 'redirect_url',
                        'external_redirect_url' => $p['external_redirect_url'],
                    ]);

                    $created++;
                }
            });
        }

        $this->command->info("Migration completed! Created: {$created}, Updated: {$updated}.");
    }
}
