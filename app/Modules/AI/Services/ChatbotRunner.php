<?php

namespace App\Modules\AI\Services;

use App\Modules\AI\Models\AiChatbot;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Services\CommerceToolRegistry;
use App\Modules\Shared\Models\Message;
use Illuminate\Support\Facades\Log;

class ChatbotRunner
{
    public function __construct(
        private LlmGateway $llmGateway,
        private EmbeddingStore $embedStore,
        private CommerceToolRegistry $toolRegistry,
    ) {}

    public function run(
        AiChatbot $bot,
        Message $inboundMessage,
        ?EcommerceProduct $productContext = null
    ): ?string {
        if (! $bot->enabled) {
            return null;
        }

        $conversation = $inboundMessage->conversation;
        $body = $inboundMessage->body ?? '';
        $workspaceId = $conversation->workspace_id;

        // Load recent conversation turns as context (last 20 messages)
        $history = [];
        $recentMessages = $conversation->messages()
            ->whereIn('type', ['text', 'template'])
            ->where('id', '!=', $inboundMessage->id)
            ->orderBy('sent_at')
            ->take(20)
            ->get();

        foreach ($recentMessages as $m) {
            if (! $m->body) {
                continue;
            }
            $history[] = [
                'role' => $m->direction === 'out' ? 'assistant' : 'user',
                'content' => $m->body,
            ];
        }

        $result = $this->runSession(
            $bot,
            $body,
            $workspaceId,
            $history,
            $productContext,
            $conversation->contact_id,
            $conversation->id
        );

        return $result['reply'] ?? $bot->fallback_reply ?? null;
    }

    /**
     * API-friendly variant: run the chatbot with a plain text message, session context, and optional product.
     *
     * @param  array  $history  Array of {role, content} prior turns (optional)
     * @return array{reply: string|null, tokens_used: int, actions: array}
     */
    public function runForApi(
        AiChatbot $bot,
        string $message,
        int $workspaceId,
        array $history = [],
        ?EcommerceProduct $productContext = null,
        ?int $contactId = null
    ): array {
        return $this->runSession(
            $bot,
            $message,
            $workspaceId,
            $history,
            $productContext,
            $contactId
        );
    }

