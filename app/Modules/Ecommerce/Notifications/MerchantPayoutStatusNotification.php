<?php

namespace App\Modules\Ecommerce\Notifications;

use App\Modules\Ecommerce\Models\MerchantPayoutRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MerchantPayoutStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly MerchantPayoutRequest $payout,
        public readonly string $eventStatus // 'requested' | 'completed' | 'rejected'
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

        $this->payout->loadMissing('bankAccount');
        $merchantName = $notifiable->name ?: 'Merchant';
        $amountFormatted = number_format($this->payout->amount_cents / 100, 2);
        $bankName = $this->payout->bankAccount?->bank_name ?: 'Bank Account';
        $maskedAccount = $this->payout->bankAccount?->masked_account_number ?: ($this->payout->bankAccount?->account_number ?: '');
        $walletUrl = route('client.ecommerce.wallet.index');

        if ($this->eventStatus === 'completed') {
            return (new MailMessage)
                ->subject("Payout Completed: {$this->payout->currency} {$amountFormatted} (#{$this->payout->reference})")
                ->greeting("Hello {$merchantName},")
                ->line("Your withdrawal request **#{$this->payout->reference}** for **{$this->payout->currency} {$amountFormatted}** has been approved and processed.")
                ->line("**Destination Account:** {$bankName} ({$maskedAccount})")
                ->action('View Merchant Wallet', $walletUrl)
                ->line('Funds typically reflect in your bank account shortly depending on your bank\'s clearing schedule.');
        }

        if ($this->eventStatus === 'rejected') {
            $reason = $this->payout->rejection_reason ?: 'Please verify your bank account details and try again.';

            return (new MailMessage)
                ->subject("Payout Request Returned: #{$this->payout->reference} ({$this->payout->currency} {$amountFormatted})")
                ->greeting("Hello {$merchantName},")
                ->line("Your withdrawal request **#{$this->payout->reference}** for **{$this->payout->currency} {$amountFormatted}** could not be processed and the full amount has been restored to your available wallet balance.")
                ->line("**Reason:** {$reason}")
                ->action('Review Wallet & Bank Details', $walletUrl);
        }

        return (new MailMessage)
            ->subject("Withdrawal Request Received: #{$this->payout->reference} ({$this->payout->currency} {$amountFormatted})")
            ->greeting("Hello {$merchantName},")
            ->line("We have received your payout withdrawal request **#{$this->payout->reference}** for **{$this->payout->currency} {$amountFormatted}**.")
            ->line("**Destination Account:** {$bankName} ({$maskedAccount})")
            ->action('Track Payout Status', $walletUrl)
            ->line('You will receive another email as soon as your withdrawal is disbursed.');
    }

    public function toArray(object $notifiable): array
    {
        $amountFormatted = number_format($this->payout->amount_cents / 100, 2);

        $message = match ($this->eventStatus) {
            'completed' => "Your payout #{$this->payout->reference} ({$this->payout->currency} {$amountFormatted}) has been completed.",
            'rejected' => "Your payout #{$this->payout->reference} ({$this->payout->currency} {$amountFormatted}) was returned to your wallet: {$this->payout->rejection_reason}",
            default => "Your payout withdrawal request #{$this->payout->reference} ({$this->payout->currency} {$amountFormatted}) has been submitted.",
        };

        return [
            'type' => 'merchant_payout_' . $this->eventStatus,
            'payout_id' => $this->payout->id,
            'reference' => $this->payout->reference,
            'amount_cents' => $this->payout->amount_cents,
            'currency' => $this->payout->currency,
            'status' => $this->payout->status,
            'message' => $message,
            'url' => route('client.ecommerce.wallet.index'),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}

