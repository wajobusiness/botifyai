<?php

namespace App\Modules\Ecommerce\Services;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\MerchantBankAccount;
use App\Modules\Ecommerce\Models\MerchantLedgerEntry;
use App\Modules\Ecommerce\Models\MerchantPayoutRequest;
use App\Modules\Ecommerce\Models\MerchantWallet;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MerchantWalletService
{
    /** Default platform take-rate is 5% */
    public const DEFAULT_PLATFORM_FEE_PERCENT = 5.0;

    /** Minimum payout thresholds in cents: NGN 5,000 (500000 kobo), USD $20 (2000 cents) */
    public const MINIMUM_PAYOUT_THRESHOLDS = [
        'NGN' => 500000, // ₦5,000.00
        'USD' => 2000,   // $20.00
        'EUR' => 2000,   // €20.00
        'GBP' => 2000,   // £20.00
    ];

    /**
     * Credit a merchant's wallet for a completed sale.
     * Concurrency-safe via row-level locks within a DB transaction.
     */
    public function creditSale(EcommerceOrder $order): MerchantLedgerEntry
    {
        return DB::transaction(function () use ($order) {
            $currency = strtoupper($order->currency ?: 'NGN');
            $grossAmount = (float) $order->total;
            $grossCents = (int) round($grossAmount * 100);

            // Calculate platform take-rate fee
            $feePercent = self::DEFAULT_PLATFORM_FEE_PERCENT;
            $feeCents = (int) round(($grossCents * $feePercent) / 100);
            $netCents = $grossCents - $feeCents;

            // Lock the wallet row
            $wallet = MerchantWallet::where('workspace_id', $order->workspace_id)
                ->where('currency', $currency)
                ->lockForUpdate()
                ->first();

            if (! $wallet) {
                $wallet = MerchantWallet::create([
                    'workspace_id' => $order->workspace_id,
                    'currency' => $currency,
                    'available_balance_cents' => 0,
                    'pending_balance_cents' => 0,
                    'total_withdrawn_cents' => 0,
                    'total_earned_cents' => 0,
                    'is_frozen' => false,
                ]);
                $wallet = MerchantWallet::where('id', $wallet->id)->lockForUpdate()->first();
            }

            // Update wallet balance atomically
            $wallet->available_balance_cents += $netCents;
            $wallet->total_earned_cents += $grossCents;
            $wallet->save();

            // Record immutable double-entry ledger record
            $entry = MerchantLedgerEntry::create([
                'workspace_id' => $order->workspace_id,
                'wallet_id' => $wallet->id,
                'entry_type' => MerchantLedgerEntry::TYPE_SALE_CREDIT,
                'amount_cents' => $grossCents,
                'fee_cents' => $feeCents,
                'net_amount_cents' => $netCents,
                'running_balance_cents' => $wallet->available_balance_cents,
                'currency' => $currency,
                'reference_type' => 'order',
                'reference_id' => $order->id,
                'description' => "Sale credit for Order {$order->number}",
            ]);

            // Save fee & net on the order
            $order->update([
                'platform_fee_cents' => $feeCents,
                'merchant_net_cents' => $netCents,
            ]);

            return $entry;
        });
    }

    /**
     * Request a withdrawal from available balance.
     */
    public function requestPayout(int $workspaceId, int $bankAccountId, int $amountCents, string $currency = 'NGN'): MerchantPayoutRequest
    {
        $currency = strtoupper($currency);
        $minThreshold = self::MINIMUM_PAYOUT_THRESHOLDS[$currency] ?? 2000;

        if ($amountCents < $minThreshold) {
            $formattedMin = number_format($minThreshold / 100, 2);
            throw new InvalidArgumentException("Minimum withdrawal amount for {$currency} is {$formattedMin}.");
        }

        $bankAccount = MerchantBankAccount::where('workspace_id', $workspaceId)->findOrFail($bankAccountId);

        return DB::transaction(function () use ($workspaceId, $bankAccount, $amountCents, $currency) {
            $wallet = MerchantWallet::where('workspace_id', $workspaceId)
                ->where('currency', $currency)
                ->lockForUpdate()
                ->firstOrFail();

            if ($wallet->is_frozen) {
                throw new InvalidArgumentException('Your wallet is temporarily frozen. Please contact support.');
            }

            if ($wallet->available_balance_cents < $amountCents) {
                throw new InvalidArgumentException('Insufficient available balance for this withdrawal.');
            }

            // Move funds from available to pending clearance
            $wallet->available_balance_cents -= $amountCents;
            $wallet->pending_balance_cents += $amountCents;
            $wallet->save();

            // Create payout request
            $payout = MerchantPayoutRequest::create([
                'workspace_id' => $workspaceId,
                'wallet_id' => $wallet->id,
                'bank_account_id' => $bankAccount->id,
                'amount_cents' => $amountCents,
                'currency' => $currency,
                'status' => MerchantPayoutRequest::STATUS_PENDING,
            ]);

            // Record ledger debit
            MerchantLedgerEntry::create([
                'workspace_id' => $workspaceId,
                'wallet_id' => $wallet->id,
                'entry_type' => MerchantLedgerEntry::TYPE_PAYOUT_DEBIT,
                'amount_cents' => -$amountCents,
                'fee_cents' => 0,
                'net_amount_cents' => -$amountCents,
                'running_balance_cents' => $wallet->available_balance_cents,
                'currency' => $currency,
                'reference_type' => 'payout',
                'reference_id' => $payout->id,
                'description' => "Payout withdrawal request #{$payout->reference} to {$bankAccount->bank_name} - {$bankAccount->masked_account_number}",
            ]);

            return $payout;
        });
    }

    /**
     * Approve and mark payout request completed.
     */
    public function completePayout(MerchantPayoutRequest $payout, ?int $adminUserId = null): void
    {
        DB::transaction(function () use ($payout, $adminUserId) {
            $wallet = MerchantWallet::where('id', $payout->wallet_id)->lockForUpdate()->firstOrFail();

            // Clear from pending balance, add to total withdrawn
            $wallet->pending_balance_cents -= $payout->amount_cents;
            $wallet->total_withdrawn_cents += $payout->amount_cents;
            $wallet->save();

            $payout->update([
                'status' => MerchantPayoutRequest::STATUS_COMPLETED,
                'processed_at' => now(),
                'processed_by' => $adminUserId,
            ]);
        });
    }

    /**
     * Reject payout request and refund funds to merchant's available balance.
     */
    public function rejectPayout(MerchantPayoutRequest $payout, string $reason, ?int $adminUserId = null): void
    {
        DB::transaction(function () use ($payout, $reason, $adminUserId) {
            $wallet = MerchantWallet::where('id', $payout->wallet_id)->lockForUpdate()->firstOrFail();

            // Return from pending back to available balance
            $wallet->pending_balance_cents -= $payout->amount_cents;
            $wallet->available_balance_cents += $payout->amount_cents;
            $wallet->save();

            $payout->update([
                'status' => MerchantPayoutRequest::STATUS_REJECTED,
                'rejection_reason' => $reason,
                'processed_at' => now(),
                'processed_by' => $adminUserId,
            ]);

            MerchantLedgerEntry::create([
                'workspace_id' => $payout->workspace_id,
                'wallet_id' => $wallet->id,
                'entry_type' => MerchantLedgerEntry::TYPE_ADJUSTMENT,
                'amount_cents' => $payout->amount_cents,
                'fee_cents' => 0,
                'net_amount_cents' => $payout->amount_cents,
                'running_balance_cents' => $wallet->available_balance_cents,
                'currency' => $payout->currency,
                'reference_type' => 'payout',
                'reference_id' => $payout->id,
                'description' => "Refund for rejected payout #{$payout->reference}: {$reason}",
            ]);
        });
    }
}
