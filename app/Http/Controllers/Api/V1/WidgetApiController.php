<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\AI\Models\AiChatbot;
use App\Modules\AI\Models\ChatbotWidget;
use App\Modules\AI\Models\ConversationSession;
use App\Modules\AI\Services\ChatbotRunner;
use App\Modules\AI\Support\AiSchemaProvisioner;
use App\Modules\Inbox\Models\ConversationActivity;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\Conversation;
use App\Modules\Shared\Models\Message;
use App\Notifications\ChatbotAlertNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WidgetApiController extends Controller
{
    public function __construct(
        private ChatbotRunner $runner
    ) {}

    /**
     * Resolve widget and validate CORS / domains
     */
    private function resolveWidget(string $key): ?ChatbotWidget
    {
        AiSchemaProvisioner::ensureTablesExist();

        try {
            $key = trim($key);
            $widget = ChatbotWidget::where('widget_key', $key)
                ->with(['chatbot', 'workspace'])
                ->first();

            if (! $widget) {
                return null;
            }

            if ($widget->status === 'inactive') {
                return null;
            }

            // Ensure chatbot relationship is bound
            if (! $widget->chatbot) {
                $fallbackBot = AiChatbot::where('workspace_id', $widget->workspace_id)
                    ->where('enabled', true)
                    ->first()
                    ?? AiChatbot::where('workspace_id', $widget->workspace_id)->first();

                if ($fallbackBot) {
                    $widget->setRelation('chatbot', $fallbackBot);
                }
            }

            return $widget;
        } catch (\Throwable $e) {
            Log::warning('resolveWidget error: '.$e->getMessage());
            return null;
        }
    }

    /**
     * Helper to set permissive CORS headers on widget responses
     */
    private function cors(JsonResponse $response): JsonResponse
    {
        return $response
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN, Accept, Origin');
    }

    /**
     * GET /api/v1/widget/config?key=...
     */
    public function config(Request $request): JsonResponse
    {
        $key = $request->query('key') ?: $request->query('botId');
        if (! $key) {
            return $this->cors(response()->json(['error' => 'Widget key is required.'], 400));
        }

        $widget = $this->resolveWidget($key);
        if (! $widget || ! $widget->chatbot) {
            return $this->cors(response()->json(['error' => 'Widget not found or inactive.'], 404));
        }

        $bot = $widget->chatbot;
        $workspace = $widget->workspace;

        return $this->cors(response()->json([
            'success' => true,
            'widget' => [
                'key' => $widget->widget_key,
                'theme' => $widget->theme,
                'position' => $widget->position,
                'primary_color' => $widget->primary_color,
                'welcome_message' => $widget->welcome_message ?: "Hi there! 👋 How can I help you today?",
                'enable_lead_capture' => $widget->enable_lead_capture,
                'enable_human_takeover' => $widget->enable_human_takeover,
            ],
            'bot' => [
                'name' => $bot->name,
                'purpose' => $bot->purpose,
                'avatar_letter' => strtoupper(substr($bot->name, 0, 1)),
            ],
            'business' => [
                'name' => $workspace?->name ?: 'Botify AI',
            ],
            'suggested_prompts' => [
                'Tell me about your services',
                'What are your pricing plans?',
                'Can I speak with a human agent?',
            ],
        ]));
    }

    /**
     * GET /api/v1/widget/history?key=...&session_token=...
     */
    public function history(Request $request): JsonResponse
    {
        $key = $request->query('key');
        $sessionToken = $request->query('session_token');

        if (! $key || ! $sessionToken) {
            return $this->cors(response()->json(['error' => 'Key and session_token required.'], 400));
        }

        $widget = $this->resolveWidget($key);
        if (! $widget) {
            return $this->cors(response()->json(['error' => 'Widget not found.'], 404));
        }

        $session = ConversationSession::where('session_token', $sessionToken)
            ->where('workspace_id', $widget->workspace_id)
            ->first();

        if (! $session || ! $session->conversation_id) {
            return $this->cors(response()->json(['messages' => [], 'mode' => 'ai']));
        }

        $conversation = Conversation::find($session->conversation_id);
        if (! $conversation) {
            return $this->cors(response()->json(['messages' => [], 'mode' => 'ai']));
        }

        $messages = $conversation->messages()
            ->orderBy('sent_at')
            ->get()
            ->map(function (Message $m) {
                return [
                    'id' => $m->id,
                    'direction' => $m->direction,
                    'sender_type' => $m->sender_type ?: ($m->direction === 'out' ? ($m->sent_by === 'bot' ? 'ai' : 'human') : 'customer'),
                    'body' => $m->body,
                    'action_type' => $m->action_type,
                    'action_data' => $m->action_data,
                    'sent_at' => $m->sent_at?->toISOString() ?: $m->created_at->toISOString(),
                ];
            });

        return $this->cors(response()->json([
            'success' => true,
            'messages' => $messages,
            'mode' => $conversation->mode ?: 'ai',
            'assigned_to' => $conversation->assigned_to ?: 'bot',
        ]));
    }

    /**
     * POST /api/v1/widget/message
     */
    public function message(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string'],
            'session_token' => ['nullable', 'string', 'max:128'],
            'message' => ['required', 'string', 'max:2500'],
            'visitor_name' => ['nullable', 'string', 'max:100'],
            'visitor_email' => ['nullable', 'email', 'max:150'],
            'visitor_phone' => ['nullable', 'string', 'max:50'],
        ]);

        $widget = $this->resolveWidget($validated['key']);
        if (! $widget || ! $widget->chatbot) {
            return $this->cors(response()->json(['error' => 'Widget not found or inactive.'], 404));
        }

        $bot = $widget->chatbot;
        $workspaceId = $widget->workspace_id;
        $sessionToken = $validated['session_token'] ?: ('sess_'.Str::random(40));

        // 1. Resolve or create Contact
        $contact = null;
        if (! empty($validated['visitor_email'])) {
            $contact = Contact::firstOrCreate(
                ['workspace_id' => $workspaceId, 'email' => strtolower($validated['visitor_email'])],
                [
                    'first_name' => $validated['visitor_name'] ?? 'Guest',
                    'phone_e164' => $validated['visitor_phone'] ?? null,
                    'source' => 'website_widget',
                ]
            );
        }

        // 2. Resolve or create Session and Conversation
        $session = ConversationSession::where('session_token', $sessionToken)->first();

        if (! $session) {
            if (! $contact) {
                // Anonymous guest contact
                $guestId = substr($sessionToken, -8);
                $contact = Contact::create([
                    'workspace_id' => $workspaceId,
                    'first_name' => 'Website Guest',
                    'last_name' => '#'.$guestId,
                    'source' => 'website_widget',
                ]);
            }

            // Create Conversation in the unified Inbox!
            $conversation = Conversation::create([
                'workspace_id' => $workspaceId,
                'contact_id' => $contact->id,
                'external_thread_id' => 'widget_'.$sessionToken,
                'status' => 'open',
                'source' => 'chatbot',
                'mode' => 'ai',
                'assigned_to' => 'bot',
                'last_message_at' => now(),
                'last_inbound_at' => now(),
                'unread_count' => 0,
            ]);

            $session = ConversationSession::create([
                'uuid' => (string) Str::uuid(),
                'workspace_id' => $workspaceId,
                'chatbot_id' => $bot->id,
                'contact_id' => $contact->id,
                'conversation_id' => $conversation->id,
                'channel' => 'chatbot',
                'session_token' => $sessionToken,
                'status' => 'active',
                'last_activity_at' => now(),
            ]);

            // Notify team of new chatbot conversation
            $members = User::where('workspace_id', $workspaceId)->get();
            foreach ($members as $member) {
                $member->notify(new ChatbotAlertNotification($conversation, 'new_conversation'));
            }
        } else {
            $conversation = $session->conversation;
            if (! $conversation) {
                $conversation = Conversation::create([
                    'workspace_id' => $workspaceId,
                    'contact_id' => $session->contact_id ?: $contact?->id,
                    'external_thread_id' => 'widget_'.$sessionToken,
                    'status' => 'open',
                    'source' => 'chatbot',
                    'mode' => 'ai',
                    'assigned_to' => 'bot',
                    'last_message_at' => now(),
                    'last_inbound_at' => now(),
                ]);
                $session->update(['conversation_id' => $conversation->id]);
            }
        }

        // 3. Store inbound customer message
        $inbound = Message::create([
            'conversation_id' => $conversation->id,
            'direction' => 'in',
            'channel' => 'chatbot',
            'type' => 'text',
            'body' => $validated['message'],
            'sent_by' => 'customer',
            'sender_type' => 'customer',
            'status' => 'delivered',
            'sent_at' => now(),
        ]);

        $conversation->update([
            'last_message_at' => now(),
            'last_inbound_at' => now(),
        ]);

        $session->update(['last_activity_at' => now()]);

        // 4. Check if Human Agent has taken over this thread
        if ($conversation->assigned_to === 'human' || $conversation->mode === 'human') {
            // Human is handling — do not invoke AI; increment unread for team
            $conversation->increment('unread_count');

            return $this->cors(response()->json([
                'success' => true,
                'session_token' => $sessionToken,
                'mode' => 'human',
                'reply' => null, // Human will reply from Inbox
                'notice' => 'A team member is assigned to this chat and will reply shortly.',
            ]));
        }

        // 5. Build conversation history memory (last 20 turns)
        $history = [];
        $priorMessages = $conversation->messages()
            ->where('id', '!=', $inbound->id)
            ->whereIn('type', ['text', 'template'])
            ->orderBy('sent_at')
            ->take(20)
            ->get();

        foreach ($priorMessages as $m) {
            if (! $m->body) {
                continue;
            }
            $history[] = [
                'role' => $m->direction === 'out' ? 'assistant' : 'user',
                'content' => $m->body,
            ];
        }

        // 6. Run AI agentic execution loop with RAG & memory
        $result = $this->runner->runForApi(
            $bot,
            $validated['message'],
            $workspaceId,
            $history,
            null,
            $conversation->contact_id
        );

        $replyText = $result['reply'] ?? $bot->fallback_reply ?? "Thank you for reaching out! A representative will follow up with you shortly.";
        $actions = $result['actions'] ?? [];

        // Check if any actions occurred (e.g. lead captured, order created)
        $actionType = null;
        $actionData = null;
        if (! empty($actions)) {
            $firstAction = $actions[0];
            $actionType = $firstAction['tool'] ?? 'ai_action';
            $actionData = $firstAction['result'] ?? null;
        }

        // 7. Save outbound AI response message to thread
        $outbound = Message::create([
            'conversation_id' => $conversation->id,
            'direction' => 'out',
            'channel' => 'chatbot',
            'type' => 'text',
            'body' => $replyText,
            'sent_by' => 'bot',
            'sender_type' => 'ai',
            'status' => 'sent',
            'sent_at' => now(),
            'action_type' => $actionType,
            'action_data' => $actionData,
        ]);

        $conversation->update([
            'last_message_at' => now(),
        ]);

        return $this->cors(response()->json([
            'success' => true,
            'session_token' => $sessionToken,
            'mode' => 'ai',
            'reply' => $replyText,
            'actions' => $actions,
            'message_id' => $outbound->id,
        ]));
    }

    /**
     * POST /api/v1/widget/lead
     * Capture lead information from widget form
     */
    public function lead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string'],
            'session_token' => ['required', 'string'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $widget = $this->resolveWidget($validated['key']);
        if (! $widget) {
            return $this->cors(response()->json(['error' => 'Widget not found.'], 404));
        }

        $session = ConversationSession::where('session_token', $validated['session_token'])
            ->where('workspace_id', $widget->workspace_id)
            ->first();

        $names = explode(' ', trim($validated['name']), 2);
        $firstName = $names[0];
        $lastName = $names[1] ?? '';

        $contact = Contact::updateOrCreate(
            ['workspace_id' => $widget->workspace_id, 'email' => strtolower($validated['email'])],
            [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'phone_e164' => $validated['phone'] ?? null,
                'source' => 'website_widget_lead_capture',
            ]
        );

        if ($session) {
            $session->update(['contact_id' => $contact->id]);
            if ($session->conversation) {
                $session->conversation->update(['contact_id' => $contact->id]);

                // Record lead capture action message
                Message::create([
                    'conversation_id' => $session->conversation->id,
                    'direction' => 'in',
                    'channel' => 'chatbot',
                    'type' => 'text',
                    'body' => "Lead captured: {$validated['name']} ({$validated['email']})",
                    'sent_by' => 'bot',
                    'sender_type' => 'ai',
                    'action_type' => 'lead_captured',
                    'action_data' => [
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'phone' => $validated['phone'] ?? null,
                    ],
                    'status' => 'delivered',
                    'sent_at' => now(),
                ]);

                // Dispatch notification to team
                $members = User::where('workspace_id', $widget->workspace_id)->get();
                foreach ($members as $member) {
                    $member->notify(new ChatbotAlertNotification($session->conversation, 'lead_captured', [
                        'lead_name' => $validated['name'],
                        'email' => $validated['email'],
                    ]));
                }
            }
        }

        return $this->cors(response()->json([
            'success' => true,
            'message' => 'Thank you! Your information has been saved.',
        ]));
    }

    /**
     * POST /api/v1/widget/takeover
     * Visitor requests human agent
     */
    public function takeover(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string'],
            'session_token' => ['required', 'string'],
        ]);

        $widget = $this->resolveWidget($validated['key']);
        if (! $widget) {
            return $this->cors(response()->json(['error' => 'Widget not found.'], 404));
        }

        $session = ConversationSession::where('session_token', $validated['session_token'])
            ->where('workspace_id', $widget->workspace_id)
            ->first();

        if ($session && $session->conversation) {
            $conversation = $session->conversation;
            $conversation->update([
                'assigned_to' => 'human',
                'mode' => 'human_handling',
                'handover_at' => now(),
            ]);

            ConversationActivity::log($conversation, 'handover', [
                'from' => 'bot',
                'to' => 'human',
                'reason' => 'visitor_request',
            ]);

            // Notify workspace members
            $members = User::where('workspace_id', $widget->workspace_id)->get();
            foreach ($members as $member) {
                $member->notify(new ChatbotAlertNotification($conversation, 'human_requested'));
            }
        }

        return $this->cors(response()->json([
            'success' => true,
            'message' => 'Human takeover requested. An agent will be with you shortly.',
        ]));
    }
}
