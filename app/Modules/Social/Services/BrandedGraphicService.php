<?php

namespace App\Modules\Social\Services;

use App\Models\Media;
use App\Models\User;
use App\Models\Workspace;
use App\Modules\Social\Models\WorkspaceBrandProfile;
use App\Services\StorageManager;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Enterprise Deterministic AI Brand Design Engine.
 *
 * Renders high-fidelity, crisp, pixel-perfect branded graphics (1:1, 4:5, 9:16, 16:9)
 * and multi-slide carousels using the workspace's brand kit: typography, dual/tri-color palettes,
 * logo overlays, watermarks, social handles, and dynamic content regions.
 */
class BrandedGraphicService
{
    public function __construct(private readonly StorageManager $storageManager) {}

    /**
     * Render one or more branded social graphics and persist them to the workspace Media library.
     *
     * @param  array<string, mixed>  $payload
     * @return array{urls: list<string>, primary_url: string, format: string, slide_count: int}
     */
    public function render(int $workspaceId, string $template, array $payload = []): array
    {
        $profile = WorkspaceBrandProfile::forWorkspace($workspaceId);
        $workspace = Workspace::find($workspaceId);

        $brandName = trim((string) ($payload['brand_name'] ?? $profile->brand_name ?? $workspace?->name ?? config('app.name', 'Brand')));
        $handle = trim((string) ($payload['primary_handle'] ?? $profile->primary_handle ?? '@'.Str::slug($brandName)));
        $website = trim((string) ($payload['website_url'] ?? $profile->website_url ?? ''));
        $logoUrl = trim((string) ($payload['logo_url'] ?? $profile->logo_url ?? ''));
        $watermarkUrl = trim((string) ($payload['watermark_url'] ?? $profile->watermark_url ?? ''));
        $watermarkOpacity = (int) ($payload['watermark_opacity'] ?? $profile->watermarkOpacity());
        $watermarkPosition = (string) ($payload['watermark_position'] ?? $profile->watermarkPosition());

        $primaryHex = (string) ($payload['primary_color'] ?? $profile->primaryColor());
        $secondaryHex = (string) ($payload['secondary_color'] ?? $profile->secondaryColor());
        $accentHex = (string) ($payload['accent_color'] ?? $profile->accentColor());
        $bgHex = (string) ($payload['bg_color'] ?? $profile->backgroundColor());
        $surfaceHex = (string) ($payload['surface_color'] ?? $profile->surfaceColor());

        $headingFont = (string) ($payload['heading_font'] ?? $profile->headingFont());
        $bodyFont = (string) ($payload['body_font'] ?? $profile->bodyFont());

        $aspectRatio = (string) ($payload['aspect_ratio'] ?? '1:1');
        [$width, $height] = $this->resolveDimensions($aspectRatio);

        $format = $this->resolveTemplate($template, $payload);
        $pillar = strtoupper(trim((string) ($payload['pillar'] ?? $payload['content_pillar'] ?? $profile->niche ?? 'INSIGHT')));
        $cta = trim((string) ($payload['cta_text'] ?? ($profile->cta_templates[0] ?? 'Follow for more insights')));

        $slides = $this->buildSlideSpecs($format, $payload, $pillar, $brandName, $cta);

        $urls = [];
        $totalSlides = count($slides);
        foreach ($slides as $idx => $slide) {
            $svgContent = $this->generateSvg(
                $format,
                $slide,
                $idx + 1,
                $totalSlides,
                $brandName,
                $handle,
                $website,
                $logoUrl,
                $watermarkUrl,
                $watermarkOpacity,
                $watermarkPosition,
                $primaryHex,
                $secondaryHex,
                $accentHex,
                $bgHex,
                $surfaceHex,
                $headingFont,
                $bodyFont,
                $width,
                $height
            );

            $urls[] = $this->storeSlideMedia(
                $workspaceId,
                $format,
                $svgContent,
                $idx + 1,
                $totalSlides,
                $aspectRatio,
                $width,
                $height
            );
        }

        return [
            'urls' => $urls,
            'primary_url' => $urls[0] ?? '',
            'format' => $format,
            'slide_count' => count($urls),
        ];
    }

