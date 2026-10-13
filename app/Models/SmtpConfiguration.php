<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class SmtpConfiguration extends Model
{
    protected $fillable = [
        'host',
        'port',
        'username',
        'password',
        'encryption',
        'from_email',
        'from_name',
        'is_active',
        'purpose',
        'rate_limit_per_minute',
    ];

    protected function casts(): array
    {
        return [
            'port' => 'integer',
            'is_active' => 'boolean',
            'rate_limit_per_minute' => 'integer',
        ];
    }

    protected $hidden = ['password'];

    public function setPasswordAttribute(?string $value): void
    {
        if ($value === null || $value === '') {
            return;
        }
        $this->attributes['password'] = Crypt::encryptString($value);
    }

    public function getPasswordAttribute(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return $value;
        }
    }

    public function getDecryptedPassword(): ?string
    {
        return $this->password;
    }

    public static function getActive(): ?self
    {
        try {
            return static::where('is_active', true)->first()
                ?? static::whereNotNull('host')->where('host', '!=', '')->orderByDesc('id')->first();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Resolve the preferred SMTP configuration for a specific stream ('transactional' or 'marketing').
     * Prefers an explicit stream match first, then 'both', then any active configuration.
     */
    public static function getActiveFor(string $purpose = 'transactional'): ?self
    {
        try {
            if (\Illuminate\Support\Facades\Schema::hasColumn('smtp_configurations', 'purpose')) {
                $dedicated = static::where('purpose', $purpose)
                    ->orderByDesc('is_active')
                    ->first();
                if ($dedicated) {
                    return $dedicated;
                }
            }
        } catch (\Throwable) {
        }

        return static::getActive();
    }

    /**
     * Whether an active SMTP configuration exists (i.e. the app can send real mail).
     */
    public static function isConfigured(): bool
    {
        return static::getActive() !== null;
    }

    public function getSummaryAttribute(): string
    {
        return "{$this->host}:{$this->port}";
    }

    protected static function booted(): void
    {
        static::saved(function () {
            app(\App\Services\Mail\MailService::class)->syncActiveSmtpToDefaultMailer();
        });

        static::deleted(function () {
            app(\App\Services\Mail\MailService::class)->syncActiveSmtpToDefaultMailer();
        });
    }
}
