<?php

namespace App\Modules\Blog\Database\Seeders;

use App\Models\AdminUser;
use App\Modules\Blog\Database\Seeders\Data\BlogArticlesBatch1;
use App\Modules\Blog\Database\Seeders\Data\BlogArticlesBatch2;
use App\Modules\Blog\Database\Seeders\Data\BlogArticlesBatch3;
use App\Modules\Blog\Models\BlogAuthor;
use App\Modules\Blog\Models\BlogCategory;
use App\Modules\Blog\Models\BlogPost;
use App\Modules\Blog\Models\BlogTag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Categories with rich descriptions
        $categoriesData = [
            [
                'name' => 'AI Chatbots & Agents',
                'slug' => 'ai-chatbots-agents',
                'description' => 'Discover how autonomous AI chatbots and intelligent agents automate customer inquiries, qualify leads, and boost sales 24/7.',
                'icon' => 'Brain',
                'order' => 1,
            ],
            [
                'name' => 'WhatsApp Automation',
                'slug' => 'whatsapp-automation',
                'description' => 'Strategies, tutorials, and workflows for scaling business engagement using the official WhatsApp Business API.',
                'icon' => 'MessageSquare',
                'order' => 2,
            ],
            [
                'name' => 'Digital Commerce & Sales',
                'slug' => 'digital-commerce-sales',
                'description' => 'Guides on selling digital products, e-books, courses, and software with high-converting automated checkouts.',
                'icon' => 'ShoppingBag',
                'order' => 3,
            ],
            [
                'name' => 'Marketing & CRM',
                'slug' => 'marketing-crm',
                'description' => 'Omnichannel broadcasting, drip sequences, audience segmentation, and CRM automation tactics.',
                'icon' => 'Target',
                'order' => 4,
            ],
            [
                'name' => 'Affiliate Growth & Monetization',
                'slug' => 'affiliate-growth-monetization',
                'description' => 'How to launch high-yield affiliate programs, recruit affiliates, and scale passive recurring revenue.',
                'icon' => 'TrendingUp',
                'order' => 5,
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['slug']] = BlogCategory::updateOrCreate(
                ['slug' => $c['slug']],
                $c
            );
        }

        // 2. Seed Default Author (E-E-A-T Compliant with Verified Avatar)
        $admin = AdminUser::first();
        $author = BlogAuthor::updateOrCreate(
            ['slug' => 'botifyai-editorial-team'],
            [
                'admin_user_id' => $admin?->id,
                'name' => 'BotifyAI Editorial & Research Team',
                'slug' => 'botifyai-editorial-team',
                'title_role' => 'AI Automation & Growth Specialists',
                'avatar_url' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80',
                'bio' => 'The BotifyAI Research Team analyzes customer engagement trends, conversational AI architectures, and growth automation for modern online businesses.',
                'email' => 'editorial@botifyai.cloud',
                'social_links' => [
                    'twitter' => 'https://twitter.com/botifyai',
                    'linkedin' => 'https://linkedin.com/company/botifyai',
                    'website' => 'https://botifyai.cloud',
                ],
                'is_active' => true,
            ]
        );

        // 3. Seed Core Tags
        $tagNames = [
            'AI Chatbot',
            'WhatsApp API',
            'Marketing Automation',
            'Digital Products',
            'Customer Support',
            'Lead Generation',
            'Affiliate Marketing',
            'CRM Automation',
            'Omnichannel Inbox',
            'SaaS Growth',
        ];

        $tags = [];
        foreach ($tagNames as $name) {
            $slug = Str::slug($name);
            $tags[$slug] = BlogTag::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'slug' => $slug]
            );
        }

        // 4. Combine all 3 batches of high-converting SEO masterclasses (36 total)
        $articles = array_merge(
            BlogArticlesBatch1::getArticles($author->id),
            BlogArticlesBatch2::getArticles($author->id),
            BlogArticlesBatch3::getArticles($author->id)
        );

        $dayOffset = 1;
        foreach ($articles as $artData) {
            $catSlug = $artData['category_slug'];
            $category = $categories[$catSlug] ?? null;
            $tagSlugs = $artData['tags'] ?? [];

            unset($artData['category_slug'], $artData['tags']);

            $post = BlogPost::updateOrCreate(
                ['slug' => $artData['slug']],
                array_merge($artData, [
                    'category_id' => $category?->id,
                    'status' => 'published',
                    'published_at' => now()->subDays($dayOffset % 30)->subHours(rand(1, 23)),
                ])
            );

            $dayOffset++;

            // Sync tags
            $tagIds = [];
            foreach ($tagSlugs as $tSlug) {
                if (isset($tags[$tSlug])) {
                    $tagIds[] = $tags[$tSlug]->id;
                }
            }
            if (! empty($tagIds)) {
                $post->tags()->sync($tagIds);
            }
        }
    }
}
