<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\ClientSubscription;
use App\Models\Plan;
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
use App\Modules\Shared\Models\ChannelAccount;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\Conversation;
use App\Modules\Shared\Models\Message;
use App\Modules\Whatsapp\Models\WhatsappAutoReply;
use App\Modules\Whatsapp\Models\WhatsappBusinessAccount;
use App\Modules\Whatsapp\Models\WhatsappPhoneNumber;
use App\Services\ClientWorkspaceService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
                'created_at' => Carbon::parse('2024-01-15 08:00:00'),
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
                'email_verified_at' => Carbon::parse('2024-01-15 08:30:00'),
                'locale' => 'en',
                'display_currency' => 'NGN',
                'timezone' => 'Africa/Lagos',
                'created_at' => Carbon::parse('2024-01-15 08:00:00'),
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

        if (! $this->user->workspace_id) {
            $this->user->forceFill(['workspace_id' => $this->workspace->id])->saveQuietly();
        }

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
                    'starts_at' => Carbon::parse('2024-01-15 09:00:00'),
                    'ends_at' => Carbon::now()->addYear(),
                    'created_at' => Carbon::parse('2024-01-15 09:00:00'),
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
                'created_at' => Carbon::parse('2024-01-20 10:00:00'),
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
                'created_at' => Carbon::parse('2024-01-20 10:00:00'),
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
                'created_at' => Carbon::parse('2024-01-20 10:00:00'),
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
                'created_at' => Carbon::parse('2024-01-20 10:00:00'),
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
                'created_at' => Carbon::parse('2024-01-20 10:00:00'),
                'updated_at' => Carbon::now(),
            ]
        );

        // Automated Instant Quotation & Package Tracking Auto-Replies
        WhatsappAutoReply::updateOrCreate(
            ['workspace_id' => $wid, 'keyword' => 'track'],
            [
                'name' => 'Waybill & Package Status Tracking',
                'match_type' => 'contains',
                'reply_text' => "📦 *FTF Logistics Package Tracker*\nPlease reply with your 8-digit Waybill Number (e.g. WB-100284) to get instant live GPS dispatch status, carrier flight details, and scheduled delivery window.",
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
                'last_indexed_at' => Carbon::now()->subDays(10),
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

        // Log AI runs demonstrating 70%+ inquiry latency reduction and 98.4% automated inquiry resolution
        if (AiRun::where('chatbot_id', $bot->id)->count() === 0) {
            for ($i = 0; $i < 64; $i++) {
                $prompt = rand(240, 780);
                $comp = rand(60, 290);
                $isError = ($i === 13); // 1 error in 64 runs = 98.4% resolution success rate
                $run = AiRun::create([
                    'chatbot_id' => $bot->id,
                    'prompt_tokens' => $prompt,
                    'completion_tokens' => $comp,
                    'cost_cents' => (int) ceil(($prompt * 0.000015 + $comp * 0.00006) * 100),
                    'latency_ms' => rand(380, 720), // sub-second latency (reduced from hours to seconds)
                    'model' => 'gpt-4o-mini',
                    'status' => $isError ? 'error' : 'ok',
                ]);
                $this->bk($run, Carbon::now()->subDays(rand(0, 28))->setTime(rand(7, 22), rand(0, 59)));
            }
        }
    }

    private function seedAutomations(): void
    {
        $wid = $this->workspace->id;

        $automations = [
            [
                'name' => 'WhatsApp Instant Package & Waybill Tracking',
                'trigger_type' => 'message_received',
                'status' => 'active',
            ],
            [
                'name' => 'Automated In-Chat Instant Quotation & Rate Calculator',
                'trigger_type' => 'inquiry_received',
                'status' => 'active',
            ],
            [
                'name' => 'Meta API Abandoned Cart Recovery Sequence',
                'trigger_type' => 'cart_abandoned',
                'status' => 'active',
            ],
            [
                'name' => 'Event-Driven Omnichannel Lead Routing (FastAPI / Redis)',
                'trigger_type' => 'lead_qualified',
                'status' => 'active',
            ],
        ];

        foreach ($automations as $auto) {
            $record = Automation::updateOrCreate(
                ['workspace_id' => $wid, 'name' => $auto['name']],
                [
                    'trigger_type' => $auto['trigger_type'],
                    'status' => $auto['status'],
                    'definition_json' => ['nodes' => [], 'edges' => []],
                    'created_by' => $this->user->id,
                ]
            );

            if (AutomationRun::where('automation_id', $record->id)->count() === 0) {
                for ($r = 0; $r < 12; $r++) {
                    $run = AutomationRun::create([
                        'automation_id' => $record->id,
                        'workspace_id' => $wid,
                        'status' => 'success',
                        'started_at' => Carbon::now()->subDays(rand(0, 20))->setTime(rand(8, 20), rand(0, 59)),
                        'completed_at' => Carbon::now()->subDays(rand(0, 20))->setTime(rand(8, 20), rand(0, 59))->addSeconds(rand(1, 4)),
                    ]);
                    $this->bk($run, $run->started_at);
                }
            }
        }
    }

    private function seedContacts(): void
    {
        $wid = $this->workspace->id;

        // Ensure at least 500 distinct contacts exist in the workspace
        // This also supports the unique constraint on campaign_recipients (1 recipient per contact)
        $existingCount = Contact::where('workspace_id', $wid)->count();
        if ($existingCount >= 500) {
            return;
        }

        $seedContactsList = [
            ['first_name' => 'Emeka', 'last_name' => 'Okonkwo', 'email' => 'emeka.o@meridianlogistics.ng', 'phone' => '+2348031122334', 'city' => 'Lagos'],
            ['first_name' => 'Babatunde', 'last_name' => 'Adeyemi', 'email' => 'tunde.adeyemi@crossborder.co.uk', 'phone' => '+447911123456', 'city' => 'London'],
            ['first_name' => 'Chioma', 'last_name' => 'Eze', 'email' => 'chioma.eze@africantradehub.com', 'phone' => '+2348149988776', 'city' => 'Abuja'],
            ['first_name' => 'Michael', 'last_name' => 'Sterling', 'email' => 'm.sterling@sterlingcargo.ca', 'phone' => '+14165550192', 'city' => 'Toronto'],
            ['first_name' => 'Fatima', 'last_name' => 'Bello', 'email' => 'fatima.bello@kandocourier.ng', 'phone' => '+2348092233445', 'city' => 'Kano'],
            ['first_name' => 'David', 'last_name' => 'Adeleke', 'email' => 'd.adeleke@apexshipping.com', 'phone' => '+2347012345678', 'city' => 'Port Harcourt'],
            ['first_name' => 'Grace', 'last_name' => 'Nnamdi', 'email' => 'grace.n@stemmanuelhospital.com.ng', 'phone' => '+2348133662240', 'city' => 'Abuja'],
            ['first_name' => 'Agboola', 'last_name' => 'Rotimi', 'email' => 'agboola.r@lifebridgeclinic.com', 'phone' => '+2348056572211', 'city' => 'Lagos'],
            ['first_name' => 'Tariq', 'last_name' => 'Al-Mansoor', 'email' => 'tariq@gulfconnectfreight.ae', 'phone' => '+971501234567', 'city' => 'Dubai'],
            ['first_name' => 'Kelechi', 'last_name' => 'Iheanacho', 'email' => 'kelechi@uknigeriaship.com', 'phone' => '+447700900123', 'city' => 'Manchester'],
        ];

        foreach ($seedContactsList as $sc) {
            $contact = Contact::updateOrCreate(
                ['workspace_id' => $wid, 'phone_e164' => $sc['phone']],
                [
                    'first_name' => $sc['first_name'],
                    'last_name' => $sc['last_name'],
                    'email' => $sc['email'],
                    'country' => str_starts_with($sc['phone'], '+44') ? 'GB' : (str_starts_with($sc['phone'], '+1') ? 'CA' : 'NG'),
                    'city' => $sc['city'],
                    'opt_in_whatsapp' => true,
                    'opt_in_email' => true,
                    'source' => 'whatsapp',
                ]
            );
            $this->bk($contact, Carbon::now()->subDays(rand(10, 180)));
        }

        $current = Contact::where('workspace_id', $wid)->count();
        $needed = 500 - $current;

        for ($k = 1; $k <= $needed; $k++) {
            $uniquePhone = '+23480' . str_pad((string) (30000000 + $k), 8, '0', STR_PAD_LEFT);
            $contact = Contact::create([
                'workspace_id' => $wid,
                'phone_e164' => $uniquePhone,
                'first_name' => fake()->firstName(),
                'last_name' => fake()->lastName(),
                'email' => 'client.' . $k . '@ftfcustomer.ng',
                'country' => 'NG',
                'city' => Arr::random(['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano']),
                'opt_in_whatsapp' => true,
                'opt_in_email' => true,
                'source' => 'whatsapp',
            ]);
            $this->bk($contact, Carbon::now()->subDays(rand(5, 200)));
        }
    }

    private function seedConversations(): void
    {
        $wid = $this->workspace->id;
        $channel = ChannelAccount::where('workspace_id', $wid)->where('channel', 'whatsapp')->first();
        $contacts = Contact::where('workspace_id', $wid)->get();

        if ($contacts->isEmpty() || ! $channel) {
            return;
        }

        // Create sample conversations showcasing automated inquiry resolution (98.4%) & package tracking
        $dialogs = [
            [
                'contact' => $contacts->first(),
                'status' => 'resolved',
                'messages' => [
                    ['in', 'Hi, I need to track waybill #WB-10028401 shipped from Manchester to Lagos.'],
                    ['out', 'Hello Emeka! 📦 Your shipment (Waybill #WB-10028401) cleared Lagos MMIA Customs today at 08:45 AM. Out for doorstep delivery via courier dispatch. Estimated arrival: Today by 3:00 PM.'],
                    ['in', 'That was fast! Thank you so much.'],
                    ['out', 'You are very welcome! Thanks for shipping with FTF Digital Solutions. Have a great day! ✨'],
                ],
            ],
            [
                'contact' => $contacts->skip(1)->first() ?? $contacts->first(),
                'status' => 'resolved',
                'messages' => [
                    ['in', 'Hello, how much does it cost to send a 15kg commercial carton to London Heathrow?'],
                    ['out', 'Hi Babatunde! ✈️ For a 15kg commercial parcel to London, our express air freight rate is ₦18,500 per 5kg block (Total: ₦55,500 inclusive of customs waybill). Would you like me to generate your instant payment booking link?'],
                    ['in', 'Yes please send the payment link.'],
                    ['out', 'Here is your direct 1-click in-chat booking and payment link: https://botifyai.cloud/buy/ftf-logistics/order-checkout/WB-10028405. Pay via Paystack or Flutterwave.'],
                ],
            ],
            [
                'contact' => $contacts->skip(2)->first() ?? $contacts->first(),
                'status' => 'open',
                'messages' => [
                    ['in', 'Good day, please confirm pickup schedule for our international diplomatic cargo.'],
                    ['out', 'Good day Chioma! Our Abuja logistics team is scheduled for pickup at 2:00 PM today. A dedicated waybill supervisor has been assigned.'],
                ],
            ],
        ];

        foreach ($dialogs as $d) {
            $convo = Conversation::updateOrCreate(
                [
                    'workspace_id' => $wid,
                    'channel_account_id' => $channel->id,
                    'contact_id' => $d['contact']->id,
                ],
                [
                    'status' => $d['status'],
                    'assigned_to' => 'bot',
                    'unread_count' => 0,
                    'last_message_at' => Carbon::now()->subHours(rand(1, 24)),
                    'last_inbound_at' => Carbon::now()->subHours(rand(1, 24)),
                ]
            );

            foreach ($d['messages'] as $m) {
                Message::firstOrCreate(
                    [
                        'conversation_id' => $convo->id,
                        'body' => $m[1],
                    ],
                    [
                        'direction' => $m[0],
                        'channel' => 'whatsapp',
                        'type' => 'text',
                        'status' => 'delivered',
                        'sent_by' => $m[0] === 'out' ? 'bot' : 'human',
                        'sent_at' => Carbon::now()->subHours(rand(1, 24)),
                    ]
                );
            }
        }
    }

    private function seedEcommerceStoreAndProducts(): void
    {
        $wid = $this->workspace->id;

        // 1. FTF Logistics Digital Storefront (Native Platform)
        $this->store = EcommerceStore::updateOrCreate(
            ['workspace_id' => $wid, 'platform' => 'native'],
            [
                'name' => 'FTF Digital Solutions - Global Logistics Command',
                'domain' => 'native',
                'slug' => 'ftf-logistics',
                'currency' => 'NGN',
                'status' => 'connected',
                'support_email' => 'ayo@ftfdigitalsolutions.com',
                'support_phone' => '+234 813 366 2232',
                'brand_color' => '#0D9488',
                'is_published' => true,
                'marketing_pixels' => [
                    'meta_pixel_id' => '104928572910482',
                    'meta_capi_token' => 'EAAG_FTF_CAPI_ACTIVE',
                    'ga4_measurement_id' => 'G-FTFLOGISTICS',
                    'tiktok_pixel_id' => 'TT_FTF_CARGO',
                    'gtm_container_id' => 'GTM-FTF2024',
                    'clarity_project_id' => 'clarity_ftf_live',
                ],
                'published_at' => Carbon::parse('2024-01-20 10:00:00'),
            ]
        );

        // Linked Settlement Bank Account (Paystack / Flutterwave multi-currency payouts)
        MerchantBankAccount::updateOrCreate(
            ['store_id' => $this->store->id],
            [
                'bank_name' => 'Zenith Bank PLC',
                'account_number' => '1018400021',
                'account_name' => 'FTF DIGITAL SOLUTIONS LIMITED',
                'currency' => 'NGN',
                'is_verified' => true,
            ]
        );

        // 2. Logistics & Freight Service Products
        $services = [
            ['UK & Europe Air Express Freight', 'FTF-UK-AIR', 40000.00, 'International priority air cargo delivery within 3-5 business days.'],
            ['North America Cross-Border Courier', 'FTF-US-EXP', 65000.00, 'Direct express courier shipping to USA and Canada with real-time customs clearance.'],
            ['Nationwide Interstate Freight Booking', 'FTF-NG-INTER', 18500.00, 'Door-to-door interstate haulage and cargo distribution across Nigeria.'],
            ['Express Waybill Package Handling', 'FTF-WAYBILL', 12000.00, 'Real-time GPS waybill tracking, barcoding, and verified recipient signing.'],
            ['Customs Brokerage & Clearance Escrow', 'FTF-CUSTOMS', 58000.00, 'Automated customs tariff duty settlement and official port clearance reconciliation.'],
        ];

        foreach ($services as $svc) {
            EcommerceProduct::updateOrCreate(
                ['store_id' => $this->store->id, 'sku' => $svc[1]],
                [
                    'workspace_id' => $wid,
                    'platform' => 'native',
                    'name' => $svc[0],
                    'slug' => Str::slug($svc[0]),
                    'price' => $svc[2],
                    'compare_at_price' => $svc[2] * 1.25,
                    'currency' => 'NGN',
                    'product_type' => 'service',
                    'description' => $svc[3],
                    'inventory_quantity' => 9999,
                    'status' => 'active',
                    'is_published' => true,
                ]
            );
        }
    }

    private function seedEcommerceOrdersAndInvoices(): void
    {
        $wid = $this->workspace->id;
        $storeId = $this->store->id;

        // Target: ₦18,400,000.00 in shipping bookings and service revenue processed
        // Total Invoices: 500 results shown in Billing & Revenue Cycle
        // Average 94% payment completion rate (470 paid, 30 pending/overdue)
        $targetRevenue = 18400000.00;
        $totalOrdersCount = 500;
        $paidOrdersCount = 470; // 94% completion rate

        // Check if orders are already seeded to preserve idempotency
        $existingCount = EcommerceOrder::where('store_id', $storeId)->count();
        if ($existingCount >= $totalOrdersCount) {
            return;
        }

        // Exact invoice amounts directly from Page 2 screenshot:
        $screenshotInvoices = [
            ['number' => '10028401', 'customer' => 'Ngozi Okonjo', 'amount' => 40000.00, 'status' => 'paid', 'date' => '2025-11-01'],
            ['number' => '10028402', 'customer' => 'Aisha Bello', 'amount' => 24500.00, 'status' => 'pending', 'date' => '2025-11-02'],
            ['number' => '10028403', 'customer' => 'Tunde Bakare', 'amount' => 32000.00, 'status' => 'paid', 'date' => '2025-11-03'],
            ['number' => '10028404', 'customer' => 'Chiamaka Nze', 'amount' => 12000.00, 'status' => 'overdue', 'date' => '2025-11-04'],
            ['number' => '10028405', 'customer' => 'Ibrahim Musa', 'amount' => 18500.00, 'status' => 'paid', 'date' => '2025-11-05'],
            ['number' => '10028406', 'customer' => 'Amaka Obi', 'amount' => 58000.00, 'status' => 'pending', 'date' => '2025-11-06'],
            ['number' => '10028407', 'customer' => 'Yusuf Garba', 'amount' => 27800.00, 'status' => 'paid', 'date' => '2025-11-07'],
            ['number' => '10028408', 'customer' => 'Bolaji Davies', 'amount' => 9000.00, 'status' => 'overdue', 'date' => '2025-11-08'],
            ['number' => '10028409', 'customer' => 'Chioma Eze', 'amount' => 65000.00, 'status' => 'pending', 'date' => '2025-11-09'],
            ['number' => '10028410', 'customer' => 'Fatima Dangote', 'amount' => 15000.00, 'status' => 'paid', 'date' => '2025-11-10'],
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
        $remainingPaidCount = $paidOrdersCount - $screenshotPaidCount;
        $remainingRevenue = $targetRevenue - $screenshotPaidSum;
        $avgRemainingPaid = round($remainingRevenue / $remainingPaidCount, 2);

        // Pre-create the 10 screenshot invoices
        foreach ($screenshotInvoices as $inv) {
            $isPaid = ($inv['status'] === 'paid');
            $placedAt = Carbon::parse($inv['date'])->setTime(11, 30);
            $order = EcommerceOrder::updateOrCreate(
                [
                    'store_id' => $storeId,
                    'external_order_id' => 'ftf_inv_' . $inv['number'],
                ],
                [
                    'workspace_id' => $wid,
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
                ]
            );
            $this->bk($order, $placedAt);
        }

        // Bulk insert the remaining 490 orders to achieve exactly ₦18,400,000.00 across 470 paid orders
        $runningPaidSum = $screenshotPaidSum;
        $targetLoopPaidEnd = 10 + $remainingPaidCount; // 10 + 465 = 475

        for ($idx = 11; $idx <= $totalOrdersCount; $idx++) {
            $orderNum = '1002' . str_pad((string) (8400 + $idx), 4, '0', STR_PAD_LEFT);
            $isPaid = ($idx <= $targetLoopPaidEnd); // exactly 465 loop orders + 5 screenshot orders = 470 paid orders (94%)
            $daysAgo = rand(1, 240);
            $placedAt = Carbon::now()->subDays($daysAgo)->setTime(rand(8, 20), rand(0, 59));

            if ($isPaid) {
                // Ensure exact total revenue by adjusting the last paid order
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

            $order = EcommerceOrder::create([
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
                'line_items' => [
                    [
                        'name' => 'Waybill Booking & Freight Transit',
                        'sku' => 'FTF-LOGISTICS-SVC',
                        'quantity' => 1,
                        'price' => $amount,
                    ],
                ],
                'tracking_number' => 'WB-' . $orderNum,
                'tracking_url' => 'https://botifyai.cloud/buy/ftf-logistics/status/WB-' . $orderNum,
                'placed_at' => $placedAt,
                'paid_at' => $isPaid ? $placedAt->copy()->addMinutes(rand(2, 15)) : null,
                'payment_gateway' => Arr::random(['paystack', 'flutterwave', 'stripe']),
                'payment_reference' => 'gw_ref_' . $orderNum,
            ]);
            $this->bk($order, $placedAt);
        }
    }

    private function seedCartRecoveryEngine(): void
    {
        $wid = $this->workspace->id;
        $storeId = $this->store->id;

        // Metric: Verified 35% checkout recovery rate via WhatsApp direct 1-click in-chat link
        // 100 carts tracked: 35 recovered (35.0% checkout recovery rate)
        if (EcommerceCart::where('store_id', $storeId)->count() === 0) {
            for ($c = 1; $c <= 100; $c++) {
                $isRecovered = ($c <= 35); // exactly 35% recovered
                $abandonedAt = Carbon::now()->subDays(rand(1, 60))->setTime(rand(9, 21), rand(0, 59));
                $amount = Arr::random([18500.00, 24500.00, 32000.00, 40000.00, 58000.00]);

                $cart = EcommerceCart::create([
                    'workspace_id' => $wid,
                    'store_id' => $storeId,
                    'external_id' => 'cart_ftf_' . (8000 + $c),
                    'total' => $amount,
                    'currency' => 'NGN',
                    'line_items' => [
                        [
                            'name' => 'Cross-Border Freight Waybill Booking',
                            'quantity' => 1,
                            'price' => $amount,
                        ],
                    ],
                    'recovery_url' => 'https://botifyai.cloud/buy/ftf-logistics/checkout/recover/' . Str::random(24),
                    'abandoned_at' => $abandonedAt,
                    'recovery_triggered_at' => $abandonedAt->copy()->addMinutes(5), // triggered via WhatsApp within minutes
                    'recovered_at' => $isRecovered ? $abandonedAt->copy()->addMinutes(rand(12, 45)) : null,
                ]);
                $this->bk($cart, $abandonedAt);
            }
        }
    }

    private function seedBroadcastingAndMetaCampaign(): void
    {
        $wid = $this->workspace->id;

        // Campaign metrics directly from Page 3 telemetry:
        // Total recipients: 35,657
        // Delivered: 35,336 (99.1% - 99.2% delivery rate)
        // Read: 29,952 (84.0% open rate)
        // Failed / Denied: 321 (0.9%)
        // Direct Sales Recovery: 35%
        $campaign = Campaign::updateOrCreate(
            [
                'workspace_id' => $wid,
                'name' => 'Official Meta Cloud API - Cart Recovery & Telemetry Broadcast',
            ],
            [
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
                'schedule_at' => Carbon::now()->subDays(14)->setTime(10, 0),
                'timezone' => 'Africa/Lagos',
                'status' => 'completed',
                'created_by' => $this->user->id,
            ]
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

        // Check if recipients are already seeded
        if (CampaignRecipient::where('campaign_id', $campaign->id)->count() > 0) {
            return;
        }

        // Each campaign recipient must have a unique contact_id due to unique(['campaign_id', 'contact_id'])
        $contacts = Contact::where('workspace_id', $wid)->take(500)->get();
        if ($contacts->isEmpty()) {
            return;
        }

        $totalRecipients = min(500, $contacts->count());

        for ($r = 1; $r <= $totalRecipients; $r++) {
            $isFailed = ($r <= 4); // ~0.8% failed (321 / 35657)
            $isRead = (! $isFailed && $r <= 424); // 420 of 500 = 84.0% open rate
            $isDelivered = (! $isFailed); // 496 of 500 = 99.2% delivery rate

            $status = $isFailed ? 'failed' : ($isRead ? 'read' : 'delivered');
            $sentAt = Carbon::now()->subDays(14)->setTime(10, rand(1, 55));
            $deliveredAt = $isDelivered ? $sentAt->copy()->addSeconds(rand(1, 5)) : null;
            $readAt = $isRead ? $deliveredAt->copy()->addMinutes(rand(2, 45)) : null;

            CampaignRecipient::create([
                'campaign_id' => $campaign->id,
                'contact_id' => $contacts[$r - 1]->id,
                'status' => $status,
                'provider_message_id' => 'wamid.HBgL' . Str::random(28),
                'sent_at' => $sentAt,
                'delivered_at' => $deliveredAt,
                'read_at' => $readAt,
                'failed_reason' => $isFailed ? 'Meta API temporary provider rejection (321 denied)' : null,
                'clicked_at' => ($isRead && $r <= 175) ? $readAt->copy()->addMinutes(rand(1, 10)) : null, // 35% click/recovery
            ]);
        }

        // Sync totals on the campaign row
        $campaign->updateTotals();
    }
}
