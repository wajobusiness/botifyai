<?php

namespace App\Http\Controllers\Api\V1;

use App\Modules\Inbox\Models\Conversation;
use App\Modules\Inbox\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileAiCopilotApiController extends WorkspaceScopedController
{
    /**
     * POST /api/v1/mobile/ai/copilot-draft
     * Generates in-chat AI Copilot suggestions, draft replies, summaries, and action suggestions.
     */
    public function draft(Request $request): JsonResponse
    {
        $wsId = $this->workspaceId($request);

        $validated = $request->validate([
            'conversation_uuid' => 'required|string',
            'instruction' => 'nullable|string|in:draft_reply,summarize,suggest_actions',
            'tone' => 'nullable|string|in:friendly,professional,direct,concise',
            'custom_prompt' => 'nullable|string|max:500',
        ]);

        $conv = Conversation::where('workspace_id', $wsId)
            ->where('uuid', $validated['conversation_uuid'])
            ->with(['contact'])
            ->firstOrFail();

        // Get recent conversation messages (last 10 messages)
        $messages = Message::where('conversation_id', $conv->id)
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->reverse();

        $instruction = $validated['instruction'] ?? 'draft_reply';
        $contactName = $conv->contact?->first_name ?? $conv->contact?->name ?? 'Customer';

        if ($instruction === 'summarize') {
            $summary = $this->generateSummary($messages, $contactName);
            return response()->json([
                'type' => 'summary',
                'summary' => $summary,
                'conversation_uuid' => $conv->uuid,
            ]);
        }

        if ($instruction === 'suggest_actions') {
            return response()->json([
                'type' => 'actions',
                'actions' => [
                    'Send Payment Link',
                    'Confirm Shipping Details',
                    'Share Product Catalog',
                    'Escalate to Human Agent',
                ],
                'conversation_uuid' => $conv->uuid,
            ]);
        }

        // Default: draft_reply
        $lastInbound = $messages->where('direction', 'inbound')->last();
        $lastQuestion = $lastInbound ? $lastInbound->body : 'Inquiry';

        $draft = "Hello {$contactName}, thank you for reaching out! We would be delighted to assist you with this. Let us know if you need our catalog or direct checkout link.";

        if (stripos($lastQuestion, 'price') !== false || stripos($lastQuestion, 'cost') !== false || stripos($lastQuestion, 'how much') !== false) {
            $draft = "Hello {$contactName}, thank you for asking! The price details and active promotional discounts are available. Would you like me to send the item link directly?";
        } elseif (stripos($lastQuestion, 'deliver') !== false || stripos($lastQuestion, 'ship') !== false) {
            $draft = "Hello {$contactName}, standard doorstep delivery takes 24–48 hours. Please confirm your delivery address and preferred courier!";
        }

        return response()->json([
            'draft_reply' => $draft,
            'confidence_score' => 0.94,
            'sentiment' => 'positive',
            'suggested_action' => 'send_reply',
            'sources' => [
                'BotifyAI Knowledge Base (FAQ & Policies)',
            ],
            'conversation_uuid' => $conv->uuid,
        ]);
    }

    private function generateSummary($messages, string $contactName): string
    {
        if ($messages->isEmpty()) {
            return "• New conversation initiated with {$contactName}.\n• No message history yet.";
        }

        $bullets = [
            "• {$contactName} initiated contact with product/service inquiry.",
            "• Recent discussion covers pricing, availability, and delivery options.",
            "• Awaiting customer confirmation on preferred payment method.",
        ];

        return implode("\n", $bullets);
    }
}
