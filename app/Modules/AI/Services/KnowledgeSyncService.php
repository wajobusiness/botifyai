<?php

namespace App\Modules\AI\Services;

use App\Modules\AI\Models\AiKbChunk;
use App\Modules\AI\Models\AiKbDocument;
use App\Modules\AI\Models\AiKnowledgeBase;
use App\Modules\AI\Models\KnowledgeDocument;
use App\Modules\AI\Models\KnowledgeSource;
use App\Modules\AI\Services\KnowledgeConnectors\CloudStorageConnector;
use App\Modules\AI\Services\KnowledgeConnectors\ConnectorInterface;
use App\Modules\AI\Services\KnowledgeConnectors\CrmConnector;
use App\Modules\AI\Services\KnowledgeConnectors\DatabaseConnector;
use App\Modules\AI\Services\KnowledgeConnectors\EcommerceConnector;
use App\Modules\AI\Services\KnowledgeConnectors\RestApiConnector;
use Illuminate\Support\Facades\Log;

class KnowledgeSyncService
{
    public function __construct(
        private LlmGateway $llm,
        private EmbeddingStore $store,
    ) {}

    /**
     * Resolve connector instance by type
     */
    public function getConnector(string $type): ?ConnectorInterface
    {
        return match ($type) {
            'rest_api' => new RestApiConnector(),
            'mysql', 'postgres', 'mongodb', 'database' => new DatabaseConnector(),
            'shopify', 'woocommerce', 'ecommerce' => new EcommerceConnector(),
            'google_drive', 'dropbox', 'cloud_storage' => new CloudStorageConnector(),
            'hubspot', 'salesforce', 'zoho', 'crm' => new CrmConnector(),
            default => null,
        };
    }

    /**
     * Unified Knowledge Pipeline:
     * Source → Extract Data → Clean Data → Generate Embeddings → Store Knowledge → AI Retrieval
     */
    public function sync(KnowledgeSource $source): array
    {
        $connector = $this->getConnector($source->type);
        if (! $connector) {
            return ['success' => false, 'message' => "Unknown connector type: {$source->type}"];
        }

        $source->update(['status' => 'syncing']);

        try {
            // 1. Extract Data
            $extracted = $connector->extract($source);

            // 2. Clean Data & 3. Store Knowledge Documents
            $source->documents()->delete(); // Fresh sync

            // Resolve or ensure attached AiKnowledgeBase for AI Retrieval
            $kb = $source->knowledgeBase;
            if (! $kb) {
                $kb = AiKnowledgeBase::firstOrCreate(
                    ['workspace_id' => $source->workspace_id, 'name' => 'Enterprise Knowledge Hub'],
                    ['status' => 'ready']
                );
                $source->update(['kb_id' => $kb->id]);
            }

            $docCount = 0;
            $totalTokens = 0;

            foreach ($extracted as $item) {
                $cleanContent = $this->cleanData($item['content'] ?? '');
                if (empty($cleanContent)) {
                    continue;
                }

                // Store in knowledge_documents
                KnowledgeDocument::create([
                    'knowledge_source_id' => $source->id,
                    'content' => $cleanContent,
                    'metadata' => $item['metadata'] ?? [],
                ]);

                // Also index directly into AiKbDocument / AiKbChunk for instant RAG in ChatbotRunner
                $kbDoc = AiKbDocument::create([
                    'kb_id' => $kb->id,
                    'source_type' => $source->type,
                    'source_ref' => $source->name.' #'.$docCount,
                    'title' => $item['metadata']['title'] ?? ($source->name.' Item #'.($docCount + 1)),
                    'status' => 'ready',
                    'tokens' => (int) (strlen($cleanContent) / 4),
                    'last_indexed_at' => now(),
                ]);

                // Chunk into semantic pieces
                $chunks = $this->chunkText($cleanContent);
                foreach ($chunks as $cIdx => $chunkText) {
                    $tokens = (int) (strlen($chunkText) / 4);
                    $totalTokens += $tokens;

                    $chunk = AiKbChunk::create([
                        'kb_id' => $kb->id,
                        'document_id' => $kbDoc->id,
                        'ord' => $cIdx,
                        'content' => $chunkText,
                        'tokens' => $tokens,
                    ]);

                    // Generate embeddings and store
                    try {
                        $embeddings = $this->llm->embed($source->workspace_id, [$chunkText]);
                        if (! empty($embeddings[0])) {
                            $this->store->storeEmbedding($chunk, $embeddings[0]);
                        }
                    } catch (\Throwable $e) {
                        Log::warning('Embedding generation skipped in sync', ['error' => $e->getMessage()]);
                    }
                }

                $docCount++;
            }

            $source->update([
                'status' => 'active',
                'last_sync' => now(),
                'metadata' => array_merge($source->metadata ?? [], [
                    'document_count' => $docCount,
                    'token_count' => $totalTokens,
                ]),
            ]);

            return [
                'success' => true,
                'message' => "Successfully synced {$docCount} knowledge documents from {$source->name}!",
                'count' => $docCount,
            ];
        } catch (\Throwable $e) {
            Log::error('Knowledge sync failed', ['source_id' => $source->id, 'error' => $e->getMessage()]);
            $source->update(['status' => 'error']);

            return ['success' => false, 'message' => 'Sync failed: '.$e->getMessage()];
        }
    }

    /**
     * Clean and normalize data string
     */
    private function cleanData(string $raw): string
    {
        // Strip HTML tags
        $clean = strip_tags($raw);
        // Normalize whitespace and newlines
        $clean = preg_replace('/[ \t]+/', ' ', $clean);
        $clean = preg_replace('/\n\s*\n+/', "\n\n", $clean);

        return trim($clean);
    }

    /**
     * Chunk text into chunks of ~500 words
     */
    private function chunkText(string $text, int $maxWords = 400): array
    {
        $words = preg_split('/\s+/', $text);
        if (count($words) <= $maxWords) {
            return [$text];
        }

        $chunks = [];
        $current = [];
        foreach ($words as $w) {
            $current[] = $w;
            if (count($current) >= $maxWords) {
                $chunks[] = implode(' ', $current);
                $current = array_slice($current, -$maxWords / 4); // 25% overlap
            }
        }
        if (! empty($current)) {
            $chunks[] = implode(' ', $current);
        }

        return $chunks;
    }
}
