<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AI\Models\AiChatbot;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Ecommerce\Models\MerchantBankAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StoreWizardController extends Controller
{
    /**
     * Show the store creation wizard.
     */
    public function create(Request $request): Response
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);

        $bankAccounts = MerchantBankAccount::where('workspace_id', $workspaceId)
            ->orderByDesc('is_default')
            ->get(['id', 'bank_name', 'account_number', 'account_name', 'is_default']);

        $bots = AiChatbot::where('workspace_id', $workspaceId)
            ->get(['id', 'name', 'purpose', 'enabled', 'is_default']);

        return Inertia::render('Ecommerce/Stores/Wizard', [
            'store' => null,
            'bankAccounts' => $bankAccounts,
            'bots' => $bots,
            'isNew' => true,
        ]);
    }

    /**
     * Show the store wizard for an existing store.
     */
    public function edit(Request $request, EcommerceStore $store): Response
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
        abort_unless($store->workspace_id === $workspaceId, 403);

        $bankAccounts = MerchantBankAccount::where('workspace_id', $workspaceId)
            ->orderByDesc('is_default')
            ->get(['id', 'bank_name', 'account_number', 'account_name', 'is_default']);

        $bots = AiChatbot::where('workspace_id', $workspaceId)
            ->get(['id', 'name', 'purpose', 'enabled', 'is_default']);

        $storeBots = $store->bots()->pluck('ai_chatbots.id')->all();

        return Inertia::render('Ecommerce/Stores/Wizard', [
            'store' => [
                'id' => $store->id,
                'uuid' => $store->uuid,
                'name' => $store->name,
                'slug' => $store->slug,
                'platform' => $store->platform,
                'currency' => $store->currency ?: 'NGN',
                'support_email' => $store->support_email,
                'support_phone' => $store->support_phone,
                'brand_color' => $store->brand_color ?: '#0D9488',
                'logo_url' => $store->logo_url,
                'banner_url' => $store->banner_url,
                'description' => $store->description,
                'status' => $store->status,
                'is_published' => $store->isPublished(),
                'bank_account_id' => $store->bank_account_id,
                'seo_meta' => $store->seo_meta ?? [
                    'meta_title' => '',
                    'meta_description' => '',
                    'keywords' => '',
                    'og_image' => '',
                ],
                'marketing_pixels' => $store->marketing_pixels ?? [
                    'meta_pixel_id' => '',
                    'meta_capi_token' => '',
                    'tiktok_pixel_id' => '',
                    'tiktok_access_token' => '',
                    'ga4_measurement_id' => '',
                    'gtm_container_id' => '',
                    'clarity_project_id' => '',
                ],
                'policies' => $store->policies ?? [
                    'refund_policy' => '',
                    'privacy_policy' => '',
                    'terms_of_service' => '',
                    'delivery_terms' => '',
                ],
                'connected_bot_ids' => $storeBots,
            ],
            'bankAccounts' => $bankAccounts,
            'bots' => $bots,
            'isNew' => false,
        ]);
    }

    /**
     * Save/update the store from the wizard.
     */
    public function save(Request $request, ?EcommerceStore $store = null): RedirectResponse
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);

        if ($store) {
            abort_unless($store->workspace_id === $workspaceId, 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:100'],
            'currency' => ['nullable', 'string', 'max:10'],
            'support_email' => ['nullable', 'email', 'max:120'],
            'support_phone' => ['nullable', 'string', 'max:30'],
            'brand_color' => ['nullable', 'string', 'max:20'],
            'logo_url' => ['nullable', 'string', 'max:500'],
            'banner_url' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:1000'],
            'bank_account_id' => ['nullable', 'exists:merchant_bank_accounts,id'],
            'seo_meta' => ['nullable', 'array'],
            'marketing_pixels' => ['nullable', 'array'],
            'policies' => ['nullable', 'array'],
            'connected_bot_ids' => ['nullable', 'array'],
            'connected_bot_ids.*' => ['exists:ai_chatbots,id'],
        ]);

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']) . '-' . Str::random(5);

        if (! $store) {
            $store = new EcommerceStore();
            $store->workspace_id = $workspaceId;
            $store->platform = 'native';
            $store->domain = 'native';
            $store->status = 'connected';
            $store->uuid = (string) Str::uuid();
        }

        $store->name = $validated['name'];
        $store->slug = $slug;
        $store->currency = $validated['currency'] ?? 'NGN';
        $store->support_email = $validated['support_email'] ?? null;
        $store->support_phone = $validated['support_phone'] ?? null;
        $store->brand_color = $validated['brand_color'] ?? '#0D9488';
        $store->logo_url = $validated['logo_url'] ?? null;
        $store->banner_url = $validated['banner_url'] ?? null;
        $store->description = $validated['description'] ?? null;
        $store->bank_account_id = $validated['bank_account_id'] ?? null;
        $store->seo_meta = $validated['seo_meta'] ?? [];
        $store->marketing_pixels = $validated['marketing_pixels'] ?? [];
        $store->policies = $validated['policies'] ?? [];
        $store->save();

        // Sync bots
        if (isset($validated['connected_bot_ids'])) {
            $syncData = [];
            foreach ($validated['connected_bot_ids'] as $index => $botId) {
                $syncData[$botId] = [
                    'is_store_default' => ($index === 0),
                    'enable_catalog_search' => true,
                    'enable_cart_creation' => true,
                    'enable_order_tracking' => true,
                ];
            }
            $store->bots()->sync($syncData);
        }

        return redirect()->route('client.ecommerce.stores.index', ['storeUuid' => $store->uuid])
            ->with('success', "Store '{$store->name}' configuration saved successfully!");
    }

    /**
     * Publish the store to make it live.
     */
    public function publish(Request $request, EcommerceStore $store): RedirectResponse
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
        abort_unless($store->workspace_id === $workspaceId, 403);

        $store->status = 'connected';
        $store->published_at = now();
        $store->save();

        return back()->with('success', "Store '{$store->name}' is now live and published!");
    }
}

