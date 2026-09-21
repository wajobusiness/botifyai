<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewayConfig;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommercePaymentLog;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Services\DigitalFulfillmentService;
use App\Modules\Ecommerce\Services\MerchantWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicCheckoutController extends Controller
{
    public function __construct(
        private MerchantWalletService $walletService,
        private DigitalFulfillmentService $fulfillmentService
    ) {}

    /**
     * Render the single-product public checkout page (/buy/{slug}).
     */
    public function show(string $slug): Response
    {
        $product = EcommerceProduct::with(['store', 'digitalAsset'])
            ->where(function ($q) use ($slug) {
                $q->where('slug', $slug);
                if (is_numeric($slug) || str_starts_with($slug, 'p-')) {
                    $id = str_replace('p-', '', $slug);
                    $q->orWhere('id', (int) $id);
                }
            })
            ->where('is_published', true)
            ->firstOrFail();

        $store = $product->store;

        // Detect enabled gateways
        $paystackEnabled = PaymentGatewayConfig::where('gateway', 'paystack')->where('enabled', true)->exists();
        $stripeEnabled = PaymentGatewayConfig::where('gateway', 'stripe')->where('enabled', true)->exists();

        // Default to Paystack if in Nigeria/NGN, or Stripe
        $currency = strtoupper($product->currency ?: 'NGN');
        $availableGateways = [];
        if ($paystackEnabled) {
            $availableGateways[] = [
                'id' => 'paystack',
                'name' => 'Paystack (Card, Transfer, USSD)',
                'description' => 'Pay securely with Card, Bank Transfer, or USSD',
            ];
        }
        if ($stripeEnabled) {
            $availableGateways[] = [
                'id' => 'stripe',
                'name' => 'Credit / Debit Card (Stripe)',
                'description' => 'Pay worldwide with Visa, Mastercard, or Amex',
            ];
        }

        // If no DB config found, fallback to available default
        if (empty($availableGateways)) {
            $availableGateways[] = [
                'id' => 'paystack',
                'name' => 'Card or Bank Transfer',
                'description' => 'Secure instant payment',
            ];
        }

        return Inertia::render('Public/ProductCheckout', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'price' => (float) $product->price,
                'compare_at_price' => $product->compare_at_price ? (float) $product->compare_at_price : null,
                'currency' => $currency,
                'image_url' => $product->image_url,
                'product_type' => $product->product_type,
                'file_name' => $product->digitalAsset?->file_name,
                'file_size' => $product->digitalAsset?->formatted_file_size,
            ],
            'store' => [
                'name' => $store?->name ?: 'BotifyAI Merchant',
                'brand_color' => $store?->brand_color ?: '#0D9488',
                'support_email' => $store?->support_email,
                'support_phone' => $store?->support_phone,
            ],
            'gateways' => $availableGateways,
        ]);
    }

    /**
     * Process checkout form and initiate payment gateway.
     */
    public function process(Request $request, string $slug): JsonResponse
    {
        $product = EcommerceProduct::with('store')
            ->where(function ($q) use ($slug) {
                $q->where('slug', $slug);
                if (is_numeric($slug) || str_starts_with($slug, 'p-')) {
                    $id = str_replace('p-', '', $slug);
                    $q->orWhere('id', (int) $id);
                }
            })
            ->where('is_published', true)
            ->firstOrFail();

        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'gateway' => ['required', 'string', 'in:paystack,stripe'],
        ]);

        $currency = strtoupper($product->currency ?: 'NGN');
        $grossTotal = (float) $product->price;

        // Generate unique order reference
        $reference = 'ORD-'.strtoupper(Str::random(12));

        // Create pending order
        $order = EcommerceOrder::create([
            'workspace_id' => $product->workspace_id,
            'store_id' => $product->store_id,
            'customer_name' => $validated['customer_name'],
            'customer_email' => $validated['customer_email'],
            'customer_phone' => $validated['customer_phone'] ?? null,
            'external_order_id' => $reference,
            'platform' => 'native',
            'number' => $reference,
            'status' => 'pending',
            'financial_status' => 'pending',
            'currency' => $currency,
            'total' => $grossTotal,
            'payment_gateway' => $validated['gateway'],
            'payment_reference' => $reference,
            'line_items' => [
                [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'quantity' => 1,
                    'total' => $product->price,
                ],
            ],
        ]);

        if ($validated['gateway'] === 'paystack') {
            return $this->initializePaystack($order, $product, $validated);
        }

        return $this->initializeStripe($order, $product, $validated);
    }

    /**
     * Verify payment upon gateway callback/redirect.
     */
    public function verify(Request $request): RedirectResponse
    {
        $reference = $request->input('reference') ?: $request->input('trxref') ?: $request->input('session_id');

        if (! $reference) {
            return redirect('/')->with('error', 'Missing transaction reference.');
        }

        $order = EcommerceOrder::where('payment_reference', $reference)
            ->orWhere('external_order_id', $reference)
            ->orWhere('uuid', $reference)
            ->first();

        if (! $order) {
            return redirect('/')->with('error', 'Order not found.');
        }

        // Idempotency: If already paid, take directly to receipt
        if ($order->isPaid()) {
            return redirect()->route('public.checkout.receipt', ['orderUuid' => $order->uuid]);
        }

        $isVerified = false;

        if ($order->payment_gateway === 'paystack') {
            $isVerified = $this->verifyPaystackPayment($reference, $order);
        } elseif ($order->payment_gateway === 'stripe') {
            $isVerified = $this->verifyStripePayment($reference, $order);
        } else {
            $isVerified = true;
        }

        if ($isVerified) {
            $order->update([
                'status' => 'completed',
                'financial_status' => 'paid',
                'paid_at' => now(),
            ]);

            // Credit merchant wallet with double-entry ledger audit
            $this->walletService->creditSale($order);

            // Generate digital download tokens
            $this->fulfillmentService->fulfillOrder($order);

            return redirect()->route('public.checkout.receipt', ['orderUuid' => $order->uuid]);
        }

        return redirect()->route('public.checkout.show', ['slug' => $order->line_items[0]['product_id'] ?? 'store'])
            ->with('error', 'Payment verification failed. Please try again.');
    }

    /**
     * Render the order receipt & buyer digital vault page.
     */
    public function receipt(string $orderUuid): Response
    {
        $order = EcommerceOrder::with(['store', 'downloadTokens.product', 'downloadTokens.digitalAsset'])
            ->where('uuid', $orderUuid)
            ->firstOrFail();

        $tokens = $order->downloadTokens->map(fn ($token) => [
            'id' => $token->id,
            'token' => $token->token,
            'product_name' => $token->product?->name ?: 'Digital Product',
            'file_name' => $token->digitalAsset?->file_name ?: 'Download Asset',
            'file_size' => $token->digitalAsset?->formatted_file_size,
            'asset_type' => $token->digitalAsset?->asset_type ?: 'file_upload',
            'is_expired' => $token->isExpired(),
            'can_download' => $token->canDownload(),
            'download_count' => $token->download_count,
            'max_downloads' => $token->max_downloads,
            'expires_at' => $token->expires_at?->toIso8601String(),
            'download_url' => route('public.download.file', ['token' => $token->token]),
        ]);

        return Inertia::render('Public/OrderReceipt', [
            'order' => [
                'uuid' => $order->uuid,
                'number' => $order->number,
                'total' => (float) $order->total,
                'currency' => $order->currency,
                'status' => $order->status,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'paid_at' => $order->paid_at?->toFormattedDateString(),
            ],
            'store' => [
                'name' => $order->store?->name ?: 'BotifyAI Store',
                'support_email' => $order->store?->support_email,
                'support_phone' => $order->store?->support_phone,
            ],
            'downloads' => $tokens,
        ]);
    }

    private function initializePaystack(EcommerceOrder $order, EcommerceProduct $product, array $validated): JsonResponse
    {
        $config = PaymentGatewayConfig::where('gateway', 'paystack')->where('enabled', true)->first();
        $creds = $config?->getActiveCredentials() ?? [];
        $secretKey = $creds['secret_key'] ?? config('services.paystack.secret_key', '');

        $amountInSubunits = (int) round(((float) $order->total) * 100);
        $callbackUrl = route('public.checkout.verify');

        $response = Http::withToken($secretKey)
            ->acceptJson()
            ->post('https://api.paystack.co/transaction/initialize', [
                'email' => $validated['customer_email'],
                'amount' => $amountInSubunits,
                'currency' => $order->currency,
                'reference' => $order->payment_reference,
                'callback_url' => $callbackUrl,
                'metadata' => [
                    'order_id' => $order->id,
                    'order_uuid' => $order->uuid,
                    'workspace_id' => $order->workspace_id,
                    'type' => 'commerce_sale',
                    'customer_name' => $validated['customer_name'],
                    'customer_phone' => $validated['customer_phone'] ?? null,
                ],
            ]);

        if ($response->successful() && $response->json('status') === true) {
            $authUrl = $response->json('data.authorization_url');

            return response()->json([
                'success' => true,
                'url' => $authUrl,
            ]);
        }

        Log::error('Paystack initialization failed for commerce order', [
            'order_id' => $order->id,
            'response' => $response->json(),
        ]);

        return response()->json([
            'success' => false,
            'message' => $response->json('message') ?: 'Payment gateway error. Please try again.',
        ], 422);
    }

    private function initializeStripe(EcommerceOrder $order, EcommerceProduct $product, array $validated): JsonResponse
    {
        $config = PaymentGatewayConfig::where('gateway', 'stripe')->where('enabled', true)->first();
        $creds = $config?->getActiveCredentials() ?? [];
        $secretKey = $creds['secret_key'] ?? config('services.stripe.secret', '');

        $amountInCents = (int) round(((float) $order->total) * 100);
        $currency = strtolower($order->currency ?: 'usd');

        $response = Http::withBasicAuth($secretKey, '')
            ->asForm()
            ->post('https://api.stripe.com/v1/checkout/sessions', [
                'payment_method_types' => ['card'],
                'mode' => 'payment',
                'customer_email' => $validated['customer_email'],
                'client_reference_id' => $order->payment_reference,
                'success_url' => route('public.checkout.verify').'?session_id={CHECKOUT_SESSION_ID}&reference='.$order->payment_reference,
                'cancel_url' => route('public.checkout.show', ['slug' => $product->slug ?: $product->id]),
                'line_items' => [
                    [
                        'price_data' => [
                            'currency' => $currency,
                            'unit_amount' => $amountInCents,
                            'product_data' => [
                                'name' => $product->name,
                                'description' => Str::limit(strip_tags($product->description ?? ''), 250),
                            ],
                        ],
                        'quantity' => 1,
                    ],
                ],
            ]);

        if ($response->successful() && ! empty($response->json('url'))) {
            return response()->json([
                'success' => true,
                'url' => $response->json('url'),
            ]);
        }

        Log::error('Stripe initialization failed for commerce order', [
            'order_id' => $order->id,
            'response' => $response->json(),
        ]);

        return response()->json([
            'success' => false,
            'message' => $response->json('error.message') ?: 'Stripe checkout initialization failed.',
        ], 422);
    }

    private function verifyPaystackPayment(string $reference, EcommerceOrder $order): bool
    {
        $config = PaymentGatewayConfig::where('gateway', 'paystack')->where('enabled', true)->first();
        $creds = $config?->getActiveCredentials() ?? [];
        $secretKey = $creds['secret_key'] ?? config('services.paystack.secret_key', '');

        $response = Http::withToken($secretKey)
            ->acceptJson()
            ->get("https://api.paystack.co/transaction/verify/{$reference}");

        if ($response->successful() && $response->json('data.status') === 'success') {
            EcommercePaymentLog::updateOrCreate(
                ['gateway' => 'paystack', 'reference' => $reference],
                ['order_id' => $order->id, 'status' => 'success', 'payload' => $response->json()]
            );

            return true;
        }

        return false;
    }

    private function verifyStripePayment(string $sessionId, EcommerceOrder $order): bool
    {
        $config = PaymentGatewayConfig::where('gateway', 'stripe')->where('enabled', true)->first();
        $creds = $config?->getActiveCredentials() ?? [];
        $secretKey = $creds['secret_key'] ?? config('services.stripe.secret', '');

        $response = Http::withBasicAuth($secretKey, '')
            ->get("https://api.stripe.com/v1/checkout/sessions/{$sessionId}");

        if ($response->successful() && $response->json('payment_status') === 'paid') {
            EcommercePaymentLog::updateOrCreate(
                ['gateway' => 'stripe', 'reference' => $sessionId],
                ['order_id' => $order->id, 'status' => 'paid', 'payload' => $response->json()]
            );

            return true;
        }

        return false;
    }
}
