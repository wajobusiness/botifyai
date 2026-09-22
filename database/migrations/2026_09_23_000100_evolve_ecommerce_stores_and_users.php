<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Evolve ecommerce_stores with branding, SEO, pixels, policies, and bank settlement
        Schema::table('ecommerce_stores', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_stores', 'logo_url')) {
                $table->string('logo_url', 1024)->nullable()->after('brand_color');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'banner_url')) {
                $table->string('banner_url', 1024)->nullable()->after('logo_url');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'description')) {
                $table->text('description')->nullable()->after('banner_url');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'seo_meta')) {
                $table->json('seo_meta')->nullable()->after('description');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'marketing_pixels')) {
                $table->json('marketing_pixels')->nullable()->after('seo_meta');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'policies')) {
                $table->json('policies')->nullable()->after('marketing_pixels');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'bank_account_id')) {
                $table->unsignedBigInteger('bank_account_id')->nullable()->after('policies');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('bank_account_id');
            }
        });

        // 2. Evolve users table with multi-role switching context
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'active_role')) {
                $table->string('active_role', 32)->default('merchant')->after('role');
            }
            if (! Schema::hasColumn('users', 'user_roles')) {
                $table->json('user_roles')->nullable()->after('active_role');
            }
            if (! Schema::hasColumn('users', 'affiliate_status')) {
                $table->string('affiliate_status', 32)->default('inactive')->after('user_roles');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ecommerce_stores', function (Blueprint $table) {
            $table->dropColumn([
                'logo_url', 'banner_url', 'description', 'seo_meta',
                'marketing_pixels', 'policies', 'bank_account_id', 'published_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['active_role', 'user_roles', 'affiliate_status']);
        });
    }
};

