<?php

namespace App\Modules\Blog\Services;

use App\Modules\Blog\Models\BlogPost;
use App\Modules\Blog\Models\BlogCategory;
use App\Modules\Blog\Models\BlogTag;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class BlogService
{
    /**
     * Get related articles for a given post based on category and tags.
     */
    public function getRelatedPosts(BlogPost $post, int $limit = 3): Collection
    {
        $tagIds = $post->tags->pluck('id')->toArray();

        return BlogPost::published()
            ->where('id', '!=', $post->id)
            ->where(function ($query) use ($post, $tagIds) {
                $query->where('category_id', $post->category_id);
                if (! empty($tagIds)) {
                    $query->orWhereHas('tags', fn ($q) => $q->whereIn('blog_tags.id', $tagIds));
                }
            })
            ->with(['category', 'author'])
            ->latest('published_at')
            ->take($limit)
            ->get();
    }

    /**
     * Get popular categories with active post counts.
     */
    public function getCategoriesWithCounts(): Collection
    {
        return Cache::remember('blog_categories_with_counts', 3600, function () {
            return BlogCategory::where('is_active', true)
                ->withCount(['posts' => fn ($q) => $q->published()])
                ->orderBy('order')
                ->get();
        });
    }

    /**
     * Get active tag cloud.
     */
    public function getPopularTags(int $limit = 15): Collection
    {
        return Cache::remember('blog_popular_tags', 3600, function () use ($limit) {
            return BlogTag::withCount(['posts' => fn ($q) => $q->published()])
                ->having('posts_count', '>', 0)
                ->orderByDesc('posts_count')
                ->take($limit)
                ->get();
        });
    }
}

