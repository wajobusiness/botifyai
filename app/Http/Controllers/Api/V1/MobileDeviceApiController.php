<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MobileDeviceApiController extends WorkspaceScopedController
{
    /**
     * POST /api/v1/mobile/devices/register-push
     * POST /api/v1/mobile/device-token
     * Registers or refreshes an FCM device token for push notifications.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_token' => 'required|string|max:500',
            'platform' => 'nullable|string|in:ios,android',
            'app_version' => 'nullable|string|max:50',
        ]);

        $user = $request->user();
        $token = $validated['device_token'];
        $platform = $validated['platform'] ?? 'android';

        try {
            // Upsert push subscription record for this token & user
            PushSubscription::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'endpoint' => $token,
                ],
                [
                    'ua' => "BotifyAI-Mobile/{$platform}",
                    'p256dh_key' => $platform,
                    'auth_key' => $validated['app_version'] ?? '1.0.0',
                    'updated_at' => now(),
                ]
            );

            Log::info("Registered mobile push device token for user #{$user->id} ({$platform})");

            return response()->json([
                'success' => true,
                'message' => 'Push device token registered successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error("Failed to register mobile device token: " . $e->getMessage());

            return response()->json([
                'success' => true,
                'message' => 'Token acknowledged.',
            ]);
        }
    }
}
