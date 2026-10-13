<?php

namespace App\Modules\Ecommerce\Notifications;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderReceiptNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly EcommerceOrder $order
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        app(\App\Services\Mail\MailService::class)->syncActiveSmtpToDefaultMailer();

        $this->order->loadMissing(['store', 'downloadTokens.product', 'downloadTokens.digitalAsset']);
        $storeName = $this->order->store?->name ?: 'BotifyAI Merchant';
        $receiptUrl = ! empty($this->order->uuid)
            ? route('public.checkout.receipt', ['orderUuid' => $this->order->uuid])
            : url('/buy/orders/' . $this->order->id);

        $customerName = $this->order->customer_name ?: 'Customer';
        $formattedTotal = number_format((float) $this->order->total, 2);

        $message = (new MailMessage)
            ->subject("Payment Receipt & Digital Access: Order #{$this->order->number}")
            ->greeting("Hello {$customerName},")
            ->line("Thank you for your purchase from **{$storeName}**!")
            ->line("Your payment of **{$this->order->currency} {$formattedTotal}** has been successfully confirmed.")
            ->line("Order Number: `{$this->order->number}`" . (! empty($this->order->payment_reference) ? " | Payment Reference: `{$this->order->payment_reference}`" : ''));

        $supportEmail = $this->order->store?->support_email;
        if (! empty($supportEmail) && filter_var($supportEmail, FILTER_VALIDATE_EMAIL)) {
            $message->replyTo($supportEmail, $storeName);
        }

        // List purchased items from order line_items if present
        $lineItems = is_array($this->order->line_items) ? $this->order->line_items : [];
        if (! empty($lineItems)) {
            $message->line('**Order Summary:**');
            foreach ($lineItems as $item) {
                $itemName = $item['name'] ?? $item['title'] ?? 'Digital Product';
                $qty = (int) ($item['quantity'] ?? 1);
                $price = isset($item['price']) ? number_format((float) $item['price'], 2) : $formattedTotal;
                $message->line("• **{$itemName}** (x{$qty}) — {$this->order->currency} {$price}");
            }
        }

        // If digital download tokens exist, list each product and direct download link
        if ($this->order->downloadTokens && $this->order->downloadTokens->isNotEmpty()) {
            $message->line('---');
            $message->line('**Your Digital Downloads:**');
            foreach ($this->order->downloadTokens as $token) {
                $productTitle = $token->product?->name ?: ($token->product?->title ?: 'Digital Product');
                $directUrl = route('public.download.file', ['token' => $token->token]);
                $fileName = $token->digitalAsset?->file_name ? " ({$token->digitalAsset->file_name})" : '';
                $message->line("• **{$productTitle}**{$fileName}: [Download File]({$directUrl})");
            }
            $message->line('---');
        }

        $message->action('View Full Receipt & Manage Downloads', $receiptUrl)
            ->line('You can also access your permanent download links, view transaction details, and download your invoice anytime using the button above.');

        if (! empty($supportEmail)) {
            $supportPhone = ! empty($this->order->store?->support_phone) ? " or {$this->order->store->support_phone}" : '';
            $message->line("Need assistance? Contact **{$storeName}** support at {$supportEmail}{$supportPhone} or simply reply to this email.");
        } else {
            $message->line('If you need help or have any questions about your order, simply reply to this email.');
        }

        return $message;
    }
}

