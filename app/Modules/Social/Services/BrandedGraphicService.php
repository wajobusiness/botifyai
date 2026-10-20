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

        // Detect form factor
        $isLandscape = ($width > $height);              // 16:9 (1200x675)
        $isStory = ($height >= 1800);                   // 9:16 (1080x1920)
        $isPortrait = ($height > $width && ! $isStory); // 4:5 (1080x1350)
        $isSquare = (! $isLandscape && ! $isStory && ! $isPortrait); // 1:1 (1080x1080)

        // Proportional geometry settings per aspect ratio
        if ($isLandscape) {
            $cardPadding = 36;
            $contentX = 64;
            $cardRx = 20;

            $pillX = 64;
            $pillY = 56;
            $pillW = 320;
            $pillH = 34;
            $pillRx = 17;
            $pillTextX = 80;
            $pillTextY = 78;
            $pillFontSize = 13;

            $counterX = $width - 64;
            $counterY = 78;
            $counterFontSize = 15;

            $logoX = $width - 220;
            $logoY = 52;
            $logoW = 120;
            $logoH = 38;

            $wmX = $watermarkPosition === 'bottom-left' ? 64 : ($width - 150);
            $wmY = str_contains($watermarkPosition, 'top') ? 56 : ($height - 130);
            $wmW = 75;
            $wmH = 75;

            $headlineWrap = 42;
            $bodyWrap = 58;
            $maxHeadlineLines = 3;
            $maxBodyLines = 3;
            $fontSize = 36;
            $lineStep = 44;
            $headlineStartY = ($format === 'data' ? 180 : 138);
            $bodyFontSize = 18;
            $bodyLineStep = 26;

            $footerY = $height - 58;
            $footerSepY = $footerY - 24;
            $footerSepX1 = 64;
            $footerSepX2 = $width - 64;
            $footerBrandY = $footerY;
            $footerHandleY = $footerY + 20;
            $footerBrandFontSize = 18;
            $footerHandleFontSize = 13;

            $ctaW = 240;
            $ctaH = 36;
            $ctaRx = 18;
            $ctaX = $width - 64 - $ctaW;
            $ctaY = $footerY - 14;
            $ctaTextX = $ctaX + (int) ($ctaW / 2);
            $ctaTextY = $ctaY + 23;
            $ctaFontSize = 13;
        } elseif ($isStory) {
            $cardPadding = 56;
            $contentX = 100;
            $cardRx = 32;

            $pillX = 100;
            $pillY = 220;
            $pillW = 420;
            $pillH = 52;
            $pillRx = 26;
            $pillTextX = 126;
            $pillTextY = 253;
            $pillFontSize = 18;

            $counterX = $width - 100;
            $counterY = 253;
            $counterFontSize = 20;

            $logoX = $width - 270;
            $logoY = 215;
            $logoW = 150;
            $logoH = 54;

            $wmX = $watermarkPosition === 'bottom-left' ? 100 : ($width - 240);
            $wmY = str_contains($watermarkPosition, 'top') ? 220 : ($height - 320);
            $wmW = 130;
            $wmH = 130;

            $headlineWrap = 24;
            $bodyWrap = 36;
            $maxHeadlineLines = 5;
            $maxBodyLines = 5;
            $fontSize = 58;
            $lineStep = 76;
            $headlineStartY = ($format === 'data' ? 560 : 440);
            $bodyFontSize = 32;
            $bodyLineStep = 48;

            $footerY = $height - 240;
            $footerSepY = $footerY - 40;
            $footerSepX1 = 100;
            $footerSepX2 = $width - 100;
            $footerBrandY = $footerY;
            $footerHandleY = $footerY + 36;
            $footerBrandFontSize = 28;
            $footerHandleFontSize = 20;

            $ctaW = 340;
            $ctaH = 62;
            $ctaRx = 31;
            $ctaX = $width - 100 - $ctaW;
            $ctaY = $footerY - 16;
            $ctaTextX = $ctaX + (int) ($ctaW / 2);
            $ctaTextY = $ctaY + 39;
            $ctaFontSize = 18;
        } elseif ($isPortrait) {
            $cardPadding = 56;
            $contentX = 90;
            $cardRx = 28;

            $pillX = 90;
            $pillY = 96;
            $pillW = 380;
            $pillH = 46;
            $pillRx = 23;
            $pillTextX = 114;
            $pillTextY = 125;
            $pillFontSize = 16;

            $counterX = $width - 90;
            $counterY = 125;
            $counterFontSize = 18;

            $logoX = $width - 250;
            $logoY = 90;
            $logoW = 140;
            $logoH = 48;

            $wmX = $watermarkPosition === 'bottom-left' ? 90 : ($width - 200);
            $wmY = str_contains($watermarkPosition, 'top') ? 96 : ($height - 200);
            $wmW = 100;
            $wmH = 100;

            $headlineWrap = 26;
            $bodyWrap = 38;
            $maxHeadlineLines = 4;
            $maxBodyLines = 4;
            $fontSize = 50;
            $lineStep = 64;
            $headlineStartY = ($format === 'data' ? 430 : 330);
            $bodyFontSize = 26;
            $bodyLineStep = 38;

            $footerY = $height - 120;
            $footerSepY = $footerY - 32;
            $footerSepX1 = 90;
            $footerSepX2 = $width - 90;
            $footerBrandY = $footerY;
            $footerHandleY = $footerY + 28;
            $footerBrandFontSize = 24;
            $footerHandleFontSize = 17;

            $ctaW = 300;
            $ctaH = 52;
            $ctaRx = 26;
            $ctaX = $width - 90 - $ctaW;
            $ctaY = $footerY - 14;
            $ctaTextX = $ctaX + (int) ($ctaW / 2);
            $ctaTextY = $ctaY + 33;
            $ctaFontSize = 16;
        } else {
            // Square 1:1
            $cardPadding = 56;
            $contentX = 90;
            $cardRx = 28;

            $pillX = 90;
            $pillY = 90;
            $pillW = 380;
            $pillH = 44;
            $pillRx = 22;
            $pillTextX = 114;
            $pillTextY = 118;
            $pillFontSize = 16;

            $counterX = $width - 90;
            $counterY = 118;
            $counterFontSize = 18;

            $logoX = $width - 240;
            $logoY = 85;
            $logoW = 140;
            $logoH = 46;

            $wmX = $watermarkPosition === 'bottom-left' ? 90 : ($width - 190);
            $wmY = str_contains($watermarkPosition, 'top') ? 90 : ($height - 180);
            $wmW = 100;
            $wmH = 100;

            $headlineWrap = 26;
            $bodyWrap = 38;
            $maxHeadlineLines = 4;
            $maxBodyLines = 4;
            $fontSize = 48;
            $lineStep = 62;
            $headlineStartY = ($format === 'data' ? 370 : 280);
            $bodyFontSize = 24;
            $bodyLineStep = 36;

            $footerY = $height - 110;
            $footerSepY = $footerY - 30;
            $footerSepX1 = 90;
            $footerSepX2 = $width - 90;
            $footerBrandY = $footerY;
            $footerHandleY = $footerY + 26;
            $footerBrandFontSize = 22;
            $footerHandleFontSize = 16;

            $ctaW = 280;
            $ctaH = 48;
            $ctaRx = 24;
            $ctaX = $width - 90 - $ctaW;
            $ctaY = $footerY - 14;
            $ctaTextX = $ctaX + (int) ($ctaW / 2);
            $ctaTextY = $ctaY + 30;
            $ctaFontSize = 15;
        }

        $cardW = $width - ($cardPadding * 2);
        $cardH = $height - ($cardPadding * 2);

        // Slide counter indicator
        $counter = $totalSlides > 1 ? "{$slideNumber} / {$totalSlides}" : '';

        // Logo element
        $logoSvg = '';
        if ($logoUrl !== '') {
            $safeLogo = htmlspecialchars($logoUrl, ENT_XML1);
            $logoSvg = "<image href=\"{$safeLogo}\" x=\"{$logoX}\" y=\"{$logoY}\" width=\"{$logoW}\" height=\"{$logoH}\" preserveAspectRatio=\"xMidYMid meet\"/>";
        }

        // Watermark element
        $watermarkSvg = '';
        if ($watermarkUrl !== '') {
            $safeWm = htmlspecialchars($watermarkUrl, ENT_XML1);
            $wmOp = round($watermarkOpacity / 100, 2);
            $watermarkSvg = "<image href=\"{$safeWm}\" x=\"{$wmX}\" y=\"{$wmY}\" width=\"{$wmW}\" height=\"{$wmH}\" opacity=\"{$wmOp}\" preserveAspectRatio=\"xMidYMid meet\"/>";
        }

        // Format-specific elements
        $statBadgeSvg = '';
        if ($format === 'data' && $stat !== '') {
            if ($isLandscape) {
                $statBadgeW = 200; $statBadgeH = 68; $statBadgeY = 100; $statTextY = 148; $statFontSize = 46;
            } elseif ($isStory) {
                $statBadgeW = 340; $statBadgeH = 120; $statBadgeY = 380; $statTextY = 465; $statFontSize = 76;
            } else {
                $statBadgeW = 260; $statBadgeH = 92; $statBadgeY = 220; $statTextY = 285; $statFontSize = 58;
            }
            $statTextX = $contentX + (int) ($statBadgeW / 2);
            $statBadgeSvg = <<<SVG
<rect x="{$contentX}" y="{$statBadgeY}" width="{$statBadgeW}" height="{$statBadgeH}" rx="16" fill="{$primaryHex}"/>
<text x="{$statTextX}" y="{$statTextY}" fill="#ffffff" font-family="'{$headingFont}', sans-serif" font-size="{$statFontSize}" font-weight="900" text-anchor="middle">{$stat}</text>
SVG;
        }

        $quoteIconSvg = '';
        if ($format === 'quote') {
            $quoteY = $isLandscape ? 128 : ($isStory ? 410 : 270);
            $quoteSize = $isLandscape ? 70 : ($isStory ? 140 : 105);
            $quoteIconSvg = <<<SVG
<text x="{$contentX}" y="{$quoteY}" fill="{$accentHex}" font-family="Georgia, serif" font-size="{$quoteSize}" font-weight="bold" opacity="0.4">“</text>
SVG;
        }

        // Wrapped headline lines
        $headlineLines = explode("\n", wordwrap($headline, $headlineWrap, "\n", true));
        $bodyLines = explode("\n", wordwrap($body, $bodyWrap, "\n", true));

        $headlineSvg = '';
        $curHeadlineY = $headlineStartY;
        $renderedHeadlineLines = array_slice($headlineLines, 0, $maxHeadlineLines);
        foreach ($renderedHeadlineLines as $line) {
            $headlineSvg .= "<tspan x=\"{$contentX}\" y=\"{$curHeadlineY}\">{$line}</tspan>";
            $curHeadlineY += $lineStep;
        }

        $accentDividerY = $curHeadlineY + ($isLandscape ? 8 : 14);
        $accentDividerW = (int) ($width * 0.12);

        $bodySvg = '';
        $curBodyY = $accentDividerY + ($isLandscape ? 24 : 36);
        $renderedBodyLines = array_slice($bodyLines, 0, $maxBodyLines);
        foreach ($renderedBodyLines as $line) {
            $bodySvg .= "<tspan x=\"{$contentX}\" y=\"{$curBodyY}\">{$line}</tspan>";
            $curBodyY += $bodyLineStep;
        }

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="{$width}" height="{$height}" viewBox="0 0 {$width} {$height}" preserveAspectRatio="xMidYMid meet">
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
  <rect x="{$cardPadding}" y="{$cardPadding}" width="{$cardW}" height="{$cardH}" rx="{$cardRx}" fill="{$surfaceHex}" filter="url(#cardShadow)"/>
  <rect x="{$cardPadding}" y="{$cardPadding}" width="{$cardW}" height="{$cardH}" rx="{$cardRx}" fill="none" stroke="{$primaryHex}" stroke-width="1.5" stroke-opacity="0.25"/>

  <!-- Header Eyebrow Pill -->
  <rect x="{$pillX}" y="{$pillY}" width="{$pillW}" height="{$pillH}" rx="{$pillRx}" fill="{$primaryHex}"/>
  <text x="{$pillTextX}" y="{$pillTextY}" fill="#ffffff" class="font-heading" font-size="{$pillFontSize}" font-weight="800" letter-spacing="1">{$badge}</text>

  <!-- Slide Counter -->
  <text x="{$counterX}" y="{$counterY}" fill="{$textMuted}" class="font-body" font-size="{$counterFontSize}" font-weight="600" text-anchor="end">{$counter}</text>

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
  <rect x="{$contentX}" y="{$accentDividerY}" width="{$accentDividerW}" height="4" rx="2" fill="url(#accentGlow)"/>

  <!-- Body Content -->
  <text class="font-body" font-size="{$bodyFontSize}" font-weight="400" fill="{$textMuted}" letter-spacing="0.2">
    {$bodySvg}
  </text>

  <!-- Footer Brand Signature Bar -->
  <line x1="{$footerSepX1}" y1="{$footerSepY}" x2="{$footerSepX2}" y2="{$footerSepY}" stroke="{$textMuted}" stroke-opacity="0.2" stroke-width="1"/>

  <text x="{$contentX}" y="{$footerBrandY}" fill="{$primaryHex}" class="font-heading" font-size="{$footerBrandFontSize}" font-weight="800">{$safeBrand}</text>
  <text x="{$contentX}" y="{$footerHandleY}" fill="{$textMuted}" class="font-body" font-size="{$footerHandleFontSize}" font-weight="500">{$safeHandle} <tspan fill="{$textMuted}" opacity="0.5">·</tspan> {$safeWebsite}</text>

  <!-- Call to Action Pill Button -->
  <rect x="{$ctaX}" y="{$ctaY}" width="{$ctaW}" height="{$ctaH}" rx="{$ctaRx}" fill="url(#accentGlow)"/>
  <text x="{$ctaTextX}" y="{$ctaTextY}" fill="#ffffff" class="font-heading" font-size="{$ctaFontSize}" font-weight="700" text-anchor="middle">{$footerCta}</text>
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
        $content = $svgContent;

        // If Imagick is available, convert to high-resolution PNG so Meta (FB/IG) Graph API accepts it natively
        if (class_exists(\Imagick::class)) {
            try {
                $im = new \Imagick();
                $im->setBackgroundColor(new \ImagickPixel('transparent'));
                $im->readImageBlob($svgContent);
                $im->setImageFormat('png32');
                $pngData = $im->getImageBlob();
                $im->clear();
                $im->destroy();
                if ($pngData) {
                    $ext = 'png';
                    $mime = 'image/png';
                    $content = $pngData;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('BrandedGraphicService: Imagick PNG conversion skipped: '.$e->getMessage());
            }
        }

        $filename = "brand-{$format}-{$slideNumber}-".Str::random(8).".{$ext}";
        $rawPath = 'media/social-graphics/'.Str::uuid().'.'.$ext;
        $path = $this->storageManager->prefixedPath($rawPath);

        Storage::disk($diskName)->put($path, $content);

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
            'size_bytes' => strlen($content),
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
