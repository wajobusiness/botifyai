<?php

namespace App\Modules\Shared\Services;

use App\Models\Subscription;
use App\Models\User;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\Segment;
use App\Services\Marketing\PlatformAudienceSyncService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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

    private function hasUserIdColumn(): bool
    {
        try {
            return Schema::hasColumn('contacts', 'user_id');
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Cross-database SQL expression for extracting a numeric JSON field from custom_fields.
     */
    private function jsonNumericExpr(string $jsonKey, bool $decimal = false): string
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            $type = $decimal ? 'REAL' : 'INTEGER';

            return "CAST(COALESCE(json_extract(custom_fields, '$.{$jsonKey}'), 0) AS {$type})";
        }

        if ($driver === 'pgsql') {
            $type = $decimal ? 'numeric' : 'integer';

            return "COALESCE(NULLIF(custom_fields->>'{$jsonKey}', '')::{$type}, 0)";
        }

        // MySQL / MariaDB
        $type = $decimal ? 'DECIMAL(14,2)' : 'SIGNED';

        return "CAST(COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(custom_fields, '$.{$jsonKey}')), 'null'), '0') AS {$type})";
    }

    private function paidOrdersEmailQuery(): Builder
    {
        return EcommerceOrder::query()
            ->where(function (Builder $q) {
                $q->whereIn('payment_status', ['paid', 'completed'])
                    ->orWhere('financial_status', 'paid')
                    ->orWhereNotNull('paid_at');
            })
            ->whereNotNull('customer_email')
            ->select('customer_email');
    }

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
        $hasUserId = $this->hasUserIdColumn();
        $orderCountExpr = $this->jsonNumericExpr('order_count', false);

        return match ($preset) {
            'all_users', 'contact_list' => $query,

            'only_registered_users' => $query->where(function (Builder $q) use ($hasUserId) {
                if ($hasUserId) {
                    $q->whereNotNull('user_id');
                }
                $q->orWhere('custom_fields->is_registered_user', true)
                    ->orWhere('custom_fields->is_registered_user', '1')
                    ->orWhereIn('email', User::whereNotNull('email')->select('email'));
            }),

            'verified_users' => $query->where(function (Builder $q) use ($hasUserId) {
                if ($hasUserId) {
                    $q->whereHas('user', fn (Builder $uq) => $uq->whereNotNull('email_verified_at'));
                }
                $q->orWhere('custom_fields->email_verified', true)
                    ->orWhere('custom_fields->email_verified', '1')
                    ->orWhereIn('email', User::whereNotNull('email_verified_at')->whereNotNull('email')->select('email'));
            }),

            'only_buyers' => $query->where(function (Builder $q) use ($orderCountExpr) {
                $q->whereRaw("{$orderCountExpr} >= 1")
                    ->orWhereIn('email', $this->paidOrdersEmailQuery());
            }),

            'only_subscribers' => $query->where(function (Builder $q) use ($hasUserId) {
                $q->whereIn('custom_fields->subscription_status', ['active', 'trialing', 'past_due', 'canceled', 'expired']);
                if ($hasUserId) {
                    $q->orWhereHas('user.subscriptions');
                }
            }),

            'only_active_subscribers' => $query->where(function (Builder $q) use ($hasUserId) {
                $q->whereIn('custom_fields->subscription_status', ['active', 'trialing']);
                if ($hasUserId) {
                    $q->orWhereHas('user.activeSubscription');
                }
            }),

            'product_buyers' => $this->applyProductBuyerConstraint($query, $ref),

            'inactive_users' => $query->where(function (Builder $q) use ($hasUserId) {
                if ($hasUserId) {
                    $q->whereNotNull('user_id');
                }
                $q->orWhere('custom_fields->is_registered_user', true)
                    ->orWhere('custom_fields->is_registered_user', '1');
            })->where(function (Builder $q) use ($orderCountExpr) {
                $q->whereNull('custom_fields->order_count')
                    ->orWhereRaw("{$orderCountExpr} = 0");
            })->whereNotIn('email', $this->paidOrdersEmailQuery()),

            'high_value_customers' => $this->applyHighValueConstraint($query, $ref),

            'recent_customers' => $this->applyRecentCustomerConstraint($query, $ref),

            'affiliates' => $query->where(function (Builder $q) use ($hasUserId) {
                $q->where('custom_fields->is_affiliate', true)
                    ->orWhereIn('custom_fields->affiliate_status', ['active', 'comped']);
                if ($hasUserId) {
                    $q->orWhereHas('user', fn (Builder $uq) => $uq->whereIn('affiliate_status', ['active', 'comped'])->orWhere('active_role', 'affiliate'));
                }
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
        $hasUserId = $this->hasUserIdColumn();

        switch ($field) {
            case 'is_registered_user':
                $boolVal = in_array(strtolower((string) $value), ['1', 'true', 'yes'], true);
                if (($operator === '=' && $boolVal) || ($operator === '!=' && ! $boolVal)) {
                    if ($hasUserId) {
                        $query->whereNotNull('user_id');
                    }
                    $query->orWhere('custom_fields->is_registered_user', true)
                        ->orWhere('custom_fields->is_registered_user', '1');
                } else {
                    if ($hasUserId) {
                        $query->whereNull('user_id');
                    }
                    $query->where(function (Builder $q) {
                        $q->whereNull('custom_fields->is_registered_user')
                            ->orWhere('custom_fields->is_registered_user', false)
                            ->orWhere('custom_fields->is_registered_user', '0');
                    });
                }
                return;

            case 'email_verified':
                $boolVal = in_array(strtolower((string) $value), ['1', 'true', 'yes'], true);
                if (($operator === '=' && $boolVal) || ($operator === '!=' && ! $boolVal)) {
                    if ($hasUserId) {
                        $query->whereHas('user', fn (Builder $uq) => $uq->whereNotNull('email_verified_at'));
                    }
                    $query->orWhere('custom_fields->email_verified', true)
                        ->orWhere('custom_fields->email_verified', '1');
                } else {
                    $query->where(function (Builder $q) use ($hasUserId) {
                        if ($hasUserId) {
                            $q->whereDoesntHave('user', fn (Builder $uq) => $uq->whereNotNull('email_verified_at'));
                        }
                        $q->where(function (Builder $sq) {
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
                    $query->where(function (Builder $q) use ($planId, $hasUserId) {
                        $q->where('custom_fields->plan_id', $planId)
                            ->orWhere('custom_fields->plan_id', (string) $planId);
                        if ($hasUserId) {
                            $q->orWhereHas('user.subscriptions', fn (Builder $sq) => $sq->where('plan_id', $planId)->whereIn('status', ['active', 'trialing']));
                        }
                    });
                }
                return;

            case 'purchased_product_id':
                $this->applyProductBuyerConstraint($query, (string) $value, $operator === '!=');
                return;

            case 'order_count':
                $numVal = (int) $value;
                if (in_array($operator, ['=', '!=', '<', '>', '<=', '>='], true)) {
                    $expr = $this->jsonNumericExpr('order_count', false);
                    $query->whereRaw("{$expr} {$operator} ?", [$numVal]);
                }
                return;

            case 'lifetime_value':
                $floatVal = (float) $value;
                if (in_array($operator, ['=', '!=', '<', '>', '<=', '>='], true)) {
                    $expr = $this->jsonNumericExpr('lifetime_value', true);
                    $query->whereRaw("{$expr} {$operator} ?", [$floatVal]);
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

        $matchedEmails = [];
        EcommerceOrder::query()
            ->where(function (Builder $q) {
                $q->whereIn('payment_status', ['paid', 'completed'])
                    ->orWhere('financial_status', 'paid')
                    ->orWhereNotNull('paid_at');
            })
            ->whereNotNull('customer_email')
            ->get(['customer_email', 'line_items'])
            ->each(function (EcommerceOrder $order) use ($productIds, &$matchedEmails) {
                foreach ((array) ($order->line_items ?? []) as $item) {
                    if (! is_array($item)) {
                        continue;
                    }
                    $pid = (int) ($item['product_id'] ?? $item['id'] ?? 0);
                    if (in_array($pid, $productIds, true)) {
                        $matchedEmails[] = strtolower(trim((string) $order->customer_email));
                        break;
                    }
                }
            });

        $matchedEmails = array_values(array_unique(array_filter($matchedEmails)));

        if ($negate) {
            if (! empty($matchedEmails)) {
                $query->whereNotIn('email', $matchedEmails);
            }
            foreach ($productIds as $pid) {
                $query->whereJsonDoesntContain('custom_fields->purchased_product_ids', $pid);
            }

            return $query;
        }

        return $query->where(function (Builder $q) use ($productIds, $matchedEmails) {
            if (! empty($matchedEmails)) {
                $q->whereIn('email', $matchedEmails);
            }
            foreach ($productIds as $pid) {
                $q->orWhereJsonContains('custom_fields->purchased_product_ids', $pid)
                    ->orWhereJsonContains('custom_fields->purchased_product_ids', (string) $pid);
            }
        });
    }

    private function applyHighValueConstraint(Builder $query, ?string $ref): Builder
    {
        $threshold = is_numeric($ref) && (float) $ref > 0
            ? (float) $ref
            : app(PlatformAudienceSyncService::class)->vipThreshold();

        $expr = $this->jsonNumericExpr('lifetime_value', true);

        return $query->whereRaw("{$expr} >= ?", [$threshold]);
    }

    private function applyRecentCustomerConstraint(Builder $query, ?string $ref): Builder
    {
        $days = is_numeric($ref) && (int) $ref > 0 ? (int) $ref : 30;
        $since = now()->subDays($days)->toIso8601String();

        return $query->where(function (Builder $q) use ($since, $days) {
            $q->where('custom_fields->last_order_at', '>=', $since)
                ->orWhereIn(
                    'email',
                    $this->paidOrdersEmailQuery()->where('created_at', '>=', now()->subDays($days))
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

