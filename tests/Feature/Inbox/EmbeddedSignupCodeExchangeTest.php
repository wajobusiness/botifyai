<?php

namespace Tests\Feature\Inbox;

use App\Modules\Integrations\Models\IntegrationConfig;
use App\Modules\Shared\Models\ChannelAccount;
use App\Modules\Whatsapp\Models\WhatsappBusinessAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class EmbeddedSignupCodeExchangeTest extends TestCase
{
    use RefreshDatabase;

    private array $ctx;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ctx = $this->createWorkspaceContext();
        Queue::fake();

        IntegrationConfig::create([
            'provider' => 'meta_app',
            'category' => 'social',
            'enabled' => true,
            'credentials' => [
                'app_id' => 'META_APP_12345',
                'app_secret' => 'META_SECRET_67890',
            ],
        ]);
    }

    public function test_messenger_embedded_signup_omits_redirect_uri_in_code_exchange(): void
    {
        $capturedTokenRequests = [];

        Http::fake([
            'graph.facebook.com/v20.0/oauth/access_token*' => function (HttpRequest $request) use (&$capturedTokenRequests) {
                $capturedTokenRequests[] = $request;

                return Http::response([
                    'access_token' => 'USER_LONG_TOKEN_ABC',
                    'token_type' => 'bearer',
                ]);
            },
            'graph.facebook.com/v20.0/me/accounts*' => Http::response([
                'data' => [
                    [
                        'id' => 'PAGE_111222',
                        'name' => 'My Messenger Page',
                        'access_token' => 'PAGE_ACCESS_TOKEN_XYZ',
                    ],
                ],
            ]),
            'graph.facebook.com/*' => Http::response(['success' => true]),
        ]);

        $response = $this->actingAs($this->ctx['user'])->postJson(route('client.inbox.setup.embedded-signup.messenger'), [
            'code' => 'TEST_AUTH_CODE_MESSENGER',
        ]);

        $response->assertOk();

        // Verify the code exchange request to Meta omitted redirect_uri
        $this->assertNotEmpty($capturedTokenRequests);
        $firstTokenRequest = $capturedTokenRequests[0];
        $url = $firstTokenRequest->url();

        $this->assertStringContainsString('code=TEST_AUTH_CODE_MESSENGER', $url);
        $this->assertStringContainsString('client_id=META_APP_12345', $url);
        $this->assertStringNotContainsString('redirect_uri', $url);

        $account = ChannelAccount::where('workspace_id', $this->ctx['workspace']->id)
            ->where('channel', 'messenger')
            ->first();

        $this->assertNotNull($account);
        $this->assertSame('PAGE_ACCESS_TOKEN_XYZ', $account->credentials['page_access_token']);
        $this->assertSame('PAGE_111222', $account->meta_json['page_id']);
    }

    public function test_instagram_embedded_signup_omits_redirect_uri_in_code_exchange(): void
    {
        $capturedTokenRequests = [];

        Http::fake([
            'graph.facebook.com/v20.0/oauth/access_token*' => function (HttpRequest $request) use (&$capturedTokenRequests) {
                $capturedTokenRequests[] = $request;

                return Http::response([
                    'access_token' => 'USER_LONG_TOKEN_ABC',
                    'token_type' => 'bearer',
                ]);
            },
            'graph.facebook.com/v20.0/me/accounts*' => Http::response([
                'data' => [
                    [
                        'id' => 'PAGE_333444',
                        'name' => 'My IG Linked Page',
                        'access_token' => 'PAGE_ACCESS_TOKEN_IG',
                        'instagram_business_account' => [
                            'id' => 'IG_ACCOUNT_999',
                            'name' => 'My Instagram Business',
                            'username' => 'my_ig_biz',
                        ],
                    ],
                ],
            ]),
            'graph.facebook.com/*' => Http::response(['success' => true]),
        ]);

        $response = $this->actingAs($this->ctx['user'])->postJson(route('client.inbox.setup.embedded-signup.instagram'), [
            'code' => 'TEST_AUTH_CODE_INSTAGRAM',
        ]);

        $response->assertOk();

        // Verify the code exchange request to Meta omitted redirect_uri
        $this->assertNotEmpty($capturedTokenRequests);
        $firstTokenRequest = $capturedTokenRequests[0];
        $url = $firstTokenRequest->url();

        $this->assertStringContainsString('code=TEST_AUTH_CODE_INSTAGRAM', $url);
        $this->assertStringNotContainsString('redirect_uri', $url);

        $account = ChannelAccount::where('workspace_id', $this->ctx['workspace']->id)
            ->where('channel', 'instagram')
            ->first();

        $this->assertNotNull($account);
        $this->assertSame('PAGE_ACCESS_TOKEN_IG', $account->credentials['access_token']);
        $this->assertSame('IG_ACCOUNT_999', $account->credentials['instagram_account_id']);
    }

    public function test_whatsapp_embedded_signup_omits_redirect_uri_in_code_exchange(): void
    {
        $capturedTokenRequests = [];

        Http::fake([
            'graph.facebook.com/v20.0/oauth/access_token*' => function (HttpRequest $request) use (&$capturedTokenRequests) {
                $capturedTokenRequests[] = $request;

                return Http::response([
                    'access_token' => 'USER_SYSTEM_TOKEN_WABA',
                    'token_type' => 'bearer',
                ]);
            },
            'graph.facebook.com/v20.0/WABA_555666/phone_numbers*' => Http::response([
                'data' => [
                    [
                        'id' => 'PHONE_777888',
                        'display_phone_number' => '+1 555-0199',
                        'verified_name' => 'WhatsApp Test',
                        'quality_rating' => 'GREEN',
                    ],
                ],
            ]),
            'graph.facebook.com/v20.0/WABA_555666*' => Http::response([
                'id' => 'WABA_555666',
                'name' => 'Test WABA Account',
                'currency' => 'USD',
                'timezone_id' => '1',
            ]),
            'graph.facebook.com/*' => Http::response(['success' => true]),
        ]);

        $response = $this->actingAs($this->ctx['user'])->postJson(route('client.whatsapp.setup.embedded-signup'), [
            'code' => 'TEST_AUTH_CODE_WHATSAPP',
            'waba_id' => 'WABA_555666',
        ]);

        $response->assertOk();

        // Verify the code exchange request to Meta omitted redirect_uri
        $this->assertNotEmpty($capturedTokenRequests);
        $firstTokenRequest = $capturedTokenRequests[0];
        $url = $firstTokenRequest->url();

        $this->assertStringContainsString('code=TEST_AUTH_CODE_WHATSAPP', $url);
        $this->assertStringNotContainsString('redirect_uri', $url);

        $waba = WhatsappBusinessAccount::where('workspace_id', $this->ctx['workspace']->id)
            ->where('waba_id', 'WABA_555666')
            ->first();

        $this->assertNotNull($waba);
    }
}
