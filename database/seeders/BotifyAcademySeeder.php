<?php

namespace Database\Seeders;

use App\Modules\Academy\Models\AcademyCategory;
use App\Modules\Academy\Models\AcademyCourse;
use App\Modules\Academy\Models\AcademyLesson;
use App\Modules\Academy\Models\AcademyModule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BotifyAcademySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Categories
        $categoriesData = [
            [
                'name' => 'Getting Started & Core Platform',
                'slug' => 'getting-started',
                'description' => 'Master the basics of BotifyAI, workspaces, channels, and team workflows.',
                'icon' => 'Sparkles',
                'order' => 1,
            ],
            [
                'name' => 'AI Chatbots & Automation',
                'slug' => 'chatbots-automation',
                'description' => 'Build 24/7 autonomous support & sales bots for WhatsApp, Web, and Social.',
                'icon' => 'Bot',
                'order' => 2,
            ],
            [
                'name' => 'Digital Stores & Commerce',
                'slug' => 'ecommerce-monetization',
                'description' => 'Launch high-converting digital storefronts and sell digital goods effortlessly.',
                'icon' => 'ShoppingBag',
                'order' => 3,
            ],
            [
                'name' => 'Omnichannel Marketing & Social Growth',
                'slug' => 'marketing-growth',
                'description' => 'Automate social media publishing, broadcasting campaigns, and lead pipelines.',
                'icon' => 'Radio',
                'order' => 4,
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $cat) {
            $categories[$cat['slug']] = AcademyCategory::updateOrCreate(
                ['slug' => $cat['slug']],
                $cat
            );
        }

        // 2. Course 1: BotifyAI Quickstart Guide
        $course1 = AcademyCourse::updateOrCreate(
            ['slug' => 'botifyai-quickstart-guide'],
            [
                'category_id' => $categories['getting-started']->id,
                'title' => 'BotifyAI Quickstart: The Complete Beginner’s Masterclass',
                'slug' => 'botifyai-quickstart-guide',
                'headline' => 'Everything you need to set up your account, connect channels, and automate communications in under 30 minutes.',
                'description' => "Welcome to BotifyAI! In this foundational masterclass, you'll learn the core layout of BotifyAI, how to configure your team workspaces, connect WhatsApp & social media channels, and launch your first automated replies.\n\nWhether you are an agency owner, merchant, or entrepreneur, this course will get you up and running with maximum efficiency.",
                'thumbnail_url' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
                'badge_text' => 'Must Watch',
                'difficulty_level' => 'beginner',
                'is_published' => true,
                'is_featured' => true,
                'order' => 1,
            ]
        );

        $m1 = AcademyModule::updateOrCreate(
            ['course_id' => $course1->id, 'slug' => 'workspace-setup'],
            [
                'course_id' => $course1->id,
                'title' => 'Module 1: Workspace & Account Setup',
                'slug' => 'workspace-setup',
                'description' => 'Configuring your business profile, branding, and team members.',
                'order' => 1,
                'is_published' => true,
            ]
        );

        AcademyLesson::updateOrCreate(
            ['course_id' => $course1->id, 'slug' => 'platform-tour-workspace-overview'],
            [
                'course_id' => $course1->id,
                'module_id' => $m1->id,
                'title' => 'Platform Tour & Dashboard Walkthrough',
                'slug' => 'platform-tour-workspace-overview',
                'youtube_video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'youtube_video_id' => 'dQw4w9WgXcQ',
                'duration_seconds' => 480,
                'description' => 'Get a complete overview of the BotifyAI navigation, dashboard widgets, and main tool modules.',
                'lesson_notes' => "<p><strong>Key Takeaways:</strong></p><ul><li>Understand the layout of your client dashboard.</li><li>Navigating between Inbox, Broadcasting, Automations, and E-commerce.</li><li>Managing your workspace settings and team access permissions.</li></ul>",
                'order' => 1,
                'is_published' => true,
            ]
        );

        AcademyLesson::updateOrCreate(
            ['course_id' => $course1->id, 'slug' => 'connecting-whatsapp-and-channels'],
            [
                'course_id' => $course1->id,
                'module_id' => $m1->id,
                'title' => 'Connecting Your WhatsApp & Social Channels',
                'slug' => 'connecting-whatsapp-and-channels',
                'youtube_video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'youtube_video_id' => 'dQw4w9WgXcQ',
                'duration_seconds' => 620,
                'description' => 'Step-by-step tutorial on linking WhatsApp Cloud API and QR-code gateways for automated messaging.',
                'lesson_notes' => "<p><strong>Steps covered:</strong></p><ol><li>Scan the QR code from the WhatsApp manager.</li><li>Verify active webhook connection.</li><li>Send your first test message to verify real-time status.</li></ol>",
                'order' => 2,
                'is_published' => true,
            ]
        );

        // 3. Course 2: AI Chatbot Automation Masterclass
        $course2 = AcademyCourse::updateOrCreate(
            ['slug' => 'ai-chatbot-automation-masterclass'],
            [
                'category_id' => $categories['chatbots-automation']->id,
                'title' => 'Building 24/7 AI Sales & Customer Support Chatbots',
                'slug' => 'ai-chatbot-automation-masterclass',
                'headline' => 'Train custom AI personas on your business knowledge base, FAQs, and product catalog to capture leads 24/7.',
                'description' => "Learn how to build AI-powered chatbots that talk like human agents, answer customer inquiries instantly, recommend products, and book appointments.\n\nYou'll discover how to structure prompt templates, provide training documents, and set up guardrails.",
                'thumbnail_url' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
                'badge_text' => 'High Demand',
                'difficulty_level' => 'intermediate',
                'is_published' => true,
                'is_featured' => true,
                'order' => 2,
            ]
        );

        $m2 = AcademyModule::updateOrCreate(
            ['course_id' => $course2->id, 'slug' => 'bot-architecture-prompting'],
            [
                'course_id' => $course2->id,
                'title' => 'Module 1: Prompt Engineering & Training Data',
                'slug' => 'bot-architecture-prompting',
                'description' => 'Designing the personality, tone, and knowledge boundaries of your AI bot.',
                'order' => 1,
                'is_published' => true,
            ]
        );

        AcademyLesson::updateOrCreate(
            ['course_id' => $course2->id, 'slug' => 'creating-ai-agent-persona'],
            [
                'course_id' => $course2->id,
                'module_id' => $m2->id,
                'title' => 'Crafting the Perfect AI Persona & System Instructions',
                'slug' => 'creating-ai-agent-persona',
                'youtube_video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'youtube_video_id' => 'dQw4w9WgXcQ',
                'duration_seconds' => 740,
                'description' => 'How to write structured prompts that guide your AI to maintain tone and never hallucinate.',
                'lesson_notes' => "<p><strong>Core Prompting Principles:</strong></p><ul><li>Define the Role & Tone clearly.</li><li>Provide explicit fallback handling when the bot does not know the answer.</li><li>Include instructions for lead capture (Name, Email, Phone Number).</li></ul>",
                'order' => 1,
                'is_published' => true,
            ]
        );

        // 4. Course 3: Digital Storefront & E-commerce Hub
        $course3 = AcademyCourse::updateOrCreate(
            ['slug' => 'digital-storefront-ecommerce-mastery'],
            [
                'category_id' => $categories['ecommerce-monetization']->id,
                'title' => 'Selling Digital Products & Courses on BotifyAI',
                'slug' => 'digital-storefront-ecommerce-mastery',
                'headline' => 'Set up your online digital store, upload ebooks & video courses, and accept payments with automated delivery.',
                'description' => "Turn your knowledge into automated income! In this course, you will learn how to create your custom-branded digital storefront on BotifyAI, upload downloadable files or link-based vaults, set up Paystack or Flutterwave payment gateways, and recruit affiliates to scale your sales.",
                'thumbnail_url' => 'https://images.unsplash.com/photo-1556742049-0a67e557224f?q=80&w=1200&auto=format&fit=crop',
                'badge_text' => 'E-Commerce',
                'difficulty_level' => 'beginner',
                'is_published' => true,
                'is_featured' => false,
                'order' => 3,
            ]
        );

        $m3 = AcademyModule::updateOrCreate(
            ['course_id' => $course3->id, 'slug' => 'store-setup-products'],
            [
                'course_id' => $course3->id,
                'title' => 'Module 1: Storefront Customization & Product Vault',
                'slug' => 'store-setup-products',
                'description' => 'Configuring your store slug, banner, theme, and digital products.',
                'order' => 1,
                'is_published' => true,
            ]
        );

        AcademyLesson::updateOrCreate(
            ['course_id' => $course3->id, 'slug' => 'creating-your-first-digital-product'],
            [
                'course_id' => $course3->id,
                'module_id' => $m3->id,
                'title' => 'Creating & Publishing Your First Digital Product',
                'slug' => 'creating-your-first-digital-product',
                'youtube_video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'youtube_video_id' => 'dQw4w9WgXcQ',
                'duration_seconds' => 540,
                'description' => 'Upload files, set pricing in NGN/USD, configure HTML product descriptions, and customize automated post-purchase delivery.',
                'lesson_notes' => "<p><strong>Checklist:</strong></p><ul><li>Select file delivery type or secret access link.</li><li>Set competitive pricing and cross-sell discounts.</li><li>Enable affiliate commission sharing.</li></ul>",
                'order' => 1,
                'is_published' => true,
            ]
        );
    }
}
