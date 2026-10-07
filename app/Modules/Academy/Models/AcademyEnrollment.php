<?php

namespace App\Modules\Academy\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyEnrollment extends Model
{
    protected $table = 'academy_enrollments';

    protected $fillable = [
        'user_id',
        'course_id',
        'last_lesson_id',
        'progress_percentage',
        'completed_at',
        'last_accessed_at',
    ];

    protected function casts(): array
    {
        return [
            'progress_percentage' => 'decimal:2',
            'completed_at' => 'datetime',
            'last_accessed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(AcademyCourse::class, 'course_id');
    }

    public function lastLesson(): BelongsTo
    {
        return $this->belongsTo(AcademyLesson::class, 'last_lesson_id');
    }
}
