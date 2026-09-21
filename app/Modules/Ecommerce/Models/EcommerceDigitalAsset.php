<?php

namespace App\Modules\Ecommerce\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $workspace_id
 * @property int $product_id
 * @property string $asset_type
 * @property string|null $file_path
 * @property string|null $file_name
 * @property int|null $file_size_bytes
 * @property string|null $mime_type
 * @property string|null $external_redirect_url
 */
class EcommerceDigitalAsset extends Model
{
    protected $table = 'ecommerce_digital_assets';

    protected $fillable = [
        'workspace_id', 'product_id', 'asset_type', 'file_path', 'file_name',
        'file_size_bytes', 'mime_type', 'external_redirect_url',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(EcommerceProduct::class, 'product_id');
    }

    public function downloadTokens(): HasMany
    {
        return $this->hasMany(EcommerceDownloadToken::class, 'digital_asset_id');
    }

    /**
     * Get a human-readable file size string.
     */
    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = $this->file_size_bytes ?? 0;
        if ($bytes <= 0) {
            return '0 B';
        }
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = (int) floor(log($bytes, 1024));

        return round($bytes / pow(1024, $i), 2).' '.$units[$i];
    }
}
