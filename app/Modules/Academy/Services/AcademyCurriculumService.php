<?php

namespace App\Modules\Academy\Services;

use App\Modules\Academy\Models\AcademyCategory;
use App\Modules\Academy\Models\AcademyCourse;
use App\Modules\Academy\Models\AcademyEnrollment;
use App\Modules\Academy\Models\AcademyLesson;
use App\Modules\Academy\Models\AcademyProgress;
use Illuminate\Database\Eloquent\Collection;

class AcademyCurriculumService
{
    /**
     * Get published categories with published courses.
     */
    public function getPublishedCurriculum(): Collection
    {
        return AcademyCategory::where('is_active', true)
            ->with(['courses' => fn ($q) => $q->where('is_published', true)->withCount('lessons')])
            ->orderBy('order')
            ->get();
    }

    /**
     * Get course with its modules and lessons.
     */
    public function getCourseBySlug(string $slug): ?AcademyCourse
    {
        return AcademyCourse::where('slug', $slug)
            ->where('is_published', true)
            ->with([
                'category',
                'modules' => fn ($q) => $q->where('is_published', true)->with([
                    'lessons' => fn ($l) => $l->where('is_published', true)->orderBy('order'),
                ])->orderBy('order'),
                'lessons' => fn ($q) => $q->where('is_published', true)->orderBy('order'),
            ])
            ->first();
    }

    /**
     * Track user lesson completion.
     */
    public function markLessonCompleted(int $userId, int $lessonId): AcademyProgress
    {
        $lesson = AcademyLesson::findOrFail($lessonId);

        $progress = AcademyProgress::updateOrCreate(
            ['user_id' => $userId, 'lesson_id' => $lessonId],
            [
                'course_id' => $lesson->course_id,
                'is_completed' => true,
                'completed_at' => now(),
            ]
        );

        $totalLessons = AcademyLesson::where('course_id', $lesson->course_id)->where('is_published', true)->count();
        $completedLessons = AcademyProgress::where('user_id', $userId)
            ->where('course_id', $lesson->course_id)
            ->where('is_completed', true)
            ->count();

        $percentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 100.00;

        AcademyEnrollment::updateOrCreate(
            ['user_id' => $userId, 'course_id' => $lesson->course_id],
            [
                'last_lesson_id' => $lessonId,
                'progress_percentage' => $percentage,
                'last_accessed_at' => now(),
                'completed_at' => $percentage >= 100 ? now() : null,
            ]
        );

        return $progress;
    }
}
