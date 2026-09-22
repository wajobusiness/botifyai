<?php

use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations to ensure all products and stores have non-null slugs.
     */
    public function up(): void
    {
        // Backfill stores
        $stores = EcommerceStore::whereNull('slug')->orWhere('slug', '')->get();
        foreach ($stores as $store) {
            $base = ! empty($store->name) ? Str::slug($store->name) : 'store';
            $store->slug = $base . '-' . Str::random(5);
            $store->saveQuietly();
        }

        // Backfill products
        $products = EcommerceProduct::whereNull('slug')->orWhere('slug', '')->get();
        foreach ($products as $product) {
            $base = ! empty($product->name) ? Str::slug($product->name) : 'product';
            $product->slug = $base . '-' . $product->id;
            $product->saveQuietly();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed
    }
};
