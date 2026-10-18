<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AppSumoLicense extends Model
{
    use HasFactory;

    protected $table = 'appsumo_licenses';

    public const STATUS_UNREDEEMED = 'unredeemed';
    public const STATUS_REDEEMED = 'redeemed';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_REVOKED = 'revoked';
    public const STATUS_DISABLED = 'disabled';

    protected $fillable = [
        'code',
        'code_hash',
        'tier',
        'plan_id',
        'status',
        'redeemed_by',
        'client_id',
        'redeemed_at',
        'ip_address',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'redeemed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public static function normalizeCode(string $code): string
    {
        return strtoupper(trim(preg_replace('/\s+/', '', $code)));
    }

    public static function hashCode(string $code): string
    {
        return hash('sha256', static::normalizeCode($code));
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function redeemedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'redeemed_by');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(LicenseEvent::class, 'license_id');
    }

    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_UNREDEEMED;
    }

    public function isRedeemed(): bool
    {
        return $this->status === self::STATUS_REDEEMED;
    }

    public function isRefunded(): bool
    {
        return $this->status === self::STATUS_REFUNDED;
    }

    public function isRevoked(): bool
    {
        return $this->status === self::STATUS_REVOKED;
    }

    public function maskedCode(): string
    {
        $code = $this->code;
        if (strlen($code) <= 8) {
            return str_repeat('•', max(1, strlen($code) - 2)) . substr($code, -2);
        }

        return substr($code, 0, 7) . '••••-••••-' . substr($code, -4);
    }
}

