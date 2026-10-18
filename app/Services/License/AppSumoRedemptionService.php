<?php

namespace App\Services\License;

use App\Events\SubscriptionStarted;
use App\Models\AdminUser;
use App\Models\AppSumoLicense;
use App\Models\Client;
use App\Models\ClientSubscription;
use App\Models\LicenseEvent;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AppSumoRedemptionService
{
    public function __construct(
        protected AuditLogService $auditLog
    ) {}

    /**
     * Validate an AppSumo license code without modifying state.
     */
    public function validateCode(string $rawCode): array
    {
        $normalized = AppSumoLicense::normalizeCode($rawCode);
        $hash = AppSumoLicense::hashCode($rawCode);

        $license = AppSumoLicense::with('plan')
            ->where('code_hash', $hash)
            ->orWhere('code', $normalized)
            ->first();

        if (! $license) {
            return [
                'valid' => false,
                'error' => __('Invalid AppSumo license code. Please check and try again.'),
            ];
        }

        if (! $license->isAvailable()) {
            return [
                'valid' => false,
                'error' => __('This license code has already been redeemed or is inactive.'),
                'status' => $license->status,
                'redeemed_at' => $license->redeemed_at?->toIso8601String(),
            ];
        }

        $plan = $license->plan ?? $this->resolveFallbackPlan($license->tier);

        return [
            'valid' => true,
            'code' => $license->code,
            'tier' => $license->tier,
            'plan' => [
                'id' => $plan?->id,
                'name' => $plan?->name ?? ('AppSumo ' . ucfirst($license->tier)),
                'slug' => $plan?->slug,
                'features' => $plan?->features ?? [],
                'limits' => $plan?->limits ?? [],
            ],
        ];
    }

    /**
     * Atomically register a new user, organization, workspace, and redeem their AppSumo code.
     */
    public function redeemForNewUser(array $userData, string $rawCode, ?string $ip = null, ?string $userAgent = null): User
    {
        $normalized = AppSumoLicense::normalizeCode($rawCode);
        $hash = AppSumoLicense::hashCode($rawCode);

        return DB::transaction(function () use ($userData, $normalized, $hash, $ip, $userAgent) {
            /** @var AppSumoLicense|null $license */
            $license = AppSumoLicense::where('code_hash', $hash)
                ->orWhere('code', $normalized)
                ->lockForUpdate()
                ->first();

            if (! $license || ! $license->isAvailable()) {
                throw ValidationException::withMessages([
                    'code' => [__('The license code is invalid or has already been redeemed.')],
                ]);
            }

            // 1. Create Client (Organisation / Tenant boundary)
            $client = Client::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'status' => Client::STATUS_ACTIVE,
            ]);

            // 2. Create User as Tenant Administrator
            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'role' => User::ROLE_CLIENT,
                'status' => User::STATUS_ACTIVE,
                'client_id' => $client->id,
                'client_role' => User::CLIENT_ROLE_ADMINISTRATOR,
                'timezone' => $userData['timezone'] ?? 'UTC',
                'email_verified_at' => now(), // Lifetime deal buyers are instant-verified
            ]);

            // 3. Resolve the Plan to assign
            $plan = $license->plan ?? $this->resolveFallbackPlan($license->tier);

            // 4. Mark license as redeemed
            $license->update([
                'status' => AppSumoLicense::STATUS_REDEEMED,
                'redeemed_by' => $user->id,
                'client_id' => $client->id,
                'redeemed_at' => now(),
                'ip_address' => $ip,
                'metadata' => array_merge($license->metadata ?? [], [
                    'redeemed_via' => 'public_portal',
                    'user_email' => $user->email,
                    'user_name' => $user->name,
                ]),
            ]);

            // 5. Create user-level Lifetime Subscription
            $sub = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'status' => 'active',
                'billing_cycle' => 'lifetime',
                'starts_at' => now(),
                'ends_at' => null, // Lifetime: null ends_at
                'gateway' => 'appsumo',
                'gateway_subscription_id' => $license->code,
                'gateway_metadata' => [
                    'license_id' => $license->id,
                    'tier' => $license->tier,
                    'redeemed_at' => now()->toIso8601String(),
                ],
            ]);

            // 6. Create client-level Subscription (ensures Workspace limits apply immediately)
            $client->clientSubscriptions()->create([
                'plan_id' => $plan->id,
                'billing_cycle' => 'lifetime',
                'starts_at' => now(),
                'ends_at' => null,
                'status' => ClientSubscription::STATUS_ACTIVE,
            ]);

            // 7. Audit and Event Logging
            LicenseEvent::create([
                'license_id' => $license->id,
                'user_id' => $user->id,
                'event_type' => LicenseEvent::TYPE_REDEEMED,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'metadata' => [
                    'plan_id' => $plan->id,
                    'plan_name' => $plan->name,
                    'tier' => $license->tier,
                    'client_id' => $client->id,
                ],
            ]);

            $this->auditLog->log('appsumo.redeemed_new_account', $license, null, [
                'user_id' => $user->id,
                'client_id' => $client->id,
                'code' => $license->maskedCode(),
                'tier' => $license->tier,
                'plan_id' => $plan->id,
            ]);

            event(new Registered($user));
            SubscriptionStarted::dispatch($user, $sub, $plan);

            return $user;
        });
    }

    /**
     * Redeem or stack an AppSumo license into an existing authenticated account.
     */
    public function redeemForExistingUser(User $user, string $rawCode, ?string $ip = null, ?string $userAgent = null): array
    {
        $normalized = AppSumoLicense::normalizeCode($rawCode);
        $hash = AppSumoLicense::hashCode($rawCode);

        return DB::transaction(function () use ($user, $normalized, $hash, $ip, $userAgent) {
            /** @var AppSumoLicense|null $license */
            $license = AppSumoLicense::where('code_hash', $hash)
                ->orWhere('code', $normalized)
                ->lockForUpdate()
                ->first();

            if (! $license || ! $license->isAvailable()) {
                throw ValidationException::withMessages([
                    'code' => [__('The license code is invalid or has already been redeemed.')],
                ]);
            }

            $client = $user->client;
            if (! $client) {
                $client = Client::create([
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => Client::STATUS_ACTIVE,
                ]);
                $user->update(['client_id' => $client->id]);
            }

            // Count existing redeemed licenses for this client
            $existingLicenses = AppSumoLicense::where('client_id', $client->id)
                ->where('status', AppSumoLicense::STATUS_REDEEMED)
                ->get();

            $isStacking = $existingLicenses->isNotEmpty();
            $newStackCount = $existingLicenses->count() + 1;

            // Target Tier calculation:
            // If code has an explicit tier higher than current, or if stacking increases tier:
            $targetTierNumber = min(3, max($newStackCount, (int) filter_var($license->tier, FILTER_SANITIZE_NUMBER_INT) ?: 1));
            $targetTierSlug = 'appsumo-tier-' . $targetTierNumber;
            $plan = Plan::where('slug', $targetTierSlug)->first()
                ?? $license->plan
                ?? $this->resolveFallbackPlan('tier' . $targetTierNumber);

            // Mark license as redeemed
            $license->update([
                'status' => AppSumoLicense::STATUS_REDEEMED,
                'redeemed_by' => $user->id,
                'client_id' => $client->id,
                'redeemed_at' => now(),
                'ip_address' => $ip,
                'metadata' => array_merge($license->metadata ?? [], [
                    'redeemed_via' => $isStacking ? 'stacking' : 'existing_account',
                    'user_email' => $user->email,
                    'stack_level' => $targetTierNumber,
                ]),
            ]);

            // Update or create user Subscription
            $sub = Subscription::where('user_id', $user->id)->latest()->first();
            if ($sub && in_array($sub->status, ['active', 'trialing'], true)) {
                $sub->update([
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'billing_cycle' => 'lifetime',
                    'ends_at' => null,
                    'gateway' => 'appsumo',
                    'gateway_subscription_id' => $license->code,
                    'gateway_metadata' => array_merge($sub->gateway_metadata ?? [], [
                        'latest_license_id' => $license->id,
                        'stack_count' => $newStackCount,
                        'tier' => 'tier' . $targetTierNumber,
                    ]),
                ]);
            } else {
                $sub = Subscription::create([
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'billing_cycle' => 'lifetime',
                    'starts_at' => now(),
                    'ends_at' => null,
                    'gateway' => 'appsumo',
                    'gateway_subscription_id' => $license->code,
                    'gateway_metadata' => [
                        'license_id' => $license->id,
                        'tier' => 'tier' . $targetTierNumber,
                        'stack_count' => $newStackCount,
                    ],
                ]);
            }

            // Update client subscription
            $client->clientSubscriptions()->where('status', ClientSubscription::STATUS_ACTIVE)
                ->update(['status' => ClientSubscription::STATUS_CANCELLED, 'ends_at' => now()]);

            $client->clientSubscriptions()->create([
                'plan_id' => $plan->id,
                'billing_cycle' => 'lifetime',
                'starts_at' => now(),
                'ends_at' => null,
                'status' => ClientSubscription::STATUS_ACTIVE,
            ]);

            // Record event
            LicenseEvent::create([
                'license_id' => $license->id,
                'user_id' => $user->id,
                'event_type' => $isStacking ? LicenseEvent::TYPE_STACKED : LicenseEvent::TYPE_REDEEMED,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'metadata' => [
                    'plan_id' => $plan->id,
                    'plan_name' => $plan->name,
                    'stack_count' => $newStackCount,
                    'tier' => 'tier' . $targetTierNumber,
                ],
            ]);

            $this->auditLog->log('appsumo.redeemed_existing_account', $license, null, [
                'user_id' => $user->id,
                'client_id' => $client->id,
                'code' => $license->maskedCode(),
                'is_stacking' => $isStacking,
                'stack_level' => $targetTierNumber,
                'plan_id' => $plan->id,
            ]);

            return [
                'ok' => true,
                'is_stacking' => $isStacking,
                'stack_level' => $targetTierNumber,
                'plan_name' => $plan->name,
                'message' => $isStacking
                    ? __('License stacked successfully! Your account has been upgraded to :plan.', ['plan' => $plan->name])
                    : __('Lifetime access activated! Welcome to :plan.', ['plan' => $plan->name]),
            ];
        });
    }

    /**
     * Revoke or process a refund for an AppSumo license.
     */
    public function revokeLicense(AppSumoLicense $license, string $reason = 'refunded', ?AdminUser $admin = null): bool
    {
        return DB::transaction(function () use ($license, $reason, $admin) {
            $prevStatus = $license->status;
            $newStatus = ($reason === 'refunded') ? AppSumoLicense::STATUS_REFUNDED : AppSumoLicense::STATUS_REVOKED;

            $license->update([
                'status' => $newStatus,
            ]);

            LicenseEvent::create([
                'license_id' => $license->id,
                'user_id' => $license->redeemed_by,
                'event_type' => ($reason === 'refunded') ? LicenseEvent::TYPE_REFUNDED : LicenseEvent::TYPE_REVOKED,
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
                'metadata' => [
                    'reason' => $reason,
                    'admin_id' => $admin?->id,
                    'previous_status' => $prevStatus,
                ],
            ]);

            // If it was redeemed by a client, recalculate remaining licenses or downgrade to free Starter
            if ($license->client_id) {
                $remainingLicenses = AppSumoLicense::where('client_id', $license->client_id)
                    ->where('status', AppSumoLicense::STATUS_REDEEMED)
                    ->where('id', '!=', $license->id)
                    ->get();

                $client = Client::find($license->client_id);
                if ($client) {
                    if ($remainingLicenses->isEmpty()) {
                        // Cancel lifetime client subscriptions
                        $client->clientSubscriptions()
                            ->where('status', ClientSubscription::STATUS_ACTIVE)
                            ->update(['status' => ClientSubscription::STATUS_CANCELLED, 'ends_at' => now()]);

                        // Fallback to free Starter plan if available
                        $starter = Plan::where('slug', 'starter')->orWhere('price_cents', 0)->first();
                        if ($starter) {
                            $client->clientSubscriptions()->create([
                                'plan_id' => $starter->id,
                                'billing_cycle' => 'monthly',
                                'starts_at' => now(),
                                'status' => ClientSubscription::STATUS_ACTIVE,
                            ]);
                        }
                    } else {
                        // Re-evaluate stack tier
                        $newCount = min(3, $remainingLicenses->count());
                        $downgradePlan = Plan::where('slug', 'appsumo-tier-' . $newCount)->first();
                        if ($downgradePlan) {
                            $client->clientSubscriptions()->where('status', ClientSubscription::STATUS_ACTIVE)
                                ->update(['plan_id' => $downgradePlan->id]);
                        }
                    }
                }
            }

            if ($license->redeemed_by) {
                $sub = Subscription::where('user_id', $license->redeemed_by)
                    ->where('gateway', 'appsumo')
                    ->where('status', 'active')
                    ->first();
                if ($sub) {
                    $sub->update(['status' => 'canceled', 'ends_at' => now()]);
                }
            }

            $this->auditLog->logAdmin('appsumo.license_revoked', AppSumoLicense::class, $license->id, [
                'code' => $license->maskedCode(),
                'reason' => $reason,
                'admin_id' => $admin?->id,
            ]);

            return true;
        });
    }

    /**
     * Generate a batch of unique AppSumo codes and insert into the database.
     *
     * @return array{count: int, codes: array<string>}
     */
    public function generateBatch(string $tier, int $count, int $planId, string $prefix = 'BOTIFY'): array
    {
        $tier = strtolower(trim($tier));
        if (! str_starts_with($tier, 'tier')) {
            $tier = 'tier' . $tier;
        }

        $plan = Plan::findOrFail($planId);
        $generatedCodes = [];
        $rows = [];
        $now = now();

        for ($i = 0; $i < $count; $i++) {
            $code = $this->generateUniqueCode($prefix);
            $hash = AppSumoLicense::hashCode($code);

            $generatedCodes[] = $code;
            $rows[] = [
                'code' => $code,
                'code_hash' => $hash,
                'tier' => $tier,
                'plan_id' => $plan->id,
                'status' => AppSumoLicense::STATUS_UNREDEEMED,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($rows) >= 500) {
                AppSumoLicense::insert($rows);
                $rows = [];
            }
        }

        if (! empty($rows)) {
            AppSumoLicense::insert($rows);
        }

        return [
            'count' => count($generatedCodes),
            'codes' => $generatedCodes,
            'tier' => $tier,
            'plan_name' => $plan->name,
        ];
    }

    private function generateUniqueCode(string $prefix = 'BOTIFY'): string
    {
        $prefix = strtoupper(trim($prefix));
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous 0/O, 1/I

        do {
            $part1 = $this->randomString(4, $chars);
            $part2 = $this->randomString(4, $chars);
            $part3 = $this->randomString(4, $chars);
            $candidate = "{$prefix}-{$part1}-{$part2}-{$part3}";
            $hash = AppSumoLicense::hashCode($candidate);
        } while (AppSumoLicense::where('code_hash', $hash)->exists());

        return $candidate;
    }

    private function randomString(int $length, string $chars): string
    {
        $max = strlen($chars) - 1;
        $out = '';
        for ($i = 0; $i < $length; $i++) {
            $out .= $chars[random_int(0, $max)];
        }

        return $out;
    }

    private function resolveFallbackPlan(string $tier): Plan
    {
        $slug = 'appsumo-' . strtolower($tier);

        return Plan::where('slug', $slug)->first()
            ?? Plan::where('slug', 'pro')->first()
            ?? Plan::first();
    }
}

