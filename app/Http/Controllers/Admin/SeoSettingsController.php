<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Seo\SitemapController;
use App\Models\Redirect;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SeoSettingsController extends Controller
{
    /**
     * Display the SEO & Tracking settings page.
     */
    public function index(): Response
    {
        $settings = [
            'seo_site_title_suffix' => SystemSetting::get('seo_site_title_suffix', '— BotifyAI'),
            'seo_default_meta_description' => SystemSetting::get('seo_default_meta_description', ''),
            'seo_default_meta_keywords' => SystemSetting::get('seo_default_meta_keywords', ''),
            'seo_google_analytics_id' => SystemSetting::get('seo_google_analytics_id', ''),
            'seo_google_tag_manager_id' => SystemSetting::get('seo_google_tag_manager_id', ''),
            'seo_clarity_project_id' => SystemSetting::get('seo_clarity_project_id', 'yky6jsr41d'),
            'seo_meta_pixel_id' => SystemSetting::get('seo_meta_pixel_id', ''),
            'seo_tiktok_pixel_id' => SystemSetting::get('seo_tiktok_pixel_id', ''),
            'seo_linkedin_partner_id' => SystemSetting::get('seo_linkedin_partner_id', ''),
            'seo_google_verification_code' => SystemSetting::get('seo_google_verification_code', ''),
            'seo_bing_verification_code' => SystemSetting::get('seo_bing_verification_code', ''),
            'seo_yandex_verification_code' => SystemSetting::get('seo_yandex_verification_code', ''),
            'seo_pinterest_verification_code' => SystemSetting::get('seo_pinterest_verification_code', ''),
            'seo_custom_head_scripts' => SystemSetting::get('seo_custom_head_scripts', ''),
            'seo_custom_body_scripts' => SystemSetting::get('seo_custom_body_scripts', ''),
        ];

        $redirects = [];
        try {
            $redirects = Redirect::latest()->get();
        } catch (\Throwable) {
            // Table may not exist yet
        }

        return Inertia::render('Admin/SeoSettings', [
            'settings' => $settings,
            'redirects' => $redirects,
            'sitemapUrls' => [
                'index' => route('sitemap'),
                'pages' => route('sitemap.pages'),
                'cms' => route('sitemap.cms'),
                'stores' => route('sitemap.stores'),
                'products' => route('sitemap.products'),
            ],
            'robotsUrl' => route('robots'),
        ]);
    }

    /**
     * Update global SEO & Tracking settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'seo_site_title_suffix' => ['nullable', 'string', 'max:100'],
            'seo_default_meta_description' => ['nullable', 'string', 'max:500'],
            'seo_default_meta_keywords' => ['nullable', 'string', 'max:500'],
            'seo_google_analytics_id' => ['nullable', 'string', 'max:50'],
            'seo_google_tag_manager_id' => ['nullable', 'string', 'max:50'],
            'seo_clarity_project_id' => ['nullable', 'string', 'max:50'],
            'seo_meta_pixel_id' => ['nullable', 'string', 'max:50'],
            'seo_tiktok_pixel_id' => ['nullable', 'string', 'max:50'],
            'seo_linkedin_partner_id' => ['nullable', 'string', 'max:50'],
            'seo_google_verification_code' => ['nullable', 'string', 'max:255'],
            'seo_bing_verification_code' => ['nullable', 'string', 'max:255'],
            'seo_yandex_verification_code' => ['nullable', 'string', 'max:255'],
            'seo_pinterest_verification_code' => ['nullable', 'string', 'max:255'],
            'seo_custom_head_scripts' => ['nullable', 'string'],
            'seo_custom_body_scripts' => ['nullable', 'string'],
        ]);

        foreach ($validated as $key => $value) {
            SystemSetting::set($key, $value ?? '');
        }

        return back()->with('success', 'SEO & Analytics tracking settings updated successfully.');
    }

    /**
     * Clear all cached sitemaps.
     */
    public function clearSitemapCache(): RedirectResponse
    {
        SitemapController::clearCache();

        return back()->with('success', 'XML Sitemap cache has been purged and regenerated.');
    }

    /**
     * Store a new 301/302 redirect.
     */
    public function storeRedirect(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'source_path' => ['required', 'string', 'max:255', 'unique:redirects,source_path'],
            'target_url' => ['required', 'string', 'max:255'],
            'status_code' => ['required', 'in:301,302'],
            'is_active' => ['boolean'],
        ]);

        Redirect::create([
            'source_path' => $validated['source_path'],
            'target_url' => $validated['target_url'],
            'status_code' => (int) $validated['status_code'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Redirect created successfully.');
    }

    /**
     * Update an existing redirect.
     */
    public function updateRedirect(Request $request, Redirect $redirect): RedirectResponse
    {
        $validated = $request->validate([
            'source_path' => ['required', 'string', 'max:255', 'unique:redirects,source_path,'.$redirect->id],
            'target_url' => ['required', 'string', 'max:255'],
            'status_code' => ['required', 'in:301,302'],
            'is_active' => ['boolean'],
        ]);

        $redirect->update([
            'source_path' => $validated['source_path'],
            'target_url' => $validated['target_url'],
            'status_code' => (int) $validated['status_code'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Redirect updated successfully.');
    }

    /**
     * Delete a redirect.
     */
    public function destroyRedirect(Redirect $redirect): RedirectResponse
    {
        $redirect->delete();

        return back()->with('success', 'Redirect deleted successfully.');
    }
}

