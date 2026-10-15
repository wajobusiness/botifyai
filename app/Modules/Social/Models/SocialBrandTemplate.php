<?php

namespace App\Modules\Social\Models;

use Illuminate\Database\Eloquent\Model;

class SocialBrandTemplate extends Model
{
    protected $table = 'social_brand_templates';

    protected $fillable = [
        'workspace_id',
        'slug',
        'name',
        'category',
        'aspect_ratio',
        'width',
        'height',
        'definition_json',
        'preview_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'definition_json' => 'array',
            'is_active' => 'boolean',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }
}

