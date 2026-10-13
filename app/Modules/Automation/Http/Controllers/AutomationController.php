<?php

namespace App\Modules\Automation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\AI\Models\AiChatbot;
use App\Modules\Automation\Models\Automation;
use App\Modules\Automation\Models\AutomationRun;
use App\Modules\Automation\Services\AutomationEngine;
use App\Modules\Automation\Services\WorkflowGenerator;
use App\Modules\Broadcasting\Models\Campaign;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Integrations\Models\IntegrationConfig;
use App\Modules\Social\Models\SocialAccount;
use App\Modules\Social\Models\WorkspaceBrandProfile;
use App\Modules\Whatsapp\Models\WhatsappTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use App\Modules\Automation\Jobs\DispatchScheduledAutomationsJob;
use App\Modules\Social\Jobs\DispatchScheduledPostsJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AutomationController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    private function runOpportunisticSchedulerTick(int $workspaceId): void
    {
        if (app()->runningUnitTests()) {
            return;
        }

        try {
            $hasNextRunCol = \Illuminate\Support\Facades\Schema::hasColumn('automations', 'next_run_at');
            Automation::where('workspace_id', $workspaceId)
                ->where('trigger_type', 'schedule.recurring')
                ->where(function ($q) use ($hasNextRunCol) {
                    $q->where('status', 'draft');
                    if ($hasNextRunCol) {
                        $q->orWhereNull('next_run_at');
                    }
                })
                ->get()
                ->each(function (Automation $automation) use ($hasNextRunCol) {
                    if ($automation->status === 'draft') {
                        $automation->status = 'active';
                    }
                    if ($hasNextRunCol && ! $automation->next_run_at) {
                        $automation->next_run_at = $automation->computeNextRunAt();
                    }
                    $automation->save();
                });

            if (Cache::add('social_automation_due_tick', 1, 20)) {
                (new DispatchScheduledAutomationsJob)->handle(app(AutomationEngine::class));
                (new DispatchScheduledPostsJob)->handle();
            }
        } catch (\Throwable) {
            // Non-blocking opportunistic tick
        }
    }

    public function index(Request $request): Response
    {
        $wid = $this->workspaceId($request);
        $this->runOpportunisticSchedulerTick($wid);

        $automations = Automation::where('workspace_id', $wid)
            ->withCount('runs')
            ->latest()->get();

        return Inertia::render('Automation/Index', ['automations' => $automations]);
    }

    public function store(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $validated = $request->validate(['name' => ['required', 'string', 'max:128']]);

        $auto = Automation::create(array_merge($validated, [
            'workspace_id' => $wid,
            'status' => 'draft',
            'nodes' => [['id' => 'trigger-1', 'type' => 'trigger', 'position' => ['x' => 250, 'y' => 50], 'data' => ['label' => 'Trigger']]],
            'edges' => [],
        ]));

        return redirect()->route('client.automations.edit', $auto->uuid)->with('success', 'Automation created.');
    }

    public function edit(Request $request, Automation $automation): Response
    {
        $this->authorise($request, $automation);
        $wid = (int) $automation->workspace_id;
        $this->runOpportunisticSchedulerTick($wid);
        $automation->refresh();

        return Inertia::render('Automation/Builder', [
            'automation' => $automation,
            'resources' => $this->builderResources($wid, $automation->id),
        ]);
    }

    /**
     * Reference data the builder needs to populate node config dropdowns
     * (templates, campaigns, chatbots, sub-flows, agents, stores, social accounts, brand profile)
     * plus a map of which optional integrations are connected.
     */
    private function builderResources(int $workspaceId, int $currentAutomationId): array
    {
        return [
            // All templates (approved first) so the builder can list existing ones and
            // surface their body variables; non-approved are shown but flagged in the UI.
            'templates' => WhatsappTemplate::where('workspace_id', $workspaceId)
                ->orderByRaw("CASE WHEN status = 'APPROVED' THEN 0 ELSE 1 END")
                ->orderBy('name')
                ->get(['name', 'language', 'status', 'components'])
                ->map(fn ($t) => [
                    'name' => $t->name,
                    'language' => $t->language,
                    'status' => $t->status,
                    'components' => $t->components,
                ])
                ->values(),
            'campaigns' => Campaign::where('workspace_id', $workspaceId)
                ->latest()->limit(100)->get(['id', 'name'])->values(),
            'chatbots' => AiChatbot::where('workspace_id', $workspaceId)
                ->where('enabled', true)->orderBy('name')->get(['id', 'name'])->values(),
            'subflows' => Automation::where('workspace_id', $workspaceId)
                ->where('id', '!=', $currentAutomationId)
                ->orderBy('name')->get(['uuid', 'name', 'status'])->values(),
            'agents' => User::where('workspace_id', $workspaceId)
                ->orderBy('name')->get(['id', 'name'])->values(),
            'stores' => EcommerceStore::where('workspace_id', $workspaceId)
                ->get(['id', 'platform', 'name'])->values(),
            'social_accounts' => SocialAccount::where('workspace_id', $workspaceId)
                ->orderBy('network')
                ->orderBy('name')
                ->get(['id', 'network', 'name', 'picture_url', 'active'])
                ->values(),
            'brand_profile' => WorkspaceBrandProfile::forWorkspace($workspaceId),
            'integrations' => [
                'google' => (bool) optional(IntegrationConfig::forProvider('google_workspace'))->enabled,
            ],
        ];
    }

    public function update(Request $request, Automation $automation): RedirectResponse
    {
        $this->authorise($request, $automation);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:128'],
            'status' => ['sometimes', 'in:active,paused,draft'],
            'trigger_type' => ['nullable', 'string', 'max:64'],
            'trigger_config' => ['nullable', 'array'],
            'nodes' => ['nullable', 'array'],
            'edges' => ['nullable', 'array'],
        ]);

        $automation->fill($validated);
        $hasNextRunCol = \Illuminate\Support\Facades\Schema::hasColumn('automations', 'next_run_at');
        if ($automation->trigger_type === 'schedule.recurring') {
            if (! array_key_exists('status', $validated) && $automation->status === 'draft') {
                $automation->status = 'active';
            }
            if ($hasNextRunCol) {
                $automation->next_run_at = $automation->computeNextRunAt();
            }
        } elseif ($hasNextRunCol) {
            $automation->next_run_at = null;
        }
        $automation->save();

        return back()->with('success', 'Automation saved.');
    }

    public function updateBrandProfile(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);
        $validated = $request->validate([
            'brand_name' => ['nullable', 'string', 'max:255'],
            'niche' => ['nullable', 'string', 'max:255'],
            'target_audience' => ['nullable', 'string', 'max:500'],
            'tone' => ['nullable', 'string', 'max:255'],
            'writing_style' => ['nullable', 'string', 'max:500'],
            'content_pillars' => ['nullable', 'array'],
            'content_pillars.*' => ['string', 'max:120'],
            'brand_colors' => ['nullable', 'array'],
            'cta_templates' => ['nullable', 'array'],
            'banned_phrases' => ['nullable', 'array'],
            'banned_phrases.*' => ['string', 'max:120'],
            'default_hashtag_sets' => ['nullable', 'array'],
            'requires_approval' => ['nullable', 'boolean'],
            'auto_replenish' => ['nullable', 'boolean'],
        ]);

        $profile = WorkspaceBrandProfile::forWorkspace($wid);
        $profile->update($validated);

        return response()->json([
            'ok' => true,
            'brand_profile' => $profile->fresh(),
        ]);
    }

    public function destroy(Request $request, Automation $automation): RedirectResponse
    {
        $this->authorise($request, $automation);
        $automation->delete();

        return redirect()->route('client.automations.index')->with('success', 'Automation deleted.');
    }

    public function runs(Request $request, Automation $automation): Response
    {
        $this->authorise($request, $automation);
        $runs = AutomationRun::where('automation_id', $automation->id)
            ->with('logs')
            ->latest()->paginate(50);

        return Inertia::render('Automation/Runs', ['automation' => $automation, 'runs' => $runs]);
    }

    public function generateToken(Request $request, Automation $automation): JsonResponse
    {
        $this->authorise($request, $automation);
        $automation->update(['trigger_token' => Str::random(48)]);

        return response()->json(['trigger_token' => $automation->trigger_token]);
    }

    /**
     * Dry-run the automation and return a step-by-step trace. Tests the live builder
     * state (posted nodes/edges) when supplied, otherwise the saved version. The engine
     * simulates every action — nothing is actually sent and no data is written.
     */
    public function test(Request $request, Automation $automation): JsonResponse
    {
        $this->authorise($request, $automation);
        $validated = $request->validate([
            'nodes' => ['nullable', 'array'],
            'edges' => ['nullable', 'array'],
            'trigger_type' => ['nullable', 'string', 'max:64'],
            'trigger_config' => ['nullable', 'array'],
            'sample_message' => ['nullable', 'string', 'max:1000'],
        ]);

        $nodes = $validated['nodes'] ?? $automation->nodes ?? [];
        $edges = $validated['edges'] ?? $automation->edges ?? [];
        if (array_key_exists('trigger_type', $validated)) {
            $automation->trigger_type = $validated['trigger_type']; // in-memory only, never persisted
        }
        if (array_key_exists('trigger_config', $validated)) {
            $automation->trigger_config = $validated['trigger_config']; // in-memory only, never persisted
        }

        $context = [];
        if (! empty($validated['sample_message'])) {
            $context['message_body'] = $validated['sample_message'];
        }

        return response()->json(app(AutomationEngine::class)->testRun($automation, $nodes, $edges, $context));
    }

    /**
     * Generate a full automation graph from a natural-language prompt via the workspace LLM.
     * With persist=true a new automation is created and an edit URL returned; otherwise the
     * normalised graph is returned for the builder to drop onto the canvas for review.
     */
    public function generate(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);
        $validated = $request->validate([
            'prompt' => ['required', 'string', 'max:2000'],
            'persist' => ['nullable', 'boolean'],
            'timezone' => ['nullable', 'string', 'max:64'],
        ]);

        try {
            $graph = app(WorkflowGenerator::class)->generate($wid, $validated['prompt']);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 422);
        }

        if (($graph['trigger_type'] ?? null) === 'schedule.recurring' && ! empty($validated['timezone'])) {
            $tz = trim((string) $validated['timezone']);
            try {
                new \DateTimeZone($tz);
                if (empty($graph['trigger_config']['timezone']) || $graph['trigger_config']['timezone'] === 'UTC') {
                    $graph['trigger_config']['timezone'] = $tz;
                }
            } catch (\Throwable) {
                // Keep default timezone if invalid
            }
        }

        if ($request->boolean('persist')) {
            $isRecurring = ($graph['trigger_type'] ?? null) === 'schedule.recurring';
            $auto = new Automation([
                'workspace_id' => $wid,
                'name' => $graph['name'],
                'status' => $isRecurring ? 'active' : 'draft',
                'trigger_type' => $graph['trigger_type'],
                'trigger_config' => $graph['trigger_config'],
                'nodes' => $graph['nodes'],
                'edges' => $graph['edges'],
            ]);
            if ($isRecurring && \Illuminate\Support\Facades\Schema::hasColumn('automations', 'next_run_at')) {
                $auto->next_run_at = $auto->computeNextRunAt();
            }
            $auto->save();

            return response()->json(['ok' => true, 'redirect' => route('client.automations.edit', $auto->uuid)]);
        }

        return response()->json([
            'ok' => true,
            'graph' => $graph,
            'brand_profile' => WorkspaceBrandProfile::forWorkspace($wid),
        ]);
    }

    private function authorise(Request $request, Automation $automation): void
    {
        abort_unless((int) $automation->workspace_id === $this->workspaceId($request), 403);
    }
}
