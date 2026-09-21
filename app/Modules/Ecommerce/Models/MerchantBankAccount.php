<?php

namespace App\Modules\Ecommerce\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $workspace_id
 * @property string $bank_name
 * @property string|null $bank_code
 * @property string $account_number
 * @property string $account_name
 * @property string|null $recipient_code
 * @property string $currency
 * @property bool $is_default
 */
class MerchantBankAccount extends Model
{
    protected $table = 'merchant_bank_accounts';

    protected $fillable = [
        'workspace_id', 'bank_name', 'bank_code', 'account_number',
        'account_name', 'recipient_code', 'currency', 'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /**
     * Mask account number for secure display (e.g. ******1234).
     */
    public function getMaskedAccountNumberAttribute(): string
    {
        $len = strlen($this->account_number);
        if ($len <= 4) {
            return $this->account_number;
        }

        return str_repeat('*', $len - 4).substr($this->account_number, -4);
    }
}
