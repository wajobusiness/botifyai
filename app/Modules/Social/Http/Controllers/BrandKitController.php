<?php

namespace App\Modules\Social\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Workspace;
use App\Modules\Social\Models\WorkspaceBrandProfile;
use App\Modules\Social\Services\BrandedGraphicService;
use App\Services\MediaService;
use App\Services\StorageManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandKitController extends Controller
{
    public function __construct(
        private readonly BrandedGraphicService $graphicService,
        private readonly StorageManager $storageManager,
        private readonly MediaService $mediaService
    ) {}

    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    public function index(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);
        $profile = WorkspaceBrandProfile::forWorkspace($workspaceId);

        $archetypes = [
            [
                'id' => 'tip',
                'name' => 'Educational Tip / Insight',
                'description' => 'Clean actionable takeaway card with structured bullet points and high-contrast badge.',
                'badge' => 'ACTIONABLE TIP',
            ],
            [
                'id' => 'quote',
                'name' => 'Inspirational Quote / Manifesto',
                'description' => 'Large stylized quotation marks, centered authoritative quote, and founder attribution.',
                'badge' => 'INSPIRATION',
            ],
            [
                'id' => 'data',
                'name' => 'Metrics & Research Spotlight',
                'description' => 'Large bold statistic badge (e.g. 87% or 10X) with key findings and industry benchmark.',
                'badge' => 'METRICS & DATA',
            ],
            [
                'id' => 'promo',
                'name' => 'Product Feature / Special Offer',
                'description' => 'High-converting promotional layout with value proposition and prominent CTA pill.',
                'badge' => 'FEATURED OFFER',
            ],
            [
                'id' => 'announcement',
                'name' => 'Announcement / Breaking News',
                'description' => 'Alert-style headline banner for company updates, product launches, or events.',
                'badge' => 'ANNOUNCEMENT',
            ],
            [
                'id' => 'carousel',
                'name' => 'Multi-Slide Educational Deck',
                'description' => 'Step-by-step swipeable carousel with cover slide, numbered takeaways, and summary CTA.',
                'badge' => 'CAROUSEL GUIDE',
            ],
        ];

        $aspectRatios = [
            ['id' => '1:1', 'name' => 'Square (1:1)', 'dimensions' => '1080 × 1080', 'best_for' => 'Instagram, LinkedIn & Facebook Feed'],
            ['id' => '4:5', 'name' => 'Portrait (4:5)', 'dimensions' => '1080 × 1350', 'best_for' => 'Instagram Feed (High Real-Estate)'],
            ['id' => '9:16', 'name' => 'Story / Reel (9:16)', 'dimensions' => '1080 × 1920', 'best_for' => 'Stories, TikTok, YouTube Shorts'],
            ['id' => '16:9', 'name' => 'Landscape (16:9)', 'dimensions' => '1200 × 675', 'best_for' => 'Twitter/X & LinkedIn Previews'],
        ];

        $fontCatalog = [
            ['name' => 'Poppins', 'type' => 'Geometric Sans-Serif', 'mood' => 'Modern, energetic, bold'],
            ['name' => 'Inter', 'type' => 'Neo-Grotesque Sans', 'mood' => 'Clean, objective, ultra-readable'],
            ['name' => 'Montserrat', 'type' => 'Urban Sans-Serif', 'mood' => 'Authoritative, architectural'],
            ['name' => 'Playfair Display', 'type' => 'Transitional Serif', 'mood' => 'Editorial, luxury, thought leadership'],
            ['name' => 'Outfit', 'type' => 'Contemporary Sans', 'mood' => 'Friendly, tech-forward, crisp'],
            ['name' => 'Space Grotesk', 'type' => 'Monospace-Inspired Sans', 'mood' => 'AI, web3, developer, high-tech'],
        ];

        return Inertia::render('Social/BrandKit', [
            'brand_profile' => [
                'id' => $profile->id,
                'workspace_id' => $profile->workspace_id,
                'brand_name' => $profile->brand_name ?: (Workspace::find($workspaceId)?->name ?? 'My Brand'),
                'website_url' => $profile->website_url ?? '',
                'primary_handle' => $profile->primary_handle ?? '',
                'niche' => $profile->niche ?? '',
                'target_audience' => $profile->target_audience ?? '',
                'tone' => $profile->tone ?? 'professional',
                'writing_style' => $profile->writing_style ?? '',
                'primary_color' => $profile->primaryColor(),
                'secondary_color' => $profile->secondaryColor(),
                'accent_color' => $profile->accentColor(),
                'bg_color' => $profile->backgroundColor(),
                'surface_color' => $profile->surfaceColor(),
                'heading_font' => $profile->headingFont(),
                'body_font' => $profile->bodyFont(),
                'accent_font' => $profile->accentFont(),
                'logo_url' => $profile->logo_url ?? '',
                'dark_logo_url' => $profile->dark_logo_url ?? '',
                'watermark_url' => $profile->watermark_url ?? '',
                'watermark_opacity' => $profile->watermarkOpacity(),
                'watermark_position' => $profile->watermarkPosition(),
                'visual_theme' => $profile->visual_theme ?? 'modern_minimalist',
                'aspect_ratios' => $profile->aspect_ratios ?: ['1:1', '4:5'],
                'content_pillars' => $profile->content_pillars ?: ['Educational Insights', 'Industry Trends', 'Actionable Tips', 'Case Studies'],
                'cta_templates' => $profile->cta_templates ?: ['Save this post for later ↗', 'Follow for daily growth insights', 'Link in bio to learn more'],
                'banned_phrases' => $profile->banned_phrases ?: [],
                'default_hashtag_sets' => $profile->default_hashtag_sets ?: [],
                'active_templates' => $profile->active_templates ?: ['tip', 'quote', 'data', 'promo', 'announcement', 'carousel'],
                'requires_approval' => (bool) $profile->requires_approval,
                'auto_replenish' => (bool) $profile->auto_replenish,
            ],
            'archetypes' => $archetypes,
            'aspect_ratios' => $aspectRatios,
            'font_catalog' => $fontCatalog,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $workspaceId = $this->workspaceId($request);
        $profile = WorkspaceBrandProfile::forWorkspace($workspaceId);

        $validated = $request->validate([
            'brand_name' => ['nullable', 'string', 'max:160'],
            'website_url' => ['nullable', 'string', 'max:255'],
            'primary_handle' => ['nullable', 'string', 'max:120'],
            'niche' => ['nullable', 'string', 'max:255'],
            'target_audience' => ['nullable', 'string'],
            'tone' => ['nullable', 'string', 'max:64'],
            'writing_style' => ['nullable', 'string'],
            'primary_color' => ['nullable', 'string', 'max:32'],
            'secondary_color' => ['nullable', 'string', 'max:32'],
            'accent_color' => ['nullable', 'string', 'max:32'],
            'bg_color' => ['nullable', 'string', 'max:32'],
            'surface_color' => ['nullable', 'string', 'max:32'],
            'heading_font' => ['nullable', 'string', 'max:64'],
            'body_font' => ['nullable', 'string', 'max:64'],
            'accent_font' => ['nullable', 'string', 'max:64'],
            'logo_url' => ['nullable', 'string', 'max:1024'],
            'dark_logo_url' => ['nullable', 'string', 'max:1024'],
            'watermark_url' => ['nullable', 'string', 'max:1024'],
            'watermark_opacity' => ['nullable', 'integer', 'min:10', 'max:100'],
            'watermark_position' => ['nullable', 'string', 'in:bottom-right,bottom-left,top-right,top-left,header-center'],
            'visual_theme' => ['nullable', 'string', 'max:64'],
            'aspect_ratios' => ['nullable', 'array'],
            'content_pillars' => ['nullable', 'array'],
            'cta_templates' => ['nullable', 'array'],
            'banned_phrases' => ['nullable', 'array'],
            'default_hashtag_sets' => ['nullable', 'array'],
            'active_templates' => ['nullable', 'array'],
            'requires_approval' => ['nullable', 'boolean'],
            'auto_replenish' => ['nullable', 'boolean'],
        ]);

        $brandColors = [
            $validated['primary_color'] ?? $profile->primaryColor(),
            $validated['secondary_color'] ?? $profile->secondaryColor(),
            $validated['accent_color'] ?? $profile->accentColor(),
            $validated['bg_color'] ?? $profile->backgroundColor(),
            $validated['surface_color'] ?? $profile->surfaceColor(),
        ];

        $typography = [
            'heading_font' => $validated['heading_font'] ?? $profile->headingFont(),
            'body_font' => $validated['body_font'] ?? $profile->bodyFont(),
            'accent_font' => $validated['accent_font'] ?? $profile->accentFont(),
        ];

        $profile->update([
            'brand_name' => $validated['brand_name'] ?? $profile->brand_name,
            'website_url' => $validated['website_url'] ?? $profile->website_url,
            'primary_handle' => $validated['primary_handle'] ?? $profile->primary_handle,
            'niche' => $validated['niche'] ?? $profile->niche,
            'target_audience' => $validated['target_audience'] ?? $profile->target_audience,
            'tone' => $validated['tone'] ?? $profile->tone,
            'writing_style' => $validated['writing_style'] ?? $profile->writing_style,
            'brand_colors' => $brandColors,
            'typography' => $typography,
            'logo_url' => $validated['logo_url'] ?? $profile->logo_url,
            'dark_logo_url' => $validated['dark_logo_url'] ?? $profile->dark_logo_url,
            'watermark_url' => $validated['watermark_url'] ?? $profile->watermark_url,
            'watermark_opacity' => $validated['watermark_opacity'] ?? $profile->watermarkOpacity(),
            'watermark_position' => $validated['watermark_position'] ?? $profile->watermarkPosition(),
            'visual_theme' => $validated['visual_theme'] ?? $profile->visual_theme,
            'aspect_ratios' => $validated['aspect_ratios'] ?? $profile->aspect_ratios,
            'content_pillars' => array_values(array_filter($validated['content_pillars'] ?? $profile->content_pillars ?: [])),
            'cta_templates' => array_values(array_filter($validated['cta_templates'] ?? $profile->cta_templates ?: [])),
            'banned_phrases' => array_values(array_filter($validated['banned_phrases'] ?? $profile->banned_phrases ?: [])),
            'default_hashtag_sets' => array_values(array_filter($validated['default_hashtag_sets'] ?? $profile->default_hashtag_sets ?: [])),
            'active_templates' => array_values(array_filter($validated['active_templates'] ?? $profile->active_templates ?: [])),
            'requires_approval' => (bool) ($validated['requires_approval'] ?? false),
            'auto_replenish' => (bool) ($validated['auto_replenish'] ?? true),
        ]);

        return back()->with('success', 'Brand Design Kit updated successfully.');
    }

    public function uploadAsset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:png,jpg,jpeg,svg,webp'],
            'asset_type' => ['required', 'string', 'in:logo,dark_logo,watermark'],
        ]);

        $workspaceId = $this->workspaceId($request);
        $user = $request->user();

        $media = $this->mediaService->store($validated['file'], $user, 'brand-kits');
        $url = $media->url();

        $profile = WorkspaceBrandProfile::forWorkspace($workspaceId);
        $assetType = $validated['asset_type'];

        if ($assetType === 'logo') {
            $profile->update(['logo_url' => $url]);
        } elseif ($assetType === 'dark_logo') {
            $profile->update(['dark_logo_url' => $url]);
        } elseif ($assetType === 'watermark') {
            $profile->update(['watermark_url' => $url]);
        }

        return response()->json([
            'url' => $url,
            'asset_type' => $assetType,
            'message' => 'Asset uploaded successfully.',
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);
        $template = (string) ($request->input('template') ?? 'tip');
        $payload = (array) ($request->input('payload') ?? []);

        $res = $this->graphicService->renderPreview($workspaceId, $template, $payload);

        return response()->json($res);
    }
}

