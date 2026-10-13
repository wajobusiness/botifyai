<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('smtp_configurations')) {
            Schema::table('smtp_configurations', function (Blueprint $table) {
                if (! Schema::hasColumn('smtp_configurations', 'purpose')) {
                    $table->string('purpose', 32)->default('both')->after('is_active');
                }
                if (! Schema::hasColumn('smtp_configurations', 'rate_limit_per_minute')) {
                    $table->unsignedInteger('rate_limit_per_minute')->nullable()->after('purpose');
                }
            });
        }

        if (Schema::hasTable('contacts')) {
            Schema::table('contacts', function (Blueprint $table) {
                if (! Schema::hasColumn('contacts', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('workspace_id')->index();
                }
                if (! Schema::hasColumn('contacts', 'bounced_at')) {
                    $table->timestamp('bounced_at')->nullable()->after('last_seen_at');
                }
                if (! Schema::hasColumn('contacts', 'complained_at')) {
                    $table->timestamp('complained_at')->nullable()->after('bounced_at');
                }
            });
        }

        if (Schema::hasTable('campaigns')) {
            Schema::table('campaigns', function (Blueprint $table) {
                if (! Schema::hasColumn('campaigns', 'campaign_type')) {
                    $table->string('campaign_type', 64)->default('newsletter')->after('name');
                }
                if (! Schema::hasColumn('campaigns', 'recurrence_rule')) {
                    $table->json('recurrence_rule')->nullable()->after('timezone');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('smtp_configurations')) {
            Schema::table('smtp_configurations', function (Blueprint $table) {
                $cols = array_filter(['purpose', 'rate_limit_per_minute'], fn ($c) => Schema::hasColumn('smtp_configurations', $c));
                if (! empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }

        if (Schema::hasTable('contacts')) {
            Schema::table('contacts', function (Blueprint $table) {
                $cols = array_filter(['user_id', 'bounced_at', 'complained_at'], fn ($c) => Schema::hasColumn('contacts', $c));
                if (! empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }

        if (Schema::hasTable('campaigns')) {
            Schema::table('campaigns', function (Blueprint $table) {
                $cols = array_filter(['campaign_type', 'recurrence_rule'], fn ($c) => Schema::hasColumn('campaigns', $c));
                if (! empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }
    }
};

