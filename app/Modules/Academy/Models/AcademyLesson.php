<?php

namespace App\Modules\Academy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademyLesson extends Model
{
    protected $table = 'academy_lessons';

    protected $fillable = [
        'course_id',
        'module_id',
        'title',
        'slug',
        'youtube_video_url',
        'youtube_video_id',
        'duration_seconds',
        'description',
        'lesson_notes',
        'resources_json',
        'order',
        'is_published',
        'is_preview',
    ];

    protected function casts(): array
    {
        return [
            'duration_seconds' => 'integer',
            'order' => 'integer',
            'is_published' => 'boolean',
            'is_preview' => 'boolean',
            'resources_json' => 'array',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(AcademyCourse::class, 'course_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(AcademyModule::class, 'module_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(AcademyProgress::class, 'lesson_id');
    }
}
