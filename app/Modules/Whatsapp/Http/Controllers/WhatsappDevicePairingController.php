<?php

namespace App\Modules\Whatsapp\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Modules\Shared\Models\ChannelAccount;
use App\Modules\Whatsapp\Models\WhatsappDeviceSession;
use App\Modules\Whatsapp\Support\WhatsappSchemaProvisioner;
use App\Services\Entitlements\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WhatsappDevicePairingController extends Controller
{
    private function getWorkspace(Request $request): ?Workspace
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }

        if (! empty($user->workspace_id)) {
            $ws = Workspace::find($user->workspace_id);
            if ($ws) {
                return $ws;
            }
        }

        if (! empty($user->current_workspace_id)) {
            $ws = Workspace::find($user->current_workspace_id);
            if ($ws) {
                return $ws;
            }
        }

        try {
            $ws = $user->workspaces()->first();
            if ($ws) {
                return $ws;
            }
        } catch (\Throwable) {
            // ignore
        }

        if (! empty($user->client_id)) {
            $ws = Workspace::where('client_id', $user->client_id)->first();
            if ($ws) {
                return $ws;
            }
        }

        return Workspace::first();
    }

    /**
     * List all linked device sessions for the current workspace.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            WhatsappSchemaProvisioner::ensureTablesExist();
            $workspace = $this->getWorkspace($request);
            if (! $workspace) {
                return response()->json(['error' => 'No active workspace.'], 404);
            }

            $sessions = WhatsappDeviceSession::where('workspace_id', $workspace->id)
                ->with('channelAccount')
                ->orderByDesc('updated_at')
                ->get();

            return response()->json([
                'success' => true,
                'sessions' => $sessions,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('WhatsappDevicePairingController::index error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Request an 8-digit mobile pairing code or QR code to link a WhatsApp phone number.
     */
    public function requestPairing(Request $request): JsonResponse
    {
        try {
            WhatsappSchemaProvisioner::ensureTablesExist();
            $workspace = $this->getWorkspace($request);
            if (! $workspace) {
                return response()->json(['message' => 'No active workspace found.'], 404);
            }

            // 1. Enforce Entitlement: Linked Devices feature toggle in active plan
            if (! EntitlementService::canAccess($workspace, 'whatsapp_linked_devices')) {
                return response()->json([
                    'message' => 'Personal WhatsApp / Linked Devices connection is not included in your current subscription plan. Please upgrade to link WhatsApp phone numbers.',
                    'code' => 'ENTITLEMENT_REQUIRED',
                ], 403);
            }

            // 2. Enforce Limit: Max connected WhatsApp accounts cap
            if (EntitlementService::hasReachedLimit($workspace, 'max_whatsapp_accounts')) {
                return response()->json([
                    'message' => 'You have reached the maximum allowed WhatsApp accounts for your subscription plan. Please upgrade your plan to connect more numbers.',
                    'code' => 'LIMIT_REACHED',
                ], 403);
            }

            $validated = $request->validate([
                'phone_number'    => ['required', 'string', 'min:7', 'max:25'],
                'name'            => ['nullable', 'string', 'max:128'],
                'connection_type' => ['nullable', 'string', 'in:pairing_code,qr_code,coexistence'],
            ]);

            // Normalize phone number (strip whitespace, dashes, plus, parentheses)
            $cleanPhone = preg_replace('/[^0-9]/', '', $validated['phone_number']);
            if (strlen($cleanPhone) < 7) {
                return response()->json(['message' => 'Please provide a valid international phone number with country code.'], 422);
            }

            $connectionType = $validated['connection_type'] ?? 'pairing_code';
            $displayName = ! empty($validated['name'])
                ? trim($validated['name'])
                : 'WhatsApp (+' . substr($cleanPhone, 0, 3) . '...' . substr($cleanPhone, -4) . ')';

            // Check if a session already exists for this number in this workspace
            $session = WhatsappDeviceSession::where('workspace_id', $workspace->id)
                ->where('phone_number', $cleanPhone)
                ->first();

            if (! $session) {
                $session = WhatsappDeviceSession::create([
                    'workspace_id'    => $workspace->id,
                    'session_uid'     => 'wds_' . Str::random(24),
                    'name'            => $displayName,
                    'phone_number'    => $cleanPhone,
                    'connection_type' => $connectionType,
                    'connection_status' => 'pairing',
                ]);
            } else {
                $session->update([
                    'name'            => $displayName,
                    'connection_type' => $connectionType,
                    'connection_status' => 'pairing',
                ]);
            }

            // Generate 8-character human-friendly pairing code (e.g. 4839-2910 or ABCD-1234)
            // Multi-device standard format is 8 alphanumeric characters
            $part1 = strtoupper(Str::random(4));
            $part2 = strtoupper(Str::random(4));
            $pairingCode = "{$part1}-{$part2}";

            $expiresAt = now()->addMinutes(3);

            // Generate synthetic QR code raw string for QR fallback mode
            $qrRaw = '2@' . base64_encode(Str::random(32)) . ',' . base64_encode(Str::random(32)) . ',' . base64_encode(Str::random(32));

            $session->update([
                'pairing_code'            => $pairingCode,
                'pairing_code_expires_at' => $expiresAt,
                'qr_raw'                  => $qrRaw,
                'connection_status'       => 'pairing',
                'error_message'           => null,
            ]);

            return response()->json([
                'success'            => true,
                'session_uid'        => $session->session_uid,
                'pairing_code'       => $pairingCode,
                'phone_number'       => '+' . $cleanPhone,
                'connection_type'    => $connectionType,
                'expires_at'         => $expiresAt->toIso8601String(),
                'expires_in_seconds' => 180,
                'qr_raw'             => $qrRaw,
                'instructions'       => [
                    '1. Open WhatsApp on your phone.',
                    '2. Tap Menu (⋮) on Android or Settings on iPhone.',
                    '3. Tap "Linked Devices" then "Link a Device".',
                    '4. Select "Link with phone number instead".',
                    '5. Enter the 8-character code shown above.',
                ],
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('WhatsappDevicePairingController::requestPairing error', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Pairing error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Poll the pairing status of a device session.
     */
    public function status(Request $request, string $sessionUid): JsonResponse
    {
        try {
            WhatsappSchemaProvisioner::ensureTablesExist();
            $workspace = $this->getWorkspace($request);
            if (! $workspace) {
                return response()->json(['message' => 'Unauthorized.'], 401);
            }

            $session = WhatsappDeviceSession::where('workspace_id', $workspace->id)
                ->where('session_uid', $sessionUid)
                ->with('channelAccount')
                ->first();

            if (! $session) {
                return response()->json(['message' => 'Device session not found.'], 404);
            }

            // Check if pairing code has expired
            if ($session->connection_status === 'pairing' && $session->isPairingExpired()) {
                $session->update([
                    'connection_status' => 'failed',
                    'error_message'     => 'Pairing code expired. Please request a new code.',
                ]);
            }

            return response()->json([
                'success'           => true,
                'session_uid'       => $session->session_uid,
                'status'            => $session->connection_status,
                'phone_number'      => $session->phone_number ? '+' . $session->phone_number : null,
                'name'              => $session->name,
                'push_name'         => $session->push_name,
                'platform'          => $session->platform,
                'is_business'       => (bool) $session->is_business,
                'error_message'     => $session->error_message,
                'channel_account_id'=> $session->channel_account_id,
                'paired_at'         => $session->paired_at?->toIso8601String(),
                'last_active_at'    => $session->last_active_at?->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('WhatsappDevicePairingController::status error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Complete / confirm pairing (called after client enters code or via gateway webhook).
     */
    public function confirm(Request $request, string $sessionUid): JsonResponse
    {
        try {
            WhatsappSchemaProvisioner::ensureTablesExist();
            $workspace = $this->getWorkspace($request);
            if (! $workspace) {
                return response()->json(['message' => 'Unauthorized.'], 401);
            }

            $session = WhatsappDeviceSession::where('workspace_id', $workspace->id)
                ->where('session_uid', $sessionUid)
                ->first();

            if (! $session) {
                return response()->json(['message' => 'Device session not found.'], 404);
            }

            $pushName = $request->input('push_name', $session->name);
            $platform = $request->input('platform', 'android');

            $account = $session->markConnected(
                phoneNumber: $session->phone_number,
                pushName: $pushName,
                platform: $platform
            );

            return response()->json([
                'success'            => true,
                'message'            => 'WhatsApp device successfully linked and ready for messaging!',
                'session'            => $session->fresh(),
                'channel_account_id' => $account->id,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('WhatsappDevicePairingController::confirm error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete / permanently remove a linked device session and its ChannelAccount from system.
     */
    public function destroy(Request $request, string $sessionUid): JsonResponse
    {
        try {
            WhatsappSchemaProvisioner::ensureTablesExist();
            $workspace = $this->getWorkspace($request);

            $session = WhatsappDeviceSession::where('session_uid', $sessionUid)->first();
            if (! $session) {
                return response()->json(['success' => true, 'message' => 'Device session already removed.']);
            }

            // Verify access
            $user = $request->user();
            $authorized = ($workspace && (int) $session->workspace_id === (int) $workspace->id);
            if (! $authorized && $user) {
                try {
                    $authorized = $user->workspaces()->where('workspaces.id', $session->workspace_id)->exists()
                        || (! empty($user->client_id) && Workspace::where('client_id', $user->client_id)->where('id', $session->workspace_id)->exists());
                } catch (\Throwable) {}
            }

            if (! $authorized) {
                return response()->json(['message' => 'Unauthorized for this workspace session.'], 403);
            }

            // 1. Detach conversations and delete associated ChannelAccount
            if ($session->channel_account_id) {
                \App\Modules\Shared\Models\Conversation::where('channel_account_id', $session->channel_account_id)
                    ->update(['channel_account_id' => null]);
                ChannelAccount::where('id', $session->channel_account_id)->delete();
            }

            if ($session->phone_number) {
                $cleanPhone = preg_replace('/[^0-9]/', '', $session->phone_number);
                $cas = ChannelAccount::where('workspace_id', $session->workspace_id)
                    ->where('channel', 'whatsapp')
                    ->where(function ($q) use ($cleanPhone, $sessionUid) {
                        $q->where('phone_number_id', $cleanPhone)
                          ->orWhere('business_account_id', $sessionUid);
                    })
                    ->get();

                foreach ($cas as $ca) {
                    \App\Modules\Shared\Models\Conversation::where('channel_account_id', $ca->id)
                        ->update(['channel_account_id' => null]);
                    $ca->delete();
                }
            }

            // 2. Permanently delete the session
            $session->delete();

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp device permanently removed from system.',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('WhatsappDevicePairingController::destroy error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Disconnect / remove a linked device session.
     */
    public function disconnect(Request $request, string $sessionUid): JsonResponse
    {
        // When disconnected from the UI trash action, permanently remove the session from the system
        return $this->destroy($request, $sessionUid);
    }
}
