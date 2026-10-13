<?php

namespace App\Modules\Automation\Services;

use App\Modules\AI\Services\LlmGateway;
use App\Modules\Social\Models\SocialAccount;
use App\Modules\Social\Models\WorkspaceBrandProfile;

/**
 * Turns a natural-language description into a complete, ready-to-run automation graph
 * (trigger + nodes + edges) using the workspace's configured LLM provider.
 *
 * The model's output is never trusted blindly: every node type and trigger type is
 * validated against what {@see AutomationEngine} can actually execute, dangling edges
 * are dropped, a single trigger is guaranteed, and the canvas is auto-laid-out — so the
 * result always loads in the builder and runs through the engine.
 */
class WorkflowGenerator
{
    /** Node types the engine can execute (mirrors AutomationEngine::executeNode + the builder palette). */
    private const NODE_TYPES = [
        'send_whatsapp', 'send_template', 'send_media', 'send_sequence', 'quick_replies', 'list_message',
        'send_sms', 'send_email', 'ask_question', 'condition', 'wait', 'webhook', 'run_subflow', 'ai_reply',
        'add_tag', 'remove_tag', 'update_contact', 'assign_agent', 'add_to_campaign', 'cta_button',
        'send_location', 'send_poll', 'run_chatbot', 'book_appointment', 'google_meet', 'whatsapp_form',
        'whatsapp_catalog', 'woocommerce_product', 'shopify_product', 'google_sheets', 'google_docs', 'google_forms',
        'ai_social_ideation', 'ai_social_caption', 'render_social_graphic', 'publish_social_post',
    ];

    /** Trigger types the listener understands (mirrors the builder's TRIGGER_TYPES). */
    private const TRIGGER_TYPES = [
        'schedule.recurring',
        'contact.created', 'contact.tag_added', 'message.received', 'campaign.sent', 'form.submitted',
        'webhook.received', 'order.placed', 'order.paid', 'payment.failed', 'order.fulfilled',
        'order.cancelled', 'order.refunded', 'cart.abandoned', 'customer.created',
        'lead.stage_changed', 'lead.qualified', 'lead.won', 'lead.lost',
    ];

    public function __construct(private readonly LlmGateway $llmGateway) {}

    /**
     * @return array{name: string, trigger_type: string, trigger_config: array, nodes: array, edges: array, brand_profile?: array}
     *
     * @throws \RuntimeException when the provider fails or returns unusable output
     */
    public function generate(int $workspaceId, string $prompt): array
    {
        $messages = [
            ['role' => 'system', 'content' => $this->systemPrompt($workspaceId)],
            ['role' => 'user', 'content' => 'Build an automation for this request:'."\n\n".trim($prompt)],
        ];

        $response = $this->llmGateway->chat($workspaceId, $messages, ['max_tokens' => 3000]);

        $spec = $this->decode($response->content);
        if (! is_array($spec)) {
            throw new \RuntimeException('The AI did not return a valid workflow. Try rephrasing your request.');
        }

        if ($workspaceId > 0 && is_array($spec['brand_profile'] ?? null)) {
            $this->persistBrandProfile($workspaceId, $spec['brand_profile']);
        }

        return $this->normalise($spec, $workspaceId);
    }

    private function persistBrandProfile(int $workspaceId, array $raw): void
    {
        try {
            $profile = WorkspaceBrandProfile::forWorkspace($workspaceId);
            $updates = [];
            foreach (['brand_name', 'niche', 'target_audience', 'tone', 'writing_style'] as $field) {
                if (isset($raw[$field]) && is_string($raw[$field]) && trim($raw[$field]) !== '') {
                    $updates[$field] = mb_substr(trim($raw[$field]), 0, 500);
                }
            }
            if (empty($updates['tone']) && isset($raw['tone_of_voice']) && is_string($raw['tone_of_voice'])) {
                $updates['tone'] = mb_substr(trim($raw['tone_of_voice']), 0, 120);
            }
            if (is_array($raw['content_pillars'] ?? null) && ! empty($raw['content_pillars'])) {
                $updates['content_pillars'] = array_values(array_filter(array_map('strval', $raw['content_pillars'])));
            }
            if (is_array($raw['brand_colors'] ?? null) && ! empty($raw['brand_colors'])) {
                $updates['brand_colors'] = array_values(array_filter(array_map('strval', $raw['brand_colors'])));
            }
            if (array_key_exists('requires_approval', $raw)) {
                $updates['requires_approval'] = (bool) $raw['requires_approval'];
            }
            if (! empty($updates)) {
                $profile->update($updates);
            }
        } catch (\Throwable) {
            // Best-effort brand profile persistence.
        }
    }

