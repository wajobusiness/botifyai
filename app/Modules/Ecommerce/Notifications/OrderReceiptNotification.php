<?php

namespace App\Modules\Ecommerce\Notifications;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderReceiptNotification extends Notification implements ShouldQueue
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
        $storeName = $this->order->store?->name ?: 'BotifyAI Merchant';
        $downloadUrl = route('public.checkout.receipt', ['orderUuid' => $this->order->uuid]);

        $message = (new MailMessage)
            ->subject("Payment Receipt & Downloads: Order {$this->order->number}")
            ->greeting("Hello {$this->order->customer_name},")
            ->line("Thank you for your purchase from {$storeName}!")
            ->line("Your payment of {$this->order->currency} {$this->order->total} was successfully confirmed.")
            ->line("Order Number: {$this->order->number}")
            ->action('Access Your Digital Downloads', $downloadUrl)
            ->line('You can access your download tokens and order receipt anytime using the button above.')
            ->line('If you have any questions, please contact support.');

        return $message;
    }
}

