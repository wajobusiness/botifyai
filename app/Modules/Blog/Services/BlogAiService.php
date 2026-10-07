<?php

namespace App\Modules\Blog\Services;

use App\Models\Workspace;
use App\Modules\AI\Models\AiProviderConfig;
use App\Modules\AI\Services\Llm\LlmManager;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BlogAiService
{
    /**
     * Generate high-intent SEO topic ideas for BotifyAI.
     */
    public function generateTopicIdeas(string $cluster = 'all', int $count = 5): array
    {
        $systemPrompt = "You are an elite SaaS SEO Strategist and Content Director for BotifyAI (an omnichannel AI customer engagement, WhatsApp/Instagram chatbot, digital product sales, and affiliate marketing platform). Your objective is to discover high-value, low-competition, search-intent-driven topic ideas that meet Google Search Essentials and Google AdSense helpful content quality standards.";

        $prompt = "Generate {$count} high-intent blog topic ideas for the cluster: '{$cluster}'.
For each topic, return a valid JSON array of objects with the following schema:
[
  {
    \"topic_title\": \"Compelling, high-converting article title\",
    \"cluster_category\": \"{$cluster}\",
    \"search_intent\": \"informational|commercial|transactional\",
    \"difficulty_score\": 25,
    \"target_keywords\": [\"primary keyword\", \"secondary keyword 1\", \"secondary keyword 2\"],
    \"outline\": [\"H2 Section 1\", \"H2 Section 2\", \"H2 Section 3\", \"H2 Section 4\", \"Conclusion\"]
  }
]
Respond with JSON only, without markdown fences.";

        $result = $this->callLlm($systemPrompt, $prompt);

        if ($result && ($json = $this->parseJson($result))) {
            return is_array($json) ? $json : [];
        }

        // High-value fallback topics if LLM is not configured yet
        return $this->getFallbackTopicIdeas($cluster, $count);
    }

    /**
     * Generate comprehensive H2/H3 article outline with FAQ targets.
     */
    public function generateArticleOutline(string $topicTitle, ?string $focusKeyword = null): array
    {
        $focusKeyword = $focusKeyword ?: $topicTitle;
        $systemPrompt = "You are a master SEO architect. Generate a comprehensive, E-E-A-T compliant article outline for an authoritative guide titled '{$topicTitle}' targeting '{$focusKeyword}'.";

        $prompt = "Create a detailed outline with H2 headings, nested H3 subheadings, key points to cover, and 3 frequently asked questions (FAQs).
Return JSON only:
{
  \"meta_title\": \"SEO Title under 60 chars\",
  \"meta_description\": \"Compelling meta description under 155 chars with target keyword\",
  \"focus_keyword\": \"{$focusKeyword}\",
  \"sections\": [
    {
      \"heading\": \"H2 Heading Title\",
      \"subheadings\": [\"H3 Subheading A\", \"H3 Subheading B\"],
      \"key_takeaway\": \"Core concept to teach\"
    }
  ],
  \"faqs\": [
    {\"question\": \"Frequently asked question?\", \"answer_summary\": \"Brief answer summary\"}
  ]
}";

        $result = $this->callLlm($systemPrompt, $prompt);

        if ($result && ($json = $this->parseJson($result))) {
            return $json;
        }

        return [
            'meta_title' => Str::limit($topicTitle, 58),
            'meta_description' => "Learn everything you need to know about {$focusKeyword} with practical step-by-step strategies from BotifyAI.",
            'focus_keyword' => $focusKeyword,
            'sections' => [
                ['heading' => 'Introduction to ' . $topicTitle, 'subheadings' => ['Why It Matters in 2026', 'Key Industry Shifts'], 'key_takeaway' => 'Overview of core benefits'],
                ['heading' => 'Core Strategies & Implementation', 'subheadings' => ['Step 1: Setup & Configuration', 'Step 2: Workflow Automation'], 'key_takeaway' => 'Actionable step-by-step guidance'],
                ['heading' => 'Best Practices & Common Pitfalls', 'subheadings' => ['What to Avoid', 'Measuring ROI'], 'key_takeaway' => 'Practical advice to ensure success'],
                ['heading' => 'Conclusion & Next Steps', 'subheadings' => ['Getting Started with BotifyAI'], 'key_takeaway' => 'Call to action and key summary'],
            ],
            'faqs' => [
                ['question' => 'How does this improve business efficiency?', 'answer_summary' => 'By automating repetitive workflows and providing instant 24/7 engagement.'],
            ],
        ];
    }

    /**
     * Generate a full, rich HTML article draft passing Google AdSense & Search Essentials.
     */
    public function generateArticleDraft(string $topicTitle, array $outline = [], array $keywords = []): array
    {
        $systemPrompt = "You are a senior technical copywriter and subject matter expert for BotifyAI. Write an in-depth, high-value, engaging article (minimum 1000 words) in clean semantic HTML (using <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>). Ensure absolute original depth, practical real-world advice, and zero repetitive AI fluff.";

        $keywordsList = implode(', ', $keywords);
        $outlineJson = json_encode($outline, JSON_PRETTY_PRINT);

        $prompt = "Title: {$topicTitle}
Target Keywords: {$keywordsList}
Outline Reference:
{$outlineJson}

Write the full article content in clean HTML (do NOT include <h1> as that is rendered by the page title). Use <h2> for main sections, <h3> for sub-sections, descriptive paragraphs, bullet points, and practical examples.
Also provide an excerpt, meta title, meta description, and 3-4 suggested tags.

Return JSON only:
{
  \"excerpt\": \"2-3 sentence engaging summary of the post\",
  \"meta_title\": \"SEO title under 60 chars\",
  \"meta_description\": \"Compelling meta description under 155 chars\",
  \"reading_time_minutes\": 6,
  \"content\": \"<h2>...</h2><p>...</p>...\",
  \"tags\": [\"Tag 1\", \"Tag 2\", \"Tag 3\"]
}";

        $result = $this->callLlm($systemPrompt, $prompt);

        if ($result && ($json = $this->parseJson($result))) {
            return $json;
        }

        // Heuristic draft fallback
        return [
            'excerpt' => "Explore our comprehensive guide on {$topicTitle}. Learn proven tactics, step-by-step workflows, and best practices to accelerate your business growth.",
            'meta_title' => Str::limit($topicTitle, 58),
            'meta_description' => "Discover essential insights on {$topicTitle}. Step-by-step strategies and practical advice from BotifyAI.",
            'reading_time_minutes' => 5,
            'content' => "<h2>Understanding {$topicTitle}</h2><p>Modern businesses face ever-evolving customer expectations. Implementing structured automation workflows allows your team to deliver instant, high-quality experiences at scale.</p><h2>Key Implementation Steps</h2><p>Follow these proven phases to deploy your strategy efficiently:</p><ul><li><strong>Define Goals:</strong> Establish clear conversion metrics and key performance indicators.</li><li><strong>Automate Routine Workflows:</strong> Free up valuable team time by delegating common inquiries to automated assistants.</li><li><strong>Analyze & Refine:</strong> Regularly inspect customer engagement metrics to optimize your messaging funnels.</li></ul><h2>Conclusion</h2><p>Taking a proactive approach to automation transforms customer satisfaction and drives sustainable revenue.</p>",
            'tags' => ['Automation', 'Growth', 'BotifyAI'],
        ];
    }

    /**
     * Optimize SEO metadata for existing content.
     */
    public function optimizeSeoMetadata(string $title, string $content): array
    {
        $systemPrompt = "You are an expert technical SEO analyst. Analyze the following article title and content, and provide optimized meta title, meta description, focus keyword, secondary keywords, and SEO improvement suggestions.";

        $cleanContent = Str::limit(strip_tags($content), 2000);
        $prompt = "Article Title: {$title}\nContent Snippet:\n{$cleanContent}\n\nReturn JSON only:\n{\n  \"meta_title\": \"SEO Title under 60 chars\",\n  \"meta_description\": \"Meta description under 155 chars\",\n  \"focus_keyword\": \"primary target keyword\",\n  \"secondary_keywords\": [\"kw1\", \"kw2\", \"kw3\"],\n  \"seo_score\": 92,\n  \"suggestions\": [\"Add an internal link to /pricing\", \"Include keyword in first 100 words\"]\n}";

        $result = $this->callLlm($systemPrompt, $prompt);

        if ($result && ($json = $this->parseJson($result))) {
            return $json;
        }

        return [
            'meta_title' => Str::limit($title, 58),
            'meta_description' => Str::limit(strip_tags($content), 150),
            'focus_keyword' => Str::words($title, 3, ''),
            'secondary_keywords' => ['BotifyAI', 'Automation', 'Business Growth'],
            'seo_score' => 85,
            'suggestions' => ['Ensure internal links to relevant product pages', 'Add high quality image with alt text'],
        ];
    }

    /**
     * Resolve and invoke the active LLM provider.
     */
    protected function callLlm(string $systemPrompt, string $userPrompt): ?string
    {
        try {
            // Check if workspace 1 or first workspace has AI provider configured
            $workspace = Workspace::first();
            $workspaceId = $workspace?->id ?? 1;

            $provider = LlmManager::forWorkspace($workspaceId);
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ];

            $response = $provider->chat($messages, ['temperature' => 0.7, 'max_tokens' => 2500]);
            return $response->text ?? null;
        } catch (\Throwable $e) {
            Log::info('BlogAiService LLM call fallback: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Safely parse JSON from LLM output.
     */
    protected function parseJson(string $text): ?array
    {
        $text = trim($text);
        if (str_starts_with($text, '```json')) {
            $text = substr($text, 7);
        }
        if (str_starts_with($text, '```')) {
            $text = substr($text, 3);
        }
        if (str_ends_with($text, '```')) {
            $text = substr($text, 0, -3);
        }
        $text = trim($text);

        $decoded = json_decode($text, true);
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Curated high-value topics per cluster.
     */
    protected function getFallbackTopicIdeas(string $cluster, int $count): array
    {
        $pool = [
            [
                'topic_title' => 'How to Set Up WhatsApp Business Cloud API for Maximum Deliverability in 2026',
                'cluster_category' => 'WhatsApp Automation',
                'search_intent' => 'informational',
                'difficulty_score' => 28,
                'target_keywords' => ['WhatsApp Business Cloud API setup', 'WhatsApp marketing deliverability', 'official WhatsApp API'],
                'outline' => ['WhatsApp Cloud API vs On-Premise', 'Meta Business Verification Steps', 'Template Message Approval Best Practices', 'Avoiding Spam Filters and Number Bans'],
            ],
            [
                'topic_title' => 'Top 7 AI Chatbot Prompts That Qualify Inbound Leads Automatically',
                'cluster_category' => 'AI Chatbots & Agents',
                'search_intent' => 'commercial',
                'difficulty_score' => 24,
                'target_keywords' => ['AI chatbot prompts for sales', 'lead qualification chatbot', 'conversational sales prompts'],
                'outline' => ['Why Generic Chatbots Fail', 'The 4-Part Prompt Engineering Framework', '7 Ready-to-Use Lead Scoring Prompts', 'CRM Webhook Integration'],
            ],
            [
                'topic_title' => 'The Complete Blueprint to Selling Digital Downloads on Autopilot',
                'cluster_category' => 'Digital Commerce & Sales',
                'search_intent' => 'transactional',
                'difficulty_score' => 32,
                'target_keywords' => ['sell digital downloads automated', 'instant digital delivery platform', 'monetize digital products'],
                'outline' => ['Selecting High-Margin Digital Formats', 'Configuring Multi-Currency Checkouts', 'Automated File Delivery Security', 'Upselling via WhatsApp Drips'],
            ],
            [
                'topic_title' => 'How to Build an Affiliate Army That Sells Your Software and Products 24/7',
                'cluster_category' => 'Affiliate Growth & Monetization',
                'search_intent' => 'commercial',
                'difficulty_score' => 30,
                'target_keywords' => ['recruit affiliate marketers', 'multi-vendor affiliate software', 'affiliate commission strategy'],
                'outline' => ['Structuring Win-Win Commission Tiers', 'Creating High-Converting Promotional Assets', 'Automated Tracking & Payout Safeguards', 'Motivating Top 10% Super Affiliates'],
            ],
            [
                'topic_title' => 'Omnichannel Customer Support: Reducing Ticket Resolution Times by 70%',
                'cluster_category' => 'Marketing & CRM',
                'search_intent' => 'informational',
                'difficulty_score' => 22,
                'target_keywords' => ['reduce support ticket times', 'omnichannel shared team inbox', 'AI automated customer support'],
                'outline' => ['The Hidden Cost of Fragmented Support', 'Unifying WhatsApp, Messenger & Live Chat', 'Automating Tier-1 FAQ Deflection', 'Measuring First Response Time (FRT)'],
            ],
        ];

        return array_slice($pool, 0, $count);
    }
}

