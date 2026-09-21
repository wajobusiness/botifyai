<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Extend ecommerce_orders with decoupled payment lifecycle states and audit metadata
        Schema::table('ecommerce_orders', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_orders', 'payment_status')) {
                $table->string('payment_status', 32)->default('pending')->index()->after('financial_status');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'failed_at')) {
                $table->timestamp('failed_at')->nullable()->after('paid_at');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'failure_reason')) {
                $table->string('failure_reason', 512)->nullable()->after('failed_at');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('failure_reason');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'cancelled_reason')) {
                $table->string('cancelled_reason', 512)->nullable()->after('cancelled_at');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'metadata')) {
                $table->json('metadata')->nullable()->after('line_items');
            }
        });

        // 2. Extend ecommerce_payment_logs for granular transaction audits
        Schema::table('ecommerce_payment_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_payment_logs', 'workspace_id')) {
                $table->unsignedBigInteger('workspace_id')->nullable()->index()->after('id');
            }
            if (! Schema::hasColumn('ecommerce_payment_logs', 'amount_cents')) {
                $table->unsignedBigInteger('amount_cents')->nullable()->after('status');
            }
            if (! Schema::hasColumn('ecommerce_payment_logs', 'currency')) {
                $table->string('currency', 8)->nullable()->after('amount_cents');
            }
            if (! Schema::hasColumn('ecommerce_payment_logs', 'error_message')) {
                $table->string('error_message', 512)->nullable()->after('currency');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ecommerce_orders', function (Blueprint $table) {
            $table->dropColumn([
                'payment_status', 'failed_at', 'failure_reason',
                'cancelled_at', 'cancelled_reason', 'metadata',
            ]);
        });

        Schema::table('ecommerce_payment_logs', function (Blueprint $table) {
            $table->dropColumn([
                'workspace_id', 'amount_cents', 'currency', 'error_message',
            ]);
        });
    }
};

