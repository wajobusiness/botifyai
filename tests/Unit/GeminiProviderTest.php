<?php

namespace Tests\Unit;

use App\Modules\AI\Services\Llm\GeminiProvider;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        GeminiProvider::clearRuntimeCache();
    }

    public function test_chat_succeeds_with_gemini_3_8_flash(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [['text' => 'Hello from Gemini 3.8 Flash!']],
                            'role' => 'model',
                        ],
                        'finishReason' => 'STOP',
                    ],
                ],
                'usageMetadata' => [
                    'promptTokenCount' => 12,
                    'candidatesTokenCount' => 6,
                ],
            ], 200),
        ]);

        $provider = new GeminiProvider('test-api-key', 'gemini-3.8-flash');
        $response = $provider->chat([
            ['role' => 'user', 'content' => 'Hello'],
        ]);

        $this->assertSame('Hello from Gemini 3.8 Flash!', $response->content);
        $this->assertSame(12, $response->promptTokens);
        $this->assertSame(6, $response->completionTokens);
        $this->assertSame('gemini-3.8-flash', $response->model);
    }

    public function test_chat_auto_recovers_when_google_recommends_gemini_3_6_flash(): void
    {
        Http::fake([
            // Return Google's exact deprecation/upgrade recommendation response
            'https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent*' => Http::response([
                'error' => [
                    'code' => 404,
                    'message' => 'This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.6-flash for the latest features and improvements.',
                    'status' => 'NOT_FOUND',
                ],
            ], 404),
            // The recommended gemini-3.6-flash endpoint succeeds
            'https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [['text' => 'Gemini 3.6 Flash auto-recovery worked!']],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $provider = new GeminiProvider('test-api-key', 'gemini-3.8-flash');
        $response = $provider->chat([
            ['role' => 'user', 'content' => 'Hello'],
        ]);

        $this->assertSame('Gemini 3.6 Flash auto-recovery worked!', $response->content);
        $this->assertSame('gemini-3.6-flash', $response->model);
    }

    public function test_deprecated_model_automatically_tries_3_8_and_3_6_flash(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [['text' => 'Recovered via 3.8 flash!']],
                        ],
                    ],
                ],
            ], 200),
        ]);

        // When user config is still set to deprecated gemini-1.5-flash or gemini-2.5-flash
        $provider = new GeminiProvider('test-api-key', 'gemini-1.5-flash');
        $response = $provider->chat([
            ['role' => 'user', 'content' => 'Hello'],
        ]);

        $this->assertSame('Recovered via 3.8 flash!', $response->content);
        $this->assertSame('gemini-3.8-flash', $response->model);
    }

    public function test_chat_falls_back_to_v1beta_when_v1_returns_404(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent*' => Http::response([
                'error' => ['code' => 404, 'message' => 'not found on v1'],
            ], 404),
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [['text' => 'Fallback to v1beta succeeded!']],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $provider = new GeminiProvider('test-api-key', 'gemini-3.8-flash');
        $response = $provider->chat([
            ['role' => 'user', 'content' => 'Hello'],
        ]);

        $this->assertSame('Fallback to v1beta succeeded!', $response->content);
        $this->assertSame('gemini-3.8-flash', $response->model);
    }

    public function test_chat_uses_dynamic_discovery_via_list_models_if_candidates_fail(): void
    {
        Http::fake([
            // Candidate URLs return 404
            'https://generativelanguage.googleapis.com/*/models/*:generateContent*' => function ($request) {
                if (str_contains($request->url(), 'models/gemini-custom-flash:generateContent')) {
                    return Http::response([
                        'candidates' => [
                            [
                                'content' => ['parts' => [['text' => 'Discovered model worked!']]],
                            ],
                        ],
                    ], 200);
                }

                return Http::response([], 404);
            },
            // ListModels endpoint on v1 returns list of models
            'https://generativelanguage.googleapis.com/v1/models?*' => Http::response([
                'models' => [
                    [
                        'name' => 'models/gemini-custom-flash',
                        'supportedGenerationMethods' => ['generateContent', 'countTokens'],
                    ],
                ],
            ], 200),
        ]);

        $provider = new GeminiProvider('test-api-key', 'unknown-model');
        $response = $provider->chat([
            ['role' => 'user', 'content' => 'Test'],
        ]);

        $this->assertSame('Discovered model worked!', $response->content);
        $this->assertSame('gemini-custom-flash', $response->model);
    }

    public function test_chat_throws_diagnostic_troubleshooting_exception_when_all_fail(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'error' => ['code' => 404, 'message' => 'models/gemini-3.8-flash is not found for API version v1'],
            ], 404),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Google AI Studio (https://aistudio.google.com/app/apikey)');

        $provider = new GeminiProvider('test-api-key', 'gemini-3.8-flash');
        $provider->chat([['role' => 'user', 'content' => 'Test']]);
    }

    public function test_embed_succeeds_and_cleans_model_name(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/v1/models/text-embedding-004:batchEmbedContents*' => Http::response([
                'embeddings' => [
                    ['values' => [0.1, 0.2, 0.3]],
                    ['values' => [0.4, 0.5, 0.6]],
                ],
            ], 200),
        ]);

        $provider = new GeminiProvider('test-api-key', 'gemini-3.8-flash', 'models/text-embedding-004');
        $vectors = $provider->embed(['hello', 'world']);

        $this->assertCount(2, $vectors);
        $this->assertSame([0.1, 0.2, 0.3], $vectors[0]);
        $this->assertSame([0.4, 0.5, 0.6], $vectors[1]);
    }
}
