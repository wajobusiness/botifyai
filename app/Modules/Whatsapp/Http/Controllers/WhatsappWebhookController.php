<?php

namespace App\Modules\Whatsapp\Http\Controllers;

use App\Http\Controllers\Concerns\FlushesWebhookResponse;
use App\Http\Controllers\Controller;
use App\Modules\Integrations\Services\CredentialResolver;
use App\Modules\Whatsapp\Jobs\ProcessInboundMessageJob;
use App\Modules\Whatsapp\Models\WhatsappBusinessAccount;
use App\Services\WebhookIdempotencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WhatsappWebhookController extends Controller
{
    use FlushesWebhookResponse;
    /**
     * A stable, system-wide verify token derived from app credentials.
     * Used by the global endpoint so all embedded-signup WABAs share one callback URL.
     */
    private function globalVerifyToken(): ?string
    {
        $meta = CredentialResolver::system()->meta();
        if (! $meta?->appId() || ! $meta->appSecret()) {
            return null;
        }
        return hash('sha256', $meta->appId() . $meta->appSecret() . 'wh_global_verify');
    }

    /** GET /webhooks/whatsapp/global — Meta challenge verification for the global endpoint */
    public function verifyGlobal(Request $request): Response
    {
        return $this->verify($request, 'global');
    }

    /** POST /webhooks/whatsapp/global — receives events for all embedded-signup WABAs */
    public function receiveGlobal(Request $request): JsonResponse
    {
        return $this->receive($request, 'global');
    }

    /**
     * GET /webhooks/whatsapp/{token?}
     * Meta challenge verification for WhatsApp Cloud API.
     */
    public function verify(Request $request, ?string $token = null): Response
    {
        // Read hub parameters (supporting PHP $_GET dot-to-underscore normalization and literal dots)
        $hubMode = $request->query('hub_mode', $request->query('hub.mode', $request->input('hub_mode', $request->input('hub.mode'))));
        $hubVerifyToken = $request->query('hub_verify_token', $request->query('hub.verify_token', $request->input('hub_verify_token', $request->input('hub.verify_token'))));
        $hubChallenge = $request->query('hub_challenge', $request->query('hub.challenge', $request->input('hub_challenge', $request->input('hub.challenge'))));

        if ($hubMode !== 'subscribe') {
            Log::warning('whatsapp.webhook.verify_invalid_mode', [
                'hub_mode' => $hubMode,
                'ip'       => $request->ip(),
            ]);
            abort(400, 'Invalid hub.mode');
        }

        $envToken = (string) (config('services.whatsapp.verify_token') ?: env('WHATSAPP_VERIFY_TOKEN', ''));
        $metaVerifyToken = (string) (CredentialResolver::system()->meta()?->verifyToken() ?? '');
        $globalToken = (string) ($this->globalVerifyToken() ?? '');

        $tokenVerified = false;

        // 1. Compare token against WHATSAPP_VERIFY_TOKEN from environment / config
        if ($envToken !== '') {
            if (($token !== null && hash_equals($envToken, $token)) ||
                ($hubVerifyToken !== null && hash_equals($envToken, (string) $hubVerifyToken))) {
                $tokenVerified = true;
            }
        }

        // 2. Compare URL token directly with hub_verify_token
        if (! $tokenVerified && $token !== null && $token !== '' && $token !== 'global' && $hubVerifyToken !== null && (string) $hubVerifyToken !== '') {
            if (hash_equals($token, (string) $hubVerifyToken)) {
                $tokenVerified = true;
            }
        }

        // 3. Compare against system Meta credentials verify_token
        if (! $tokenVerified && $metaVerifyToken !== '') {
            if (($token !== null && hash_equals($metaVerifyToken, $token)) ||
                ($hubVerifyToken !== null && hash_equals($metaVerifyToken, (string) $hubVerifyToken))) {
                $tokenVerified = true;
            }
        }

        // 4. Compare against global verify token
        if (! $tokenVerified && $globalToken !== '') {
            if (($token !== null && hash_equals($globalToken, $token)) ||
                ($hubVerifyToken !== null && hash_equals($globalToken, (string) $hubVerifyToken))) {
                $tokenVerified = true;
            }
        }

        // 5. Compare against database per-WABA verify token
        if (! $tokenVerified && $token !== null && $token !== '' && $token !== 'global') {
            $waba = WhatsappBusinessAccount::findByWebhookToken($token);
            if ($waba && $hubVerifyToken !== null && hash_equals($token, (string) $hubVerifyToken)) {
                $tokenVerified = true;
            }
        }

        if ($tokenVerified && $hubChallenge !== null) {
            Log::info('whatsapp.webhook.verified', [
                'token' => $token ? substr($token, 0, 8).'…' : null,
                'ip'    => $request->ip(),
            ]);

            return response((string) $hubChallenge, 200)
                ->header('Content-Type', 'text/plain');
        }

        Log::warning('whatsapp.webhook.verify_failed', [
            'url_token'        => $token ? substr($token, 0, 8).'…' : null,
            'hub_verify_token' => $hubVerifyToken ? substr((string) $hubVerifyToken, 0, 8).'…' : null,
            'env_configured'   => $envToken !== '',
            'ip'               => $request->ip(),
        ]);

        abort(403, 'Invalid verify token');
    }

    /**
     * POST /webhooks/whatsapp/{token?}
     * Inbound WhatsApp Cloud API messages and status updates.
     */
    public function receive(Request $request, ?string $token = null): JsonResponse
    {
        $payload = $request->all();

        // Accept and log incoming payload and message details
        $entries = $request->input('entry', []);
        $hasMessages = collect($entries)->contains(
            fn ($e) => collect($e['changes'] ?? [])->contains(
                fn ($c) => ! empty($c['value']['messages'] ?? [])
            )
        );
        $hasStatuses = collect($entries)->contains(
            fn ($e) => collect($e['changes'] ?? [])->contains(
                fn ($c) => ! empty($c['value']['statuses'] ?? [])
            )
        );

        Log::info('whatsapp.webhook.received', [
            'token'        => $token ? substr($token, 0, 8).'…' : null,
            'entry_count'  => count($entries),
            'has_messages' => $hasMessages,
            'has_statuses' => $hasStatuses,
            'ip'           => $request->ip(),
            'payload'      => $payload,
        ]);

        // Validate token if provided (and not 'global' or empty)
        $waba = null;
        if ($token !== null && $token !== '' && $token !== 'global') {
            $waba = WhatsappBusinessAccount::findByWebhookToken($token);
            $envToken = (string) (config('services.whatsapp.verify_token') ?: env('WHATSAPP_VERIFY_TOKEN', ''));
            $metaVerifyToken = (string) (CredentialResolver::system()->meta()?->verifyToken() ?? '');
            $globalToken = (string) ($this->globalVerifyToken() ?? '');

            $isTokenValid = $waba !== null
                || ($envToken !== '' && hash_equals($envToken, $token))
                || ($metaVerifyToken !== '' && hash_equals($metaVerifyToken, $token))
                || ($globalToken !== '' && hash_equals($globalToken, $token));

            if (! $isTokenValid) {
                Log::warning('whatsapp.webhook.unknown_token', [
                    'ip'             => $request->ip(),
                    'received_token' => substr($token, 0, 12).'…',
                ]);
                abort(403, 'Invalid verify token');
            }
        }

        // Resolve app secret: WABA-level override first, then system credential, then META_APP_SECRET env
        $appSecret = ($waba->credentials ?? [])['app_secret_override'] ?? null;
        if (! $appSecret) {
            $appSecret = CredentialResolver::system()->meta()?->appSecret() ?: env('META_APP_SECRET');
        }

        if ($appSecret) {
            $this->verifyHmacSignature($request, $appSecret);
        } elseif ($request->hasHeader('X-Hub-Signature-256') && app()->environment('production')) {
            Log::critical('whatsapp.webhook.no_secret', ['ip' => $request->ip()]);
            abort(401, 'App secret not configured');
        }

        // Deduplicate at the entry level before dispatching
        $idempotencyNamespace = ($token === 'global') ? 'whatsapp_global' : 'whatsapp';
        $idempotency = app(WebhookIdempotencyService::class);
        $newEntries  = [];
        foreach ($entries as $entry) {
            $eventKey = $this->entryEventKey($entry);
            if ($eventKey === null || $idempotency->isNewEvent($idempotencyNamespace, $eventKey)) {
                $newEntries[] = $entry;
            }
        }

        if (empty($newEntries)) {
            return response()->json(['status' => 'ok']);
        }

        $filteredPayload = array_merge($payload, ['entry' => $newEntries]);
        $dispatchToken = ($token === 'global') ? '' : (string) ($token ?? '');

        // Return HTTP 200 immediately to Meta and process inbound messages asynchronously
        return $this->flushWebhookOkThen(
            fn () => ProcessInboundMessageJob::dispatch($filteredPayload, $dispatchToken)->onQueue('whatsapp')
        );
    }

    /**
     * Build a stable idempotency key for a webhook entry from the actual events
     * it carries (message ids, status transitions).
     *
     * WhatsApp sets `entry.id` to the WABA id — which is identical for every
     * webhook from that account — so it must NEVER be used as the dedup key, or
     * every webhook after the first would be discarded as a "duplicate" and no
     * inbound message would ever be processed.
     *
     * Returns null when the entry carries no identifiable event, so the caller
     * processes it (fail-open) rather than dropping it.
     *
     * @param  array<string, mixed>  $entry
     */
    private function entryEventKey(array $entry): ?string
    {
        $parts = [];

        foreach ($entry['changes'] ?? [] as $change) {
            $value = $change['value'] ?? [];

            foreach ($value['messages'] ?? [] as $message) {
                if (! empty($message['id'])) {
                    $parts[] = 'm:'.$message['id'];
                }
            }

            foreach ($value['statuses'] ?? [] as $status) {
                if (! empty($status['id'])) {
                    // A message moves sent → delivered → read; key on id + status
                    // so each transition is processed but re-deliveries dedupe.
                    $parts[] = 's:'.$status['id'].':'.($status['status'] ?? '');
                }
            }
        }

        if ($parts !== []) {
            sort($parts);

            return hash('sha256', implode('|', $parts));
        }

        // Non-message events (template / account / quality updates): hash the
        // change payload so identical re-deliveries dedupe but distinct events
        // do not collide. entry.id is included only as a namespace prefix.
        $blob = json_encode($entry['changes'] ?? [], JSON_UNESCAPED_UNICODE);
        if ($blob === false || $blob === '[]' || $blob === 'null') {
            return null;
        }

        return ($entry['id'] ?? 'waba').':'.hash('sha256', $blob);
    }

    /**
     * Verify the X-Hub-Signature-256 header using timing-safe comparison.
     * Aborts with 401 on mismatch.
     */
    private function verifyHmacSignature(Request $request, string $appSecret): void
    {
        $expected = 'sha256=' . hash_hmac('sha256', $request->getContent(), $appSecret);
        $received = $request->header('X-Hub-Signature-256', '');

        if (! hash_equals($expected, $received)) {
            Log::warning('whatsapp.webhook.signature_mismatch', [
                'ip'       => $request->ip(),
                'path'     => $request->path(),
                'object'   => $request->input('object'),
                'body_len' => strlen($request->getContent()),
                'expected' => substr($expected, 0, 20) . '…',
                'received' => substr($received, 0, 20) . '…',
            ]);
            abort(401, 'Invalid signature');
        }
    }
}
