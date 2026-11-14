<?php

namespace App\Services\Marketing;

use App\Models\EcommerceProduct;
use App\Models\Plan;
use App\Models\SmtpConfiguration;
use App\Modules\AI\Services\Llm\LlmManager;
use App\Modules\Broadcasting\Models\Campaign;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NewsletterSequenceService
{
    /**
     * Supported sequence themes.
     */
    public const THEMES = [
        'platform_mastery' => [
            'name' => 'Platform Mastery & Omnichannel Automation (30 Days)',
            'description' => 'Complete step-by-step masterclass turning new and existing users into power users across WhatsApp, Messenger, Instagram, CRM, and AI bots.',
            'target_audience' => 'all_users',
        ],
        'saas_onboarding' => [
            'name' => 'SaaS Activation, Retention & Paid Upgrade (30 Days)',
            'description' => 'Strategic onboarding sequence that guides subscribers from free tier or trial to engaged, paying Pro/Enterprise subscribers.',
            'target_audience' => 'only_registered_users',
        ],
        'ecommerce_growth' => [
            'name' => 'E-Commerce & Social Selling Revenue Engine (30 Days)',
            'description' => 'High-conversion campaign series focused on driving catalog sales, flash offers, cart recovery, and VIP customer retention.',
            'target_audience' => 'only_buyers',
        ],
        'agency_leadgen' => [
            'name' => 'High-Ticket Lead Generation & Agency Playbook (30 Days)',
            'description' => 'Proven outbound and inbound strategies for agency owners, consultants, and service providers booking qualified appointments.',
            'target_audience' => 'all_users',
        ],
        'custom_ai' => [
            'name' => 'Custom AI-Generated Marketing Sequence (30 Days)',
            'description' => 'Tailored 30-day curriculum designed specifically around your unique product, niche, or promotion goal.',
            'target_audience' => 'all_users',
        ],
    ];

    /**
     * Generate the complete 30-day newsletter sequence curriculum.
     *
     * @return array<string, mixed>
     */
    public function generateCurriculum(
        string $theme,
        string $startDate,
        string $sendTime = '09:00',
        string $cadence = 'daily',
        ?string $customPrompt = null,
        string $targetAudience = 'all_users',
        int $workspaceId = 0,
    ): array {
        $parsedStart = Carbon::parse($startDate);
        $timeParts = explode(':', $sendTime);
        $hour = (int) ($timeParts[0] ?? 9);
        $minute = (int) ($timeParts[1] ?? 0);
        $parsedStart->setTime($hour, $minute, 0);

        // If custom AI requested and LLM configured, attempt AI generation
        $days = [];
        if ($theme === 'custom_ai' && ! empty($customPrompt)) {
            $days = $this->generateWithAi($customPrompt, $parsedStart, $cadence, $workspaceId);
        }

        if (empty($days)) {
            $days = $this->getPresetThemeDays($theme, $parsedStart, $cadence);
        }

        $themeMeta = self::THEMES[$theme] ?? self::THEMES['platform_mastery'];

        return [
            'theme' => $theme,
            'theme_name' => $themeMeta['name'],
            'sequence_name' => "30-Day Sequence: {$themeMeta['name']}",
            'start_date' => $parsedStart->toIso8601String(),
            'send_time' => sprintf('%02d:%02d', $hour, $minute),
            'cadence' => $cadence,
            'target_audience' => $targetAudience ?: $themeMeta['target_audience'],
            'total_days' => count($days),
            'days' => $days,
        ];
    }

    /**
     * Calculate scheduled Carbon date based on day number and cadence.
     */
    public function calculateScheduleDate(Carbon $start, int $dayIndex, string $cadence): Carbon
    {
        $date = $start->copy();

        switch ($cadence) {
            case 'every_2_days':
                return $date->addDays(($dayIndex - 1) * 2);

            case 'weekdays':
                // Advance $dayIndex - 1 business days
                $added = 0;
                while ($added < ($dayIndex - 1)) {
                    $date->addDay();
                    if ($date->isWeekday()) {
                        $added++;
                    }
                }
                return $date;

            case 'weekly':
                return $date->addWeeks($dayIndex - 1);

            case 'daily':
            default:
                return $date->addDays($dayIndex - 1);
        }
    }

    /**
     * Batch create the 30 campaigns in the database with their staggered schedule_at dates.
     *
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function createSequenceCampaigns(array $config, int $workspaceId, ?int $createdBy = null): array
    {
        $sequenceName = $config['sequence_name'] ?? '30-Day Marketing Sequence';
        $theme = $config['theme'] ?? 'platform_mastery';
        $audienceType = $config['audience_type'] ?? 'all_users';
        $audienceRef = $config['audience_ref'] ?? null;
        $smtpId = ! empty($config['smtp_configuration_id']) ? (int) $config['smtp_configuration_id'] : null;
        $fromName = $config['from_name'] ?? null;
        $fromEmail = $config['from_email'] ?? null;
        $replyTo = $config['reply_to'] ?? null;
        $status = $config['status'] ?? 'queued'; // 'queued' or 'draft'
        $days = $config['days'] ?? [];

        // Check active SMTP configuration if smtpId is null
        if (! $smtpId) {
            $defaultSmtp = SmtpConfiguration::getActiveFor('marketing') ?? SmtpConfiguration::getActive();
            $smtpId = $defaultSmtp?->id;
        }

        $createdCampaigns = [];
        $skippedCount = 0;

        foreach ($days as $dayData) {
            if (isset($dayData['enabled']) && ! $dayData['enabled']) {
                $skippedCount++;
                continue;
            }

            $dayNum = (int) ($dayData['day'] ?? 1);
            $dayTitle = $dayData['title'] ?? "Day {$dayNum}";
            $campaignName = "[30-Day #{$dayNum}] {$dayTitle}";
            $scheduledAt = ! empty($dayData['scheduled_at']) ? Carbon::parse($dayData['scheduled_at']) : now()->addDays($dayNum);

            $payloadJson = [
                'subject' => $dayData['subject'],
                'preheader' => $dayData['preheader'] ?? '',
                'body' => $dayData['body'],
                'from_name' => $fromName ?: config('app.name'),
                'from_email' => $fromEmail ?: null,
                'reply_to' => $replyTo ?: null,
                'smtp_configuration_id' => $smtpId,
                'track_opens' => true,
                'track_clicks' => true,
                'campaign_type' => 'newsletter',
                'audience_type' => $audienceType,
                'audience_ref' => $audienceRef,
                'sequence_meta' => [
                    'sequence_name' => $sequenceName,
                    'theme' => $theme,
                    'day' => $dayNum,
                    'total_days' => count($days),
                ],
            ];

            $dbAudienceType = in_array($audienceType, ['segment', 'contact_list', 'tag', 'csv'], true)
                ? $audienceType
                : 'contact_list';

            $campaign = Campaign::create([
                'workspace_id' => $workspaceId,
                'name' => $campaignName,
                'campaign_type' => 'newsletter',
                'channel' => 'email',
                'audience_type' => $dbAudienceType,
                'audience_ref' => $audienceRef,
                'payload_json' => $payloadJson,
                'schedule_at' => $scheduledAt,
                'timezone' => config('app.timezone', 'UTC'),
                'status' => $status,
                'created_by' => $createdBy,
            ]);

            $createdCampaigns[] = [
                'id' => $campaign->id,
                'uuid' => $campaign->uuid,
                'name' => $campaign->name,
                'day' => $dayNum,
                'scheduled_at' => $scheduledAt->toIso8601String(),
                'status' => $campaign->status,
            ];
        }

        return [
            'count' => count($createdCampaigns),
            'skipped' => $skippedCount,
            'status' => $status,
            'campaigns' => $createdCampaigns,
        ];
    }

    /**
     * Preset 30-Day Curriculums.
     */
    private function getPresetThemeDays(string $theme, Carbon $start, string $cadence): array
    {
        $blueprint = match ($theme) {
            'saas_onboarding' => $this->getSaasOnboardingSyllabus(),
            'ecommerce_growth' => $this->getEcommerceGrowthSyllabus(),
            'agency_leadgen' => $this->getAgencyLeadgenSyllabus(),
            'platform_mastery', 'custom_ai' => $this->getPlatformMasterySyllabus(),
            default => $this->getPlatformMasterySyllabus(),
        };

        $days = [];
        foreach ($blueprint as $index => $item) {
            $dayNum = $index + 1;
            $scheduledDate = $this->calculateScheduleDate($start, $dayNum, $cadence);

            $htmlBody = $this->buildEmailHtml([
                'day_badge' => "Day {$dayNum} of 30",
                'headline' => $item['title'],
                'intro' => $item['intro'],
                'steps' => $item['steps'] ?? [],
                'pro_tip' => $item['pro_tip'] ?? null,
                'cta_text' => $item['cta_text'] ?? 'Explore in Dashboard',
                'cta_url' => $item['cta_url'] ?? url('/app/dashboard'),
            ]);

            $days[] = [
                'day' => $dayNum,
                'title' => $item['title'],
                'subject' => $item['subject'],
                'preheader' => $item['preheader'],
                'cta_text' => $item['cta_text'] ?? 'Open Botify AI',
                'cta_url' => $item['cta_url'] ?? url('/app/dashboard'),
                'body' => $htmlBody,
                'scheduled_at' => $scheduledDate->toIso8601String(),
                'scheduled_formatted' => $scheduledDate->format('M j, Y \a\t g:i A'),
                'enabled' => true,
            ];
        }

        return $days;
    }

    /**
     * Build standard Botify AI branded responsive HTML email template.
     */
    public function buildEmailHtml(array $data): string
    {
        $dayBadge = e($data['day_badge'] ?? 'Newsletter');
        $headline = e($data['headline'] ?? 'Actionable Update');
        $intro = $data['intro'] ?? '';
        $steps = $data['steps'] ?? [];
        $proTip = $data['pro_tip'] ?? null;
        $ctaText = e($data['cta_text'] ?? 'Get Started');
        $ctaUrl = e($data['cta_url'] ?? url('/app/dashboard'));
        $appName = config('app.name', 'Botify AI');

        $stepsHtml = '';
        if (! empty($steps)) {
            $stepsHtml .= '<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:24px 0;">';
            $stepsHtml .= '<h3 style="margin-top:0;margin-bottom:12px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#475569;font-weight:700;">Action Plan for Today:</h3>';
            $stepsHtml .= '<ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.6;">';
            foreach ($steps as $step) {
                $stepsHtml .= '<li style="margin-bottom:8px;">' . $step . '</li>';
            }
            $stepsHtml .= '</ul></div>';
        }

        $proTipHtml = '';
        if ($proTip) {
            $proTipHtml = '<div style="background-color:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px;margin:20px 0;color:#1e40af;font-size:13px;line-height:1.5;">'
                . '<strong>💡 Pro Tip:</strong> ' . $proTip
                . '</div>';
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -2px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);padding:28px 32px;text-align:left;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:rgba(255,255,255,0.15);color:#c7d2fe;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:20px;">
                      {$dayBadge}
                    </span>
                    <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:10px 0 0;line-height:1.3;">
                      {$headline}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px;color:#334155;font-size:15px;line-height:1.65;">
              <p style="margin-top:0;font-size:16px;color:#0f172a;">
                Hi <strong>{{contact.first_name|there}}</strong>,
              </p>
              
              <div style="color:#334155;">
                {$intro}
              </div>

              {$stepsHtml}

              {$proTipHtml}

              <!-- Primary CTA -->
              <div style="margin:32px 0 24px;text-align:center;">
                <a href="{$ctaUrl}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 2px 4px rgba(79,70,229,0.25);">
                  {$ctaText} →
                </a>
              </div>

              <p style="margin-bottom:0;color:#64748b;font-size:13px;">
                To your automation success,<br>
                <strong>The {$appName} Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.5;">
              <p style="margin:0 0 8px;">
                You are receiving this 30-day curriculum because you registered with <strong>{$appName}</strong>.
              </p>
              <p style="margin:0;">
                <a href="{{unsubscribe_url}}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a> or manage your email preferences anytime.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /**
     * 30-Day Platform Mastery Syllabus.
     */
    private function getPlatformMasterySyllabus(): array
    {
        return [
            [
                'title' => 'Connect Your First Channel in 2 Minutes',
                'subject' => '🚀 Day 1: Connect your first channel & activate instant replies',
                'preheader' => 'Welcome to Botify AI! Here is how to get your first bot live today.',
                'intro' => '<p>Welcome to <strong>Day 1 of your 30-Day Botify AI Masterclass</strong>. Over the next month, we will show you how to automate your communications, capture qualified leads 24/7, and generate revenue on autopilot.</p><p>Today is all about speed to value. Let us connect your first social or messaging channel.</p>',
                'steps' => [
                    'Go to <strong>Settings → Channels</strong> in your Botify AI dashboard.',
                    'Click <strong>Connect WhatsApp</strong> (Cloud API) or link your Facebook/Instagram page.',
                    'Send a test message from your personal phone and watch your unified inbox receive it instantly.',
                ],
                'pro_tip' => 'Connecting WhatsApp Cloud API gives you a 98% open rate compared to standard email. Even starting with 1 channel gets you immediate results.',
                'cta_text' => 'Connect Your First Channel',
                'cta_url' => url('/app/inbox'),
            ],
            [
                'title' => 'Train Your AI Bot with Your Knowledge Base',
                'subject' => '🧠 Day 2: Train your AI bot with your website, PDFs, or FAQs',
                'preheader' => 'Your bot can answer customer questions accurately in seconds.',
                'intro' => '<p>Customers hate waiting. When someone asks about your pricing, business hours, shipping policies, or services at 2 AM, your Botify AI bot should respond instantly with 100% accuracy.</p>',
                'steps' => [
                    'Navigate to <strong>AI Studio → Knowledge Base</strong>.',
                    'Paste your website URL or upload your product catalog/FAQ document.',
                    'Click <strong>Sync & Train</strong>. Our vector indexing reads and memorizes your content automatically.',
                    'Test in the live preview sandbox to see how your bot answers real queries.',
                ],
                'pro_tip' => 'Keep your knowledge base updated with your return policy and pricing tiers. It reduces repetitive support tickets by up to 78%.',
                'cta_text' => 'Set Up Knowledge Base',
                'cta_url' => url('/app/ai-studio'),
            ],
            [
                'title' => 'Master the Unified Omnichannel Inbox',
                'subject' => '📥 Day 3: One inbox for WhatsApp, Instagram, Messenger & SMS',
                'preheader' => 'Stop tab switching between apps. Consolidate every conversation.',
                'intro' => '<p>Juggling conversations across WhatsApp Web, Meta Business Suite, and Instagram DMs wastes hours and leads to missed sales.</p><p>Botify AI brings every conversation into a single, collaborative live team inbox.</p>',
                'steps' => [
                    'Open the <strong>Unified Inbox</strong> from your navigation menu.',
                    'See your active conversations grouped by channel icon.',
                    'Assign conversations to team members or let AI handle the first response.',
                    'Use canned responses (Quick Replies) to answer common questions in 1 click.',
                ],
                'pro_tip' => 'Use keyboard shortcuts in the inbox to quickly tag leads with statuses like "Hot Prospect" or "Requires Follow-up".',
                'cta_text' => 'Open Unified Inbox',
                'cta_url' => url('/app/inbox'),
            ],
            [
                'title' => 'Turn Social Comments into Private Conversations',
                'subject' => '💬 Day 4: Auto-DM anyone who comments on your posts or reels',
                'preheader' => 'Convert social engagement into direct leads and sales.',
                'intro' => '<p>Ever seen viral creators tell people to <em>"Comment PROMO to get the free link"</em>? With Botify AI, you can do this natively on Facebook and Instagram.</p>',
                'steps' => [
                    'Go to <strong>Automations → Comment-to-DM</strong>.',
                    'Choose the post or reel you want to attach the trigger to.',
                    'Define the trigger keyword (e.g. "INFO", "DISCOUNT", or "COURSE").',
                    'Set the private DM reply that automatically delivers your resource or coupon code.',
                ],
                'pro_tip' => 'Always public-reply to the user comment saying "Just sent you a private DM with the details!" — this triggers the Instagram algorithm to push your post higher.',
                'cta_text' => 'Create Comment Automation',
                'cta_url' => url('/app/automations'),
            ],
            [
                'title' => 'Capture Leads with Visual Flowcharts',
                'subject' => '⚡ Day 5: Build an interactive visual lead capture flow',
                'preheader' => 'Collect names, emails, and phone numbers directly in chat.',
                'intro' => '<p>Static web forms are dying. Conversational forms convert 3x higher because customers answer questions one step at a time inside their favorite chat app.</p>',
                'steps' => [
                    'Open the <strong>Visual Flow Builder</strong>.',
                    'Drag an "Ask Question" node onto the canvas (e.g., "What is your best email address?").',
                    'Attach validation so it checks for valid email and phone format.',
                    'Save the response directly into the contact profile in your Botify CRM.',
                ],
                'pro_tip' => 'Keep your initial question super low friction (e.g. multiple choice) before asking for their contact details.',
                'cta_text' => 'Build a Visual Flow',
                'cta_url' => url('/app/flows'),
            ],
            [
                'title' => 'Organize Contacts with Dynamic Tags & Segments',
                'subject' => '🏷️ Day 6: Segmenting your audience for 3x higher open rates',
                'preheader' => 'Never send a generic blast again. Group your buyers and leads.',
                'intro' => '<p>The number one mistake in email and broadcast marketing is sending the same message to everyone. Today we segment your audience so your messages feel tailor-made.</p>',
                'steps' => [
                    'Go to <strong>Marketing Hub → Segments</strong>.',
                    'Click <strong>Build Segment</strong> and choose dynamic rules (e.g., Lifetime Value > $50, or Completed Order Count >= 1).',
                    'Save the segment as "VIP Buyers" or "Registered Non-Purchasers".',
                    'Notice how your recipient count updates in real-time as new users register.',
                ],
                'pro_tip' => 'Targeting "Registered Non-Purchasers" with a first-time discount code typically produces the quickest ROI of any campaign.',
                'cta_text' => 'Build Your First Segment',
                'cta_url' => url('/app/marketing'),
            ],
            [
                'title' => 'Week 1 Review & Your Lead Dashboard',
                'subject' => '🎯 Day 7: Week 1 Milestones & Your Conversion Review',
                'preheader' => 'You are 25% through the masterclass! Let us check your metrics.',
                'intro' => '<p>Congratulations on completing Week 1! You now have a live channel, an AI knowledge base, a unified inbox, and automated lead capture.</p><p>Today, let us review your analytics to see your bot in action.</p>',
                'steps' => [
                    'Open your <strong>Dashboard & Telemetry</strong>.',
                    'Check total messages exchanged and bot resolution percentage.',
                    'Identify any unanswered user queries and add those answers to your Knowledge Base.',
                ],
                'pro_tip' => 'Schedule 10 minutes every Friday to review the top 5 questions users asked your bot this week.',
                'cta_text' => 'View Analytics Dashboard',
                'cta_url' => url('/app/dashboard'),
            ],
            [
                'title' => 'E-Commerce Store & Product Catalog Sync',
                'subject' => '🛍️ Day 8: Showcase products and take orders directly in chat',
                'preheader' => 'Let customers browse your catalog without leaving WhatsApp or Instagram.',
                'intro' => '<p>Friction kills sales. When a customer has to leave their chat app, open a browser, and log in, half of them bounce. Botify AI lets you sync your product catalog directly into chat.</p>',
                'steps' => [
                    'Navigate to <strong>E-Commerce → Products</strong>.',
                    'Add your digital downloads, courses, or physical items with images and prices.',
                    'Use the "/catalog" trigger in chat so customers can browse cards and checkout.',
                ],
                'pro_tip' => 'Digital products and online course memberships have the fastest checkout cycle inside messaging bots.',
                'cta_text' => 'Sync Your Products',
                'cta_url' => url('/app/ecommerce/products'),
            ],
            [
                'title' => 'Recover Abandoned Carts Automatically',
                'subject' => '🛒 Day 9: Recover up to 34% of abandoned checkouts',
                'preheader' => 'Automatically follow up 1 hour after a customer abandons their order.',
                'intro' => '<p>Over 70% of online shopping carts are abandoned. By sending an automatic gentle reminder via WhatsApp or Email within 60 minutes, you can recover a significant percentage of lost revenue.</p>',
                'steps' => [
                    'Go to <strong>Automations → Cart Recovery</strong>.',
                    'Enable the 1-hour abandoned cart trigger.',
                    'Include a dynamic 10% coupon code or free shipping incentive.',
                    'Preview the message on your own phone.',
                ],
                'pro_tip' => 'Include an image of the item they left in their cart in the WhatsApp reminder for maximum recall.',
                'cta_text' => 'Enable Cart Recovery',
                'cta_url' => url('/app/automations'),
            ],
            [
                'title' => 'Broadcast Campaigns with Isolated SMTP Streams',
                'subject' => '📢 Day 10: How to broadcast newsletters with 0 spam penalties',
                'preheader' => 'Keep your transactional password resets safe while sending marketing bursts.',
                'intro' => '<p>Sending bulk marketing emails on the same IP as your password reset emails is dangerous. Botify AI isolates bulk marketing campaigns onto dedicated SMTP servers.</p>',
                'steps' => [
                    'In <strong>Marketing Hub → Campaign Builder</strong>, choose your targeted cohort.',
                    'Select your dedicated Marketing SMTP server from the dropdown.',
                    'Hit <strong>Test Send</strong> to preview the email directly in your inbox.',
                ],
                'pro_tip' => 'Always verify your DKIM and SPF records in your domain DNS to ensure 99%+ deliverability directly into the Primary inbox.',
                'cta_text' => 'Launch a Broadcast Campaign',
                'cta_url' => url('/app/marketing'),
            ],
            [
                'title' => 'AI Sentiment Analysis & Human Agent Handoff',
                'subject' => '🤝 Day 11: Detect frustration and smoothly hand off to human agents',
                'preheader' => 'Your bot knows when to step aside for VIP customers.',
                'intro' => '<p>AI should empower your human team, not replace human judgment when emotions are high. Botify AI monitors conversation sentiment in real-time.</p>',
                'steps' => [
                    'Enable <strong>Sentiment Handoff</strong> in your AI Settings.',
                    'Set trigger threshold: when sentiment drops below neutral or user says "speak to human".',
                    'The bot pauses automated responses and notifies your available team agents.',
                ],
                'pro_tip' => 'Configure email or browser push notifications so your team can jump into high-priority chats immediately.',
                'cta_text' => 'Configure Agent Handoff',
                'cta_url' => url('/app/ai-studio'),
            ],
            [
                'title' => 'Connect External Webhooks & Zapier',
                'subject' => '🔗 Day 12: Sync Botify AI with your CRM, Google Sheets, or Stripe',
                'preheader' => 'Push new leads and purchase events wherever you need them.',
                'intro' => '<p>Your marketing data should never be trapped in a silo. Today we connect Botify AI to your external tech stack using Webhooks.</p>',
                'steps' => [
                    'Go to <strong>Settings → Webhooks</strong>.',
                    'Create an outgoing webhook for events like "lead.captured" or "order.paid".',
                    'Paste your Zapier, Make.com, or custom endpoint URL.',
                    'Test a trigger to verify instant payload transmission.',
                ],
                'pro_tip' => 'Sending captured lead phone numbers directly to a Google Sheet provides an instant real-time backup for your sales reps.',
                'cta_text' => 'Set Up Webhooks',
                'cta_url' => url('/app/settings'),
            ],
            [
                'title' => 'Accept Payments via Stripe, Paystack & PayPal',
                'subject' => '💳 Day 13: Collect card payments & generate instant receipts in chat',
                'preheader' => 'Seamless in-chat checkout with automatic tax & order receipts.',
                'intro' => '<p>Speed up your cash flow by letting customers pay right when their buying intent is highest.</p>',
                'steps' => [
                    'Go to <strong>Settings → Payment Gateways</strong>.',
                    'Connect your Stripe, Paystack, or Razorpay credentials.',
                    'Generate payment links inside chat flows with automated paid confirmations.',
                ],
                'pro_tip' => 'Customers who receive a branded PDF invoice within 30 seconds of payment have 85% fewer refund requests.',
                'cta_text' => 'Connect Payment Gateway',
                'cta_url' => url('/app/settings'),
            ],
            [
                'title' => 'Two-Week Milestone: The Power of Re-Engagement',
                'subject' => '🔥 Day 14: Halfway there! Re-engage inactive users with 1 click',
                'preheader' => 'Wake up subscribers who have not opened your emails or chats.',
                'intro' => '<p>You have made it to the 2-week mark! Today we run a high-yield reactivation sequence for users who registered but haven’t returned.</p>',
                'steps' => [
                    'In <strong>Marketing Hub → Audience Explorer</strong>, select the <strong>Only Inactive Customers</strong> preset.',
                    'Click <strong>Create Campaign for this Cohort</strong>.',
                    'Use our AI assistant with the prompt: <em>"Re-engage inactive users with a special resource"</em>.',
                ],
                'pro_tip' => 'A subject line like "Quick question about your account" gets an average 48% open rate on win-back cohorts.',
                'cta_text' => 'Review Inactive Cohort',
                'cta_url' => url('/app/marketing'),
            ],
            [
                'title' => 'Build Multi-Language Bots with Auto-Translation',
                'subject' => '🌐 Day 15: Expand globally: Bot auto-translates in 50+ languages',
                'preheader' => 'Communicate with global customers in their native language.',
                'intro' => '<p>Over 72% of consumers prefer browsing and buying in their native language. Botify AI features automatic real-time translation.</p>',
                'steps' => [
                    'Go to <strong>AI Studio → Translation Engine</strong>.',
                    'Enable auto-detect language on inbound conversations.',
                    'Your bot will understand questions in Spanish, French, Arabic, German, or Portuguese and reply fluently.',
                ],
                'pro_tip' => 'You do not need to rewrite your FAQs in every language. The AI translates your core knowledge base dynamically on the fly.',
                'cta_text' => 'Configure Languages',
                'cta_url' => url('/app/ai-studio'),
            ],
            [
                'title' => 'Drive In-Store & Event Traffic with QR Codes',
                'subject' => '📱 Day 16: Click-to-chat QR codes for print, packaging & booths',
                'preheader' => 'Turn offline foot traffic into online automated conversations.',
                'intro' => '<p>QR codes are the fastest bridge between the physical and digital world. Print them on packaging, flyers, or business cards to start automated WhatsApp or Messenger chats.</p>',
                'steps' => [
                    'Go to <strong>Growth Tools → QR Code Generator</strong>.',
                    'Select your channel and pre-fill a message (e.g. "I want the event coupon!").',
                    'Download high-res PNG or SVG to place on your marketing materials.',
                ],
                'pro_tip' => 'Placing a "Scan to check order status or get VIP perks" QR code on packaging inserts turns buyers into repeat customers.',
                'cta_text' => 'Generate QR Codes',
                'cta_url' => url('/app/growth'),
            ],
            [
                'title' => 'Multi-Channel Drip Sequences (Email + WhatsApp)',
                'subject' => '🔄 Day 17: Combine Email & WhatsApp for unstoppable follow-ups',
                'preheader' => 'Email for detailed newsletters. WhatsApp for urgent alerts.',
                'intro' => '<p>Why choose between email and messaging apps when you can orchestrate both? Discover omnichannel sequencing.</p>',
                'steps' => [
                    'Trigger Day 1 via Email with your comprehensive guide.',
                    'If the email is unread after 24 hours, trigger a short WhatsApp alert.',
                    'Watch your combined response rates surge above 80%.',
                ],
                'pro_tip' => 'Reserve WhatsApp for time-sensitive, high-value alerts so your contacts always view your messages as urgent and important.',
                'cta_text' => 'Build Drip Sequence',
                'cta_url' => url('/app/marketing'),
            ],
            [
                'title' => 'VIP Customer Tier & High-Value Segmentation',
                'subject' => '⭐ Day 18: Treat your top 10% customers like royalty',
                'preheader' => 'The 80/20 rule: 20% of your customers generate 80% of your profit.',
                'intro' => '<p>Your VIP buyers deserve exclusive perks, early access to new releases, and personalized appreciation.</p>',
                'steps' => [
                    'Open <strong>Marketing Hub → Overview</strong> and review your <strong>VIP Threshold</strong>.',
                    'Filter for customers with lifetime spending above the threshold.',
                    'Send them a private appreciation note with a preview of upcoming features.',
                ],
                'pro_tip' => 'Personalized messages from the founder to top customers result in high referral and word-of-mouth growth.',
                'cta_text' => 'View VIP Customers',
                'cta_url' => url('/app/marketing'),
            ],
            [
                'title' => 'Automated Google Review & Social Proof Engine',
                'subject' => '🌟 Day 19: Collect 5-star Google reviews on autopilot',
                'preheader' => 'Turn happy customers into your best marketing asset.',
                'intro' => '<p>93% of customers read online reviews before buying. Asking for reviews manually is awkward and often forgotten. Let your bot do it right after a successful purchase.</p>',
                'steps' => [
                    'Add a "Review Request" delay node 24 hours after an order is marked delivered.',
                    'Ask: <em>"How was your experience from 1 to 5?"</em>',
                    'If 4 or 5, direct them straight to your Google Reviews link. If 1 to 3, route to customer support.',
                ],
                'pro_tip' => 'This smart gating protects your public reputation while giving unhappy customers immediate private resolution.',
                'cta_text' => 'Set Up Review Automation',
                'cta_url' => url('/app/automations'),
            ],
            [
                'title' => 'Team Collaboration, Roles & Permissions',
                'subject' => '👥 Day 20: Scale your team without sharing passwords',
                'preheader' => 'Assign roles, track agent response times, and protect sensitive data.',
                'intro' => '<p>As your business grows, multiple team members will handle sales, support, and marketing. Botify AI includes enterprise role-based access control.</p>',
                'steps' => [
                    'Go to <strong>Settings → Team Members</strong>.',
                    'Invite team members with specific roles (Admin, Agent, Marketer, Viewer).',
                    'Set business hours and auto-routing so incoming chats go to active reps.',
                ],
                'pro_tip' => 'Use internal notes inside conversations to brief colleagues before transferring a chat.',
                'cta_text' => 'Invite Team Members',
                'cta_url' => url('/app/settings'),
            ],
            [
                'title' => 'Advanced AI Prompt Engineering for Higher Conversions',
                'subject' => '✍️ Day 21: Fine-tune your AI bot persona and closing technique',
                'preheader' => 'Transform a generic bot into an enthusiastic, consultative sales agent.',
                'intro' => '<p>Your AI system prompt defines how your bot speaks, negotiates, and closes deals.</p>',
                'steps' => [
                    'Go to <strong>AI Studio → Bot Persona</strong>.',
                    'Specify your brand voice: "Consultative, friendly, expert, and proactive".',
                    'Add explicit closing instructions: "Always ask a closing question before ending responses".',
                ],
                'pro_tip' => 'Instruct your bot to offer 2 choices rather than open-ended questions: e.g. "Would you prefer morning or afternoon?"',
                'cta_text' => 'Tune Bot Persona',
                'cta_url' => url('/app/ai-studio'),
            ],
            [
                'title' => 'Run A/B Tests on Email Subject Lines & Offers',
                'subject' => '🧪 Day 22: Double your clicks by running A/B experiments',
                'preheader' => 'Never guess which headline works best. Let real data decide.',
                'intro' => '<p>Small changes in your subject lines can double your opens and revenue. Today we test two different angles.</p>',
                'steps' => [
                    'Draft a campaign with 2 subject variants (e.g. curiosity angle vs. discount angle).',
                    'Send a test email of both to yourself and team.',
                    'Review telemetry to see which angle drove higher engagement.',
                ],
                'pro_tip' => 'Curiosity-based subject lines often win opens, while benefit-driven subject lines win higher click-through rates.',
                'cta_text' => 'Draft A/B Campaign',
                'cta_url' => url('/app/marketing'),
            ],
            [
                'title' => 'SMS Broadcasts for Flash Sales & Urgent Alerts',
                'subject' => '📲 Day 23: Send urgent SMS alerts with 90-second read times',
                'preheader' => 'When emails go unread, SMS delivers instant notification.',
                'intro' => '<p>90% of all SMS messages are read within 3 minutes of delivery. When you have a flash sale ending at midnight, SMS is unmatched.</p>',
                'steps' => [
                    'Check your SMS driver settings in <strong>Broadcasting → SMS Setup</strong>.',
                    'Keep your message concise (under 160 characters).',
                    'Include a tracked short link to measure exact clicks.',
                ],
                'pro_tip' => 'Always state your brand name in the very first 3 words of an SMS so recipients know immediately who is reaching out.',
                'cta_text' => 'Configure SMS Broadcasting',
                'cta_url' => url('/app/marketing'),
            ],
            [
                'title' => 'Analytics Deep Dive: Spotting Funnel Drop-Offs',
                'subject' => '📊 Day 24: Uncover where leads drop off in your visual funnels',
                'preheader' => 'Plug the leaks in your conversational sales pipeline.',
                'intro' => '<p>If 100 people start your flow but only 10 finish, where did the other 90 stop? Funnel analytics gives you the exact answer.</p>',
                'steps' => [
                    'Open <strong>Flow Builder → Analytics View</strong>.',
                    'Inspect the drop-off percentage on each question node.',
                    'Simplify any question where more than 20% of users abandon.',
                ],
                'pro_tip' => 'If users drop off at a question asking for phone numbers, make it optional or explain why you need it ("So our technician can text your tracking number").',
                'cta_text' => 'Inspect Flow Analytics',
                'cta_url' => url('/app/flows'),
            ],
            [
                'title' => 'Compliance, GDPR & One-Click Unsubscribe',
                'subject' => '🛡️ Day 25: Ensure 100% compliance with RFC 8058 & GDPR rules',
                'preheader' => 'Build customer trust with transparent privacy controls.',
                'intro' => '<p>Modern mail providers (Google, Yahoo, Microsoft) enforce strict sender requirements. Botify AI automatically injects RFC 8058 One-Click headers and consent toggles.</p>',
                'steps' => [
                    'Review your <strong>Marketing Hub Suppression List</strong>.',
                    'Check that bounced and unsubscribed contacts are cleanly isolated.',
                    'Verify that every marketing email includes your legal footer address.',
                ],
                'pro_tip' => 'A clean suppression list improves your sender reputation score with Google and Yahoo, keeping you out of the spam folder.',
                'cta_text' => 'Review Compliance Settings',
                'cta_url' => url('/app/marketing'),
            ],
            [
                'title' => 'Botify Academy: Level Up with Free Video Courses',
                'subject' => '🎓 Day 26: Become a certified Botify AI automation expert',
                'preheader' => 'Access free video courses, templates, and proven swipe files.',
                'intro' => '<p>Did you know you have free access to the complete Botify Academy? Learn real-world playbooks used by leading e-commerce and SaaS brands.</p>',
                'steps' => [
                    'Click <strong>Academy</strong> in your navigation bar.',
                    'Watch the 15-minute quick course on high-converting conversational copy.',
                    'Download ready-made flow templates directly into your workspace.',
                ],
                'pro_tip' => 'Completing the Academy courses teaches you how to white-label Botify AI for your own consulting clients.',
                'cta_text' => 'Explore Botify Academy',
                'cta_url' => url('/app/academy'),
            ],
            [
                'title' => 'Agency White-Label & Multi-Workspace Setup',
                'subject' => '🏢 Day 27: Offer Botify AI to clients as your own white-label agency',
                'preheader' => 'Create isolated workspaces and bill clients recurring monthly retainers.',
                'intro' => '<p>Many of our power users are agency owners who resell conversational automation services for $1,000–$5,000/month per client.</p>',
                'steps' => [
                    'Create isolated workspaces for each client from your account switcher.',
                    'Each client gets their own channels, contacts, campaigns, and team members.',
                    'You retain centralized master administration and billing control.',
                ],
                'pro_tip' => 'Charging clients a monthly management fee to monitor their bots and run weekly broadcast campaigns is the most reliable agency recurring revenue model.',
                'cta_text' => 'Manage Workspaces',
                'cta_url' => url('/app/dashboard'),
            ],
            [
                'title' => 'Scaling to 100,000 Conversations per Month',
                'subject' => '🚀 Day 28: Infrastructure check: Handling high-volume traffic spikes',
                'preheader' => 'How Botify AI handles massive traffic bursts without slowdowns.',
                'intro' => '<p>Running a Black Friday promotion or viral campaign? Learn how our background queue architecture automatically scales to absorb traffic spikes.</p>',
                'steps' => [
                    'Ensure rate-limits are configured on your channels to stay within provider quotas.',
                    'Warm up your custom SMTP domain with gradual daily increments.',
                    'Use auto-scaling queue workers to process thousands of recipients per minute.',
                ],
                'pro_tip' => 'Stagger your campaign launch windows across timezones so your server and support team are never overwhelmed at once.',
                'cta_text' => 'Check System Health',
                'cta_url' => url('/admin/system-health'),
            ],
            [
                'title' => 'Your 30-Day Transformation & Next Milestones',
                'subject' => '🏆 Day 29: Look how far your marketing automation has come!',
                'preheader' => 'Celebrate your milestones and plan your next growth phase.',
                'intro' => '<p>From Day 1 to Day 29, you have transformed your customer acquisition, retention, and support into an automated machine.</p>',
                'steps' => [
                    'Review your total contacts gained over the last 30 days.',
                    'Calculate the hours saved by your automated AI replies.',
                    'Identify your highest performing campaign and turn it into an ongoing recurring sequence.',
                ],
                'pro_tip' => 'Share your success metrics with your team to celebrate the collective time saved.',
                'cta_text' => 'View 30-Day Growth Telemetry',
                'cta_url' => url('/app/marketing'),
            ],
            [
                'title' => 'The Master Automation Flywheel & Future Roadmap',
                'subject' => '🌟 Day 30: You made it! The perpetual automation flywheel',
                'preheader' => 'Your 30-day foundation is complete. What will you build next?',
                'intro' => '<p>Congratulations on completing the <strong>Full 30-Day Botify AI Masterclass</strong>! You are now among the top 5% of modern conversational marketers.</p><p>Automation is not a one-time project; it is a compounding engine that works for you every minute of every day.</p>',
                'steps' => [
                    'Keep your sequence campaigns active so new subscribers receive them automatically.',
                    'Check our monthly product release notes for brand-new AI capabilities.',
                    'Join our private community of builders and share your best automations.',
                ],
                'pro_tip' => 'Now that your 30-day sequence is dialed in, it will nurture every future subscriber on complete autopilot for years to come.',
                'cta_text' => 'Open Marketing Hub',
                'cta_url' => url('/app/marketing'),
            ],
        ];
    }

    /**
     * 30-Day SaaS Onboarding Syllabus.
     */
    private function getSaasOnboardingSyllabus(): array
    {
        $days = [];
        $topics = [
            1 => ['title' => 'Welcome to Botify AI: Your 5-Minute Tour', 'benefit' => 'discover how our unified platform saves you 15+ hours every week'],
            2 => ['title' => 'Connecting Your Core Channels', 'benefit' => 'never miss another inbound customer message'],
            3 => ['title' => 'Building Your First Automated Flow', 'benefit' => 'capture qualified leads even while you sleep'],
            4 => ['title' => 'Training Your AI Assistant with 1-Click', 'benefit' => 'answer 80% of customer questions without typing a word'],
            5 => ['title' => 'Case Study: How SaaS Startups 3x Conversions', 'benefit' => 'actionable tactics you can implement right now'],
            6 => ['title' => 'Inviting Your Teammates & Setting Roles', 'benefit' => 'collaborate seamlessly without sharing passwords'],
            7 => ['title' => 'Week 1 Check-In: Unlocking Pro Features', 'benefit' => 'see the advanced analytics inside your workspace'],
            8 => ['title' => 'Integrating with Your Favorite Tools via Webhooks', 'benefit' => 'push lead data directly to your CRM or database'],
            9 => ['title' => 'Smart Customer Tagging & Segmentation', 'benefit' => 'target high-intent prospects with surgical precision'],
            10 => ['title' => 'The Power of Omnichannel Inbox', 'benefit' => 'WhatsApp, Messenger, Instagram, and Email in one window'],
            11 => ['title' => 'Setting Up Sentiment & Agent Handoff', 'benefit' => 'know instantly when a VIP customer needs special attention'],
            12 => ['title' => 'Automated Drip Follow-ups for Non-Responders', 'benefit' => 'turn cold signups into active daily users'],
            13 => ['title' => 'Why Fast Response Times Win Deals', 'benefit' => 'companies replying within 5 minutes are 21x more likely to convert'],
            14 => ['title' => 'Two-Week Health Check: Your Account Audit', 'benefit' => 'review your telemetry and fix any drop-off points'],
            15 => ['title' => 'Upgrading to Pro: Unlimited Workflows & Channels', 'benefit' => 'unlock high-throughput queues and priority delivery'],
            16 => ['title' => 'Custom AI Prompts & Brand Voice Guidelines', 'benefit' => 'make your bot sound exactly like your best sales rep'],
            17 => ['title' => 'Collecting Payments & Subscriptions Directly in Chat', 'benefit' => 'reduce payment friction and churn'],
            18 => ['title' => 'Creating Click-to-Chat Growth Loops', 'benefit' => 'turn ad spend into profitable two-way conversations'],
            19 => ['title' => 'Weekly Mastermind: Top Botify AI Workflows', 'benefit' => 'steal the top 3 highest-converting templates'],
            20 => ['title' => 'Enterprise Security & Compliance Features', 'benefit' => 'how we protect your customer data with role-based isolation'],
            21 => ['title' => 'Automated Review & Social Proof Engine', 'benefit' => 'gather 5-star ratings without manual outreach'],
            22 => ['title' => 'Running A/B Tests on Email & Bot Copy', 'benefit' => 'scientific optimization for maximum ROI'],
            23 => ['title' => 'SMS Fallback for Urgent Notifications', 'benefit' => 'reach customers when email goes unread'],
            24 => ['title' => 'Advanced Visual Logic & Branching Nodes', 'benefit' => 'build sophisticated decision trees with ease'],
            25 => ['title' => 'Botify Academy Certification', 'benefit' => 'earn your badge and join our expert directory'],
            26 => ['title' => 'White-Label Agency Features for Consultants', 'benefit' => 'turn your automation knowledge into recurring client retainers'],
            27 => ['title' => 'High-Volume Scaling Architecture', 'benefit' => 'handle 100k+ messages without breaking a sweat'],
            28 => ['title' => 'Exclusive Annual Plan Discount', 'benefit' => 'save 2 months of subscription fees today'],
            29 => ['title' => 'Your 30-Day Retention Summary', 'benefit' => 'inspect the compounding value of your automations'],
            30 => ['title' => 'The Automated Future: What to Build Next', 'benefit' => 'your playbook for ongoing scale and growth'],
        ];

        foreach ($topics as $dayNum => $info) {
            $days[] = [
                'title' => $info['title'],
                'subject' => "Day {$dayNum}: {$info['title']} 🚀",
                'preheader' => "Here is how to {$info['benefit']} with Botify AI.",
                'intro' => "<p>Welcome to <strong>Day {$dayNum} of your SaaS Onboarding Journey</strong>. Today we focus on how to {$info['benefit']}.</p><p>Taking action on this single step will dramatically accelerate your results.</p>",
                'steps' => [
                    "Open your <strong>Botify AI Workspace</strong>.",
                    "Follow the 3-minute guided walkthrough for {$info['title']}.",
                    "Verify the changes and see your live metrics update.",
                ],
                'pro_tip' => 'Consistent daily micro-actions build a complete, resilient automation flywheel that compounds over time.',
                'cta_text' => "Complete Day {$dayNum} Step",
                'cta_url' => url('/app/dashboard'),
            ];
        }

        return $days;
    }

    /**
     * 30-Day E-Commerce Growth Syllabus.
     */
    private function getEcommerceGrowthSyllabus(): array
    {
        $days = [];
        $topics = [
            1 => 'Sync Your Product Catalog with WhatsApp & Messenger',
            2 => 'Set Up Instant Order Confirmation & Tracking Updates',
            3 => 'The 1-Hour Abandoned Cart Recovery Sequence',
            4 => 'Automated Flash Sales & Weekend Promo Blasts',
            5 => 'Turning Instagram Comments into Product Checkouts',
            6 => 'Offering Limited-Time Coupon Codes with Countdown Timers',
            7 => 'Week 1 Sales Review: Your Conversion Rate Baseline',
            8 => 'Segmenting One-Time Buyers vs. Repeat Customers',
            9 => 'Upsell & Cross-Sell Automations Post-Purchase',
            10 => 'Handling Customer Returns & FAQ Inquiries Automatically',
            11 => 'Collecting Customer Reviews & User-Generated Content',
            12 => 'Click-to-WhatsApp Ads for 4x Higher ROAS',
            13 => 'VIP Loyalty Club: Rewarding Your Top 10% Spenders',
            14 => 'Two-Week Revenue Check: Tracking Recovered Sales',
            15 => 'Restock & Back-in-Stock Instant Alerts',
            16 => 'Running Interactive Product Recommendation Quizzes',
            17 => 'Optimizing Mobile Checkout Speed in Chat',
            18 => 'Holiday & Seasonal Campaign Planning Playbook',
            19 => 'Re-engaging Customers Who Haven’t Ordered in 60 Days',
            20 => 'International Orders: Multi-Currency & Local Shipping Info',
            21 => 'Packaging Inserts with QR Codes for Repeat Orders',
            22 => 'Wholesale & B2B Inquiry Fast-Track Routing',
            23 => 'Preventing Cart Abandonment with Exit-Intent Chat Triggers',
            24 => 'Analyzing Product Cohorts & Customer Lifetime Value',
            25 => 'Integrating Payment Gateways with Auto-Tax Calculation',
            26 => 'Omnichannel Flash Sale: Coordinating Email, SMS & Chat',
            27 => 'Automating Live Agent Support for High-Ticket Items',
            28 => 'The Referral Flywheel: Give $10, Get $10 Viral Loops',
            29 => 'Reviewing Your Monthly E-Commerce Telemetry',
            30 => 'Your Perpetual E-Commerce Growth Blueprint',
        ];

        foreach ($topics as $dayNum => $title) {
            $days[] = [
                'title' => $title,
                'subject' => "Day {$dayNum}: {$title} 🛍️",
                'preheader' => "Boost your store sales and customer retention with this 3-minute action.",
                'intro' => "<p>Welcome to <strong>Day {$dayNum} of your 30-Day E-Commerce Revenue Accelerator</strong>.</p><p>Today we implement <strong>{$title}</strong> to turn casual browsers into loyal, high-spending customers.</p>",
                'steps' => [
                    "Open <strong>Marketing Hub → E-Commerce Automations</strong>.",
                    "Review the recommended copy and configure your promotion.",
                    "Activate the automation or schedule the campaign.",
                ],
                'pro_tip' => 'Stores that combine automated WhatsApp cart reminders with email recovery see an average 34% recovery rate.',
                'cta_text' => 'Set Up E-Commerce Flow',
                'cta_url' => url('/app/ecommerce/products'),
            ];
        }

        return $days;
    }

    /**
     * 30-Day Agency Lead Generation Syllabus.
     */
    private function getAgencyLeadgenSyllabus(): array
    {
        $days = [];
        $topics = [
            1 => 'Defining Your High-Ticket Service & Irresistible Offer',
            2 => 'Setting Up Your Lead Capture Landing Page & Chat Widget',
            3 => 'Automating Calendar Bookings Directly Inside Chat',
            4 => 'Qualifying Leads Before They Book: Form Questions That Filter',
            5 => 'The 5-Minute Inbound Lead Call-Back Automation',
            6 => 'Automated Appointment Reminders (0% No-Show Rate)',
            7 => 'Week 1 Pipeline Review: Booking Your First 5 Qualified Calls',
            8 => 'Outbound LinkedIn & Social Lead Nurturing Workflows',
            9 => 'Sending Case Studies & Video Proof Automatically',
            10 => 'Handling the "How Much Does It Cost?" Question with AI',
            11 => 'Routing Enterprise Inquiries to Senior Account Executives',
            12 => 'Post-Call Proposal Delivery & Instant Tracking Alerts',
            13 => 'Following Up with Unclosed Leads on a 3-Day Cadence',
            14 => 'Two-Week Deal Velocity Check: Shortening Your Sales Cycle',
            15 => 'Creating a Multi-Channel Inbound Funnel for Meta Ads',
            16 => 'Automated Referral Requests for Satisfied Clients',
            17 => 'Reselling Botify AI to Your Clients as an Agency Retainer',
            18 => 'Building White-Label Workspaces for Your Client Accounts',
            19 => 'Webhooks to HubSpot, Salesforce, or HighLevel CRM',
            20 => 'Overcoming Common Objections with Conversational AI',
            21 => 'Reactivating Dormant Leads from the Past 6 Months',
            22 => 'Using SMS for Urgent Rescheduling & Fast Confirmations',
            23 => 'Packaging Case Studies into Shareable Mini-Newsletters',
            24 => 'Analyzing Cost-Per-Acquisition Across Channels',
            25 => 'Building a High-Converting Interactive Audit Quiz',
            26 => 'Team Collaboration: Round-Robin Lead Assignment',
            27 => 'Scaling Up Paid Ad Spend Safely with Chat Qualification',
            28 => 'Closing Annual Pre-Pay Retainers with Special Perks',
            29 => 'Monthly Agency Pipeline Metrics & Forecasts',
            30 => 'The 7-Figure Agency Lead Machine: Next Level Playbook',
        ];

        foreach ($topics as $dayNum => $title) {
            $days[] = [
                'title' => $title,
                'subject' => "Day {$dayNum}: {$title} 💼",
                'preheader' => "Land more high-paying clients and automate your booking pipeline.",
                'intro' => "<p>Welcome to <strong>Day {$dayNum} of the Agency & Consultant Lead Gen Machine</strong>.</p><p>Today is dedicated to <strong>{$title}</strong>, designed to fill your calendar with pre-qualified prospects ready to buy.</p>",
                'steps' => [
                    "Open <strong>Marketing Hub → Campaigns & Flows</strong>.",
                    "Review your lead capture and follow-up templates.",
                    "Activate today's tactic to start generating qualified appointment requests.",
                ],
                'pro_tip' => 'Qualifying leads with 2 multiple-choice questions before offering calendar slots increases close rates on sales calls by 45%.',
                'cta_text' => 'Deploy Lead Funnel',
                'cta_url' => url('/app/marketing'),
            ];
        }

        return $days;
    }

    /**
     * AI-generated custom 30-day curriculum.
     */
    private function generateWithAi(string $customPrompt, Carbon $start, string $cadence, int $workspaceId): array
    {
        try {
            $provider = LlmManager::forWorkspace($workspaceId);
            $prompt = "You are a World-Class Email Marketing & Lifecycle Sequence Architect for " . config('app.name') . ".
Create a full 30-day newsletter sequence based on the following custom goal:
\"{$customPrompt}\"

Generate 30 distinct daily curriculum entries.
Return a valid JSON array of objects, with exactly 30 items:
[
  {
    \"day\": 1,
    \"title\": \"Short catchy title\",
    \"subject\": \"High open-rate email subject line with emojis and personalization\",
    \"preheader\": \"Inbox preview text\",
    \"intro\": \"<p>Introductory paragraph with HTML markup...</p>\",
    \"steps\": [\"Step 1 description\", \"Step 2 description\", \"Step 3 description\"],
    \"pro_tip\": \"Actionable pro tip sentence\",
    \"cta_text\": \"Button text\",
    \"cta_url\": \"/app/dashboard\"
  }
  ... (up to day 30)
]
Output ONLY valid JSON.";

            $response = $provider->completeText($prompt);
            $jsonStr = trim($response);

            // Strip markdown code fences if wrapped
            if (str_starts_with($jsonStr, '```')) {
                $jsonStr = preg_replace('/^```(?:json)?\s*/i', '', $jsonStr);
                $jsonStr = preg_replace('/\s*```$/', '', $jsonStr);
            }

            $decoded = json_decode($jsonStr, true);
            if (is_array($decoded) && count($decoded) >= 15) {
                $days = [];
                foreach ($decoded as $index => $item) {
                    $dayNum = (int) ($item['day'] ?? ($index + 1));
                    $scheduledDate = $this->calculateScheduleDate($start, $dayNum, $cadence);

                    $htmlBody = $this->buildEmailHtml([
                        'day_badge' => "Day {$dayNum} of 30",
                        'headline' => $item['title'] ?? "Day {$dayNum}",
                        'intro' => $item['intro'] ?? '',
                        'steps' => $item['steps'] ?? [],
                        'pro_tip' => $item['pro_tip'] ?? null,
                        'cta_text' => $item['cta_text'] ?? 'Open Botify AI',
                        'cta_url' => $item['cta_url'] ?? url('/app/dashboard'),
                    ]);

                    $days[] = [
                        'day' => $dayNum,
                        'title' => $item['title'] ?? "Day {$dayNum}",
                        'subject' => $item['subject'] ?? "Day {$dayNum} Update",
                        'preheader' => $item['preheader'] ?? '',
                        'cta_text' => $item['cta_text'] ?? 'Open Botify AI',
                        'cta_url' => $item['cta_url'] ?? url('/app/dashboard'),
                        'body' => $htmlBody,
                        'scheduled_at' => $scheduledDate->toIso8601String(),
                        'scheduled_formatted' => $scheduledDate->format('M j, Y \a\t g:i A'),
                        'enabled' => true,
                    ];
                }
                return $days;
            }
        } catch (\Throwable $e) {
            Log::info('NewsletterSequenceService::generateWithAi fallback to preset', [
                'error' => $e->getMessage(),
            ]);
        }

        return [];
    }
}
