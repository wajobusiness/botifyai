<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price_cents',
        'currency_code',
        'interval',
        'sort_order',
        'enabled',
        'monthly_price_cents',
        'yearly_price_cents',
        'trial_days',
        'stripe_monthly_id',
        'stripe_yearly_id',
        'paddle_monthly_id',
        'paddle_yearly_id',
        'features',
        'limits',
        'featured',
        'popular',
        'white_label_enabled',
    ];

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'sort_order' => 'integer',
            'enabled' => 'boolean',
            'monthly_price_cents' => 'integer',
            'yearly_price_cents' => 'integer',
            'trial_days' => 'integer',
            'features' => 'array',
            'limits' => 'array',
            'featured' => 'boolean',
            'popular' => 'boolean',
            'white_label_enabled' => 'boolean',
        ];
    }

    /**
     * Price in cents for the given billing cycle.
     */
    public function priceCentsForCycle(string $cycle): ?int
    {
        return match ($cycle) {
            'month' => $this->monthly_price_cents ?? $this->price_cents,
            'year' => $this->yearly_price_cents,
            default => null,
        };
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_code', 'code');
    }

    public function hasFeature(string $feature): bool
    {
        if ($feature === 'white_label') {
            if ($this->white_label_enabled) {
                return true;
            }
        }

        // 1. Check if boolean toggle is saved in limits JSON (where PlanController stores admin toggles)
        if (is_array($this->limits) && array_key_exists($feature, $this->limits)) {
            $val = $this->limits[$feature];
            if ($val !== null && $val !== '') {
                return (bool) $val;
            }
        }

        // 2. Check if feature is in features array (assoc map or list)
        if (is_array($this->features)) {
            if (array_key_exists($feature, $this->features)) {
                return (bool) $this->features[$feature];
            }
            if (in_array($feature, $this->features, true)) {
                return true;
            }
        }

        // 3. For any paid or Pro plan, default core capabilities to true so customers are not locked out
        $planSlug = strtolower((string) ($this->slug ?? ''));
        $planName = strtolower((string) ($this->name ?? ''));
        $isPaid = ($this->price_cents ?? 0) > 0
            || ($this->monthly_price_cents ?? 0) > 0
            || str_contains($planSlug, 'pro')
            || str_contains($planName, 'pro')
            || str_contains($planSlug, 'business')
            || str_contains($planName, 'business');

        if ($isPaid) {
            $paidAllowed = [
                'whatsapp_cloud_api',
                'whatsapp_linked_devices',
                'whatsapp_ai_replies',
                'whatsapp_broadcast_campaigns',
                'ai_chatbots',
                'ai_knowledge_hub',
                'ai_live_chat_widget',
                'shared_inbox',
                'human_agent_takeover',
                'broadcast_campaigns',
                'crm_contacts',
                'workflow_automations',
            ];

            if (in_array($feature, $paidAllowed, true)) {
                return true;
            }
        }

        return \App\Services\Entitlements\FeatureRegistry::getDefaultFeature($feature);
    }

    /**
     * Value from the plan's JSON limits column. Not named `limit` — that is the query builder.
     */
    public function limitValue(string $key): mixed
    {
        $limits = $this->limits;

        if (is_array($limits) && array_key_exists($key, $limits)) {
            $val = $limits[$key];
            return ($val === null || $val === '') ? null : (int) $val;
        }

        return \App\Services\Entitlements\FeatureRegistry::getDefaultLimit($key);
    }

    public function clientSubscriptions(): HasMany
    {
        return $this->hasMany(ClientSubscription::class, 'plan_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }
}
