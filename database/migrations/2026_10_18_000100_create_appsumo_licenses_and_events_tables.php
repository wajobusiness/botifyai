<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appsumo_licenses', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->char('code_hash', 64)->unique();
            $table->string('tier', 32)->default('tier1'); // tier1, tier2, tier3, tier4, tier5
            $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete();
            $table->string('status', 32)->default('unredeemed'); // unredeemed, redeemed, refunded, revoked, disabled
            $table->foreignId('redeemed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->timestamp('redeemed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('tier');
            $table->index(['client_id', 'status']);
        });

        Schema::create('license_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('license_id')->constrained('appsumo_licenses')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 48); // imported, validated, redeemed, stacked, upgraded, downgraded, refunded, revoked
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('license_id');
            $table->index('user_id');
            $table->index('event_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('license_events');
        Schema::dropIfExists('appsumo_licenses');
    }
};

