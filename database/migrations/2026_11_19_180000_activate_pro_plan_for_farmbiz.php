<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Automatically activates the Pro plan for farmbiznigltd@gmail.com upon deployment.
     */
    public function up(): void
    {
        try {
            $email = 'farmbiznigltd@gmail.com';
            $user = DB::table('users')->where('email', $email)->first();

            // 1. Locate the Pro plan
            $proPlan = DB::table('plans')->where('slug', 'pro')->first()
                ?? DB::table('plans')->where('name', 'like', '%Pro%')->first()
                ?? DB::table('plans')->where('price_cents', '>', 0)->orderByDesc('price_cents')->first()
                ?? DB::table('plans')->first();

            if (! $proPlan) {
                Log::warning("ActivatePlan: No plan found in database to activate for {$email}");
                return;
            }

            // 2. Ensure the Pro plan has all WhatsApp and AI capabilities enabled in limits JSON
            $limits = json_decode($proPlan->limits ?? '{}', true) ?: [];
            $limits['whatsapp_cloud_api'] = true;
            $limits['whatsapp_linked_devices'] = true;
            $limits['whatsapp_ai_replies'] = true;
            $limits['whatsapp_broadcast_campaigns'] = true;
            $limits['ai_chatbots'] = true;
            $limits['ai_knowledge_hub'] = true;
            $limits['ai_live_chat_widget'] = true;
            $limits['shared_inbox'] = true;
            $limits['human_agent_takeover'] = true;
            $limits['broadcast_campaigns'] = true;
            $limits['crm_contacts'] = true;
            $limits['workflow_automations'] = true;
            $limits['max_whatsapp_accounts'] = max((int) ($limits['max_whatsapp_accounts'] ?? 0), 10);
            $limits['whatsapp_messages_per_month'] = max((int) ($limits['whatsapp_messages_per_month'] ?? 0), 50000);
            $limits['max_chatbots'] = max((int) ($limits['max_chatbots'] ?? 0), 10);
            $limits['max_knowledge_sources'] = max((int) ($limits['max_knowledge_sources'] ?? 0), 20);

            DB::table('plans')->where('id', $proPlan->id)->update([
                'limits' => json_encode($limits),
                'enabled' => 1,
            ]);

            // If user doesn't exist yet, we only updated the Pro plan
            if (! $user) {
                Log::info("ActivatePlan: User {$email} not registered yet. Pro plan configured.");
                Cache::flush();
                return;
            }

            // 3. Ensure Client record exists for user
            $clientId = $user->client_id;
            if (! $clientId && Schema::hasTable('clients')) {
                $clientId = DB::table('clients')->insertGetId([
                    'name' => $user->name ?: 'FarmBiz Nig Ltd',
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('users')->where('id', $user->id)->update([
                    'client_id' => $clientId,
                    'client_role' => 'administrator',
                ]);
            }

            // 4. Ensure Workspace exists and is linked
            if (Schema::hasTable('workspaces') && $clientId) {
                $workspace = DB::table('workspaces')->where('client_id', $clientId)->first();
                if (! $workspace) {
                    $workspaceId = DB::table('workspaces')->insertGetId([
                        'client_id' => $clientId,
                        'name' => ($user->name ?: 'FarmBiz') . ' Workspace',
                        'slug' => 'farmbiz-' . Str::lower(Str::random(6)),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    if (Schema::hasTable('workspace_user')) {
                        DB::table('workspace_user')->insertOrIgnore([
                            'workspace_id' => $workspaceId,
                            'user_id' => $user->id,
                            'role' => 'owner',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    DB::table('users')->where('id', $user->id)->update([
                        'workspace_id' => $workspaceId,
                        'current_workspace_id' => $workspaceId,
                    ]);
                }
            }

            // 5. Activate in client_subscriptions table
            if (Schema::hasTable('client_subscriptions') && $clientId) {
                DB::table('client_subscriptions')
                    ->where('client_id', $clientId)
                    ->update([
                        'status' => 'cancelled',
                        'ends_at' => now(),
                    ]);

                DB::table('client_subscriptions')->insert([
                    'client_id' => $clientId,
                    'plan_id' => $proPlan->id,
                    'billing_cycle' => 'monthly',
                    'starts_at' => now(),
                    'ends_at' => now()->addYears(2),
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 6. Also activate in user-level subscriptions table
            if (Schema::hasTable('subscriptions')) {
                DB::table('subscriptions')
                    ->where('user_id', $user->id)
                    ->update(['status' => 'cancelled', 'ends_at' => now()]);

                DB::table('subscriptions')->insert([
                    'user_id' => $user->id,
                    'plan_id' => $proPlan->id,
                    'status' => 'active',
                    'billing_cycle' => 'monthly',
                    'starts_at' => now(),
                    'ends_at' => now()->addYears(2),
                    'gateway' => 'admin_activation',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 7. Flush cache
            Cache::flush();

            Log::info("ActivatePlan: Successfully activated Pro plan for {$email} (Client ID: {$clientId}, Plan ID: {$proPlan->id})");
        } catch (\Throwable $e) {
            Log::error("ActivatePlan failed: " . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
