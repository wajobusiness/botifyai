<?php

namespace App\Console\Commands;

use App\Models\Client;
use App\Models\ClientSubscription;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ActivateCustomerPlanCommand extends Command
{
    protected $signature = 'plan:activate {email : The customer user email} {plan=pro : The plan slug or name}';

    protected $description = 'Activate or assign a subscription plan to a customer account directly';

    public function handle(): int
    {
        $email = trim($this->argument('email'));
        $planArg = trim($this->argument('plan'));

        $this->info("Activating plan '{$planArg}' for {$email}...");

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error("User with email {$email} not found!");
            return self::FAILURE;
        }

        $plan = Plan::where('slug', $planArg)->first()
            ?? Plan::where('name', 'like', "%{$planArg}%")->first()
            ?? Plan::find($planArg);

        if (! $plan) {
            $this->error("Plan '{$planArg}' not found in database.");
            return self::FAILURE;
        }

        // 1. Ensure the plan has all WhatsApp and AI features turned on in its limits
        $limits = is_array($plan->limits) ? $plan->limits : (json_decode($plan->limits ?? '{}', true) ?: []);
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

        $plan->update([
            'limits' => $limits,
            'enabled' => true,
        ]);

        // 2. Ensure Client exists
        $client = $user->client;
        if (! $client) {
            $client = Client::create([
                'name' => $user->name ?: 'FarmBiz Nig Ltd',
                'status' => 'active',
            ]);
            $user->update([
                'client_id' => $client->id,
                'client_role' => 'administrator',
            ]);
        }

        // 3. Ensure Workspace exists
        $workspace = $user->currentWorkspace ?? Workspace::where('client_id', $client->id)->first();
        if (! $workspace) {
            $workspace = Workspace::create([
                'client_id' => $client->id,
                'name' => ($user->name ?: 'FarmBiz') . ' Workspace',
                'slug' => 'farmbiz-' . Str::lower(Str::random(6)),
            ]);

            DB::table('workspace_user')->insertOrIgnore([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $user->update([
                'workspace_id' => $workspace->id,
                'current_workspace_id' => $workspace->id,
            ]);
        }

        // 4. Activate ClientSubscription
        $client->clientSubscriptions()->where('status', ClientSubscription::STATUS_ACTIVE)->update([
            'status' => ClientSubscription::STATUS_CANCELLED,
            'ends_at' => now(),
        ]);

        $sub = $client->clientSubscriptions()->create([
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
            'starts_at' => now(),
            'ends_at' => now()->addYears(2),
            'status' => ClientSubscription::STATUS_ACTIVE,
        ]);

        // 5. Also update user Subscription
        Subscription::where('user_id', $user->id)->update(['status' => 'cancelled']);
        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'billing_cycle' => 'monthly',
            'starts_at' => now(),
            'ends_at' => now()->addYears(2),
            'gateway' => 'admin_activated',
        ]);

        Cache::flush();

        $this->info("✓ Successfully activated {$plan->name} plan for {$user->email} (Subscription #{$sub->id})!");
        return self::SUCCESS;
    }
}
