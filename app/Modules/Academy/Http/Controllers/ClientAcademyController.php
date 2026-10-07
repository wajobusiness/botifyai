<?php

namespace App\Modules\Academy\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academy\Models\AcademyCategory;
use App\Modules\Academy\Models\AcademyCourse;
use App\Modules\Academy\Models\AcademyEnrollment;
use App\Modules\Academy\Models\AcademyLesson;
use App\Modules\Academy\Models\AcademyProgress;
use App\Modules\Academy\Services\AcademyCurriculumService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientAcademyController extends Controller
{
    public function __construct(
        protected AcademyCurriculumService $curriculumService
    ) {}

    /**
     * Academy Dashboard: Browse courses, view progress, and continue learning.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $selectedCategory = $request->input('category');
        $search = $request->input('search');

        $categories = AcademyCategory::where('is_active', true)
            ->orderBy('order')
            ->get(['id', 'name', 'slug', 'description', 'icon']);

        $coursesQuery = AcademyCourse::with(['category', 'lessons:id,course_id,duration_seconds,is_published'])
            ->where('is_published', true)
            ->when($selectedCategory, fn ($q, $cat) => $q->whereHas('category', fn ($c) => $c->where('slug', $cat)))
            ->when($search, fn ($q, $s) => $q->where(fn ($w) => $w
                ->where('title', 'like', "%{$s}%")
                ->orWhere('headline', 'like', "%{$s}%")
                ->orWhere('description', 'like', "%{$s}%")))
            ->orderBy('order')
            ->orderByDesc('is_featured');

        $courses = $coursesQuery->get()->map(function (AcademyCourse $course) use ($user) {
            $totalLessons = $course->lessons->where('is_published', true)->count();
            $totalDuration = $course->lessons->where('is_published', true)->sum('duration_seconds');

            $enrollment = $user ? AcademyEnrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first() : null;

            return [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'headline' => $course->headline,
                'description' => $course->description,
                'thumbnail_url' => $course->thumbnail_url,
                'badge_text' => $course->badge_text,
                'difficulty_level' => $course->difficulty_level,
                'is_featured' => (bool) $course->is_featured,
                'category' => $course->category ? [
                    'name' => $course->category->name,
                    'slug' => $course->category->slug,
                ] : null,
                'total_lessons' => $totalLessons,
                'total_duration_minutes' => round($totalDuration / 60),
                'progress_percentage' => $enrollment ? (float) $enrollment->progress_percentage : 0,
                'is_completed' => $enrollment ? (bool) $enrollment->completed_at : false,
            ];
        });

        // Continue watching item
        $recentEnrollment = $user ? AcademyEnrollment::with(['course', 'lastLesson'])
            ->where('user_id', $user->id)
            ->whereNull('completed_at')
            ->latest('last_accessed_at')
            ->first() : null;

        $continueLearning = null;
        if ($recentEnrollment && $recentEnrollment->course && $recentEnrollment->course->is_published) {
            $nextLesson = $recentEnrollment->lastLesson
                ?: AcademyLesson::where('course_id', $recentEnrollment->course_id)
                    ->where('is_published', true)
                    ->orderBy('order')
                    ->first();

            if ($nextLesson) {
                $continueLearning = [
                    'course_title' => $recentEnrollment->course->title,
                    'course_slug' => $recentEnrollment->course->slug,
                    'lesson_title' => $nextLesson->title,
                    'lesson_slug' => $nextLesson->slug,
                    'progress_percentage' => (float) $recentEnrollment->progress_percentage,
                ];
            }
        }

        // Student Stats
        $userStats = [
            'enrolled_count' => $user ? AcademyEnrollment::where('user_id', $user->id)->count() : 0,
            'completed_count' => $user ? AcademyEnrollment::where('user_id', $user->id)->whereNotNull('completed_at')->count() : 0,
            'completed_lessons_count' => $user ? AcademyProgress::where('user_id', $user->id)->where('is_completed', true)->count() : 0,
        ];

        return Inertia::render('Academy/Index', [
            'categories' => $categories,
            'courses' => $courses,
            'continueLearning' => $continueLearning,
            'userStats' => $userStats,
            'filters' => [
                'category' => $selectedCategory,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Course Curriculum Page.
     */
    public function course(Request $request, string $slug): Response|RedirectResponse
    {
        $user = $request->user();

        $course = AcademyCourse::where('slug', $slug)
            ->where('is_published', true)
            ->with([
                'category',
                'modules' => fn ($q) => $q->where('is_published', true)->with([
                    'lessons' => fn ($l) => $l->where('is_published', true)->orderBy('order'),
                ])->orderBy('order'),
                'lessons' => fn ($q) => $q->where('is_published', true)->orderBy('order'),
            ])
            ->firstOrFail();

        $completedLessonIds = $user ? AcademyProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('is_completed', true)
            ->pluck('lesson_id')
            ->toArray() : [];

        $enrollment = $user ? AcademyEnrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first() : null;

        $firstLesson = $course->lessons->first();

        return Inertia::render('Academy/Course', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'headline' => $course->headline,
                'description' => $course->description,
                'thumbnail_url' => $course->thumbnail_url,
                'badge_text' => $course->badge_text,
                'difficulty_level' => $course->difficulty_level,
                'category' => $course->category ? [
                    'name' => $course->category->name,
                    'slug' => $course->category->slug,
                ] : null,
                'modules' => $course->modules->map(fn ($m) => [
                    'id' => $m->id,
                    'title' => $m->title,
                    'slug' => $m->slug,
                    'description' => $m->description,
                    'lessons' => $m->lessons->map(fn ($l) => [
                        'id' => $l->id,
                        'title' => $l->title,
                        'slug' => $l->slug,
                        'duration_seconds' => $l->duration_seconds,
                        'is_completed' => in_array($l->id, $completedLessonIds),
                    ]),
                ]),
                'standalone_lessons' => $course->lessons->whereNull('module_id')->map(fn ($l) => [
                    'id' => $l->id,
                    'title' => $l->title,
                    'slug' => $l->slug,
                    'duration_seconds' => $l->duration_seconds,
                    'is_completed' => in_array($l->id, $completedLessonIds),
                ])->values(),
                'total_lessons' => $course->lessons->count(),
                'total_duration_minutes' => round($course->lessons->sum('duration_seconds') / 60),
                'progress_percentage' => $enrollment ? (float) $enrollment->progress_percentage : 0,
                'is_completed' => $enrollment ? (bool) $enrollment->completed_at : false,
                'first_lesson_slug' => $firstLesson?->slug,
            ],
        ]);
    }

    /**
     * Interactive Video Lesson View.
     */
    public function lesson(Request $request, string $courseSlug, string $lessonSlug): Response
    {
        $user = $request->user();

        $course = AcademyCourse::where('slug', $courseSlug)
            ->where('is_published', true)
            ->with([
                'modules' => fn ($q) => $q->where('is_published', true)->with([
                    'lessons' => fn ($l) => $l->where('is_published', true)->orderBy('order'),
                ])->orderBy('order'),
                'lessons' => fn ($q) => $q->where('is_published', true)->orderBy('order'),
            ])
            ->firstOrFail();

        $lesson = AcademyLesson::where('course_id', $course->id)
            ->where('slug', $lessonSlug)
            ->where('is_published', true)
            ->firstOrFail();

        // Update enrollment touch
        if ($user) {
            AcademyEnrollment::updateOrCreate(
                ['user_id' => $user->id, 'course_id' => $course->id],
                [
                    'last_lesson_id' => $lesson->id,
                    'last_accessed_at' => now(),
                ]
            );
        }

        $completedLessonIds = $user ? AcademyProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('is_completed', true)
            ->pluck('lesson_id')
            ->toArray() : [];

        // Determine Prev & Next lessons
        $allLessons = $course->lessons->values();
        $currentIndex = $allLessons->search(fn ($l) => $l->id === $lesson->id);
        $prevLesson = $currentIndex > 0 ? $allLessons->get($currentIndex - 1) : null;
        $nextLesson = $currentIndex !== false && $currentIndex < $allLessons->count() - 1 ? $allLessons->get($currentIndex + 1) : null;

        return Inertia::render('Academy/Lesson', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'modules' => $course->modules->map(fn ($m) => [
                    'id' => $m->id,
                    'title' => $m->title,
                    'lessons' => $m->lessons->map(fn ($l) => [
                        'id' => $l->id,
                        'title' => $l->title,
                        'slug' => $l->slug,
                        'duration_seconds' => $l->duration_seconds,
                        'is_current' => $l->id === $lesson->id,
                        'is_completed' => in_array($l->id, $completedLessonIds),
                    ]),
                ]),
                'standalone_lessons' => $course->lessons->whereNull('module_id')->map(fn ($l) => [
                    'id' => $l->id,
                    'title' => $l->title,
                    'slug' => $l->slug,
                    'duration_seconds' => $l->duration_seconds,
                    'is_current' => $l->id === $lesson->id,
                    'is_completed' => in_array($l->id, $completedLessonIds),
                ])->values(),
            ],
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'slug' => $lesson->slug,
                'youtube_video_id' => $lesson->youtube_video_id,
                'youtube_video_url' => $lesson->youtube_video_url,
                'duration_seconds' => $lesson->duration_seconds,
                'description' => $lesson->description,
                'lesson_notes' => $lesson->lesson_notes,
                'resources' => $lesson->resources_json ?? [],
                'is_completed' => in_array($lesson->id, $completedLessonIds),
            ],
            'prevLesson' => $prevLesson ? ['title' => $prevLesson->title, 'slug' => $prevLesson->slug] : null,
            'nextLesson' => $nextLesson ? ['title' => $nextLesson->title, 'slug' => $nextLesson->slug] : null,
        ]);
    }

    /**
     * Mark a lesson as completed (or toggle).
     */
    public function completeLesson(Request $request, int $lessonId): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        $progress = $this->curriculumService->markLessonCompleted($user->id, $lessonId);

        if ($request->wantsJson()) {
            return response()->json([
                'status' => 'ok',
                'is_completed' => true,
            ]);
        }

        return back()->with('success', 'Lesson marked as completed!');
    }
}