    /**
     * Unified agentic session execution loop: Multi-KB RAG + Live Context + Deterministic Tool Calling.
     */
    private function runSession(
        AiChatbot $bot,
        string $message,
        int $workspaceId,
        array $history = [],
        ?EcommerceProduct $productContext = null,
        ?int $contactId = null,
        ?int $conversationId = null
    ): array {
        // 1. Multi-KB RAG Retrieval
        $kbs = $bot->allKnowledgeBases();
        $contextChunks = [];

        if ($kbs->isNotEmpty()) {
            try {
                $embeddings = $this->llmGateway->embed($workspaceId, [$message]);
                $queryEmbedding = $embeddings[0] ?? [];

                if (! empty($queryEmbedding)) {
                    $maxChunks = $bot->max_context_chunks ?? 5;
                    $chunksPerKb = max(1, (int) ceil($maxChunks / $kbs->count()));

                    foreach ($kbs as $kb) {
                        $results = $this->embedStore->search($kb->id, $queryEmbedding, $chunksPerKb);
                        foreach ($results as $res) {
                            if (isset($res['chunk'])) {
                                $contextChunks[] = $res['chunk'];
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('ChatbotRunner RAG retrieval failed', ['error' => $e->getMessage()]);
            }
        }

        // 2. Build system prompt
        $systemPrompt = $bot->system_prompt ?? 'You are a helpful commerce assistant for this store.';
        $systemPrompt .= "\n\nTone directive: Always maintain a {$bot->tone} tone of voice.";
        $systemPrompt .= "\nImportant: Do not invent prices or stock levels. Use the available tools to search products, verify price, or generate checkout links.";

        if (! empty($contextChunks)) {
            $context = implode("\n\n---\n\n", array_map(fn ($c) => $c->content, array_slice($contextChunks, 0, $bot->max_context_chunks ?? 5)));
            $systemPrompt .= "\n\nKnowledge Base Context:\n".$context;
        }

        // 3. Inject Current Product Context if active
        if ($productContext) {
            $productDetails = [
                'Product Name: '.$productContext->name,
                'Price: '.($productContext->currency ?: 'NGN').' '.(float) $productContext->price,
                'Type: '.$productContext->product_type,
                'Description: '.strip_tags($productContext->description ?? ''),
                'Checkout URL: '.$productContext->getCheckoutUrl(),
            ];
            if ($productContext->digitalAsset) {
                $productDetails[] = 'Digital File: '.$productContext->digitalAsset->file_name.' ('.$productContext->digitalAsset->formatted_file_size.') - Instant Download Delivery';
            }
            $systemPrompt .= "\n\nThe customer is currently viewing this product on the store:\n".implode("\n", $productDetails);
        }

        // 4. Inject recent orders if contactId is known
        $orderSummary = $this->orderSummary($workspaceId, $contactId);
        if ($orderSummary !== null) {
            $systemPrompt .= "\n\nCustomer Recent Orders:\n".$orderSummary;
        }

        $messages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $history,
            [['role' => 'user', 'content' => $message]],
        );

        // 5. Resolve Allowed Commerce Tools
        $tools = CommerceToolRegistry::getToolDefinitions();
        $toolActions = [];

        // 6. Call LLM with Tool Definitions
        try {
            $opts = [
                'max_tokens' => 600,
                'temperature' => (float) ($bot->temperature ?? 0.70),
                'tools' => $tools,
                'tool_choice' => 'auto',
            ];

            $response = $this->llmGateway->chat(
                $workspaceId,
                $messages,
                $opts,
                $bot->id,
                $conversationId
            );

            // 7. Check for Tool Calls
            if (! empty($response->toolCalls)) {
                $messages[] = [
                    'role' => 'assistant',
                    'content' => $response->content ?: null,
                    'tool_calls' => $response->toolCalls,
                ];

                foreach ($response->toolCalls as $call) {
                    $toolName = $call['function']['name'] ?? '';
                    $callId = $call['id'] ?? ('call_'.Str::random(10));
                    $arguments = json_decode($call['function']['arguments'] ?? '{}', true) ?: [];

                    $toolResult = $this->toolRegistry->execute(
                        $toolName,
                        $arguments,
                        $workspaceId,
                        $productContext?->store_id,
                        $contactId
                    );

                    $toolActions[] = [
                        'tool' => $toolName,
                        'args' => $arguments,
                        'result' => $toolResult,
                    ];

                    $messages[] = [
                        'role' => 'tool',
                        'tool_call_id' => $callId,
                        'content' => json_encode($toolResult),
                    ];
                }

                // Second-turn LLM call to synthesize the tool results into natural language response
                $finalResponse = $this->llmGateway->chat(
                    $workspaceId,
                    $messages,
                    ['max_tokens' => 600, 'temperature' => (float) ($bot->temperature ?? 0.70)],
                    $bot->id,
                    $conversationId
                );

                return [
                    'reply' => $finalResponse->content,
                    'tokens_used' => ($response->promptTokens + $response->completionTokens) + ($finalResponse->promptTokens + $finalResponse->completionTokens),
                    'actions' => $toolActions,
                ];
            }

            return [
                'reply' => $response->content,
                'tokens_used' => $response->promptTokens + $response->completionTokens,
                'actions' => [],
            ];
        } catch (\Throwable $e) {
            Log::error('ChatbotRunner runSession exception', [
                'bot_id' => $bot->id,
                'workspace_id' => $workspaceId,
                'error' => $e->getMessage(),
            ]);

            return [
                'reply' => $bot->fallback_reply ?? "I'm having trouble processing your request right now. Please feel free to check our checkout options above!",
                'tokens_used' => 0,
                'actions' => [],
            ];
        }
    }

    private function orderSummary(int $workspaceId, ?int $contactId): ?string
    {
        $orderModel = 'App\Modules\Ecommerce\Models\EcommerceOrder';

        if (! $contactId || ! class_exists($orderModel)) {
            return null;
        }

        $orders = $orderModel::where('workspace_id', $workspaceId)
            ->where('contact_id', $contactId)
            ->latest('placed_at')
            ->take(3)
            ->get();

        if ($orders->isEmpty()) {
            return null;
        }

        return $orders->map(function ($o) {
            $parts = ['Order '.($o->number ?: $o->uuid ?: $o->external_order_id)];
            if ($o->payment_status) {
                $parts[] = 'payment: '.$o->payment_status;
            }
            if ($o->fulfillment_status) {
                $parts[] = 'fulfillment: '.$o->fulfillment_status;
            }
            $parts[] = 'total: '.($o->currency ?: 'NGN').' '.$o->total;
            if ($o->tracking_url) {
                $parts[] = 'tracking: '.$o->tracking_url;
            }

            return '- '.implode(', ', $parts);
        })->implode("\n");
    }
}
