<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LicenseEvent extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'license_events';

    public const TYPE_IMPORTED = 'imported';
    public const TYPE_VALIDATED = 'validated';
    public const TYPE_REDEEMED = 'redeemed';
    public const TYPE_STACKED = 'stacked';
    public const TYPE_UPGRADED = 'upgraded';
    public const TYPE_REFUNDED = 'refunded';
    public const TYPE_REVOKED = 'revoked';

    protected $fillable = [
        'license_id',
        'user_id',
        'event_type',
        'ip_address',
        'user_agent',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function license(): BelongsTo
    {
        return $this->belongsTo(AppSumoLicense::class, 'license_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

