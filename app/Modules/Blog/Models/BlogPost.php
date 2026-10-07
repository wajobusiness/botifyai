<?php

namespace App\Modules\Blog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class BlogPost extends Model
{
    use HasFactory;

    protected $table = 'blog_posts';

    protected $fillable = [
        'category_id',
        'author_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'featured_image_alt',
        'status',
        'published_at',
        'reading_time_minutes',
        'is_featured',
        'views_count',
        'meta_title',
        'meta_description',
        'focus_keyword',
        'secondary_keywords',
        'canonical_url',
        'og_image',
        'table_of_contents',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'reading_time_minutes' => 'integer',
        'is_featured' => 'boolean',
        'views_count' => 'integer',
        'secondary_keywords' => 'array',
        'table_of_contents' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(BlogCategory::class, 'category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(BlogAuthor::class, 'author_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(BlogTag::class, 'blog_post_tag', 'post_id', 'tag_id');
    }

    /**
     * Scope for published articles visible to the public.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * Scope for featured articles.
     */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope for search querying across title, excerpt, and content.
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (empty($term)) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
                ->orWhere('excerpt', 'like', "%{$term}%")
                ->orWhere('content', 'like', "%{$term}%")
                ->orWhere('focus_keyword', 'like', "%{$term}%");
        });
    }

    public function isPublished(): bool
    {
        return $this->status === 'published' && $this->published_at !== null && $this->published_at->isPast();
    }

    /**
     * Generate canonical URL.
     */
    public function getUrl(): string
    {
        return route('blog.show', ['slug' => $this->slug]);
    }

    /**
     * Calculate reading time in minutes.
     */
    public static function calculateReadingTime(string $content): int
    {
        $wordCount = str_word_count(strip_tags($content));
        return max(1, (int) ceil($wordCount / 200));
    }

    /**
     * Parse HTML headers to generate structured Table of Contents.
     */
    public static function extractTableOfContents(string $html): array
    {
        $toc = [];
        if (empty($html)) {
            return $toc;
        }

        preg_match_all('/<h([2-3])[^>]*>(.*?)<\/h\1>/i', $html, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $level = (int) $match[1];
            $title = strip_tags($match[2]);
            $anchor = Str::slug($title);

            if (! empty($title)) {
                $toc[] = [
                    'level' => $level,
                    'title' => html_entity_decode($title, ENT_QUOTES | ENT_HTML5),
                    'anchor' => $anchor,
                ];
            }
        }

        return $toc;
    }

    protected static function booted(): void
    {
        static::saving(function (BlogPost $post) {
            if (empty($post->slug)) {
                $post->slug = Str::slug($post->title);
            }

            // Auto-calculate reading time if not explicitly provided
            if (empty($post->reading_time_minutes) && ! empty($post->content)) {
                $post->reading_time_minutes = self::calculateReadingTime($post->content);
            }

            // Auto-generate TOC if empty
            if (empty($post->table_of_contents) && ! empty($post->content)) {
                $post->table_of_contents = self::extractTableOfContents($post->content);
            }

            // If status is set to published and published_at is null, set to now
            if ($post->status === 'published' && empty($post->published_at)) {
                $post->published_at = now();
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

