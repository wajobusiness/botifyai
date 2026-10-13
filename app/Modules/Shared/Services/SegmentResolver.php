<?php

namespace App\Modules\Shared\Services;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\Segment;
use App\Services\Marketing\PlatformAudienceSyncService;
use Illuminate\Database\Eloquent\Builder;

class SegmentResolver
{
    private const ALLOWED_FIELDS = [
        'phone_e164', 'email', 'first_name', 'last_name',
        'country', 'language', 'source',
        'opt_in_whatsapp', 'opt_in_sms', 'opt_in_email',
        'created_at', 'last_seen_at',
        // Enriched platform & commerce fields
        'is_registered_user', 'email_verified',
        'subscription_status', 'plan_id',
        'purchased_product_id', 'order_count',
        'lifetime_value', 'last_order_at',
        'tag_id', 'affiliate_status',
    ];

    private const OPERATORS = ['=', '!=', 'like', 'not_like', '<', '>', '<=', '>=', 'is_null', 'is_not_null'];

    /** Build a query for all contacts matching the segment rules. */
    public function query(Segment $segment): Builder
    {
        $query = Contact::where('workspace_id', $segment->workspace_id);

        if ($segment->type === 'static') {
            return $query->whereHas('segments', fn ($q) => $q->where('segments.id', $segment->id));
        }

        $rules = $segment->rules_json ?? [];
        $this->applyRules($query, $rules);

        return $query;
    }

    /**
     * Build a query for a named preset audience cohort within a workspace.
     */
    public function presetQuery(int $workspaceId, string $preset, ?string $ref = null): Builder
    {
        $query = Contact::where('workspace_id', $workspaceId);

        return match ($preset) {
            'all_users', 'contact_list' => $query,

            'only_registered_users' => $query->where(function (Builder $q) {
                $q->whereNotNull('user_id')
                    ->orWhere('custom_fields->is_registered_user', true)
                    ->orWhere('custom_fields->is_registered_user', '1');
            }),

            'verified_users' => $query->where(function (Builder $q) {
                $q->whereHas('user', fn (Builder $uq) => $uq->whereNotNull('email_verified_at'))
                    ->orWhere('custom_fields->email_verified', true)
                    ->orWhere('custom_fields->email_verified', '1');
            }),

            'only_buyers' => $query->where(function (Builder $q) {
                $q->whereRaw('CAST(COALESCE(json_extract(custom_fields, "$.order_count"), 0) AS INTEGER) >= 1')
                    ->orWhereIn('email', EcommerceOrder::where('payment_status', 'paid')->whereNotNull('customer_email')->select('customer_email'));
            }),

            'only_subscribers' => $query->where(function (Builder $q) {
                $q->whereIn('custom_fields->subscription_status', ['active', 'trialing', 'past_due', 'canceled', 'expired'])
                    ->orWhereHas('user.subscriptions');
            }),

            'only_active_subscribers' => $query->where(function (Builder $q) {
                $q->whereIn('custom_fields->subscription_status', ['active', 'trialing'])
                    ->orWhereHas('user.activeSubscription');
            }),

            'product_buyers' => $this->applyProductBuyerConstraint($query, $ref),

            'inactive_users' => $query->where(function (Builder $q) {
                $q->whereNotNull('user_id')
                    ->orWhere('custom_fields->is_registered_user', true);
            })->where(function (Builder $q) {
                $q->whereNull('custom_fields->order_count')
                    ->orWhereRaw('CAST(COALESCE(json_extract(custom_fields, "$.order_count"), 0) AS INTEGER) = 0');
            })->whereNotIn(
                'email',
                EcommerceOrder::where('payment_status', 'paid')->whereNotNull('customer_email')->select('customer_email')
            ),

            'high_value_customers' => $this->applyHighValueConstraint($query, $ref),

            'recent_customers' => $this->applyRecentCustomerConstraint($query, $ref),

            'affiliates' => $query->where(function (Builder $q) {
                $q->where('custom_fields->is_affiliate', true)
                    ->orWhereIn('custom_fields->affiliate_status', ['active', 'comped'])
                    ->orWhereHas('user', fn (Builder $uq) => $uq->whereIn('affiliate_status', ['active', 'comped'])->orWhere('active_role', 'affiliate'));
            }),

            'selected_contacts' => $this->applySelectedContactsConstraint($query, $ref),

            default => $query->whereRaw('1 = 0'),
        };
    }

