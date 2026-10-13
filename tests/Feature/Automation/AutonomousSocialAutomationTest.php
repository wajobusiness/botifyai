<?php

namespace Tests\Feature\Automation;

use App\Modules\AI\Services\Llm\LlmResponse;
use App\Modules\AI\Services\LlmGateway;
use App\Modules\Automation\Jobs\DispatchScheduledAutomationsJob;
use App\Modules\Automation\Models\Automation;
use App\Modules\Automation\Models\AutomationRun;
use App\Modules\Automation\Services\AutomationEngine;
use App\Modules\Automation\Services\WorkflowGenerator;
use App\Modules\Media\Models\Media;
use App\Modules\Social\Jobs\PublishSocialPostJob;
use App\Modules\Social\Models\SocialAccount;
use App\Modules\Social\Models\SocialPost;
use App\Modules\Social\Models\WorkspaceBrandProfile;
use App\Modules\Social\Services\BrandedGraphicService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class AutonomousSocialAutomationTest extends TestCase
{
    use RefreshDatabase;

    private array $ctx;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->ctx = $this->createWorkspaceContext();
    }

    public function test_workspace_brand_profile_defaults_and_color_sanitizers(): void
    {
        $wid = $this->ctx['workspace']->id;
        $profile = WorkspaceBrandProfile::forWorkspace($wid);

        $this->assertSame($wid, $profile->workspace_id);
        $this->assertSame('professional', $profile->tone);
        $this->assertNotEmpty($profile->content_pillars);
        $this->assertSame('#6366f1', $profile->primaryColor());
        $this->assertSame('#0f172a', $profile->secondaryColor());
        $this->assertSame('#f8fafc', $profile->backgroundColor());

        $profile->update(['brand_colors' => ['invalid-hex', '#FF5500', '#112233']]);
        $this->assertSame('#6366f1', $profile->primaryColor());
        $this->assertSame('#ff5500', $profile->secondaryColor());
        $this->assertSame('#112233', $profile->backgroundColor());
    }

    public function test_compute_next_run_at_supports_weekdays_and_multiple_times(): void
    {
        $auto = new Automation([
            'workspace_id' => $this->ctx['workspace']->id,
            'name' => 'Weekday Twice Daily',
            'status' => 'active',
            'trigger_type' => 'schedule.recurring',
            'trigger_config' => [
                'frequency' => 'weekdays',
                'times' => ['09:00', '16:00'],
                'timezone' => 'UTC',
            ],
        ]);

        // Monday 10:00 UTC -> next slot is Monday 16:00 UTC
        $mondayMorning = Carbon::parse('2026-10-12 10:00:00', 'UTC');
        $next1 = $auto->computeNextRunAt($mondayMorning);
        $this->assertSame('2026-10-12 16:00:00', $next1->toDateTimeString());

        // Friday 17:00 UTC -> skips Saturday & Sunday -> Monday 09:00 UTC
        $fridayEvening = Carbon::parse('2026-10-16 17:00:00', 'UTC');
        $next2 = $auto->computeNextRunAt($fridayEvening);
        $this->assertSame('2026-10-19 09:00:00', $next2->toDateTimeString());
    }

    public function test_branded_graphic_service_renders_single_and_carousel_slides(): void
    {
        $wid = $this->ctx['workspace']->id;
        $service = app(BrandedGraphicService::class);

        $quoteRes = $service->render($wid, 'quote', [
            'quote_text' => 'Consistency compounds faster than intensity.',
            'pillar' => 'Leadership',
            'brand_name' => 'BotifyAI',
        ]);

        $this->assertSame('quote', $quoteRes['format']);
        $this->assertSame(1, $quoteRes['slide_count']);
        $this->assertNotEmpty($quoteRes['primary_url']);

        $carouselRes = $service->render($wid, 'carousel', [
            'headline' => '3 Pillars of Autonomous Growth',
            'pillar' => 'AI Marketing',
            'slides' => [
                'Slide 1: Automate repetitive ideation',
                'Slide 2: Enforce brand voice and colours',
                'Slide 3: Publish at peak audience hours',
            ],
        ]);

        $this->assertSame('carousel', $carouselRes['format']);
        $this->assertSame(3, $carouselRes['slide_count']);
        $this->assertCount(3, $carouselRes['urls']);
        $this->assertSame(4, Media::where('workspace_id', $wid)->where('collection', 'social')->count());
    }

    public function test_end_to_end_autonomous_social_workflow_executes_and_publishes(): void
    {
        Queue::fake([PublishSocialPostJob::class]);

        $wid = $this->ctx['workspace']->id;
        $account = SocialAccount::create([
            'workspace_id' => $wid,
            'network' => 'linkedin',
            'account_id' => 'li_12345',
            'name' => 'BotifyAI Official',
            'access_token' => 'secret-token',
            'active' => true,
        ]);

        WorkspaceBrandProfile::forWorkspace($wid)->update([
            'brand_name' => 'BotifyAI Cloud',
            'niche' => 'Digital marketing, AI, web hosting & business growth',
            'tone' => 'professional',
            'content_pillars' => ['AI Automation', 'Web Hosting'],
            'banned_phrases' => ['game changer'],
            'requires_approval' => false,
        ]);

        $mockLlm = Mockery::mock(LlmGateway::class);
        $mockLlm->shouldReceive('chat')
            ->twice()
            ->andReturn(
                new LlmResponse(
                    content: json_encode([
                        'topic' => 'How NVMe Web Hosting Boosts AI App Conversion Rates',
                        'hook' => 'Every 100ms of latency costs 7% in conversions.',
                        'angle' => 'Infrastructure speed as a marketing advantage',
                        'format' => 'carousel',
                        'slides' => [
                            '100ms latency costs 7% of conversions',
                            'Why NVMe + edge caching matters for AI storefronts',
                            'Audit your TTFB in under 60 seconds',
                        ],
                        'quote_text' => 'Speed is the ultimate conversion feature.',
                        'promo_headline' => 'Upgrade to NVMe Hosting Today',
                    ]),
                    promptTokens: 120,
                    completionTokens: 90,
                    model: 'gpt-4o-mini',
                    latencyMs: 250,
                ),
                new LlmResponse(
                    content: json_encode([
                        'title' => 'NVMe Hosting & Conversion Speed',
                        'caption' => "Every 100ms of latency quietly taxes your ad spend.\n\nWhen we migrated client stores to NVMe infrastructure, checkout completion jumped 18%.\n\nTest your store speed today.",
                        'hashtags' => '#WebHosting #DigitalMarketing #AI #BusinessGrowth',
                    ]),
                    promptTokens: 140,
                    completionTokens: 80,
                    model: 'gpt-4o-mini',
                    latencyMs: 220,
                ),
            );
        $this->app->instance(LlmGateway::class, $mockLlm);

        $automation = Automation::create([
            'workspace_id' => $wid,
            'name' => 'Autonomous Social Engine',
            'status' => 'active',
            'trigger_type' => 'schedule.recurring',
            'trigger_config' => [
                'frequency' => 'weekdays',
                'times' => ['09:00', '16:00'],
                'timezone' => 'UTC',
            ],
            'nodes' => [
                ['id' => 'trigger-1', 'type' => 'trigger', 'data' => ['triggerType' => 'schedule.recurring']],
                ['id' => 'n1', 'type' => 'ai_social_ideation', 'data' => ['nodeType' => 'ai_social_ideation', 'format' => 'carousel']],
                ['id' => 'n2', 'type' => 'ai_social_caption', 'data' => ['nodeType' => 'ai_social_caption', 'tone' => 'professional']],
                ['id' => 'n3', 'type' => 'render_social_graphic', 'data' => ['nodeType' => 'render_social_graphic', 'template' => 'auto']],
                ['id' => 'n4', 'type' => 'publish_social_post', 'data' => ['nodeType' => 'publish_social_post', 'target_accounts' => [$account->id], 'publish_mode' => 'immediate']],
            ],
            'edges' => [
                ['source' => 'trigger-1', 'target' => 'n1'],
                ['source' => 'n1', 'target' => 'n2'],
                ['source' => 'n2', 'target' => 'n3'],
                ['source' => 'n3', 'target' => 'n4'],
            ],
        ]);

        $run = app(AutomationEngine::class)->triggerForWorkspace($automation);

        $this->assertNotNull($run);
        $run->refresh();
        $this->assertNull($run->contact_id);
        $this->assertSame('completed', $run->status);

        $post = SocialPost::where('workspace_id', $wid)->first();
        $this->assertNotNull($post);
        $this->assertSame($automation->id, $post->automation_id);
        $this->assertSame($run->id, $post->automation_run_id);
        $this->assertSame('publishing', $post->status);
        $this->assertFalse($post->requires_approval);
        $this->assertSame('carousel', $post->content_format);
        $this->assertNotEmpty($post->caption_hash);
        $this->assertCount(3, $post->media_urls);
        $this->assertStringContainsString('#WebHosting', $post->body);

        Queue::assertPushedOn('social', PublishSocialPostJob::class, fn ($job) => $job->postId === $post->id);
    }

    public function test_approval_queue_mode_saves_draft_with_requires_approval_flag(): void
    {
        Queue::fake([PublishSocialPostJob::class]);

        $wid = $this->ctx['workspace']->id;
        $account = SocialAccount::create([
            'workspace_id' => $wid,
            'network' => 'facebook',
            'account_id' => 'fb_999',
            'name' => 'BotifyAI Page',
            'access_token' => 'secret-token',
            'active' => true,
        ]);

        $automation = Automation::create([
            'workspace_id' => $wid,
            'name' => 'Approval Queue Flow',
            'status' => 'active',
            'trigger_type' => 'schedule.recurring',
            'nodes' => [
                ['id' => 'trigger-1', 'type' => 'trigger', 'data' => ['triggerType' => 'schedule.recurring']],
                ['id' => 'n1', 'type' => 'publish_social_post', 'data' => [
                    'nodeType' => 'publish_social_post',
                    'title' => 'Monday Quote',
                    'body' => ' Focus on systems, not just goals. ',
                    'target_accounts' => [$account->id],
                    'publish_mode' => 'approval_queue',
                ]],
            ],
            'edges' => [
                ['source' => 'trigger-1', 'target' => 'n1'],
            ],
        ]);

        $run = app(AutomationEngine::class)->triggerForWorkspace($automation);
        $this->assertSame('completed', $run->fresh()->status);

        $post = SocialPost::where('workspace_id', $wid)->first();
        $this->assertNotNull($post);
        $this->assertSame('draft', $post->status);
        $this->assertTrue($post->requires_approval);
        Queue::assertNothingPushed();
    }

    public function test_dispatch_scheduled_automations_job_triggers_due_automation_and_advances_next_run_at(): void
    {
        $wid = $this->ctx['workspace']->id;
        $account = SocialAccount::create([
            'workspace_id' => $wid,
            'network' => 'facebook',
            'account_id' => 'fb_sched',
            'name' => 'Sched Page',
            'access_token' => 'secret',
            'active' => true,
        ]);

        $pastDue = now()->subMinutes(2);
        $automation = Automation::create([
            'workspace_id' => $wid,
            'name' => 'Due Recurring Automation',
            'status' => 'active',
            'trigger_type' => 'schedule.recurring',
            'trigger_config' => [
                'frequency' => 'daily',
                'times' => ['09:00', '21:00'],
                'timezone' => 'UTC',
            ],
            'next_run_at' => $pastDue,
            'nodes' => [
                ['id' => 'trigger-1', 'type' => 'trigger', 'data' => ['triggerType' => 'schedule.recurring']],
                ['id' => 'n1', 'type' => 'publish_social_post', 'data' => [
                    'nodeType' => 'publish_social_post',
                    'body' => 'Automated daily insight.',
                    'target_accounts' => [$account->id],
                    'publish_mode' => 'approval_queue',
                ]],
            ],
            'edges' => [
                ['source' => 'trigger-1', 'target' => 'n1'],
            ],
        ]);

        (new DispatchScheduledAutomationsJob)->handle(app(AutomationEngine::class));

        $automation->refresh();
        $this->assertNotNull($automation->last_run_at);
        $this->assertTrue($automation->next_run_at->gt(now()));
        $this->assertSame(1, AutomationRun::where('automation_id', $automation->id)->count());
    }

    public function test_dry_run_test_simulates_social_nodes_without_creating_posts(): void
    {
        $auto = new Automation([
            'workspace_id' => $this->ctx['workspace']->id,
            'name' => 'Dry Run Social',
            'trigger_type' => 'schedule.recurring',
        ]);

        $nodes = [
            ['id' => 'trigger-1', 'type' => 'trigger', 'data' => ['triggerType' => 'schedule.recurring']],
            ['id' => 'n1', 'type' => 'ai_social_ideation', 'data' => ['nodeType' => 'ai_social_ideation', 'niche' => 'AI & Cloud']],
            ['id' => 'n2', 'type' => 'ai_social_caption', 'data' => ['nodeType' => 'ai_social_caption', 'tone' => 'professional']],
            ['id' => 'n3', 'type' => 'render_social_graphic', 'data' => ['nodeType' => 'render_social_graphic', 'template' => 'carousel']],
            ['id' => 'n4', 'type' => 'publish_social_post', 'data' => ['nodeType' => 'publish_social_post', 'publish_mode' => 'immediate']],
        ];
        $edges = [
            ['source' => 'trigger-1', 'target' => 'n1'],
            ['source' => 'n1', 'target' => 'n2'],
            ['source' => 'n2', 'target' => 'n3'],
            ['source' => 'n3', 'target' => 'n4'],
        ];

        $res = app(AutomationEngine::class)->testRun($auto, $nodes, $edges);

        $this->assertTrue($res['ok']);
        $this->assertCount(4, $res['steps']);
        $this->assertSame('ai_social_ideation', $res['steps'][0]['node_type']);
        $this->assertSame('ai_social_caption', $res['steps'][1]['node_type']);
        $this->assertSame('render_social_graphic', $res['steps'][2]['node_type']);
        $this->assertSame('publish_social_post', $res['steps'][3]['node_type']);
        $this->assertSame(0, SocialPost::count());
    }

    public function test_workflow_generator_compiles_natural_language_social_strategy_and_saves_brand_profile(): void
    {
        $wid = $this->ctx['workspace']->id;

        $mockLlm = Mockery::mock(LlmGateway::class);
        $mockLlm->shouldReceive('chat')
            ->once()
            ->andReturn(new LlmResponse(
                content: json_encode([
                    'name' => 'Autonomous Content Strategy',
                    'trigger_type' => 'schedule.recurring',
                    'trigger_config' => [
                        'frequency' => 'custom',
                        'days_of_week' => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
                        'times' => ['09:00', '16:00'],
                        'timezone' => 'UTC',
                    ],
                    'brand_profile' => [
                        'niche' => 'Digital marketing, AI, web hosting and business growth',
                        'tone' => 'professional',
                        'content_pillars' => ['Digital Marketing', 'AI', 'Web Hosting', 'Business Growth'],
                    ],
                    'nodes' => [
                        ['id' => 'n1', 'type' => 'ai_social_ideation', 'data' => ['format' => 'auto']],
                        ['id' => 'n2', 'type' => 'ai_social_caption', 'data' => ['tone' => 'professional']],
                        ['id' => 'n3', 'type' => 'render_social_graphic', 'data' => ['template' => 'auto']],
                        ['id' => 'n4', 'type' => 'publish_social_post', 'data' => ['publish_mode' => 'immediate']],
                    ],
                    'edges' => [
                        ['source' => 'trigger-1', 'target' => 'n1'],
                        ['source' => 'n1', 'target' => 'n2'],
                        ['source' => 'n2', 'target' => 'n3'],
                        ['source' => 'n3', 'target' => 'n4'],
                    ],
                ]),
                promptTokens: 200,
                completionTokens: 150,
                model: 'gpt-4o-mini',
                latencyMs: 300,
            ));
        $this->app->instance(LlmGateway::class, $mockLlm);

        $graph = app(WorkflowGenerator::class)->generate($wid, 'Post twice every weekday and once on Saturday about digital marketing, AI, web hosting and business growth.');

        $this->assertSame('schedule.recurring', $graph['trigger_type']);
        $this->assertSame(['09:00', '16:00'], $graph['trigger_config']['times']);
        $this->assertCount(5, $graph['nodes']); // trigger-1 + 4 social nodes

        $profile = WorkspaceBrandProfile::forWorkspace($wid)->fresh();
        $this->assertSame('Digital marketing, AI, web hosting and business growth', $profile->niche);
        $this->assertSame(['Digital Marketing', 'AI', 'Web Hosting', 'Business Growth'], $profile->content_pillars);
    }
}

