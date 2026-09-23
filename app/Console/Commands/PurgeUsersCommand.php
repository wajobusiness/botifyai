<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PurgeUsersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'saas:purge-users 
                            {--force : Force the operation to run without interactive confirmation}
                            {--keep-admins : Ensure platform admin accounts are strictly preserved (default true)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Purge all user records, client tenants, workspaces, and user-generated data while preserving admin accounts and platform settings.';

    /**
     * List of tenant and user tables to be truncated.
     */
    protected array $tenantTables = [
        // 1. Core Auth & Tenant Tables
        'users',
        'clients',
        'workspaces',
        'workspace_user',
        'client_settings',
        'client_subscriptions',
        'subscriptions',
        'payment_transactions',
        'billing_events',
        'usage_meters',
        'personal_access_tokens',
        'social_accounts',
        'invitations',
        'magic_links',
        'onboarding_steps',
        'internal_notes',
        'push_subscriptions',
        'notifications',
        'notification_preferences',
        'webhook_endpoints',
        'webhook_deliveries',
        'inbound_webhook_events',
        'support_tickets',
        'support_replies',
        'contact_messages',
        'audit_logs',
        'sessions',
        'password_reset_tokens',
        'media',

        // 2. AI Chatbots & Knowledge Bases
        'ai_chatbots',
        'ai_knowledge_bases',
        'ai_kb_documents',
        'ai_kb_chunks',
        'ai_provider_configs',
        'ai_runs',
        'ai_bot_knowledge_sources',
        'ai_bot_store_connections',
        'ai_bot_product_assignments',
        'ai_bot_tool_permissions',
        'conversation_sessions',

        // 3. Automation & Broadcasting
        'automations',
        'automation_runs',
        'automation_run_logs',
        'campaigns',
        'campaign_recipients',

        // 4. Contacts, Leads & CRM
        'contacts',
        'contact_tags',
        'contact_tag_pivot',
        'segments',
        'segment_contact',
        'leads',
        'lead_activities',
        'lead_pipeline_stages',
        'lead_scoring_configs',
        'lead_scrape_jobs',

        // 5. Conversations & Omnichannel Inbox
        'conversations',
        'messages',
        'conversation_activities',
        'inbox_assignments',
        'inbox_canned_replies',
        'inbox_labels',
        'inbox_label_conversation',
        'inbox_notes',

        // 6. WhatsApp & Channels
        'whatsapp_business_accounts',
        'whatsapp_phone_numbers',
        'whatsapp_templates',
        'whatsapp_template_submissions',
        'whatsapp_widgets',
        'whatsapp_auto_replies',
        'channel_accounts',
        'sms_provider_configs',
        'workspace_smtp_configs',

        // 7. Social Media
        'social_media_accounts',
        'social_media_posts',
        'social_media_post_accounts',

        // 8. Ecommerce & Merchant Storefronts
        'ecommerce_stores',
        'ecommerce_products',
        'ecommerce_digital_assets',
        'ecommerce_download_tokens',
        'ecommerce_carts',
        'ecommerce_orders',
        'ecommerce_payment_logs',
        'merchant_wallets',
        'merchant_ledger_entries',
        'merchant_bank_accounts',
        'merchant_payout_requests',
        'iyzico_checkout_sessions',
        'iyzico_pricing_plans',

        // 9. Integrations
        'integration_configs',
        'integration_audit_logs',
    ];

    /**
     * Tables that MUST NEVER be purged.
     */
    protected array $preservedTables = [
        'admin_users',
        'roles',
        'permissions',
        'role_permission',
        'admin_role',
        'system_settings',
        'plans',
        'currencies',
        'locales',
        'translations',
        'cms_pages',
        'payment_gateway_configs',
        'smtp_configurations',
        'redirects',
        'tax_rates',
        'coupons',
        'templates',
    ];

    public function handle(): int
    {
        $this->info('');
        $this->warn('================================================================');
        $this->warn('           BOTIFYAI USER & TENANT DATA PURGE UTILITY            ');
        $this->warn('================================================================');
        $this->info('');
        $this->line('This command will completely remove all:');
        $this->line('  • Registered users & clients');
        $this->line('  • Workspaces & team memberships');
        $this->line('  • Omnichannel conversations, messages, and contacts');
        $this->line('  • WhatsApp widgets, accounts, and templates');
        $this->line('  • AI chatbots, knowledge bases, and automation flows');
        $this->line('  • Ecommerce stores, products, orders, and merchant wallets');
        $this->line('  • Subscriptions, transactions, and notification logs');
        $this->info('');
        $this->info('The following platform infrastructure will be PRESERVED:');
        $this->line('  ✔ Super Admin & Admin accounts (admin_users)');
        $this->line('  ✔ Admin Roles & Permissions');
        $this->line('  ✔ System Settings, Branding, SEO & Tracking Configurations');
        $this->line('  ✔ Subscription Plans & Currencies');
        $this->line('  ✔ CMS Pages & Redirects');
        $this->line('  ✔ Platform Payment Gateways & Email SMTP Configs');
        $this->info('');

        if (! $this->option('force')) {
            if (! $this->confirm('Are you sure you want to purge all user and tenant records? THIS CANNOT BE UNDONE.', false)) {
                $this->warn('Purge cancelled.');
                return self::SUCCESS;
            }
        }

        $this->info('Starting database wipe for user & tenant tables...');
        $this->disableForeignKeys();

        $purgedSummary = [];
        $totalRowsDeleted = 0;

        foreach ($this->tenantTables as $table) {
            if (Schema::hasTable($table)) {
                $count = DB::table($table)->count();
                if ($count > 0) {
                    DB::table($table)->truncate();
                    $purgedSummary[] = [$table, $count, 'Purged'];
                    $totalRowsDeleted += $count;
                } else {
                    $purgedSummary[] = [$table, 0, 'Empty'];
                }
            } else {
                $purgedSummary[] = [$table, '-', 'Table not found'];
            }
        }

        $this->enableForeignKeys();

        $this->info('');
        $this->table(['Database Table', 'Rows Removed', 'Status'], $purgedSummary);
        $this->info('');
        $this->info("Total tenant records purged: {$totalRowsDeleted}");

        // Verify admin users are intact
        if (Schema::hasTable('admin_users')) {
            $adminCount = DB::table('admin_users')->count();
            $this->info("Admin accounts preserved: {$adminCount}");
        }

        // Clear application cache
        $this->callSilent('cache:clear');
        $this->info('Application cache cleared.');

        $this->info('');
        $this->info('================================================================');
        $this->info('✅ USER RECORDS PURGED SUCCESSFULLY! READY FOR ONBOARDING.');
        $this->info('================================================================');
        $this->info('');

        return self::SUCCESS;
    }

    protected function disableForeignKeys(): void
    {
        $driver = DB::getDriverName();

        match ($driver) {
            'mysql', 'mariadb' => DB::statement('SET FOREIGN_KEY_CHECKS=0;'),
            'sqlite'           => DB::statement('PRAGMA foreign_keys = OFF;'),
            'pgsql'            => DB::statement('SET session_replication_role = replica;'),
            default            => null,
        };
    }

    protected function enableForeignKeys(): void
    {
        $driver = DB::getDriverName();

        match ($driver) {
            'mysql', 'mariadb' => DB::statement('SET FOREIGN_KEY_CHECKS=1;'),
            'sqlite'           => DB::statement('PRAGMA foreign_keys = ON;'),
            'pgsql'            => DB::statement('SET session_replication_role = DEFAULT;'),
            default            => null,
        };
    }
}
