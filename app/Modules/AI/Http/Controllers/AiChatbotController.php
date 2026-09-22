<?php

namespace App\Modules\AI\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AI\Models\AiBotProductAssignment;
use App\Modules\AI\Models\AiBotStoreConnection;
use App\Modules\AI\Models\AiBotToolPermission;
use App\Modules\AI\Models\AiChatbot;
use App\Modules\AI\Models\AiKnowledgeBase;
use App\Modules\AI\Services\ChatbotRunner;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Ecommerce\Services\CommerceToolRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AiChatbotController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    public function index(Request $request): Response
    {
        $wid = $this->workspaceId($request);

        $chatbots = AiChatbot::where('workspace_id', $wid)
            ->with([
                'knowledgeBase',
                'knowledgeBases',
                'storeConnections.store',
                'productAssignments.product',
                'toolPermissions',
            ])
            ->latest()
            ->get();

        $knowledgeBases = AiKnowledgeBase::where('workspace_id', $wid)->get(['id', 'name']);
        $stores = EcommerceStore::where('workspace_id', $wid)->get(['id', 'name', 'platform', 'currency', 'status']);
        $products = EcommerceProduct::where('workspace_id', $wid)->get(['id', 'store_id', 'name', 'price', 'currency', 'product_type', 'slug']);
        $tools = CommerceToolRegistry::getToolDefinitions();

        return Inertia::render('AI/Chatbots/Index', [
            'chatbots' => $chatbots,
            'knowledgeBases' => $knowledgeBases,
            'stores' => $stores,
            'products' => $products,
            'availableTools' => array_map(fn ($t) => [
                'name' => $t['function']['name'],
                'description' => $t['function']['description'],
            ], $tools),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:128'],
            'purpose' => ['nullable', 'string', 'in:sales,support,recommendation,general'],
        ]);

        $bot = AiChatbot::create([
            'workspace_id' => $wid,
            'name' => $validated['name'],
            'purpose' => $validated['purpose'] ?? 'sales',
            'tone' => 'professional',
            'temperature' => 0.70,
            'enabled' => true,
        ]);

        // Auto-connect native store if one exists
        $nativeStore = EcommerceStore::where('workspace_id', $wid)->where('status', 'connected')->first();
        if ($nativeStore) {
            AiBotStoreConnection::create([
                'workspace_id' => $wid,
                'chatbot_id' => $bot->id,
                'store_id' => $nativeStore->id,
                'is_store_default' => true,
                'enable_catalog_search' => true,
                'enable_cart_creation' => true,
                'enable_order_tracking' => true,
            ]);
        }

        return back()->with('success', 'Chatbot created successfully.');
    }

    public function update(Request $request, AiChatbot $chatbot): RedirectResponse
    {
        $this->authorise($request, $chatbot);
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:128'],
            'purpose' => ['nullable', 'string', 'in:sales,support,recommendation,general'],
            'ai_kb_id' => ['nullable', 'integer'],
            'knowledge_base_ids' => ['nullable', 'array'],
            'knowledge_base_ids.*' => ['integer'],
            'system_prompt' => ['nullable', 'string', 'max:8192'],
            'tone' => ['nullable', 'string', 'max:64'],
            'temperature' => ['nullable', 'numeric', 'min:0', 'max:1.5'],
            'max_context_chunks' => ['nullable', 'integer', 'min:1', 'max:20'],
            'fallback_reply' => ['nullable', 'string', 'max:512'],
            'is_default' => ['boolean'],
            'handoff_threshold' => ['nullable', 'integer', 'min:1', 'max:10'],
            'channels' => ['nullable', 'array'],
            'enabled' => ['boolean'],
            // Commerce Store connections
            'store_ids' => ['nullable', 'array'],
            'store_ids.*' => ['integer'],
            // Product overrides
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer'],
            // Tool permissions
            'tools' => ['nullable', 'array'],
            'tools.*' => ['string'],
        ]);

        // Update core chatbot fields
        $chatbot->update([
            'name' => $validated['name'],
            'purpose' => $validated['purpose'] ?? $chatbot->purpose ?? 'sales',
            'ai_kb_id' => $validated['ai_kb_id'] ?? null,
            'system_prompt' => $validated['system_prompt'] ?? null,
            'tone' => $validated['tone'] ?? 'professional',
            'temperature' => $validated['temperature'] ?? 0.70,
            'max_context_chunks' => $validated['max_context_chunks'] ?? 5,
            'fallback_reply' => $validated['fallback_reply'] ?? null,
            'is_default' => $validated['is_default'] ?? false,
            'handoff_threshold' => $validated['handoff_threshold'] ?? 3,
            'channels' => $validated['channels'] ?? null,
            'enabled' => $validated['enabled'] ?? true,
        ]);

        // If marked default, unset other defaults in this workspace
        if (! empty($validated['is_default'])) {
            AiChatbot::where('workspace_id', $wid)
                ->where('id', '!=', $chatbot->id)
                ->update(['is_default' => false]);
        }

        // Sync Multi-KB bindings
        if (isset($validated['knowledge_base_ids'])) {
            $validKbIds = AiKnowledgeBase::where('workspace_id', $wid)
                ->whereIn('id', $validated['knowledge_base_ids'])
                ->pluck('id')
                ->toArray();
            $chatbot->knowledgeBases()->sync($validKbIds);
        }

        // Sync Store Connections
        if (isset($validated['store_ids'])) {
            $validStoreIds = EcommerceStore::where('workspace_id', $wid)
                ->whereIn('id', $validated['store_ids'])
                ->pluck('id')
                ->toArray();

            $existing = $chatbot->storeConnections()->pluck('store_id')->toArray();
            $toAdd = array_diff($validStoreIds, $existing);
            $toRemove = array_diff($existing, $validStoreIds);

            if (! empty($toRemove)) {
                AiBotStoreConnection::where('chatbot_id', $chatbot->id)->whereIn('store_id', $toRemove)->delete();
            }
            foreach ($toAdd as $storeId) {
                AiBotStoreConnection::create([
                    'workspace_id' => $wid,
                    'chatbot_id' => $chatbot->id,
                    'store_id' => $storeId,
                    'is_store_default' => true,
                    'enable_catalog_search' => true,
                    'enable_cart_creation' => true,
                    'enable_order_tracking' => true,
                ]);
            }
        }

        // Sync Product Assignments
        if (isset($validated['product_ids'])) {
            $validProductIds = EcommerceProduct::where('workspace_id', $wid)
                ->whereIn('id', $validated['product_ids'])
                ->pluck('id')
                ->toArray();

            $existingProds = $chatbot->productAssignments()->pluck('product_id')->toArray();
            $toRemoveProds = array_diff($existingProds, $validProductIds);
            $toAddProds = array_diff($validProductIds, $existingProds);

            if (! empty($toRemoveProds)) {
                AiBotProductAssignment::where('chatbot_id', $chatbot->id)->whereIn('product_id', $toRemoveProds)->delete();
            }
            foreach ($toAddProds as $prodId) {
                // Ensure unique product assignment
                AiBotProductAssignment::where('product_id', $prodId)->delete();
                AiBotProductAssignment::create([
                    'workspace_id' => $wid,
                    'chatbot_id' => $chatbot->id,
                    'product_id' => $prodId,
                ]);
            }
        }

        // Sync Tool Permissions
        if (isset($validated['tools'])) {
            $allowedTools = $validated['tools'];
            $allToolDefs = CommerceToolRegistry::getToolDefinitions();
            foreach ($allToolDefs as $toolDef) {
                $toolName = $toolDef['function']['name'];
                AiBotToolPermission::updateOrCreate(
                    ['chatbot_id' => $chatbot->id, 'tool_name' => $toolName],
                    ['is_allowed' => in_array($toolName, $allowedTools, true)]
                );
            }
        }

        return back()->with('success', 'Chatbot updated successfully.');
    }

    public function destroy(Request $request, AiChatbot $chatbot): RedirectResponse
    {
        $this->authorise($request, $chatbot);
        $chatbot->delete();

        return back()->with('success', 'Chatbot deleted.');
    }

    public function playground(Request $request, AiChatbot $chatbot): JsonResponse
    {
        $this->authorise($request, $chatbot);
        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'history' => ['nullable', 'array'],
            'product_id' => ['nullable', 'integer'],
        ]);

        $wid = $this->workspaceId($request);
        $productContext = null;
        if (! empty($request->product_id)) {
            $productContext = EcommerceProduct::where('workspace_id', $wid)->find($request->product_id);
        }

        try {
            $result = app(ChatbotRunner::class)->runForApi(
                $chatbot,
                $request->message,
                $wid,
                $request->history ?? [],
                $productContext
            );

            return response()->json([
                'reply' => $result['reply'] ?? $chatbot->fallback_reply ?? 'No response.',
                'tokens_used' => $result['tokens_used'] ?? 0,
                'actions' => $result['actions'] ?? [],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    private function authorise(Request $request, AiChatbot $chatbot): void
    {
        abort_unless((int) $chatbot->workspace_id === $this->workspaceId($request), 403);
    }
}
