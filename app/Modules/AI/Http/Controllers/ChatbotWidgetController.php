<?php

namespace App\Modules\AI\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AI\Models\AiChatbot;
use App\Modules\AI\Models\ChatbotWidget;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChatbotWidgetController extends Controller
{
    /**
     * Display widget configuration and deployment manager.
     */
    public function index(Request $request): Response
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;

        $chatbots = AiChatbot::where('workspace_id', $workspaceId)
            ->where('enabled', true)
            ->orderBy('name')
            ->get(['id', 'name', 'purpose', 'tone']);

        $widget = ChatbotWidget::where('workspace_id', $workspaceId)
            ->with('chatbot')
            ->first();

        // If no widget exists yet, prepare a default draft
        if (! $widget && $chatbots->isNotEmpty()) {
            $firstBot = $chatbots->first();
            $widget = ChatbotWidget::create([
                'workspace_id' => $workspaceId,
                'chatbot_id' => $firstBot->id,
                'widget_key' => 'bw_'.Str::random(32),
                'theme' => 'modern',
                'position' => 'bottom_right',
                'primary_color' => '#0D9488',
                'welcome_message' => "Hi there! 👋 How can I help you today? Ask me anything about our products, services, or pricing.",
                'enable_lead_capture' => true,
                'enable_human_takeover' => true,
                'status' => 'active',
            ]);
            $widget->load('chatbot');
        }

        return Inertia::render('AI/Chatbots/Widget', [
            'widget' => $widget,
            'chatbots' => $chatbots,
            'embedSnippet' => $widget ? $widget->getEmbedCode() : null,
            'appUrl' => config('app.url'),
        ]);
    }

    /**
     * Save or update widget deployment settings.
     */
    public function store(Request $request): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;

        $validated = $request->validate([
            'chatbot_id' => ['required', 'exists:ai_chatbots,id'],
            'theme' => ['required', 'string', 'in:modern,dark,clean,minimal'],
            'position' => ['required', 'string', 'in:bottom_right,bottom_left'],
            'primary_color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'welcome_message' => ['nullable', 'string', 'max:500'],
            'enable_lead_capture' => ['boolean'],
            'enable_human_takeover' => ['boolean'],
            'allowed_domains' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $widget = ChatbotWidget::updateOrCreate(
            ['workspace_id' => $workspaceId],
            array_merge($validated, [
                'workspace_id' => $workspaceId,
            ])
        );

        return back()->with('success', 'Widget settings updated successfully.');
    }

    /**
     * Regenerate widget deployment key
     */
    public function regenerateKey(Request $request): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;

        $widget = ChatbotWidget::where('workspace_id', $workspaceId)->firstOrFail();
        $widget->update([
            'widget_key' => 'bw_'.Str::random(32),
        ]);

        return back()->with('success', 'Widget key regenerated. Please update your embed script on external sites.');
    }
}
