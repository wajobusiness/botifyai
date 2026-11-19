<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('whatsapp_device_sessions')) {
            Schema::create('whatsapp_device_sessions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id');
                $table->unsignedBigInteger('channel_account_id')->nullable();
                $table->string('session_uid', 64)->unique();
                $table->string('name', 128)->default('WhatsApp Phone');
                $table->string('phone_number', 32)->nullable();
                $table->string('connection_type', 32)->default('pairing_code'); // 'pairing_code', 'qr_code', 'coexistence'
                $table->string('connection_status', 32)->default('disconnected'); // 'disconnected', 'pairing', 'connected', 'reconnecting', 'failed'
                $table->string('pairing_code', 16)->nullable();
                $table->timestamp('pairing_code_expires_at')->nullable();
                $table->text('qr_raw')->nullable();
                $table->longText('auth_state_json')->nullable();
                $table->string('push_name', 128)->nullable();
                $table->string('platform', 64)->nullable();
                $table->integer('battery_level')->nullable();
                $table->boolean('is_business')->default(false);
                $table->text('error_message')->nullable();
                $table->timestamp('last_active_at')->nullable();
                $table->timestamp('paired_at')->nullable();
                $table->timestamps();

                $table->index('workspace_id');
                $table->index('channel_account_id');
                $table->index('connection_status');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_device_sessions');
    }
};
