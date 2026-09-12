<?php

namespace App\Modules\AI\Services\Llm;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiProvider implements LlmProviderInterface
{
    private const API_BASE = 'https://generativelanguage.googleapis.com';
    private const SUPPORTED_VERSIONS = ['v1', 'v1beta'];

    /**
     * Cache resolved working version and model per API key during runtime.
     * key: md5($apiKey) => ['requested' => '...', 'version' => 'v1', 'model' => 'gemini-1.5-flash']
     */
    private static array $resolvedChatCache = [];
    private static array $resolvedEmbedCache = [];

    public function __construct(
        private readonly string $apiKey,
        private readonly string $chatModel = 'gemini-1.5-flash',
        private readonly string $embedModel = 'text-embedding-004',
    ) {}

    public static function clearRuntimeCache(): void
    {
        self::$resolvedChatCache = [];
        self::$resolvedEmbedCache = [];
    }

    public function chat(array $messages, array $opts = []): LlmResponse
    {
        $start = microtime(true);
        $requestedModel = $opts['model'] ?? $this->chatModel;
        $cleanRequested = $this->cleanModel($requestedModel);
        $cacheKey = md5($this->apiKey);

        // Separate system instructions and map message roles
        $systemInstruction = null;
        $rawContents = [];

        foreach ($messages as $m) {
            $role = $m['role'] ?? 'user';
            $text = (string) ($m['content'] ?? '');

            if ($role === 'system') {
                $systemInstruction = ['parts' => [['text' => $text]]];
            } else {
                $rawContents[] = [
                    'role' => $role === 'assistant' ? 'model' : 'user',
                    'parts' => [['text' => $text]],
                ];
            }
        }

        // Normalize conversation turns: Google requires alternating user/model turns
        $contents = [];
        foreach ($rawContents as $entry) {
            $lastIndex = count($contents) - 1;
            if ($lastIndex >= 0 && $contents[$lastIndex]['role'] === $entry['role']) {
                $contents[$lastIndex]['parts'][0]['text'] .= "\n\n".$entry['parts'][0]['text'];
            } else {
                $contents[] = $entry;
            }
        }

        if (empty($contents)) {
            $contents[] = [
                'role' => 'user',
                'parts' => [['text' => 'Hello']],
            ];
        } elseif ($contents[0]['role'] === 'model') {
            array_unshift($contents, [
                'role' => 'user',
                'parts' => [['text' => 'Please proceed.']],
            ]);
        }

        $generationConfig = ['maxOutputTokens' => $opts['max_tokens'] ?? 1024];
        if (isset($opts['temperature'])) {
            $generationConfig['temperature'] = (float) $opts['temperature'];
        }

        $body = [
            'contents' => $contents,
            'generationConfig' => $generationConfig,
        ];
        if ($systemInstruction) {
            $body['systemInstruction'] = $systemInstruction;
        }

        // Build candidate list of [version, model] to attempt
        $candidates = [];

        // If previously resolved for this API key and the requested model matches, try it first
        if (isset(self::$resolvedChatCache[$cacheKey])) {
            $cached = self::$resolvedChatCache[$cacheKey];
            if ($cached['requested'] === $cleanRequested) {
                $candidates[] = [$cached['version'], $cached['model']];
            }
        }

        $candidateModels = $this->getCandidateModels($cleanRequested);
        foreach ($candidateModels as $cModel) {
            foreach (self::SUPPORTED_VERSIONS as $version) {
                $pair = [$version, $cModel];
                if (! in_array($pair, $candidates, true)) {
                    $candidates[] = $pair;
                }
            }
        }

        $successResp = null;
        $successVersion = null;
        $successModel = null;
        $lastResp = null;
        $lastErrorBody = '';

        foreach ($candidates as [$version, $model]) {
            $url = self::API_BASE."/{$version}/models/{$model}:generateContent?key={$this->apiKey}";

            try {
                $resp = Http::retry(1, 300)->timeout(60)->post($url, $body);

                if ($resp->successful()) {
                    $successResp = $resp;
                    $successVersion = $version;
                    $successModel = $model;
                    break;
                }

                $lastResp = $resp;
                $lastErrorBody = $resp->body();
                $status = $resp->status();

                // If 404 (model not found for version or alias), try next candidate
                if ($status === 404) {
                    continue;
                }

                // If 400 due to unsupported systemInstruction, fold into user prompt and retry
                if ($status === 400 && $systemInstruction && str_contains(strtolower($lastErrorBody), 'systeminstruction')) {
                    $fallbackBody = $body;
                    unset($fallbackBody['systemInstruction']);
                    $sysText = $systemInstruction['parts'][0]['text'] ?? '';
                    $fallbackBody['contents'][0]['parts'][0]['text'] =
                        "Instructions: {$sysText}\n\n".$fallbackBody['contents'][0]['parts'][0]['text'];

                    $retryResp = Http::retry(1, 300)->timeout(60)->post($url, $fallbackBody);
                    if ($retryResp->successful()) {
                        $successResp = $retryResp;
                        $successVersion = $version;
                        $successModel = $model;
                        break;
                    }
                    $lastResp = $retryResp;
                    $lastErrorBody = $retryResp->body();
                }

                // If auth error (401/403 or invalid key), stop trying more candidates with same key
                if (in_array($status, [401, 403], true) || str_contains($lastErrorBody, 'API_KEY_INVALID')) {
                    break;
                }
            } catch (\Throwable $e) {
                $lastErrorBody = $e->getMessage();
            }
        }

        // If candidates all returned 404, query ListModels for dynamic model discovery
        if (! $successResp && ($lastResp?->status() === 404 || str_contains($lastErrorBody, 'not found for API version'))) {
            $discovered = $this->discoverWorkingModel($cleanRequested);
            if ($discovered) {
                [$discVersion, $discModel] = $discovered;
                $url = self::API_BASE."/{$discVersion}/models/{$discModel}:generateContent?key={$this->apiKey}";
                $resp = Http::retry(1, 300)->timeout(60)->post($url, $body);
                if ($resp->successful()) {
                    $successResp = $resp;
                    $successVersion = $discVersion;
                    $successModel = $discModel;
                    Log::channel('json')->info('llm.gemini_model_discovered', [
                        'requested' => $cleanRequested,
                        'resolved' => $discModel,
                        'version' => $discVersion,
                    ]);
                } else {
                    $lastResp = $resp;
                    $lastErrorBody = $resp->body();
                }
            }
        }

        if (! $successResp) {
            $this->throwDetailedException('chat', $cleanRequested, $lastResp?->status(), $lastErrorBody);
        }

        self::$resolvedChatCache[$cacheKey] = [
            'requested' => $cleanRequested,
            'version' => $successVersion,
            'model' => $successModel,
        ];

        $json = $successResp->json();
        $latency = (int) ((microtime(true) - $start) * 1000);

        $parts = $json['candidates'][0]['content']['parts'] ?? [];
        $content = '';
        foreach ($parts as $p) {
            if (isset($p['text'])) {
                $content .= $p['text'];
            }
        }

        if (empty($content) && isset($json['candidates'][0]['finishReason']) && $json['candidates'][0]['finishReason'] !== 'STOP') {
            $content = '[Generation stopped: '.$json['candidates'][0]['finishReason'].']';
        }

        $meta = $json['usageMetadata'] ?? [];

        return new LlmResponse(
            content: $content,
            promptTokens: $meta['promptTokenCount'] ?? 0,
            completionTokens: $meta['candidatesTokenCount'] ?? 0,
            model: $successModel,
            latencyMs: $latency,
        );
    }

