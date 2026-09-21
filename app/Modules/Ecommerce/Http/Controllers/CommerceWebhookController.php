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

    private function handleChargeSuccess(array $charge): void
    {
        $reference = $charge['reference'] ?? '';
        $orderId = $charge['metadata']['order_id'] ?? null;
        $orderUuid = $charge['metadata']['order_uuid'] ?? null;

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
                'metadata' => $charge['metadata'] ?? [],
            ]);
            return;
        }

        $this->paymentService->handlePaymentSuccess($order, $reference, $charge, 'paystack');
    }

    private function handleChargeFailed(array $charge): void
    {
        $reference = $charge['reference'] ?? '';
        $orderId = $charge['metadata']['order_id'] ?? null;
        $orderUuid = $charge['metadata']['order_uuid'] ?? null;

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
        $config = PaymentGatewayConfig::where('gateway', 'paystack')->where('enabled', true)->first();
        $creds = $config?->getActiveCredentials() ?? [];
        return $creds['secret_key'] ?? config('services.paystack.secret_key', '');
    }
}

