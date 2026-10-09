<?php

namespace App\Modules\Academy\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academy\Models\AcademyCategory;
use App\Modules\Academy\Models\AcademyCourse;
use App\Modules\Academy\Models\AcademyEnrollment;
use App\Modules\Academy\Models\AcademyLesson;
use App\Modules\Academy\Models\AcademyModule;
use App\Modules\Academy\Models\AcademyProgress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminAcademyController extends Controller
{
    /**
     * Helper to extract YouTube Video ID from any format.
     */
    private function extractYouTubeId(?string $url): ?string
    {
        return AcademyLesson::parseYouTubeId($url);
    }

    /**
     * Admin Academy Command Center.
     */
    public function index(Request $request): Response
    {
        $categories = AcademyCategory::withCount('courses')
            ->orderBy('order')
            ->get();

        $courses = AcademyCourse::with(['category', 'modules' => fn ($q) => $q->orderBy('order'), 'lessons' => fn ($q) => $q->orderBy('order')])
            ->withCount(['lessons', 'enrollments'])
            ->orderBy('order')
            ->get()
            ->map(fn (AcademyCourse $c) => [
                'id' => $c->id,
                'category_id' => $c->category_id,
                'category_name' => $c->category?->name,
                'title' => $c->title,
                'slug' => $c->slug,
                'headline' => $c->headline,
                'description' => $c->description,
                'thumbnail_url' => $c->thumbnail_url,
                'badge_text' => $c->badge_text,
                'difficulty_level' => $c->difficulty_level,
                'is_published' => (bool) $c->is_published,
                'is_featured' => (bool) $c->is_featured,
                'order' => $c->order,
                'lessons_count' => $c->lessons_count,
                'enrollments_count' => $c->enrollments_count,
                'modules' => $c->modules->map(fn ($m) => [
                    'id' => $m->id,
                    'course_id' => $m->course_id,
                    'title' => $m->title,
                    'slug' => $m->slug,
                    'description' => $m->description,
                    'order' => $m->order,
                    'is_published' => (bool) $m->is_published,
                ]),
                'lessons' => $c->lessons->map(fn ($l) => [
                    'id' => $l->id,
                    'course_id' => $l->course_id,
                    'module_id' => $l->module_id,
                    'title' => $l->title,
                    'slug' => $l->slug,
                    'youtube_video_url' => $l->youtube_video_url,
                    'youtube_video_id' => $l->youtube_video_id,
                    'duration_seconds' => $l->duration_seconds,
                    'description' => $l->description,
                    'lesson_notes' => $l->lesson_notes,
                    'resources_json' => $l->resources_json,
                    'order' => $l->order,
                    'is_published' => (bool) $l->is_published,
                ]),
            ]);

        $enrollments = AcademyEnrollment::with(['user:id,name,email', 'course:id,title', 'lastLesson:id,title'])
            ->latest('last_accessed_at')
            ->paginate(20)
            ->through(fn ($e) => [
                'id' => $e->id,
                'user_name' => $e->user?->name ?: 'Learner',
                'user_email' => $e->user?->email,
                'course_title' => $e->course?->title,
                'progress_percentage' => (float) $e->progress_percentage,
                'last_lesson' => $e->lastLesson?->title,
                'last_accessed_at' => $e->last_accessed_at?->diffForHumans(),
                'completed_at' => $e->completed_at?->format('M d, Y'),
            ]);

        $stats = [
            'total_courses' => AcademyCourse::count(),
            'published_courses' => AcademyCourse::where('is_published', true)->count(),
            'total_lessons' => AcademyLesson::count(),
            'total_enrollments' => AcademyEnrollment::count(),
            'total_completions' => AcademyEnrollment::whereNotNull('completed_at')->count(),
        ];

        return Inertia::render('Admin/Academy/Index', [
            'stats' => $stats,
            'categories' => $categories,
            'courses' => $courses,
            'enrollments' => $enrollments,
        ]);
    }

    // ─── Categories ─────────────────────────────────────────────────────────

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:academy_categories,slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['slug'] = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);
        $validated['is_active'] = $request->boolean('is_active', true);

        AcademyCategory::create($validated);

        return back()->with('success', 'Category created successfully.');
    }

    public function updateCategory(Request $request, AcademyCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:academy_categories,slug,'.$category->id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        if (! empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['slug']);
        }
        $validated['is_active'] = $request->boolean('is_active', true);

        $category->update($validated);

        return back()->with('success', 'Category updated successfully.');
    }

    public function destroyCategory(AcademyCategory $category): RedirectResponse
    {
        $category->delete();

        return back()->with('success', 'Category deleted.');
    }

    // ─── Courses ────────────────────────────────────────────────────────────

    public function storeCourse(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:academy_categories,id',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:academy_courses,slug',
            'headline' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'thumbnail_url' => 'nullable|string|max:1000',
            'badge_text' => 'nullable|string|max:50',
            'difficulty_level' => 'required|string|in:beginner,intermediate,advanced',
            'is_published' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'order' => 'nullable|integer',
        ]);

        $baseSlug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['title']);
        $slug = $baseSlug;
        $i = 1;
        while (AcademyCourse::where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$i++;
        }
        $validated['slug'] = $slug;
        $validated['is_published'] = $request->boolean('is_published', true);
        $validated['is_featured'] = $request->boolean('is_featured', false);

        AcademyCourse::create($validated);

        return back()->with('success', 'Course created successfully.');
    }

    public function updateCourse(Request $request, AcademyCourse $course): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:academy_categories,id',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:academy_courses,slug,'.$course->id,
            'headline' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'thumbnail_url' => 'nullable|string|max:1000',
            'badge_text' => 'nullable|string|max:50',
            'difficulty_level' => 'required|string|in:beginner,intermediate,advanced',
            'is_published' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'order' => 'nullable|integer',
        ]);

        if (! empty($validated['slug']) && $validated['slug'] !== $course->slug) {
            $validated['slug'] = Str::slug($validated['slug']);
        }
        $validated['is_published'] = $request->boolean('is_published', true);
        $validated['is_featured'] = $request->boolean('is_featured', false);

        $course->update($validated);

        return back()->with('success', 'Course updated successfully.');
    }

    public function destroyCourse(AcademyCourse $course): RedirectResponse
    {
        $course->delete();

        return back()->with('success', 'Course deleted.');
    }

    // ─── Modules ────────────────────────────────────────────────────────────

    public function storeModule(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:academy_courses,id',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $validated['slug'] = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['title']);
        $validated['is_published'] = $request->boolean('is_published', true);

        AcademyModule::create($validated);

        return back()->with('success', 'Module created successfully.');
    }

    public function updateModule(Request $request, AcademyModule $module): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        if (! empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['slug']);
        }
        $validated['is_published'] = $request->boolean('is_published', true);

        $module->update($validated);

        return back()->with('success', 'Module updated successfully.');
    }

    public function destroyModule(AcademyModule $module): RedirectResponse
    {
        $module->delete();

        return back()->with('success', 'Module deleted.');
    }

    // ─── Lessons ────────────────────────────────────────────────────────────

    public function storeLesson(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:academy_courses,id',
            'module_id' => 'nullable|exists:academy_modules,id',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'youtube_video_url' => 'nullable|string|max:1000',
            'duration_seconds' => 'nullable|integer',
            'description' => 'nullable|string',
            'lesson_notes' => 'nullable|string',
            'resources_json' => 'nullable|array',
            'order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $validated['slug'] = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['title']);
        $validated['youtube_video_id'] = $this->extractYouTubeId($validated['youtube_video_url'] ?? null);
        $validated['is_published'] = $request->boolean('is_published', true);

        AcademyLesson::create($validated);

        return back()->with('success', 'Lesson added successfully.');
    }

    public function updateLesson(Request $request, AcademyLesson $lesson): RedirectResponse
    {
        $validated = $request->validate([
            'module_id' => 'nullable|exists:academy_modules,id',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'youtube_video_url' => 'nullable|string|max:1000',
            'duration_seconds' => 'nullable|integer',
            'description' => 'nullable|string',
            'lesson_notes' => 'nullable|string',
            'resources_json' => 'nullable|array',
            'order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        if (! empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['slug']);
        }
        if (array_key_exists('youtube_video_url', $validated)) {
            $validated['youtube_video_id'] = $this->extractYouTubeId($validated['youtube_video_url']);
        }
        $validated['is_published'] = $request->boolean('is_published', true);

        $lesson->update($validated);

        return back()->with('success', 'Lesson updated successfully.');
    }

    public function destroyLesson(AcademyLesson $lesson): RedirectResponse
    {
        $lesson->delete();

        return back()->with('success', 'Lesson deleted.');
    }
}
