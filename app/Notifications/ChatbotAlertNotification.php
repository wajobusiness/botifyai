<?php

namespace App\Notifications;

use App\Modules\Shared\Models\Conversation;
use App\Notifications\Channels\OneSignalChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ChatbotAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Conversation $conversation,
        public readonly string $eventType, // 'new_conversation', 'human_requested', 'ai_unanswered', 'lead_captured', 'booking_created'
        public readonly array $details = []
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', OneSignalChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        $contact = $this->conversation->contact;
        $name = $contact ? trim(($contact->first_name ?? '').' '.($contact->last_name ?? '')) : 'Guest';
        $name = $name ?: ($contact?->phone_e164 ?? 'Guest Visitor');

        $messages = [
            'new_conversation' => "New AI chatbot conversation started with {$name}.",
            'human_requested' => "Customer {$name} requested human agent assistance.",
            'ai_unanswered' => "AI chatbot was unable to answer a customer inquiry for {$name}.",
            'lead_captured' => "New lead captured by AI chatbot: {$name}.",
            'booking_created' => "New appointment/booking scheduled by AI chatbot for {$name}.",
        ];

        return [
            'type' => 'chatbot_alert',
            'event_type' => $this->eventType,
            'conversation_id' => $this->conversation->id,
            'conversation_uuid' => $this->conversation->uuid,
            'contact_name' => $name,
            'message' => $messages[$this->eventType] ?? "Chatbot event ({$this->eventType}) occurred for {$name}.",
            'details' => $this->details,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function toOneSignal(object $notifiable): array
    {
        $contact = $this->conversation->contact;
        $name = $contact ? trim(($contact->first_name ?? '').' '.($contact->last_name ?? '')) : 'Guest';
        $name = $name ?: ($contact?->phone_e164 ?? 'Guest Visitor');

        $titles = [
            'new_conversation' => 'New Chatbot Conversation',
            'human_requested' => 'Human Takeover Requested',
            'ai_unanswered' => 'AI Chatbot Needs Review',
            'lead_captured' => 'Lead Captured by AI',
            'booking_created' => 'New Booking Created',
        ];

        return [
            'title' => $titles[$this->eventType] ?? 'AI Chatbot Alert',
            'body' => $this->toArray($notifiable)['message'],
            'url' => route('client.inbox.show', $this->conversation),
        ];
    }
}
