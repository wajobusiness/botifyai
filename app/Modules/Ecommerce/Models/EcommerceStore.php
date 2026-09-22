<?php

namespace App\Modules\Ecommerce\Models;

use App\Modules\AI\Models\AiBotStoreConnection;
use App\Modules\AI\Models\AiChatbot;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property int $workspace_id
 * @property string $platform
 * @property string|null $name
 * @property string|null $slug
 * @property string $domain
 * @property string $currency
 * @property string|null $support_email
 * @property string|null $support_phone
 * @property string $brand_color
 * @property string|null $logo_url
 * @property string|null $banner_url
 * @property string|null $description
 * @property array<string, mixed>|null $seo_meta
 * @property array<string, mixed>|null $marketing_pixels
 * @property array<string, mixed>|null $policies
 * @property int|null $bank_account_id
 * @property \Illuminate\Support\Carbon|null $published_at
 * @property array<string, mixed>|null $credentials
 * @property string $status
 * @property array<string, mixed>|null $external_meta
 * @property string|null $webhook_secret
 */
class EcommerceStore extends Model
{
    protected $table = 'ecommerce_stores';

    public const PLATFORMS = ['native', 'shopify', 'woocommerce', 'bigcommerce'];

    protected $fillable = [
        'uuid', 'workspace_id', 'platform', 'name', 'slug', 'domain', 'currency',
        'support_email', 'support_phone', 'brand_color', 'logo_url', 'banner_url',
        'description', 'seo_meta', 'marketing_pixels', 'policies', 'bank_account_id',
        'published_at', 'credentials', 'status', 'external_meta', 'webhook_secret',
        'last_tested_at', 'last_test_status', 'last_test_message', 'customers_synced_at',
        'orders_synced_at', 'products_synced_at',
    ];

    protected $hidden = ['credentials', 'webhook_secret'];

    /** Bind routes (incl. public webhook routes) by uuid, never the sequential id. */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected function casts(): array
    {
        return [
            'credentials' => 'encrypted:array',
            'external_meta' => 'array',
            'seo_meta' => 'array',
            'marketing_pixels' => 'array',
            'policies' => 'array',
            'published_at' => 'datetime',
            'last_tested_at' => 'datetime',
            'customers_synced_at' => 'datetime',
            'orders_synced_at' => 'datetime',
            'products_synced_at' => 'datetime',
        ];
    }

    /**
     * Get or create the native commerce store for a given workspace.
     */
    public static function getOrCreateNativeStore(int $workspaceId, ?string $name = null): self
    {
        return static::firstOrCreate(
            [
                'workspace_id' => $workspaceId,
                'platform' => 'native',
            ],
            [
                'name' => $name ?: 'Botify Store',
                'domain' => 'native',
                'status' => 'connected',
                'currency' => 'NGN',
                'brand_color' => '#0D9488',
                'last_test_status' => 'ok',
            ]
        );
    }

    /**
     * The full inbound webhook URL for a store, including the per-store secret
     * token used as the primary verification gate for external platforms.
     */
    public static function webhookUrlFor(self $store): string
    {
        $name = match ($store->platform) {
            'shopify' => 'webhooks.ecommerce.shopify',
            'bigcommerce' => 'webhooks.ecommerce.bigcommerce',
            default => 'webhooks.ecommerce.woocommerce',
        };

        return route($name, ['store' => $store->getRouteKey()]).'?token='.$store->webhook_secret;
    }

    protected static function booted(): void
    {
        static::creating(function (self $store) {
            if (empty($store->uuid)) {
                $store->uuid = (string) Str::uuid();
            }
            if (empty($store->slug) && ! empty($store->name)) {
                $store->slug = Str::slug($store->name).'-'.Str::random(6);
            }
        });

        // Clean up child resources when a store is removed.
        static::deleting(function (self $store) {
            $store->orders()->delete();
            $store->carts()->delete();
            EcommerceProduct::where('store_id', $store->id)->delete();
        });
    }

    public function orders(): HasMany
    {
        return $this->hasMany(EcommerceOrder::class, 'store_id');
    }

    public function carts(): HasMany
    {
        return $this->hasMany(EcommerceCart::class, 'store_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(EcommerceProduct::class, 'store_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(MerchantBankAccount::class, 'bank_account_id');
    }

    public function botConnections(): HasMany
    {
        return $this->hasMany(AiBotStoreConnection::class, 'store_id');
    }

    public function bots(): BelongsToMany
    {
        return $this->belongsToMany(
            AiChatbot::class,
            'ai_bot_store_connections',
            'store_id',
            'chatbot_id'
        )->withPivot([
            'is_store_default',
            'enable_catalog_search',
            'enable_cart_creation',
            'enable_order_tracking',
        ])->withTimestamps();
    }

    public function defaultBot(): ?AiChatbot
    {
        return $this->bots()->wherePivot('is_store_default', true)->first()
            ?? $this->bots()->first()
            ?? AiChatbot::where('workspace_id', $this->workspace_id)->where('is_default', true)->first()
            ?? AiChatbot::where('workspace_id', $this->workspace_id)->first();
    }

    public function isPublished(): bool
    {
        return $this->status === 'connected' || $this->status === 'published' || $this->published_at !== null;
    }

    public function getMetaTitle(): string
    {
        return $this->seo_meta['meta_title'] ?? $this->name ?? 'BotifyAI Store';
    }

    public function getMetaDescription(): string
    {
        return $this->seo_meta['meta_description'] ?? $this->description ?? 'Discover exclusive digital products, tools, and courses.';
    }

    public function getPixelConfig(string $platform): ?array
    {
        return $this->marketing_pixels[$platform] ?? null;
    }
}