    /**
     * Generate an instantaneous live vector preview without persisting to database.
     *
     * @param  array<string, mixed>  $payload
     * @return array{svg: string, format: string, width: int, height: int, contrast_ratio: float, contrast_rating: string}
     */
    public function renderPreview(int $workspaceId, string $template, array $payload = []): array
    {
        $profile = WorkspaceBrandProfile::forWorkspace($workspaceId);
        $workspace = Workspace::find($workspaceId);

        $brandName = trim((string) ($payload['brand_name'] ?? $profile->brand_name ?? $workspace?->name ?? config('app.name', 'Brand')));
        $handle = trim((string) ($payload['primary_handle'] ?? $profile->primary_handle ?? '@'.Str::slug($brandName)));
        $website = trim((string) ($payload['website_url'] ?? $profile->website_url ?? ''));
        $logoUrl = trim((string) ($payload['logo_url'] ?? $profile->logo_url ?? ''));
        $watermarkUrl = trim((string) ($payload['watermark_url'] ?? $profile->watermark_url ?? ''));
        $watermarkOpacity = (int) ($payload['watermark_opacity'] ?? $profile->watermarkOpacity());
        $watermarkPosition = (string) ($payload['watermark_position'] ?? $profile->watermarkPosition());

        $primaryHex = (string) ($payload['primary_color'] ?? $profile->primaryColor());
        $secondaryHex = (string) ($payload['secondary_color'] ?? $profile->secondaryColor());
        $accentHex = (string) ($payload['accent_color'] ?? $profile->accentColor());
        $bgHex = (string) ($payload['bg_color'] ?? $profile->backgroundColor());
        $surfaceHex = (string) ($payload['surface_color'] ?? $profile->surfaceColor());

        $headingFont = (string) ($payload['heading_font'] ?? $profile->headingFont());
        $bodyFont = (string) ($payload['body_font'] ?? $profile->bodyFont());

        $aspectRatio = (string) ($payload['aspect_ratio'] ?? '1:1');
        [$width, $height] = $this->resolveDimensions($aspectRatio);

        $format = $this->resolveTemplate($template, $payload);
        $pillar = strtoupper(trim((string) ($payload['pillar'] ?? $payload['content_pillar'] ?? $profile->niche ?? 'INSIGHT')));
        $cta = trim((string) ($payload['cta_text'] ?? ($profile->cta_templates[0] ?? 'Follow for more insights')));

        $slides = $this->buildSlideSpecs($format, $payload, $pillar, $brandName, $cta);
        $firstSlide = $slides[0] ?? [
            'badge' => $pillar,
            'headline' => 'Actionable Brand Strategy',
            'body' => 'High-converting social media architecture generated by BotifyAI.',
            'footer' => $cta,
        ];

        $svg = $this->generateSvg(
            $format,
            $firstSlide,
            1,
            count($slides),
            $brandName,
            $handle,
            $website,
            $logoUrl,
            $watermarkUrl,
            $watermarkOpacity,
            $watermarkPosition,
            $primaryHex,
            $secondaryHex,
            $accentHex,
            $bgHex,
            $surfaceHex,
            $headingFont,
            $bodyFont,
            $width,
            $height
        );

        $contrastRatio = $this->calculateContrastRatio($primaryHex, $surfaceHex);
        $rating = $contrastRatio >= 7.0 ? 'AAA' : ($contrastRatio >= 4.5 ? 'AA' : 'Fail');

        return [
            'svg' => $svg,
            'format' => $format,
            'width' => $width,
            'height' => $height,
            'contrast_ratio' => round($contrastRatio, 2),
            'contrast_rating' => $rating,
        ];
    }

    private function resolveDimensions(string $aspectRatio): array
    {
        return match ($aspectRatio) {
            '4:5' => [1080, 1350],
            '9:16' => [1080, 1920],
            '16:9' => [1200, 675],
            default => [1080, 1080],
        };
    }

