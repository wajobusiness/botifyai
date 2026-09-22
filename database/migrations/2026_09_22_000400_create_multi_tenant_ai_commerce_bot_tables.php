<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Enhance ai_chatbots with commerce and persona configurations
        Schema::table('ai_chatbots', function (Blueprint $table) {
            if (! Schema::hasColumn('ai_chatbots', 'purpose')) {
                $table->string('purpose', 64)->default('sales')->after('name');
            }
            if (! Schema::hasColumn('ai_chatbots', 'temperature')) {
                $table->decimal('temperature', 3, 2)->default(0.70)->after('tone');
            }
            if (! Schema::hasColumn('ai_chatbots', 'is_default')) {
                $table->boolean('is_default')->default(false)->after('fallback_reply');
            }
            if (! Schema::hasColumn('ai_chatbots', 'handoff_threshold')) {
                $table->unsignedTinyInteger('handoff_threshold')->default(3)->after('is_default');
            }
        });

        // 2. Many-to-many junction between bots and knowledge bases
        if (! Schema::hasTable('ai_bot_knowledge_sources')) {
            Schema::create('ai_bot_knowledge_sources', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('chatbot_id');
                $table->unsignedBigInteger('knowledge_base_id');
                $table->smallInteger('priority')->default(10);
                $table->timestamps();

                $table->unique(['chatbot_id', 'knowledge_base_id'], 'bot_kb_unique');
                $table->foreign('chatbot_id')->references('id')->on('ai_chatbots')->cascadeOnDelete();
                $table->foreign('knowledge_base_id')->references('id')->on('ai_knowledge_bases')->cascadeOnDelete();
            });
        }

        // 3. Connect bots to ecommerce stores with capability toggles
        if (! Schema::hasTable('ai_bot_store_connections')) {
            Schema::create('ai_bot_store_connections', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id');
                $table->unsignedBigInteger('chatbot_id');
                $table->unsignedBigInteger('store_id');
                $table->boolean('is_store_default')->default(true);
                $table->boolean('enable_catalog_search')->default(true);
                $table->boolean('enable_cart_creation')->default(true);
                $table->boolean('enable_order_tracking')->default(true);
                $table->timestamps();

                $table->unique(['store_id', 'chatbot_id'], 'bot_store_unique');
                $table->index(['workspace_id', 'store_id'], 'bot_store_ws_idx');
                $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
                $table->foreign('chatbot_id')->references('id')->on('ai_chatbots')->cascadeOnDelete();
                $table->foreign('store_id')->references('id')->on('ecommerce_stores')->cascadeOnDelete();
            });
        }

        // 4. Granular product-level bot routing overrides
        if (! Schema::hasTable('ai_bot_product_assignments')) {
            Schema::create('ai_bot_product_assignments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id');
                $table->unsignedBigInteger('chatbot_id');
                $table->unsignedBigInteger('product_id');
                $table->text('custom_instructions')->nullable();
                $table->timestamps();

                $table->unique('product_id', 'bot_product_unique');
                $table->index(['workspace_id', 'chatbot_id'], 'bot_prod_ws_idx');
                $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
                $table->foreign('chatbot_id')->references('id')->on('ai_chatbots')->cascadeOnDelete();
                $table->foreign('product_id')->references('id')->on('ecommerce_products')->cascadeOnDelete();
            });
        }

        // 5. Declarative tool permissions per bot
        if (! Schema::hasTable('ai_bot_tool_permissions')) {
            Schema::create('ai_bot_tool_permissions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('chatbot_id');
                $table->string('tool_name', 64);
                $table->boolean('is_allowed')->default(true);
                $table->unsignedSmallInteger('rate_limit_per_session')->default(30);
                $table->timestamps();

                $table->unique(['chatbot_id', 'tool_name'], 'bot_tool_unique');
                $table->foreign('chatbot_id')->references('id')->on('ai_chatbots')->cascadeOnDelete();
            });
        }

        // 6. Unified visitor & customer conversation sessions
        if (! Schema::hasTable('conversation_sessions')) {
            Schema::create('conversation_sessions', function (Blueprint $table) {
                $table->id();
                $table->char('uuid', 36)->unique();
                $table->unsignedBigInteger('workspace_id');
                $table->unsignedBigInteger('chatbot_id');
                $table->string('channel', 32)->default('web'); // web, whatsapp, etc.
                $table->unsignedBigInteger('channel_account_id')->nullable();
                $table->unsignedBigInteger('contact_id')->nullable();
                $table->unsignedBigInteger('conversation_id')->nullable();
                $table->string('session_token', 128)->unique();
                $table->unsignedBigInteger('current_store_id')->nullable();
                $table->unsignedBigInteger('current_product_id')->nullable();
                $table->json('metadata')->nullable();
                $table->enum('status', ['active', 'handoff_requested', 'closed'])->default('active');
                $table->timestamp('last_activity_at')->nullable();
                $table->timestamps();

                $table->index(['workspace_id', 'chatbot_id'], 'conv_sess_ws_bot_idx');
                $table->index('session_token', 'conv_sess_token_idx');
                $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
                $table->foreign('chatbot_id')->references('id')->on('ai_chatbots')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_sessions');
        Schema::dropIfExists('ai_bot_tool_permissions');
        Schema::dropIfExists('ai_bot_product_assignments');
        Schema::dropIfExists('ai_bot_store_connections');
        Schema::dropIfExists('ai_bot_knowledge_sources');

        Schema::table('ai_chatbots', function (Blueprint $table) {
            $table->dropColumn(['purpose', 'temperature', 'is_default', 'handoff_threshold']);
        });
    }
};

