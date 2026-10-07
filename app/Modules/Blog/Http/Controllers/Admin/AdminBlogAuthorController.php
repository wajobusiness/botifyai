<?php

namespace App\Modules\Blog\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Modules\Blog\Models\BlogAuthor;
use App\Services\StorageManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminBlogAuthorController extends Controller
{
    public function index(): Response
    {
        $authors = BlogAuthor::withCount('posts')
            ->orderBy('name')
            ->get();

        $adminUsers = AdminUser::orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Blog/Authors', [
            'authors' => $authors,
            'adminUsers' => $adminUsers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'admin_user_id' => 'nullable|exists:admin_users,id',
            'name' => 'required|string|max:150',
            'slug' => 'nullable|string|max:150|unique:blog_authors,slug',
            'title_role' => 'nullable|string|max:150',
            'avatar_url' => 'nullable|string|max:500',
            'bio' => 'nullable|string',
            'email' => 'nullable|email|max:150',
            'social_links' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        BlogAuthor::create($validated);

        return redirect()->route('admin.blog.authors.index')->with('success', 'Author created successfully.');
    }

    public function update(Request $request, BlogAuthor $author): RedirectResponse
    {
        $validated = $request->validate([
            'admin_user_id' => 'nullable|exists:admin_users,id',
            'name' => 'required|string|max:150',
            'slug' => 'nullable|string|max:150|unique:blog_authors,slug,' . $author->id,
            'title_role' => 'nullable|string|max:150',
            'avatar_url' => 'nullable|string|max:500',
            'bio' => 'nullable|string',
            'email' => 'nullable|email|max:150',
            'social_links' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $author->update($validated);

        return redirect()->route('admin.blog.authors.index')->with('success', 'Author updated successfully.');
    }

    public function destroy(BlogAuthor $author): RedirectResponse
    {
        $author->delete();
        return redirect()->route('admin.blog.authors.index')->with('success', 'Author deleted successfully.');
    }
}

