<?php

namespace App\Modules\Ecommerce\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $workspace_id
 * @property int $store_id
 * @property string $external_id
 * @property string $platform
 * @property string $name
 * @property string|null $slug
 * @property string $product_type
 * @property string|null $description
 * @property string|null $sku
 * @property float $price
 * @property float|null $compare_at_price
 * @property string $currency
 * @property int|null $inventory_quantity
 * @property string|null $status
 * @property bool $is_published
 * @property string|null $image_url
 * @property array|null $custom_fields
 */
class EcommerceProduct extends Model
{
    protected $table = 'ecommerce_products';

    protected $fillable = [
        'workspace_id', 'store_id', 'external_id', 'platform', 'name', 'slug',
        'product_type', 'description', 'sku', 'price', 'compare_at_price', 'currency',
        'inventory_quantity', 'status', 'is_published', 'image_url', 'raw',
        'custom_fields', 'last_seen_at',
    ];

    protected $hidden = ['raw'];

    protected function casts(): array
    {
        return [
            'raw' => 'array',
            'custom_fields' => 'array',
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'inventory_quantity' => 'integer',
            'is_published' => 'boolean',
            'last_seen_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(EcommerceStore::class, 'store_id');
    }

    public function digitalAsset(): HasOne
    {
        return $this->hasOne(EcommerceDigitalAsset::class, 'product_id');
    }

    public function downloadTokens(): HasMany
    {
        return $this->hasMany(EcommerceDownloadToken::class, 'product_id');
    }

    /**
     * Get the public buy/checkout URL for this product.
     */
    public function getCheckoutUrl(): string
    {
        if (! empty($this->slug)) {
            return url('/buy/'.$this->slug);
        }

        return url('/buy/p-'.$this->id);
    }

    protected static function booted(): void
    {
        static::creating(function (self $product) {
            if (empty($product->slug) && ! empty($product->name)) {
                $base = Str::slug($product->name);
                $slug = $base;
                $i = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = $base.'-'.$i++;
                }
                $product->slug = $slug;
            }
            if (empty($product->external_id)) {
                $product->external_id = (string) Str::uuid();
            }
            if (empty($product->platform)) {
                $product->platform = 'native';
            }
        });

        static::deleting(function (self $product) {
            $product->digitalAsset()->delete();
            $product->downloadTokens()->delete();
        });
    }
}
