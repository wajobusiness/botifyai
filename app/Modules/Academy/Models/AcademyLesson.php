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

    public static function parseYouTubeId(?string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        $trimmed = trim($url);

        // If it's already an 11-char ID
        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $trimmed)) {
            return $trimmed;
        }

        // Match all standard YouTube URL patterns (watch, embed, shorts, youtu.be, youtube-nocookie)
        if (preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?|shorts)/|.*[?&]v=)|youtu\.be/)([^"&?/\s]{11})%i', $trimmed, $match)) {
            return $match[1];
        }

        return null;
    }

    protected static function booted(): void
    {
        static::saving(function (AcademyLesson $lesson) {
            if (! empty($lesson->youtube_video_url)) {
                $extracted = self::parseYouTubeId($lesson->youtube_video_url);
                if ($extracted) {
                    $lesson->youtube_video_id = $extracted;
                }
            } elseif (! empty($lesson->youtube_video_id)) {
                $extracted = self::parseYouTubeId($lesson->youtube_video_id);
                if ($extracted) {
                    $lesson->youtube_video_id = $extracted;
                    if (empty($lesson->youtube_video_url)) {
                        $lesson->youtube_video_url = "https://www.youtube.com/watch?v={$extracted}";
                    }
                }
            }
        });
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
