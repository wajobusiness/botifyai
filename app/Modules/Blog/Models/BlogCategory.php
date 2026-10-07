<?php

namespace App\Modules\Blog\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class BlogCategory extends Model
{
    use HasFactory;

    protected $table = 'blog_categories';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'order',
        'is_active',
    ];

    protected $casts = [
        'order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(BlogPost::class, 'category_id');
    }

    public function publishedPosts(): HasMany
    {
        return $this->posts()
            ->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    protected static function booted(): void
    {
        static::saving(function (BlogCategory $category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });

        static::saved(function () {
            \App\Http\Controllers\Seo\SitemapController::clearCache();
        });

        static::deleted(function () {
            \App\Http\Controllers\Seo\SitemapController::clearCache();
        });
    }
}

