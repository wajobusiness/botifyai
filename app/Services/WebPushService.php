<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    private ?WebPush $webPush = null;

    /** Whether VAPID is configured and valid — web push is skipped when false. */
    private bool $enabled = false;

    public function __construct()
    {
        $publicKey = config('webpush.vapid_public_key');
        $privateKey = config('webpush.vapid_private_key');

        // No keys configured — web push simply isn't set up. Stay silent so we
        // don't spam logs on every notification; other channels still work.
        if (empty($publicKey) || empty($privateKey)) {
            return;
        }

        // Keys are present but may be malformed (e.g. a truncated or placeholder
        // VAPID key). The WebPush constructor validates and throws — catch it so
        // a misconfiguration can never break the notification pipeline.
        try {
            $this->webPush = new WebPush([
                'VAPID' => [
                    'subject' => config('app.url'),
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ]);
            $this->enabled = true;
        } catch (\Throwable $e) {
            Log::warning('Web push disabled: invalid VAPID configuration. Regenerate keys with `php artisan webpush:vapid` and set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env.', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send a push notification to all subscriptions (Web & Mobile) of the given user.
     */
    public function sendToUser(int $userId, string $title, string $body, ?string $url = null): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();
        if ($subscriptions->isEmpty()) {
            return;
        }

        $mobileSubs = $subscriptions->filter(fn ($s) => str_starts_with($s->ua ?? '', 'BotifyAI-Mobile/'));
        $browserSubs = $subscriptions->reject(fn ($s) => str_starts_with($s->ua ?? '', 'BotifyAI-Mobile/'));

        // 1. Dispatch to mobile companion app via FCM
        if ($mobileSubs->isNotEmpty()) {
            $this->sendToMobileDevices($mobileSubs, $title, $body, $url);
        }

        // 2. Dispatch to desktop browsers via WebPush
        if ($browserSubs->isNotEmpty() && $this->enabled && $this->webPush) {
            foreach ($browserSubs as $sub) {
                try {
                    $subscription = Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->p256dh_key,
                        'authToken' => $sub->auth_key,
                    ]);

                    $payload = json_encode([
                        'title' => $title,
                        'body' => $body,
                        'url' => $url,
                    ]);

                    $this->webPush->queueNotification($subscription, $payload);
                } catch (\Throwable $e) {
                    Log::debug('Failed to queue browser web push: ' . $e->getMessage());
                }
            }

            foreach ($this->webPush->flush() as $report) {
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint', $report->getRequest()->getUri())->delete();
                }
            }
        }
    }

    /**
     * Send push notification to mobile companion devices using Firebase Cloud Messaging.
     */
    private function sendToMobileDevices($subscriptions, string $title, string $body, ?string $url = null): void
    {
        $fcmKey = config('services.fcm.key');
        if (empty($fcmKey)) {
            Log::debug('FCM push skipped: FCM_SERVER_KEY / FIREBASE_SERVER_KEY not set.');
            return;
        }

        foreach ($subscriptions as $sub) {
            try {
                \Illuminate\Support\Facades\Http::withHeaders([
                    'Authorization' => 'key=' . $fcmKey,
                    'Content-Type' => 'application/json',
                ])->timeout(10)->post('https://fcm.googleapis.com/fcm/send', [
                    'to' => $sub->endpoint,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                        'sound' => 'default',
                    ],
                    'data' => [
                        'title' => $title,
                        'body' => $body,
                        'url' => $url ?? '',
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    ],
                    'priority' => 'high',
                ]);
            } catch (\Throwable $e) {
                Log::warning('FCM mobile push dispatch error: ' . $e->getMessage());
            }
        }
    }
}