    public function embed(array $texts): array
    {
        if (empty($texts)) {
            return [];
        }

        $cleanModel = $this->cleanModel($this->embedModel);
        $cacheKey = md5($this->apiKey);

        $candidateModels = array_values(array_unique([
            $cleanModel,
            'text-embedding-004',
            'embedding-001',
        ]));

        $candidates = [];
        if (isset(self::$resolvedEmbedCache[$cacheKey])) {
            $cached = self::$resolvedEmbedCache[$cacheKey];
            if ($cached['requested'] === $cleanModel) {
                $candidates[] = [$cached['version'], $cached['model']];
            }
        }

        foreach ($candidateModels as $cModel) {
            foreach (self::SUPPORTED_VERSIONS as $version) {
                $pair = [$version, $cModel];
                if (! in_array($pair, $candidates, true)) {
                    $candidates[] = $pair;
                }
            }
        }

        $lastResp = null;
        $lastErrorBody = '';

        foreach ($candidates as [$version, $model]) {
            $requests = array_map(fn ($text) => [
                'model' => 'models/'.$model,
                'content' => ['parts' => [['text' => $text]]],
            ], $texts);

            $url = self::API_BASE."/{$version}/models/{$model}:batchEmbedContents?key={$this->apiKey}";

            try {
                $resp = Http::retry(1, 300)->timeout(60)->post($url, ['requests' => $requests]);
                if ($resp->successful()) {
                    self::$resolvedEmbedCache[$cacheKey] = [
                        'requested' => $cleanModel,
                        'version' => $version,
                        'model' => $model,
                    ];

                    return array_map(
                        fn ($e) => $e['values'] ?? [],
                        $resp->json('embeddings', [])
                    );
                }

                $lastResp = $resp;
                $lastErrorBody = $resp->body();

                if ($resp->status() === 404) {
                    continue;
                }
                if (in_array($resp->status(), [401, 403], true) || str_contains($lastErrorBody, 'API_KEY_INVALID')) {
                    break;
                }
            } catch (\Throwable $e) {
                $lastErrorBody = $e->getMessage();
            }
        }

        $this->throwDetailedException('embed', $cleanModel, $lastResp?->status(), $lastErrorBody);
    }

