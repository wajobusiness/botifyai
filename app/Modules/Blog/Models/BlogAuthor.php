<?php

namespace App\Modules\Blog\Models;

use App\Models\AdminUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class BlogAuthor extends Model
{
    use HasFactory;

    protected $table = 'blog_authors';

    protected $fillable = [
        'admin_user_id',
        'name',
        'slug',
        'title_role',
        'avatar_url',
        'bio',
        'email',
        'social_links',
        'is_active',
    ];

    protected $casts = [
        'social_links' => 'array',
        'is_active' => 'boolean',
    ];

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'admin_user_id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(BlogPost::class, 'author_id');
    }

    public function publishedPosts(): HasMany
    {
        return $this->posts()
            ->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    protected static function booted(): void
    {
        static::saving(function (BlogAuthor $author) {
            if (empty($author->slug)) {
                $author->slug = Str::slug($author->name);
            }
        });
    }
}

