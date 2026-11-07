<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\ClientSubscription;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Workspace;
use App\Modules\AI\Models\AiChatbot;
use App\Modules\AI\Models\AiKbChunk;
use App\Modules\AI\Models\AiKbDocument;
use App\Modules\AI\Models\AiKnowledgeBase;
use App\Modules\AI\Models\AiProviderConfig;
use App\Modules\AI\Models\AiRun;
use App\Modules\Automation\Models\Automation;
use App\Modules\Automation\Models\AutomationRun;
use App\Modules\Broadcasting\Models\Campaign;
use App\Modules\Broadcasting\Models\CampaignRecipient;
use App\Modules\Broadcasting\Models\UsageMeter;
use App\Modules\Ecommerce\Models\EcommerceCart;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Ecommerce\Models\MerchantBankAccount;
use App\Modules\Ecommerce\Models\MerchantLedgerEntry;
use App\Modules\Ecommerce\Models\MerchantWallet;
use App\Modules\Inbox\Models\InboxLabel;
use App\Modules\Shared\Models\ChannelAccount;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\ContactTag;
use App\Modules\Shared\Models\Conversation;
use App\Modules\Shared\Models\Message;
use App\Modules\Whatsapp\Models\WhatsappAutoReply;
use App\Modules\Whatsapp\Models\WhatsappBusinessAccount;
use App\Modules\Whatsapp\Models\WhatsappPhoneNumber;
use App\Services\ClientWorkspaceService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Seeder for FTF Digital Solutions Limited (ayo@ftfdigitalsolutions.com).
 * Accurately seeds the commercial metrics, customer telemetry, automated cart recovery,
 * Meta Cloud API campaigns, and AI routing telemetry evidenced in the commercial impact dossier.
 */
class FtfDigitalSolutionsSeeder extends Seeder
{
    private Client $client;
    private Workspace $workspace;
    private User $user;
    private EcommerceStore $store;
    private string $waPhoneNumberId = '104928572910482';

    public function run(): void
    {
        $this->command?->info('Seeding FTF Digital Solutions Limited (ayo@ftfdigitalsolutions.com)...');

        $this->seedClientAndUser();
        $this->seedChannelsAndWhatsapp();
        $this->seedAiEngine();
        $this->seedAutomations();
        $this->seedContacts();
        $this->seedConversations();
        $this->seedEcommerceStoreAndProducts();
        $this->seedEcommerceOrdersAndInvoices();
        $this->seedCartRecoveryEngine();
        $this->seedBroadcastingAndMetaCampaign();
        $this->seedAdminTelemetry();

        $this->command?->info('FTF Digital Solutions Limited seeded successfully.');
    }

    private function bk($model, Carbon $created, ?Carbon $updated = null): void
    {
        $model->forceFill([
            'created_at' => $created,
            'updated_at' => $updated ?? $created,
        ])->saveQuietly();
    }

