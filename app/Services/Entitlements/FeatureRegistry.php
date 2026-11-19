<?php

namespace App\Services\Entitlements;

class FeatureRegistry
{
    public const TYPE_BOOLEAN = 'boolean';
    public const TYPE_CAP = 'cap';             // Persistent resource cap (e.g. max 5 chatbots)
    public const TYPE_METERED = 'metered';     // Monthly usage quota (e.g. 10,000 messages/mo)

    /**
     * Master definitions of all platform capabilities and limits.
     * Developers register features here; they automatically appear in the Admin Plan Builder.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function definitions(): array
    {
        return [
            // ==================== WHATSAPP & MESSAGING ====================
            'whatsapp_cloud_api' => [
                'name' => 'WhatsApp Cloud API (Official WABA)',
                'description' => 'Official Meta verified Cloud API connection with high throughput.',
                'category' => 'WhatsApp Connectivity',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'whatsapp_linked_devices' => [
                'name' => 'Personal & Mobile App WhatsApp (Linked Device)',
                'description' => 'Connect via 8-digit Pairing Code or QR Code without losing phone app.',
                'category' => 'WhatsApp Connectivity',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'max_whatsapp_accounts' => [
                'name' => 'Max Connected WhatsApp Numbers',
                'description' => 'Maximum concurrent WhatsApp numbers connected per workspace (0 or blank = unlimited).',
                'category' => 'WhatsApp Connectivity',
                'type' => self::TYPE_CAP,
                'default' => 2,
            ],
            'whatsapp_messages_per_month' => [
                'name' => 'Monthly WhatsApp Messages',
                'description' => 'Total outbound WhatsApp messages permitted per billing month.',
                'category' => 'WhatsApp Connectivity',
                'type' => self::TYPE_METERED,
                'default' => 1000,
            ],
            'whatsapp_templates' => [
                'name' => 'Max WhatsApp Approved Templates',
                'description' => 'Maximum approved template definitions managed in the workspace.',
                'category' => 'WhatsApp Connectivity',
                'type' => self::TYPE_CAP,
                'default' => 10,
            ],
            'whatsapp_ai_replies' => [
                'name' => 'WhatsApp AI Auto-Responses',
                'description' => 'Allow AI Chatbots to autonomously converse with incoming WhatsApp inquiries.',
                'category' => 'WhatsApp Connectivity',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'whatsapp_broadcast_campaigns' => [
                'name' => 'WhatsApp Broadcast Campaigns',
                'description' => 'Permit launching bulk marketing messages to opted-in contact cohorts.',
                'category' => 'WhatsApp Connectivity',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],

            // ==================== AI & CHATBOTS ====================
            'ai_chatbots' => [
                'name' => 'AI Chatbot Studio',
                'description' => 'Create and customize autonomous conversational AI agents.',
                'category' => 'Artificial Intelligence',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'max_chatbots' => [
                'name' => 'Max Active AI Chatbots',
                'description' => 'Total active AI bots configured concurrently in the workspace.',
                'category' => 'Artificial Intelligence',
                'type' => self::TYPE_CAP,
                'default' => 3,
            ],
            'ai_knowledge_hub' => [
                'name' => 'AI Knowledge Hub (RAG Engine)',
                'description' => 'Connect external knowledge sources: PDFs, Web URLs, APIs, Databases.',
                'category' => 'Artificial Intelligence',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'max_knowledge_sources' => [
                'name' => 'Max Knowledge Sources',
                'description' => 'Number of indexed data sources, documents, and API endpoints.',
                'category' => 'Artificial Intelligence',
                'type' => self::TYPE_CAP,
                'default' => 10,
            ],
            'ai_tokens_per_month' => [
                'name' => 'Monthly AI Tokens / Credits',
                'description' => 'Token budget for LLM inference, embeddings, and chat completions.',
                'category' => 'Artificial Intelligence',
                'type' => self::TYPE_METERED,
                'default' => 250000,
            ],
            'ai_live_chat_widget' => [
                'name' => 'Website Live Chat Widget',
                'description' => 'Deploy the embeddable copy-and-paste JavaScript live chat widget to external sites.',
                'category' => 'Artificial Intelligence',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],

            // ==================== INBOX & COLLABORATION ====================
            'shared_inbox' => [
                'name' => 'Unified Omnichannel Inbox',
                'description' => 'Centralized shared inbox for WhatsApp, Live Chat, and multi-channel conversations.',
                'category' => 'Inbox & Team',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'inbox_agents' => [
                'name' => 'Max Inbox Agents',
                'description' => 'Number of team members permitted to act as live support agents in the inbox.',
                'category' => 'Inbox & Team',
                'type' => self::TYPE_CAP,
                'default' => 5,
            ],
            'human_agent_takeover' => [
                'name' => 'Live Human Agent Takeover',
                'description' => 'Allow human agents to seamlessly take over live threads from AI bots.',
                'category' => 'Inbox & Team',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'users' => [
                'name' => 'Team Seats (Users)',
                'description' => 'Maximum user accounts / team member invitations per workspace.',
                'category' => 'Inbox & Team',
                'type' => self::TYPE_CAP,
                'default' => 3,
            ],

            // ==================== MARKETING & BROADCASTING ====================
            'broadcast_campaigns' => [
                'name' => 'Broadcasting Hub',
                'description' => 'Send newsletters, scheduled marketing broadcasts, and triggered outreach.',
                'category' => 'Marketing & Campaigns',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'campaigns_per_month' => [
                'name' => 'Broadcast Campaigns per Month',
                'description' => 'Number of separate broadcast batches launchable per month.',
                'category' => 'Marketing & Campaigns',
                'type' => self::TYPE_METERED,
                'default' => 10,
            ],
            'sms_per_month' => [
                'name' => 'Monthly SMS Messages',
                'description' => 'Outbound SMS text volume per billing cycle.',
                'category' => 'Marketing & Campaigns',
                'type' => self::TYPE_METERED,
                'default' => 100,
            ],
            'emails_per_month' => [
                'name' => 'Monthly Marketing Emails',
                'description' => 'Newsletter and marketing email sends per month.',
                'category' => 'Marketing & Campaigns',
                'type' => self::TYPE_METERED,
                'default' => 5000,
            ],

            // ==================== CRM & AUDIENCE ====================
            'crm_contacts' => [
                'name' => 'CRM & Customer Database',
                'description' => 'Store contact attributes, order history, tags, and audience segmentation.',
                'category' => 'CRM & Leads',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'max_contacts' => [
                'name' => 'Max CRM Contacts Capacity',
                'description' => 'Total active contacts stored in the workspace database.',
                'category' => 'CRM & Leads',
                'type' => self::TYPE_CAP,
                'default' => 2500,
            ],
            'lead_credits_per_month' => [
                'name' => 'Monthly Lead Scraping Credits',
                'description' => 'B2B lead generation and web scraping credits per month.',
                'category' => 'CRM & Leads',
                'type' => self::TYPE_METERED,
                'default' => 50,
            ],

            // ==================== AUTOMATIONS ====================
            'workflow_automations' => [
                'name' => 'Visual Automation Builder',
                'description' => 'Multi-step event-driven automation workflows and webhooks.',
                'category' => 'Automations',
                'type' => self::TYPE_BOOLEAN,
                'default' => true,
            ],
            'automations' => [
                'name' => 'Max Active Automations',
                'description' => 'Number of simultaneous active automation flows running.',
                'category' => 'Automations',
                'type' => self::TYPE_CAP,
                'default' => 5,
            ],

            // ==================== SOCIAL MEDIA ====================
            'social_accounts' => [
                'name' => 'Connected Social Accounts',
                'description' => 'Facebook Pages, Instagram Accounts, Twitter/X profiles.',
                'category' => 'Social Marketing',
                'type' => self::TYPE_CAP,
                'default' => 3,
            ],
            'social_posts_per_month' => [
                'name' => 'Monthly Social Posts',
                'description' => 'Scheduled and published social media posts per month.',
                'category' => 'Social Marketing',
                'type' => self::TYPE_METERED,
                'default' => 30,
            ],

            // ==================== ENTERPRISE & INFRASTRUCTURE ====================
            'storage' => [
                'name' => 'Media & File Storage (MB)',
                'description' => 'Total storage quota for audio, video, documents, and media uploads.',
                'category' => 'Platform & Enterprise',
                'type' => self::TYPE_CAP,
                'default' => 1024, // 1 GB
            ],
            'api_access' => [
                'name' => 'Developer REST API & Webhooks',
                'description' => 'Access to programmatic BotifyAI REST APIs, API keys, and outbound webhooks.',
                'category' => 'Platform & Enterprise',
                'type' => self::TYPE_BOOLEAN,
                'default' => false,
            ],
            'custom_domain' => [
                'name' => 'Custom Domain Support',
                'description' => 'Connect custom branded domains for portals, widgets, and links.',
                'category' => 'Platform & Enterprise',
                'type' => self::TYPE_BOOLEAN,
                'default' => false,
            ],
            'white_label' => [
                'name' => 'White Label (No BotifyAI Branding)',
                'description' => 'Remove "Powered by BotifyAI" badges from widgets and customer-facing interfaces.',
                'category' => 'Platform & Enterprise',
                'type' => self::TYPE_BOOLEAN,
                'default' => false,
            ],
        ];
    }

    /**
     * Return all definitions.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function all(): array
    {
        return self::definitions();
    }

    /**
     * Group definitions by category for structured Admin UI rendering.
     */
    public static function categorized(): array
    {
        $grouped = [];
        foreach (self::definitions() as $key => $meta) {
            $cat = $meta['category'] ?? 'General';
            $meta['key'] = $key;
            $grouped[$cat][$key] = $meta;
        }

        return $grouped;
    }

