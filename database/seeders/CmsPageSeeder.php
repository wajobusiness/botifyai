<?php

namespace Database\Seeders;

use App\Models\CmsPage;
use App\Support\Brand;
use Illuminate\Database\Seeder;

class CmsPageSeeder extends Seeder
{
    /**
     * Seed the standard legal pages as editable CMS templates.
     *
     * Non-destructive: uses firstOrCreate keyed on slug, so existing pages
     * (and any admin edits) are preserved. The bodies are placeholder
     * templates — clearly marked to be reviewed with legal counsel before
     * publishing. Edit them in Admin → CMS Pages.
     */
    public function run(): void
    {
        // Store the brand token rather than the resolved name: this copy lives in the
        // database, and CmsPageController::show() resolves `:brand` via Brand::apply()
        // on render — so the pages follow the brand through any later rename.
        $app = Brand::TOKEN;

        $updated = 'Last updated: '.now()->format('F j, Y');

        $pages = [
            [
                'slug'             => 'privacy',
                'title'            => 'Privacy Policy',
                'meta_title'       => "Privacy Policy — {$app}",
                'meta_description' => "How {$app} collects, uses, and protects your personal data, and details on advertising and analytics cookies.",
                'content'          => "<p>{$updated}</p>"
                    ."<p>This Privacy Policy explains how {$app} (\"we\", \"us\", or \"our\") collects, uses, discloses, and protects your information when you visit and use our website, platform, and services. We are dedicated to maintaining the privacy and security of your personal information.</p>"
                    .'<h2>1. Information We Collect</h2>'
                    .'<p>We may collect personal information that you provide to us directly, such as your name, email address, company name, and payment information when you register for an account or contact us. We also automatically collect certain information when you browse our site, including your IP address, browser type, device identifiers, pages visited, and operating system.</p>'
                    .'<h2>2. How We Use Your Information</h2>'
                    .'<p>We use the collected information for various purposes, including:</p>'
                    .'<ul>'
                    .'<li>Providing, operating, maintaining, and improving our customer engagement and AI messaging platform.</li>'
                    .'<li>Processing transactions, invoices, and subscription plans.</li>'
                    .'<li>Responding to customer support inquiries and delivering technical notices.</li>'
                    .'<li>Monitoring website usage and analyzing trends to enhance user experience.</li>'
                    .'<li>Serving relevant announcements, content, and advertising in compliance with applicable laws.</li>'
                    .'</ul>'
                    .'<h2>3. Cookies, Analytics, and Third-Party Advertising</h2>'
                    .'<p>We use cookies and similar tracking technologies to track activity on our service and hold certain information.</p>'
                    .'<p><strong>Google AdSense &amp; Third-Party Advertising:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user\'s prior visits to our website or other websites on the Internet. Google\'s use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.</p>'
                    .'<p>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. Alternatively, you can opt out of third-party vendors\' use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">AboutAds.info</a>.</p>'
                    .'<h2>4. Data Sharing and Disclosure</h2>'
                    .'<p>We do not sell your personal data. We only share information with trusted third-party service providers (such as hosting infrastructure, payment processors, and analytics providers) who assist us in operating our platform, subject to strict confidentiality agreements.</p>'
                    .'<h2>5. Data Security &amp; Retention</h2>'
                    .'<p>We implement industry-standard technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. We retain your information only as long as necessary to fulfill the purposes outlined in this policy.</p>'
                    .'<h2>6. Your Data Rights</h2>'
                    .'<p>Depending on your jurisdiction (including the EU/EEA and California), you may have rights under the GDPR, CCPA, or applicable regulations to access, rectify, port, or erase your personal data. To exercise any of these rights, please reach out to us.</p>'
                    ."<h2>7. Contact Us</h2><p>If you have any questions or concerns regarding this Privacy Policy, please contact us via <a href=\"/contact\">our contact page</a>.</p>",
            ],
            [
                'slug'             => 'terms',
                'title'            => 'Terms of Service',
                'meta_title'       => "Terms of Service — {$app}",
                'meta_description' => "The terms and conditions governing the use of {$app}.",
                'content'          => "<p>{$updated}</p>"
                    ."<p>These Terms of Service (\"Terms\") govern your access to and use of {$app} and its related services. By accessing or using our platform, you agree to be bound by these Terms.</p>"
                    .'<h2>1. Account Registration and Responsibilities</h2><p>You must provide accurate and complete registration information. You are responsible for safeguarding your credentials and for all activities that occur under your account.</p>'
                    .'<h2>2. Acceptable Use Policy</h2><p>You agree not to use {$app} to send unsolicited spam, distribute harmful code, violate third-party messaging platform policies (including Meta and WhatsApp Business policies), or engage in unlawful activities.</p>'
                    .'<h2>3. Subscriptions, Payments, and Cancellations</h2><p>Access to certain features requires a paid subscription. Subscriptions are billed in advance on a recurring cycle. You may cancel your subscription at any time through your dashboard.</p>'
                    .'<h2>4. Third-Party Integrations</h2><p>Our platform integrates with third-party services (such as WhatsApp, Facebook Messenger, Instagram, and Telegram). Your use of these third-party platforms is subject to their respective terms and service agreements.</p>'
                    .'<h2>5. Intellectual Property</h2><p>All intellectual property rights in the platform, software, logos, and documentation belong exclusively to {$app} and its licensors.</p>'
                    .'<h2>6. Limitation of Liability</h2><p>To the maximum extent permitted by law, {$app} shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>'
                    ."<h2>7. Contact</h2><p>For any questions regarding these Terms, please reach us via <a href=\"/contact\">our contact page</a>.</p>",
            ],
            [
                'slug'             => 'cookies',
                'title'            => 'Cookie Policy',
                'meta_title'       => "Cookie Policy — {$app}",
                'meta_description' => "How {$app} uses cookies, tracking technologies, and advertising cookies.",
                'content'          => "<p>{$updated}</p>"
                    ."<p>This Cookie Policy explains how {$app} uses cookies and similar tracking technologies when you visit our website and platform.</p>"
                    .'<h2>1. What Are Cookies?</h2><p>Cookies are small text files stored on your device when you browse websites. They enable sites to remember your preferences, keep you logged in, and provide analytics on how the site is used.</p>'
                    .'<h2>2. Categories of Cookies We Use</h2><ul>'
                    .'<li><strong>Strictly Necessary Cookies:</strong> Essential for user authentication, account security, and session management.</li>'
                    .'<li><strong>Performance &amp; Analytics Cookies:</strong> Help us analyze traffic patterns and optimize platform speed and navigation.</li>'
                    .'<li><strong>Targeting &amp; Advertising Cookies:</strong> Used by third-party advertising partners (such as Google AdSense) to display relevant advertisements and measure ad performance.</li>'
                    .'</ul>'
                    .'<h2>3. Managing and Disabling Cookies</h2><p>You can manage your cookie preferences at any time through your web browser settings. You can also opt out of personalized ad cookies via <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">AboutAds.info</a> or <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>'
                    ."<h2>4. Contact</h2><p>If you have any questions regarding our cookie practices, please visit <a href=\"/contact\">our contact page</a>.</p>",
            ],
            [
                'slug'             => 'gdpr',
                'title'            => 'GDPR Compliance',
                'meta_title'       => "GDPR Compliance — {$app}",
                'meta_description' => "How {$app} adheres to the General Data Protection Regulation (GDPR).",
                'content'          => "<p>{$updated}</p>"
                    ."<p>{$app} is dedicated to complying with the General Data Protection Regulation (GDPR) (EU) 2016/679 and protecting the fundamental privacy rights of European Union and international users.</p>"
                    .'<h2>1. Legal Bases for Processing</h2><p>We process personal data in accordance with GDPR principles: performance of contract, legitimate interests, legal obligations, and user consent.</p>'
                    .'<h2>2. Your GDPR Rights</h2><ul>'
                    .'<li><strong>Right of Access:</strong> Request a copy of personal data we hold about you.</li>'
                    .'<li><strong>Right to Rectification:</strong> Request correction of inaccurate personal data.</li>'
                    .'<li><strong>Right to Erasure (\"Right to be Forgotten\"):</strong> Request deletion of your personal information.</li>'
                    .'<li><strong>Right to Restriction and Objection:</strong> Restrict or object to specific processing of your personal data.</li>'
                    .'<li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>'
                    .'</ul>'
                    .'<h2>3. International Data Transfers</h2><p>Where personal data is transferred outside the European Economic Area (EEA), we ensure adequate safeguards are in place, including standard contractual clauses (SCCs).</p>'
                    ."<h2>4. Contact Our Data Protection Team</h2><p>To exercise any of your GDPR rights or submit a data inquiry, please contact us via <a href=\"/contact\">our contact page</a>.</p>",
            ],
        ];

        foreach ($pages as $page) {
            CmsPage::updateOrCreate(
                ['slug' => $page['slug']],
                [
                    'title'            => $page['title'],
                    'content'          => $page['content'],
                    'meta_title'       => $page['meta_title'],
                    'meta_description' => $page['meta_description'],
                    'published'        => true,
                    'layout'           => 'legal',
                ]
            );
        }
    }
}
