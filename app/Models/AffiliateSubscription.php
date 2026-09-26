<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $plan_type 'monthly', 'yearly', 'free', 'comped'
 * @property float $amount_paid
 * @property string $currency
 * @property string|null $payment_gateway
 * @property string|null $payment_reference
 * @property string $status 'active', 'expired', 'cancelled', 'pending'
 * @property \Carbon\Carbon|null $started_at
 * @property \Carbon\Carbon|null $expires_at
 * @property bool $auto_renew
 * @property array|null $metadata
 */
class AffiliateSubscription extends Model
{
    protected $table = 'affiliate_subscriptions';

    protected $fillable = [
        'user_id',
        'plan_type',
        'amount_paid',
        'currency',
        'payment_gateway',
        'payment_reference',
        'status',
        'started_at',
        'expires_at',
        'auto_renew',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'auto_renew' => 'boolean',
            'metadata' => 'array',
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this subscription is currently active and not expired.
     */
    public function isActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->expires_at === null) {
            return true;
        }

        return $this->expires_at->isFuture();
    }

    /**
     * Check if this subscription has expired.
     */
    public function isExpired(): bool
    {
        if ($this->status === 'expired' || $this->status === 'cancelled') {
            return true;
        }

        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * Scope query to only active subscriptions.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }
}