    private function resolveTemplate(string $template, array $payload): string
    {
        $template = strtolower(trim($template));
        if (in_array($template, ['tip', 'quote', 'data', 'promo', 'announcement', 'carousel'], true)) {
            return $template;
        }

        // Auto-select based on topic / content pillar hints
        $text = strtolower((string) ($payload['headline'] ?? $payload['topic'] ?? $payload['pillar'] ?? ''));
        if (Str::contains($text, ['quote', 'mindset', 'wisdom', 'inspiration'])) {
            return 'quote';
        }
        if (Str::contains($text, ['data', 'stat', 'metric', 'benchmark', 'number', 'percent', '%'])) {
            return 'data';
        }
        if (Str::contains($text, ['offer', 'sale', 'deal', 'promo', 'launch', 'discount', 'price'])) {
            return 'promo';
        }
        if (Str::contains($text, ['news', 'update', 'alert', 'announc', 'release'])) {
            return 'announcement';
        }
        if (! empty($payload['slides']) && is_array($payload['slides']) && count($payload['slides']) > 1) {
            return 'carousel';
        }

        return 'tip';
    }

    /**
     * @return list<array{badge: string, headline: string, body: string, footer: string, stat?: string}>
     */
    private function buildSlideSpecs(string $format, array $payload, string $pillar, string $brandName, string $cta): array
    {
        $headline = trim((string) ($payload['headline'] ?? $payload['topic'] ?? 'Key Industry Insight'));
        $subheadline = trim((string) ($payload['subheadline'] ?? $payload['hook'] ?? $payload['angle'] ?? ''));

        if ($format === 'quote') {
            $quote = trim((string) ($payload['quote_text'] ?? $subheadline ?: $headline));

            return [[
                'badge' => 'INSPIRATION · '.$pillar,
                'headline' => '“'.trim($quote, '“”"').'”',
                'body' => '— '.$brandName,
                'footer' => $cta,
            ]];
        }

        if ($format === 'data') {
            $stat = trim((string) ($payload['stat_metric'] ?? '87%'));

            return [[
                'badge' => 'METRICS & RESEARCH · '.$pillar,
                'stat' => $stat,
                'headline' => $headline,
                'body' => $subheadline ?: 'Organizations that automate creative workflows see significantly higher audience engagement.',
                'footer' => $cta,
            ]];
        }

        if ($format === 'promo') {
            $offer = trim((string) ($payload['promo_headline'] ?? $headline));
            $details = trim((string) ($payload['promo_body'] ?? $subheadline ?: 'Scale faster and unlock consistent growth with our proven systems.'));

            return [[
                'badge' => 'FEATURED OFFER · '.$pillar,
                'headline' => $offer,
                'body' => $details,
                'footer' => $cta,
            ]];
        }

        if ($format === 'announcement') {
            return [[
                'badge' => 'ANNOUNCEMENT · '.$pillar,
                'headline' => $headline,
                'body' => $subheadline ?: 'Exciting updates are here. Swipe to explore the newest enhancements.',
                'footer' => $cta,
            ]];
        }

        if ($format === 'tip') {
            return [[
                'badge' => 'ACTIONABLE TIP · '.$pillar,
                'headline' => $headline,
                'body' => $subheadline ?: 'Focus on consistent execution and high-leverage compound improvements.',
                'footer' => $cta,
            ]];
        }

        // Multi-slide Carousel
        $rawSlides = $payload['slides'] ?? [];
        if (is_string($rawSlides) && $rawSlides !== '') {
            $decoded = json_decode($rawSlides, true);
            $rawSlides = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode("\n", $rawSlides)));
        }

        $specs = [];
        // Cover Slide
        $specs[] = [
            'badge' => $pillar.' · SWIPE →',
            'headline' => $headline,
            'body' => $subheadline ?: 'A step-by-step masterclass to elevate your performance.',
            'footer' => $brandName,
        ];

        if (is_array($rawSlides) && ! empty($rawSlides)) {
            foreach (array_slice($rawSlides, 0, 4) as $i => $s) {
                if (is_array($s)) {
                    $specs[] = [
                        'badge' => 'STEP 0'.($i + 1),
                        'headline' => (string) ($s['title'] ?? $s['headline'] ?? 'Point #'.($i + 1)),
                        'body' => (string) ($s['body'] ?? $s['description'] ?? ''),
                        'footer' => $brandName,
                    ];
                } else {
                    $parts = array_pad(explode('|', (string) $s, 2), 2, '');
                    $specs[] = [
                        'badge' => 'STEP 0'.($i + 1),
                        'headline' => trim($parts[0]) ?: 'Key Takeaway #'.($i + 1),
                        'body' => trim($parts[1]),
                        'footer' => $brandName,
                    ];
                }
            }
        } else {
            $specs[] = [
                'badge' => 'STEP 01',
                'headline' => 'Prioritize High-Leverage Tasks',
                'body' => 'Eliminate low-value busywork and double down on core conversion drivers.',
                'footer' => $brandName,
            ];
            $specs[] = [
                'badge' => 'STEP 02',
                'headline' => 'Automate Distribution Workflows',
                'body' => 'Maintain consistent brand voice across networks without manual repetitive effort.',
                'footer' => $brandName,
            ];
        }

        // Outro CTA Slide
        $specs[] = [
            'badge' => 'ACTION PLAN',
            'headline' => 'Ready to Put This into Practice?',
            'body' => $cta,
            'footer' => $brandName,
        ];

        return $specs;
    }

    private function generateSvg(
        string $format,
        array $slide,
        int $slideNumber,
        int $totalSlides,
        string $brandName,
        string $handle,
        string $website,
        string $logoUrl,
        string $watermarkUrl,
        int $watermarkOpacity,
        string $watermarkPosition,
        string $primaryHex,
        string $secondaryHex,
        string $accentHex,
        string $bgHex,
        string $surfaceHex,
        string $headingFont,
        string $bodyFont,
        int $width,
        int $height
    ): string {
        $badge = htmlspecialchars($slide['badge'] ?? '', ENT_XML1);
        $headline = htmlspecialchars($slide['headline'] ?? '', ENT_XML1);
        $body = htmlspecialchars($slide['body'] ?? '', ENT_XML1);
        $stat = htmlspecialchars($slide['stat'] ?? '', ENT_XML1);
        $footerCta = htmlspecialchars($slide['footer'] ?? '', ENT_XML1);
        $safeBrand = htmlspecialchars($brandName, ENT_XML1);
        $safeHandle = htmlspecialchars($handle, ENT_XML1);
        $safeWebsite = htmlspecialchars($website, ENT_XML1);

        // Auto text contrast
        $textPrimary = $this->contrastColor($surfaceHex);
        $textMuted = $textPrimary === '#ffffff' ? '#94a3b8' : '#64748b';

        // Wrapped headline lines
        $headlineLines = explode("\n", wordwrap($headline, 28, "\n", true));
        $bodyLines = explode("\n", wordwrap($body, 42, "\n", true));

        // Dimension bounding adjustments
        $cardPadding = 64;
        $cardW = $width - ($cardPadding * 2);
        $cardH = $height - ($cardPadding * 2);

        // Slide counter indicator
        $counter = $totalSlides > 1 ? "{$slideNumber} / {$totalSlides}" : '';

        // Logo element
        $logoSvg = '';
        if ($logoUrl !== '') {
            $safeLogo = htmlspecialchars($logoUrl, ENT_XML1);
            $logoSvg = "<image href=\"{$safeLogo}\" x=\"".($width - 240)."\" y=\"80\" width=\"140\" height=\"48\" preserveAspectRatio=\"xMidYMid meet\"/>";
        }

        // Watermark element
        $watermarkSvg = '';
        if ($watermarkUrl !== '') {
            $safeWm = htmlspecialchars($watermarkUrl, ENT_XML1);
            $wmOp = round($watermarkOpacity / 100, 2);
            $wmX = $watermarkPosition === 'bottom-left' ? 90 : ($width - 190);
            $wmY = str_contains($watermarkPosition, 'top') ? 90 : ($height - 180);
            $watermarkSvg = "<image href=\"{$safeWm}\" x=\"{$wmX}\" y=\"{$wmY}\" width=\"100\" height=\"100\" opacity=\"{$wmOp}\" preserveAspectRatio=\"xMidYMid meet\"/>";
        }

        // Format-specific layouts
        $headlineSvg = '';
        $headlineY = 320;
        $fontSize = count($headlineLines) > 3 ? 42 : 50;
        $lineStep = $fontSize * 1.28;
        foreach (array_slice($headlineLines, 0, 5) as $line) {
            $headlineSvg .= "<tspan x=\"100\" y=\"{$headlineY}\">{$line}</tspan>";
            $headlineY += $lineStep;
        }

        $bodySvg = '';
        $bodyY = $headlineY + 40;
        $bodyFontSize = 26;
        $bodyLineStep = 38;
        foreach (array_slice($bodyLines, 0, 5) as $line) {
            $bodySvg .= "<tspan x=\"100\" y=\"{$bodyY}\">{$line}</tspan>";
            $bodyY += $bodyLineStep;
        }

        $statBadgeSvg = '';
        if ($format === 'data' && $stat !== '') {
            $statBadgeSvg = <<<SVG
<rect x="100" y="240" width="260" height="90" rx="16" fill="{$primaryHex}"/>
<text x="230" y="302" fill="#ffffff" font-family="'{$headingFont}', sans-serif" font-size="56" font-weight="900" text-anchor="middle">{$stat}</text>
SVG;
            // Shift headline down for data archetype
            $headlineSvg = '';
            $headlineY = 400;
            foreach (array_slice($headlineLines, 0, 4) as $line) {
                $headlineSvg .= "<tspan x=\"100\" y=\"{$headlineY}\">{$line}</tspan>";
                $headlineY += $lineStep;
            }
            $bodySvg = '';
            $bodyY = $headlineY + 36;
            foreach (array_slice($bodyLines, 0, 4) as $line) {
                $bodySvg .= "<tspan x=\"100\" y=\"{$bodyY}\">{$line}</tspan>";
                $bodyY += $bodyLineStep;
            }
        }

        $quoteIconSvg = '';
        if ($format === 'quote') {
            $quoteIconSvg = <<<SVG
<text x="96" y="290" fill="{$accentHex}" font-family="Georgia, serif" font-size="110" font-weight="bold" opacity="0.4">“</text>
SVG;
        }

        $footerY = $height - 110;

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="{$width}" height="{$height}" viewBox="0 0 {$width} {$height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family={$headingFont}:wght@700;800;900&amp;family={$bodyFont}:wght@400;500;600&amp;display=swap');
      .font-heading { font-family: '{$headingFont}', -apple-system, BlinkMacSystemFont, sans-serif; }
      .font-body { font-family: '{$bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif; }
    </style>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{$bgHex}"/>
      <stop offset="100%" stop-color="{$secondaryHex}"/>
    </linearGradient>
    <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{$primaryHex}"/>
      <stop offset="100%" stop-color="{$accentHex}"/>
    </linearGradient>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="{$width}" height="{$height}" fill="url(#bgGrad)"/>

  <!-- Top Accent Bar -->
  <rect width="{$width}" height="10" fill="url(#accentGlow)"/>

  <!-- Inner Surface Card -->
  <rect x="{$cardPadding}" y="{$cardPadding}" width="{$cardW}" height="{$cardH}" rx="28" fill="{$surfaceHex}" filter="url(#cardShadow)"/>
  <rect x="{$cardPadding}" y="{$cardPadding}" width="{$cardW}" height="{$cardH}" rx="28" fill="none" stroke="{$primaryHex}" stroke-width="1.5" stroke-opacity="0.25"/>

  <!-- Header Eyebrow Pill -->
  <rect x="100" y="100" width="380" height="42" rx="21" fill="{$primaryHex}"/>
  <text x="124" y="127" fill="#ffffff" class="font-heading" font-size="16" font-weight="800" letter-spacing="1">{$badge}</text>

  <!-- Slide Counter -->
  <text x="{$width} - 160" y="128" fill="{$textMuted}" class="font-body" font-size="18" font-weight="600" text-anchor="end">{$counter}</text>

  <!-- Logo Slot -->
  {$logoSvg}

  <!-- Watermark -->
  {$watermarkSvg}

  <!-- Quote Accent -->
  {$quoteIconSvg}

  <!-- Data Stat Badge -->
  {$statBadgeSvg}

  <!-- Headline Text -->
  <text class="font-heading" font-size="{$fontSize}" font-weight="800" fill="{$textPrimary}">
    {$headlineSvg}
  </text>

  <!-- Accent Divider -->
  <rect x="100" y="{$headlineY} + 12" width="120" height="4" rx="2" fill="url(#accentGlow)"/>

  <!-- Body Content -->
  <text class="font-body" font-size="{$bodyFontSize}" font-weight="400" fill="{$textMuted}" letter-spacing="0.2">
    {$bodySvg}
  </text>

  <!-- Footer Brand Signature Bar -->
  <line x1="100" y1="{$footerY} - 30" x2="{$width} - 100" y2="{$footerY} - 30" stroke="{$textMuted}" stroke-opacity="0.2" stroke-width="1"/>

  <text x="100" y="{$footerY}" fill="{$primaryHex}" class="font-heading" font-size="22" font-weight="800">{$safeBrand}</text>
  <text x="100" y="{$footerY} + 26" fill="{$textMuted}" class="font-body" font-size="16" font-weight="500">{$safeHandle} <tspan fill="{$textMuted}" opacity="0.5">·</tspan> {$safeWebsite}</text>

  <!-- Call to Action Pill Button -->
  <rect x="{$width} - 380" y="{$footerY} - 18" width="280" height="46" rx="23" fill="url(#accentGlow)"/>
  <text x="{$width} - 240" y="{$footerY} + 11" fill="#ffffff" class="font-heading" font-size="15" font-weight="700" text-anchor="middle">{$footerCta}</text>
</svg>
SVG;
    }

    private function storeSlideMedia(
        int $workspaceId,
        string $format,
        string $svgContent,
        int $slideNumber,
        int $totalSlides,
        string $aspectRatio,
        int $width,
        int $height
    ): string {
        $diskName = $this->storageManager->diskName();
        $ext = 'svg';
        $mime = 'image/svg+xml';

        $filename = "brand-{$format}-{$slideNumber}-".Str::random(8).".{$ext}";
        $rawPath = 'media/social-graphics/'.Str::uuid().'.'.$ext;
        $path = $this->storageManager->prefixedPath($rawPath);

        Storage::disk($diskName)->put($path, $svgContent);

        // Associate with Workspace Owner user so it is visible in the client Media Library
        $workspace = Workspace::find($workspaceId);
        $user = $workspace?->owner ?? User::find($workspace?->owner_id) ?? $workspace?->users()->first();
        $mediableType = $user ? get_class($user) : Workspace::class;
        $mediableId = $user ? $user->id : $workspaceId;

        $media = Media::create([
            'mediable_type' => $mediableType,
            'mediable_id' => $mediableId,
            'disk' => $diskName,
            'path' => $path,
            'filename' => $filename,
            'mime_type' => $mime,
            'size_bytes' => strlen($svgContent),
            'collection' => 'social',
            'meta' => [
                'format' => $format,
                'aspect_ratio' => $aspectRatio,
                'width' => $width,
                'height' => $height,
                'slide' => $slideNumber,
                'total_slides' => $totalSlides,
                'workspace_id' => $workspaceId,
            ],
        ]);

        return $media->url();
    }

    private function contrastColor(string $surfaceHex): string
    {
        $rgb = $this->hexToRgb($surfaceHex);
        $lum = 0.2126 * ($rgb[0] / 255) + 0.7152 * ($rgb[1] / 255) + 0.0722 * ($rgb[2] / 255);

        return $lum > 0.5 ? '#0f172a' : '#ffffff';
    }

    private function calculateContrastRatio(string $color1Hex, string $color2Hex): float
    {
        $lum1 = $this->relativeLuminance($color1Hex);
        $lum2 = $this->relativeLuminance($color2Hex);

        $brightest = max($lum1, $lum2);
        $darkest = min($lum1, $lum2);

        return ($brightest + 0.05) / ($darkest + 0.05);
    }

    private function relativeLuminance(string $hex): float
    {
        $rgb = $this->hexToRgb($hex);
        $c = array_map(function ($val) {
            $v = $val / 255;

            return $v <= 0.03928 ? $v / 12.92 : pow(($v + 0.055) / 1.055, 2.4);
        }, $rgb);

        return 0.2126 * $c[0] + 0.7152 * $c[1] + 0.0722 * $c[2];
    }

    /**
     * @return array{0: int, 1: int, 2: int}
     */
    private function hexToRgb(string $hex): array
    {
        $hex = ltrim(trim($hex), '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }
        if (strlen($hex) !== 6 || ! ctype_xdigit($hex)) {
            return [99, 102, 241];
        }

        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2)),
        ];
    }
}