    /** Materialise a dynamic segment into segment_contact pivot. */
    public function materialise(Segment $segment): int
    {
        if ($segment->type !== 'dynamic') {
            return 0;
        }

        $ids = $this->query($segment)->pluck('id');
        $segment->contacts()->sync($ids);
        $segment->update(['contact_count' => $ids->count()]);

        return $ids->count();
    }

    public function applyRules(Builder $query, array $rules): void
    {
        $combinator = strtoupper($rules['combinator'] ?? 'AND');

        $query->where(function (Builder $groupQuery) use ($rules, $combinator) {
            foreach ($rules['conditions'] ?? [] as $condition) {
                $field = $condition['field'] ?? null;
                $operator = $condition['operator'] ?? '=';
                $value = $condition['value'] ?? null;

                if (! $field || ! in_array($field, self::ALLOWED_FIELDS, true)) {
                    continue;
                }
                if (! in_array($operator, self::OPERATORS, true)) {
                    continue;
                }

                $method = $combinator === 'OR' ? 'orWhere' : 'where';

                $groupQuery->{$method}(function (Builder $sub) use ($field, $operator, $value) {
                    $this->applySingleCondition($sub, $field, $operator, $value);
                });
            }
        });
    }

    private function applySingleCondition(Builder $query, string $field, string $operator, mixed $value): void
    {
        switch ($field) {
            case 'is_registered_user':
                $boolVal = in_array(strtolower((string) $value), ['1', 'true', 'yes'], true);
                if (($operator === '=' && $boolVal) || ($operator === '!=' && ! $boolVal)) {
                    $query->whereNotNull('user_id')
                        ->orWhere('custom_fields->is_registered_user', true)
                        ->orWhere('custom_fields->is_registered_user', '1');
                } else {
                    $query->whereNull('user_id')
                        ->where(function (Builder $q) {
                            $q->whereNull('custom_fields->is_registered_user')
                                ->orWhere('custom_fields->is_registered_user', false)
                                ->orWhere('custom_fields->is_registered_user', '0');
                        });
                }
                return;

            case 'email_verified':
                $boolVal = in_array(strtolower((string) $value), ['1', 'true', 'yes'], true);
                if (($operator === '=' && $boolVal) || ($operator === '!=' && ! $boolVal)) {
                    $query->whereHas('user', fn (Builder $uq) => $uq->whereNotNull('email_verified_at'))
                        ->orWhere('custom_fields->email_verified', true)
                        ->orWhere('custom_fields->email_verified', '1');
                } else {
                    $query->where(function (Builder $q) {
                        $q->whereDoesntHave('user', fn (Builder $uq) => $uq->whereNotNull('email_verified_at'))
                            ->where(function (Builder $sq) {
                                $sq->whereNull('custom_fields->email_verified')
                                    ->orWhere('custom_fields->email_verified', false);
                            });
                    });
                }
                return;

            case 'subscription_status':
                if ($operator === '!=') {
                    $query->where(function (Builder $q) use ($value) {
                        $q->whereNull('custom_fields->subscription_status')
                            ->orWhere('custom_fields->subscription_status', '!=', (string) $value);
                    });
                } else {
                    $query->where('custom_fields->subscription_status', (string) $value);
                }
                return;

            case 'plan_id':
                $planId = (int) $value;
                if ($operator === '!=') {
                    $query->where('custom_fields->plan_id', '!=', $planId);
                } else {
                    $query->where(function (Builder $q) use ($planId) {
                        $q->where('custom_fields->plan_id', $planId)
                            ->orWhere('custom_fields->plan_id', (string) $planId)
                            ->orWhereHas('user.subscriptions', fn (Builder $sq) => $sq->where('plan_id', $planId)->whereIn('status', ['active', 'trialing']));
                    });
                }
                return;

            case 'purchased_product_id':
                $this->applyProductBuyerConstraint($query, (string) $value, $operator === '!=');
                return;

            case 'order_count':
                $numVal = (int) $value;
                if (in_array($operator, ['=', '!=', '<', '>', '<=', '>='], true)) {
                    $query->whereRaw(
                        "CAST(COALESCE(json_extract(custom_fields, '$.order_count'), 0) AS INTEGER) {$operator} ?",
                        [$numVal]
                    );
                }
                return;

            case 'lifetime_value':
                $floatVal = (float) $value;
                if (in_array($operator, ['=', '!=', '<', '>', '<=', '>='], true)) {
                    $query->whereRaw(
                        "CAST(COALESCE(json_extract(custom_fields, '$.lifetime_value'), 0) AS REAL) {$operator} ?",
                        [$floatVal]
                    );
                }
                return;

            case 'last_order_at':
                if ($operator === 'is_null') {
                    $query->whereNull('custom_fields->last_order_at');
                } elseif ($operator === 'is_not_null') {
                    $query->whereNotNull('custom_fields->last_order_at');
                } elseif (in_array($operator, ['<', '>', '<=', '>=', '='], true)) {
                    $query->where('custom_fields->last_order_at', $operator, (string) $value);
                }
                return;

            case 'tag_id':
                $tagId = (int) $value;
                if ($operator === '!=') {
                    $query->whereDoesntHave('tags', fn (Builder $tq) => $tq->where('contact_tags.id', $tagId));
                } else {
                    $query->whereHas('tags', fn (Builder $tq) => $tq->where('contact_tags.id', $tagId));
                }
                return;

            case 'affiliate_status':
                $query->where('custom_fields->affiliate_status', $operator === '!=' ? '!=' : '=', (string) $value);
                return;
        }

        match ($operator) {
            'is_null' => $query->whereNull($field),
            'is_not_null' => $query->whereNotNull($field),
            'like' => $query->where($field, 'like', '%'.$value.'%'),
            'not_like' => $query->where($field, 'not like', '%'.$value.'%'),
            default => $query->where($field, $operator, $value),
        };
    }

