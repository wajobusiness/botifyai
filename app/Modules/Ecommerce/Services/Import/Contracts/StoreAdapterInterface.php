<?php

namespace App\Modules\Ecommerce\Services\Import\Contracts;

interface StoreAdapterInterface
{
    /**
     * Get the identifier name of this store adapter (e.g., 'selar', 'shopify', 'gumroad').
     */
    public function getPlatformName(): string;

    /**
     * Discover and extract all raw product data from the external store.
     *
     * @return array<int, array<string, mixed>>
     */
    public function extractProducts(string $storeUrl): array;

    /**
     * Normalize raw extracted product data into BotifyAI's standard product schema.
     *
     * @param  array<string, mixed>  $rawProduct
     * @return array<string, mixed>
     */
    public function normalizeProduct(array $rawProduct): array;
}
