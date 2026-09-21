<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'symbol',
        'decimals',
        'exchange_rate',
        'is_default',
        'enabled',
    ];

    protected function casts(): array
    {
        return [
            'exchange_rate' => 'decimal:8',
            'is_default' => 'boolean',
            'enabled' => 'boolean',
            'decimals' => 'integer',
        ];
    }

    public static function defaultCode(): ?string
    {
        $default = static::where('is_default', true)->where('enabled', true)->first();

        return $default?->code;
    }

    /**
     * Standard ISO currency symbol mapping fallback.
     */
    public static function standardSymbol(?string $code): string
    {
        return match (strtoupper(trim((string) $code))) {
            'NGN' => '₦',
            'EUR' => '€',
            'GBP' => '£',
            'BDT' => '৳',
            'INR' => '₹',
            'JPY', 'CNY' => '¥',
            'GHS' => 'GH₵',
            'KES' => 'KSh',
            'ZAR' => 'R',
            'BRL' => 'R$',
            'CAD' => 'CA$',
            'AUD' => 'A$',
            'AED' => 'AED ',
            'SAR' => 'SAR ',
            'USD' => '$',
            default => '$',
        };
    }

    /**
     * Accessor for symbol attribute to ensure proper symbol rendering
     * even if database symbol was omitted or incorrectly defaulted to '$'.
     */
    public function getSymbolAttribute(?string $value): string
    {
        $code = strtoupper((string) ($this->attributes['code'] ?? $this->code ?? ''));
        if (empty($value) || ($value === '$' && $code !== 'USD')) {
            return self::standardSymbol($code);
        }

        return $value;
    }
}
