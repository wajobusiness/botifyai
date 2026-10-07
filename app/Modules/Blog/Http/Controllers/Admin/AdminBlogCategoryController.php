<?php

namespace App\Modules\Blog\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Blog\Models\BlogCategory;
use App\Modules\Blog\Models\BlogTag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminBlogCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = BlogCategory::withCount('posts')
            ->orderBy('order')
            ->get();

        $tags = BlogTag::withCount('posts')
            ->latest('id')
            ->get();

        return Inertia::render('Admin/Blog/Categories', [
            'categories' => $categories,
            'tags' => $tags,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'slug' => 'nullable|string|max:150|unique:blog_categories,slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        BlogCategory::create($validated);

        return redirect()->route('admin.blog.categories.index')->with('success', 'Category created successfully.');
    }

    public function update(Request $request, BlogCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'slug' => 'nullable|string|max:150|unique:blog_categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return redirect()->route('admin.blog.categories.index')->with('success', 'Category updated successfully.');
    }

    public function destroy(BlogCategory $category): RedirectResponse
    {
        $category->delete();
        return redirect()->route('admin.blog.categories.index')->with('success', 'Category deleted successfully.');
    }

    public function destroyTag(BlogTag $tag): RedirectResponse
    {
        $tag->delete();
        return redirect()->route('admin.blog.categories.index')->with('success', 'Tag deleted successfully.');
    }
}

