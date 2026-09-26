<?php

use App\Models\SystemSetting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('affiliate_subscriptions')) {
            Schema::create('affiliate_subscriptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('plan_type', 32)->default('yearly'); // 'monthly', 'yearly', 'free', 'comped'
                $table->decimal('amount_paid', 12, 2)->default(0);
                $table->string('currency', 8)->default('USD');
                $table->string('payment_gateway', 32)->nullable(); // 'paystack', 'stripe', 'manual', 'comped'
                $table->string('payment_reference', 191)->nullable();
                $table->string('status', 32)->default('active'); // 'active', 'expired', 'cancelled', 'pending'
                $table->timestamp('started_at')->nullable();
                $table->timestamp('expires_at')->nullable(); // null for lifetime/free/comped
                $table->boolean('auto_renew')->default(false);
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'status'], 'aff_sub_user_status_idx');
                $table->index(['status', 'expires_at'], 'aff_sub_status_expires_idx');
                $table->index('payment_reference', 'aff_sub_ref_idx');
            });
        }

        // Seed default affiliate access fee settings if not yet present
        try {
            if (SystemSetting::get('affiliate_access_fee') === null) {
                SystemSetting::set('affiliate_access_fee', '0');
            }
            if (SystemSetting::get('affiliate_access_currency') === null) {
                SystemSetting::set('affiliate_access_currency', 'USD');
            }
            if (SystemSetting::get('affiliate_access_cycle') === null) {
                SystemSetting::set('affiliate_access_cycle', 'yearly');
            }
        } catch (\Throwable) {
            // ignore during fresh install
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affiliate_subscriptions');
    }
};
