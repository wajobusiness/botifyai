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
        // 1. Extend conversations table
        Schema::table('conversations', function (Blueprint $table) {
            if (! Schema::hasColumn('conversations', 'source')) {
                $table->string('source', 32)->default('inbox')->after('external_thread_id')->index();
            }
            if (! Schema::hasColumn('conversations', 'mode')) {
                $table->string('mode', 32)->default('ai')->after('source');
            }
            if (! Schema::hasColumn('conversations', 'metadata')) {
                $table->json('metadata')->nullable()->after('mode');
            }
        });

        // 2. Extend messages table
        Schema::table('messages', function (Blueprint $table) {
            if (! Schema::hasColumn('messages', 'sender_type')) {
                $table->string('sender_type', 32)->default('customer')->after('sent_by');
            }
            if (! Schema::hasColumn('messages', 'action_type')) {
                $table->string('action_type', 64)->nullable()->after('sender_type');
            }
            if (! Schema::hasColumn('messages', 'action_data')) {
                $table->json('action_data')->nullable()->after('action_type');
            }
        });

        // 3. Create chatbot_widgets table
        if (! Schema::hasTable('chatbot_widgets')) {
            Schema::create('chatbot_widgets', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->index();
                $table->unsignedBigInteger('chatbot_id')->index();
                $table->string('widget_key', 64)->unique();
                $table->string('theme', 32)->default('modern');
                $table->string('position', 32)->default('bottom_right');
                $table->string('primary_color', 32)->default('#0D9488');
                $table->text('welcome_message')->nullable();
                $table->boolean('enable_lead_capture')->default(true);
                $table->boolean('enable_human_takeover')->default(true);
                $table->text('allowed_domains')->nullable();
                $table->string('status', 16)->default('active');
                $table->timestamps();

                $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
                $table->foreign('chatbot_id')->references('id')->on('ai_chatbots')->cascadeOnDelete();
            });
        }

        // 4. Create knowledge_sources table
        if (! Schema::hasTable('knowledge_sources')) {
            Schema::create('knowledge_sources', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id')->index();
                $table->unsignedBigInteger('kb_id')->nullable()->index();
                $table->string('type', 64);
                $table->string('name', 191);
                $table->json('connection_details')->nullable();
                $table->string('sync_frequency', 32)->default('daily');
                $table->timestamp('last_sync')->nullable();
                $table->string('status', 32)->default('active');
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            });
        }

        // 5. Create knowledge_documents table
        if (! Schema::hasTable('knowledge_documents')) {
            Schema::create('knowledge_documents', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('knowledge_source_id')->index();
                $table->longText('content');
                $table->json('metadata')->nullable();
                $table->longText('embedding')->nullable();
                $table->timestamps();

                $table->foreign('knowledge_source_id')->references('id')->on('knowledge_sources')->cascadeOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_documents');
        Schema::dropIfExists('knowledge_sources');
        Schema::dropIfExists('chatbot_widgets');

        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['sender_type', 'action_type', 'action_data']);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn(['source', 'mode', 'metadata']);
        });
    }
};
