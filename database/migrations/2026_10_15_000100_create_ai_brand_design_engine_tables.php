<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('workspace_brand_profiles')) {
            Schema::table('workspace_brand_profiles', function (Blueprint $table) {
                if (! Schema::hasColumn('workspace_brand_profiles', 'website_url')) {
                    $table->string('website_url', 255)->nullable()->after('logo_url');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'primary_handle')) {
                    $table->string('primary_handle', 120)->nullable()->after('website_url');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'dark_logo_url')) {
                    $table->string('dark_logo_url', 512)->nullable()->after('primary_handle');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'watermark_url')) {
                    $table->string('watermark_url', 512)->nullable()->after('dark_logo_url');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'watermark_opacity')) {
                    $table->unsignedTinyInteger('watermark_opacity')->default(40)->after('watermark_url');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'watermark_position')) {
                    $table->string('watermark_position', 32)->default('bottom-right')->after('watermark_opacity');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'typography')) {
                    $table->json('typography')->nullable()->after('brand_colors');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'visual_theme')) {
                    $table->string('visual_theme', 64)->default('modern_minimalist')->after('typography');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'aspect_ratios')) {
                    $table->json('aspect_ratios')->nullable()->after('visual_theme');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'contact_info')) {
                    $table->json('contact_info')->nullable()->after('aspect_ratios');
                }
                if (! Schema::hasColumn('workspace_brand_profiles', 'active_templates')) {
                    $table->json('active_templates')->nullable()->after('contact_info');
                }
            });
        }

        if (! Schema::hasTable('social_brand_templates')) {
            Schema::create('social_brand_templates', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->nullable()->index();
                $table->string('slug', 64)->index();
                $table->string('name', 160);
                $table->string('category', 64)->index(); // tip, quote, data, promo, announcement, carousel
                $table->string('aspect_ratio', 16)->default('1:1'); // 1:1, 4:5, 9:16, 16:9
                $table->unsignedInteger('width')->default(1080);
                $table->unsignedInteger('height')->default(1080);
                $table->json('definition_json')->nullable();
                $table->string('preview_url', 512)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('social_brand_templates');

        if (Schema::hasTable('workspace_brand_profiles')) {
            Schema::table('workspace_brand_profiles', function (Blueprint $table) {
                $cols = array_filter([
                    'website_url',
                    'primary_handle',
                    'dark_logo_url',
                    'watermark_url',
                    'watermark_opacity',
                    'watermark_position',
                    'typography',
                    'visual_theme',
                    'aspect_ratios',
                    'contact_info',
                    'active_templates',
                ], fn ($col) => Schema::hasColumn('workspace_brand_profiles', $col));

                if (! empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }
    }
};

