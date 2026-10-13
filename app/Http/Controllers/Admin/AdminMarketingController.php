<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClientSubscription;
use App\Models\Coupon;
use App\Models\Plan;
use App\Models\SmtpConfiguration;
use App\Models\Subscription;
use App\Models\User;
use App\Modules\AI\Services\Llm\LlmManager;
use App\Modules\Broadcasting\Jobs\LaunchCampaignJob;
use App\Modules\Broadcasting\Models\Campaign;
use App\Modules\Broadcasting\Models\CampaignRecipient;
use App\Modules\Broadcasting\Services\CampaignPersonalizer;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\ContactTag;
use App\Modules\Shared\Models\Segment;
use App\Modules\Shared\Services\SegmentResolver;
use App\Services\Mail\MailService;
use App\Services\Marketing\PlatformAudienceSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminMarketingController extends Controller
{
    public const CAMPAIGN_TYPES = [
        'newsletter',
        'product_launch',
        'announcement',
        'educational_series',
        'promotional_offer',
        'holiday_campaign',
        'customer_update',
        'feature_release',
        'maintenance_notice',
    ];

    public const AUDIENCE_TYPES = [
        'all_users',
        'only_registered_users',
        'verified_users',
        'only_buyers',
        'only_subscribers',
        'only_active_subscribers',
        'product_buyers',
        'inactive_users',
        'high_value_customers',
        'recent_customers',
        'affiliates',
        'segment',
        'tag',
        'selected_contacts',
    ];

    public function __construct(
        private PlatformAudienceSyncService $syncService,
        private SegmentResolver $segmentResolver,
    ) {}

    private function assertPlatformAdmin(Request $request): void
    {
        abort_unless(
            $request->user('admin') !== null || (bool) $request->user()?->isAdmin(),
            403,
            'Platform Administrator access is required for the Global Marketing Hub.'
        );
    }

    /**
     * GET /admin/marketing
     * Centralized Admin Marketing Hub & Customer Segmentation Control Center.
     */
    public function index(Request $request): Response
    {
        $this->assertPlatformAdmin($request);
        $workspaceId = $this->syncService->platformWorkspaceId();
        $hasBounceCols = Schema::hasColumn('contacts', 'bounced_at') && Schema::hasColumn('contacts', 'complained_at');

        // Auto-sync on first visit if platform marketing workspace is empty
        if (Contact::where('workspace_id', $workspaceId)->count() === 0) {
            $this->syncService->syncAll();
        } else {
            $this->syncService->ensureDefaultSegments($workspaceId);
        }

        // 1. Dashboard KPIs
        $totalUsers = User::count();
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();
        $todaysRegistrations = User::whereDate('created_at', today())->count();

        $paidOrdersQuery = EcommerceOrder::query()->where(function ($q) {
            $q->whereIn('payment_status', ['paid', 'completed'])
                ->orWhere('financial_status', 'paid')
                ->orWhereNotNull('paid_at');
        });

        $totalCustomers = (clone $paidOrdersQuery)
            ->whereNotNull('customer_email')
            ->distinct('customer_email')
            ->count('customer_email');

        $todaysPurchases = (clone $paidOrdersQuery)->whereDate('created_at', today())->count();
        $todaysRevenue = (float) (clone $paidOrdersQuery)->whereDate('created_at', today())->sum('total');
        $totalRevenue = (float) (clone $paidOrdersQuery)->sum('total');

        $activeUserSubs = Subscription::whereIn('status', ['active', 'trialing'])->count();
        $activeClientSubs = ClientSubscription::whereIn('status', ['active', 'trialing'])->count();
        $activeSubscribers = $activeUserSubs + $activeClientSubs;

        $totalContacts = Contact::where('workspace_id', $workspaceId)->count();
        $deliverableContactsQuery = Contact::where('workspace_id', $workspaceId)
            ->where('opt_in_email', true)
            ->whereNotNull('email')
            ->where('email', '!=', '');
        if ($hasBounceCols) {
            $deliverableContactsQuery->whereNull('bounced_at')->whereNull('complained_at');
        }
        $deliverableContacts = $deliverableContactsQuery->count();

        $suppressedContacts = Contact::where('workspace_id', $workspaceId)
            ->where(function ($q) use ($hasBounceCols) {
                $q->where('opt_in_email', false);
                if ($hasBounceCols) {
                    $q->orWhereNotNull('bounced_at')->orWhereNotNull('complained_at');
                }
            })
            ->count();

        $highValueCount = $this->segmentResolver
            ->presetQuery($workspaceId, 'high_value_customers')
            ->count();

        $inactiveUsersCount = $this->segmentResolver
            ->presetQuery($workspaceId, 'inactive_users')
            ->count();

        // 2. Campaign Performance Summary
        $campaignIds = Campaign::where('workspace_id', $workspaceId)->pluck('id');
        $recipientBreakdown = CampaignRecipient::whereIn('campaign_id', $campaignIds)
            ->selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $sentCount = (int) ($recipientBreakdown['sent'] ?? 0)
            + (int) ($recipientBreakdown['delivered'] ?? 0)
            + (int) ($recipientBreakdown['read'] ?? 0);
        $openedCount = (int) ($recipientBreakdown['read'] ?? 0);
        $failedCount = (int) ($recipientBreakdown['failed'] ?? 0);
        $clickedCount = CampaignRecipient::whereIn('campaign_id', $campaignIds)
            ->whereNotNull('clicked_at')
            ->count();
        $unsubscribedCount = CampaignRecipient::whereIn('campaign_id', $campaignIds)
            ->whereNotNull('opted_out_at')
            ->count();

        $openRate = $sentCount > 0 ? round(($openedCount / $sentCount) * 100, 1) : 0.0;
        $clickRate = $sentCount > 0 ? round(($clickedCount / $sentCount) * 100, 1) : 0.0;

        // 3. Product Buyer Cohorts (Course A Buyers, Course B Buyers, Digital/Physical Products)
        // Computed from EcommerceOrder JSON line_items
        $cohortMap = [];
        (clone $paidOrdersQuery)
            ->whereNotNull('customer_email')
            ->get(['customer_email', 'line_items', 'total'])
            ->each(function (EcommerceOrder $order) use (&$cohortMap) {
                $email = strtolower(trim((string) $order->customer_email));
                $items = is_array($order->line_items) ? $order->line_items : [];
                foreach ($items as $item) {
                    if (! is_array($item)) {
                        continue;
                    }
                    $pid = (int) ($item['product_id'] ?? $item['id'] ?? 0);
                    $pname = trim((string) ($item['name'] ?? $item['title'] ?? 'Product'));
                    $key = $pid > 0 ? "pid:{$pid}" : 'name:'.strtolower($pname);
                    if (! isset($cohortMap[$key])) {
                        $cohortMap[$key] = [
                            'product_id' => $pid > 0 ? $pid : null,
                            'product_name' => $pname ?: 'Product',
                            'emails' => [],
                            'total_revenue' => 0.0,
                        ];
                    }
                    if ($email !== '') {
                        $cohortMap[$key]['emails'][$email] = true;
                    }
                    $itemTotal = isset($item['total'])
                        ? (float) $item['total']
                        : ((float) ($item['unit_price'] ?? $item['price'] ?? 0) * max(1, (int) ($item['quantity'] ?? 1)));
                    $cohortMap[$key]['total_revenue'] += $itemTotal;
                }
            });

        $productBuyerCohorts = collect($cohortMap)
            ->map(fn (array $c) => [
                'product_id' => $c['product_id'],
                'product_name' => $c['product_name'],
                'buyers_count' => count($c['emails']),
                'total_revenue' => round($c['total_revenue'], 2),
            ])
            ->sortByDesc('buyers_count')
            ->take(15)
            ->values();

        // 4. Recent Sales & Recent Signups
        $recentSales = (clone $paidOrdersQuery)
            ->latest('paid_at')
            ->latest('id')
            ->limit(8)
            ->get(['id', 'number', 'customer_name', 'customer_email', 'total', 'currency', 'line_items', 'paid_at', 'created_at'])
            ->map(fn (EcommerceOrder $o) => [
                'id' => $o->id,
                'order_number' => $o->number ?: ('ORD-'.$o->id),
                'customer_name' => $o->customer_name,
                'customer_email' => $o->customer_email,
                'total_amount' => (float) $o->total,
                'currency' => $o->currency ?: 'USD',
                'paid_at' => $o->paid_at?->toIso8601String(),
                'created_at' => $o->created_at?->toIso8601String(),
                'items' => collect($o->line_items ?? [])->map(fn ($item, $idx) => [
                    'id' => $idx + 1,
                    'product_id' => $item['product_id'] ?? $item['id'] ?? null,
                    'product_name' => $item['name'] ?? $item['title'] ?? 'Product',
                    'quantity' => (int) ($item['quantity'] ?? 1),
                    'total_price' => (float) ($item['total'] ?? $item['price'] ?? 0),
                ])->values()->all(),
            ]);

        $recentSignups = User::latest('id')
            ->limit(8)
            ->get(['id', 'name', 'email', 'role', 'active_role', 'email_verified_at', 'created_at']);

        // 5. 14-Day Audience Growth Series
        $audienceGrowth = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $dateStr = $date->toDateString();
            $audienceGrowth[] = [
                'date' => $date->format('M d'),
                'signups' => User::whereDate('created_at', $dateStr)->count(),
                'orders' => (clone $paidOrdersQuery)->whereDate('created_at', $dateStr)->count(),
            ];
        }

        // 6. Filtered Contacts Explorer
        $preset = (string) $request->input('preset', 'all_users');
        $presetRef = $request->input('preset_ref');
        $contactsQuery = in_array($preset, self::AUDIENCE_TYPES, true) && ! in_array($preset, ['segment', 'tag'], true)
            ? $this->segmentResolver->presetQuery($workspaceId, $preset, $presetRef)
            : Contact::where('workspace_id', $workspaceId);

        if ($preset === 'segment' && $presetRef) {
            $seg = Segment::where('workspace_id', $workspaceId)->find($presetRef);
            if ($seg) {
                $contactsQuery = $this->segmentResolver->query($seg);
            }
        } elseif ($preset === 'tag' && $presetRef) {
            $contactsQuery->whereHas('tags', fn ($q) => $q->where('contact_tags.id', $presetRef));
        }

        if ($request->filled('q')) {
            $search = trim((string) $request->input('q'));
            $contactsQuery->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone_e164', 'like', "%{$search}%");
            });
        }

        if ($request->filled('opt_in')) {
            if ($request->input('opt_in') === 'subscribed') {
                $contactsQuery->where('opt_in_email', true);
                if ($hasBounceCols) {
                    $contactsQuery->whereNull('bounced_at')->whereNull('complained_at');
                }
            } elseif ($request->input('opt_in') === 'unsubscribed') {
                $contactsQuery->where(function ($q) use ($hasBounceCols) {
                    $q->where('opt_in_email', false);
                    if ($hasBounceCols) {
                        $q->orWhereNotNull('bounced_at')->orWhereNotNull('complained_at');
                    }
                });
            }
        }

        $contacts = $contactsQuery
            ->with('tags:id,name,color')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        // 7. Segments with live counts
        $segments = Segment::where('workspace_id', $workspaceId)
            ->orderBy('name')
            ->get()
            ->map(function (Segment $segment) {
                $count = $segment->type === 'static'
                    ? $segment->contacts()->count()
                    : $this->segmentResolver->query($segment)->count();

                if ($segment->contact_count !== $count) {
                    $segment->update(['contact_count' => $count]);
                }

                return [
                    'id' => $segment->id,
                    'name' => $segment->name,
                    'type' => $segment->type,
                    'rules_json' => $segment->rules_json,
                    'contact_count' => $count,
                    'updated_at' => $segment->updated_at?->toIso8601String(),
                ];
            });

        $tags = ContactTag::where('workspace_id', $workspaceId)
            ->withCount('contacts')
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        // 8. Campaigns in Platform Marketing Workspace
        $campaigns = Campaign::where('workspace_id', $workspaceId)
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(function (Campaign $c) {
                if (in_array($c->status, ['queued', 'sending', 'paused'], true)) {
                    $c->updateTotals();
                    $c->refresh();
                }

                $clicked = CampaignRecipient::where('campaign_id', $c->id)->whereNotNull('clicked_at')->count();
                $unsub = CampaignRecipient::where('campaign_id', $c->id)->whereNotNull('opted_out_at')->count();

                return [
                    'id' => $c->id,
                    'uuid' => $c->uuid,
                    'name' => $c->name,
                    'campaign_type' => $c->campaign_type ?? ($c->payload_json['campaign_type'] ?? 'newsletter'),
                    'channel' => $c->channel,
                    'audience_type' => $c->payload_json['audience_type'] ?? $c->audience_type,
                    'audience_ref' => $c->payload_json['audience_ref'] ?? $c->audience_ref,
                    'payload_json' => $c->payload_json,
                    'schedule_at' => $c->schedule_at?->toIso8601String(),
                    'recurrence_rule' => $c->recurrence_rule ?? null,
                    'status' => $c->status,
                    'totals_json' => array_merge($c->totals_json ?? [], [
                        'clicked' => $clicked,
                        'unsubscribed' => $unsub,
                    ]),
                    'created_at' => $c->created_at?->toIso8601String(),
                ];
            });

        $products = EcommerceProduct::orderBy('name')
            ->get(['id', 'name', 'price', 'currency', 'product_type', 'status']);

        $plans = Plan::orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'price_cents', 'monthly_price_cents', 'yearly_price_cents'])
            ->map(fn (Plan $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'price_monthly' => round((($p->monthly_price_cents ?? $p->price_cents ?? 0) / 100), 2),
                'price_yearly' => round((($p->yearly_price_cents ?? 0) / 100), 2),
            ]);

        $coupons = Coupon::where('enabled', true)
            ->orderBy('code')
            ->get(['id', 'code', 'kind', 'amount'])
            ->map(fn (Coupon $c) => [
                'id' => $c->id,
                'code' => $c->code,
                'type' => $c->kind === 'percent' ? 'percentage' : 'fixed',
                'value' => $c->kind === 'percent' ? $c->amount : round(($c->amount ?? 0) / 100, 2),
            ]);

        $smtpConfigs = SmtpConfiguration::orderByDesc('is_active')
            ->orderBy('id')
            ->get()
            ->map(fn (SmtpConfiguration $s) => [
                'id' => $s->id,
                'name' => $s->from_name ?: "{$s->host}:{$s->port}",
                'host' => $s->host,
                'port' => $s->port,
                'from_email' => $s->from_email,
                'from_name' => $s->from_name,
                'purpose' => $s->purpose ?? 'both',
                'rate_limit_per_minute' => $s->rate_limit_per_minute ?? null,
                'is_active' => (bool) $s->is_active,
            ]);

        return Inertia::render('Admin/Marketing/Index', [
            'scope' => 'admin',
            'kpis' => [
                'total_users' => $totalUsers,
                'verified_users' => $verifiedUsers,
                'total_customers' => $totalCustomers,
                'active_subscribers' => $activeSubscribers,
                'product_buyers' => $totalCustomers,
                'todays_registrations' => $todaysRegistrations,
                'todays_purchases' => $todaysPurchases,
                'todays_revenue' => round($todaysRevenue, 2),
                'total_revenue' => round($totalRevenue, 2),
                'total_contacts' => $totalContacts,
                'deliverable_contacts' => $deliverableContacts,
                'suppressed_contacts' => $suppressedContacts,
                'high_value_customers' => $highValueCount,
                'inactive_users' => $inactiveUsersCount,
                'vip_threshold' => $this->syncService->vipThreshold(),
            ],
            'campaignPerformance' => [
                'total_campaigns' => $campaignIds->count(),
                'sent' => $sentCount,
                'opened' => $openedCount,
                'clicked' => $clickedCount,
                'failed' => $failedCount,
                'unsubscribed' => $unsubscribedCount,
                'open_rate' => $openRate,
                'click_rate' => $clickRate,
            ],
            'productBuyerCohorts' => $productBuyerCohorts,
            'recentSales' => $recentSales,
            'recentSignups' => $recentSignups,
            'audienceGrowth' => $audienceGrowth,
            'contacts' => $contacts,
            'segments' => $segments,
            'tags' => $tags,
            'campaigns' => $campaigns,
            'products' => $products,
            'plans' => $plans,
            'coupons' => $coupons,
            'smtpConfigs' => $smtpConfigs,
            'contactTokens' => array_merge(
                CampaignPersonalizer::availableContactTokens(),
                [
                    ['key' => '{{contact.custom.plan_name}}', 'label' => 'Subscription Plan'],
                    ['key' => '{{contact.custom.lifetime_value}}', 'label' => 'Lifetime Spend ($)'],
                    ['key' => '{{contact.custom.order_count}}', 'label' => 'Total Orders'],
                ]
            ),
            'filters' => $request->only(['preset', 'preset_ref', 'q', 'opt_in', 'tab']),
        ]);
    }

    /**
     * POST /admin/marketing/sync
     * Synchronize all platform Users, Subscriptions, Affiliates, and EcommerceOrders into the Marketing Hub.
     */
    public function syncAudience(Request $request): RedirectResponse
    {
        $this->assertPlatformAdmin($request);
        $stats = $this->syncService->syncAll();

        return back()->with(
            'success',
            "Audience synchronized: {$stats['users_synced']} users, {$stats['buyers_synced']} order buyers ({$stats['total_contacts']} total unified contacts)."
        );
    }

    /**
     * POST /admin/marketing/audience-preview
     * Live recipient count & sample preview for any audience cohort.
     */
    public function audiencePreview(Request $request): JsonResponse
    {
        $this->assertPlatformAdmin($request);
        $workspaceId = $this->syncService->platformWorkspaceId();
        $hasBounceCols = Schema::hasColumn('contacts', 'bounced_at') && Schema::hasColumn('contacts', 'complained_at');

        $validated = $request->validate([
            'audience_type' => ['required', 'string', 'in:' . implode(',', self::AUDIENCE_TYPES)],
            'audience_ref' => ['nullable', 'string'],
        ]);

        $type = $validated['audience_type'];
        $ref = $validated['audience_ref'] ?? null;

        if ($type === 'segment') {
            $segment = $ref ? Segment::where('workspace_id', $workspaceId)->find($ref) : null;
            $baseQuery = $segment
                ? $this->segmentResolver->query($segment)
                : Contact::where('workspace_id', $workspaceId)->whereRaw('1 = 0');
        } elseif ($type === 'tag') {
            $baseQuery = Contact::where('workspace_id', $workspaceId)
                ->when($ref, fn ($q) => $q->whereHas('tags', fn ($tq) => $tq->where('contact_tags.id', $ref)), fn ($q) => $q->whereRaw('1 = 0'));
        } else {
            $baseQuery = $this->segmentResolver->presetQuery($workspaceId, $type, $ref);
        }

        $totalMatched = (clone $baseQuery)->count();

        $deliverableQuery = (clone $baseQuery)
            ->where('opt_in_email', true)
            ->whereNotNull('email')
            ->where('email', '!=', '');
        if ($hasBounceCols) {
            $deliverableQuery->whereNull('bounced_at')->whereNull('complained_at');
        }

        $deliverable = (clone $deliverableQuery)->count();
        $suppressed = max(0, $totalMatched - $deliverable);

        $sample = $deliverableQuery
            ->limit(6)
            ->get(['id', 'first_name', 'last_name', 'email', 'country', 'custom_fields']);

        return response()->json([
            'matched' => $totalMatched,
            'deliverable' => $deliverable,
            'suppressed' => $suppressed,
            'sample' => $sample,
        ]);
    }

    /**
     * POST /admin/marketing/segments
     * Create or update a custom segment in the Platform Marketing Workspace.
     */
    public function storeSegment(Request $request): RedirectResponse
    {
        $this->assertPlatformAdmin($request);
        $workspaceId = $this->syncService->platformWorkspaceId();

        $validated = $request->validate([
            'id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:128'],
            'type' => ['required', 'in:dynamic,static'],
            'rules_json' => ['nullable', 'array'],
            'rules_json.combinator' => ['nullable', 'in:AND,OR'],
            'rules_json.conditions' => ['nullable', 'array'],
            'contact_ids' => ['nullable', 'array'],
        ]);

        $segment = null;
        if (! empty($validated['id'])) {
            $segment = Segment::where('workspace_id', $workspaceId)->find($validated['id']);
        }

        $payload = [
            'workspace_id' => $workspaceId,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'rules_json' => $validated['type'] === 'dynamic'
                ? ($validated['rules_json'] ?? ['combinator' => 'AND', 'conditions' => []])
                : null,
        ];

        if ($segment) {
            $segment->update($payload);
        } else {
            $segment = Segment::create($payload);
        }

        if ($segment->type === 'static' && isset($validated['contact_ids'])) {
            $validIds = Contact::where('workspace_id', $workspaceId)
                ->whereIn('id', $validated['contact_ids'])
                ->pluck('id')
                ->all();
            $segment->contacts()->sync($validIds);
            $segment->update(['contact_count' => count($validIds)]);
        } else {
            $count = $this->segmentResolver->query($segment)->count();
            $segment->update(['contact_count' => $count]);
        }

        return back()->with('success', "Segment \"{$segment->name}\" saved ({$segment->contact_count} matching contacts).");
    }

    /**
     * DELETE /admin/marketing/segments/{segment}
     */
    public function destroySegment(Request $request, string|int $segment): RedirectResponse
    {
        $this->assertPlatformAdmin($request);
        $workspaceId = $this->syncService->platformWorkspaceId();
        $seg = Segment::where('workspace_id', $workspaceId)->findOrFail($segment);

        $seg->delete();

        return back()->with('success', 'Segment deleted.');
    }

    /**
     * POST /admin/marketing/campaigns
     * Create or update a marketing campaign in the Platform Marketing Workspace (and optionally launch immediately).
     */
    public function storeCampaign(Request $request): RedirectResponse
    {
        $this->assertPlatformAdmin($request);
        $workspaceId = $this->syncService->platformWorkspaceId();

        $validated = $request->validate([
            'id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:128'],
            'campaign_type' => ['required', 'string', 'in:' . implode(',', self::CAMPAIGN_TYPES)],
            'audience_type' => ['required', 'string', 'in:' . implode(',', self::AUDIENCE_TYPES)],
            'audience_ref' => ['nullable', 'string', 'max:2000'],
            'subject' => ['required', 'string', 'max:255'],
            'preheader' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'from_name' => ['nullable', 'string', 'max:128'],
            'from_email' => ['nullable', 'email', 'max:191'],
            'reply_to' => ['nullable', 'email', 'max:191'],
            'track_opens' => ['nullable', 'boolean'],
            'track_clicks' => ['nullable', 'boolean'],
            'schedule_at' => ['nullable', 'date'],
            'recurrence_rule' => ['nullable', 'array'],
            'launch_now' => ['nullable', 'boolean'],
        ]);

        $payloadJson = [
            'subject' => $validated['subject'],
            'preheader' => $validated['preheader'] ?? '',
            'body' => $validated['body'],
            'from_name' => $validated['from_name'] ?? config('app.name'),
            'from_email' => $validated['from_email'] ?? null,
            'reply_to' => $validated['reply_to'] ?? null,
            'track_opens' => (bool) ($validated['track_opens'] ?? true),
            'track_clicks' => (bool) ($validated['track_clicks'] ?? true),
            'campaign_type' => $validated['campaign_type'],
            'audience_type' => $validated['audience_type'],
            'audience_ref' => $validated['audience_ref'] ?? null,
        ];

        $campaign = null;
        if (! empty($validated['id'])) {
            $campaign = Campaign::where('workspace_id', $workspaceId)->find($validated['id']);
        }

        // MySQL campaigns.audience_type is ENUM('segment','contact_list','tag','csv').
        // Store preset cohorts ('all_users', 'only_buyers', etc.) as 'contact_list' in the ENUM column
        // while keeping the exact preset cohort in payload_json['audience_type'].
        $dbAudienceType = in_array($validated['audience_type'], ['segment', 'contact_list', 'tag', 'csv'], true)
            ? $validated['audience_type']
            : 'contact_list';

        $attributes = [
            'workspace_id' => $workspaceId,
            'name' => $validated['name'],
            'channel' => 'email',
            'audience_type' => $dbAudienceType,
            'audience_ref' => $validated['audience_ref'] ?? null,
            'payload_json' => $payloadJson,
            'schedule_at' => ! empty($validated['schedule_at']) ? $validated['schedule_at'] : null,
            'timezone' => config('app.timezone', 'UTC'),
        ];

        if (Schema::hasColumn('campaigns', 'campaign_type')) {
            $attributes['campaign_type'] = $validated['campaign_type'];
        }
        if (Schema::hasColumn('campaigns', 'recurrence_rule')) {
            $attributes['recurrence_rule'] = $validated['recurrence_rule'] ?? null;
        }

        if ($campaign && in_array($campaign->status, ['draft', 'paused'], true)) {
            $campaign->update($attributes);
        } else {
            $campaign = Campaign::create(array_merge($attributes, [
                'status' => 'draft',
                'created_by' => $request->user()?->id,
            ]));
        }

        if (! empty($validated['launch_now'])) {
            $campaign->update(['status' => 'queued']);

            if (! $campaign->schedule_at || $campaign->schedule_at->isPast()) {
                return $this->executeCampaignLaunch($campaign);
            }

            return back()->with('success', "Campaign \"{$campaign->name}\" scheduled for " . $campaign->schedule_at->toDayDateTimeString() . '.');
        }

        return back()->with('success', "Campaign \"{$campaign->name}\" saved as draft.");
    }

    private function executeCampaignLaunch(Campaign $campaign): RedirectResponse
    {
        LaunchCampaignJob::dispatch($campaign->id)->onQueue('broadcast');

        if (! app()->runningUnitTests()) {
            try {
                (new LaunchCampaignJob($campaign->id))->handle();
            } catch (\Throwable $e) {
                Log::warning('AdminMarketingController::executeCampaignLaunch inline error', [
                    'campaign_id' => $campaign->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $campaign->refresh();
        $totals = $campaign->totals_json ?? [];
        $sent = (int) ($totals['sent'] ?? 0);
        $failed = (int) ($totals['failed'] ?? 0);

        if ($campaign->status === 'failed') {
            $firstFailReason = CampaignRecipient::where('campaign_id', $campaign->id)
                ->where('status', 'failed')
                ->whereNotNull('failed_reason')
                ->value('failed_reason')
                ?? ($totals['failed_reason'] ?? 'Check your active SMTP configuration.');

            return back()->with('error', "Campaign \"{$campaign->name}\" could not send: {$firstFailReason}");
        }

        if ($sent > 0) {
            return back()->with('success', "Campaign \"{$campaign->name}\" launched — {$sent} email(s) sent" . ($failed > 0 ? " ({$failed} failed)." : '!'));
        }

        return back()->with('success', "Campaign \"{$campaign->name}\" queued for delivery.");
    }

    private function resolvePlatformCampaign(string|int $idOrUuid): Campaign
    {
        $this->assertPlatformAdmin(request());
        $workspaceId = $this->syncService->platformWorkspaceId();

        return Campaign::where('workspace_id', $workspaceId)
            ->where(function ($q) use ($idOrUuid) {
                if (is_numeric($idOrUuid)) {
                    $q->where('id', (int) $idOrUuid);
                } else {
                    $q->where('uuid', (string) $idOrUuid);
                }
            })
            ->firstOrFail();
    }

    /**
     * POST /admin/marketing/campaigns/{campaign}/launch
     */
    public function launchCampaign(string|int $campaign): RedirectResponse
    {
        $model = $this->resolvePlatformCampaign($campaign);
        abort_unless(in_array($model->status, ['draft', 'paused', 'failed'], true), 422, 'Only draft, paused, or failed campaigns can be launched.');

        $model->update(['status' => 'queued']);

        if (! $model->schedule_at || $model->schedule_at->isPast()) {
            return $this->executeCampaignLaunch($model);
        }

        return back()->with('success', "Campaign \"{$model->name}\" scheduled for launch.");
    }

    /**
     * POST /admin/marketing/campaigns/{campaign}/pause
     */
    public function pauseCampaign(string|int $campaign): RedirectResponse
    {
        $model = $this->resolvePlatformCampaign($campaign);
        abort_unless(in_array($model->status, ['queued', 'sending'], true), 422, 'Only queued or sending campaigns can be paused.');

        $model->update(['status' => 'paused']);

        return back()->with('success', "Campaign \"{$model->name}\" paused.");
    }

    /**
     * DELETE /admin/marketing/campaigns/{campaign}
     */
    public function destroyCampaign(string|int $campaign): RedirectResponse
    {
        $model = $this->resolvePlatformCampaign($campaign);
        $model->delete();

        return back()->with('success', 'Campaign deleted.');
    }

    /**
     * POST /admin/marketing/campaigns/{campaign}/test-send
     */
    public function testSendCampaign(Request $request, string|int $campaign): JsonResponse
    {
        $model = $this->resolvePlatformCampaign($campaign);
        $workspaceId = $this->syncService->platformWorkspaceId();

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $personalizer = app(CampaignPersonalizer::class);
        $admin = $request->user();

        $contact = new Contact([
            'workspace_id' => $workspaceId,
            'email' => $validated['email'],
            'first_name' => $admin?->name ? explode(' ', $admin->name)[0] : 'Admin',
            'last_name' => 'Preview',
            'country' => 'US',
            'language' => 'en',
            'opt_in_email' => true,
            'custom_fields' => [
                'plan_name' => 'Pro Growth',
                'lifetime_value' => 499,
                'order_count' => 3,
            ],
        ]);

        try {
            $payload = $model->payload_json ?? [];
            $subject = $personalizer->renderText('[TEST] ' . ($payload['subject'] ?? $model->name), $contact);
            $body = $personalizer->renderText($payload['body'] ?? '', $contact, [
                'unsubscribe_url' => url('/track/email/unsubscribe/test-preview'),
            ]);
            $fromEmail = filled($payload['from_email'] ?? '') ? $payload['from_email'] : null;
            $fromName = filled($payload['from_name'] ?? '') ? $payload['from_name'] : null;
            $replyTo = filled($payload['reply_to'] ?? '') ? $payload['reply_to'] : null;

            $smtp = SmtpConfiguration::getActiveFor('marketing')
                ?? SmtpConfiguration::getActive()
                ?? \App\Modules\Broadcasting\Models\WorkspaceSmtpConfig::forWorkspace($workspaceId);

            if ($smtp) {
                app(MailService::class)->sendRaw($smtp, $contact->email, $subject, $body, [], $fromEmail, $fromName, $replyTo);
            } else {
                Mail::html($body, function ($m) use ($contact, $subject, $fromEmail, $fromName, $replyTo) {
                    $m->to($contact->email, $contact->full_name)->subject($subject);
                    if ($fromEmail) {
                        $m->from($fromEmail, $fromName ?: null);
                    }
                    if ($replyTo) {
                        $m->replyTo($replyTo);
                    }
                });
            }

            return response()->json(['ok' => true, 'message' => "Test email sent to {$contact->email}."]);
        } catch (\Throwable $e) {
            Log::warning('AdminMarketingController::testSendCampaign failed', [
                'campaign_id' => $model->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'ok' => false,
                'error' => 'Failed to send test email: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /admin/marketing/contacts/{contact}/toggle-opt-in
     * Toggle marketing consent or clear bounce/complaint flags for a contact.
     */
    public function toggleContactOptIn(Request $request, string|int $contact): RedirectResponse
    {
        $this->assertPlatformAdmin($request);
        $workspaceId = $this->syncService->platformWorkspaceId();
        $model = Contact::where('workspace_id', $workspaceId)
            ->where(function ($q) use ($contact) {
                if (is_numeric($contact)) {
                    $q->where('id', (int) $contact);
                } else {
                    $q->where('uuid', (string) $contact);
                }
            })
            ->firstOrFail();

        $newOptIn = ! $model->opt_in_email;
        $updatePayload = ['opt_in_email' => $newOptIn];

        if (Schema::hasColumn('contacts', 'bounced_at')) {
            $updatePayload['bounced_at'] = $newOptIn ? null : $model->bounced_at;
        }
        if (Schema::hasColumn('contacts', 'complained_at')) {
            $updatePayload['complained_at'] = $newOptIn ? null : $model->complained_at;
        }

        $model->update($updatePayload);

        return back()->with(
            'success',
            $newOptIn
                ? "Marketing consent re-enabled for {$model->email}."
                : "{$model->email} added to marketing suppression list."
        );
    }

    /**
     * POST /admin/marketing/ai-assist
     * AI Campaign Assistant: generates subject lines, full HTML newsletter/campaign copy, CTAs,
     * send-time recommendations, and audience segmentation recommendations.
     */
    public function aiAssist(Request $request): JsonResponse
    {
        $this->assertPlatformAdmin($request);
        $validated = $request->validate([
            'action' => ['required', 'in:generate_campaign,improve_subject,generate_followup'],
            'campaign_type' => ['nullable', 'string', 'in:' . implode(',', self::CAMPAIGN_TYPES)],
            'goal' => ['required', 'string', 'max:2000'],
            'tone' => ['nullable', 'string', 'max:64'],
            'product_id' => ['nullable', 'integer'],
            'coupon_code' => ['nullable', 'string', 'max:64'],
            'current_subject' => ['nullable', 'string', 'max:255'],
        ]);

        $campaignType = $validated['campaign_type'] ?? 'newsletter';
        $tone = $validated['tone'] ?? 'professional & engaging';
        $goal = $validated['goal'];

        $productContext = '';
        if (! empty($validated['product_id'])) {
            $product = EcommerceProduct::find($validated['product_id']);
            if ($product) {
                $productContext = "\nFeatured Product/Course: {$product->name} ({$product->currency} {$product->price}) - " . Str::limit(strip_tags((string) $product->description), 240);
            }
        }

        $couponContext = '';
        if (! empty($validated['coupon_code'])) {
            $coupon = Coupon::where('code', $validated['coupon_code'])->first();
            if ($coupon) {
                $discountLabel = $coupon->kind === 'percent'
                    ? "{$coupon->amount}% OFF"
                    : '$' . round(($coupon->amount ?? 0) / 100, 2) . ' OFF';
                $couponContext = "\nPromotional Coupon Code: {$coupon->code} ({$discountLabel})";
            } else {
                $couponContext = "\nPromotional Coupon Code: {$validated['coupon_code']}";
            }
        }

        if ($validated['action'] === 'improve_subject') {
            $prompt = "Generate 5 high-converting email subject lines and matching preheaders for a '{$campaignType}' campaign.
Campaign Goal / Topic: {$goal}
Current Subject: " . ($validated['current_subject'] ?? 'None') . "
Tone: {$tone}{$productContext}{$couponContext}

Return JSON only:
{
  \"suggestions\": [
    {\"subject\": \"Subject Line 1\", \"preheader\": \"Preheader text 1\", \"angle\": \"Urgency / Value / Curiosity\"}
  ]
}";
            $res = $this->callLlm($prompt);
            if ($res && isset($res['suggestions']) && is_array($res['suggestions'])) {
                return response()->json(['ok' => true, 'suggestions' => $res['suggestions']]);
            }

            return response()->json([
                'ok' => true,
                'suggestions' => [
                    ['subject' => "🚀 {$goal} — Inside Your Exclusive Update", 'preheader' => 'See what is new and how it helps you grow faster.', 'angle' => 'Value & Discovery'],
                    ['subject' => "{{contact.first_name}}, don't miss this update from " . config('app.name'), 'preheader' => 'Actionable insights and new tools ready for your account.', 'angle' => 'Personalization'],
                    ['subject' => "New Release: How to get 2x better results with {$goal}", 'preheader' => 'Step-by-step breakdown + quick-start link inside.', 'angle' => 'Benefit-Driven'],
                    ['subject' => 'Quick question about your workflow (+ a special resource)', 'preheader' => 'We built something specifically for our community.', 'angle' => 'Curiosity'],
                    ['subject' => "[Announcement] Important updates regarding {$goal}", 'preheader' => 'Everything you need to know in a 2-minute read.', 'angle' => 'Direct & Clear'],
                ],
            ]);
        }

        // Full campaign generation or follow-up generation
        $isFollowup = $validated['action'] === 'generate_followup';
        $prompt = "You are a Senior SaaS Lifecycle & Email Marketing Architect for " . config('app.name') . ".
Create a complete, high-converting " . ($isFollowup ? 'follow-up email for non-openers/clickers' : "'{$campaignType}' email campaign") . ".
Campaign Goal: {$goal}
Tone: {$tone}{$productContext}{$couponContext}

Use clean, responsive inline-styled HTML suitable for modern email clients. Include personalization tokens such as {{contact.first_name}}.
Also recommend the best target audience preset from: all_users, only_registered_users, verified_users, only_buyers, only_active_subscribers, product_buyers, inactive_users, high_value_customers, recent_customers, affiliates.
Also recommend the optimal send window.

Return JSON only:
{
  \"subject\": \"Compelling email subject line\",
  \"preheader\": \"Preview text shown in inbox\",
  \"cta_text\": \"Primary button text\",
  \"recommended_audience\": \"only_buyers\",
  \"recommended_send_time\": \"Tuesday or Thursday at 10:00 AM recipient local time\",
  \"body\": \"<div>...full responsive HTML email...</div>\"
}";

        $res = $this->callLlm($prompt);
        if ($res && ! empty($res['subject']) && ! empty($res['body'])) {
            return response()->json(['ok' => true, 'campaign' => $res]);
        }

        // Deterministic rich HTML template fallback when no external LLM key is configured
        $fallback = $this->buildFallbackCampaign($campaignType, $goal, $productContext, $couponContext, $isFollowup);

        return response()->json(['ok' => true, 'campaign' => $fallback]);
    }

    private function callLlm(string $prompt): ?array
    {
        try {
            $workspaceId = $this->syncService->platformWorkspaceId();
            $provider = LlmManager::forWorkspace($workspaceId);
            $response = $provider->chat([
                ['role' => 'system', 'content' => 'You are an expert SaaS Email Marketing Copywriter and CRM Strategist. Respond with valid JSON only, without markdown code fences.'],
                ['role' => 'user', 'content' => $prompt],
            ], ['temperature' => 0.7, 'max_tokens' => 2200]);

            $text = trim((string) ($response->text ?? ''));
            if (str_starts_with($text, '```json')) {
                $text = substr($text, 7);
            }
            if (str_starts_with($text, '```')) {
                $text = substr($text, 3);
            }
            if (str_ends_with($text, '```')) {
                $text = substr($text, 0, -3);
            }

            $decoded = json_decode(trim($text), true);

            return is_array($decoded) ? $decoded : null;
        } catch (\Throwable $e) {
            Log::info('AdminMarketingController AI fallback used: ' . $e->getMessage());

            return null;
        }
    }

    private function buildFallbackCampaign(
        string $campaignType,
        string $goal,
        string $productContext,
        string $couponContext,
        bool $isFollowup
    ): array {
        $appName = e(config('app.name', 'BotifyAI'));
        $badge = strtoupper(str_replace('_', ' ', $campaignType));
        $subjectPrefix = $isFollowup ? 'Following up: ' : '';

        $recommendedAudience = match ($campaignType) {
            'product_launch', 'promotional_offer', 'holiday_campaign' => 'only_buyers',
            'educational_series', 'customer_update', 'feature_release' => 'only_active_subscribers',
            'maintenance_notice', 'announcement' => 'all_users',
            default => 'only_registered_users',
        };

        $promoBanner = '';
        if ($productContext || $couponContext) {
            $promoLines = trim($productContext . "\n" . $couponContext);
            $promoBanner = '<div style="margin:24px 0;padding:18px 20px;background:#f5f3ff;border-left:4px solid #6366f1;border-radius:8px;color:#1e1b4b;font-size:14px;line-height:1.6;">'
                . nl2br(e($promoLines))
                . '</div>';
        }

        $ctaUrl = e(url('/dashboard'));
        $html = <<<HTML
<div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
  <div style="margin-bottom:20px;">
    <span style="display:inline-block;padding:4px 10px;background:#eef2ff;color:#4f46e5;font-size:11px;font-weight:700;letter-spacing:0.06em;border-radius:999px;">{$badge}</span>
  </div>
  <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111827;">{$goal}</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">Hi {{contact.first_name}},</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
    We are excited to share an important update designed to help you get even more value from <strong>{$appName}</strong>. Whether you are scaling customer engagement, launching digital products, or automating campaigns, this update was built with your growth in mind.
  </p>
  {$promoBanner}
  <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.7;color:#374151;">
    <li><strong>Streamlined Workflow:</strong> Faster setup and real-time analytics across your workspace.</li>
    <li><strong>Smarter Targeting:</strong> Reach the right customers at the right lifecycle stage.</li>
    <li><strong>Immediate Impact:</strong> Ready to activate directly from your dashboard today.</li>
  </ul>
  <div style="margin:28px 0;text-align:center;">
    <a href="{$ctaUrl}" style="display:inline-block;padding:13px 28px;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">Explore Now in {$appName} →</a>
  </div>
  <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">
    Warm regards,<br>
    <strong>The {$appName} Team</strong>
  </p>
</div>
HTML;

        return [
            'subject' => "{$subjectPrefix}{$goal}",
            'preheader' => "See what's new inside {$appName} and how to put it to work today.",
            'cta_text' => "Explore Now in {$appName}",
            'recommended_audience' => $recommendedAudience,
            'recommended_send_time' => 'Tuesday or Thursday at 10:00 AM recipient local time',
            'body' => $html,
        ];
    }
}