    private function cleanModel(string $model): string
    {
        $clean = trim($model, "/ \t\n\r\0\x0B");
        if (str_starts_with($clean, 'models/')) {
            $clean = substr($clean, 7);
        }

        return $clean;
    }

    private function getCandidateModels(string $requestedModel): array
    {
        $clean = $this->cleanModel($requestedModel);
        $models = [$clean];

        if (str_contains($clean, '1.5-flash')) {
            $models = array_merge($models, [
                'gemini-1.5-flash-latest',
                'gemini-2.0-flash',
                'gemini-1.5-flash-001',
                'gemini-1.5-flash-002',
                'gemini-1.5-pro',
            ]);
        } elseif (str_contains($clean, '2.0-flash')) {
            $models = array_merge($models, [
                'gemini-2.0-flash-exp',
                'gemini-1.5-flash',
                'gemini-1.5-flash-latest',
                'gemini-1.5-pro',
            ]);
        } elseif (str_contains($clean, '1.5-pro')) {
            $models = array_merge($models, [
                'gemini-1.5-pro-latest',
                'gemini-1.5-pro-001',
                'gemini-1.5-flash',
                'gemini-2.0-flash',
            ]);
        } else {
            $models = array_merge($models, [
                'gemini-1.5-flash',
                'gemini-2.0-flash',
                'gemini-1.5-pro',
            ]);
        }

        return array_values(array_unique($models));
    }

    private function discoverWorkingModel(string $requestedModel): ?array
    {
        foreach (self::SUPPORTED_VERSIONS as $version) {
            try {
                $url = self::API_BASE."/{$version}/models?key={$this->apiKey}";
                $resp = Http::timeout(10)->get($url);
                if (! $resp->successful()) {
                    continue;
                }

                $modelsList = $resp->json('models', []);
                if (empty($modelsList)) {
                    continue;
                }

                $validModels = [];
                foreach ($modelsList as $m) {
                    $methods = $m['supportedGenerationMethods'] ?? [];
                    if (in_array('generateContent', $methods, true)) {
                        $name = $this->cleanModel($m['name'] ?? '');
                        if (! empty($name)) {
                            $validModels[] = $name;
                        }
                    }
                }

                if (empty($validModels)) {
                    continue;
                }

                usort($validModels, function ($a, $b) use ($requestedModel) {
                    $scoreA = 0;
                    $scoreB = 0;
                    if (str_contains($a, $requestedModel)) {
                        $scoreA += 10;
                    }
                    if (str_contains($b, $requestedModel)) {
                        $scoreB += 10;
                    }
                    if (str_contains($a, 'flash')) {
                        $scoreA += 5;
                    }
                    if (str_contains($b, 'flash')) {
                        $scoreB += 5;
                    }
                    if (str_contains($a, '2.0')) {
                        $scoreA += 3;
                    }
                    if (str_contains($b, '2.0')) {
                        $scoreB += 3;
                    }
                    if (str_contains($a, '1.5')) {
                        $scoreA += 2;
                    }
                    if (str_contains($b, '1.5')) {
                        $scoreB += 2;
                    }

                    return $scoreB <=> $scoreA;
                });

                return [$version, $validModels[0]];
            } catch (\Throwable) {
                // Try next version
            }
        }

        return null;
    }

    private function throwDetailedException(string $action, string $model, ?int $status, string $errorBody): never
    {
        $message = "Gemini {$action} failed for model '{$model}'. ";

        if ($status === 404 || str_contains($errorBody, 'not found for API version')) {
            $message .= "The model was not found in Google's API catalog for this key (HTTP 404). "
                ."Troubleshooting:\n"
                ."1. Ensure your API key was created at Google AI Studio (https://aistudio.google.com/app/apikey).\n"
                ."2. If using a Google Cloud Console project, make sure 'Generative Language API' is enabled at console.cloud.google.com.\n"
                ."3. Check that your Google account / project has not disabled Generative Language API access.\n"
                ."Google error details: {$errorBody}";
        } elseif (in_array($status, [401, 403], true) || str_contains($errorBody, 'API_KEY_INVALID')) {
            $message .= "Google rejected the API key as invalid or unauthorized (HTTP {$status}). "
                ."Please verify your key in Google AI Studio (https://aistudio.google.com/app/apikey).\n"
                ."Google error details: {$errorBody}";
        } else {
            $message .= 'HTTP status: '.($status ?? 'unknown').". Google error details: {$errorBody}";
        }

        throw new \RuntimeException($message);
    }
}
