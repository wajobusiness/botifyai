<?php

namespace App\Services\Mail;

use App\Models\SmtpConfiguration;
use App\Models\Template;
use App\Modules\Broadcasting\Models\WorkspaceSmtpConfig;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailService
{
    /**
     * Send an email using the active SMTP configuration and an email template by key.
     *
     * @param  array<string, string>  $replacements  e.g. ['app_name' => 'CloudPOS', 'plan_name' => 'Pro', 'user_name' => 'John']
     */
    public function sendWithTemplate(string $templateKey, string $to, array $replacements = []): bool
    {
        $smtp = SmtpConfiguration::getActive();
        if (! $smtp) {
            Log::warning('MailService: No active SMTP configuration. Email not sent.', ['to' => $to, 'template' => $templateKey]);

            return false;
        }

        $template = Template::where('type', 'email')->where('slug', $templateKey)->first();
        if ($template) {
            if (! $template->enabled) {
                Log::info('MailService: Email template is explicitly disabled.', ['key' => $templateKey]);

                return false;
            }
            $rawSubject = $template->subject ?? $template->name;
            $rawBody = $template->content ?? '';
        } else {
            $fallback = $this->resolveDefaultTemplate($templateKey);
            if (! $fallback) {
                Log::warning('MailService: Email template not found and no default fallback available.', ['key' => $templateKey]);

                return false;
            }
            $rawSubject = $fallback['subject'];
            $rawBody = $fallback['content'];
        }

        $subject = $this->replacePlaceholders($rawSubject, $replacements);
        $body = $this->replacePlaceholders($rawBody, $replacements);

        // Transactional mail must never surface an SMTP error to the end user.
        // Swallow send failures here (already logged in sendRaw) and report a
        // simple false so callers fall back gracefully. Campaign delivery and
        // admin test-send use sendRaw directly and keep the thrown exception.
        try {
            return $this->sendRaw($smtp, $to, $subject, $body);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Send a raw email using the given SMTP configuration.
     *
     * @param  SmtpConfiguration|WorkspaceSmtpConfig  $smtp
     * @param  array<string, string>  $extraHeaders  Additional RFC headers (e.g. List-Unsubscribe)
     * @param  string|null  $fromEmail   Override the SMTP default from address
     * @param  string|null  $fromName    Override the SMTP default from name
     * @param  string|null  $replyTo     Optional reply-to address
     */
    public function sendRaw(
        Model $smtp,
        string $to,
        string $subject,
        string $bodyHtml,
        array $extraHeaders = [],
        ?string $fromEmail = null,
        ?string $fromName = null,
        ?string $replyTo = null,
    ): bool {
        $smtpFromEmail = $smtp->from_email ?: (filter_var((string) $smtp->username, FILTER_VALIDATE_EMAIL) ? $smtp->username : config('mail.from.address', 'noreply@botifyai.cloud'));
        $smtpFromName = $smtp->from_name ?: config('mail.from.name', config('app.name'));
        $effectiveFromEmail = $fromEmail ?: $smtpFromEmail;
        $effectiveFromName = $fromName ?: $smtpFromName;

        try {
            $this->configureMailer($smtp);
            Mail::mailer('dynamic_smtp')->html($bodyHtml, function ($message) use ($to, $subject, $extraHeaders, $effectiveFromEmail, $effectiveFromName, $replyTo) {
                $message->to($to)
                    ->subject($subject)
                    ->from($effectiveFromEmail, $effectiveFromName);

                if ($replyTo) {
                    $message->replyTo($replyTo);
                }

                foreach ($extraHeaders as $name => $value) {
                    $message->getHeaders()->addTextHeader($name, $value);
                }
            });

            return true;
        } catch (\Throwable $e) {
            // Many SMTP relays (Hostinger, cPanel, Titan, Gmail, SES) reject custom From addresses
            // that do not match the authenticated mailbox. Retry once using $smtpFromEmail + Reply-To.
            if ($fromEmail && $smtpFromEmail && strtolower($fromEmail) !== strtolower($smtpFromEmail)) {
                try {
                    $fallbackReplyTo = $replyTo ?: $fromEmail;
                    Mail::mailer('dynamic_smtp')->html($bodyHtml, function ($message) use ($to, $subject, $extraHeaders, $smtpFromEmail, $effectiveFromName, $fallbackReplyTo) {
                        $message->to($to)
                            ->subject($subject)
                            ->from($smtpFromEmail, $effectiveFromName)
                            ->replyTo($fallbackReplyTo);

                        foreach ($extraHeaders as $name => $value) {
                            $message->getHeaders()->addTextHeader($name, $value);
                        }
                    });

                    return true;
                } catch (\Throwable $retryEx) {
                    $e = $retryEx;
                }
            }

            Log::error('MailService: Failed to send email.', [
                'to' => $to,
                'error' => $e->getMessage(),
                'smtp_id' => $smtp->id,
            ]);
            throw $e;
        }
    }

    /**
     * Synchronize the active database SMTP configuration with Laravel's default mailer
     * so standard Notifications (e.g. OrderReceiptNotification, NewOrderMerchantNotification,
     * VerifyEmail, ResetPassword) and Mailables use the configured SMTP transport.
     */
    public function syncActiveSmtpToDefaultMailer(): bool
    {
        try {
            $smtp = SmtpConfiguration::getActive();
            if (! $smtp) {
                return false;
            }

            $this->configureMailer($smtp);

            // Preserve the 'array' mailer during automated test suites unless explicitly testing dynamic_smtp
            if (Config::get('mail.default') !== 'array') {
                Config::set('mail.default', 'dynamic_smtp');
            }

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Configure Laravel mail to use the given SMTP configuration for the 'dynamic_smtp' mailer.
     *
     * @param SmtpConfiguration|WorkspaceSmtpConfig $smtp
     */
    public function configureMailer(Model $smtp): void
    {
        $encryption = is_string($smtp->encryption) ? strtolower(trim($smtp->encryption)) : null;
        if ($encryption === 'none' || $encryption === 'null' || $encryption === '') {
            $encryption = null;
        }

        $port = (int) $smtp->port;
        $scheme = ($encryption === 'ssl' || $port === 465) ? 'smtps' : 'smtp';

        $manager = app('mail.manager');
        if (method_exists($manager, 'purge')) {
            $manager->purge('dynamic_smtp');
            $manager->purge('smtp');
        }

        $mailerConfig = [
            'transport' => 'smtp',
            'scheme' => $scheme,
            'host' => $smtp->host,
            'port' => $port,
            'username' => $smtp->username,
            'password' => $smtp->getDecryptedPassword(),
            'encryption' => $encryption,
            'timeout' => null,
            'from' => [
                'address' => $smtp->from_email,
                'name' => $smtp->from_name,
            ],
        ];

        Config::set('mail.mailers.dynamic_smtp', $mailerConfig);
        Config::set('mail.mailers.smtp', $mailerConfig);

        if (! empty($smtp->from_email)) {
            Config::set('mail.from.address', $smtp->from_email);
        }
        if (! empty($smtp->from_name)) {
            Config::set('mail.from.name', $smtp->from_name);
        }
    }

    private function replacePlaceholders(string $text, array $replacements): string
    {
        foreach ($replacements as $key => $value) {
            $text = str_replace('{{' . $key . '}}', (string) $value, $text);
        }
        return $text;
    }

    /**
     * Ensure all built-in transactional email templates exist in the `templates` table
     * so administrators can view, test, and customize them in the Admin Email System UI.
     */
    public function ensureDefaultTemplatesSeeded(): void
    {
        try {
            foreach ($this->getDefaultEmailTemplates() as $slug => $definition) {
                Template::firstOrCreate(
                    ['type' => 'email', 'slug' => $slug],
                    [
                        'name' => $definition['name'],
                        'subject' => $definition['subject'],
                        'content' => $definition['content'],
                        'enabled' => true,
                        'meta' => [
                            'description' => $definition['description'] ?? null,
                            'placeholders' => $definition['placeholders'] ?? [],
                        ],
                    ]
                );
            }
        } catch (\Throwable) {
            // Gracefully ignore if database table is not yet migrated
        }
    }

    /**
     * Built-in default transactional email templates used when a template slug
     * has not yet been seeded into the `templates` database table.
     *
     * @return array{name: string, subject: string, content: string, description?: string, placeholders?: array<int, string>}|null
     */
    private function resolveDefaultTemplate(string $templateKey): ?array
    {
        $defaults = $this->getDefaultEmailTemplates();

        return $defaults[$templateKey] ?? null;
    }

    /**
     * @return array<string, array{name: string, subject: string, content: string, description: string, placeholders: array<int, string>}>
     */
    public function getDefaultEmailTemplates(): array
    {
        return [
            'welcome' => [
                'name' => 'Welcome Email',
                'subject' => 'Welcome to {{app_name}}, {{user_name}}!',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Welcome to <strong>{{app_name}}</strong>! Your account is ready.</p><p><a href="{{login_url}}" style="display:inline-block;padding:10px 20px;background:#0d9488;color:#ffffff;text-decoration:none;border-radius:6px;">Sign In to Your Dashboard</a></p>',
                'description' => 'Sent to new users upon registration.',
                'placeholders' => ['app_name', 'user_name', 'login_url'],
            ],
            'subscription_started' => [
                'name' => 'Subscription Started',
                'subject' => 'Your {{plan_name}} Subscription is Active — {{app_name}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your <strong>{{plan_name}}</strong> ({{billing_cycle}}) subscription on {{app_name}} is now active as of {{starts_at}}.</p><p>Thank you for subscribing!</p>',
                'description' => 'Sent when a user starts a new subscription plan.',
                'placeholders' => ['app_name', 'user_name', 'plan_name', 'billing_cycle', 'starts_at'],
            ],
            'subscription_renewed' => [
                'name' => 'Subscription Renewed',
                'subject' => 'Subscription Renewed: {{plan_name}} — {{app_name}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your <strong>{{plan_name}}</strong> subscription has been renewed for <strong>{{currency}} {{amount}}</strong>.</p><p>Your next renewal date is {{next_renewal}}.</p>',
                'description' => 'Sent when a recurring subscription payment succeeds.',
                'placeholders' => ['app_name', 'user_name', 'plan_name', 'amount', 'currency', 'next_renewal'],
            ],
            'subscription_cancelled' => [
                'name' => 'Subscription Cancelled',
                'subject' => 'Subscription Cancelled: {{plan_name}} — {{app_name}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your <strong>{{plan_name}}</strong> subscription on {{app_name}} has been cancelled. Your access continues until <strong>{{ends_at}}</strong>.</p>',
                'description' => 'Sent when a user or admin cancels a subscription.',
                'placeholders' => ['app_name', 'user_name', 'plan_name', 'ends_at'],
            ],
            'subscription_expired' => [
                'name' => 'Subscription Expired',
                'subject' => 'Your {{plan_name}} Subscription Has Expired — {{app_name}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your <strong>{{plan_name}}</strong> subscription on {{app_name}} has expired.</p><p><a href="{{billing_url}}" style="display:inline-block;padding:10px 20px;background:#0d9488;color:#ffffff;text-decoration:none;border-radius:6px;">Renew Subscription</a></p>',
                'description' => 'Sent when a subscription reaches its expiration date.',
                'placeholders' => ['app_name', 'user_name', 'plan_name', 'billing_url'],
            ],
            'plan_changed' => [
                'name' => 'Subscription Plan Changed',
                'subject' => 'Your Plan Was Updated to {{new_plan}} — {{app_name}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your subscription plan on {{app_name}} has been updated from <strong>{{old_plan}}</strong> to <strong>{{new_plan}}</strong>.</p><p><a href="{{billing_url}}">View Billing Details</a></p>',
                'description' => 'Sent when a user upgrades or downgrades their plan.',
                'placeholders' => ['app_name', 'user_name', 'old_plan', 'new_plan', 'billing_url'],
            ],
            'trial_ending' => [
                'name' => 'Trial Ending Reminder',
                'subject' => 'Your {{plan_name}} Trial Ends in {{days_remaining}} Days — {{app_name}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your trial of the <strong>{{plan_name}}</strong> plan on {{app_name}} ends on <strong>{{trial_ends_at}}</strong> ({{days_remaining}} days remaining).</p><p><a href="{{billing_url}}" style="display:inline-block;padding:10px 20px;background:#0d9488;color:#ffffff;text-decoration:none;border-radius:6px;">Manage Billing</a></p>',
                'description' => 'Sent 3 days before a user trial expires.',
                'placeholders' => ['app_name', 'user_name', 'plan_name', 'days_remaining', 'trial_ends_at', 'billing_url'],
            ],
            'payment_failed' => [
                'name' => 'Subscription Payment Failed',
                'subject' => 'Action Required: Payment Failed ({{currency}} {{amount}}) — {{app_name}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>We were unable to process your payment of <strong>{{currency}} {{amount}}</strong> on {{app_name}}.</p><p><a href="{{billing_url}}" style="display:inline-block;padding:10px 20px;background:#dc2626;color:#ffffff;text-decoration:none;border-radius:6px;">Update Payment Method</a></p>',
                'description' => 'Sent when a recurring subscription charge fails.',
                'placeholders' => ['app_name', 'user_name', 'amount', 'currency', 'billing_url'],
            ],
            'team_invitation' => [
                'name' => 'Team Member Invitation',
                'subject' => '{{inviter_name}} invited you to join {{organization_name}} on {{app_name}}',
                'content' => '<p>Hello,</p><p><strong>{{inviter_name}}</strong> has invited you to join <strong>{{organization_name}}</strong> on {{app_name}}.</p><p><a href="{{invitation_url}}" style="display:inline-block;padding:10px 20px;background:#0d9488;color:#ffffff;text-decoration:none;border-radius:6px;">Accept Invitation</a></p><p>This invitation expires in {{expires_days}} days.</p>',
                'description' => 'Sent when a user invites a team member to their workspace.',
                'placeholders' => ['app_name', 'inviter_name', 'organization_name', 'invitation_url', 'expires_days'],
            ],
            'magic_link' => [
                'name' => 'Magic Sign-In Link',
                'subject' => 'Your Sign-In Link for {{app_name}}',
                'content' => '<p>Hello,</p><p>Click the button below to sign in to <strong>{{app_name}}</strong>:</p><p><a href="{{magic_url}}" style="display:inline-block;padding:10px 20px;background:#0d9488;color:#ffffff;text-decoration:none;border-radius:6px;">Sign In Now</a></p>',
                'description' => 'Passwordless sign-in link email.',
                'placeholders' => ['app_name', 'magic_url'],
            ],
            'affiliate_access_granted' => [
                'name' => 'Affiliate Partner Access Activated',
                'subject' => 'Welcome to the {{app_name}} Affiliate Partner Hub!',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your <strong>{{app_name}} Affiliate Partner</strong> access ({{plan_type}}) is now active!</p><p><strong>Your Unique Referral Code:</strong> <code>{{referral_code}}</code></p><p><a href="{{affiliate_url}}" style="display:inline-block;padding:10px 20px;background:#0d9488;color:#ffffff;text-decoration:none;border-radius:6px;">Open Affiliate Dashboard</a></p>',
                'description' => 'Sent when an affiliate unlocks or is granted partner access.',
                'placeholders' => ['app_name', 'user_name', 'plan_type', 'referral_code', 'affiliate_url'],
            ],
            'affiliate_access_extended' => [
                'name' => 'Affiliate Partner Access Extended',
                'subject' => 'Your {{app_name}} Affiliate Access Has Been Extended',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your Affiliate Partner access on <strong>{{app_name}}</strong> has been extended until <strong>{{expires_at}}</strong>.</p><p><a href="{{affiliate_url}}" style="display:inline-block;padding:10px 20px;background:#0d9488;color:#ffffff;text-decoration:none;border-radius:6px;">Open Affiliate Dashboard</a></p>',
                'description' => 'Sent when an admin extends an affiliate subscription.',
                'placeholders' => ['app_name', 'user_name', 'expires_at', 'affiliate_url'],
            ],
            'affiliate_access_revoked' => [
                'name' => 'Affiliate Partner Access Ended',
                'subject' => 'Update Regarding Your {{app_name}} Affiliate Access',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your Affiliate Partner access on <strong>{{app_name}}</strong> has been deactivated.</p><p>If you would like to reactivate your partner account, please visit your dashboard.</p>',
                'description' => 'Sent when an affiliate subscription is revoked or expires.',
                'placeholders' => ['app_name', 'user_name'],
            ],
            'support_ticket_created' => [
                'name' => 'Support Ticket Created',
                'subject' => '[Ticket #{{ticket_number}}] {{ticket_subject}} — {{app_name}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your support ticket <strong>#{{ticket_number}}</strong> ({{ticket_subject}}) has been received. Our team will respond shortly.</p><p><a href="{{ticket_url}}">View Ticket</a></p>',
                'description' => 'Sent to customer when a support ticket is created.',
                'placeholders' => ['app_name', 'user_name', 'ticket_number', 'ticket_subject', 'ticket_url'],
            ],
            'support_ticket_reply_client' => [
                'name' => 'Support Ticket Reply (To Client)',
                'subject' => 'New Reply on Ticket #{{ticket_number}}: {{ticket_subject}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>A new reply has been posted to your support ticket <strong>#{{ticket_number}}</strong>:</p><blockquote>{{reply_message}}</blockquote><p><a href="{{ticket_url}}">View & Reply</a></p>',
                'description' => 'Sent to customer when support replies to their ticket.',
                'placeholders' => ['user_name', 'ticket_number', 'ticket_subject', 'reply_message', 'ticket_url'],
            ],
            'support_ticket_status_changed' => [
                'name' => 'Support Ticket Status Updated',
                'subject' => 'Ticket #{{ticket_number}} Status Updated to {{status}}',
                'content' => '<p>Hello <strong>{{user_name}}</strong>,</p><p>Your support ticket <strong>#{{ticket_number}}</strong> ({{ticket_subject}}) status has been updated to <strong>{{status}}</strong>.</p><p><a href="{{ticket_url}}">View Ticket</a></p>',
                'description' => 'Sent to customer when ticket status changes.',
                'placeholders' => ['user_name', 'ticket_number', 'ticket_subject', 'status', 'ticket_url'],
            ],
            'support_ticket_admin_new' => [
                'name' => 'New Support Ticket Alert (To Admin)',
                'subject' => '[New Support Ticket #{{ticket_number}}] {{ticket_subject}}',
                'content' => '<p>A new support ticket <strong>#{{ticket_number}}</strong> was submitted by {{user_name}} ({{user_email}}).</p><p><a href="{{ticket_url}}">Open in Admin Panel</a></p>',
                'description' => 'Sent to admins when a new support ticket is opened.',
                'placeholders' => ['user_name', 'user_email', 'ticket_number', 'ticket_subject', 'ticket_url'],
            ],
            'support_ticket_reply_admin' => [
                'name' => 'Customer Ticket Reply (To Admin)',
                'subject' => '[Customer Reply #{{ticket_number}}] {{ticket_subject}}',
                'content' => '<p>{{user_name}} replied to support ticket <strong>#{{ticket_number}}</strong>:</p><blockquote>{{reply_message}}</blockquote><p><a href="{{ticket_url}}">Open in Admin Panel</a></p>',
                'description' => 'Sent to admins when a customer replies to a ticket.',
                'placeholders' => ['user_name', 'ticket_number', 'ticket_subject', 'reply_message', 'ticket_url'],
            ],
        ];
    }
}
