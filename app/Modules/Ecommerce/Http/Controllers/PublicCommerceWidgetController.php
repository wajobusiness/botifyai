<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AI\Models\AiChatbot;
use App\Modules\AI\Models\ConversationSession;
use App\Modules\AI\Services\ChatbotRunner;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicCommerceWidgetController extends Controller
{
    public function __construct(
        private ChatbotRunner $runner
    ) {}

    /**
     * GET /api/v1/public/widget/config
     * Returns the active bot configuration, store info, and suggested conversation starters for a product.
     */
    public function config(Request $request): JsonResponse
    {
        $productTarget = $request->query('product');
        $storeTarget = $request->query('store');

        $product = null;
        $store = null;

        if ($productTarget) {
            $product = EcommerceProduct::with(['store', 'digitalAsset'])
                ->where('is_published', true)
                ->where(function ($q) use ($productTarget) {
                    $q->where('slug', $productTarget)
                        ->orWhere('id', (int) $productTarget);
                })
                ->first();

            if ($product) {
                $store = $product->store;
            }
        }

        if (! $store && $storeTarget) {
            $store = EcommerceStore::where('uuid', $storeTarget)
                ->orWhere('slug', $storeTarget)
                ->first();
        }

        if (! $product && ! $store) {
            return response()->json(['error' => 'Store or product not found.'], 404);
        }

        // Resolve connected bot: Product override -> Store default -> Workspace default
        $bot = $product ? $product->resolvedBot() : $store->defaultBot();

        if (! $bot || ! $bot->enabled) {
            return response()->json([
                'enabled' => false,
                'message' => 'AI commerce assistant is currently unavailable.',
            ]);
        }

        $productName = $product ? $product->name : ($store ? $store->name : 'our store');
        $isDigital = $product && $product->product_type === 'digital';

        // Pre-seeded contextual prompt pills
        $prompts = [];
        if ($isDigital) {
            $prompts[] = 'Is this download instant after payment?';
            $prompts[] = 'What file formats are included?';
            $prompts[] = 'Can I pay with Bank Transfer or USSD?';
        } else {
            $prompts[] = 'Tell me more about '.$productName;
            $prompts[] = 'What are the available payment options?';
            $prompts[] = 'Can I get a discount?';
        }

        return response()->json([
            'enabled' => true,
            'bot' => [
                'name' => $bot->name,
                'purpose' => $bot->purpose,
                'tone' => $bot->tone,
                'avatar_letter' => strtoupper(substr($bot->name, 0, 1)),
            ],
            'greeting' => "Hi there! 👋 I'm {$bot->name}. Have any questions about **{$productName}**? I'm here to help you choose or complete your purchase!",
            'suggested_prompts' => $prompts,
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'currency' => $product->currency ?: 'NGN',
            ] : null,
            'store' => [
                'name' => $store?->name ?: 'BotifyAI Store',
                'brand_color' => $store?->brand_color ?: '#0D9488',
            ],
        ]);
    }

    /**
     * POST /api/v1/public/widget/chat
     * Exchange messages with the connected commerce bot in an ephemeral or persistent guest session.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_token' => ['required', 'string', 'max:128'],
            'message' => ['required', 'string', 'max:2000'],
            'product_id' => ['nullable', 'integer'],
            'history' => ['nullable', 'array'],
            'history.*.role' => ['required_with:history', 'string', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string'],
        ]);

        $product = null;
        if (! empty($validated['product_id'])) {
            $product = EcommerceProduct::with(['store', 'digitalAsset'])->find($validated['product_id']);
        }

        if (! $product) {
            return response()->json(['error' => 'Product context required.'], 404);
        }

        $bot = $product->resolvedBot();
        if (! $bot || ! $bot->enabled) {
            return response()->json([
                'reply' => 'Our assistant is temporarily offline. Please use the checkout form above to proceed!',
                'actions' => [],
            ]);
        }

        // Find or create conversation session
        $session = ConversationSession::firstOrCreate(
            ['session_token' => $validated['session_token']],
            [
                'uuid' => (string) Str::uuid(),
                'workspace_id' => $product->workspace_id,
                'chatbot_id' => $bot->id,
                'channel' => 'web',
                'current_store_id' => $product->store_id,
                'current_product_id' => $product->id,
                'status' => 'active',
                'last_activity_at' => now(),
            ]
        );

        $session->update([
            'current_product_id' => $product->id,
            'last_activity_at' => now(),
        ]);

        // Run agentic execution loop
        $result = $this->runner->runForApi(
            $bot,
            $validated['message'],
            $product->workspace_id,
            $validated['history'] ?? [],
            $product,
            $session->contact_id
        );

        return response()->json([
            'session_token' => $session->session_token,
            'reply' => $result['reply'] ?? $bot->fallback_reply ?? 'How else can I help you?',
            'actions' => $result['actions'] ?? [],
            'tokens_used' => $result['tokens_used'] ?? 0,
        ]);
    }
}

