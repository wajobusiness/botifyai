<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AffiliateSubscription;
use App\Models\Currency;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAffiliateController extends Controller
{
    /**
     * Display the Admin Affiliate Management and Access Fee Settings.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status');
        $planFilter = $request->input('plan');

        // Current platform settings
        $settings = [
            'access_fee' => (float) (SystemSetting::get('affiliate_access_fee') ?? 0),
            'access_currency' => SystemSetting::get('affiliate_access_currency') ?? 'USD',
            'access_cycle' => SystemSetting::get('affiliate_access_cycle') ?? 'yearly',
        ];

        // Active currencies
        $currencies = Currency::where('enabled', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('code', 'asc')
            ->get(['code', 'symbol', 'decimals', 'exchange_rate'])
            ->toArray();

        // Query affiliates
        $query = User::with(['latestAffiliateSubscription', 'affiliateSubscriptions'])
            ->where(function ($q) {
                $q->where('affiliate_status', '!=', 'inactive')
                    ->orWhereJsonContains('user_roles', 'affiliate')
                    ->orWhere('active_role', 'affiliate')
                    ->orWhereHas('affiliateSubscriptions');
            })
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            });

        $affiliates = (clone $query)
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(function (User $u) {
                $sub = $u->latestAffiliateSubscription;
                $referralCode = 'AFF-'.strtoupper(substr(md5($u->id.$u->email), 0, 8));

                $totalPaid = $u->affiliateSubscriptions()
                    ->where('status', 'active')
                    ->sum('amount_paid');

                $effectiveStatus = 'free';
                if ($u->affiliate_status === 'comped' || $sub?->plan_type === 'comped') {
                    $effectiveStatus = 'comped';
                } elseif ($sub) {
                    $effectiveStatus = $sub->isActive() ? 'active' : 'expired';
                } elseif ($u->hasActiveAffiliateAccess()) {
                    $effectiveStatus = 'active';
                }

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'referral_code' => $referralCode,
                    'affiliate_status' => $u->affiliate_status ?: 'active',
                    'effective_status' => $effectiveStatus,
                    'plan_type' => $sub?->plan_type ?? ($u->affiliate_status === 'comped' ? 'comped' : 'free'),
                    'amount_paid' => $sub ? (float) $sub->amount_paid : 0.0,
                    'total_revenue' => (float) $totalPaid,
                    'currency' => $sub?->currency ?? 'USD',
                    'payment_gateway' => $sub?->payment_gateway,
                    'payment_reference' => $sub?->payment_reference,
                    'started_at' => $sub?->started_at?->format('Y-m-d H:i'),
                    'expires_at' => $sub?->expires_at?->format('Y-m-d H:i'),
                    'is_active' => $u->hasActiveAffiliateAccess(),
                ];
            });

        // Global stats
        $totalAffiliatesCount = User::where('affiliate_status', '!=', 'inactive')
            ->orWhereJsonContains('user_roles', 'affiliate')
            ->orWhere('active_role', 'affiliate')
            ->orWhereHas('affiliateSubscriptions')
            ->count();

        $activePaidCount = AffiliateSubscription::active()
            ->where('amount_paid', '>', 0)
            ->distinct('user_id')
            ->count('user_id');

        $totalRevenueCollected = (float) AffiliateSubscription::where('status', 'active')->sum('amount_paid');

        return Inertia::render('Admin/Affiliates/Index', [
            'settings' => $settings,
            'currencies' => $currencies,
            'affiliates' => $affiliates,
            'filters' => $request->only('search', 'status', 'plan'),
            'stats' => [
                'total_affiliates' => $totalAffiliatesCount,
                'active_paid_affiliates' => $activePaidCount,
                'total_revenue' => $totalRevenueCollected,
            ],
        ]);
    }

    /**
     * Update platform-wide affiliate access fee settings.
     */
    public function updateSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'access_fee' => ['required', 'numeric', 'min:0'],
            'access_currency' => ['required', 'string', 'max:8'],
            'access_cycle' => ['required', 'string', 'in:monthly,yearly'],
        ]);

        SystemSetting::set('affiliate_access_fee', (string) $validated['access_fee']);
        SystemSetting::set('affiliate_access_currency', strtoupper($validated['access_currency']));
        SystemSetting::set('affiliate_access_cycle', strtolower($validated['access_cycle']));

        return back()->with('success', 'Affiliate access settings updated successfully.');
    }

    /**
     * Comp / Grant free access to a specific affiliate.
     */
    public function compUser(Request $request, User $user): RedirectResponse
    {
        $user->affiliate_status = 'comped';
        $user->save();

        // Create or update subscription record
        AffiliateSubscription::updateOrCreate(
            ['user_id' => $user->id, 'plan_type' => 'comped'],
            [
                'amount_paid' => 0,
                'currency' => SystemSetting::get('affiliate_access_currency', 'USD'),
                'payment_gateway' => 'admin_comp',
                'payment_reference' => 'COMP-'.strtoupper(uniqid()),
                'status' => 'active',
                'started_at' => now(),
                'expires_at' => null, // Lifetime comped access
            ]
        );

        return back()->with('success', "Affiliate access granted to {$user->name} as Comped (Free Access).");
    }

    /**
     * Extend an affiliate's access duration by 1 year.
     */
    public function extendExpiry(Request $request, User $user): RedirectResponse
    {
        $sub = $user->latestAffiliateSubscription;

        $cycle = SystemSetting::get('affiliate_access_cycle', 'yearly');
        $duration = $cycle === 'monthly' ? now()->addMonth() : now()->addYear();

        if ($sub && $sub->expires_at && $sub->expires_at->isFuture()) {
            $newExpiry = $cycle === 'monthly' ? $sub->expires_at->addMonth() : $sub->expires_at->addYear();
            $sub->update([
                'expires_at' => $newExpiry,
                'status' => 'active',
            ]);
        } else {
            AffiliateSubscription::create([
                'user_id' => $user->id,
                'plan_type' => $cycle,
                'amount_paid' => 0,
                'currency' => SystemSetting::get('affiliate_access_currency', 'USD'),
                'payment_gateway' => 'admin_extension',
                'payment_reference' => 'EXT-'.strtoupper(uniqid()),
                'status' => 'active',
                'started_at' => now(),
                'expires_at' => $duration,
            ]);
        }

        $user->affiliate_status = 'active';
        $user->save();

        return back()->with('success', "Affiliate access extended for {$user->name}.");
    }

    /**
     * Revoke / expire an affiliate's access.
     */
    public function revokeAccess(Request $request, User $user): RedirectResponse
    {
        $user->affiliate_status = 'inactive';
        $user->save();

        AffiliateSubscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->update([
                'status' => 'cancelled',
                'expires_at' => now(),
            ]);

        return back()->with('success', "Affiliate access revoked for {$user->name}.");
    }
}
