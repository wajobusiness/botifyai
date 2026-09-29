<?php

namespace App\Http\Controllers\Api\V1;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Support\Demo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileOrderApiController extends WorkspaceScopedController
{
    /**
     * GET /api/v1/mobile/orders
     * Paginated list of merchant e-commerce orders with status filters.
     */
    public function index(Request $request): JsonResponse
    {
        $wsId = $this->workspaceId($request);
        $query = EcommerceOrder::where('workspace_id', $wsId)->with('contact');

        // Status filter (pending, paid, processing, shipped, delivered, cancelled)
        if ($request->filled('status')) {
            $status = strtolower($request->status);
            if ($status === 'paid') {
                $query->where(function ($q) {
                    $q->where('payment_status', 'paid')
                      ->orWhere('financial_status', 'paid')
                      ->orWhereNotNull('paid_at');
                });
            } elseif ($status === 'pending') {
                $query->where(function ($q) {
                    $q->whereNull('paid_at')
                      ->where('payment_status', '!=', 'paid')
                      ->where('financial_status', '!=', 'paid');
                });
            } else {
                $query->where(function ($q) use ($status) {
                    $q->where('fulfillment_status', $status)
                      ->orWhere('status', $status);
                });
            }
        }

        // Search by customer name, email, or order number
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('number', 'like', "%{$s}%")
                  ->orWhere('customer_name', 'like', "%{$s}%")
                  ->orWhere('customer_email', 'like', "%{$s}%")
                  ->orWhere('customer_phone', 'like', "%{$s}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 20), 50);
        $orders = $query->orderByDesc('placed_at')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => collect($orders->items())->map(fn (EcommerceOrder $o) => $this->transformOrder($o)),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * GET /api/v1/mobile/orders/{id}
     * Single order detail with items and customer info.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $wsId = $this->workspaceId($request);
        $order = EcommerceOrder::where('workspace_id', $wsId)
            ->with(['contact', 'store'])
            ->findOrFail($id);

        return response()->json([
            'data' => $this->transformOrder($order, true),
        ]);
    }

    /**
     * PATCH /api/v1/mobile/orders/{id}/status
     * 1-tap status update (e.g. mark as shipped with tracking number).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $wsId = $this->workspaceId($request);
        $order = EcommerceOrder::where('workspace_id', $wsId)->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:pending,paid,processing,shipped,delivered,cancelled',
            'tracking_number' => 'nullable|string|max:100',
            'courier' => 'nullable|string|max:100',
            'tracking_url' => 'nullable|url|max:255',
        ]);

        $status = $validated['status'];
        if (in_array($status, ['processing', 'shipped', 'delivered', 'cancelled'])) {
            $order->fulfillment_status = $status;
            $order->status = $status;
        } elseif ($status === 'paid') {
            $order->payment_status = 'paid';
            $order->financial_status = 'paid';
            $order->paid_at = $order->paid_at ?? now();
        }

        if (! empty($validated['tracking_number'])) {
            $order->tracking_number = $validated['tracking_number'];
        }
        if (! empty($validated['tracking_url'])) {
            $order->tracking_url = $validated['tracking_url'];
        }
        if (! empty($validated['courier'])) {
            $meta = $order->metadata ?? [];
            $meta['courier'] = $validated['courier'];
            $order->metadata = $meta;
        }

        $order->save();

        return response()->json([
            'message' => 'Order status updated successfully.',
            'data' => $this->transformOrder($order, true),
        ]);
    }

    private function transformOrder(EcommerceOrder $o, bool $detailed = false): array
    {
        $lineItems = $o->line_items ?? [];
        $itemsCount = count($lineItems);
        $firstProductName = $itemsCount > 0 ? ($lineItems[0]['title'] ?? $lineItems[0]['name'] ?? 'Product') : 'Product';

        $res = [
            'id' => $o->id,
            'uuid' => $o->uuid,
            'order_number' => $o->number ?? ('#' . $o->id),
            'customer_name' => Demo::name($o->customer_name ?? $o->contact?->full_name ?? 'Guest Buyer'),
            'customer_email' => Demo::email($o->customer_email ?? $o->contact?->email),
            'customer_phone' => Demo::phone($o->customer_phone ?? $o->contact?->phone_e164),
            'payment_status' => $o->isPaid() ? 'paid' : ($o->payment_status ?? 'pending'),
            'fulfillment_status' => $o->fulfillment_status ?? 'pending',
            'currency' => $o->currency ?? '₦',
            'total_amount' => (float) $o->total,
            'items_count' => $itemsCount > 0 ? $itemsCount : 1,
            'tracking_number' => $o->tracking_number,
            'tracking_url' => $o->tracking_url,
            'courier' => $o->metadata['courier'] ?? null,
            'created_at' => ($o->placed_at ?? $o->created_at)->toIso8601String(),
        ];

        if ($detailed) {
            $res['items'] = collect($lineItems)->map(function ($item, $idx) {
                return [
                    'id' => $idx + 1,
                    'product_name' => $item['title'] ?? $item['name'] ?? 'Product Item',
                    'quantity' => (int) ($item['quantity'] ?? 1),
                    'price' => (float) ($item['price'] ?? $item['unit_price'] ?? 0),
                    'sku' => $item['sku'] ?? null,
                ];
            })->values()->all();

            $res['shipping_address'] = $o->metadata['shipping_address'] ?? null;
        }

        return $res;
    }
}