    private function systemPrompt(int $workspaceId = 0): string
    {
        $nodeTypes = implode(', ', self::NODE_TYPES);
        $triggerTypes = implode(', ', self::TRIGGER_TYPES);

        $connectedAccountsInfo = '';
        if ($workspaceId > 0) {
            try {
                $accounts = SocialAccount::where('workspace_id', $workspaceId)
                    ->where('active', true)
                    ->get(['id', 'network', 'name']);
                if ($accounts->isNotEmpty()) {
                    $list = $accounts->map(fn ($a) => "{$a->id}: {$a->network} ({$a->name})")->implode(', ');
                    $connectedAccountsInfo = "\nConnected social accounts in this workspace: [{$list}]. Use these integer IDs in publish_social_post.target_accounts when applicable.";
                }
            } catch (\Throwable) {
            }
        }

        return <<<PROMPT
You are an automation workflow architect for an omnichannel messaging & autonomous social media platform.
Convert the user's request into ONE automation expressed as strict JSON. Output ONLY the JSON
object — no prose, no markdown, no code fences.{$connectedAccountsInfo}

Shape:
{
  "name": "<short title, max 60 chars>",
  "trigger_type": "<one of: {$triggerTypes}>",
  "trigger_config": { },
  "brand_profile": {
    "niche": "<optional: extracted niche if this is a social content strategy>",
    "target_audience": "<optional>",
    "tone": "<optional: e.g. professional, witty, bold>",
    "writing_style": "<optional>",
    "content_pillars": ["<optional pillar 1>", "<optional pillar 2>"]
  },
  "nodes": [ { "id": "n1", "type": "<node type>", "data": { ... } } ],
  "edges": [ { "source": "trigger-1", "target": "n1" }, { "source": "n1", "target": "n2" } ]
}

Rules:
- The trigger is implicit: its node id is always "trigger-1". Do NOT list it in "nodes"; only
  reference it as an edge source. Every "nodes" entry needs a unique "id" and a valid "type".
- Connect nodes with "edges". The flow must start with an edge whose source is "trigger-1".
- Allowed node types: {$nodeTypes}.
- When the user describes a recurring social media strategy or content calendar (e.g. "Post twice every weekday", "Create educational carousels", "Generate quote graphics on Mondays"), use:
  - "trigger_type": "schedule.recurring"
  - "trigger_config": { "frequency": "daily|weekdays|weekly|custom", "days_of_week": ["mon","tue","wed","thu","fri","sat"], "times": ["09:00","16:00"], "timezone": "UTC" }
  - And chain the autonomous social nodes: ai_social_ideation -> ai_social_caption -> render_social_graphic -> publish_social_post.
- Prefer nodes that need no external setup: send_whatsapp, send_template, send_media, quick_replies,
  list_message, ask_question, condition, wait, add_tag, remove_tag, update_contact, send_email, ai_reply,
  cta_button, send_poll, ai_social_ideation, ai_social_caption, render_social_graphic, publish_social_post.
- Personalise text with tokens: {{contact.name}}, {{contact.first_name}}, {{contact.email}}, {{contact.phone}},
  {{message.body}}, {{context.<key>}}. Order/cart triggers also expose {{context.order_number}},
  {{context.order_total}}, {{context.order_currency}}, {{context.tracking_url}}, {{context.cart_total}},
  {{context.recovery_url}}. Social nodes expose {{context.topic}}, {{context.hook}}, {{context.content_pillar}},
  {{context.content_format}}, {{context.full_caption}}, {{context.media_url}}.

Node "data" by type:
- ai_social_ideation: { "niche": "Digital marketing, AI, web hosting", "pillars": "AI Tools\nWeb Hosting\nGrowth Strategy", "format": "auto|carousel|quote|promo|tip", "tone": "professional" }
- ai_social_caption: { "tone": "professional", "cta": "Visit our link in bio", "prompt": "Avoid repetitive hooks" }
- render_social_graphic: { "template": "auto|quote|promo|tip|carousel", "primary_color": "#6366f1", "secondary_color": "#0f172a", "brand_name": "" }
- publish_social_post: { "target_accounts": [], "publish_mode": "immediate|optimal_slot|approval_queue", "delay_minutes": 15 }
- send_whatsapp / send_sms: { "body": "text" }
- send_email: { "subject": "text", "body": "text" }
- send_template: { "template_name": "name", "language": "en", "variables": "one value per line" }
- send_media: { "media_type": "image|video|document|audio", "link": "https://...", "caption": "text" }
- send_sequence: { "steps": [ { "kind": "text", "body": "..." }, { "kind": "media", "media_type": "image", "link": "https://...", "caption": "..." } ] }
- quick_replies: { "body": "text", "buttons": ["Yes","No","Maybe"] }  (max 3 buttons)
- list_message: { "body": "text", "button_label": "Menu", "section_title": "Options", "rows": "Title|Description per line" }
- ask_question: { "question": "text", "variable": "snake_case_key", "channel": "whatsapp" }
- condition: { "field": "contact.name|contact.email|contact.phone|contact.tag|message.body|context.<key>", "operator": "equals|not_equals|contains|not_contains|exists|not_exists", "value": "text" }
  A condition has TWO outgoing edges: one with "sourceHandle": "true" and one with "sourceHandle": "false".
- wait: { "amount": 1, "unit": "minutes|hours|days" }
- webhook: { "url": "https://...", "method": "POST", "headers": "{\\"K\\":\\"V\\"}", "payload": "{\\"k\\":\\"v\\"}" }
- ai_reply: { "prompt": "instructions for the AI", "channel": "whatsapp" }
- add_tag / remove_tag: { "tag": "name" }
- update_contact: { "field": "name|email|phone|notes", "value": "text" }
- cta_button: { "body": "text", "display_text": "Open", "url": "https://..." }
- send_poll: { "question": "text", "options": ["A","B","C"] }
- send_location: { "latitude": "37.42", "longitude": "-122.08", "name": "Place", "address": "Street" }
- book_appointment / google_meet: { "summary": "text", "start": "{{context.start}}", "duration_minutes": 30 }
- whatsapp_form: { "flow_id": "123", "body": "text", "flow_cta": "Open form" }

Keep it focused: 2–6 nodes is ideal. Make every message specific and useful.
PROMPT;
    }

