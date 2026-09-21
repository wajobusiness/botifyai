<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Ecommerce\Services\Clients\StoreClientFactory;
use App\Modules\Ecommerce\Services\ContactEnricher;
use App\Modules\Ecommerce\Services\PayloadNormalizer;
use App\Modules\Shared\Services\ContactService;
use App\Support\Demo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /** Refresh re-pull uses the platform's "created" topic to re-map fields. */
    private const REFRESH_TOPIC = [
        'shopify' => 'orders/create',
        'woocommerce' => 'order.created',
        'bigcommerce' => 'order.placed',
    ];

    public function index(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);

        $base = EcommerceOrder::where('ecommerce_orders.workspace_id', $workspaceId)
            ->when($request->input('store_id'), fn ($q, $id) => $q->where('store_id', $id))
            ->when($request->input('fulfillment'), fn ($q, $s) => $q->where('fulfillment_status', $s))
            ->when($request->input('financial'), fn ($q, $s) => $q->where('financial_status', $s))
            ->when($request->input('payment_status'), fn ($q, $s) => $q->where('payment_status', $s))
            ->when($request->input('search'), fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('number', 'like', "%{$s}%")
                ->orWhere('customer_name', 'like', "%{$s}%")
                ->orWhere('customer_email', 'like', "%{$s}%")
                ->orWhere('customer_phone', 'like', "%{$s}%")
                ->orWhereHas('contact', fn ($q) => $q
                    ->where('email', 'like', "%{$s}%")
                    ->orWhere('phone_e164', 'like', "%{$s}%"))));

        $orders = (clone $base)
            ->with('contact:id,uuid,first_name,last_name,email,phone_e164')
            ->latest('placed_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (EcommerceOrder $o) => [
                'id' => $o->id,
                'number' => $o->number,
                'platform' => $o->platform,
                'status' => $o->status,
                'payment_status' => $o->payment_status ?: ($o->financial_status === 'paid' ? 'paid' : 'pending'),
                'financial_status' => $o->financial_status,
                'fulfillment_status' => $o->fulfillment_status,
                'currency' => $o->currency,
                'total' => $o->total,
                'placed_at' => $o->placed_at ?? $o->created_at,
                'customer_name' => $o->customer_name,
                'customer_email' => $o->customer_email,
                'contact' => $o->contact ? [
                    'uuid' => $o->contact->uuid,
                    'name' => Demo::name(trim(($o->contact->first_name ?? '').' '.($o->contact->last_name ?? '')) ?: $o->contact->email),
                    'email' => Demo::email($o->contact->email),
                ] : (! empty($o->customer_name) || ! empty($o->customer_email) ? [
                    'uuid' => null,
                    'name' => $o->customer_name ?: $o->customer_email,
                    'email' => $o->customer_email,
                ] : null),
            ]);

        return Inertia::render('Ecommerce/Orders/Index', [
            'orders' => $orders,
            'filters' => $request->only('store_id', 'fulfillment', 'financial', 'payment_status', 'search'),
            'stores' => EcommerceStore::where('workspace_id', $workspaceId)->get(['id', 'name'])
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->all(),
            'stats' => [
                'total' => (clone $base)->count(),
                'revenue' => round((float) (clone $base)->sum('total'), 2),
                'fulfilled' => (clone $base)->where('fulfillment_status', 'fulfilled')->count(),
                'unfulfilled' => (clone $base)->where(fn ($q) => $q->whereNull('fulfillment_status')->orWhere('fulfillment_status', '!=', 'fulfilled'))->count(),
            ],
        ]);
    }

    public function show(Request $request, EcommerceOrder $order): Response
    {
        $this->authorizeOrder($request, $order);
        $order->load([
            'contact:id,uuid,first_name,last_name,email,phone_e164',
            'store:id,name,platform',
            'paymentLogs' => fn ($q) => $q->latest(),
            'downloadTokens.product',
            'downloadTokens.digitalAsset',
            'ledgerEntries',
        ]);

        // Build structured audit timeline
        $timeline = [];

        // 1. Order Placed
        $timeline[] = [
            'title' => 'Order Placed',
            'description' => "Order #{$order->number} initialized by customer",
            'timestamp' => $order->placed_at?->toIso8601String() ?? $order->created_at?->toIso8601String(),
            'status' => 'completed',
        ];

        // 2. Gateway Initialized
        $initLog = $order->paymentLogs->firstWhere('status', 'initialized');
        if ($initLog) {
            $timeline[] = [
                'title' => 'Payment Session Opened',
                'description' => 'Gateway session initiated with reference '.$order->payment_reference,
                'timestamp' => $initLog->created_at?->toIso8601String(),
                'status' => 'completed',
            ];
        }

        // 3. Payment Status (Paid / Failed)
        if ($order->isPaid()) {
            $timeline[] = [
                'title' => 'Payment Verified',
                'description' => 'Payment confirmed via '.(ucfirst($order->payment_gateway ?: 'Gateway')),
                'timestamp' => $order->paid_at?->toIso8601String() ?? $order->updated_at?->toIso8601String(),
                'status' => 'completed',
            ];
        } elseif ($order->isFailed()) {
            $timeline[] = [
                'title' => 'Payment Failed',
                'description' => $order->failure_reason ?: 'Payment processing declined or timed out',
                'timestamp' => $order->failed_at?->toIso8601String() ?? $order->updated_at?->toIso8601String(),
                'status' => 'failed',
            ];
        } else {
            $timeline[] = [
                'title' => 'Awaiting Payment',
                'description' => 'Customer is currently completing payment',
                'timestamp' => null,
                'status' => 'pending',
            ];
        }

        // 4. Escrow Wallet Credited
        $saleCredit = $order->ledgerEntries->firstWhere('entry_type', 'sale_credit');
        if ($saleCredit) {
            $timeline[] = [
                'title' => 'Escrow Wallet Credited',
                'description' => "Merchant wallet credited {$order->currency} ".number_format($saleCredit->net_amount_cents / 100, 2)." (Platform Fee: {$order->currency} ".number_format($saleCredit->fee_cents / 100, 2).')',
                'timestamp' => $saleCredit->created_at?->toIso8601String(),
                'status' => 'completed',
            ];
        }

        // 5. Digital Downloads Issued
        if ($order->downloadTokens->isNotEmpty()) {
            $timeline[] = [
                'title' => 'Digital Assets Issued',
                'description' => "{$order->downloadTokens->count()} digital download token(s) granted to buyer vault",
                'timestamp' => $order->downloadTokens->first()?->created_at?->toIso8601String(),
                'status' => 'completed',
            ];
        }

        return Inertia::render('Ecommerce/Orders/Show', [
            'order' => [
                'id' => $order->id,
                'uuid' => $order->uuid,
                'number' => $order->number,
                'platform' => $order->platform,
                'status' => $order->status,
                'payment_status' => $order->payment_status ?: ($order->financial_status === 'paid' ? 'paid' : 'pending'),
                'financial_status' => $order->financial_status,
                'fulfillment_status' => $order->fulfillment_status,
                'payment_gateway' => $order->payment_gateway,
                'payment_reference' => $order->payment_reference,
                'currency' => $order->currency,
                'total' => $order->total,
                'line_items' => $order->line_items ?? [],
                'tracking_url' => $order->tracking_url,
                'tracking_number' => $order->tracking_number,
                'placed_at' => $order->placed_at,
                'paid_at' => $order->paid_at,
                'failed_at' => $order->failed_at,
                'failure_reason' => $order->failure_reason,
                'external_order_id' => $order->external_order_id,
                'store' => $order->store ? ['name' => $order->store->name] : null,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
                'contact' => $order->contact ? [
                    'uuid' => $order->contact->uuid,
                    'name' => Demo::name(trim(($order->contact->first_name ?? '').' '.($order->contact->last_name ?? '')) ?: $order->contact->email),
                    'email' => Demo::email($order->contact->email),
                    'phone' => Demo::phone($order->contact->phone_e164),
                ] : (! empty($order->customer_name) || ! empty($order->customer_email) ? [
                    'uuid' => null,
                    'name' => $order->customer_name ?: $order->customer_email,
                    'email' => $order->customer_email,
                    'phone' => $order->customer_phone,
                ] : null),
                'timeline' => $timeline,
                'downloads' => $order->downloadTokens->map(fn ($t) => [
                    'id' => $t->id,
                    'token' => $t->token,
                    'product_name' => $t->product?->name ?: 'Digital Product',
                    'file_name' => $t->digitalAsset?->file_name ?: 'Asset',
                    'download_count' => $t->download_count,
                    'max_downloads' => $t->max_downloads,
                    'is_expired' => $t->isExpired(),
                    'expires_at' => $t->expires_at?->toIso8601String(),
                ]),
                'payment_logs' => $order->paymentLogs->map(fn ($l) => [
                    'id' => $l->id,
                    'gateway' => $l->gateway,
                    'reference' => $l->reference,
                    'status' => $l->status,
                    'amount' => $l->amount_cents ? number_format($l->amount_cents / 100, 2) : null,
                    'currency' => $l->currency,
                    'created_at' => $l->created_at?->toIso8601String(),
                ]),
            ],
        ]);
    }

    public function refresh(Request $request, EcommerceOrder $order, PayloadNormalizer $normalizer, ContactService $contacts, ContactEnricher $enricher): RedirectResponse
    {
        $this->authorizeOrder($request, $order);
        $store = EcommerceStore::find($order->store_id);
        if (! $store) {
            return back()->with('error', 'Store not found.');
        }

        try {
            $raw = StoreClientFactory::for($store)->fetchOrder($order->external_order_id);
        } catch (\Throwable $e) {
            return back()->with('error', 'Refresh failed: '.$e->getMessage());
        }

        if (! $raw) {
            return back()->with('error', 'Order no longer found at the store.');
        }

        $event = $normalizer->normalize($store->platform, self::REFRESH_TOPIC[$store->platform], $raw, (string) $store->name);
        if ($event === null || $event['order'] === null) {
            return back()->with('error', 'Could not parse the order from the store.');
        }

        $contact = null;
        if (! empty($event['contact']['email']) || ! empty($event['contact']['phone_e164'])) {
            $contact = $contacts->upsert($store->workspace_id, array_filter([
                'phone_e164' => $event['contact']['phone_e164'] ?? null,
                'email' => $event['contact']['email'] ?? null,
                'source' => $store->platform,
            ], fn ($v) => $v !== null && $v !== ''));
        }

        // Only overwrite fields the store actually returned, so a refresh doesn't
        // null-out locally-set tracking/fulfillment.
        $data = array_filter($event['order'], fn ($v) => $v !== null);
        if ($contact) {
            $data['contact_id'] = $contact->id;
        }
        $order->update($data);
        if ($contact) {
            $enricher->enrich($contact, $store);
        }

        return back()->with('success', 'Order refreshed from '.$store->name.'.');
    }

    public function fulfill(Request $request, EcommerceOrder $order): RedirectResponse
    {
        $this->authorizeOrder($request, $order);
        $validated = $request->validate([
            'tracking_number' => ['nullable', 'string', 'max:128'],
            'tracking_url' => ['nullable', 'url', 'max:512'],
        ]);

        $store = EcommerceStore::find($order->store_id);
        if (! $store) {
            return back()->with('error', 'Store not found.');
        }

        try {
            $result = StoreClientFactory::for($store)->fulfillOrder(
                $order->external_order_id,
                $validated['tracking_number'] ?? null,
                $validated['tracking_url'] ?? null,
            );
        } catch (\Throwable $e) {
            return back()->with('error', 'Fulfillment failed: '.$e->getMessage());
        }

        // Only reflect locally if the store accepted the change, so the dashboard
        // never shows "fulfilled" for an order the platform actually rejected.
        if (! $result['ok']) {
            return back()->with('error', 'The store rejected the fulfillment: '.$result['message']);
        }

        $order->update([
            'fulfillment_status' => 'fulfilled',
            'tracking_number' => $validated['tracking_number'] ?? $order->tracking_number,
            'tracking_url' => $validated['tracking_url'] ?? $order->tracking_url,
        ]);

        return back()->with('success', 'Order marked as fulfilled at '.$store->name.'.');
    }

    private function authorizeOrder(Request $request, EcommerceOrder $order): void
    {
        abort_unless($order->workspace_id === $this->workspaceId($request), 403);
    }

    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }
}
