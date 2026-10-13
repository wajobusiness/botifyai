<?php

namespace App\Modules\Ecommerce\Notifications;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewOrderMerchantNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly EcommerceOrder $order
    ) {}

    public function via(object $notifiable): array
    {
        if ($notifiable instanceof AnonymousNotifiable) {
            return ['mail'];
        }

        $channels = ['database', 'broadcast'];
        if (! empty($notifiable->email)) {
            array_unshift($channels, 'mail');
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        app(\App\Services\Mail\MailService::class)->syncActiveSmtpToDefaultMailer();

        $this->order->loadMissing(['store', 'downloadTokens.product']);
        $storeName = $this->order->store?->name ?: 'Your Store';
        $merchantName = $notifiable->name ?? $storeName;

        $grossAmount = (float) $this->order->total;
        $grossFormatted = number_format($grossAmount, 2);
        $feeCents = (int) ($this->order->platform_fee_cents ?? round($grossAmount * 100 * 0.05));
        $netCents = (int) ($this->order->merchant_net_cents ?? (round($grossAmount * 100) - $feeCents));
        $feeFormatted = number_format($feeCents / 100, 2);
        $netFormatted = number_format($netCents / 100, 2);

        $productNames = collect($this->order->line_items ?? [])
            ->map(fn ($item) => $item['name'] ?? $item['title'] ?? null)
            ->filter()
            ->values();

        if ($productNames->isEmpty() && $this->order->downloadTokens) {
            $productNames = $this->order->downloadTokens
                ->map(fn ($t) => $t->product?->name ?: $t->product?->title)
                ->filter()
                ->unique()
                ->values();
        }

        $productSummary = $productNames->isNotEmpty()
            ? $productNames->implode(', ')
            : 'Digital Product';

        $buyerName = $this->order->customer_name ?: 'Customer';
        $buyerEmail = $this->order->customer_email ?: 'N/A';
        $buyerPhone = ! empty($this->order->customer_phone) ? " ({$this->order->customer_phone})" : '';
        $gateway = ucfirst($this->order->payment_gateway ?: 'Payment Gateway');
        $reference = $this->order->payment_reference ?: $this->order->number;

        $orderUrl = route('client.ecommerce.orders.show', $this->order->id);
        $affiliateMeta = $this->order->metadata['affiliate'] ?? null;

        $mail = (new MailMessage)
            ->subject("New Sale Confirmed: Order #{$this->order->number} ({$this->order->currency} {$grossFormatted})")
            ->greeting("Hello {$merchantName},")
            ->line("Great news! You have just made a new sale on **{$storeName}**.")
            ->line('---')
            ->line("**Product Sold:** {$productSummary}")
            ->line("**Buyer:** {$buyerName} — {$buyerEmail}{$buyerPhone}")
            ->line("**Order Number:** `{$this->order->number}`")
            ->line("**Transaction Reference:** `{$reference}` via {$gateway}")
            ->line('---')
            ->line("**Gross Sale Amount:** {$this->order->currency} {$grossFormatted}")
            ->line("**Platform Commission / Fee:** {$this->order->currency} {$feeFormatted}");

        if (is_array($affiliateMeta) && ! empty($affiliateMeta['commission_amount'])) {
            $affRate = $affiliateMeta['commission_percentage'] ?? 0;
            $affAmount = number_format((float) $affiliateMeta['commission_amount'], 2);
            $affCode = $affiliateMeta['referral_code'] ?? '';
            $mail->line("**Affiliate Commission ({$affRate}% · `{$affCode}`):** {$this->order->currency} {$affAmount}");
        }

        return $mail
            ->line("**Net Credited to Your Wallet:** **{$this->order->currency} {$netFormatted}**")
            ->action('View Order & Transaction Details', $orderUrl)
            ->line('Your merchant wallet has been automatically credited and the buyer has been issued their purchase receipt and access links.');
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