    /** Extract a JSON object from the model's reply, tolerating code fences / stray prose. */
    private function decode(string $raw): mixed
    {
        $raw = trim($raw);
        // Strip a leading ```json / ``` fence and a trailing fence if present.
        $raw = preg_replace('/^```(?:json)?\s*/i', '', $raw);
        $raw = preg_replace('/\s*```$/', '', (string) $raw);

        $decoded = json_decode(trim((string) $raw), true);
        if (is_array($decoded)) {
            return $decoded;
        }

        // Fall back to the outermost {...} block.
        $start = strpos($raw, '{');
        $end = strrpos($raw, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $decoded = json_decode(substr($raw, $start, $end - $start + 1), true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    /**
     * Validate + reshape the model's spec into the exact structure the builder/engine expect.
     *
     * @param  array<string, mixed>  $spec
     * @return array{name: string, trigger_type: string, trigger_config: array, nodes: array, edges: array}
     */
    public function normalise(array $spec, int $workspaceId = 0): array
    {
        $triggerType = is_string($spec['trigger_type'] ?? null) && in_array($spec['trigger_type'], self::TRIGGER_TYPES, true)
            ? $spec['trigger_type']
            : 'contact.created';

        $triggerConfig = is_array($spec['trigger_config'] ?? null) ? $spec['trigger_config'] : [];
        if ($triggerType === 'schedule.recurring') {
            $triggerConfig = $this->normaliseRecurringSchedule($triggerConfig);
        }

        // ── Action nodes ──────────────────────────────────────────────────
        $nodes = [];
        $idMap = [];   // original id → final id
        $used = [];
        $i = 0;

        foreach (($spec['nodes'] ?? []) as $raw) {
            if (! is_array($raw)) {
                continue;
            }
            $type = $raw['type'] ?? null;
            if (! is_string($type) || ! in_array($type, self::NODE_TYPES, true)) {
                continue; // skip the trigger or any unknown/hallucinated type
            }
            $origId = isset($raw['id']) ? (string) $raw['id'] : '';
            $id = $this->uniqueId($origId !== '' && $origId !== 'trigger-1' ? $origId : $type.'-'.$i, $used);
            $used[$id] = true;
            if ($origId !== '') {
                $idMap[$origId] = $id;
            }

            $data = is_array($raw['data'] ?? null) ? $raw['data'] : [];
            $data['nodeType'] = $type;
            $data['configured'] = true;

            $nodes[] = ['id' => $id, 'type' => $type, 'data' => $data, 'position' => ['x' => 250, 'y' => 50]];
            $i++;
        }

        // Always seed exactly one trigger node at the top.
        $idMap['trigger-1'] = 'trigger-1';
        array_unshift($nodes, [
            'id' => 'trigger-1',
            'type' => 'trigger',
            'data' => ['triggerType' => $triggerType, 'label' => 'Trigger'],
            'position' => ['x' => 250, 'y' => 50],
        ]);

        $validIds = array_column($nodes, 'id');

        // ── Edges ─────────────────────────────────────────────────────────
        $edges = [];
        $seen = [];
        $e = 0;
        foreach (($spec['edges'] ?? []) as $raw) {
            if (! is_array($raw)) {
                continue;
            }
            $source = $idMap[$raw['source'] ?? ''] ?? ($raw['source'] ?? null);
            $target = $idMap[$raw['target'] ?? ''] ?? ($raw['target'] ?? null);
            if (! in_array($source, $validIds, true) || ! in_array($target, $validIds, true) || $source === $target) {
                continue;
            }
            $handle = in_array($raw['sourceHandle'] ?? null, ['true', 'false'], true) ? $raw['sourceHandle'] : null;
            $key = $source.'>'.$target.'>'.($handle ?? '');
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $edges[] = ['id' => 'e'.$e, 'source' => $source, 'target' => $target, 'sourceHandle' => $handle];
            $e++;
        }

        $edges = $this->ensureConnectivity($nodes, $edges);
        $this->layout($nodes, $edges);

        $name = is_string($spec['name'] ?? null) && trim($spec['name']) !== ''
            ? mb_substr(trim($spec['name']), 0, 120)
            : 'AI Automation';

        return [
            'name' => $name,
            'trigger_type' => $triggerType,
            'trigger_config' => $triggerConfig,
            'nodes' => $nodes,
            'edges' => $edges,
        ];
    }

    private function normaliseRecurringSchedule(array $raw): array
    {
        $freq = strtolower((string) ($raw['frequency'] ?? 'daily'));
        if (! in_array($freq, ['daily', 'weekdays', 'weekly', 'custom'], true)) {
            $freq = 'daily';
        }

        $validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        $days = array_values(array_intersect(
            array_map(fn ($d) => strtolower(substr((string) $d, 0, 3)), (array) ($raw['days_of_week'] ?? [])),
            $validDays
        ));
        if (empty($days)) {
            $days = $freq === 'weekdays' ? ['mon', 'tue', 'wed', 'thu', 'fri'] : $validDays;
        }

        $times = [];
        foreach ((array) ($raw['times'] ?? ['09:00']) as $t) {
            if (is_string($t) && preg_match('/^\d{1,2}:\d{2}$/', trim($t))) {
                [$h, $m] = array_map('intval', explode(':', trim($t)));
                if ($h >= 0 && $h <= 23 && $m >= 0 && $m <= 59) {
                    $times[] = sprintf('%02d:%02d', $h, $m);
                }
            }
        }
        $times = array_values(array_unique($times ?: ['09:00']));
        sort($times);

        $tz = is_string($raw['timezone'] ?? null) && in_array($raw['timezone'], timezone_identifiers_list(), true)
            ? $raw['timezone']
            : config('app.timezone', 'UTC');

        return [
            'frequency' => $freq,
            'days_of_week' => $days,
            'times' => $times,
            'timezone' => $tz,
        ];
    }

    private function uniqueId(string $candidate, array $used): string
    {
        $id = $candidate !== '' ? $candidate : 'n';
        $n = 1;
        while (isset($used[$id])) {
            $id = $candidate.'-'.$n++;
        }

        return $id;
    }

    /**
     * Guarantee the trigger reaches the rest of the flow. If the model produced no edge from the
     * trigger, or no edges at all, fall back to a linear chain in node order.
     */
    private function ensureConnectivity(array $nodes, array $edges): array
    {
        $actionIds = array_values(array_filter(array_column($nodes, 'id'), fn ($id) => $id !== 'trigger-1'));
        if (empty($actionIds)) {
            return $edges;
        }

        if (empty($edges)) {
            $chain = array_merge(['trigger-1'], $actionIds);
            $out = [];
            for ($k = 0; $k < count($chain) - 1; $k++) {
                $out[] = ['id' => 'e'.$k, 'source' => $chain[$k], 'target' => $chain[$k + 1], 'sourceHandle' => null];
            }

            return $out;
        }

        $hasTriggerEdge = (bool) array_filter($edges, fn ($e) => $e['source'] === 'trigger-1');
        if (! $hasTriggerEdge) {
            // Connect the trigger to the first node that nothing else points to (a natural entry).
            $targets = array_column($edges, 'target');
            $entry = null;
            foreach ($actionIds as $id) {
                if (! in_array($id, $targets, true)) {
                    $entry = $id;
                    break;
                }
            }
            array_unshift($edges, ['id' => 'e-trigger', 'source' => 'trigger-1', 'target' => $entry ?? $actionIds[0], 'sourceHandle' => null]);
        }

        return $edges;
    }

    /** Layered top-down auto-layout via BFS from the trigger, spreading siblings horizontally. */
    private function layout(array &$nodes, array $edges): void
    {
        $adj = [];
        foreach ($edges as $edge) {
            $adj[$edge['source']][] = $edge['target'];
        }

        $level = ['trigger-1' => 0];
        $queue = ['trigger-1'];
        while ($queue) {
            $cur = array_shift($queue);
            foreach ($adj[$cur] ?? [] as $next) {
                if (! isset($level[$next])) {
                    $level[$next] = $level[$cur] + 1;
                    $queue[] = $next;
                }
            }
        }

        // Any node not reached from the trigger is stacked below everything else.
        $maxLevel = $level ? max($level) : 0;
        foreach ($nodes as $node) {
            if (! isset($level[$node['id']])) {
                $level[$node['id']] = ++$maxLevel;
            }
        }

        $byLevel = [];
        foreach ($level as $id => $lvl) {
            $byLevel[$lvl][] = $id;
        }

        $pos = [];
        foreach ($byLevel as $lvl => $ids) {
            $count = count($ids);
            foreach (array_values($ids) as $idx => $id) {
                $pos[$id] = [
                    'x' => (int) (250 + ($idx - ($count - 1) / 2) * 280),
                    'y' => 50 + $lvl * 150,
                ];
            }
        }

        foreach ($nodes as &$node) {
            if (isset($pos[$node['id']])) {
                $node['position'] = $pos[$node['id']];
            }
        }
        unset($node);
    }
}
