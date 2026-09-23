<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceDownloadToken;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPortalController extends Controller
{
    /**
     * Display the buyer's orders, purchased digital assets, and receipts.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $email = $user->email;

        $orders = EcommerceOrder::where('customer_email', $email)
            ->with(['store', 'downloadTokens.product'])
            ->latest('placed_at')
            ->get()
            ->map(fn (EcommerceOrder $order) => [
                'id' => $order->id,
                'uuid' => $order->uuid,
                'number' => $order->number,
                'store_name' => $order->store?->name ?? 'Botify Store',
                'store_slug' => $order->store?->slug,
                'total' => (float) $order->total,
                'currency' => $order->currency ?: 'NGN',
                'payment_status' => $order->payment_status ?: ($order->financial_status === 'paid' ? 'paid' : 'pending'),
                'fulfillment_status' => $order->fulfillment_status,
                'placed_at' => ($order->placed_at ?? $order->created_at)?->format('M d, Y H:i'),
                'receipt_url' => route('public.checkout.receipt', ['orderUuid' => $order->uuid]),
                'items' => collect($order->line_items ?? [])->map(fn ($item) => [
                    'id' => $item['product_id'] ?? $item['id'] ?? null,
                    'name' => $item['name'] ?? $item['title'] ?? 'Digital Product',
                    'price' => (float) ($item['unit_price'] ?? $item['price'] ?? 0),
                    'quantity' => (int) ($item['quantity'] ?? 1),
                    'product_type' => $item['product_type'] ?? 'digital',
                    'image_url' => $item['image_url'] ?? null,
                ])->values()->all(),
                'downloads' => $order->downloadTokens->map(fn ($token) => [
                    'id' => $token->id,
                    'token' => $token->token,
                    'file_name' => $token->product?->file_name ?? $token->product?->name ?? 'Digital Asset',
                    'file_size' => $token->product?->file_size_formatted ?? 'Download',
                    'download_url' => route('public.download.file', ['token' => $token->token]),
                    'downloads_remaining' => $token->remainingDownloads(),
                    'expires_at' => $token->expires_at?->format('M d, Y'),
                    'is_expired' => $token->isExpired(),
                ]),
            ]);

        // Aggregate digital assets from all paid orders
        $digitalAssets = EcommerceDownloadToken::whereHas('order', function ($q) use ($email) {
            $q->where('customer_email', $email)
              ->where(function ($sq) {
                  $sq->whereIn('payment_status', ['paid', 'completed'])
                    ->orWhere('financial_status', 'paid');
              });
        })
        ->with(['order.store', 'product'])
        ->latest()
        ->get()
        ->map(fn (EcommerceDownloadToken $t) => [
            'id' => $t->id,
            'title' => $t->product?->name ?? 'Digital Product',
            'store_name' => $t->order?->store?->name ?? 'Botify Store',
            'purchased_at' => ($t->order?->placed_at ?? $t->created_at)?->format('M d, Y'),
            'file_name' => $t->product?->file_name ?? 'Download File',
            'download_url' => route('public.download.file', ['token' => $t->token]),
            'download_count' => $t->download_count,
            'max_downloads' => $t->max_downloads,
            'remaining_downloads' => $t->remainingDownloads(),
            'expires_at' => $t->expires_at?->format('M d, Y'),
            'is_expired' => $t->isExpired(),
        ]);

        $stats = [
            'total_orders' => $orders->count(),
            'total_spent' => (float) $orders->where('payment_status', 'paid')->sum('total'),
            'total_assets' => $digitalAssets->count(),
        ];

        return Inertia::render('Customer/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'orders' => $orders,
            'digitalAssets' => $digitalAssets,
            'stats' => $stats,
        ]);
    }
}

