<?php

namespace App\Modules\Ecommerce\Notifications;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewOrderMerchantNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly EcommerceOrder $order
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_commerce_order',
            'order_id' => $this->order->id,
            'order_number' => $this->order->number,
            'customer_name' => $this->order->customer_name,
            'total' => (float) $this->order->total,
            'currency' => $this->order->currency,
            'message' => "New Order {$this->order->number} from {$this->order->customer_name} ({$this->order->currency} {$this->order->total})",
            'url' => route('client.ecommerce.orders.show', $this->order->id),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}

