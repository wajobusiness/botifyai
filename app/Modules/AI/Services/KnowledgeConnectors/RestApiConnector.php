<?php

namespace App\Modules\AI\Services\KnowledgeConnectors;

use App\Modules\AI\Models\KnowledgeSource;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RestApiConnector implements ConnectorInterface
{
    public function testConnection(array $details): array
    {
        $url = $details['url'] ?? null;
        if (! $url || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return ['success' => false, 'message' => 'Invalid or missing API endpoint URL.'];
        }

        try {
            $request = Http::timeout(10);
            if (! empty($details['token'])) {
                $request = $request->withToken($details['token']);
            }
            if (! empty($details['headers']) && is_array($details['headers'])) {
                $request = $request->withHeaders($details['headers']);
            }

            $response = $request->get($url);

            if ($response->successful()) {
                return ['success' => true, 'message' => 'Connected successfully! Received HTTP '.$response->status()];
            }

            return ['success' => false, 'message' => 'HTTP request failed with status: '.$response->status()];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => 'Connection error: '.$e->getMessage()];
        }
    }

    public function extract(KnowledgeSource $source): array
    {
        $details = $source->connection_details ?? [];
        $url = $details['url'] ?? null;
        if (! $url) {
            return [];
        }

        try {
            $request = Http::timeout(20);
            if (! empty($details['token'])) {
                $request = $request->withToken($details['token']);
            }
            if (! empty($details['headers']) && is_array($details['headers'])) {
                $request = $request->withHeaders($details['headers']);
            }

            $response = $request->get($url);
            if (! $response->successful()) {
                Log::warning('RestApiConnector failed to fetch', ['url' => $url, 'status' => $response->status()]);
                return [];
            }

            $data = $response->json();
            $items = [];

            // If payload has a nested items/data key
            $dataPath = $details['data_path'] ?? null;
            if ($dataPath && isset($data[$dataPath]) && is_array($data[$dataPath])) {
                $rawList = $data[$dataPath];
            } elseif (is_array($data)) {
                $rawList = isset($data['data']) && is_array($data['data']) ? $data['data'] : $data;
            } else {
                $rawList = [$data];
            }

            foreach ($rawList as $idx => $entry) {
                if (is_array($entry)) {
                    $contentLines = [];
                    foreach ($entry as $key => $val) {
                        if (is_scalar($val)) {
                            $keyFormatted = ucwords(str_replace(['_', '-'], ' ', (string) $key));
                            $contentLines[] = "{$keyFormatted}: {$val}";
                        }
                    }
                    $content = implode("\n", $contentLines);
                } else {
                    $content = (string) $entry;
                }

                if (! empty($content)) {
                    $items[] = [
                        'content' => $content,
                        'metadata' => [
                            'source' => $source->name,
                            'type' => 'rest_api',
                            'item_index' => $idx,
                            'url' => $url,
                        ],
                    ];
                }
            }

            return $items;
        } catch (\Throwable $e) {
            Log::error('RestApiConnector extraction error: '.$e->getMessage());
            return [];
        }
    }
}
