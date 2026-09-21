<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\MerchantLedgerEntry;
use App\Modules\Ecommerce\Notifications\OrderReceiptNotification;
use App\Modules\Ecommerce\Services\DigitalFulfillmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminOrderController extends Controller
{
    /**
     * Display all commerce orders and transactions across all stores on the platform.
     */
    public function index(Request $request): Response
    {
        $query = EcommerceOrder::with(['store:id,name,platform', 'contact:id,uuid,first_name,last_name,email', 'downloadTokens']);

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('gateway')) {
            $query->where('payment_gateway', $request->gateway);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('number', 'like', "%{$s}%")
                    ->orWhere('customer_name', 'like', "%{$s}%")
                    ->orWhere('customer_email', 'like', "%{$s}%")
                    ->orWhere('customer_phone', 'like', "%{$s}%")
                    ->orWhere('payment_reference', 'like', "%{$s}%")
                    ->orWhere('external_order_id', 'like', "%{$s}%");
            });
        }

        $orders = (clone $query)
            ->latest('placed_at')
            ->paginate(20)
            ->withQueryString()
            ->through(function (EcommerceOrder $o) {
                if (empty($o->uuid)) {
                    $o->uuid = (string) Str::uuid();
                    $o->saveQuietly();
                }

                $receiptUrl = ! empty($o->uuid)
                    ? route('public.checkout.receipt', ['orderUuid' => $o->uuid])
                    : null;

                return [
                    'id' => $o->id,
                    'uuid' => $o->uuid,
                    'number' => $o->number,
                    'store_name' => $o->store?->name ?: 'Native Store',
                    'customer_name' => $o->customer_name ?: ($o->contact ? trim(($o->contact->first_name ?? '').' '.($o->contact->last_name ?? '')) : 'Guest'),
                    'customer_email' => $o->customer_email ?: $o->contact?->email,
                    'customer_phone' => $o->customer_phone,
                    'total' => (float) $o->total,
                    'currency' => $o->currency,
                    'status' => $o->status,
                    'payment_status' => $o->payment_status ?: ($o->financial_status === 'paid' ? 'paid' : 'pending'),
                    'fulfillment_status' => $o->fulfillment_status,
                    'payment_gateway' => $o->payment_gateway,
                    'payment_reference' => $o->payment_reference,
                    'downloads_count' => $o->downloadTokens->count(),
                    'receipt_url' => $receiptUrl,
                    'paid_at' => $o->paid_at?->format('M d, Y H:i'),
                    'placed_at' => ($o->placed_at ?? $o->created_at)?->format('M d, Y H:i'),
                ];
            });

        $baseCount = EcommerceOrder::query();
        $stats = [
            'total_orders' => (clone $baseCount)->count(),
            'paid_orders' => (clone $baseCount)->where('payment_status', 'paid')->count(),
            'total_gmv' => (float) (clone $baseCount)->where('payment_status', 'paid')->sum('total'),
            'platform_fees' => round(((float) MerchantLedgerEntry::where('entry_type', 'sale_credit')->sum('fee_cents')) / 100, 2),
        ];

        return Inertia::render('Admin/Ecommerce/Orders', [
            'orders' => $orders,
            'filters' => $request->only(['payment_status', 'status', 'gateway', 'search']),
            'stats' => $stats,
        ]);
    }

    /**
     * Resend the customer receipt & digital download link email.
     */
    public function resendReceipt(EcommerceOrder $order): RedirectResponse
    {
        if (empty($order->customer_email)) {
            return back()->with('error', 'Order has no customer email address.');
        }

        try {
            Notification::route('mail', $order->customer_email)
                ->notifyNow(new OrderReceiptNotification($order));

            return back()->with('success', "Order receipt sent successfully to {$order->customer_email}.");
        } catch (\Throwable $e) {
            return back()->with('error', "Failed to send receipt email: {$e->getMessage()}");
        }
    }

    /**
     * Manually fulfill order & generate missing digital download tokens.
     */
    public function fulfill(EcommerceOrder $order, DigitalFulfillmentService $fulfillmentService): RedirectResponse
    {
        try {
            $tokens = $fulfillmentService->fulfillOrder($order);
            $order->update([
                'status' => 'completed',
                'fulfillment_status' => 'fulfilled',
            ]);

            return back()->with('success', count($tokens).' digital download token(s) verified/issued for order.');
        } catch (\Throwable $e) {
            return back()->with('error', "Fulfillment failed: {$e->getMessage()}");
        }
    }
}