    private function seedClientAndUser(): void
    {
        $email = 'ayo@ftfdigitalsolutions.com';

        // 1. Client Enterprise Entity
        $this->client = Client::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'FTF Digital Solutions Limited',
                'status' => Client::STATUS_ACTIVE,
                'base_currency' => 'NGN',
                'currency_symbol' => '₦',
                'currency_position' => 'before',
                'primary_color' => '#0D9488',
                'created_at' => Carbon::now()->subMonths(10),
                'updated_at' => Carbon::now(),
            ]
        );

        // 2. Primary Client Administrator
        $this->user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Ayo',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_CLIENT,
                'status' => User::STATUS_ACTIVE,
                'client_id' => $this->client->id,
                'client_role' => User::CLIENT_ROLE_ADMINISTRATOR,
                'email_verified_at' => Carbon::now()->subMonths(10),
                'locale' => 'en',
                'display_currency' => 'NGN',
                'timezone' => 'Africa/Lagos',
                'created_at' => Carbon::now()->subMonths(10),
                'updated_at' => Carbon::now(),
            ]
        );

        // 3. Ensure Workspace exists & attach user
        app(ClientWorkspaceService::class)->syncClientUser($this->user);
        $this->user->refresh();

        $this->workspace = Workspace::where('client_id', $this->client->id)->first()
            ?? Workspace::create([
                'client_id' => $this->client->id,
                'name' => 'FTF Digital Solutions Workspace',
                'owner_id' => $this->user->id,
                'default_locale' => 'en',
                'currency_code' => 'NGN',
            ]);

        // Force set user workspace pointer
        $this->user->forceFill([
            'workspace_id' => $this->workspace->id,
        ])->saveQuietly();

        // Attach workspace membership pivot
        DB::table('workspace_user')->updateOrInsert(
            ['workspace_id' => $this->workspace->id, 'user_id' => $this->user->id],
            ['role' => 'owner', 'created_at' => now(), 'updated_at' => now()]
        );

        // 4. Client Enterprise Subscription
        $plan = Plan::where('slug', 'enterprise')->first()
            ?? Plan::where('slug', 'pro')->first()
            ?? Plan::first();

        if ($plan) {
            ClientSubscription::updateOrCreate(
                ['client_id' => $this->client->id],
                [
                    'plan_id' => $plan->id,
                    'status' => ClientSubscription::STATUS_ACTIVE,
                    'billing_cycle' => ClientSubscription::BILLING_MONTHLY,
                    'starts_at' => Carbon::now()->subMonths(10),
                    'ends_at' => Carbon::now()->addYear(),
                    'created_at' => Carbon::now()->subMonths(10),
                    'updated_at' => Carbon::now(),
                ]
            );
        }
    }

    private function seedChannelsAndWhatsapp(): void
    {
        $wid = $this->workspace->id;

        // WhatsApp Channel
        ChannelAccount::updateOrCreate(
            ['workspace_id' => $wid, 'channel' => 'whatsapp'],
            [
                'display_name' => 'FTF Logistics WhatsApp Support & Tracking',
                'provider' => 'meta',
                'phone_number_id' => $this->waPhoneNumberId,
                'credentials' => ['system_user_token' => 'EAAG_FTF_LIVE_META_TOKEN_VERIFIED'],
                'status' => 'active',
                'created_at' => Carbon::now()->subMonths(10),
                'updated_at' => Carbon::now(),
            ]
        );

        // Instagram Channel
        ChannelAccount::updateOrCreate(
            ['workspace_id' => $wid, 'channel' => 'instagram'],
            [
                'display_name' => '@ftflogistics',
                'provider' => 'meta',
                'credentials' => ['access_token' => 'IG_FTF_VERIFIED_TOKEN'],
                'status' => 'active',
                'created_at' => Carbon::now()->subMonths(10),
                'updated_at' => Carbon::now(),
            ]
        );

        // Messenger Channel
        ChannelAccount::updateOrCreate(
            ['workspace_id' => $wid, 'channel' => 'messenger'],
            [
                'display_name' => 'FTF Digital Solutions Limited',
                'provider' => 'meta',
                'credentials' => ['access_token' => 'PAGE_FTF_VERIFIED_TOKEN'],
                'status' => 'active',
                'created_at' => Carbon::now()->subMonths(10),
                'updated_at' => Carbon::now(),
            ]
        );

        // Official Meta WhatsApp Business Account
        $waba = WhatsappBusinessAccount::updateOrCreate(
            ['workspace_id' => $wid],
            [
                'waba_id' => 'waba_ftf_2024_enterprise',
                'credentials' => ['system_user_token' => 'EAAG_FTF_LIVE_META_TOKEN_VERIFIED'],
                'webhook_verify_token' => Str::random(48),
                'status' => 'active',
                'created_at' => Carbon::now()->subMonths(10),
                'updated_at' => Carbon::now(),
            ]
        );

        WhatsappPhoneNumber::updateOrCreate(
            ['phone_number_id' => $this->waPhoneNumberId],
            [
                'whatsapp_business_account_id' => $waba->id,
                'display_phone_number' => '+234 813 366 2232',
                'verified_name' => 'FTF Digital Solutions Limited',
                'quality_rating' => 'GREEN',
                'code_verification_status' => 'VERIFIED',
                'name_status' => 'APPROVED',
                'created_at' => Carbon::now()->subMonths(10),
                'updated_at' => Carbon::now(),
            ]
        );

        // Automated Instant Quotation & Package Tracking Auto-Replies
        WhatsappAutoReply::updateOrCreate(
            ['workspace_id' => $wid, 'keyword' => 'track'],
            [
                'name' => 'Waybill & Package Status Tracking',
                'match_type' => 'contains',
                'reply_text' => "📦 *FTF Logistics Package Tracker*\nPlease reply with your 8-digit Waybill Number (e.g. WB-10028401) to get instant live GPS dispatch status, carrier flight details, and scheduled delivery window.",
                'is_active' => true,
            ]
        );

        WhatsappAutoReply::updateOrCreate(
            ['workspace_id' => $wid, 'keyword' => 'quote'],
            [
                'name' => 'Instant Shipping Rate Quotation',
                'match_type' => 'contains',
                'reply_text' => "✈️ *FTF Instant Shipping Quotation*\nOur automated quotation engine provides instant rates for:\n1. UK Air Express (3-5 business days)\n2. North America Priority Courier (4-7 business days)\n3. Nationwide Interstate Doorstep Delivery\nReply with: ORIGIN / DESTINATION / WEIGHT (KG) to receive an instant verified invoice.",
                'is_active' => true,
            ]
        );
    }

    private function seedAiEngine(): void
    {
        $wid = $this->workspace->id;

        AiProviderConfig::updateOrCreate(
            ['workspace_id' => $wid, 'provider' => 'openai'],
            [
                'credentials' => ['api_key' => 'sk-ftf-production-live-gateway'],
                'default_model_chat' => 'gpt-4o-mini',
                'default_model_embed' => 'text-embedding-3-small',
                'enabled' => true,
            ]
        );

        $kb = AiKnowledgeBase::updateOrCreate(
            ['workspace_id' => $wid, 'name' => 'FTF Cross-Border Logistics & Quotation KB'],
            [
                'embedding_model' => 'text-embedding-3-small',
                'dimensions' => 1536,
                'status' => 'active',
            ]
        );

        $doc = AiKbDocument::updateOrCreate(
            ['kb_id' => $kb->id, 'title' => 'FTF Shipping Tariffs, Customs Regulations & Waybill Routing'],
            [
                'source_type' => 'text',
                'source_ref' => 'doc:ftf-logistics-core',
                'status' => 'indexed',
                'tokens' => 1450,
                'last_indexed_at' => Carbon::now()->subDays(5),
            ]
        );

        if (AiKbChunk::where('document_id', $doc->id)->doesntExist()) {
            AiKbChunk::create([
                'kb_id' => $kb->id,
                'document_id' => $doc->id,
                'ord' => 0,
                'content' => 'FTF Digital Solutions Limited is a leading cross-border logistics company handling local, interstate, and international shipping across Nigeria, the UK, and North America. Express transit is 3-5 days for UK and 5-7 days for North America.',
                'tokens' => 250,
            ]);
        }

        $bot = AiChatbot::updateOrCreate(
            ['workspace_id' => $wid, 'name' => 'FTF Logistics AI Quotation & Tracking Copilot'],
            [
                'ai_kb_id' => $kb->id,
                'system_prompt' => 'You are the official AI Sales & Package Tracking Copilot for FTF Digital Solutions Limited. Provide instant automated quotes, verify waybill tracking numbers, handle in-chat checkouts, and resolve inquiries with sub-second response latency.',
                'tone' => 'professional',
                'max_context_chunks' => 5,
                'fallback_reply' => 'Our senior shipping coordinator is reviewing your custom freight request. Your instant waybill booking reference is being generated.',
                'channels' => ['whatsapp', 'instagram', 'messenger', 'web'],
                'enabled' => true,
                'is_default' => true,
            ]
        );

        // Delete existing runs to allow idempotent re-seed
        AiRun::where('chatbot_id', $bot->id)->delete();

        // Seed 500+ AI runs across the active 30-day window
        // Demonstrates sub-second latency (avg ~527.5ms) and 98.4% resolution success rate (492 ok, 8 error = 98.4%)
        $runs = [];
        $now = Carbon::now();
        for ($i = 0; $i < 500; $i++) {
            $prompt = rand(240, 780);
            $comp = rand(60, 290);
            $isError = ($i % 62 === 0 && $i > 0); // exactly 8 errors in 500 = 98.4% success rate
            $daysAgo = rand(0, 28);
            $createdAt = $now->copy()->subDays($daysAgo)->subMinutes(rand(0, 1400));

            $runs[] = [
                'chatbot_id' => $bot->id,
                'prompt_tokens' => $prompt,
                'completion_tokens' => $comp,
                'cost_cents' => (int) ceil(($prompt * 0.000015 + $comp * 0.00006) * 100),
                'latency_ms' => rand(380, 720), // sub-second latency (380ms - 720ms)
                'model' => 'gpt-4o-mini',
                'status' => $isError ? 'error' : 'ok',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            if (count($runs) >= 100) {
                DB::table('ai_runs')->insert($runs);
                $runs = [];
            }
        }
        if (! empty($runs)) {
            DB::table('ai_runs')->insert($runs);
        }
    }

    private function seedAutomations(): void
    {
        $wid = $this->workspace->id;

        $automations = [
            [
                'name' => 'Waybill & Tracking Lookup Flow',
                'trigger_type' => 'message.received',
                'status' => 'active',
                'run_count' => 384,
                'nodes' => [
                    ['id' => 'trigger-1', 'type' => 'trigger', 'position' => ['x' => 250, 'y' => 50], 'data' => ['label' => 'Incoming WhatsApp Message']],
                    ['id' => 'condition-1', 'type' => 'condition', 'position' => ['x' => 250, 'y' => 150], 'data' => ['label' => 'Contains Waybill Regex (#FTF- / WB-)']],
                    ['id' => 'action-1', 'type' => 'action', 'position' => ['x' => 250, 'y' => 250], 'data' => ['label' => 'Query Waybill Tracking API']],
                    ['id' => 'action-2', 'type' => 'action', 'position' => ['x' => 250, 'y' => 350], 'data' => ['label' => 'Send WhatsApp Live GPS Dispatch Status']],
                ],
                'edges' => [
                    ['id' => 'e1-2', 'source' => 'trigger-1', 'target' => 'condition-1'],
                    ['id' => 'e2-3', 'source' => 'condition-1', 'target' => 'action-1'],
                    ['id' => 'e3-4', 'source' => 'action-1', 'target' => 'action-2'],
                ],
            ],
            [
                'name' => 'Instant Shipping Rate Calculator',
                'trigger_type' => 'message.received',
                'status' => 'active',
                'run_count' => 291,
                'nodes' => [
                    ['id' => 'trigger-1', 'type' => 'trigger', 'position' => ['x' => 250, 'y' => 50], 'data' => ['label' => 'Keyword "quote" or "rate"']],
                    ['id' => 'action-1', 'type' => 'action', 'position' => ['x' => 250, 'y' => 150], 'data' => ['label' => 'Extract Weight (kg) & Destination City']],
                    ['id' => 'action-2', 'type' => 'action', 'position' => ['x' => 250, 'y' => 250], 'data' => ['label' => 'Compute Dynamic Tariff (UK Express / Interstate)']],
                    ['id' => 'action-3', 'type' => 'action', 'position' => ['x' => 250, 'y' => 350], 'data' => ['label' => 'Send WhatsApp Quote + 1-Click Paystack Link']],
                ],
                'edges' => [
                    ['id' => 'e1-2', 'source' => 'trigger-1', 'target' => 'action-1'],
                    ['id' => 'e2-3', 'source' => 'action-1', 'target' => 'action-2'],
                    ['id' => 'e3-4', 'source' => 'action-2', 'target' => 'action-3'],
                ],
            ],
            [
                'name' => 'In-Chat Waybill Invoicing (Paystack API)',
                'trigger_type' => 'order.placed',
                'status' => 'active',
                'run_count' => 470,
                'nodes' => [
                    ['id' => 'trigger-1', 'type' => 'trigger', 'position' => ['x' => 250, 'y' => 50], 'data' => ['label' => 'Waybill Booking Order Created']],
                    ['id' => 'action-1', 'type' => 'action', 'position' => ['x' => 250, 'y' => 150], 'data' => ['label' => 'Generate Paystack Payment Reference & QR']],
                    ['id' => 'action-2', 'type' => 'action', 'position' => ['x' => 250, 'y' => 250], 'data' => ['label' => 'Send Interactive Invoice WhatsApp Message']],
                    ['id' => 'action-3', 'type' => 'action', 'position' => ['x' => 250, 'y' => 350], 'data' => ['label' => 'Auto-Reconcile Merchant Ledger Balance']],
                ],
                'edges' => [
                    ['id' => 'e1-2', 'source' => 'trigger-1', 'target' => 'action-1'],
                    ['id' => 'e2-3', 'source' => 'action-1', 'target' => 'action-2'],
                    ['id' => 'e3-4', 'source' => 'action-2', 'target' => 'action-3'],
                ],
            ],
            [
                'name' => 'Abandoned Checkout Recovery (WhatsApp)',
                'trigger_type' => 'cart.abandoned',
                'status' => 'active',
                'run_count' => 100,
                'nodes' => [
                    ['id' => 'trigger-1', 'type' => 'trigger', 'position' => ['x' => 250, 'y' => 50], 'data' => ['label' => 'Cart Inactive for 30 Minutes']],
                    ['id' => 'delay-1', 'type' => 'delay', 'position' => ['x' => 250, 'y' => 150], 'data' => ['label' => 'Wait 15 Minutes']],
                    ['id' => 'action-1', 'type' => 'action', 'position' => ['x' => 250, 'y' => 250], 'data' => ['label' => 'Send Meta Template: waybill_dispatch_recovery']],
                    ['id' => 'action-2', 'type' => 'action', 'position' => ['x' => 250, 'y' => 350], 'data' => ['label' => 'Apply 5% Freight Voucher on WhatsApp Click']],
                ],
                'edges' => [
                    ['id' => 'e1-2', 'source' => 'trigger-1', 'target' => 'delay-1'],
                    ['id' => 'e2-3', 'source' => 'delay-1', 'target' => 'action-1'],
                    ['id' => 'e3-4', 'source' => 'action-1', 'target' => 'action-2'],
                ],
            ],
            [
                'name' => 'Omnichannel Cross-Border Dispatch (Meta Cloud API)',
                'trigger_type' => 'webhook.received',
                'status' => 'active',
                'run_count' => 158,
                'nodes' => [
                    ['id' => 'trigger-1', 'type' => 'trigger', 'position' => ['x' => 250, 'y' => 50], 'data' => ['label' => 'Customs Cargo Cleared Webhook']],
                    ['id' => 'action-1', 'type' => 'action', 'position' => ['x' => 250, 'y' => 150], 'data' => ['label' => 'Assign Local Dispatch Hub & Rider']],
                    ['id' => 'action-2', 'type' => 'action', 'position' => ['x' => 250, 'y' => 250], 'data' => ['label' => 'Broadcast SMS & WhatsApp Dispatch Notice']],
                ],
                'edges' => [
                    ['id' => 'e1-2', 'source' => 'trigger-1', 'target' => 'action-1'],
                    ['id' => 'e2-3', 'source' => 'action-1', 'target' => 'action-2'],
                ],
            ],
            [
                'name' => 'VIP Freight Customs Clearance Alert',
                'trigger_type' => 'contact.tag_added',
                'status' => 'active',
                'run_count' => 64,
                'nodes' => [
                    ['id' => 'trigger-1', 'type' => 'trigger', 'position' => ['x' => 250, 'y' => 50], 'data' => ['label' => 'Tag "Customs Clearance" Added']],
                    ['id' => 'action-1', 'type' => 'action', 'position' => ['x' => 250, 'y' => 150], 'data' => ['label' => 'Generate Formal Bill of Lading Assessment']],
                    ['id' => 'action-2', 'type' => 'action', 'position' => ['x' => 250, 'y' => 250], 'data' => ['label' => 'Notify Dedicated Logistics Account Manager']],
                ],
                'edges' => [
                    ['id' => 'e1-2', 'source' => 'trigger-1', 'target' => 'action-1'],
                    ['id' => 'e2-3', 'source' => 'action-1', 'target' => 'action-2'],
                ],
            ],
        ];

        foreach ($automations as $auto) {
            $record = Automation::updateOrCreate(
                ['workspace_id' => $wid, 'name' => $auto['name']],
                [
                    'uuid' => (string) Str::uuid(),
                    'trigger_type' => $auto['trigger_type'],
                    'status' => $auto['status'],
                    'nodes' => $auto['nodes'],
                    'edges' => $auto['edges'],
                    'definition_json' => ['nodes' => $auto['nodes'], 'edges' => $auto['edges']],
                    'run_count' => $auto['run_count'],
                    'created_by' => $this->user->id,
                ]
            );

            AutomationRun::where('automation_id', $record->id)->delete();

            $autoRuns = [];
            $runTarget = $auto['run_count'];
            for ($r = 0; $r < $runTarget; $r++) {
                $daysAgo = rand(0, 20);
                $startedAt = Carbon::now()->subDays($daysAgo)->setTime(rand(8, 20), rand(0, 59));
                $autoRuns[] = [
                    'automation_id' => $record->id,
                    'workspace_id' => $wid,
                    'status' => 'completed',
                    'started_at' => $startedAt,
                    'completed_at' => $startedAt->copy()->addSeconds(rand(1, 4)),
                    'created_at' => $startedAt,
                    'updated_at' => $startedAt,
                ];

                if (count($autoRuns) >= 200) {
                    DB::table('automation_runs')->insert($autoRuns);
                    $autoRuns = [];
                }
            }
            if (! empty($autoRuns)) {
                DB::table('automation_runs')->insert($autoRuns);
            }
        }
    }

    private function seedContacts(): void
    {
        $wid = $this->workspace->id;

        // Ensure contact_tags and pivot tables exist
        if (! Schema::hasTable('contact_tags')) {
            Schema::create('contact_tags', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id');
                $table->string('name', 64);
                $table->string('color', 16)->default('#6366f1');
                $table->timestamps();
                $table->unique(['workspace_id', 'name']);
            });
        }
        if (! Schema::hasTable('contact_tag_pivot')) {
            Schema::create('contact_tag_pivot', function (Blueprint $table) {
                $table->unsignedBigInteger('contact_id');
                $table->unsignedBigInteger('tag_id');
                $table->primary(['contact_id', 'tag_id']);
            });
        }

        $tagDefinitions = [
            'Logistics Client' => '#0d9488',
            'Waybill Inquiry' => '#2563eb',
            'Cross-Border Freight' => '#4f46e5',
            'VIP Shipper' => '#d97706',
            'Abandoned Cart' => '#e11d48',
            'UK Express' => '#059669',
        ];

        $tags = [];
        foreach ($tagDefinitions as $name => $color) {
            $tags[$name] = ContactTag::updateOrCreate(
                ['workspace_id' => $wid, 'name' => $name],
                ['color' => $color]
            );
        }

        // 30 Primary Nigerian contacts with Nigerian phone numbers (+234 803 *** **** format)
        $primaryContactsList = [
            ['first_name' => 'Emeka', 'last_name' => 'Okonkwo', 'email' => 'emeka.o@meridianlogistics.ng', 'phone' => '+234 803 241 8920', 'city' => 'Lagos', 'tags' => ['Logistics Client', 'Waybill Inquiry', 'Cross-Border Freight']],
            ['first_name' => 'Babatunde', 'last_name' => 'Adeyemi', 'email' => 'tunde.adeyemi@crossborder.co.uk', 'phone' => '+234 803 555 0192', 'city' => 'London / Lagos', 'tags' => ['Cross-Border Freight', 'UK Express']],
            ['first_name' => 'Chioma', 'last_name' => 'Eze', 'email' => 'chioma.eze@africantradehub.com', 'phone' => '+234 814 998 8776', 'city' => 'Abuja', 'tags' => ['VIP Shipper', 'Logistics Client']],
            ['first_name' => 'Ngozi', 'last_name' => 'Okonjo', 'email' => 'ngozi.okonjo@ftfclient.com', 'phone' => '+234 802 345 6701', 'city' => 'Enugu', 'tags' => ['Logistics Client', 'Waybill Inquiry']],
            ['first_name' => 'Aisha', 'last_name' => 'Bello', 'email' => 'aisha.bello@ftfclient.com', 'phone' => '+234 802 345 6702', 'city' => 'Kano', 'tags' => ['Abandoned Cart', 'Logistics Client']],
            ['first_name' => 'Tunde', 'last_name' => 'Bakare', 'email' => 'tunde.bakare@ftfclient.com', 'phone' => '+234 802 345 6703', 'city' => 'Ibadan', 'tags' => ['Waybill Inquiry']],
            ['first_name' => 'Chiamaka', 'last_name' => 'Nze', 'email' => 'chiamaka.nze@ftfclient.com', 'phone' => '+234 802 345 6704', 'city' => 'Owerri', 'tags' => ['Cross-Border Freight', 'UK Express']],
            ['first_name' => 'Ibrahim', 'last_name' => 'Musa', 'email' => 'ibrahim.musa@ftfclient.com', 'phone' => '+234 806 712 3456', 'city' => 'Kaduna', 'tags' => ['Logistics Client', 'Waybill Inquiry']],
            ['first_name' => 'Amaka', 'last_name' => 'Obi', 'email' => 'amaka.obi@ftfclient.com', 'phone' => '+234 805 123 4567', 'city' => 'Port Harcourt', 'tags' => ['VIP Shipper', 'Cross-Border Freight']],
            ['first_name' => 'Yusuf', 'last_name' => 'Garba', 'email' => 'yusuf.garba@ftfclient.com', 'phone' => '+234 703 890 1234', 'city' => 'Jos', 'tags' => ['Logistics Client']],
            ['first_name' => 'Bolaji', 'last_name' => 'Davies', 'email' => 'bolaji.davies@ftfclient.com', 'phone' => '+234 902 345 6789', 'city' => 'Lagos', 'tags' => ['VIP Shipper', 'Logistics Client']],
            ['first_name' => 'Fatima', 'last_name' => 'Dangote', 'email' => 'fatima.dangote@ftfclient.com', 'phone' => '+234 818 234 5678', 'city' => 'Kano', 'tags' => ['VIP Shipper', 'Logistics Client']],
            ['first_name' => 'Olumide', 'last_name' => 'Adeleke', 'email' => 'olumide.adeleke@ftfclient.com', 'phone' => '+234 809 123 4567', 'city' => 'Ibadan', 'tags' => ['Waybill Inquiry']],
            ['first_name' => 'Nnamdi', 'last_name' => 'Azikiwe', 'email' => 'nnamdi.azikiwe@ftfclient.com', 'phone' => '+234 816 789 0123', 'city' => 'Onitsha', 'tags' => ['Logistics Client', 'Cross-Border Freight']],
            ['first_name' => 'Folashade', 'last_name' => 'Tinubu', 'email' => 'folashade.t@ftfclient.com', 'phone' => '+234 813 456 7890', 'city' => 'Lagos', 'tags' => ['VIP Shipper']],
            ['first_name' => 'Abubakar', 'last_name' => 'Shehu', 'email' => 'abubakar.shehu@ftfclient.com', 'phone' => '+234 803 987 6543', 'city' => 'Sokoto', 'tags' => ['Logistics Client', 'Waybill Inquiry']],
            ['first_name' => 'Ifeanyi', 'last_name' => 'Ubah', 'email' => 'ifeanyi.ubah@ftfclient.com', 'phone' => '+234 814 321 0987', 'city' => 'Nnewi', 'tags' => ['Cross-Border Freight']],
            ['first_name' => 'Damilola', 'last_name' => 'Fashola', 'email' => 'dami.fashola@ftfclient.com', 'phone' => '+234 805 678 1234', 'city' => 'Lagos', 'tags' => ['Logistics Client', 'UK Express']],
            ['first_name' => 'Kemi', 'last_name' => 'Adeosun', 'email' => 'kemi.adeosun@ftfclient.com', 'phone' => '+234 802 987 1234', 'city' => 'Abeokuta', 'tags' => ['VIP Shipper', 'Cross-Border Freight']],
            ['first_name' => 'Funke', 'last_name' => 'Akindele', 'email' => 'funke.a@ftfclient.com', 'phone' => '+234 803 111 2233', 'city' => 'Lagos', 'tags' => ['Logistics Client']],
            ['first_name' => 'Osagie', 'last_name' => 'Alonge', 'email' => 'osagie.alonge@ftfclient.com', 'phone' => '+234 818 999 8888', 'city' => 'Benin City', 'tags' => ['Waybill Inquiry']],
            ['first_name' => 'Zainab', 'last_name' => 'Ahmed', 'email' => 'zainab.ahmed@ftfclient.com', 'phone' => '+234 703 123 9876', 'city' => 'Kaduna', 'tags' => ['Logistics Client', 'Cross-Border Freight']],
            ['first_name' => 'Olamide', 'last_name' => 'Adedeji', 'email' => 'olamide.adedeji@ftfclient.com', 'phone' => '+234 902 888 7766', 'city' => 'Lagos', 'tags' => ['Abandoned Cart']],
            ['first_name' => 'Blessing', 'last_name' => 'Okagbare', 'email' => 'blessing.o@ftfclient.com', 'phone' => '+234 809 555 4433', 'city' => 'Warri', 'tags' => ['Logistics Client', 'UK Express']],
            ['first_name' => 'Kelechi', 'last_name' => 'Iheanacho', 'email' => 'kelechi.i@ftfclient.com', 'phone' => '+234 816 444 3322', 'city' => 'Owerri', 'tags' => ['VIP Shipper']],
            ['first_name' => 'Victor', 'last_name' => 'Osimhen', 'email' => 'victor.osimhen@ftfclient.com', 'phone' => '+234 803 777 6655', 'city' => 'Lagos', 'tags' => ['VIP Shipper', 'Cross-Border Freight']],
            ['first_name' => 'Chinua', 'last_name' => 'Achebe', 'email' => 'chinua.achebe@ftfclient.com', 'phone' => '+234 814 111 9900', 'city' => 'Ogidi', 'tags' => ['Logistics Client']],
            ['first_name' => 'Simi', 'last_name' => 'Ogunleye', 'email' => 'simi.ogunleye@ftfclient.com', 'phone' => '+234 805 222 3344', 'city' => 'Lagos', 'tags' => ['Waybill Inquiry', 'UK Express']],
            ['first_name' => 'Bankole', 'last_name' => 'Wellington', 'email' => 'banky.w@ftfclient.com', 'phone' => '+234 802 666 7788', 'city' => 'Lagos', 'tags' => ['VIP Shipper', 'Cross-Border Freight']],
            ['first_name' => 'Yetunde', 'last_name' => 'Ayeni', 'email' => 'yetunde.ayeni@ftfclient.com', 'phone' => '+234 803 888 9900', 'city' => 'Ilorin', 'tags' => ['Logistics Client', 'Waybill Inquiry']],
        ];

        $now = Carbon::now();
        foreach ($primaryContactsList as $idx => $c) {
            $contact = Contact::updateOrCreate(
                ['workspace_id' => $wid, 'phone_e164' => $c['phone']],
                [
                    'uuid' => (string) Str::uuid(),
                    'first_name' => $c['first_name'],
                    'last_name' => $c['last_name'],
                    'email' => $c['email'],
                    'country' => 'NG',
                    'language' => 'en',
                    'opt_in_whatsapp' => true,
                    'opt_in_sms' => true,
                    'opt_in_email' => true,
                    'custom_fields' => ['destination_city' => $c['city'], 'account_tier' => 'Enterprise Shipper'],
                ]
            );

            // Anchor these 30 contacts at the top of Page 1 (ordered by latest)
            $contactCreated = $now->copy()->subMinutes($idx * 4);
            $this->bk($contact, $contactCreated);

            // Sync tags
            $tagIds = [];
            foreach ($c['tags'] as $tagName) {
                if (isset($tags[$tagName])) {
                    $tagIds[] = $tags[$tagName]->id;
                }
            }
            if (! empty($tagIds)) {
                $contact->tags()->sync($tagIds);
            }
        }

        // Scale to 14,200 active customer contacts as evidenced in PDF dossier page 1:
        // "highlighting ₦18.4 million in shipping bookings... 14,200 active customer contacts"
        $currentCount = Contact::where('workspace_id', $wid)->count();
        $targetContacts = 14200;

        if ($currentCount < $targetContacts) {
            $batch = [];
            $batchSize = 1000;

            for ($i = $currentCount + 1; $i <= $targetContacts; $i++) {
                $daysAgo = rand(1, 28);
                $createdAt = $now->copy()->subDays($daysAgo)->subMinutes(rand(0, 1400));
                $pad = str_pad((string) $i, 7, '0', STR_PAD_LEFT);
                $phPrefix = (($i * 7) % 9) + 1;

                $batch[] = [
                    'uuid' => (string) Str::uuid(),
                    'workspace_id' => $wid,
                    'phone_e164' => "+234 80{$phPrefix} " . substr($pad, 0, 3) . " " . substr($pad, 3),
                    'email' => "shipper_{$i}@ftfclient.com",
                    'first_name' => 'Shipper',
                    'last_name' => (string) $i,
                    'opt_in_whatsapp' => 1,
                    'opt_in_sms' => 1,
                    'opt_in_email' => 1,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];

                if (count($batch) >= $batchSize) {
                    DB::table('contacts')->insert($batch);
                    $batch = [];
                }
            }

            if (! empty($batch)) {
                DB::table('contacts')->insert($batch);
            }
        }
    }

    private function seedConversations(): void
    {
        $wid = $this->workspace->id;
        $channel = ChannelAccount::where('workspace_id', $wid)->where('channel', 'whatsapp')->first();
        if (! $channel) {
            return;
        }

        // Ensure inbox_labels and pivot tables exist
        if (! Schema::hasTable('inbox_labels')) {
            Schema::create('inbox_labels', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('workspace_id');
                $table->string('name', 64);
                $table->string('color', 16)->default('#6366f1');
                $table->timestamps();
                $table->unique(['workspace_id', 'name']);
            });
        }
        if (! Schema::hasTable('inbox_label_conversation')) {
            Schema::create('inbox_label_conversation', function (Blueprint $table) {
                $table->unsignedBigInteger('label_id');
                $table->unsignedBigInteger('conversation_id');
                $table->primary(['label_id', 'conversation_id']);
            });
        }

        $labelDefinitions = [
            'Waybill Tracking' => '#0d9488',
            'Express Freight' => '#2563eb',
            'Payment Pending' => '#d97706',
            'Customs Clearance' => '#7c3aed',
            'VIP Shipper' => '#e11d48',
        ];

        $labels = [];
        foreach ($labelDefinitions as $name => $color) {
            $labels[$name] = InboxLabel::updateOrCreate(
                ['workspace_id' => $wid, 'name' => $name],
                ['color' => $color]
            );
        }

        $contacts = Contact::where('workspace_id', $wid)->orderBy('id')->take(300)->get();
        if ($contacts->isEmpty()) {
            return;
        }

        // Clean existing conversations to allow clean re-seed
        $existingConvIds = Conversation::where('workspace_id', $wid)->pluck('id')->toArray();
        if (! empty($existingConvIds)) {
            DB::table('inbox_label_conversation')->whereIn('conversation_id', $existingConvIds)->delete();
            Message::whereIn('conversation_id', $existingConvIds)->delete();
            Conversation::where('workspace_id', $wid)->delete();
        }

        $now = Carbon::now();

        // 1. Seed 10 realistic OPEN conversation threads for screenshot readiness
        $primaryDialogs = [
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 803 241 8920') ?? $contacts->get(0),
                'status' => 'open',
                'unread_count' => 0,
                'labels' => ['Waybill Tracking', 'Express Freight'],
                'minutes_ago' => 8,
                'messages' => [
                    ['in', 'Hello, what is the status of waybill #FTF-84920?'],
                    ['out', 'Your shipment arrived at Lagos Central Hub and is scheduled for dispatch today at 2:00 PM.'],
                ],
            ],
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 803 555 0192') ?? $contacts->get(1),
                'status' => 'open',
                'unread_count' => 1,
                'labels' => ['Express Freight', 'Payment Pending'],
                'minutes_ago' => 22,
                'messages' => [
                    ['in', 'Hello, how much does it cost to send a 15kg commercial carton to London Heathrow?'],
                    ['out', 'Hi Babatunde! ✈️ For a 15kg commercial parcel to London, our express air freight rate is ₦18,500 per 5kg block (Total: ₦55,500 inclusive of customs waybill). Would you like me to generate your instant payment booking link?'],
                    ['in', 'Yes please send the payment link.'],
                    ['out', 'Here is your direct 1-click in-chat booking and payment link: https://botifyai.cloud/buy/ftf-logistics/order-checkout/WB-10028405. Pay via Paystack or Flutterwave.'],
                ],
            ],
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 814 998 8776') ?? $contacts->get(2),
                'status' => 'open',
                'unread_count' => 0,
                'labels' => ['VIP Shipper', 'Customs Clearance'],
                'minutes_ago' => 45,
                'messages' => [
                    ['in', 'Good day, please confirm pickup schedule for our international diplomatic cargo in Maitama.'],
                    ['out', 'Good day Chioma! Our Abuja logistics team is scheduled for pickup at 2:00 PM today. A dedicated waybill supervisor has been assigned (Ref: #FTF-DIP-9901).'],
                ],
            ],
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 802 345 6702') ?? $contacts->get(4),
                'status' => 'open',
                'unread_count' => 1,
                'labels' => ['Waybill Tracking'],
                'minutes_ago' => 70,
                'messages' => [
                    ['out', 'Hi Aisha! 👋 We noticed you started booking a freight shipment from Kano to Lagos but did not complete the checkout. Do you need any assistance with cargo dimensions or weight?'],
                    ['in', 'Hi, I was checking if there is any discount for multi-carton textile shipments.'],
                    ['out', 'I have applied your 5% seasonal freight discount! You can complete your Kano to Lagos dispatch checkout here: https://botifyai.cloud/cart/recover/FTF-88219'],
                ],
            ],
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 806 712 3456') ?? $contacts->get(7),
                'status' => 'open',
                'unread_count' => 0,
                'labels' => ['Waybill Tracking'],
                'minutes_ago' => 95,
                'messages' => [
                    ['in', 'Please confirm departure time for the Kaduna rail cargo.'],
                    ['out', 'Waybill #FTF-KAD-5510 is cleared for transit on the Abuja-Kaduna secure rail express. Scheduled departure: 11:30 AM today.'],
                ],
            ],
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 802 345 6701') ?? $contacts->get(3),
                'status' => 'open',
                'unread_count' => 0,
                'labels' => ['Express Freight', 'Customs Clearance'],
                'minutes_ago' => 125,
                'messages' => [
                    ['in', 'Has the customs documentation for container #FTF-CON-4402 been approved at Apapa Port?'],
                    ['out', 'Customs duty assessment for your UK air cargo import is ₦14,200. Paid automatically via Paystack escrow. Inspection clearance form WB-APAPA-092 is attached.'],
                ],
            ],
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 902 345 6789') ?? $contacts->get(10),
                'status' => 'open',
                'unread_count' => 0,
                'labels' => ['VIP Shipper'],
                'minutes_ago' => 180,
                'messages' => [
                    ['in', 'Could you send over the weekly dispatch manifest for our corporate account?'],
                    ['out', 'Your weekly consolidated freight dispatch summary (42 waybills) has been emailed to finance@daviesventures.ng. All tracking links are live.'],
                ],
            ],
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 818 234 5678') ?? $contacts->get(11),
                'status' => 'open',
                'unread_count' => 1,
                'labels' => ['Express Freight'],
                'minutes_ago' => 240,
                'messages' => [
                    ['in', 'Do you have temperature-controlled reefers for Port Harcourt transit?'],
                    ['out', 'Yes, we operate certified 20ft & 40ft refrigerated reefers maintained at 2°C–8°C with real-time IoT temperature logging. Port Harcourt cold-chain container delivery confirmed for Thursday 9:00 AM.'],
                ],
            ],
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 809 123 4567') ?? $contacts->get(12),
                'status' => 'open',
                'unread_count' => 0,
                'labels' => ['Waybill Tracking'],
                'minutes_ago' => 310,
                'messages' => [
                    ['in', 'Tracking WB #FTF-IB-3091 please.'],
                    ['out', 'Waybill #FTF-IB-3091 successfully handed over to recipient at Ring Road, Ibadan. Signed POD by: S. Adeleke.'],
                ],
            ],
            [
                'contact' => $contacts->firstWhere('phone_e164', '+234 802 345 6704') ?? $contacts->get(6),
                'status' => 'open',
                'unread_count' => 0,
                'labels' => ['Express Freight'],
                'minutes_ago' => 380,
                'messages' => [
                    ['in', 'Flight departure confirmation for the London consignment please.'],
                    ['out', 'London Stansted air cargo flight FTF-BA07 departed on time. Estimated MMIA arrival: tomorrow 05:15 AM.'],
                ],
            ],
        ];

        $allConvIds = [];

        foreach ($primaryDialogs as $d) {
            $lastMsgTime = $now->copy()->subMinutes($d['minutes_ago']);
            $numMsgs = count($d['messages']);
            $firstMsgTime = $lastMsgTime->copy()->subMinutes(($numMsgs - 1) * 3);

            $convo = Conversation::create([
                'workspace_id' => $wid,
                'channel_account_id' => $channel->id,
                'contact_id' => $d['contact']->id,
                'status' => $d['status'],
                'assigned_to' => 'bot',
                'unread_count' => $d['unread_count'],
                'last_message_at' => $lastMsgTime,
                'last_inbound_at' => $lastMsgTime,
                'created_at' => $firstMsgTime,
                'updated_at' => $lastMsgTime,
            ]);
            $allConvIds[] = $convo->id;

            // Attach labels
            $labelIds = [];
            foreach ($d['labels'] as $labelName) {
                if (isset($labels[$labelName])) {
                    $labelIds[] = $labels[$labelName]->id;
                }
            }
            if (! empty($labelIds)) {
                $convo->labels()->sync($labelIds);
            }

            foreach ($d['messages'] as $mIdx => $m) {
                $msgTime = $firstMsgTime->copy()->addMinutes($mIdx * 3);
                Message::create([
                    'conversation_id' => $convo->id,
                    'direction' => $m[0],
                    'channel' => 'whatsapp',
                    'type' => 'text',
                    'body' => $m[1],
                    'status' => 'delivered',
                    'sent_by' => $m[0] === 'out' ? 'bot' : 'human',
                    'sent_at' => $msgTime,
                    'created_at' => $msgTime,
                    'updated_at' => $msgTime,
                ]);
            }
        }

        // 2. Seed remaining 290 conversations to reach 300 total (matches "Showing 1 to 10 of 300 results" in PDF Page 2)
        for ($cIdx = 11; $cIdx <= 300; $cIdx++) {
            $cContact = $contacts->get($cIdx - 1) ?? $contacts->first();
            $daysAgo = rand(1, 28);
            $createdAt = $now->copy()->subDays($daysAgo)->subMinutes(rand(0, 1400));
            $lastMsgAt = $createdAt->copy()->addMinutes(rand(5, 45));

            $convo = Conversation::create([
                'workspace_id' => $wid,
                'channel_account_id' => $channel->id,
                'contact_id' => $cContact->id,
                'status' => 'resolved',
                'assigned_to' => 'bot',
                'unread_count' => 0,
                'last_message_at' => $lastMsgAt,
                'last_inbound_at' => $createdAt,
                'created_at' => $createdAt,
                'updated_at' => $lastMsgAt,
            ]);
            $allConvIds[] = $convo->id;
        }

        // 3. Batch seed messages to achieve high-throughput telemetry:
        // Total messages: 35,657 (matching PDF Meta API campaign dispatches and chat volume)
        // 18,500 messages out, 17,157 messages in
        $existingMsgCount = Message::whereIn('conversation_id', $allConvIds)->count();
        $totalOut = 18500;
        $totalIn = 17157;
        $totalMsg = ($totalOut + $totalIn) - $existingMsgCount;

        $msgBatch = [];
        $batchSize = 2000;
        $sampleOutReplies = [
            'Hello! Your waybill tracking details have been verified.',
            'Here is your express freight quotation invoice.',
            'Your parcel has cleared airport customs and is out for delivery.',
            'Thanks for choosing FTF Digital Solutions Limited.',
            'Your in-chat checkout payment link is active: https://botifyai.cloud/buy/ftf-logistics',
        ];
        $sampleInReplies = [
            'Hi, please give me the status of my waybill.',
            'How much is 10kg shipping to London?',
            'Payment has been sent via Paystack.',
            'Thank you for the quick update!',
            'Please send the pickup agent contact number.',
        ];

        $bgConvIds = array_slice($allConvIds, 10);
        for ($mIdx = 1; $mIdx <= $totalMsg; $mIdx++) {
            $isOut = ($mIdx <= ($totalOut - 20));
            $convId = $bgConvIds[($mIdx - 1) % count($bgConvIds)];
            $daysAgo = rand(0, 28);
            $createdAt = $now->copy()->subDays($daysAgo)->subMinutes(rand(0, 1400));

            $msgBatch[] = [
                'conversation_id' => $convId,
                'direction' => $isOut ? 'out' : 'in',
                'channel' => 'whatsapp',
                'type' => 'text',
                'body' => $isOut ? Arr::random($sampleOutReplies) : Arr::random($sampleInReplies),
                'status' => 'delivered',
                'sent_by' => $isOut ? 'bot' : 'human',
                'sent_at' => $createdAt,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            if (count($msgBatch) >= $batchSize) {
                DB::table('messages')->insert($msgBatch);
                $msgBatch = [];
            }
        }
        if (! empty($msgBatch)) {
            DB::table('messages')->insert($msgBatch);
        }
    }

    private function seedEcommerceStoreAndProducts(): void
    {
        $wid = $this->workspace->id;

        // 1. Linked Settlement Bank Account (MySQL schema: workspace_id, bank_name, bank_code, account_number, account_name, recipient_code, currency, is_default)
        $bankAccount = MerchantBankAccount::updateOrCreate(
            [
                'workspace_id' => $wid,
                'account_number' => '1018400021',
            ],
            [
                'bank_name' => 'Zenith Bank PLC',
                'bank_code' => '057',
                'account_name' => 'FTF DIGITAL SOLUTIONS LIMITED',
                'recipient_code' => 'RCP_ftf_zenith_verified',
                'currency' => 'NGN',
                'is_default' => true,
            ]
        );

        // 2. Merchant Wallet & Ledger Overview (₦18,400,000.00 Gross Commercial Volume)
        $wallet = MerchantWallet::updateOrCreate(
            [
                'workspace_id' => $wid,
                'currency' => 'NGN',
            ],
            [
                'available_balance_cents' => 1840000000, // ₦18,400,000.00
                'pending_balance_cents' => 0,
                'total_withdrawn_cents' => 0,
                'total_earned_cents' => 1840000000,
                'is_frozen' => false,
            ]
        );

        // 3. FTF Logistics Digital Storefront (Native Platform)
        $this->store = EcommerceStore::updateOrCreate(
            ['workspace_id' => $wid, 'platform' => 'native'],
            [
                'name' => 'FTF Digital Solutions Limited',
                'domain' => 'native',
                'slug' => 'ftf-logistics',
                'currency' => 'NGN',
                'status' => 'connected',
                'support_email' => 'ayo@ftfdigitalsolutions.com',
                'support_phone' => '+234 813 366 2232',
                'brand_color' => '#0D9488',
                'is_published' => true,
                'bank_account_id' => $bankAccount->id,
                'marketing_pixels' => [
                    'meta_pixel_id' => '104928572910482',
                    'meta_capi_token' => 'EAAG_FTF_CAPI_ACTIVE',
                    'ga4_measurement_id' => 'G-FTFLOGISTICS',
                    'tiktok_pixel_id' => 'TT_FTF_CARGO',
                    'gtm_container_id' => 'GTM-FTF2024',
                    'clarity_project_id' => 'clarity_ftf_live',
                ],
                'published_at' => Carbon::now()->subMonths(10),
            ]
        );

        // 4. Products / Waybill & Service Catalog (5 active items)
        $products = [
            [
                'name' => 'Waybill Booking & Freight Service',
                'price' => 40000.00,
                'product_type' => 'digital',
                'description' => 'Complete interstate and international express waybill booking and customs clearance package.',
            ],
            [
                'name' => 'UK Air Express Cargo (3-5 Days)',
                'price' => 55500.00,
                'product_type' => 'digital',
                'description' => 'Priority UK door-to-airport freight service with automated GPS tracking.',
            ],
            [
                'name' => 'North America Priority Cargo (5-7 Days)',
                'price' => 75000.00,
                'product_type' => 'digital',
                'description' => 'Direct courier route from Lagos to US/Canada commercial hubs.',
            ],
            [
                'name' => 'Interstate Doorstep Courier Express',
                'price' => 18500.00,
                'product_type' => 'digital',
                'description' => 'Next-day nationwide interstate transit across 36 Nigerian states.',
            ],
            [
                'name' => 'Customs Duty Clearance & Port Handling',
                'price' => 25000.00,
                'product_type' => 'digital',
                'description' => 'Airport MMIA customs duty paperwork and cargo release service.',
            ],
        ];

        foreach ($products as $p) {
            EcommerceProduct::updateOrCreate(
                ['store_id' => $this->store->id, 'name' => $p['name']],
                [
                    'workspace_id' => $wid,
                    'platform' => 'native',
                    'price' => $p['price'],
                    'currency' => 'NGN',
                    'product_type' => $p['product_type'],
                    'description' => $p['description'],
                    'is_published' => true,
                ]
            );
        }
    }

    private function seedEcommerceOrdersAndInvoices(): void
    {
        $wid = $this->workspace->id;
        $storeId = $this->store->id;

        $totalOrdersCount = 500;
        $paidOrdersCount = 470; // exactly 94.0% payment completion rate
        $targetRevenue = 18400000.00; // exactly ₦18.4 Million gross revenue

        // Clean existing orders to make seeder idempotent
        EcommerceOrder::where('store_id', $storeId)->delete();

        // Exact invoice amounts directly from Page 2 screenshot:
        $screenshotInvoices = [
            ['number' => '10028401', 'customer' => 'Ngozi Okonjo', 'amount' => 40000.00, 'status' => 'paid', 'hours_ago' => 2],
            ['number' => '10028402', 'customer' => 'Aisha Bello', 'amount' => 24500.00, 'status' => 'pending', 'hours_ago' => 5],
            ['number' => '10028403', 'customer' => 'Tunde Bakare', 'amount' => 32000.00, 'status' => 'paid', 'hours_ago' => 8],
            ['number' => '10028404', 'customer' => 'Chiamaka Nze', 'amount' => 12000.00, 'status' => 'overdue', 'hours_ago' => 12],
            ['number' => '10028405', 'customer' => 'Ibrahim Musa', 'amount' => 18500.00, 'status' => 'paid', 'hours_ago' => 18],
            ['number' => '10028406', 'customer' => 'Amaka Obi', 'amount' => 58000.00, 'status' => 'pending', 'hours_ago' => 24],
            ['number' => '10028407', 'customer' => 'Yusuf Garba', 'amount' => 27800.00, 'status' => 'paid', 'hours_ago' => 30],
            ['number' => '10028408', 'customer' => 'Bolaji Davies', 'amount' => 9000.00, 'status' => 'overdue', 'hours_ago' => 36],
            ['number' => '10028409', 'customer' => 'Chioma Eze', 'amount' => 65000.00, 'status' => 'pending', 'hours_ago' => 42],
            ['number' => '10028410', 'customer' => 'Fatima Dangote', 'amount' => 15000.00, 'status' => 'paid', 'hours_ago' => 48],
        ];

        $screenshotPaidSum = 0;
        $screenshotPaidCount = 0;
        foreach ($screenshotInvoices as $inv) {
            if ($inv['status'] === 'paid') {
                $screenshotPaidSum += $inv['amount'];
                $screenshotPaidCount++;
            }
        }

        // Remaining paid revenue to distribute across remaining paid orders
        $remainingPaidCount = $paidOrdersCount - $screenshotPaidCount; // 470 - 5 = 465
        $remainingRevenue = $targetRevenue - $screenshotPaidSum;
        $avgRemainingPaid = round($remainingRevenue / $remainingPaidCount, 2);

        // Pre-create the 10 screenshot invoices with the most recent timestamps so they appear on Page 1
        $now = Carbon::now();
        foreach ($screenshotInvoices as $inv) {
            $isPaid = ($inv['status'] === 'paid');
            $placedAt = $now->copy()->subHours($inv['hours_ago']);

            $order = EcommerceOrder::create([
                'workspace_id' => $wid,
                'store_id' => $storeId,
                'external_order_id' => 'ftf_inv_' . $inv['number'],
                'uuid' => (string) Str::uuid(),
                'platform' => 'native',
                'number' => '#' . $inv['number'],
                'customer_name' => $inv['customer'],
                'customer_email' => Str::slug($inv['customer']) . '@ftfclient.com',
                'customer_phone' => '+23480' . rand(10000000, 99999999),
                'status' => $isPaid ? 'completed' : 'open',
                'financial_status' => $inv['status'],
                'payment_status' => $inv['status'],
                'fulfillment_status' => $isPaid ? 'fulfilled' : 'unfulfilled',
                'currency' => 'NGN',
                'total' => $inv['amount'],
                'line_items' => [
                    [
                        'name' => 'Waybill Booking & Freight Service',
                        'sku' => 'FTF-LOGISTICS-SVC',
                        'quantity' => 1,
                        'price' => $inv['amount'],
                    ],
                ],
                'tracking_number' => 'WB-' . $inv['number'],
                'tracking_url' => 'https://botifyai.cloud/buy/ftf-logistics/status/WB-' . $inv['number'],
                'placed_at' => $placedAt,
                'paid_at' => $isPaid ? $placedAt->copy()->addMinutes(4) : null,
                'payment_gateway' => 'paystack',
                'payment_reference' => 'pstk_ref_' . $inv['number'],
            ]);
            $this->bk($order, $placedAt);
        }

        // Bulk insert the remaining 490 orders to achieve exactly ₦18,400,000.00 across 470 paid orders
        $runningPaidSum = $screenshotPaidSum;
        $targetLoopPaidEnd = 10 + $remainingPaidCount; // 10 + 465 = 475

        $orderBatch = [];
        for ($idx = 11; $idx <= $totalOrdersCount; $idx++) {
            $orderNum = '1002' . str_pad((string) (8400 + $idx), 4, '0', STR_PAD_LEFT);
            $isPaid = ($idx <= $targetLoopPaidEnd); // exactly 465 loop orders + 5 screenshot orders = 470 paid orders (94%)
            $daysAgo = rand(2, 28);
            $placedAt = $now->copy()->subDays($daysAgo)->setTime(rand(8, 20), rand(0, 59));

            if ($isPaid) {
                if ($idx === $targetLoopPaidEnd) {
                    $amount = round($targetRevenue - $runningPaidSum, 2);
                } else {
                    $jitter = rand(-12000, 15000);
                    $amount = max(8500.00, round($avgRemainingPaid + $jitter, 2));
                    $runningPaidSum += $amount;
                }
            } else {
                $amount = Arr::random([12000.00, 18500.00, 24500.00, 32000.00, 58000.00]);
            }

            $custName = fake()->name();
            $status = $isPaid ? 'paid' : ($idx % 2 === 0 ? 'pending' : 'overdue');

            $orderBatch[] = [
                'workspace_id' => $wid,
                'store_id' => $storeId,
                'external_order_id' => 'ftf_inv_' . $orderNum,
                'uuid' => (string) Str::uuid(),
                'platform' => 'native',
                'number' => '#' . $orderNum,
                'customer_name' => $custName,
                'customer_email' => fake()->unique()->safeEmail(),
                'customer_phone' => '+23480' . rand(10000000, 99999999),
                'status' => $isPaid ? 'completed' : 'open',
                'financial_status' => $status,
                'payment_status' => $status,
                'fulfillment_status' => $isPaid ? 'fulfilled' : 'unfulfilled',
                'currency' => 'NGN',
                'total' => $amount,
                'line_items' => json_encode([
                    [
                        'name' => 'Waybill Booking & Freight Transit',
                        'sku' => 'FTF-LOGISTICS-SVC',
                        'quantity' => 1,
                        'price' => $amount,
                    ],
                ]),
                'tracking_number' => 'WB-' . $orderNum,
                'tracking_url' => 'https://botifyai.cloud/buy/ftf-logistics/status/WB-' . $orderNum,
                'placed_at' => $placedAt,
                'paid_at' => $isPaid ? $placedAt->copy()->addMinutes(rand(2, 10)) : null,
                'payment_gateway' => 'paystack',
                'payment_reference' => 'pstk_ref_' . $orderNum,
                'created_at' => $placedAt,
                'updated_at' => $placedAt,
            ];

            if (count($orderBatch) >= 100) {
                DB::table('ecommerce_orders')->insert($orderBatch);
                $orderBatch = [];
            }
        }

        if (! empty($orderBatch)) {
            DB::table('ecommerce_orders')->insert($orderBatch);
        }

        // Seed sample merchant ledger entries for wallet overview
        $wallet = MerchantWallet::where('workspace_id', $wid)->where('currency', 'NGN')->first();
        if ($wallet) {
            MerchantLedgerEntry::where('wallet_id', $wallet->id)->delete();
            $runningCents = 0;
            $ledgerBatch = [];
            foreach ($screenshotInvoices as $inv) {
                if ($inv['status'] === 'paid') {
                    $amtCents = (int) ($inv['amount'] * 100);
                    $feeCents = (int) ($amtCents * 0.015);
                    $netCents = $amtCents - $feeCents;
                    $runningCents += $netCents;
                    $placedAt = $now->copy()->subHours($inv['hours_ago']);

                    $ledgerBatch[] = [
                        'workspace_id' => $wid,
                        'wallet_id' => $wallet->id,
                        'entry_type' => 'sale_credit',
                        'amount_cents' => $amtCents,
                        'fee_cents' => $feeCents,
                        'net_amount_cents' => $netCents,
                        'running_balance_cents' => $runningCents,
                        'currency' => 'NGN',
                        'reference_type' => 'order',
                        'reference_id' => null,
                        'description' => 'Waybill Payment #' . $inv['number'] . ' - ' . $inv['customer'],
                        'created_at' => $placedAt,
                        'updated_at' => $placedAt,
                    ];
                }
            }
            if (! empty($ledgerBatch)) {
                DB::table('merchant_ledger_entries')->insert($ledgerBatch);
            }
        }
    }

    private function seedCartRecoveryEngine(): void
    {
        $wid = $this->workspace->id;
        $storeId = $this->store->id;

        // Clean existing carts
        EcommerceCart::where('store_id', $storeId)->delete();

        // 100 carts, exactly 35 recovered = verified 35% cart recovery rate
        $contacts = Contact::where('workspace_id', $wid)->take(100)->get();
        $now = Carbon::now();
        $cartBatch = [];

        for ($i = 1; $i <= 100; $i++) {
            $isRecovered = ($i <= 35); // 35 recovered = 35% checkout recovery rate
            $daysAgo = rand(1, 28);
            $abandonedAt = $now->copy()->subDays($daysAgo)->setTime(rand(9, 21), rand(0, 59));
            $recoveredAt = $isRecovered ? $abandonedAt->copy()->addMinutes(rand(12, 140)) : null;
            $cId = $contacts->skip($i - 1)->first()?->id;

            $cartBatch[] = [
                'workspace_id' => $wid,
                'store_id' => $storeId,
                'contact_id' => $cId,
                'external_id' => 'ftf_cart_' . str_pad((string) $i, 5, '0', STR_PAD_LEFT),
                'total' => Arr::random([24500.00, 32000.00, 40000.00, 58000.00, 75000.00]),
                'currency' => 'NGN',
                'line_items' => json_encode([
                    [
                        'name' => 'Waybill Booking & Freight Service',
                        'quantity' => 1,
                        'price' => 40000.00,
                    ],
                ]),
                'recovery_url' => 'https://botifyai.cloud/buy/ftf-logistics/checkout/recover?cart=ftf_cart_' . $i,
                'abandoned_at' => $abandonedAt,
                'recovery_triggered_at' => $abandonedAt->copy()->addMinutes(5),
                'recovered_at' => $recoveredAt,
                'created_at' => $abandonedAt,
                'updated_at' => $recoveredAt ?? $abandonedAt,
            ];
        }

        DB::table('ecommerce_carts')->insert($cartBatch);
    }

    private function seedBroadcastingAndMetaCampaign(): void
    {
        $wid = $this->workspace->id;

        $campaignData = [
            'channel' => 'whatsapp',
            'whatsapp_phone_number_id' => $this->waPhoneNumberId,
            'audience_type' => 'segment',
            'audience_ref' => 'Incomplete Checkouts & Active Shippers',
            'payload_json' => [
                'body' => 'Hello {{contact.first_name}}, your shipping waybill is ready for dispatch. Complete your booking with 1-click payment.',
            ],
            'template_ref' => [
                'name' => 'waybill_dispatch_recovery',
                'language' => 'en',
            ],
            'schedule_at' => Carbon::now()->subDays(10)->setTime(10, 0),
            'timezone' => 'Africa/Lagos',
            'status' => 'completed',
            'created_by' => $this->user->id,
            'totals_json' => [
                'total' => 35657,
                'queued' => 0,
                'sent' => 35657,
                'delivered' => 35336, // 99.2% delivered
                'read' => 29952,      // 84.0% open/read rate
                'failed' => 321,      // 0.9% failed (321 provider rejection)
                'clicked' => 12480,   // 35.0% checkout recovery rate
                'unsubscribed' => 45,
            ],
        ];

        if (Schema::hasColumn('campaigns', 'campaign_type')) {
            $campaignData['campaign_type'] = 'broadcast';
        }

        $campaign = Campaign::updateOrCreate(
            ['workspace_id' => $wid, 'name' => 'In-Chat Waybill Dispatch & Checkout Recovery'],
            $campaignData
        );

        // Usage meters for the current month period
        $period = (int) Carbon::now()->format('Ym');
        $meters = [
            'whatsapp_messages' => 35657,
            'sms_sent' => 4500,
            'emails_sent' => 12800,
            'ai_tokens' => 2450000,
            'campaigns_sent' => 24,
            'lead_credits' => 14200,
        ];
        foreach ($meters as $metric => $val) {
            UsageMeter::updateOrCreate(
                ['workspace_id' => $wid, 'metric' => $metric, 'period' => $period],
                ['value' => $val]
            );
        }

        // Seed 500 recipients to back the campaign with individual delivery rows
        CampaignRecipient::where('campaign_id', $campaign->id)->delete();

        $contacts = Contact::where('workspace_id', $wid)->take(500)->get();
        if ($contacts->isNotEmpty()) {
            $recipBatch = [];
            $totalRecipients = min(500, $contacts->count());

            for ($r = 1; $r <= $totalRecipients; $r++) {
                $isFailed = ($r <= 4); // ~0.8% failed
                $isRead = (! $isFailed && $r <= 424); // 84.0% open rate
                $isDelivered = (! $isFailed); // 99.2% delivery rate

                $status = $isFailed ? 'failed' : ($isRead ? 'read' : 'delivered');
                $sentAt = Carbon::now()->subDays(10)->setTime(10, rand(1, 55));
                $deliveredAt = $isDelivered ? $sentAt->copy()->addSeconds(rand(1, 5)) : null;
                $readAt = $isRead ? $deliveredAt->copy()->addMinutes(rand(2, 45)) : null;
                $clickedAt = ($isRead && $r <= 175) ? $readAt->copy()->addMinutes(rand(1, 10)) : null; // 35% click/recovery

                $recipBatch[] = [
                    'campaign_id' => $campaign->id,
                    'contact_id' => $contacts[$r - 1]->id,
                    'status' => $status,
                    'provider_message_id' => 'wamid.HBgL' . Str::random(28),
                    'sent_at' => $sentAt,
                    'delivered_at' => $deliveredAt,
                    'read_at' => $readAt,
                    'clicked_at' => $clickedAt,
                    'failed_reason' => $isFailed ? 'Meta API temporary provider rejection (321 denied)' : null,
                    'created_at' => $sentAt,
                    'updated_at' => $clickedAt ?? $readAt ?? $deliveredAt ?? $sentAt,
                ];
            }

            DB::table('campaign_recipients')->insert($recipBatch);
        }
    }

    private function seedAdminTelemetry(): void
    {
        $plan = Plan::where('slug', 'enterprise')->first() ?? Plan::first();
        if (! $plan) {
            return;
        }

        // Active Subscription for Ayo so Admin Dashboard computeMrr() returns the $52,480.00 USD MRR
        $sub = Subscription::updateOrCreate(
            ['user_id' => $this->user->id],
            [
                'plan_id' => $plan->id,
                'status' => 'active',
                'billing_cycle' => 'monthly',
                'starts_at' => Carbon::now()->subMonths(10),
                'renews_at' => Carbon::now()->addMonths(2),
                'gateway' => 'stripe',
                'gateway_subscription_id' => 'sub_ftf_enterprise_live',
            ]
        );

        // PaymentTransaction for current period so Admin Dashboard revenue reflects the monthly volume
        PaymentTransaction::updateOrCreate(
            ['gateway_transaction_id' => 'txn_ftf_enterprise_live_01'],
            [
                'subscription_id' => $sub->id,
                'user_id' => $this->user->id,
                'gateway' => 'stripe',
                'amount_cents' => 5248000, // $52,480.00 USD MRR
                'currency_code' => 'USD',
                'currency' => 'USD',
                'status' => 'succeeded',
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ]
        );
    }
}
