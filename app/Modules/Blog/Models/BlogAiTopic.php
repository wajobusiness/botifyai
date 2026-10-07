<?php

namespace App\Modules\Blog\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlogAiTopic extends Model
{
    use HasFactory;

    protected $table = 'blog_ai_topics';

    protected $fillable = [
        'topic_title',
        'cluster_category',
        'search_intent',
        'difficulty_score',
        'target_keywords',
        'outline',
        'status',
        'generated_post_id',
    ];

    protected $casts = [
        'difficulty_score' => 'integer',
        'target_keywords' => 'array',
        'outline' => 'array',
    ];

    public function generatedPost(): BelongsTo
    {
        return $this->belongsTo(BlogPost::class, 'generated_post_id');
    }
}

