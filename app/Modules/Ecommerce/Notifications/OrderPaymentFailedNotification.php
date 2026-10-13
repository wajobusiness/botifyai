<?php

namespace App\Modules\Ecommerce\Notifications;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPaymentFailedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly EcommerceOrder $order,
        public readonly string $reason
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        app(\App\Services\Mail\MailService::class)->syncActiveSmtpToDefaultMailer();

        $this->order->loadMissing('store');
        $storeName = $this->order->store?->name ?: 'BotifyAI Merchant';
        $customerName = $this->order->customer_name ?: 'Customer';
        $formattedTotal = number_format((float) $this->order->total, 2);

        $retryUrl = $this->resolveRetryCheckoutUrl();

        $message = (new MailMessage)
            ->subject("Payment Incomplete: Order #{$this->order->number} ({$storeName})")
            ->greeting("Hello {$customerName},")
            ->line("We were unable to complete your payment of **{$this->order->currency} {$formattedTotal}** for Order `{$this->order->number}` at **{$storeName}**.")
            ->line("**Reason:** {$this->reason}");

        $supportEmail = $this->order->store?->support_email;
        if (! empty($supportEmail) && filter_var($supportEmail, FILTER_VALIDATE_EMAIL)) {
            $message->replyTo($supportEmail, $storeName);
        }

        $lineItems = is_array($this->order->line_items) ? $this->order->line_items : [];
        if (! empty($lineItems)) {
            $message->line('**Items in Your Order:**');
            foreach ($lineItems as $item) {
                $itemName = $item['name'] ?? $item['title'] ?? 'Digital Product';
                $qty = (int) ($item['quantity'] ?? 1);
                $message->line("• **{$itemName}** (x{$qty})");
            }
        }

        $message->action('Retry Payment & Complete Order', $retryUrl)
            ->line('No funds were captured for this failed attempt. You can safely retry your purchase using the button above.');

        if (! empty($supportEmail)) {
            $message->line("Need help completing your order? Contact **{$storeName}** support at {$supportEmail} or reply to this email.");
        }

        return $message;
    }

    private function resolveRetryCheckoutUrl(): string
    {
        $lineItems = is_array($this->order->line_items) ? $this->order->line_items : [];
        foreach ($lineItems as $item) {
            $productId = $item['product_id'] ?? null;
            if ($productId) {
                $product = EcommerceProduct::find($productId);
                if ($product) {
                    return $product->getCheckoutUrl();
                }
            }
        }

        if (! empty($this->order->store?->slug)) {
            return route('public.storefront.show', ['slug' => $this->order->store->slug]);
        }

        return url('/');
    }
}

