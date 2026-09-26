<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AffiliateSubscription;
use App\Models\Currency;
use App\Models\PaymentGatewayConfig;
use App\Models\SystemSetting;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Services\CurrencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AffiliatePortalController extends Controller
{
    /**
     * Display the affiliate portal dashboard.
     * Gated by hasActiveAffiliateAccess() if an access fee is configured.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // Gating check: if platform requires paid access and user has not unlocked it
        if (! $user->hasActiveAffiliateAccess()) {
            return redirect()->route('client.affiliates.join');
        }

        // Ensure user has affiliate code
        $referralCode = 'AFF-' . strtoupper(substr(md5($user->id . $user->email), 0, 8));

        // Marketplace products eligible for promotion (only where seller enabled affiliate promotion)
        $marketplaceProducts = EcommerceProduct::where('status', 'active')
            ->where('is_published', true)
            ->where('affiliate_enabled', true)
            ->with('store')
            ->latest()
            ->take(24)
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

        $sub = $user->latestAffiliateSubscription;

        $stats = [
            'total_clicks' => 0,
            'total_referrals' => 0,
            'conversion_rate' => 0.0,
            'pending_commission' => 0.0,
            'paid_commission' => 0.0,
            'total_earnings' => 0.0,
            'commission_rate' => '15%',
            'plan_type' => $sub?->plan_type ?? ($user->affiliate_status === 'comped' ? 'comped' : 'free'),
            'expires_at' => $sub?->expires_at?->format('M d, Y'),
        ];

        return Inertia::render('Affiliate/Dashboard', [
            'affiliate' => [
                'name' => $user->name,
                'email' => $user->email,
                'referral_code' => $referralCode,
                'referral_link' => url('/?ref=' . $referralCode),
                'status' => $user->affiliate_status ?: 'active',
                'plan_type' => $stats['plan_type'],
                'expires_at' => $stats['expires_at'],
            ],
            'stats' => $stats,
            'marketplaceProducts' => $marketplaceProducts,
        ]);
    }

    /**
     * Display the Affiliate Paywall / Join Screen.
     */
    public function join(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // If user already has active access, redirect to dashboard
        if ($user->hasActiveAffiliateAccess()) {
            return redirect()->route('client.affiliates.index');
        }

        $accessFee = (float) (SystemSetting::get('affiliate_access_fee') ?? 0);
        $accessCurrency = SystemSetting::get('affiliate_access_currency') ?? 'USD';
        $accessCycle = SystemSetting::get('affiliate_access_cycle') ?? 'yearly';

        // If fee is 0, activate immediately and send to dashboard
        if ($accessFee <= 0) {
            $user->affiliate_status = 'active';
            $roles = $user->user_roles ?? ['merchant', 'customer'];
            if (! in_array('affiliate', $roles, true)) {
                $roles[] = 'affiliate';
                $user->user_roles = $roles;
            }
            $user->save();

            return redirect()->route('client.affiliates.index')
                ->with('success', 'Welcome to the Affiliate Partner Hub! Your access is free.');
        }

        $currencies = Currency::where('enabled', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('code', 'asc')
            ->get();

        $currencyService = app(CurrencyService::class);
        $feeInCents = (int) round($accessFee * 100);

        $pricingByCurrency = [];
        foreach ($currencies as $c) {
            $convertedCents = $currencyService->convert($feeInCents, $accessCurrency, $c->code);
            $decimals = (int) ($c->decimals ?? 2);
            $major = $convertedCents / (10 ** $decimals);

            $pricingByCurrency[$c->code] = [
                'code' => $c->code,
                'symbol' => $c->symbol,
                'amount' => $major,
                'formatted' => $c->symbol . number_format($major, $decimals),
            ];
        }

        // Available payment gateways
        $paystackEnabled = PaymentGatewayConfig::where('gateway', 'paystack')->where('enabled', true)->exists();
        $stripeEnabled = PaymentGatewayConfig::where('gateway', 'stripe')->where('enabled', true)->exists();

        $gateways = [];
        if ($paystackEnabled) {
            $gateways[] = [
                'id' => 'paystack',
                'name' => 'Paystack',
                'description' => 'Pay securely via Debit/Credit Card, Bank Transfer, or USSD (NGN, GHS, KES, USD)',
            ];
        }
        if ($stripeEnabled) {
            $gateways[] = [
                'id' => 'stripe',
                'name' => 'Stripe',
                'description' => 'Pay globally with Visa, MasterCard, American Express, Apple Pay',
            ];
        }

        if (empty($gateways)) {
            $gateways[] = [
                'id' => 'paystack',
                'name' => 'Secure Online Checkout',
                'description' => 'Instant activation via Card or Bank Transfer',
            ];
        }

        return Inertia::render('Affiliate/Join', [
            'accessFee' => $accessFee,
            'accessCurrency' => $accessCurrency,
            'accessCycle' => $accessCycle,
            'currencies' => $currencies->toArray(),
            'pricingByCurrency' => $pricingByCurrency,
            'gateways' => $gateways,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Initiate payment checkout for affiliate access subscription.
     */
    public function checkout(Request $request): SymfonyResponse
    {
        $user = $request->user();

        if ($user->hasActiveAffiliateAccess()) {
            return redirect()->route('client.affiliates.index');
        }

        $validated = $request->validate([
            'currency' => ['required', 'string', 'max:8'],
            'gateway' => ['required', 'string', 'in:paystack,stripe'],
        ]);

        $accessFee = (float) (SystemSetting::get('affiliate_access_fee') ?? 0);
        $accessCurrency = SystemSetting::get('affiliate_access_currency') ?? 'USD';
        $accessCycle = SystemSetting::get('affiliate_access_cycle') ?? 'yearly';

        if ($accessFee <= 0) {
            $user->affiliate_status = 'active';
            $user->save();
            return redirect()->route('client.affiliates.index');
        }

        $targetCurrency = strtoupper($validated['currency']);
        $gateway = $validated['gateway'];

        $currencyModel = Currency::where('code', $targetCurrency)->where('enabled', true)->first();
        if (! $currencyModel) {
            $targetCurrency = $accessCurrency;
            $currencyModel = Currency::where('code', $targetCurrency)->first();
        }

        $currencyService = app(CurrencyService::class);
        $baseCents = (int) round($accessFee * 100);
        $convertedCents = $currencyService->convert($baseCents, $accessCurrency, $targetCurrency);
        $decimals = (int) ($currencyModel?->decimals ?? 2);
        $convertedAmount = $convertedCents / (10 ** $decimals);

        $reference = 'AFF-' . $user->id . '-' . strtoupper(Str::random(10));

        if ($gateway === 'paystack') {
            $config = PaymentGatewayConfig::where('gateway', 'paystack')->where('enabled', true)->first();
            $creds = $config?->getActiveCredentials() ?? [];
            $secretKey = $creds['secret_key'] ?? config('services.paystack.secret_key', '');

            $callbackUrl = route('client.affiliates.join.verify');

            $response = Http::withToken($secretKey)
                ->acceptJson()
                ->post('https://api.paystack.co/transaction/initialize', [
                    'email' => $user->email,
                    'amount' => $convertedCents,
                    'currency' => $targetCurrency,
                    'reference' => $reference,
                    'callback_url' => $callbackUrl,
                    'metadata' => [
                        'type' => 'affiliate_subscription',
                        'user_id' => $user->id,
                        'plan_type' => $accessCycle,
                        'currency' => $targetCurrency,
                        'amount' => $convertedAmount,
                    ],
                ]);

            if ($response->successful() && $response->json('status') === true) {
                $authUrl = $response->json('data.authorization_url');

                AffiliateSubscription::create([
                    'user_id' => $user->id,
                    'plan_type' => $accessCycle,
                    'amount_paid' => $convertedAmount,
                    'currency' => $targetCurrency,
                    'payment_gateway' => 'paystack',
                    'payment_reference' => $reference,
                    'status' => 'pending',
                    'started_at' => null,
                    'expires_at' => null,
                ]);

                if ($request->wantsJson()) {
                    return response()->json(['url' => $authUrl]);
                }
                return Inertia::location($authUrl);
            }

            Log::error('Paystack affiliate checkout error', ['response' => $response->json()]);
            return back()->with('error', $response->json('message') ?: 'Unable to initialize payment gateway.');
        }

        if ($gateway === 'stripe') {
            $config = PaymentGatewayConfig::where('gateway', 'stripe')->where('enabled', true)->first();
            $creds = $config?->getActiveCredentials() ?? [];
            $secretKey = $creds['secret_key'] ?? config('services.stripe.secret', '');

            $response = Http::withBasicAuth($secretKey, '')
                ->asForm()
                ->post('https://api.stripe.com/v1/checkout/sessions', [
                    'payment_method_types' => ['card'],
                    'mode' => 'payment',
                    'customer_email' => $user->email,
                    'client_reference_id' => $reference,
                    'success_url' => route('client.affiliates.join.verify') . '?session_id={CHECKOUT_SESSION_ID}&reference=' . $reference . '&gateway=stripe',
                    'cancel_url' => route('client.affiliates.join'),
                    'line_items' => [
                        [
                            'price_data' => [
                                'currency' => strtolower($targetCurrency),
                                'unit_amount' => $convertedCents,
                                'product_data' => [
                                    'name' => 'BotifyAI Affiliate Partner Access (' . ucfirst($accessCycle) . ')',
                                    'description' => 'Unlimited access to promoter marketplace, referral tools, and commission earnings.',
                                ],
                            ],
                            'quantity' => 1,
                        ],
                    ],
                ]);

            if ($response->successful() && ! empty($response->json('url'))) {
                $authUrl = $response->json('url');

                AffiliateSubscription::create([
                    'user_id' => $user->id,
                    'plan_type' => $accessCycle,
                    'amount_paid' => $convertedAmount,
                    'currency' => $targetCurrency,
                    'payment_gateway' => 'stripe',
                    'payment_reference' => $reference,
                    'status' => 'pending',
                    'started_at' => null,
                    'expires_at' => null,
                ]);

                if ($request->wantsJson()) {
                    return response()->json(['url' => $authUrl]);
                }
                return Inertia::location($authUrl);
            }

            Log::error('Stripe affiliate checkout error', ['response' => $response->json()]);
            return back()->with('error', $response->json('error.message') ?: 'Unable to initialize Stripe checkout.');
        }

        return back()->with('error', 'Selected gateway is currently unavailable.');
    }

    /**
     * Verify payment callback from Paystack or Stripe.
     */
    public function verify(Request $request): RedirectResponse
    {
        $user = $request->user();
        $reference = $request->input('reference') ?? $request->input('trxref');
        $sessionId = $request->input('session_id');
        $gatewayParam = $request->input('gateway');

        $isVerified = false;
        $paidAmount = 0.0;
        $currency = 'USD';
        $gateway = 'paystack';
        $gatewayData = [];

        // 1. Stripe Verification
        if ($sessionId || $gatewayParam === 'stripe') {
            $gateway = 'stripe';
            $config = PaymentGatewayConfig::where('gateway', 'stripe')->where('enabled', true)->first();
            $creds = $config?->getActiveCredentials() ?? [];
            $secretKey = $creds['secret_key'] ?? config('services.stripe.secret', '');

            $response = Http::withBasicAuth($secretKey, '')
                ->get("https://api.stripe.com/v1/checkout/sessions/{$sessionId}");

            if ($response->successful() && $response->json('payment_status') === 'paid') {
                $isVerified = true;
                $paidAmount = ((float) $response->json('amount_total')) / 100;
                $currency = strtoupper($response->json('currency') ?? 'USD');
                $gatewayData = $response->json();
            }
        }
        // 2. Paystack Verification
        elseif ($reference) {
            $gateway = 'paystack';
            $config = PaymentGatewayConfig::where('gateway', 'paystack')->where('enabled', true)->first();
            $creds = $config?->getActiveCredentials() ?? [];
            $secretKey = $creds['secret_key'] ?? config('services.paystack.secret_key', '');

            $response = Http::withToken($secretKey)
                ->acceptJson()
                ->get("https://api.paystack.co/transaction/verify/{$reference}");

            if ($response->successful() && $response->json('data.status') === 'success') {
                $isVerified = true;
                $data = $response->json('data');
                $paidAmount = (float) ($data['amount'] / 100);
                $currency = strtoupper($data['currency'] ?? 'NGN');
                $gatewayData = $data;
            }
        }

        if ($isVerified) {
            $cycle = SystemSetting::get('affiliate_access_cycle', 'yearly');

            $sub = AffiliateSubscription::where('payment_reference', $reference ?: $sessionId)->first();
            if (! $sub) {
                $sub = new AffiliateSubscription();
                $sub->user_id = $user->id;
                $sub->payment_reference = $reference ?: $sessionId;
            }

            $sub->plan_type = $cycle;
            $sub->amount_paid = $paidAmount;
            $sub->currency = $currency;
            $sub->payment_gateway = $gateway;
            $sub->status = 'active';
            $sub->started_at = now();
            $sub->expires_at = $cycle === 'monthly' ? now()->addMonth() : now()->addYear();
            $sub->metadata = $gatewayData;
            $sub->save();

            // Activate user affiliate status
            $user->affiliate_status = 'active';
            $roles = $user->user_roles ?? ['merchant', 'customer'];
            if (! in_array('affiliate', $roles, true)) {
                $roles[] = 'affiliate';
                $user->user_roles = $roles;
            }
            $user->save();

            return redirect()->route('client.affiliates.index')
                ->with('success', '🎉 Affiliate Partner access activated successfully! Welcome to the Affiliate Hub.');
        }

        return redirect()->route('client.affiliates.join')
            ->with('error', 'Payment verification could not be completed. Please try again.');
    }
}
