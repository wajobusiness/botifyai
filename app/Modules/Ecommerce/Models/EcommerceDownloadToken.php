<?php

namespace App\Modules\Ecommerce\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $order_id
 * @property int $product_id
 * @property int|null $digital_asset_id
 * @property string $token
 * @property int $download_count
 * @property int $max_downloads
 * @property Carbon|null $expires_at
 * @property array|null $ip_addresses
 */
class EcommerceDownloadToken extends Model
{
    protected $table = 'ecommerce_download_tokens';

    protected $fillable = [
        'order_id', 'product_id', 'digital_asset_id', 'token',
        'download_count', 'max_downloads', 'expires_at', 'ip_addresses',
    ];

    protected function casts(): array
    {
        return [
            'download_count' => 'integer',
            'max_downloads' => 'integer',
            'expires_at' => 'datetime',
            'ip_addresses' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(EcommerceOrder::class, 'order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(EcommerceProduct::class, 'product_id');
    }

    public function digitalAsset(): BelongsTo
    {
        return $this->belongsTo(EcommerceDigitalAsset::class, 'digital_asset_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function canDownload(): bool
    {
        if ($this->isExpired()) {
            return false;
        }

        if ($this->max_downloads > 0 && $this->download_count >= $this->max_downloads) {
            return false;
        }

        return true;
    }

    public function recordDownload(?string $ip = null): void
    {
        $ips = $this->ip_addresses ?? [];
        if ($ip && ! in_array($ip, $ips, true)) {
            $ips[] = $ip;
        }

        $this->update([
            'download_count' => $this->download_count + 1,
            'ip_addresses' => $ips,
        ]);
    }

    protected static function booted(): void
    {
        static::creating(function (self $token) {
            if (empty($token->token)) {
                $token->token = Str::random(40).bin2hex(random_bytes(12));
            }
            if (empty($token->expires_at)) {
                $token->expires_at = now()->addHours(72);
            }
        });
    }
}
