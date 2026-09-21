<?php

namespace App\Modules\Ecommerce\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $workspace_id
 * @property int $wallet_id
 * @property string $entry_type
 * @property int $amount_cents
 * @property int $fee_cents
 * @property int $net_amount_cents
 * @property int $running_balance_cents
 * @property string $currency
 * @property string|null $reference_type
 * @property int|null $reference_id
 * @property string|null $description
 */
class MerchantLedgerEntry extends Model
{
    protected $table = 'merchant_ledger_entries';

    public const TYPE_SALE_CREDIT = 'sale_credit';
    public const TYPE_PLATFORM_FEE_DEBIT = 'platform_fee_debit';
    public const TYPE_PAYOUT_DEBIT = 'payout_debit';
    public const TYPE_REFUND_DEBIT = 'refund_debit';
    public const TYPE_ADJUSTMENT = 'adjustment';

    protected $fillable = [
        'workspace_id', 'wallet_id', 'entry_type', 'amount_cents', 'fee_cents',
        'net_amount_cents', 'running_balance_cents', 'currency', 'reference_type',
        'reference_id', 'description',
    ];

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'fee_cents' => 'integer',
            'net_amount_cents' => 'integer',
            'running_balance_cents' => 'integer',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(MerchantWallet::class, 'wallet_id');
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount_cents / 100, 2);
    }

    public function getFormattedFeeAttribute(): string
    {
        return number_format($this->fee_cents / 100, 2);
    }

    public function getFormattedNetAmountAttribute(): string
    {
        return number_format($this->net_amount_cents / 100, 2);
    }

    public function getFormattedRunningBalanceAttribute(): string
    {
        return number_format($this->running_balance_cents / 100, 2);
    }
}
