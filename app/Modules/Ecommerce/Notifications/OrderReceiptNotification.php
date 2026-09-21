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
        $this->order->loadMissing(['store', 'downloadTokens.product', 'downloadTokens.digitalAsset']);
        $storeName = $this->order->store?->name ?: 'BotifyAI Merchant';
        $receiptUrl = ! empty($this->order->uuid)
            ? route('public.checkout.receipt', ['orderUuid' => $this->order->uuid])
            : url('/buy/orders/' . $this->order->id);

        $customerName = $this->order->customer_name ?: 'Customer';

        $message = (new MailMessage)
            ->subject("Payment Receipt & Digital Access: Order #{$this->order->number}")
            ->greeting("Hello {$customerName},")
            ->line("Thank you for your purchase from **{$storeName}**!")
            ->line("Your payment of **{$this->order->currency} " . number_format((float) $this->order->total, 2) . "** has been successfully confirmed.")
            ->line("Order Reference: `{$this->order->number}`");

        // If digital download tokens exist, list each product and direct download link
        if ($this->order->downloadTokens && $this->order->downloadTokens->isNotEmpty()) {
            $message->line('---');
            $message->line('**Your Digital Downloads:**');
            foreach ($this->order->downloadTokens as $token) {
                $productTitle = $token->product?->title ?: 'Digital Product';
                $directUrl = route('public.download.file', ['token' => $token->token]);
                $fileName = $token->digitalAsset?->file_name ? " ({$token->digitalAsset->file_name})" : '';
                $message->line("• **{$productTitle}**{$fileName}: [Download File]({$directUrl})");
            }
            $message->line('---');
        }

        $message->action('View Full Receipt & Manage Downloads', $receiptUrl)
            ->line('You can also access your permanent download links, view transaction details, and download your invoice anytime using the button above.')
            ->line('If you need help or have any questions about your order, simply reply to this email.');

        return $message;
    }
}

