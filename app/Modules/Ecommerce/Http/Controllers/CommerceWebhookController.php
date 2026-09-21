<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewayConfig;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Services\CommercePaymentService;
use App\Services\Billing\WebhookIdempotencyService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class CommerceWebhookController extends Controller
{
    public function __construct(
        private CommercePaymentService $paymentService,
        private WebhookIdempotencyService $idempotencyService
    ) {}

    /**
     * Handle incoming Paystack webhook for commerce sales.
     */
    public function paystack(Request $request): Response
    {
        $payload = $request->getContent();
        $signature = $request->header('x-paystack-signature', '');

        $secretKey = $this->getPaystackSecret();

        if (empty($secretKey)) {
            Log::error('Commerce Paystack webhook failed: Secret key not configured');
            return new Response('Gateway configuration error', 500);
        }

        $expected = hash_hmac('sha512', $payload, $secretKey);
        if (! hash_equals($expected, $signature)) {
            Log::warning('Commerce Paystack webhook signature mismatch', [
                'received' => $signature,
            ]);
            return new Response('Invalid signature', 401);
        }

        $data = json_decode($payload, true) ?: [];
        $event = $data['event'] ?? '';
        $charge = $data['data'] ?? [];
        $eventId = $charge['id'] ?? null;

        $idempotencyKey = (string) ($eventId ?: ($charge['reference'] ?? uniqid('paystack_', true))) . '_' . $event;

        if (! $this->idempotencyService->isNewEvent('paystack_commerce', $idempotencyKey)) {
            return new Response('OK (Duplicate)', 200);
        }

        try {
            if ($event === 'charge.success') {
                $this->handleChargeSuccess($charge);
            } elseif (in_array($event, ['charge.failed', 'invoice.payment_failed'], true)) {
                $this->handleChargeFailed($charge);
            }
        } catch (\Throwable $e) {
            Log::error('Commerce Paystack webhook processing exception', [
                'event' => $event,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->idempotencyService->release('paystack_commerce', $idempotencyKey);
            return new Response('Internal error processing webhook', 500);
        }

        return new Response('OK', 200);
    }

    /**
     * Handle incoming Stripe webhook for commerce sales.
     */
    public function stripe(Request $request): Response
    {
        $payload = $request->getContent();
        $data = json_decode($payload, true) ?: [];
        $event = $data['type'] ?? '';
        $session = $data['data']['object'] ?? [];

        $eventId = $data['id'] ?? ($session['id'] ?? uniqid('stripe_', true));
        $idempotencyKey = (string) $eventId . '_' . $event;

        if (! $this->idempotencyService->isNewEvent('stripe_commerce', $idempotencyKey)) {
            return new Response('OK (Duplicate)', 200);
        }

        try {
            if ($event === 'checkout.session.completed' || $event === 'payment_intent.succeeded') {
                $reference = $session['client_reference_id'] ?? ($session['metadata']['order_reference'] ?? '');
                $order = ! empty($reference) ? EcommerceOrder::where('payment_reference', $reference)->first() : null;

                if (! $order && ! empty($session['metadata']['order_uuid'] ?? '')) {
                    $order = EcommerceOrder::where('uuid', $session['metadata']['order_uuid'])->first();
                }

                if ($order) {
                    $this->paymentService->handlePaymentSuccess($order, $reference ?: $order->payment_reference, $session, 'stripe');
                }
            }
        } catch (\Throwable $e) {
            Log::error('Commerce Stripe webhook processing exception', [
                'event' => $event,
                'error' => $e->getMessage(),
            ]);

            $this->idempotencyService->release('stripe_commerce', $idempotencyKey);
            return new Response('Internal error processing webhook', 500);
        }

        return new Response('OK', 200);
    }

    private function handleChargeSuccess(array $charge): void
    {
        $reference = $charge['reference'] ?? '';
        $metadata = $charge['metadata'] ?? [];
        if (is_string($metadata)) {
            $metadata = json_decode($metadata, true) ?: [];
        }

        $orderId = $metadata['order_id'] ?? null;
        $orderUuid = $metadata['order_uuid'] ?? null;

        $order = null;
        if (! empty($reference)) {
            $order = EcommerceOrder::where('payment_reference', $reference)->first();
        }

        if (! $order && $orderUuid) {
            $order = EcommerceOrder::where('uuid', $orderUuid)->first();
        }

        if (! $order && $orderId) {
            $order = EcommerceOrder::find($orderId);
        }

        if (! $order) {
            Log::warning('Commerce Paystack webhook: Order not found for charge', [
                'reference' => $reference,
                'metadata' => $metadata,
            ]);
            return;
        }

        $this->paymentService->handlePaymentSuccess($order, $reference, $charge, 'paystack');
    }

    private function handleChargeFailed(array $charge): void
    {
        $reference = $charge['reference'] ?? '';
        $metadata = $charge['metadata'] ?? [];
        if (is_string($metadata)) {
            $metadata = json_decode($metadata, true) ?: [];
        }

        $orderId = $metadata['order_id'] ?? null;
        $orderUuid = $metadata['order_uuid'] ?? null;

        $order = null;
        if (! empty($reference)) {
            $order = EcommerceOrder::where('payment_reference', $reference)->first();
        }

        if (! $order && $orderUuid) {
            $order = EcommerceOrder::where('uuid', $orderUuid)->first();
        }

        if (! $order && $orderId) {
            $order = EcommerceOrder::find($orderId);
        }

        if (! $order) {
            return;
        }

        $reason = $charge['gateway_response'] ?? ($charge['message'] ?? 'Payment failed or declined by customer bank.');
        $this->paymentService->handlePaymentFailure($order, $reference, $reason, $charge, 'paystack');
    }

    private function getPaystackSecret(): string
    {
        $config = PaymentGatewayConfig::where('gateway', 'paystack')->first();
        $creds = $config?->getActiveCredentials() ?? [];
        $secret = $creds['secret_key'] ?? config('services.paystack.secret_key', '');
        if (empty($secret)) {
            $secret = env('PAYSTACK_SECRET_KEY', '');
        }
        return (string) $secret;
    }
}

