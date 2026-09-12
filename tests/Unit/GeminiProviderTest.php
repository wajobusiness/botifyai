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

    public function test_chat_succeeds_on_v1_and_cleans_model_prefix(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [['text' => 'Hello from Gemini!']],
                            'role' => 'model',
                        ],
                        'finishReason' => 'STOP',
                    ],
                ],
                'usageMetadata' => [
                    'promptTokenCount' => 10,
                    'candidatesTokenCount' => 5,
                ],
            ], 200),
        ]);

        $provider = new GeminiProvider('test-api-key', 'models/gemini-1.5-flash');
        $response = $provider->chat([
            ['role' => 'user', 'content' => 'Hello'],
        ]);

        $this->assertSame('Hello from Gemini!', $response->content);
        $this->assertSame(10, $response->promptTokens);
        $this->assertSame(5, $response->completionTokens);
        $this->assertSame('gemini-1.5-flash', $response->model);
    }

    public function test_chat_falls_back_to_v1beta_when_v1_returns_404(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent*' => Http::response([
                'error' => ['code' => 404, 'message' => 'models/gemini-1.5-flash is not found for API version v1'],
            ], 404),
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [['text' => 'Fallback to v1beta succeeded!']],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $provider = new GeminiProvider('test-api-key', 'gemini-1.5-flash');
        $response = $provider->chat([
            ['role' => 'user', 'content' => 'Hello'],
        ]);

        $this->assertSame('Fallback to v1beta succeeded!', $response->content);
        $this->assertSame('gemini-1.5-flash', $response->model);
    }

    public function test_chat_falls_back_to_candidate_models_when_base_model_returns_404(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent*' => Http::response([], 404),
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent*' => Http::response([], 404),
            'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [['text' => 'Fallback to gemini-1.5-flash-latest succeeded!']],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $provider = new GeminiProvider('test-api-key', 'gemini-1.5-flash');
        $response = $provider->chat([
            ['role' => 'user', 'content' => 'Test'],
        ]);

        $this->assertSame('Fallback to gemini-1.5-flash-latest succeeded!', $response->content);
        $this->assertSame('gemini-1.5-flash-latest', $response->model);
    }

    public function test_chat_uses_dynamic_discovery_via_list_models_if_candidates_fail(): void
    {
        Http::fake([
            // All generateContent candidate URLs return 404
            'https://generativelanguage.googleapis.com/*/models/*:generateContent*' => function ($request) {
                if (str_contains($request->url(), 'models/gemini-discovered-flash:generateContent')) {
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
                        'name' => 'models/gemini-discovered-flash',
                        'supportedGenerationMethods' => ['generateContent', 'countTokens'],
                    ],
                ],
            ], 200),
        ]);

        $provider = new GeminiProvider('test-api-key', 'custom-model');
        $response = $provider->chat([
            ['role' => 'user', 'content' => 'Test'],
        ]);

        $this->assertSame('Discovered model worked!', $response->content);
        $this->assertSame('gemini-discovered-flash', $response->model);
    }

    public function test_chat_throws_diagnostic_troubleshooting_exception_when_all_fail(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'error' => ['code' => 404, 'message' => 'models/gemini-1.5-flash is not found for API version v1beta'],
            ], 404),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Google AI Studio (https://aistudio.google.com/app/apikey)');

        $provider = new GeminiProvider('test-api-key', 'gemini-1.5-flash');
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

        $provider = new GeminiProvider('test-api-key', 'gemini-1.5-flash', 'models/text-embedding-004');
        $vectors = $provider->embed(['hello', 'world']);

        $this->assertCount(2, $vectors);
        $this->assertSame([0.1, 0.2, 0.3], $vectors[0]);
        $this->assertSame([0.4, 0.5, 0.6], $vectors[1]);
    }
}
