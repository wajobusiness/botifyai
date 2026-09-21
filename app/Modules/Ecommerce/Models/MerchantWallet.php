<?php

namespace App\Modules\Ecommerce\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $workspace_id
 * @property string $currency
 * @property int $available_balance_cents
 * @property int $pending_balance_cents
 * @property int $total_withdrawn_cents
 * @property int $total_earned_cents
 * @property bool $is_frozen
 */
class MerchantWallet extends Model
{
    protected $table = 'merchant_wallets';

    protected $fillable = [
        'workspace_id', 'currency', 'available_balance_cents', 'pending_balance_cents',
        'total_withdrawn_cents', 'total_earned_cents', 'is_frozen',
    ];

    protected function casts(): array
    {
        return [
            'available_balance_cents' => 'integer',
            'pending_balance_cents' => 'integer',
            'total_withdrawn_cents' => 'integer',
            'total_earned_cents' => 'integer',
            'is_frozen' => 'boolean',
        ];
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(MerchantLedgerEntry::class, 'wallet_id');
    }

    public function payoutRequests(): HasMany
    {
        return $this->hasMany(MerchantPayoutRequest::class, 'wallet_id');
    }

    /**
     * Get or create a wallet for a workspace and currency.
     */
    public static function getOrCreate(int $workspaceId, string $currency = 'NGN'): self
    {
        return static::firstOrCreate(
            [
                'workspace_id' => $workspaceId,
                'currency' => strtoupper($currency),
            ],
            [
                'available_balance_cents' => 0,
                'pending_balance_cents' => 0,
                'total_withdrawn_cents' => 0,
                'total_earned_cents' => 0,
                'is_frozen' => false,
            ]
        );
    }

    /**
     * Get available balance in standard currency units (e.g. 1500.50).
     */
    public function getAvailableBalanceAttribute(): float
    {
        return $this->available_balance_cents / 100;
    }

    /**
     * Get pending balance in standard currency units.
     */
    public function getPendingBalanceAttribute(): float
    {
        return $this->pending_balance_cents / 100;
    }

    /**
     * Get total withdrawn in standard currency units.
     */
    public function getTotalWithdrawnAttribute(): float
    {
        return $this->total_withdrawn_cents / 100;
    }

    /**
     * Get total earned in standard currency units.
     */
    public function getTotalEarnedAttribute(): float
    {
        return $this->total_earned_cents / 100;
    }
}
