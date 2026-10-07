<?php

namespace App\Modules\Blog\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Blog\Models\BlogAiTopic;
use App\Modules\Blog\Services\BlogAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBlogAiController extends Controller
{
    public function __construct(
        protected BlogAiService $aiService
    ) {}

    /**
     * Generate 5 high-intent SEO topic ideas for a cluster.
     */
    public function generateTopics(Request $request): JsonResponse
    {
        $cluster = $request->input('cluster', 'all');
        $count = (int) $request->input('count', 5);

        $topics = $this->aiService->generateTopicIdeas($cluster, $count);

        // Optionally persist to blog_ai_topics
        foreach ($topics as $t) {
            BlogAiTopic::firstOrCreate(
                ['topic_title' => $t['topic_title']],
                [
                    'cluster_category' => $t['cluster_category'] ?? $cluster,
                    'search_intent' => $t['search_intent'] ?? 'informational',
                    'difficulty_score' => $t['difficulty_score'] ?? 25,
                    'target_keywords' => $t['target_keywords'] ?? [],
                    'outline' => $t['outline'] ?? [],
                    'status' => 'suggested',
                ]
            );
        }

        return response()->json([
            'success' => true,
            'topics' => $topics,
        ]);
    }

    /**
     * Generate H2/H3 outline for a selected topic title.
     */
    public function generateOutline(Request $request): JsonResponse
    {
        $request->validate([
            'topic_title' => 'required|string|max:255',
            'focus_keyword' => 'nullable|string|max:150',
        ]);

        $outline = $this->aiService->generateArticleOutline(
            $request->input('topic_title'),
            $request->input('focus_keyword')
        );

        return response()->json([
            'success' => true,
            'outline' => $outline,
        ]);
    }

    /**
     * Generate full rich HTML draft article.
     */
    public function generateDraft(Request $request): JsonResponse
    {
        $request->validate([
            'topic_title' => 'required|string|max:255',
            'outline' => 'nullable|array',
            'keywords' => 'nullable|array',
        ]);

        $draft = $this->aiService->generateArticleDraft(
            $request->input('topic_title'),
            $request->input('outline', []),
            $request->input('keywords', [])
        );

        return response()->json([
            'success' => true,
            'draft' => $draft,
        ]);
    }

    /**
     * Analyze and optimize SEO metadata for editor.
     */
    public function optimizeSeo(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $seo = $this->aiService->optimizeSeoMetadata(
            $request->input('title'),
            $request->input('content')
        );

        return response()->json([
            'success' => true,
            'seo' => $seo,
        ]);
    }
}

