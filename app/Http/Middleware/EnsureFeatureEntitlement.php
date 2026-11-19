<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use App\Services\Entitlements\EntitlementService;
use App\Services\Entitlements\FeatureRegistry;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeatureEntitlement
{
    public function __construct(
        private EntitlementService $entitlements
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  string  $featureKey  The feature key defined in FeatureRegistry
     */
    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        $workspaceId = $user->current_workspace_id ?? $user->workspace_id;
        $workspace = $workspaceId ? Workspace::with('client')->find($workspaceId) : null;

        if (! $workspace) {
            return $next($request);
        }

        if (! $this->entitlements->canAccess($workspace, $featureKey)) {
            $def = FeatureRegistry::definitions()[$featureKey] ?? null;
            $featureName = $def['name'] ?? ucwords(str_replace('_', ' ', $featureKey));

            if ($request->expectsJson()) {
                return response()->json([
                    'error' => "Your current subscription plan does not include {$featureName}.",
                    'upgrade_required' => true,
                    'feature' => $featureKey,
                ], 403);
            }

            return redirect('/billing')
                ->with('upgrade_required', true)
                ->with('upgrade_reason', "Access to {$featureName} requires a plan upgrade.");
        }

        return $next($request);
    }
}