    private function applyProductBuyerConstraint(Builder $query, ?string $ref, bool $negate = false): Builder
    {
        $productIds = collect(explode(',', (string) $ref))
            ->map(fn ($v) => (int) trim($v))
            ->filter(fn ($v) => $v > 0)
            ->values()
            ->all();

        if (empty($productIds)) {
            return $negate ? $query : $query->whereRaw('1 = 0');
        }

        $buyerEmailsSubquery = EcommerceOrder::query()
            ->where('payment_status', 'paid')
            ->whereNotNull('customer_email')
            ->whereHas('items', fn (Builder $iq) => $iq->whereIn('product_id', $productIds))
            ->select('customer_email');

        if ($negate) {
            return $query->whereNotIn('email', $buyerEmailsSubquery);
        }

        return $query->where(function (Builder $q) use ($productIds, $buyerEmailsSubquery) {
            $q->whereIn('email', $buyerEmailsSubquery);
            foreach ($productIds as $pid) {
                $q->orWhereJsonContains('custom_fields->purchased_product_ids', $pid);
            }
        });
    }

    private function applyHighValueConstraint(Builder $query, ?string $ref): Builder
    {
        $threshold = is_numeric($ref) && (float) $ref > 0
            ? (float) $ref
            : app(PlatformAudienceSyncService::class)->vipThreshold();

        return $query->whereRaw(
            'CAST(COALESCE(json_extract(custom_fields, "$.lifetime_value"), 0) AS REAL) >= ?',
            [$threshold]
        );
    }

    private function applyRecentCustomerConstraint(Builder $query, ?string $ref): Builder
    {
        $days = is_numeric($ref) && (int) $ref > 0 ? (int) $ref : 30;
        $since = now()->subDays($days)->toIso8601String();

        return $query->where(function (Builder $q) use ($since, $days) {
            $q->where('custom_fields->last_order_at', '>=', $since)
                ->orWhereIn(
                    'email',
                    EcommerceOrder::where('payment_status', 'paid')
                        ->whereNotNull('customer_email')
                        ->where('created_at', '>=', now()->subDays($days))
                        ->select('customer_email')
                );
        });
    }

    private function applySelectedContactsConstraint(Builder $query, ?string $ref): Builder
    {
        $ids = collect(explode(',', (string) $ref))
            ->map(fn ($v) => (int) trim($v))
            ->filter(fn ($v) => $v > 0)
            ->values()
            ->all();

        if (empty($ids)) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('id', $ids);
    }
}

