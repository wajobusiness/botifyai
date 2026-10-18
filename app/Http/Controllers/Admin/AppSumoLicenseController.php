<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSumoLicense;
use App\Models\Plan;
use App\Services\License\AppSumoRedemptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AppSumoLicenseController extends Controller
{
    public function __construct(
        protected AppSumoRedemptionService $service
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $tier = $request->query('tier');
        $search = trim((string) $request->query('search', ''));

        $query = AppSumoLicense::with(['plan:id,name,slug', 'redeemedBy:id,name,email', 'client:id,name'])
            ->latest('id');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($tier && $tier !== 'all') {
            $query->where('tier', $tier);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhereHas('redeemedBy', function ($uq) use ($search) {
                        $uq->where('email', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
            });
        }

        $licenses = $query->paginate(20)->withQueryString()->through(fn (AppSumoLicense $lic) => [
            'id' => $lic->id,
            'code' => $lic->code,
            'masked_code' => $lic->maskedCode(),
            'tier' => $lic->tier,
            'status' => $lic->status,
            'plan_name' => $lic->plan?->name ?? 'Unknown',
            'redeemed_by' => $lic->redeemedBy ? [
                'id' => $lic->redeemedBy->id,
                'name' => $lic->redeemedBy->name,
                'email' => $lic->redeemedBy->email,
            ] : null,
            'client_name' => $lic->client?->name,
            'redeemed_at' => $lic->redeemed_at?->toIso8601String(),
            'created_at' => $lic->created_at->toIso8601String(),
            'ip_address' => $lic->ip_address,
        ]);

        $stats = [
            'total' => AppSumoLicense::count(),
            'unredeemed' => AppSumoLicense::where('status', AppSumoLicense::STATUS_UNREDEEMED)->count(),
            'redeemed' => AppSumoLicense::where('status', AppSumoLicense::STATUS_REDEEMED)->count(),
            'refunded' => AppSumoLicense::whereIn('status', [AppSumoLicense::STATUS_REFUNDED, AppSumoLicense::STATUS_REVOKED])->count(),
        ];

        $plans = Plan::where('enabled', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'interval']);

        return Inertia::render('Admin/AppSumo/Index', [
            'licenses' => $licenses,
            'stats' => $stats,
            'plans' => $plans,
            'filters' => [
                'status' => $status ?? 'all',
                'tier' => $tier ?? 'all',
                'search' => $search,
            ],
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tier' => ['required', 'string', 'in:tier1,tier2,tier3,tier4,tier5'],
            'count' => ['required', 'integer', 'min:1', 'max:5000'],
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'prefix' => ['nullable', 'string', 'max:12', 'regex:/^[A-Z0-9]+$/i'],
        ]);

        $prefix = strtoupper($validated['prefix'] ?? 'BOTIFY');
        $result = $this->service->generateBatch(
            $validated['tier'],
            $validated['count'],
            $validated['plan_id'],
            $prefix
        );

        return back()->with('success', __("Successfully generated :count codes for :plan (:tier).", [
            'count' => $result['count'],
            'plan' => $result['plan_name'],
            'tier' => $result['tier'],
        ]));
    }

    public function export(Request $request): StreamedResponse
    {
        $status = $request->query('status');
        $tier = $request->query('tier');

        $query = AppSumoLicense::with(['plan', 'redeemedBy']);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($tier && $tier !== 'all') {
            $query->where('tier', $tier);
        }

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['License Code', 'Tier', 'Plan Name', 'Status', 'Redeemed By Email', 'Redeemed At', 'Created At']);

            $query->chunk(500, function ($rows) use ($handle) {
                foreach ($rows as $lic) {
                    fputcsv($handle, [
                        $lic->code,
                        $lic->tier,
                        $lic->plan?->name,
                        $lic->status,
                        $lic->redeemedBy?->email ?? '',
                        $lic->redeemed_at ? $lic->redeemed_at->toDateTimeString() : '',
                        $lic->created_at->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, 'appsumo-licenses-' . date('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function revoke(Request $request, AppSumoLicense $license): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'in:refunded,revoked'],
        ]);

        $this->service->revokeLicense(
            $license,
            $validated['reason'],
            $request->user('admin')
        );

        return back()->with('success', __('License :code marked as :reason.', [
            'code' => $license->maskedCode(),
            'reason' => $validated['reason'],
        ]));
    }
}

