<?php

namespace App\Modules\Ecommerce\Notifications;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AffiliateCommissionEarnedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly EcommerceOrder $order,
        public readonly float $commissionAmount,
        public readonly float $commissionPercentage,
        public readonly string $referralCode
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];
        if (! empty($notifiable->email)) {
            array_unshift($channels, 'mail');
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        app(\App\Services\Mail\MailService::class)->syncActiveSmtpToDefaultMailer();

        $this->order->loadMissing('store');
        $affiliateName = $notifiable->name ?: 'Affiliate Partner';
        $storeName = $this->order->store?->name ?: 'BotifyAI Marketplace';
        $formattedCommission = number_format($this->commissionAmount, 2);
        $formattedOrderTotal = number_format((float) $this->order->total, 2);

        $productNames = collect($this->order->line_items ?? [])
            ->map(fn ($item) => $item['name'] ?? $item['title'] ?? null)
            ->filter()
            ->implode(', ') ?: 'Digital Product';

        return (new MailMessage)
            ->subject("Commission Earned: {$this->order->currency} {$formattedCommission} on Order #{$this->order->number}")
            ->greeting("Congratulations {$affiliateName}!")
            ->line("You just earned a referral commission from a sale on **{$storeName}**.")
            ->line('---')
            ->line("**Product Sold:** {$productNames}")
            ->line("**Order Number:** `{$this->order->number}`")
            ->line("**Referral Code Used:** `{$this->referralCode}`")
            ->line("**Order Total:** {$this->order->currency} {$formattedOrderTotal}")
            ->line("**Commission Rate:** {$this->commissionPercentage}%")
            ->line("**Commission Earned:** **{$this->order->currency} {$formattedCommission}**")
            ->line('---')
            ->action('View Affiliate Dashboard', route('client.affiliates.index'))
            ->line('Keep sharing your affiliate links to grow your recurring and product referral earnings!');
    }

    public function toArray(object $notifiable): array
    {
        $formattedCommission = number_format($this->commissionAmount, 2);

        return [
            'type' => 'affiliate_commission_earned',
            'order_id' => $this->order->id,
            'order_number' => $this->order->number,
            'referral_code' => $this->referralCode,
            'commission_amount' => $this->commissionAmount,
            'commission_percentage' => $this->commissionPercentage,
            'currency' => $this->order->currency,
            'message' => "You earned {$this->order->currency} {$formattedCommission} ({$this->commissionPercentage}%) commission on Order #{$this->order->number}!",
            'url' => route('client.affiliates.index'),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}

