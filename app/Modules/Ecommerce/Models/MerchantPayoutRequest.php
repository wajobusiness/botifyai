<?php

namespace App\Modules\Ecommerce\Models;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $workspace_id
 * @property int $wallet_id
 * @property int|null $bank_account_id
 * @property int $amount_cents
 * @property string $currency
 * @property string $status
 * @property string $reference
 * @property string|null $batch_id
 * @property string|null $rejection_reason
 * @property Carbon|null $processed_at
 * @property int|null $processed_by
 */
class MerchantPayoutRequest extends Model
{
    protected $table = 'merchant_payout_requests';

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'workspace_id', 'wallet_id', 'bank_account_id', 'amount_cents',
        'currency', 'status', 'reference', 'batch_id', 'rejection_reason',
        'processed_at', 'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'processed_at' => 'datetime',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(MerchantWallet::class, 'wallet_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(MerchantBankAccount::class, 'bank_account_id');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount_cents / 100, 2);
    }

    protected static function booted(): void
    {
        static::creating(function (self $request) {
            if (empty($request->reference)) {
                $request->reference = 'PAY-'.strtoupper(Str::random(10));
            }
        });
    }
}
