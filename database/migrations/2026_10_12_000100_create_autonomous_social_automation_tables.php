<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('workspace_brand_profiles')) {
            Schema::create('workspace_brand_profiles', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->unique();
                $table->string('brand_name', 160)->nullable();
                $table->string('niche', 255)->nullable();
                $table->text('target_audience')->nullable();
                $table->string('tone', 64)->default('professional');
                $table->text('writing_style')->nullable();
                $table->json('content_pillars')->nullable();
                $table->json('brand_colors')->nullable();
                $table->string('logo_url', 512)->nullable();
                $table->json('cta_templates')->nullable();
                $table->json('banned_phrases')->nullable();
                $table->json('default_hashtag_sets')->nullable();
                $table->boolean('requires_approval')->default(false);
                $table->boolean('auto_replenish')->default(true);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('automations')) {
            Schema::table('automations', function (Blueprint $table) {
                if (! Schema::hasColumn('automations', 'next_run_at')) {
                    $table->timestamp('next_run_at')->nullable()->after('run_count');
                    $table->index(['status', 'trigger_type', 'next_run_at'], 'automations_recurring_schedule_idx');
                }
                if (! Schema::hasColumn('automations', 'last_run_at')) {
                    $table->timestamp('last_run_at')->nullable()->after('next_run_at');
                }
            });
        }

        if (Schema::hasTable('social_media_posts')) {
            Schema::table('social_media_posts', function (Blueprint $table) {
                if (! Schema::hasColumn('social_media_posts', 'automation_id')) {
                    $table->unsignedBigInteger('automation_id')->nullable()->after('workspace_id');
                    $table->index('automation_id');
                }
                if (! Schema::hasColumn('social_media_posts', 'automation_run_id')) {
                    $table->unsignedBigInteger('automation_run_id')->nullable()->after('automation_id');
                }
                if (! Schema::hasColumn('social_media_posts', 'content_pillar')) {
                    $table->string('content_pillar', 128)->nullable()->after('ai_prompt');
                }
                if (! Schema::hasColumn('social_media_posts', 'content_format')) {
                    $table->string('content_format', 64)->nullable()->after('content_pillar');
                }
                if (! Schema::hasColumn('social_media_posts', 'caption_hash')) {
                    $table->string('caption_hash', 64)->nullable()->after('content_format');
                    $table->index(['workspace_id', 'caption_hash'], 'social_posts_workspace_caption_hash_idx');
                }
                if (! Schema::hasColumn('social_media_posts', 'requires_approval')) {
                    $table->boolean('requires_approval')->default(false)->after('caption_hash');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('social_media_posts')) {
            Schema::table('social_media_posts', function (Blueprint $table) {
                if (Schema::hasColumn('social_media_posts', 'caption_hash')) {
                    $table->dropIndex('social_posts_workspace_caption_hash_idx');
                }
                if (Schema::hasColumn('social_media_posts', 'automation_id')) {
                    $table->dropIndex(['automation_id']);
                }
                $cols = array_filter(
                    ['automation_id', 'automation_run_id', 'content_pillar', 'content_format', 'caption_hash', 'requires_approval'],
                    fn ($c) => Schema::hasColumn('social_media_posts', $c)
                );
                if (! empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }

        if (Schema::hasTable('automations')) {
            Schema::table('automations', function (Blueprint $table) {
                if (Schema::hasColumn('automations', 'next_run_at')) {
                    $table->dropIndex('automations_recurring_schedule_idx');
                }
                $cols = array_filter(
                    ['next_run_at', 'last_run_at'],
                    fn ($c) => Schema::hasColumn('automations', $c)
                );
                if (! empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }

        Schema::dropIfExists('workspace_brand_profiles');
    }
};

