<?php

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
        Schema::table('ecommerce_products', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_products', 'affiliate_enabled')) {
                $table->boolean('affiliate_enabled')->default(false)->after('is_published');
            }
            if (! Schema::hasColumn('ecommerce_products', 'affiliate_commission_percentage')) {
                $table->decimal('affiliate_commission_percentage', 5, 2)->nullable()->after('affiliate_enabled');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('ecommerce_products', 'affiliate_commission_percentage')) {
                $columns[] = 'affiliate_commission_percentage';
            }
            if (Schema::hasColumn('ecommerce_products', 'affiliate_enabled')) {
                $columns[] = 'affiliate_enabled';
            }
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
