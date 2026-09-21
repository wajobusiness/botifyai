<?php

namespace App\Modules\Ecommerce\Models;

use App\Modules\Shared\Models\Contact;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property int $workspace_id
 * @property int $store_id
 * @property int|null $contact_id
 * @property string|null $customer_name
 * @property string|null $customer_email
 * @property string|null $customer_phone
 * @property string $external_order_id
 * @property string $platform
 * @property string|null $number
 * @property string|null $status
 * @property string|null $financial_status
 * @property string|null $fulfillment_status
 * @property string $currency
 * @property float $total
 * @property int $platform_fee_cents
 * @property int $merchant_net_cents
 * @property string|null $payment_gateway
 * @property string|null $payment_reference
 * @property array<int, mixed>|null $line_items
 * @property \Carbon\Carbon|null $placed_at
 * @property \Carbon\Carbon|null $paid_at
 */
class EcommerceOrder extends Model
{
    protected $table = 'ecommerce_orders';

    protected $fillable = [
        'uuid', 'workspace_id', 'store_id', 'contact_id', 'customer_name',
        'customer_email', 'customer_phone', 'external_order_id', 'platform',
        'number', 'status', 'financial_status', 'fulfillment_status', 'currency',
        'total', 'platform_fee_cents', 'merchant_net_cents', 'payment_gateway',
        'payment_reference', 'line_items', 'tracking_url', 'tracking_number',
        'placed_at', 'paid_at', 'raw',
    ];

    /** `raw` holds the full platform payload incl. customer PII — never serialize it. */
    protected $hidden = ['raw'];

    protected function casts(): array
    {
        return [
            'line_items' => 'array',
            'raw' => 'array',
            'total' => 'decimal:2',
            'platform_fee_cents' => 'integer',
            'merchant_net_cents' => 'integer',
            'placed_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(EcommerceStore::class, 'store_id');
    }

    public function downloadTokens(): HasMany
    {
        return $this->hasMany(EcommerceDownloadToken::class, 'order_id');
    }

    public function isPaid(): bool
    {
        return $this->financial_status === 'paid' || $this->paid_at !== null;
    }

    protected static function booted(): void
    {
        static::creating(function (self $order) {
            if (empty($order->uuid)) {
                $order->uuid = (string) Str::uuid();
            }
            if (empty($order->number)) {
                $order->number = 'ORD-'.strtoupper(Str::random(8));
            }
            if (empty($order->external_order_id)) {
                $order->external_order_id = $order->uuid;
            }
            if (empty($order->placed_at)) {
                $order->placed_at = now();
            }
        });
    }
}
