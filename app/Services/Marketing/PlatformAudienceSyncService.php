<?php

namespace App\Services\Marketing;

use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Workspace;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\ContactTag;
use App\Modules\Shared\Models\Segment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PlatformAudienceSyncService
{
    public const SETTING_WORKSPACE_ID = 'marketing.platform_workspace_id';

    public const SETTING_VIP_THRESHOLD = 'marketing.vip_lifetime_value_threshold';

    /**
     * Resolve or create the canonical Platform Marketing Workspace ID.
     */
    public function platformWorkspaceId(): int
    {
        $storedId = (int) SystemSetting::get(self::SETTING_WORKSPACE_ID, 0);
        if ($storedId > 0 && Workspace::whereKey($storedId)->exists()) {
            return $storedId;
        }

        $workspace = Workspace::firstOrCreate(
            ['name' => 'Platform Marketing Hub'],
            [
                'default_locale' => 'en',
                'currency_code' => 'USD',
            ]
        );

        SystemSetting::set(self::SETTING_WORKSPACE_ID, (string) $workspace->id, false, 'marketing');

        return (int) $workspace->id;
    }

    /**
     * Get the configurable VIP lifetime spending threshold (default: 500).
     */
    public function vipThreshold(): float
    {
        return (float) (SystemSetting::get(self::SETTING_VIP_THRESHOLD, 500) ?: 500);
    }

    /**
     * Sync a registered User into the Platform Marketing Workspace Contact directory.
     */
    public function syncUser(User $user): ?Contact
    {
        $email = strtolower(trim((string) $user->email));
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        try {
            $workspaceId = $this->platformWorkspaceId();

            $existing = Contact::withTrashed()
                ->where('workspace_id', $workspaceId)
                ->whereRaw('LOWER(email) = ?', [$email])
                ->first();

            $nameParts = preg_split('/\s+/u', trim((string) $user->name), 2) ?: [];
            $firstName = $nameParts[0] ?? null;
            $lastName = $nameParts[1] ?? null;

            $effectiveSub = $user->effectiveSubscription();
            $subStatus = 'none';
            $planId = null;
            $planName = null;

            if ($effectiveSub) {
                $subStatus = $effectiveSub->status ?? 'active';
                $planId = $effectiveSub->plan_id ?? null;
                $planName = $effectiveSub->plan?->name ?? null;
            } else {
                $latestSub = $user->subscriptions()->latest('id')->first();
                if ($latestSub) {
                    $subStatus = $latestSub->status ?? 'expired';
                    $planId = $latestSub->plan_id;
                    $planName = $latestSub->plan?->name;
                }
            }

            $orderMetrics = $this->computeOrderMetricsForEmail($email);

            $existingCustomFields = is_array($existing?->custom_fields) ? $existing->custom_fields : [];
            $customFields = array_merge($existingCustomFields, [
                'is_registered_user' => true,
                'user_id' => $user->id,
                'user_role' => $user->role ?? 'client',
                'active_role' => $user->getActiveRole(),
                'email_verified' => $user->email_verified_at !== null,
                'registered_at' => $user->created_at?->toIso8601String(),
                'subscription_status' => $subStatus,
                'plan_id' => $planId,
                'plan_name' => $planName,
                'affiliate_status' => $user->affiliate_status ?? 'inactive',
                'is_affiliate' => $user->isAffiliate(),
                'order_count' => $orderMetrics['order_count'],
                'lifetime_value' => $orderMetrics['lifetime_value'],
                'last_order_at' => $orderMetrics['last_order_at'],
                'purchased_product_ids' => $orderMetrics['purchased_product_ids'],
                'purchased_product_names' => $orderMetrics['purchased_product_names'],
            ]);

            $payload = [
                'workspace_id' => $workspaceId,
                'email' => $email,
                'first_name' => $firstName ?: $existing?->first_name,
                'last_name' => $lastName ?: $existing?->last_name,
                'phone_e164' => $existing?->phone_e164 ?: ($orderMetrics['phone_e164'] ?? null),
                'language' => $user->locale ?: ($existing?->language ?? 'en'),
                'source' => $existing?->source ?: 'user_registration',
                'custom_fields' => $customFields,
            ];

            if (Schema::hasColumn('contacts', 'user_id')) {
                $payload['user_id'] = $user->id;
            }

            if (! $existing) {
                $payload['opt_in_email'] = true;
                $payload['opt_in_whatsapp'] = ! empty($payload['phone_e164']);
                $payload['opt_in_sms'] = ! empty($payload['phone_e164']);
                $contact = Contact::create($payload);
            } else {
                if ($existing->trashed()) {
                    $existing->restore();
                }
                $existing->update($payload);
                $contact = $existing;
            }

            $this->syncLifecycleTags($workspaceId, $contact, $customFields);

            return $contact;
        } catch (\Throwable $e) {
            Log::warning('PlatformAudienceSyncService::syncUser failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Sync a paid EcommerceOrder buyer into the Platform Marketing Workspace Contact directory.
     */
    public function syncOrderBuyer(EcommerceOrder $order): ?Contact
    {
        $email = strtolower(trim((string) $order->customer_email));
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        try {
            $matchingUser = User::whereRaw('LOWER(email) = ?', [$email])->first();
            if ($matchingUser) {
                return $this->syncUser($matchingUser);
            }

            $workspaceId = $this->platformWorkspaceId();

            $existing = Contact::withTrashed()
                ->where('workspace_id', $workspaceId)
                ->whereRaw('LOWER(email) = ?', [$email])
                ->first();

            $nameParts = preg_split('/\s+/u', trim((string) $order->customer_name), 2) ?: [];
            $firstName = $nameParts[0] ?? null;
            $lastName = $nameParts[1] ?? null;

            $orderMetrics = $this->computeOrderMetricsForEmail($email);

            $existingCustomFields = is_array($existing?->custom_fields) ? $existing->custom_fields : [];
            $customFields = array_merge($existingCustomFields, [
                'is_registered_user' => (bool) ($existingCustomFields['is_registered_user'] ?? false),
                'email_verified' => (bool) ($existingCustomFields['email_verified'] ?? false),
                'subscription_status' => $existingCustomFields['subscription_status'] ?? 'none',
                'order_count' => $orderMetrics['order_count'],
                'lifetime_value' => $orderMetrics['lifetime_value'],
                'last_order_at' => $orderMetrics['last_order_at'],
                'purchased_product_ids' => $orderMetrics['purchased_product_ids'],
                'purchased_product_names' => $orderMetrics['purchased_product_names'],
            ]);

            $shippingCountry = is_array($order->metadata)
                ? ($order->metadata['country'] ?? null)
                : null;

            $payload = [
                'workspace_id' => $workspaceId,
                'email' => $email,
                'first_name' => $firstName ?: $existing?->first_name,
                'last_name' => $lastName ?: $existing?->last_name,
                'phone_e164' => $order->customer_phone ?: ($existing?->phone_e164 ?? $orderMetrics['phone_e164']),
                'country' => $shippingCountry ? strtoupper(substr((string) $shippingCountry, 0, 2)) : $existing?->country,
                'source' => $existing?->source ?: 'ecommerce_checkout',
                'custom_fields' => $customFields,
            ];

            if (! $existing) {
                $payload['opt_in_email'] = true;
                $payload['opt_in_whatsapp'] = ! empty($payload['phone_e164']);
                $payload['opt_in_sms'] = ! empty($payload['phone_e164']);
                $contact = Contact::create($payload);
            } else {
                if ($existing->trashed()) {
                    $existing->restore();
                }
                $existing->update($payload);
                $contact = $existing;
            }

            $this->syncLifecycleTags($workspaceId, $contact, $customFields);

            return $contact;
        } catch (\Throwable $e) {
            Log::warning('PlatformAudienceSyncService::syncOrderBuyer failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Bulk synchronize all platform Users and paid EcommerceOrders into the Platform Marketing Workspace.
     *
     * @return array{users_synced: int, buyers_synced: int, total_contacts: int}
     */
    public function syncAll(): array
    {
        $workspaceId = $this->platformWorkspaceId();
        $usersSynced = 0;
        $buyersSynced = 0;

        User::query()->orderBy('id')->chunk(200, function ($users) use (&$usersSynced) {
            foreach ($users as $user) {
                if ($this->syncUser($user)) {
                    $usersSynced++;
                }
            }
        });

        EcommerceOrder::query()
            ->where(function ($q) {
                $q->whereIn('payment_status', ['paid', 'completed'])
                    ->orWhere('financial_status', 'paid')
                    ->orWhereNotNull('paid_at');
            })
            ->whereNotNull('customer_email')
            ->orderBy('id')
            ->chunk(200, function ($orders) use (&$buyersSynced) {
                foreach ($orders as $order) {
                    if ($this->syncOrderBuyer($order)) {
                        $buyersSynced++;
                    }
                }
            });

        $this->ensureDefaultSegments($workspaceId);

        $totalContacts = Contact::where('workspace_id', $workspaceId)->count();

        return [
            'users_synced' => $usersSynced,
            'buyers_synced' => $buyersSynced,
            'total_contacts' => $totalContacts,
        ];
    }

    /**
     * Check whether a given workspace ID is the global Platform Marketing Hub workspace.
     */
    public function isPlatformWorkspace(int $workspaceId): bool
    {
        $storedId = (int) SystemSetting::get(self::SETTING_WORKSPACE_ID, 0);
        if ($storedId > 0) {
            return $workspaceId === $storedId;
        }

        return Workspace::where('id', $workspaceId)->where('name', 'Platform Marketing Hub')->exists();
    }

    /**
     * Synchronize only a specific tenant workspace's paid EcommerceOrders into that workspace's own Contact directory.
     * Never touches global platform Users or other workspaces' orders.
     *
     * @return array{buyers_synced: int, total_contacts: int}
     */
    public function syncWorkspaceAudience(int $workspaceId): array
    {
        $buyersSynced = 0;

        EcommerceOrder::query()
            ->where('workspace_id', $workspaceId)
            ->where(function ($q) {
                $q->whereIn('payment_status', ['paid', 'completed'])
                    ->orWhere('financial_status', 'paid')
                    ->orWhereNotNull('paid_at');
            })
            ->whereNotNull('customer_email')
            ->orderBy('id')
            ->chunk(200, function ($orders) use ($workspaceId, &$buyersSynced) {
                foreach ($orders as $order) {
                    if ($this->syncWorkspaceOrderBuyer($order, $workspaceId)) {
                        $buyersSynced++;
                    }
                }
            });

        $this->ensureWorkspaceDefaultSegments($workspaceId);

        $totalContacts = Contact::where('workspace_id', $workspaceId)->count();

        return [
            'buyers_synced' => $buyersSynced,
            'total_contacts' => $totalContacts,
        ];
    }

    /**
     * Sync a workspace's own paid EcommerceOrder buyer into that workspace's Contact directory.
     */
    public function syncWorkspaceOrderBuyer(EcommerceOrder $order, int $workspaceId): ?Contact
    {
        if ((int) $order->workspace_id !== $workspaceId) {
            return null;
        }

        $email = strtolower(trim((string) $order->customer_email));
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        try {
            $existing = Contact::withTrashed()
                ->where('workspace_id', $workspaceId)
                ->whereRaw('LOWER(email) = ?', [$email])
                ->first();

            $nameParts = preg_split('/\s+/u', trim((string) $order->customer_name), 2) ?: [];
            $firstName = $nameParts[0] ?? null;
            $lastName = $nameParts[1] ?? null;

            $orderMetrics = $this->computeOrderMetricsForEmail($email, $workspaceId);

            $existingCustomFields = is_array($existing?->custom_fields) ? $existing->custom_fields : [];
            $customFields = array_merge($existingCustomFields, [
                'order_count' => $orderMetrics['order_count'],
                'lifetime_value' => $orderMetrics['lifetime_value'],
                'last_order_at' => $orderMetrics['last_order_at'],
                'purchased_product_ids' => $orderMetrics['purchased_product_ids'],
                'purchased_product_names' => $orderMetrics['purchased_product_names'],
            ]);

            $shippingCountry = is_array($order->metadata)
                ? ($order->metadata['country'] ?? null)
                : null;

            $payload = [
                'workspace_id' => $workspaceId,
                'email' => $email,
                'first_name' => $firstName ?: $existing?->first_name,
                'last_name' => $lastName ?: $existing?->last_name,
                'phone_e164' => $order->customer_phone ?: ($existing?->phone_e164 ?? $orderMetrics['phone_e164']),
                'country' => $shippingCountry ? strtoupper(substr((string) $shippingCountry, 0, 2)) : $existing?->country,
                'source' => $existing?->source ?: 'ecommerce_checkout',
                'custom_fields' => $customFields,
            ];

            if (! $existing) {
                $payload['opt_in_email'] = true;
                $payload['opt_in_whatsapp'] = ! empty($payload['phone_e164']);
                $payload['opt_in_sms'] = ! empty($payload['phone_e164']);
                $contact = Contact::create($payload);
            } else {
                if ($existing->trashed()) {
                    $existing->restore();
                }
                $existing->update($payload);
                $contact = $existing;
            }

            $this->syncLifecycleTags($workspaceId, $contact, $customFields);

            return $contact;
        } catch (\Throwable $e) {
            Log::warning('PlatformAudienceSyncService::syncWorkspaceOrderBuyer failed', [
                'workspace_id' => $workspaceId,
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Seed default dynamic segments for a tenant workspace.
     */
    public function ensureWorkspaceDefaultSegments(int $workspaceId): void
    {
        $defaults = [
            [
                'name' => 'All Product Buyers',
                'type' => 'dynamic',
                'rules_json' => [
                    'combinator' => 'AND',
                    'conditions' => [
                        ['field' => 'order_count', 'operator' => '>=', 'value' => '1'],
                    ],
                ],
            ],
            [
                'name' => 'High-Value Customers (VIP)',
                'type' => 'dynamic',
                'rules_json' => [
                    'combinator' => 'AND',
                    'conditions' => [
                        ['field' => 'lifetime_value', 'operator' => '>=', 'value' => (string) $this->vipThreshold()],
                    ],
                ],
            ],
            [
                'name' => 'Leads & Contacts (Never Purchased)',
                'type' => 'dynamic',
                'rules_json' => [
                    'combinator' => 'AND',
                    'conditions' => [
                        ['field' => 'order_count', 'operator' => '=', 'value' => '0'],
                    ],
                ],
            ],
        ];

        foreach ($defaults as $def) {
            Segment::firstOrCreate(
                ['workspace_id' => $workspaceId, 'name' => $def['name']],
                [
                    'type' => $def['type'],
                    'rules_json' => $def['rules_json'],
                    'contact_count' => 0,
                ]
            );
        }
    }

    /**
     * Compute order count, LTV, latest order timestamp, and purchased product IDs/names for an email.
     * When $workspaceId is provided, strictly scopes orders to that tenant workspace.
     *
     * @return array{order_count: int, lifetime_value: float, last_order_at: ?string, purchased_product_ids: list<int>, purchased_product_names: list<string>, phone_e164: ?string}
     */
    private function computeOrderMetricsForEmail(string $email, ?int $workspaceId = null): array
    {
        $orders = EcommerceOrder::query()
            ->when($workspaceId !== null, fn ($q) => $q->where('workspace_id', $workspaceId))
            ->where(function ($q) {
                $q->whereIn('payment_status', ['paid', 'completed'])
                    ->orWhere('financial_status', 'paid')
                    ->orWhereNotNull('paid_at');
            })
            ->whereRaw('LOWER(customer_email) = ?', [$email])
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->get(['id', 'total', 'customer_phone', 'line_items', 'paid_at', 'created_at']);

        if ($orders->isEmpty()) {
            return [
                'order_count' => 0,
                'lifetime_value' => 0.0,
                'last_order_at' => null,
                'purchased_product_ids' => [],
                'purchased_product_names' => [],
                'phone_e164' => null,
            ];
        }

        $productIds = [];
        $productNames = [];

        foreach ($orders as $order) {
            $lineItems = is_array($order->line_items) ? $order->line_items : [];
            foreach ($lineItems as $item) {
                if (! is_array($item)) {
                    continue;
                }
                $pid = $item['product_id'] ?? $item['id'] ?? null;
                if ($pid !== null && is_numeric($pid) && (int) $pid > 0) {
                    $productIds[] = (int) $pid;
                }
                $pname = trim((string) ($item['name'] ?? $item['title'] ?? ''));
                if ($pname !== '') {
                    $productNames[] = $pname;
                }
            }
        }

        $productIds = array_values(array_unique($productIds));
        $productNames = array_values(array_unique($productNames));

        $latestOrder = $orders->first();
        $lastOrderAt = ($latestOrder->paid_at ?? $latestOrder->created_at)?->toIso8601String();
        $phone = $orders->pluck('customer_phone')->filter()->first();

        return [
            'order_count' => $orders->count(),
            'lifetime_value' => round((float) $orders->sum('total'), 2),
            'last_order_at' => $lastOrderAt,
            'purchased_product_ids' => $productIds,
            'purchased_product_names' => $productNames,
            'phone_e164' => $phone ?: null,
        ];
    }

    /**
     * Attach/detach canonical lifecycle tags on the contact in the Platform Marketing Workspace.
     */
    private function syncLifecycleTags(int $workspaceId, Contact $contact, array $customFields): void
    {
        $desiredTags = [];

        if (! empty($customFields['is_registered_user'])) {
            $desiredTags[] = ['name' => 'Registered User', 'color' => '#3b82f6'];
        }
        if (! empty($customFields['email_verified'])) {
            $desiredTags[] = ['name' => 'Verified User', 'color' => '#10b981'];
        }
        if (in_array($customFields['subscription_status'] ?? 'none', ['active', 'trialing'], true)) {
            $desiredTags[] = ['name' => 'Active Subscriber', 'color' => '#8b5cf6'];
        }
        if (! empty($customFields['is_affiliate'])) {
            $desiredTags[] = ['name' => 'Affiliate', 'color' => '#f59e0b'];
        }
        if (($customFields['order_count'] ?? 0) > 0) {
            $desiredTags[] = ['name' => 'Product Buyer', 'color' => '#ec4899'];
        }
        if (($customFields['lifetime_value'] ?? 0) >= $this->vipThreshold()) {
            $desiredTags[] = ['name' => 'VIP Customer', 'color' => '#eab308'];
        }

        $tagIds = [];
        foreach ($desiredTags as $tagDef) {
            $tag = ContactTag::firstOrCreate(
                ['workspace_id' => $workspaceId, 'name' => $tagDef['name']],
                ['color' => $tagDef['color']]
            );
            $tagIds[] = $tag->id;
        }

        if (! empty($tagIds)) {
            $contact->tags()->syncWithoutDetaching($tagIds);
        }
    }

    /**
     * Seed canonical dynamic segments in the Platform Marketing Workspace if they don't exist yet.
     */
    public function ensureDefaultSegments(int $workspaceId): void
    {
        $defaults = [
            [
                'name' => 'All Registered Users',
                'type' => 'dynamic',
                'rules_json' => [
                    'combinator' => 'AND',
                    'conditions' => [
                        ['field' => 'is_registered_user', 'operator' => '=', 'value' => '1'],
                    ],
                ],
            ],
            [
                'name' => 'Verified Users',
                'type' => 'dynamic',
                'rules_json' => [
                    'combinator' => 'AND',
                    'conditions' => [
                        ['field' => 'email_verified', 'operator' => '=', 'value' => '1'],
                    ],
                ],
            ],
            [
                'name' => 'Active Subscribers',
                'type' => 'dynamic',
                'rules_json' => [
                    'combinator' => 'AND',
                    'conditions' => [
                        ['field' => 'subscription_status', 'operator' => '=', 'value' => 'active'],
                    ],
                ],
            ],
            [
                'name' => 'All Product Buyers',
                'type' => 'dynamic',
                'rules_json' => [
                    'combinator' => 'AND',
                    'conditions' => [
                        ['field' => 'order_count', 'operator' => '>=', 'value' => '1'],
                    ],
                ],
            ],
            [
                'name' => 'High-Value Customers (VIP)',
                'type' => 'dynamic',
                'rules_json' => [
                    'combinator' => 'AND',
                    'conditions' => [
                        ['field' => 'lifetime_value', 'operator' => '>=', 'value' => (string) $this->vipThreshold()],
                    ],
                ],
            ],
            [
                'name' => 'Inactive Registered Users (Never Purchased)',
                'type' => 'dynamic',
                'rules_json' => [
                    'combinator' => 'AND',
                    'conditions' => [
                        ['field' => 'is_registered_user', 'operator' => '=', 'value' => '1'],
                        ['field' => 'order_count', 'operator' => '=', 'value' => '0'],
                    ],
                ],
            ],
        ];

        foreach ($defaults as $def) {
            Segment::firstOrCreate(
                ['workspace_id' => $workspaceId, 'name' => $def['name']],
                [
                    'type' => $def['type'],
                    'rules_json' => $def['rules_json'],
                    'contact_count' => 0,
                ]
            );
        }
    }
}

