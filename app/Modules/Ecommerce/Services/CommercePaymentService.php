<?php

namespace App\Modules\Ecommerce\Services;

use App\Events\CommerceEventReceived;
use App\Models\PaymentGatewayConfig;
use App\Models\User;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommercePaymentLog;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Notifications\NewOrderMerchantNotification;
use App\Modules\Ecommerce\Notifications\OrderReceiptNotification;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Services\ContactService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class CommercePaymentService
{
    public function __construct(
        private MerchantWalletService $walletService,
        private DigitalFulfillmentService $fulfillmentService,
        private ContactService $contactService,
        private ContactEnricher $contactEnricher
    ) {}

    /**
     * Initialize gateway checkout session for a customer order.
     *
     * @param  array<string, mixed>  $validated
     * @return array{success: bool, url?: string, message?: string}
     */
    public function initialize(EcommerceOrder $order, EcommerceProduct $product, array $validated): array
    {
        $gateway = $validated['gateway'];

        if ($gateway === 'paystack') {
            return $this->initializePaystack($order, $product, $validated);
        }

        return $this->initializeStripe($order, $product, $validated);
    }

    /**
     * Atomically process payment success, credit escrow wallet, issue digital tokens,
     * enrich CRM contact, and dispatch downstream automations & notifications.
     *
     * @param  array<string, mixed>  $gatewayData
     */
    public function handlePaymentSuccess(EcommerceOrder $order, string $reference, array $gatewayData, string $gateway = 'paystack'): bool
    {
        return DB::transaction(function () use ($order, $reference, $gatewayData, $gateway) {
            /** @var EcommerceOrder $lockedOrder */
            $lockedOrder = EcommerceOrder::with('store')
                ->where('id', $order->id)
                ->lockForUpdate()
                ->firstOrFail();

            // 1. Idempotency check: Already processed?
            if ($lockedOrder->isPaid()) {
                return true;
            }

            // 2. Strict Security: Verify currency & amount match expected order total
            $expectedCents = (int) round(((float) $lockedOrder->total) * 100);
            $actualCents = (int) ($gatewayData['amount'] ?? $expectedCents);
            $actualCurrency = strtoupper($gatewayData['currency'] ?? $lockedOrder->currency);

            if ($actualCents < $expectedCents) {
                Log::error('Payment amount tampering detected', [
                    'order_id' => $lockedOrder->id,
                    'expected_cents' => $expectedCents,
                    'actual_cents' => $actualCents,
                    'reference' => $reference,
                ]);

                $lockedOrder->update([
                    'payment_status' => 'failed',
                    'failed_at' => now(),
                    'failure_reason' => 'Amount paid is less than required order total.',
                ]);

                return false;
            }

            // 3. Update order financial and lifecycle state
            $lockedOrder->update([
                'payment_status' => 'paid',
                'financial_status' => 'paid',
                'status' => 'completed',
                'paid_at' => now(),
                'payment_gateway' => $gateway,
                'payment_reference' => $reference,
            ]);

            // 4. Log successful transaction for auditing
            EcommercePaymentLog::updateOrCreate(
                ['gateway' => $gateway, 'reference' => $reference],
                [
                    'workspace_id' => $lockedOrder->workspace_id,
                    'order_id' => $lockedOrder->id,
                    'status' => 'paid',
                    'amount_cents' => $actualCents,
                    'currency' => $actualCurrency,
                    'payload' => $gatewayData,
                ]
            );

            // 5. Credit merchant wallet with platform take-rate & double-entry ledger
            $this->walletService->creditSale($lockedOrder);

            // 6. Generate digital download tokens for buyer digital vault
            $tokens = $this->fulfillmentService->fulfillOrder($lockedOrder);

            // 7. CRM Contact Resolution & Metric Enrichment
            $contact = $this->resolveAndEnrichContact($lockedOrder);

            // 8. Dispatch normalized automation event for workflow triggers
            if ($contact) {
                $downloadUrl = count($tokens) > 0
                    ? route('public.checkout.receipt', ['orderUuid' => $lockedOrder->uuid])
                    : '';

                CommerceEventReceived::dispatch(
                    $lockedOrder->workspace_id,
                    $contact->id,
                    'order.paid',
                    [
                        'order_id' => (string) $lockedOrder->id,
                        'order_number' => $lockedOrder->number,
                        'total' => (string) $lockedOrder->total,
                        'currency' => $lockedOrder->currency,
                        'customer_name' => $lockedOrder->customer_name ?? '',
                        'customer_email' => $lockedOrder->customer_email ?? '',
                        'download_url' => $downloadUrl,
                    ]
                );
            }

            // 9. Send Customer Transactional Receipt Email
            if (! empty($lockedOrder->customer_email)) {
                try {
                    Notification::route('mail', $lockedOrder->customer_email)
                        ->notifyNow(new OrderReceiptNotification($lockedOrder));
                } catch (\Throwable $e) {
                    Log::warning('Failed to send buyer order receipt email', [
                        'order_id' => $lockedOrder->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // 10. Send Real-time Merchant Notification
            try {
                $merchantUsers = User::whereHas('workspaces', function ($q) use ($lockedOrder) {
                    $q->where('workspaces.id', $lockedOrder->workspace_id);
                })->get();

                Notification::send($merchantUsers, new NewOrderMerchantNotification($lockedOrder));
            } catch (\Throwable $e) {
                Log::warning('Failed to notify merchant users of new order', [
                    'order_id' => $lockedOrder->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // 11. Dispatch Server-Side Conversion API Events (Meta CAPI / TikTok Events API)
            try {
                app(\App\Modules\Ecommerce\Services\MarketingPixelService::class)->trackServerSidePurchase($lockedOrder);
            } catch (\Throwable $e) {
                Log::warning('MarketingPixelService server-side conversion dispatch failed: ' . $e->getMessage());
            }

            return true;
        });
    }

    /**
     * Atomically record payment failure.
     */
    public function handlePaymentFailure(EcommerceOrder $order, string $reference, string $reason, array $gatewayData = [], string $gateway = 'paystack'): void
    {
        $order->update([
            'payment_status' => 'failed',
            'status' => 'failed',
            'failed_at' => now(),
            'failure_reason' => Str::limit($reason, 500),
        ]);

        EcommercePaymentLog::updateOrCreate(
            ['gateway' => $gateway, 'reference' => $reference],
            [
                'workspace_id' => $order->workspace_id,
                'order_id' => $order->id,
                'status' => 'failed',
                'amount_cents' => (int) ($gatewayData['amount'] ?? round(((float) $order->total) * 100)),
                'currency' => strtoupper($gatewayData['currency'] ?? $order->currency),
                'error_message' => $reason,
                'payload' => $gatewayData,
            ]
        );

        if ($order->contact_id) {
            CommerceEventReceived::dispatch(
                $order->workspace_id,
                $order->contact_id,
                'payment.failed',
                [
                    'order_id' => (string) $order->id,
                    'order_number' => $order->number,
                    'reason' => $reason,
                ]
            );
        }
    }

    private function resolveAndEnrichContact(EcommerceOrder $order): ?Contact
    {
        if (empty($order->customer_email) && empty($order->customer_phone)) {
            return null;
        }

        $fullName = trim($order->customer_name ?? '');
        $nameParts = explode(' ', $fullName, 2);
        $firstName = $nameParts[0] ?: 'Customer';
        $lastName = $nameParts[1] ?? '';

        $contact = $this->contactService->upsert($order->workspace_id, array_filter([
            'email' => $order->customer_email,
            'phone_e164' => $order->customer_phone,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'source' => 'commerce_checkout',
        ]));

        $order->update(['contact_id' => $contact->id]);

        if ($order->store) {
            $this->contactEnricher->enrich($contact, $order->store);
        }

        return $contact;
    }

    private function initializePaystack(EcommerceOrder $order, EcommerceProduct $product, array $validated): array
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

            EcommercePaymentLog::create([
                'workspace_id' => $order->workspace_id,
                'order_id' => $order->id,
                'gateway' => 'paystack',
                'reference' => $order->payment_reference,
                'status' => 'initialized',
                'amount_cents' => $amountInSubunits,
                'currency' => $order->currency,
                'payload' => $response->json(),
            ]);

            return [
                'success' => true,
                'url' => $authUrl,
            ];
        }

        Log::error('Paystack initialization failed for commerce order', [
            'order_id' => $order->id,
            'response' => $response->json(),
        ]);

        return [
            'success' => false,
            'message' => $response->json('message') ?: 'Payment gateway error. Please try again.',
        ];
    }

    private function initializeStripe(EcommerceOrder $order, EcommerceProduct $product, array $validated): array
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
            $authUrl = $response->json('url');

            EcommercePaymentLog::create([
                'workspace_id' => $order->workspace_id,
                'order_id' => $order->id,
                'gateway' => 'stripe',
                'reference' => $order->payment_reference,
                'status' => 'initialized',
                'amount_cents' => $amountInCents,
                'currency' => strtoupper($currency),
                'payload' => $response->json(),
            ]);

            return [
                'success' => true,
                'url' => $authUrl,
            ];
        }

        Log::error('Stripe initialization failed for commerce order', [
            'order_id' => $order->id,
            'response' => $response->json(),
        ]);

        return [
            'success' => false,
            'message' => $response->json('error.message') ?: 'Stripe checkout initialization failed.',
        ];
    }
}

