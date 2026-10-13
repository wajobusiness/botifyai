<?php

namespace Tests\Feature\Ecommerce;

use App\Models\SmtpConfiguration;
use App\Models\User;
use App\Models\Workspace;
use App\Modules\Ecommerce\Models\EcommerceDigitalAsset;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Ecommerce\Notifications\NewOrderMerchantNotification;
use App\Modules\Ecommerce\Notifications\OrderReceiptNotification;
use App\Modules\Ecommerce\Services\CommercePaymentService;
use App\Services\Mail\MailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class TransactionalCommerceEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_smtp_configuration_syncs_to_default_and_dynamic_mailers(): void
    {
        Config::set('mail.default', 'log');

        $smtp = SmtpConfiguration::create([
            'host' => 'mail.botifyai.cloud',
            'port' => 465,
            'username' => 'noreply@botifyai.cloud',
            'password' => 'super-secret-smtp-pass',
            'encryption' => 'ssl',
            'from_email' => 'noreply@botifyai.cloud',
            'from_name' => 'BotifyAI Cloud',
            'is_active' => true,
        ]);

        $synced = app(MailService::class)->syncActiveSmtpToDefaultMailer();

        $this->assertTrue($synced);
        $this->assertSame('dynamic_smtp', Config::get('mail.default'));
        $this->assertSame('smtps', Config::get('mail.mailers.dynamic_smtp.scheme'));
        $this->assertSame('mail.botifyai.cloud', Config::get('mail.mailers.dynamic_smtp.host'));
        $this->assertSame(465, Config::get('mail.mailers.dynamic_smtp.port'));
        $this->assertSame('super-secret-smtp-pass', Config::get('mail.mailers.dynamic_smtp.password'));
        $this->assertSame('noreply@botifyai.cloud', Config::get('mail.from.address'));
        $this->assertSame('BotifyAI Cloud', Config::get('mail.from.name'));
        $this->assertNotNull($smtp->id);
    }

    public function test_digital_product_purchase_sends_buyer_receipt_and_seller_sale_emails(): void
    {
        Notification::fake();

        // Create a standalone workspace owner (only linked via workspaces.owner_id, no workspace_user pivot row)
        $seller = User::factory()->create([
            'name' => 'Adaeze Merchant',
            'email' => 'seller@botifyai.cloud',
        ]);

        $workspace = Workspace::create([
            'owner_id' => $seller->id,
            'name' => 'Adaeze Digital Hub',
            'default_locale' => 'en',
            'currency_code' => 'NGN',
        ]);

        $store = EcommerceStore::create([
            'workspace_id' => $workspace->id,
            'platform' => 'native',
            'name' => 'Adaeze Digital Store',
            'domain' => 'native',
            'status' => 'connected',
            'currency' => 'NGN',
            'support_email' => 'support@adaezedigital.com',
            'support_phone' => '+2348012345678',
            'brand_color' => '#0D9488',
        ]);

        $product = EcommerceProduct::create([
            'workspace_id' => $workspace->id,
            'store_id' => $store->id,
            'platform' => 'native',
            'name' => 'Turn Facebook & Instagram Into a Fully Functional Online Store',
            'slug' => 'turn-facebook-instagram-into-a-fully-functional-online-store',
            'product_type' => 'digital',
            'price' => 15000.00,
            'currency' => 'NGN',
            'status' => 'active',
            'is_published' => true,
        ]);

        EcommerceDigitalAsset::create([
            'workspace_id' => $workspace->id,
            'product_id' => $product->id,
            'asset_type' => 'redirect_url',
            'external_redirect_url' => 'https://botifyai.cloud/course-access',
            'file_name' => 'Meta-Store-Masterclass.pdf',
        ]);

        $order = EcommerceOrder::create([
            'workspace_id' => $workspace->id,
            'store_id' => $store->id,
            'platform' => 'native',
            'number' => 'ORD-TEST9001',
            'status' => 'pending',
            'payment_status' => 'pending',
            'financial_status' => 'pending',
            'currency' => 'NGN',
            'total' => 15000.00,
            'customer_name' => 'Chinedu Buyer',
            'customer_email' => 'buyer@example.com',
            'customer_phone' => '+2348099887766',
            'payment_gateway' => 'paystack',
            'payment_reference' => 'PSK_REF_9001',
            'line_items' => [
                [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'price' => 15000.00,
                    'quantity' => 1,
                ],
            ],
        ]);

        $paymentService = app(CommercePaymentService::class);
        $result = $paymentService->handlePaymentSuccess($order, 'PSK_REF_9001', [
            'amount' => 1500000,
            'currency' => 'NGN',
            'status' => 'success',
        ], 'paystack');

        $this->assertTrue($result);

        // 1. Verify Buyer received OrderReceiptNotification with exact product name, receipt, and download link
        Notification::assertSentOnDemand(
            OrderReceiptNotification::class,
            function (OrderReceiptNotification $notification, array $channels, AnonymousNotifiable $notifiable) use ($product) {
                $this->assertContains('mail', $channels);
                $this->assertSame('buyer@example.com', $notifiable->routes['mail']);

                $mail = $notification->toMail($notifiable);
                $renderedLines = implode("\n", $mail->introLines) . "\n" . implode("\n", $mail->outroLines);

                $this->assertStringContainsString('ORD-TEST9001', $mail->subject);
                $this->assertStringContainsString($product->name, $renderedLines);
                $this->assertStringContainsString('15,000.00', $renderedLines);
                $this->assertStringContainsString('support@adaezedigital.com', $renderedLines);

                return true;
            }
        );

        // 2. Verify Seller (Workspace Owner) received NewOrderMerchantNotification via BOTH mail and database
        Notification::assertSentTo(
            $seller,
            NewOrderMerchantNotification::class,
            function (NewOrderMerchantNotification $notification, array $channels) use ($seller, $product) {
                $this->assertContains('mail', $channels);
                $this->assertContains('database', $channels);

                $mail = $notification->toMail($seller);
                $renderedLines = implode("\n", $mail->introLines) . "\n" . implode("\n", $mail->outroLines);

                $this->assertStringContainsString('ORD-TEST9001', $mail->subject);
                $this->assertStringContainsString($product->name, $renderedLines);
                $this->assertStringContainsString('Chinedu Buyer', $renderedLines);
                $this->assertStringContainsString('buyer@example.com', $renderedLines);
                $this->assertStringContainsString('15,000.00', $renderedLines);
                $this->assertStringContainsString('750.00', $renderedLines); // 5% platform fee
                $this->assertStringContainsString('14,250.00', $renderedLines); // 95% net wallet credit

                return true;
            }
        );

        // 3. Verify Store support_email also received a copy of the sale notification
        Notification::assertSentOnDemand(
            NewOrderMerchantNotification::class,
            function (NewOrderMerchantNotification $notification, array $channels, AnonymousNotifiable $notifiable) {
                return in_array('mail', $channels, true)
                    && ($notifiable->routes['mail'] ?? null) === 'support@adaezedigital.com';
            }
        );

        // 4. Verify idempotency: second call does not re-send emails
        Notification::fake();
        $secondResult = $paymentService->handlePaymentSuccess($order->fresh(), 'PSK_REF_9001', [
            'amount' => 1500000,
            'currency' => 'NGN',
            'status' => 'success',
        ], 'paystack');

        $this->assertTrue($secondResult);
        Notification::assertNothingSent();
    }

    public function test_payment_failure_sends_buyer_retry_checkout_email(): void
    {
        Notification::fake();

        $seller = User::factory()->create();
        $workspace = Workspace::create([
            'owner_id' => $seller->id,
            'name' => 'Seller Workspace',
            'default_locale' => 'en',
            'currency_code' => 'NGN',
        ]);

        $store = EcommerceStore::create([
            'workspace_id' => $workspace->id,
            'platform' => 'native',
            'name' => 'Seller Store',
            'domain' => 'native',
            'status' => 'connected',
            'currency' => 'NGN',
            'support_email' => 'help@sellerstore.com',
        ]);

        $product = EcommerceProduct::create([
            'workspace_id' => $workspace->id,
            'store_id' => $store->id,
            'platform' => 'native',
            'name' => 'AI Sales Blueprint',
            'slug' => 'ai-sales-blueprint',
            'product_type' => 'digital',
            'price' => 10000.00,
            'currency' => 'NGN',
            'status' => 'active',
            'is_published' => true,
        ]);

        $order = EcommerceOrder::create([
            'workspace_id' => $workspace->id,
            'store_id' => $store->id,
            'platform' => 'native',
            'number' => 'ORD-FAIL101',
            'status' => 'pending',
            'payment_status' => 'pending',
            'currency' => 'NGN',
            'total' => 10000.00,
            'customer_name' => 'Tunde Customer',
            'customer_email' => 'tunde@example.com',
            'payment_gateway' => 'paystack',
            'payment_reference' => 'PSK_FAIL_101',
            'line_items' => [
                [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'price' => 10000.00,
                    'quantity' => 1,
                ],
            ],
        ]);

        app(CommercePaymentService::class)->handlePaymentFailure(
            $order,
            'PSK_FAIL_101',
            'Insufficient funds in card account',
            ['amount' => 1000000, 'currency' => 'NGN'],
            'paystack'
        );

        Notification::assertSentOnDemand(
            \App\Modules\Ecommerce\Notifications\OrderPaymentFailedNotification::class,
            function ($notification, array $channels, AnonymousNotifiable $notifiable) use ($product) {
                $this->assertContains('mail', $channels);
                $this->assertSame('tunde@example.com', $notifiable->routes['mail']);

                $mail = $notification->toMail($notifiable);
                $renderedLines = implode("\n", $mail->introLines) . "\n" . implode("\n", $mail->outroLines);

                $this->assertStringContainsString('ORD-FAIL101', $mail->subject);
                $this->assertStringContainsString('Insufficient funds in card account', $renderedLines);
                $this->assertStringContainsString($product->name, $renderedLines);
                $this->assertStringContainsString($product->getCheckoutSlug(), (string) $mail->actionUrl);

                return true;
            }
        );
    }

    public function test_affiliate_referred_sale_notifies_affiliate_partner_and_includes_commission_on_seller_email(): void
    {
        Notification::fake();

        $seller = User::factory()->create(['email' => 'merchant@botifyai.cloud']);
        $affiliate = User::factory()->create([
            'name' => 'Emeka Promoter',
            'email' => 'affiliate@botifyai.cloud',
            'affiliate_status' => 'active',
        ]);

        $referralCode = 'AFF-' . strtoupper(substr(md5($affiliate->id . $affiliate->email), 0, 8));

        $workspace = Workspace::create([
            'owner_id' => $seller->id,
            'name' => 'Merchant Hub',
            'default_locale' => 'en',
            'currency_code' => 'NGN',
        ]);

        $store = EcommerceStore::create([
            'workspace_id' => $workspace->id,
            'platform' => 'native',
            'name' => 'Merchant Store',
            'domain' => 'native',
            'status' => 'connected',
            'currency' => 'NGN',
        ]);

        $order = EcommerceOrder::create([
            'workspace_id' => $workspace->id,
            'store_id' => $store->id,
            'platform' => 'native',
            'number' => 'ORD-AFF202',
            'status' => 'pending',
            'payment_status' => 'pending',
            'currency' => 'NGN',
            'total' => 20000.00,
            'customer_name' => 'Zainab Buyer',
            'customer_email' => 'zainab@example.com',
            'payment_gateway' => 'paystack',
            'payment_reference' => 'PSK_AFF_202',
            'metadata' => [
                'affiliate' => [
                    'referral_code' => $referralCode,
                    'commission_percentage' => 15.0,
                    'commission_amount' => 3000.00,
                ],
            ],
            'line_items' => [
                [
                    'name' => 'Affiliate Growth Course',
                    'price' => 20000.00,
                    'quantity' => 1,
                ],
            ],
        ]);

        app(CommercePaymentService::class)->handlePaymentSuccess($order, 'PSK_AFF_202', [
            'amount' => 2000000,
            'currency' => 'NGN',
        ], 'paystack');

        Notification::assertSentTo(
            $affiliate,
            \App\Modules\Ecommerce\Notifications\AffiliateCommissionEarnedNotification::class,
            function ($notification, array $channels) use ($affiliate, $referralCode) {
                $this->assertContains('mail', $channels);
                $this->assertContains('database', $channels);

                $mail = $notification->toMail($affiliate);
                $renderedLines = implode("\n", $mail->introLines) . "\n" . implode("\n", $mail->outroLines);

                $this->assertStringContainsString('3,000.00', $mail->subject);
                $this->assertStringContainsString($referralCode, $renderedLines);
                $this->assertStringContainsString('15%', $renderedLines);

                return true;
            }
        );
    }
}

