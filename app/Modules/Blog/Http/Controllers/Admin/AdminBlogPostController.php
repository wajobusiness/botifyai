<?php

namespace App\Modules\Blog\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Blog\Models\BlogAuthor;
use App\Modules\Blog\Models\BlogCategory;
use App\Modules\Blog\Models\BlogPost;
use App\Modules\Blog\Models\BlogTag;
use App\Services\StorageManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminBlogPostController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $categoryId = $request->input('category_id');

        $posts = BlogPost::with(['category', 'author', 'tags'])
            ->when($search, fn ($q, $s) => $q->search($s))
            ->when($status, fn ($q, $st) => $q->where('status', $st))
            ->when($categoryId, fn ($q, $cat) => $q->where('category_id', $categoryId))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $categories = BlogCategory::orderBy('name')->get(['id', 'name']);
        $authors = BlogAuthor::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        $stats = [
            'total' => BlogPost::count(),
            'published' => BlogPost::where('status', 'published')->count(),
            'draft' => BlogPost::where('status', 'draft')->count(),
            'total_views' => BlogPost::sum('views_count'),
        ];

        return Inertia::render('Admin/Blog/Index', [
            'posts' => $posts,
            'categories' => $categories,
            'authors' => $authors,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'category_id' => $categoryId,
            ],
        ]);
    }

    public function create(): Response
    {
        $categories = BlogCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $authors = BlogAuthor::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $tags = BlogTag::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Blog/CreateEdit', [
            'post' => null,
            'categories' => $categories,
            'authors' => $authors,
            'tags' => $tags,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:blog_posts,slug',
            'category_id' => 'nullable|exists:blog_categories,id',
            'author_id' => 'nullable|exists:blog_authors,id',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'featured_image' => 'nullable|string|max:500',
            'featured_image_alt' => 'nullable|string|max:255',
            'status' => 'required|in:draft,scheduled,published,archived',
            'published_at' => 'nullable|date',
            'reading_time_minutes' => 'nullable|integer|min:1',
            'is_featured' => 'boolean',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'focus_keyword' => 'nullable|string|max:150',
            'secondary_keywords' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        $tags = $validated['tags'] ?? [];
        unset($validated['tags']);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        if ($validated['status'] === 'published' && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $post = BlogPost::create($validated);

        if (! empty($tags)) {
            $tagIds = $this->resolveTagIds($tags);
            $post->tags()->sync($tagIds);
        }

        return redirect()->route('admin.blog.index')->with('success', 'Article created successfully.');
    }

    public function edit(BlogPost $post): Response
    {
        $post->load(['category', 'author', 'tags']);
        $categories = BlogCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $authors = BlogAuthor::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $tags = BlogTag::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Blog/CreateEdit', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'category_id' => $post->category_id,
                'author_id' => $post->author_id,
                'excerpt' => $post->excerpt,
                'content' => $post->content,
                'featured_image' => $post->featured_image,
                'featured_image_alt' => $post->featured_image_alt,
                'status' => $post->status,
                'published_at' => $post->published_at?->format('Y-m-d\TH:i'),
                'reading_time_minutes' => $post->reading_time_minutes,
                'is_featured' => (bool) $post->is_featured,
                'meta_title' => $post->meta_title,
                'meta_description' => $post->meta_description,
                'focus_keyword' => $post->focus_keyword,
                'secondary_keywords' => $post->secondary_keywords ?: [],
                'tags' => $post->tags->pluck('name')->toArray(),
            ],
            'categories' => $categories,
            'authors' => $authors,
            'tags' => $tags,
        ]);
    }

    public function update(Request $request, BlogPost $post): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:blog_posts,slug,' . $post->id,
            'category_id' => 'nullable|exists:blog_categories,id',
            'author_id' => 'nullable|exists:blog_authors,id',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'featured_image' => 'nullable|string|max:500',
            'featured_image_alt' => 'nullable|string|max:255',
            'status' => 'required|in:draft,scheduled,published,archived',
            'published_at' => 'nullable|date',
            'reading_time_minutes' => 'nullable|integer|min:1',
            'is_featured' => 'boolean',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'focus_keyword' => 'nullable|string|max:150',
            'secondary_keywords' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        $tags = $validated['tags'] ?? [];
        unset($validated['tags']);

        if ($validated['status'] === 'published' && empty($validated['published_at'])) {
            $validated['published_at'] = $post->published_at ?: now();
        }

        $post->update($validated);

        if ($tags !== null) {
            $tagIds = $this->resolveTagIds($tags);
            $post->tags()->sync($tagIds);
        }

        return redirect()->route('admin.blog.index')->with('success', 'Article updated successfully.');
    }

    public function destroy(BlogPost $post): RedirectResponse
    {
        $post->delete();
        return redirect()->route('admin.blog.index')->with('success', 'Article deleted successfully.');
    }

    /**
     * Upload an image via StorageManager.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:5120', // Max 5MB
        ]);

        try {
            $file = $request->file('image');
            $extension = $file->getClientOriginalExtension();
            $filename = 'blog_' . Str::random(20) . '.' . $extension;
            $path = 'blog/' . $filename;

            $storageManager = app(StorageManager::class);
            $disk = $storageManager->disk();
            $disk->put($path, file_get_contents($file->getRealPath()), 'public');

            $url = $disk->url($path);

            return response()->json([
                'success' => true,
                'url' => $url,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    protected function resolveTagIds(array $tagNames): array
    {
        $ids = [];
        foreach ($tagNames as $name) {
            $name = trim($name);
            if (! empty($name)) {
                $tag = BlogTag::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => $name]
                );
                $ids[] = $tag->id;
            }
        }
        return array_unique($ids);
    }
}

