<?php

namespace App\Services\Entitlements;

use App\Models\Client;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Workspace;
use App\Modules\Broadcasting\Models\UsageMeter;
use Illuminate\Support\Facades\Cache;

class EntitlementService
{
    /**
     * Resolve the effective active Plan for a given subject (Workspace, Client, or User).
     */
    public function resolvePlan(Workspace|Client|User|null $subject): ?Plan
    {
        if (! $subject) {
            return null;
        }

        $client = null;
        $workspace = null;

        if ($subject instanceof Workspace) {
            $workspace = $subject;
            $client = $subject->client;
        } elseif ($subject instanceof Client) {
            $client = $subject;
        } elseif ($subject instanceof User) {
            $client = $subject->client;
            $workspace = $subject->currentWorkspace ?? Workspace::find($subject->current_workspace_id ?? $subject->workspace_id);
            if (! $client && $workspace) {
                $client = $workspace->client;
            }
        }

        if (! $client) {
            return null;
        }

        // 1. Check direct active admin-assigned subscription
        $clientSub = $client->activeSubscription;
        if ($clientSub?->plan && $clientSub->plan->enabled) {
            return $clientSub->plan;
        }

        // 2. Check user-level active subscription (Stripe, PayPal, Paddle, etc.)
        $userSub = Subscription::whereIn('user_id', $client->users()->select('id'))
            ->whereIn('status', ['active', 'trialing'])
            ->with('plan')
            ->orderByDesc('id')
            ->first();

        if ($userSub?->plan && $userSub->plan->enabled) {
            return $userSub->plan;
        }

        // 3. Fallback to default free plan if configured, or lowest price active plan
        return Cache::remember('default_free_plan', 3600, function () {
            return Plan::where('enabled', true)
                ->where('price_cents', 0)
                ->orderBy('sort_order')
                ->first()
                ?? Plan::where('enabled', true)
                    ->orderBy('price_cents')
                    ->first();
        });
    }

    /**
     * Check if the subject has permission/access to a boolean feature.
     */
    public function canAccess(Workspace|Client|User|null $subject, string $featureKey): bool
    {
        $plan = $this->resolvePlan($subject);
        if (! $plan) {
            return FeatureRegistry::getDefaultFeature($featureKey);
        }

        return $plan->hasFeature($featureKey);
    }

    /**
     * Get the numeric limit for a persistent resource or monthly meter.
     * Returns null if unlimited.
     */
    public function getLimit(Workspace|Client|User|null $subject, string $limitKey): ?int
    {
        $plan = $this->resolvePlan($subject);
        if (! $plan) {
            return FeatureRegistry::getDefaultLimit($limitKey);
        }

        return $plan->limitValue($limitKey);
    }

    /**
     * Check if a static resource cap has been reached (e.g. max chatbots, team seats).
     */
    public function hasReachedLimit(Workspace|Client|User|null $subject, string $limitKey, ?int $currentCount = null): bool
    {
        $limit = $this->getLimit($subject, $limitKey);
        if ($limit === null) {
            return false; // Unlimited
        }

        if ($currentCount === null) {
            $currentCount = $this->countCurrentResource($subject, $limitKey);
        }

        return $currentCount >= $limit;
    }

    /**
     * Dynamically count the current live instances of a resource for a workspace.
     */
    public function countCurrentResource(Workspace|Client|User|null $subject, string $limitKey): int
    {
        $workspaceId = $this->extractWorkspaceId($subject);
        if (! $workspaceId) {
            return 0;
        }

        try {
            return match ($limitKey) {
                'max_whatsapp_accounts', 'whatsapp_accounts' => class_exists(\App\Modules\Shared\Models\ChannelAccount::class)
                    ? \App\Modules\Shared\Models\ChannelAccount::where('workspace_id', $workspaceId)
                        ->where('channel', 'whatsapp')
                        ->where('status', '!=', 'disconnected')
                        ->count()
                    : 0,
                'max_chatbots', 'chatbots' => class_exists(\App\Modules\AI\Models\AiChatbot::class)
                    ? \App\Modules\AI\Models\AiChatbot::where('workspace_id', $workspaceId)->count()
                    : 0,
                'max_knowledge_sources', 'knowledge_bases' => class_exists(\App\Modules\AI\Models\KnowledgeSource::class)
                    ? \App\Modules\AI\Models\KnowledgeSource::where('workspace_id', $workspaceId)->count()
                    : 0,
                'users' => \Illuminate\Support\Facades\Schema::hasTable('workspace_user')
                    ? \Illuminate\Support\Facades\DB::table('workspace_user')->where('workspace_id', $workspaceId)->count()
                    : 0,
                'automations' => \Illuminate\Support\Facades\Schema::hasTable('automations')
                    ? \Illuminate\Support\Facades\DB::table('automations')->where('workspace_id', $workspaceId)->count()
                    : 0,
                default => 0,
            };
        } catch (\Throwable $e) {
            return 0;
        }
    }

    /**
     * Get current month's usage for a metered metric.
     */
    public function getUsage(Workspace|Client|User|null $subject, string $metric): int
    {
        $workspaceId = $this->extractWorkspaceId($subject);
        if (! $workspaceId) {
            return 0;
        }

        return UsageMeter::current($workspaceId, $metric);
    }

    /**
     * Consume quota for a monthly metered metric.
     * Returns false if the limit is exceeded.
     */
    public function consumeQuota(Workspace|Client|User|null $subject, string $metric, int $amount = 1): bool
    {
        $limit = $this->getLimit($subject, $metric);
        $workspaceId = $this->extractWorkspaceId($subject);

        if (! $workspaceId) {
            return true;
        }

        if ($limit !== null) {
            $current = UsageMeter::current($workspaceId, $metric);
            if (($current + $amount) > $limit) {
                return false;
            }
        }

        UsageMeter::track($workspaceId, $metric, $amount);

        return true;
    }

    /**
     * Export all active entitlements and usage for Inertia / API responses.
     */
    public function getAllEntitlements(Workspace|Client|User|null $subject): array
    {
        $plan = $this->resolvePlan($subject);
        $features = [];
        $limits = [];
        $usage = [];

        foreach (FeatureRegistry::definitions() as $key => $meta) {
            if ($meta['type'] === FeatureRegistry::TYPE_BOOLEAN) {
                $features[$key] = $this->canAccess($subject, $key);
            } else {
                $limitVal = $this->getLimit($subject, $key);
                $limits[$key] = $limitVal;
                if ($meta['type'] === FeatureRegistry::TYPE_METERED) {
                    $usage[$key] = $this->getUsage($subject, $key);
                }
            }
        }

        return [
            'plan' => $plan ? [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
            ] : null,
            'features' => $features,
            'limits' => $limits,
            'usage' => $usage,
        ];
    }

    private function extractWorkspaceId(Workspace|Client|User|null $subject): ?int
    {
        if ($subject instanceof Workspace) {
            return (int) $subject->id;
        }
        if ($subject instanceof User) {
            return (int) ($subject->current_workspace_id ?? $subject->workspace_id);
        }
        if ($subject instanceof Client) {
            return (int) ($subject->workspaces()->value('id') ?? 0) ?: null;
        }

        return null;
    }
}
