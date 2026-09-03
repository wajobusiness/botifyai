<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class PaymentGatewayConfig extends Model
{
    protected $fillable = ['gateway', 'test_mode', 'enabled', 'credentials'];

    protected function casts(): array
    {
        return [
            'test_mode' => 'boolean',
            'enabled' => 'boolean',
            'credentials' => 'encrypted:array',
        ];
    }

    /**
     * Safely decrypt an encrypted string attribute.
     * Prevents fatal 500 DecryptException crashes if APP_KEY was rotated or ciphertext MAC is invalid.
     *
     * @param  string  $value
     * @return mixed
     */
    protected function fromEncryptedString($value)
    {
        try {
            return parent::fromEncryptedString($value);
        } catch (DecryptException $e) {
            Log::warning("Failed to decrypt PaymentGatewayConfig attribute: {$e->getMessage()}", [
                'gateway' => $this->attributes['gateway'] ?? null,
                'id' => $this->attributes['id'] ?? null,
            ]);

            return null;
        }
    }

    /**
     * Get credentials for the current mode (test or live).
     */
    public function getActiveCredentials(): array
    {
        try {
            $creds = $this->credentials ?? [];
        } catch (\Throwable) {
            return [];
        }

        if (! is_array($creds)) {
            return [];
        }

        $mode = $this->test_mode ? 'test' : 'live';

        return $creds[$mode] ?? [];
    }

    /**
     * Check if this gateway has valid credentials for the active mode.
     */
    public function hasActiveCredentials(): bool
    {
        try {
            $c = $this->getActiveCredentials();

            return ! empty($c['secret_key'] ?? null);
        } catch (\Throwable) {
            return false;
        }
    }

    public static function getByGateway(string $gateway): ?self
    {
        return static::where('gateway', $gateway)->first();
    }
}
