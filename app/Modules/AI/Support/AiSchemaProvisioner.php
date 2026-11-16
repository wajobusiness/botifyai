<?php

namespace App\Modules\AI\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AiSchemaProvisioner
{
    /**
     * Ensure all required tables and columns for the AI Chat Widget,
     * Knowledge Hub, and multi-tenant bot architecture exist in the database.
     * Uses caching to ensure it executes only once per deployment/day.
     */
    public static function ensureTablesExist(): void
    {
        try {
            if (Cache::has('ai_schema_provisioned_v3')) {
                return;
            }

            // 1. Attempt to run any pending database migrations
            try {
                Artisan::call('migrate', ['--force' => true]);
            } catch (\Throwable $mE) {
                Log::info('Artisan auto-migrate note: ' . $mE->getMessage());
            }

            // 2. Defensive creation of chatbot_widgets table
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
                });
            }

            // 3. Defensive creation of knowledge_sources table
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
                });
            }

            // 4. Defensive creation of knowledge_documents table
            if (! Schema::hasTable('knowledge_documents')) {
                Schema::create('knowledge_documents', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('knowledge_source_id')->index();
                    $table->longText('content');
                    $table->json('metadata')->nullable();
                    $table->longText('embedding')->nullable();
                    $table->timestamps();
                });
            }

            // 5. Junction table: ai_bot_knowledge_sources
            if (! Schema::hasTable('ai_bot_knowledge_sources')) {
                Schema::create('ai_bot_knowledge_sources', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('chatbot_id')->index();
                    $table->unsignedBigInteger('knowledge_base_id')->index();
                    $table->smallInteger('priority')->default(10);
                    $table->timestamps();
                });
            }

            // 6. Bot store connections: ai_bot_store_connections
            if (! Schema::hasTable('ai_bot_store_connections')) {
                Schema::create('ai_bot_store_connections', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('workspace_id')->index();
                    $table->unsignedBigInteger('chatbot_id')->index();
                    $table->unsignedBigInteger('store_id')->index();
                    $table->boolean('is_store_default')->default(true);
                    $table->boolean('enable_catalog_search')->default(true);
                    $table->boolean('enable_cart_creation')->default(true);
                    $table->boolean('enable_order_tracking')->default(true);
                    $table->timestamps();
                });
            }

            // 7. Product bot routing: ai_bot_product_assignments
            if (! Schema::hasTable('ai_bot_product_assignments')) {
                Schema::create('ai_bot_product_assignments', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('workspace_id')->index();
                    $table->unsignedBigInteger('chatbot_id')->index();
                    $table->unsignedBigInteger('product_id')->index();
                    $table->text('custom_instructions')->nullable();
                    $table->timestamps();
                });
            }

            // 8. Tool permissions: ai_bot_tool_permissions
            if (! Schema::hasTable('ai_bot_tool_permissions')) {
                Schema::create('ai_bot_tool_permissions', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('chatbot_id')->index();
                    $table->string('tool_name', 64);
                    $table->boolean('is_allowed')->default(true);
                    $table->unsignedSmallInteger('rate_limit_per_session')->default(30);
                    $table->timestamps();
                });
            }

            // 9. Conversation sessions: conversation_sessions
            if (! Schema::hasTable('conversation_sessions')) {
                Schema::create('conversation_sessions', function (Blueprint $table) {
                    $table->id();
                    $table->char('uuid', 36)->unique();
                    $table->unsignedBigInteger('workspace_id')->index();
                    $table->unsignedBigInteger('chatbot_id')->nullable()->index();
                    $table->string('visitor_token', 64)->nullable()->index();
                    $table->string('ip_address', 45)->nullable();
                    $table->text('user_agent')->nullable();
                    $table->json('metadata')->nullable();
                    $table->timestamp('last_active_at')->nullable();
                    $table->timestamps();
                });
            }

            // 10. Columns on conversations table
            if (Schema::hasTable('conversations')) {
                Schema::table('conversations', function (Blueprint $table) {
                    if (! Schema::hasColumn('conversations', 'source')) {
                        $table->string('source', 32)->default('inbox')->nullable();
                    }
                    if (! Schema::hasColumn('conversations', 'mode')) {
                        $table->string('mode', 32)->default('ai')->nullable();
                    }
                    if (! Schema::hasColumn('conversations', 'metadata')) {
                        $table->json('metadata')->nullable();
                    }
                    if (! Schema::hasColumn('conversations', 'assigned_to')) {
                        $table->string('assigned_to', 32)->default('bot')->nullable();
                    }
                });
            }

            // 11. Columns on messages table
            if (Schema::hasTable('messages')) {
                Schema::table('messages', function (Blueprint $table) {
                    if (! Schema::hasColumn('messages', 'sender_type')) {
                        $table->string('sender_type', 32)->default('customer')->nullable();
                    }
                    if (! Schema::hasColumn('messages', 'action_type')) {
                        $table->string('action_type', 64)->nullable();
                    }
                    if (! Schema::hasColumn('messages', 'action_data')) {
                        $table->json('action_data')->nullable();
                    }
                });
            }

            // 12. Columns on ai_chatbots table
            if (Schema::hasTable('ai_chatbots')) {
                Schema::table('ai_chatbots', function (Blueprint $table) {
                    if (! Schema::hasColumn('ai_chatbots', 'purpose')) {
                        $table->string('purpose', 64)->default('sales')->nullable();
                    }
                    if (! Schema::hasColumn('ai_chatbots', 'temperature')) {
                        $table->decimal('temperature', 3, 2)->default(0.70)->nullable();
                    }
                    if (! Schema::hasColumn('ai_chatbots', 'is_default')) {
                        $table->boolean('is_default')->default(false)->nullable();
                    }
                    if (! Schema::hasColumn('ai_chatbots', 'handoff_threshold')) {
                        $table->unsignedTinyInteger('handoff_threshold')->default(3)->nullable();
                    }
                });
            }

            Cache::put('ai_schema_provisioned_v3', true, now()->addDays(7));
        } catch (\Throwable $e) {
            Log::warning('AiSchemaProvisioner failed: ' . $e->getMessage());
        }
    }
}
