<?php

namespace App\Modules\Blog\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Blog\Models\BlogAuthor;
use App\Modules\Blog\Models\BlogCategory;
use App\Modules\Blog\Models\BlogPost;
use App\Modules\Blog\Models\BlogTag;
use App\Modules\Blog\Services\BlogService;
use App\Services\SeoService;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class PublicBlogController extends Controller
{
    public function __construct(
        protected BlogService $blogService
    ) {}

    /**
     * Public Blog Homepage: Featured article, category filter, search, paginated grid.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $categorySlug = $request->input('category');
        $tagSlug = $request->input('tag');

        $query = BlogPost::published()
            ->with(['category', 'author', 'tags'])
            ->latest('published_at');

        if ($search) {
            $query->search($search);
        }

        if ($categorySlug) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $categorySlug));
        }

        if ($tagSlug) {
            $query->whereHas('tags', fn ($q) => $q->where('slug', $tagSlug));
        }

        $featuredPost = (! $search && ! $categorySlug && ! $tagSlug)
            ? BlogPost::published()->featured()->with(['category', 'author'])->latest('published_at')->first()
            : null;

        if ($featuredPost) {
            $query->where('id', '!=', $featuredPost->id);
        }

        $posts = $query->paginate(9)->withQueryString();

        $categories = $this->blogService->getCategoriesWithCounts();
        $popularTags = $this->blogService->getPopularTags(12);

        return Inertia::render('Blog/Index', [
            'featuredPost' => $featuredPost ? [
                'id' => $featuredPost->id,
                'title' => $featuredPost->title,
                'slug' => $featuredPost->slug,
                'excerpt' => $featuredPost->excerpt,
                'featured_image' => $featuredPost->featured_image,
                'reading_time_minutes' => $featuredPost->reading_time_minutes,
                'published_at' => $featuredPost->published_at?->format('M d, Y'),
                'category' => $featuredPost->category ? [
                    'name' => $featuredPost->category->name,
                    'slug' => $featuredPost->category->slug,
                ] : null,
                'author' => $featuredPost->author ? [
                    'name' => $featuredPost->author->name,
                    'avatar_url' => $featuredPost->author->avatar_url,
                    'title_role' => $featuredPost->author->title_role,
                ] : null,
            ] : null,
            'posts' => $posts,
            'categories' => $categories,
            'popularTags' => $popularTags,
            'filters' => [
                'search' => $search,
                'category' => $categorySlug,
                'tag' => $tagSlug,
            ],
        ]);
    }

    /**
     * Single Blog Article View.
     */
    public function show(Request $request, string $slug): Response
    {
        $post = BlogPost::where('slug', $slug)
            ->with(['category', 'author', 'tags'])
            ->firstOrFail();

        // Allow draft viewing only for authenticated admins
        if (! $post->isPublished()) {
            $adminUser = auth('admin')->user();
            if (! $adminUser) {
                abort(404);
            }
        } else {
            // Increment views count atomically
            $post->increment('views_count');
        }

        $relatedPosts = $this->blogService->getRelatedPosts($post, 3)->map(function ($p) {
            return [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'excerpt' => $p->excerpt,
                'featured_image' => $p->featured_image,
                'reading_time_minutes' => $p->reading_time_minutes,
                'published_at' => $p->published_at?->format('M d, Y'),
                'category' => $p->category ? ['name' => $p->category->name, 'slug' => $p->category->slug] : null,
            ];
        });

        // Set dynamic SEO metadata for SeoService
        SeoService::set([
            'title' => ($post->meta_title ?: $post->title) . ' — BotifyAI Blog',
            'description' => $post->meta_description ?: $post->excerpt,
            'keywords' => $post->focus_keyword ?: '',
            'canonical' => $post->canonical_url ?: route('blog.show', ['slug' => $post->slug]),
            'og' => [
                'type' => 'article',
                'title' => $post->meta_title ?: $post->title,
                'description' => $post->meta_description ?: $post->excerpt,
                'image' => $post->og_image ?: $post->featured_image,
                'url' => route('blog.show', ['slug' => $post->slug]),
            ],
            'twitter' => [
                'card' => 'summary_large_image',
                'title' => $post->meta_title ?: $post->title,
                'description' => $post->meta_description ?: $post->excerpt,
                'image' => $post->og_image ?: $post->featured_image,
            ],
            'json_ld' => [
                '@context' => 'https://schema.org',
                '@type' => 'BlogPosting',
                'headline' => $post->title,
                'description' => $post->meta_description ?: $post->excerpt,
                'datePublished' => $post->published_at?->toIso8601String() ?? now()->toIso8601String(),
                'dateModified' => $post->updated_at->toIso8601String(),
                'mainEntityOfPage' => [
                    '@type' => 'WebPage',
                    '@id' => route('blog.show', ['slug' => $post->slug]),
                ],
                'author' => [
                    '@type' => 'Person',
                    'name' => $post->author?->name ?? 'BotifyAI Team',
                    'url' => $post->author ? route('blog.author', ['slug' => $post->author->slug]) : url('/blog'),
                ],
                'publisher' => [
                    '@type' => 'Organization',
                    'name' => config('app.name', 'BotifyAI'),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => url('/storage/branding/logo.png'),
                    ],
                ],
                'image' => $post->featured_image ?: url('/storage/branding/logo.png'),
            ],
        ]);

        return Inertia::render('Blog/Show', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $post->excerpt,
                'content' => $post->content,
                'featured_image' => $post->featured_image,
                'featured_image_alt' => $post->featured_image_alt,
                'reading_time_minutes' => $post->reading_time_minutes,
                'views_count' => $post->views_count,
                'published_at' => $post->published_at?->format('F d, Y'),
                'updated_at' => $post->updated_at->format('F d, Y'),
                'status' => $post->status,
                'table_of_contents' => $post->table_of_contents ?: BlogPost::extractTableOfContents($post->content),
                'category' => $post->category ? [
                    'name' => $post->category->name,
                    'slug' => $post->category->slug,
                    'description' => $post->category->description,
                ] : null,
                'author' => $post->author ? [
                    'name' => $post->author->name,
                    'slug' => $post->author->slug,
                    'title_role' => $post->author->title_role,
                    'avatar_url' => $post->author->avatar_url,
                    'bio' => $post->author->bio,
                    'social_links' => $post->author->social_links,
                ] : null,
                'tags' => $post->tags->map(fn ($t) => ['name' => $t->name, 'slug' => $t->slug]),
            ],
            'relatedPosts' => $relatedPosts,
        ]);
    }

    /**
     * Category Archive.
     */
    public function category(Request $request, string $slug): Response
    {
        $category = BlogCategory::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $posts = BlogPost::published()
            ->where('category_id', $category->id)
            ->with(['category', 'author', 'tags'])
            ->latest('published_at')
            ->paginate(9);

        return Inertia::render('Blog/Category', [
            'category' => $category,
            'posts' => $posts,
        ]);
    }

    /**
     * Tag Archive.
     */
    public function tag(Request $request, string $slug): Response
    {
        $tag = BlogTag::where('slug', $slug)->firstOrFail();

        $posts = $tag->publishedPosts()
            ->with(['category', 'author', 'tags'])
            ->latest('published_at')
            ->paginate(9);

        return Inertia::render('Blog/Tag', [
            'tag' => $tag,
            'posts' => $posts,
        ]);
    }

    /**
     * Author Profile (E-E-A-T).
     */
    public function author(Request $request, string $slug): Response
    {
        $author = BlogAuthor::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $posts = $author->publishedPosts()
            ->with(['category', 'author', 'tags'])
            ->latest('published_at')
            ->paginate(9);

        return Inertia::render('Blog/Author', [
            'author' => $author,
            'posts' => $posts,
        ]);
    }

    /**
     * RSS 2.0 Feed for Syndication and Search Engines (/blog/feed.xml).
     */
    public function feed(): HttpResponse
    {
        $posts = BlogPost::published()
            ->with(['category', 'author'])
            ->latest('published_at')
            ->take(25)
            ->get();

        $appName = config('app.name', 'BotifyAI');
        $blogUrl = url('/blog');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'."\n";
        $xml .= '  <channel>'."\n";
        $xml .= '    <title>'.htmlspecialchars($appName).' Blog</title>'."\n";
        $xml .= '    <link>'.htmlspecialchars($blogUrl).'</link>'."\n";
        $xml .= '    <description>Latest insights, tutorials, and strategies on AI chatbots, WhatsApp automation, digital products, and growth.</description>'."\n";
        $xml .= '    <atom:link href="'.htmlspecialchars(url('/blog/feed.xml')).'" rel="self" type="application/rss+xml" />'."\n";
        $xml .= '    <language>en</language>'."\n";

        foreach ($posts as $post) {
            $postUrl = route('blog.show', ['slug' => $post->slug]);
            $xml .= "    <item>\n";
            $xml .= '      <title>'.htmlspecialchars($post->title).'</title>'."\n";
            $xml .= '      <link>'.htmlspecialchars($postUrl).'</link>'."\n";
            $xml .= '      <guid isPermaLink="true">'.htmlspecialchars($postUrl).'</guid>'."\n";
            $xml .= '      <description>'.htmlspecialchars($post->excerpt ?: Str::limit(strip_tags($post->content), 250)).'</description>'."\n";
            $xml .= '      <pubDate>'.$post->published_at->toRssString().'</pubDate>'."\n";
            if ($post->author) {
                $xml .= '      <author>'.htmlspecialchars($post->author->email ?: 'editorial@botifyai.cloud').' ('.htmlspecialchars($post->author->name).')</author>'."\n";
            }
            if ($post->category) {
                $xml .= '      <category>'.htmlspecialchars($post->category->name).'</category>'."\n";
            }
            $xml .= "    </item>\n";
        }

        $xml .= '  </channel>'."\n";
        $xml .= '</rss>';

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}

