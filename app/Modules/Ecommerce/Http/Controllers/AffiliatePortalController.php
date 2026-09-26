<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AffiliatePortalController extends Controller
{
    /**
     * Display the affiliate portal dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Ensure user has affiliate code
        $referralCode = 'AFF-' . strtoupper(substr(md5($user->id . $user->email), 0, 8));

        // Marketplace products eligible for promotion (only where seller enabled affiliate promotion)
        $marketplaceProducts = EcommerceProduct::where('status', 'active')
            ->where('is_published', true)
            ->where('affiliate_enabled', true)
            ->with('store')
            ->latest()
            ->take(18)
            ->get()
            ->map(function (EcommerceProduct $p) use ($referralCode) {
                $commissionRate = $p->getAffiliateCommissionPercentage();
                $estimatedCommission = round(((float) $p->price) * ($commissionRate / 100), 2);

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'store_name' => $p->store?->name ?? 'Botify Store',
                    'price' => (float) $p->price,
                    'currency' => $p->currency ?: 'NGN',
                    'commission_rate' => $commissionRate,
                    'estimated_commission' => $estimatedCommission,
                    'image_url' => $p->image_url,
                    'affiliate_link' => $p->getCheckoutUrl() . '?ref=' . $referralCode,
                ];
            });

        $stats = [
            'total_clicks' => 0,
            'total_referrals' => 0,
            'conversion_rate' => 0.0,
            'pending_commission' => 0.0,
            'paid_commission' => 0.0,
            'total_earnings' => 0.0,
            'commission_rate' => '15%',
        ];

        return Inertia::render('Affiliate/Dashboard', [
            'affiliate' => [
                'name' => $user->name,
                'email' => $user->email,
                'referral_code' => $referralCode,
                'referral_link' => url('/?ref=' . $referralCode),
                'status' => $user->affiliate_status ?: 'active',
            ],
            'stats' => $stats,
            'marketplaceProducts' => $marketplaceProducts,
        ]);
    }
}

