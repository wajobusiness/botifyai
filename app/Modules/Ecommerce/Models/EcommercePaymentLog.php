<?php

namespace App\Modules\Ecommerce\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $order_id
 * @property string $gateway
 * @property string $reference
 * @property string $status
 * @property array|null $payload
 */
class EcommercePaymentLog extends Model
{
    protected $table = 'ecommerce_payment_logs';

    protected $fillable = [
        'workspace_id', 'order_id', 'gateway', 'reference', 'status', 'amount_cents', 'currency', 'error_message', 'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(EcommerceOrder::class, 'order_id');
    }
}
