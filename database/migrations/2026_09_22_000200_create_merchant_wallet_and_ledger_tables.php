<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Merchant balances / escrow wallet per workspace and currency
        if (! Schema::hasTable('merchant_wallets')) {
            Schema::create('merchant_wallets', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->index();
                $table->string('currency', 8)->default('NGN');
                $table->bigInteger('available_balance_cents')->default(0);
                $table->bigInteger('pending_balance_cents')->default(0);
                $table->unsignedBigInteger('total_withdrawn_cents')->default(0);
                $table->unsignedBigInteger('total_earned_cents')->default(0);
                $table->boolean('is_frozen')->default(false);
                $table->timestamps();

                $table->unique(['workspace_id', 'currency']);
            });
        }

        // 2. Double-entry immutable accounting ledger
        if (! Schema::hasTable('merchant_ledger_entries')) {
            Schema::create('merchant_ledger_entries', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->index();
                $table->unsignedBigInteger('wallet_id')->index();
                $table->string('entry_type', 32); // sale_credit, platform_fee_debit, payout_debit, refund_debit, adjustment
                $table->bigInteger('amount_cents');
                $table->unsignedBigInteger('fee_cents')->default(0);
                $table->bigInteger('net_amount_cents');
                $table->bigInteger('running_balance_cents');
                $table->string('currency', 8)->default('NGN');
                $table->string('reference_type', 64)->nullable(); // order, payout, adjustment
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->string('description', 512)->nullable();
                $table->timestamps();

                $table->index(['workspace_id', 'created_at']);
                $table->index(['wallet_id', 'created_at']);
            });
        }

        // 3. Merchant Bank Accounts for Payouts
        if (! Schema::hasTable('merchant_bank_accounts')) {
            Schema::create('merchant_bank_accounts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->index();
                $table->string('bank_name', 128);
                $table->string('bank_code', 32)->nullable();
                $table->string('account_number', 64);
                $table->string('account_name', 128);
                $table->string('recipient_code', 64)->nullable(); // Paystack recipient code / Stripe external account
                $table->string('currency', 8)->default('NGN');
                $table->boolean('is_default')->default(false);
                $table->timestamps();
            });
        }

        // 4. Merchant Payout Requests (Manual or Automated clearance)
        if (! Schema::hasTable('merchant_payout_requests')) {
            Schema::create('merchant_payout_requests', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->index();
                $table->unsignedBigInteger('wallet_id')->index();
                $table->unsignedBigInteger('bank_account_id')->nullable();
                $table->unsignedBigInteger('amount_cents');
                $table->string('currency', 8)->default('NGN');
                $table->string('status', 32)->default('pending'); // pending, approved, processing, completed, rejected
                $table->string('reference', 64)->unique();
                $table->string('batch_id', 64)->nullable();
                $table->string('rejection_reason', 512)->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->unsignedBigInteger('processed_by')->nullable();
                $table->timestamps();
            });
        }

        // 5. Payment Logs for Idempotency
        if (! Schema::hasTable('ecommerce_payment_logs')) {
            Schema::create('ecommerce_payment_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id')->nullable()->index();
                $table->string('gateway', 32);
                $table->string('reference', 128)->index();
                $table->string('status', 32);
                $table->json('payload')->nullable();
                $table->timestamps();

                $table->unique(['gateway', 'reference']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ecommerce_payment_logs');
        Schema::dropIfExists('merchant_payout_requests');
        Schema::dropIfExists('merchant_bank_accounts');
        Schema::dropIfExists('merchant_ledger_entries');
        Schema::dropIfExists('merchant_wallets');
    }
};
