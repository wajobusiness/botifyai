<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewayConfig;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Services\CommercePaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicCheckoutController extends Controller
{
    public function __construct(
        private CommercePaymentService $paymentService
    ) {}

    /**
     * Render the single-product public checkout page (/buy/{slug}).
     */
    public function show(string $slug): Response|RedirectResponse
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
            ->first();

        if (! $product) {
            $storeCandidate = \App\Modules\Ecommerce\Models\EcommerceStore::where('slug', $slug)->first();
            if ($storeCandidate) {
                $firstProduct = $storeCandidate->products()->where('is_published', true)->first();
                if ($firstProduct) {
                    return redirect()->route('public.checkout.show', ['slug' => $firstProduct->getCheckoutSlug()]);
                }
            }
            abort(404, 'Product or store not found.');
        }

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

        $headerPixelsHtml = $store
            ? app(\App\Modules\Ecommerce\Services\MarketingPixelService::class)->renderHeaderTags($store)
            : '';

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
                'logo_url' => $store?->logo_url,
                'banner_url' => $store?->banner_url,
                'support_email' => $store?->support_email,
                'support_phone' => $store?->support_phone,
                'policies' => $store?->policies,
            ],
            'header_pixels_html' => $headerPixelsHtml,
            'gateways' => $availableGateways,
        ]);
    }

    /**
     * Process checkout form and initiate payment gateway session.
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

        // Create pending order with payment_status = pending
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
            'payment_status' => 'pending',
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

        $result = $this->paymentService->initialize($order, $product, $validated);

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Unable to initialize checkout session.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'url' => $result['url'],
            'order_uuid' => $order->uuid,
        ]);
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

        // Idempotency: If already paid (e.g. processed via webhook beforehand), redirect directly to receipt
        if ($order->isPaid()) {
            return redirect()->route('public.checkout.receipt', ['orderUuid' => $order->uuid]);
        }

        $isVerified = false;
        $gatewayData = [];

        if ($order->payment_gateway === 'paystack') {
            $config = PaymentGatewayConfig::where('gateway', 'paystack')->where('enabled', true)->first();
            $creds = $config?->getActiveCredentials() ?? [];
            $secretKey = $creds['secret_key'] ?? config('services.paystack.secret_key', '');

            $response = Http::withToken($secretKey)
                ->acceptJson()
                ->get("https://api.paystack.co/transaction/verify/{$reference}");

            if ($response->successful() && $response->json('data.status') === 'success') {
                $isVerified = true;
                $gatewayData = $response->json('data') ?? [];
            }
        } elseif ($order->payment_gateway === 'stripe') {
            $config = PaymentGatewayConfig::where('gateway', 'stripe')->where('enabled', true)->first();
            $creds = $config?->getActiveCredentials() ?? [];
            $secretKey = $creds['secret_key'] ?? config('services.stripe.secret', '');

            $response = Http::withBasicAuth($secretKey, '')
                ->get("https://api.stripe.com/v1/checkout/sessions/{$reference}");

            if ($response->successful() && $response->json('payment_status') === 'paid') {
                $isVerified = true;
                $gatewayData = [
                    'amount' => $response->json('amount_total'),
                    'currency' => $response->json('currency'),
                    'raw' => $response->json(),
                ];
            }
        }

        if ($isVerified) {
            $this->paymentService->handlePaymentSuccess($order, $reference, $gatewayData, $order->payment_gateway ?: 'paystack');

            return redirect()->route('public.checkout.receipt', ['orderUuid' => $order->uuid]);
        }

        return redirect()->route('public.checkout.show', ['slug' => $order->line_items[0]['product_id'] ?? 'store'])
            ->with('error', 'Payment verification failed. Please try again.');
    }

    /**
     * Poll order payment status (used for Bank Transfer, USSD, and background webhook completion).
     */
    public function status(Request $request, string $uuid): JsonResponse
    {
        $order = EcommerceOrder::where('uuid', $uuid)->first();

        if (! $order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        return response()->json([
            'uuid' => $order->uuid,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'is_paid' => $order->isPaid(),
            'receipt_url' => $order->isPaid()
                ? route('public.checkout.receipt', ['orderUuid' => $order->uuid])
                : null,
        ]);
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
                'payment_status' => $order->payment_status,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
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
}
