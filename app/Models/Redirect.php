<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Redirect extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_path',
        'target_url',
        'status_code',
        'is_active',
        'hit_count',
        'last_accessed_at',
    ];

    protected $casts = [
        'status_code' => 'integer',
        'is_active' => 'boolean',
        'hit_count' => 'integer',
        'last_accessed_at' => 'datetime',
    ];

    /**
     * Normalize source path before saving.
     */
    public function setSourcePathAttribute(string $value): void
    {
        $this->attributes['source_path'] = '/'.ltrim(trim($value), '/');
    }

    /**
     * Record a hit.
     */
    public function recordHit(): void
    {
        $this->increment('hit_count');
        $this->update(['last_accessed_at' => now()]);
    }
}

