<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add native store extensions to ecommerce_stores
        Schema::table('ecommerce_stores', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_stores', 'slug')) {
                $table->string('slug', 128)->nullable()->unique()->after('name');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'currency')) {
                $table->string('currency', 8)->default('USD')->after('domain');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'support_email')) {
                $table->string('support_email')->nullable()->after('currency');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'support_phone')) {
                $table->string('support_phone', 40)->nullable()->after('support_email');
            }
            if (! Schema::hasColumn('ecommerce_stores', 'brand_color')) {
                $table->string('brand_color', 16)->default('#0D9488')->after('support_phone');
            }
        });

        // 2. Extend ecommerce_products with native product fields
        Schema::table('ecommerce_products', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_products', 'slug')) {
                $table->string('slug', 191)->nullable()->unique()->after('name');
            }
            if (! Schema::hasColumn('ecommerce_products', 'product_type')) {
                $table->string('product_type', 32)->default('digital')->after('slug'); // digital | physical | service
            }
            if (! Schema::hasColumn('ecommerce_products', 'description')) {
                $table->longText('description')->nullable()->after('product_type');
            }
            if (! Schema::hasColumn('ecommerce_products', 'compare_at_price')) {
                $table->decimal('compare_at_price', 12, 2)->nullable()->after('price');
            }
            if (! Schema::hasColumn('ecommerce_products', 'currency')) {
                $table->string('currency', 8)->default('USD')->after('compare_at_price');
            }
            if (! Schema::hasColumn('ecommerce_products', 'is_published')) {
                $table->boolean('is_published')->default(true)->after('status');
            }
            if (! Schema::hasColumn('ecommerce_products', 'custom_fields')) {
                $table->json('custom_fields')->nullable()->after('raw');
            }
        });

        // 3. Create digital assets table
        if (! Schema::hasTable('ecommerce_digital_assets')) {
            Schema::create('ecommerce_digital_assets', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->index();
                $table->unsignedBigInteger('product_id')->index();
                $table->string('asset_type', 32)->default('file_upload'); // file_upload | redirect_url
                $table->string('file_path', 1024)->nullable();
                $table->string('file_name', 255)->nullable();
                $table->unsignedBigInteger('file_size_bytes')->nullable();
                $table->string('mime_type', 128)->nullable();
                $table->text('external_redirect_url')->nullable();
                $table->timestamps();

                $table->foreign('product_id')->references('id')->on('ecommerce_products')->cascadeOnDelete();
            });
        }

        // 4. Create download tokens for buyer digital vault delivery
        if (! Schema::hasTable('ecommerce_download_tokens')) {
            Schema::create('ecommerce_download_tokens', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id')->index();
                $table->unsignedBigInteger('product_id')->index();
                $table->unsignedBigInteger('digital_asset_id')->nullable()->index();
                $table->string('token', 64)->unique();
                $table->unsignedInteger('download_count')->default(0);
                $table->unsignedInteger('max_downloads')->default(5);
                $table->timestamp('expires_at')->nullable();
                $table->json('ip_addresses')->nullable();
                $table->timestamps();
            });
        }

        // 5. Extend ecommerce_orders with buyer and native payment details
        Schema::table('ecommerce_orders', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_orders', 'uuid')) {
                $table->string('uuid', 64)->nullable()->unique()->after('id');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'customer_name')) {
                $table->string('customer_name')->nullable()->after('contact_id');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'customer_email')) {
                $table->string('customer_email')->nullable()->after('customer_name');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'customer_phone')) {
                $table->string('customer_phone', 40)->nullable()->after('customer_email');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'platform_fee_cents')) {
                $table->unsignedBigInteger('platform_fee_cents')->default(0)->after('total');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'merchant_net_cents')) {
                $table->unsignedBigInteger('merchant_net_cents')->default(0)->after('platform_fee_cents');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'payment_gateway')) {
                $table->string('payment_gateway', 32)->nullable()->after('merchant_net_cents');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'payment_reference')) {
                $table->string('payment_reference', 128)->nullable()->index()->after('payment_gateway');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('placed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ecommerce_download_tokens');
        Schema::dropIfExists('ecommerce_digital_assets');

        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->dropColumn([
                'slug', 'product_type', 'description', 'compare_at_price',
                'currency', 'is_published', 'custom_fields',
            ]);
        });

        Schema::table('ecommerce_stores', function (Blueprint $table) {
            $table->dropColumn(['slug', 'currency', 'support_email', 'support_phone', 'brand_color']);
        });

        Schema::table('ecommerce_orders', function (Blueprint $table) {
            $table->dropColumn([
                'uuid', 'customer_name', 'customer_email', 'customer_phone',
                'platform_fee_cents', 'merchant_net_cents', 'payment_gateway',
                'payment_reference', 'paid_at',
            ]);
        });
    }
};