    /**
     * Get default boolean value for a feature key.
     */
    public static function getDefaultFeature(string $key): bool
    {
        $def = self::definitions()[$key] ?? null;
        if (! $def || ($def['type'] ?? '') !== self::TYPE_BOOLEAN) {
            return false;
        }

        return (bool) ($def['default'] ?? false);
    }

    /**
     * Get default numeric limit for a limit/quota key.
     */
    public static function getDefaultLimit(string $key): ?int
    {
        $def = self::definitions()[$key] ?? null;
        if (! $def || ! in_array($def['type'] ?? '', [self::TYPE_CAP, self::TYPE_METERED], true)) {
            return null;
        }

        return isset($def['default']) ? (int) $def['default'] : null;
    }

    /**
     * Return all feature keys.
     */
    public static function featureKeys(): array
    {
        $keys = [];
        foreach (self::definitions() as $key => $meta) {
            if ($meta['type'] === self::TYPE_BOOLEAN) {
                $keys[] = $key;
            }
        }

        return $keys;
    }

    /**
     * Return all limit/quota keys.
     */
    public static function limitKeys(): array
    {
        $keys = [];
        foreach (self::definitions() as $key => $meta) {
            if (in_array($meta['type'], [self::TYPE_CAP, self::TYPE_METERED], true)) {
                $keys[] = $key;
            }
        }

        return $keys;
    }
}
