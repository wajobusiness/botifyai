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
     * @return list<array<string, mixed>>
     */
    private function buildSlideSpecs(string $format, array $payload, string $pillar, string $brandName, string $cta): array
    {
        $headline = trim((string) ($payload['headline'] ?? $payload['topic'] ?? 'Mastering Autonomous AI Brand Distribution'));
        $subheadline = trim((string) ($payload['subheadline'] ?? $payload['hook'] ?? $payload['angle'] ?? ''));

        if ($format === 'quote') {
            $quote = trim((string) ($payload['quote_text'] ?? $subheadline ?: $headline));
            $author = trim((string) ($payload['quote_author'] ?? $brandName));
            $title = trim((string) ($payload['quote_title'] ?? 'Founder & Strategist'));

            return [[
                'badge' => 'INSPIRATION · '.$pillar,
                'quote' => trim($quote, '“”"'),
                'headline' => trim($quote, '“”"'),
                'author' => $author,
                'author_title' => $title,
                'body' => '— '.$author.' · '.$title,
                'footer' => $cta,
            ]];
        }

        if ($format === 'data') {
            $stat = trim((string) ($payload['stat_metric'] ?? '87%'));
            $trend = trim((string) ($payload['stat_trend'] ?? '+4.8X YoY'));

            return [[
                'badge' => 'METRICS & RESEARCH · '.$pillar,
                'stat' => $stat,
                'trend' => $trend,
                'headline' => $headline,
                'takeaway' => $subheadline ?: 'Organizations leveraging automated publishing see 4.8x higher organic engagement.',
                'body' => $subheadline ?: 'Organizations leveraging automated publishing see 4.8x higher organic engagement.',
                'footer' => $cta,
            ]];
        }

        if ($format === 'promo') {
            $offer = trim((string) ($payload['promo_headline'] ?? $headline));
            $badge = trim((string) ($payload['promo_badge'] ?? 'FEATURED OFFER'));
            $points = $payload['points'] ?? [
                'Instant multi-channel publishing to IG, X, LinkedIn & FB',
                '100% deterministic brand consistency & design kits',
                'Eliminate creative bottlenecks with 10x faster output',
            ];

            return [[
                'badge' => $badge.' · '.$pillar,
                'headline' => $offer,
                'points' => is_array($points) ? $points : array_filter(array_map('trim', explode("\n", (string) $points))),
                'body' => $subheadline ?: 'Scale faster and unlock consistent organic growth with our proven AI systems.',
                'footer' => $cta,
            ]];
        }

        if ($format === 'announcement') {
            $tag = trim((string) ($payload['announcement_tag'] ?? 'OFFICIAL RELEASE'));

            return [[
                'badge' => $tag.' · '.$pillar,
                'headline' => $headline,
                'body' => $subheadline ?: 'Exciting updates are live. Experience the new era of autonomous brand publishing with BotifyAI.',
                'footer' => $cta,
            ]];
        }

        if ($format === 'tip') {
            $points = $payload['points'] ?? [
                ['title' => 'Systemize Your Creative Pipeline', 'body' => 'Automate repetitive design production and focus 100% on high-leverage brand strategy.'],
                ['title' => 'Enforce Visual Consistency', 'body' => 'Lock your typography, palette, and tone across every channel effortlessly.'],
                ['title' => 'Compound Organic Distribution', 'body' => 'Publish daily at peak engagement windows to build compounding authority.'],
            ];

            return [[
                'badge' => 'ACTIONABLE FRAMEWORK · '.$pillar,
                'headline' => $headline,
                'points' => $points,
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
            $specs[] = [
                'badge' => 'STEP 03',
                'headline' => 'Analyze Growth & Double Down',
                'body' => 'Study high-performing formats and turn winning posts into automated evergreen loops.',
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
        $badge = htmlspecialchars($slide['badge'] ?? 'GROWTH INSIGHT', ENT_XML1);
        $rawHeadline = (string) ($slide['headline'] ?? 'Key Strategic Takeaway');
        $rawBody = (string) ($slide['body'] ?? '');
        $stat = htmlspecialchars((string) ($slide['stat'] ?? '87%'), ENT_XML1);
        $trend = htmlspecialchars((string) ($slide['trend'] ?? '+4.8X YoY'), ENT_XML1);
        $footerCta = htmlspecialchars($slide['footer'] ?? 'Save for later', ENT_XML1);
        $safeBrand = htmlspecialchars($brandName, ENT_XML1);
        $safeHandle = htmlspecialchars($handle, ENT_XML1);
        $safeWebsite = htmlspecialchars($website ?: 'botify.ai', ENT_XML1);

        // Auto text contrast
        $textPrimary = $this->contrastColor($surfaceHex);
        $isLightCard = ($textPrimary !== '#ffffff');
        $textMuted = $isLightCard ? '#64748b' : '#94a3b8';

        $surfaceGradEnd = $isLightCard
            ? $this->adjustBrightness($surfaceHex, -0.04)
            : $this->adjustBrightness($surfaceHex, -0.16);

        // Detect form factor
        $isLandscape = ($width > $height);              // 16:9 (1200x675)
        $isStory = ($height >= 1800);                   // 9:16 (1080x1920)
        $isPortrait = ($height > $width && ! $isStory); // 4:5 (1080x1350)
        $isSquare = (! $isLandscape && ! $isStory && ! $isPortrait); // 1:1 (1080x1080)

        // Monogram initial
        $monogram = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $brandName) ?: 'B', 0, 1));

        // Proportional geometry settings per aspect ratio
        if ($isLandscape) {
            $cardPadding = 32;
            $contentX = 64;
            $cardRx = 22;

            $avatarCx = 68;
            $avatarCy = 64;
            $avatarR = 20;
            $avatarFontSize = 14;

            $brandNameX = 98;
            $brandNameY = 60;
            $brandNameFontSize = 16;
            $verifiedR = 6;
            $verifiedX = $brandNameX + (int) (strlen($brandName) * 9.2) + 12;
            $verifiedY = 56;
            $handleY = 74;
            $handleFontSize = 12;

            $badgeW = min(320, max(180, (int) (strlen($badge) * 8.5) + 32));
            $badgeH = 30;
            $badgeRx = 15;
            $badgeX = $width - $cardPadding - $badgeW - 16;
            $badgeY = 50;
            $badgeTextX = $badgeX + 24;
            $badgeTextY = $badgeY + 20;
            $badgeDotX = $badgeX + 13;
            $badgeDotY = $badgeY + 15;
            $badgeFontSize = 11;

            $contentStartY = 120;
            $contentAvailH = $height - 120 - 75;

            $footerY = $height - 52;
            $footerSepY = $footerY - 22;
            $footerSepX1 = 64;
            $footerSepX2 = $width - 64;
            $footerBrandY = $footerY;
            $footerFontSize = 13;

            $ctaW = 220;
            $ctaH = 34;
            $ctaRx = 17;
            $ctaX = $width - 64 - $ctaW;
            $ctaY = $footerY - 14;
            $ctaTextX = $ctaX + (int) ($ctaW / 2);
            $ctaTextY = $ctaY + 22;
            $ctaFontSize = 12;
        } elseif ($isStory) {
            $cardPadding = 48;
            $contentX = 96;
            $cardRx = 36;

            $avatarCx = 96;
            $avatarCy = 220;
            $avatarR = 30;
            $avatarFontSize = 20;

            $brandNameX = 140;
            $brandNameY = 214;
            $brandNameFontSize = 24;
            $verifiedR = 8;
            $verifiedX = $brandNameX + (int) (strlen($brandName) * 13.8) + 14;
            $verifiedY = 207;
            $handleY = 238;
            $handleFontSize = 16;

            $badgeW = min(380, max(220, (int) (strlen($badge) * 11) + 40));
            $badgeH = 46;
            $badgeRx = 23;
            $badgeX = $width - $cardPadding - $badgeW - 20;
            $badgeY = 197;
            $badgeTextX = $badgeX + 32;
            $badgeTextY = $badgeY + 28;
            $badgeDotX = $badgeX + 18;
            $badgeDotY = $badgeY + 23;
            $badgeFontSize = 14;

            $contentStartY = 330;
            $contentAvailH = $height - 330 - 240;

            $footerY = $height - 210;
            $footerSepY = $footerY - 36;
            $footerSepX1 = 96;
            $footerSepX2 = $width - 96;
            $footerBrandY = $footerY;
            $footerFontSize = 18;

            $ctaW = 320;
            $ctaH = 58;
            $ctaRx = 29;
            $ctaX = $width - 96 - $ctaW;
            $ctaY = $footerY - 16;
            $ctaTextX = $ctaX + (int) ($ctaW / 2);
            $ctaTextY = $ctaY + 36;
            $ctaFontSize = 17;
        } elseif ($isPortrait) {
            $cardPadding = 48;
            $contentX = 88;
            $cardRx = 30;

            $avatarCx = 88;
            $avatarCy = 95;
            $avatarR = 26;
            $avatarFontSize = 17;

            $brandNameX = 126;
            $brandNameY = 90;
            $brandNameFontSize = 21;
            $verifiedR = 7;
            $verifiedX = $brandNameX + (int) (strlen($brandName) * 12.2) + 14;
            $verifiedY = 84;
            $handleY = 112;
            $handleFontSize = 14;

            $badgeW = min(360, max(200, (int) (strlen($badge) * 10) + 36));
            $badgeH = 40;
            $badgeRx = 20;
            $badgeX = $width - $cardPadding - $badgeW - 16;
            $badgeY = 75;
            $badgeTextX = $badgeX + 28;
            $badgeTextY = $badgeY + 25;
            $badgeDotX = $badgeX + 16;
            $badgeDotY = $badgeY + 20;
            $badgeFontSize = 13;

            $contentStartY = 185;
            $contentAvailH = $height - 185 - 130;

            $footerY = $height - 105;
            $footerSepY = $footerY - 28;
            $footerSepX1 = 88;
            $footerSepX2 = $width - 88;
            $footerBrandY = $footerY;
            $footerFontSize = 16;

            $ctaW = 280;
            $ctaH = 50;
            $ctaRx = 25;
            $ctaX = $width - 88 - $ctaW;
            $ctaY = $footerY - 14;
            $ctaTextX = $ctaX + (int) ($ctaW / 2);
            $ctaTextY = $ctaY + 31;
            $ctaFontSize = 15;
        } else {
            // Square 1:1
            $cardPadding = 48;
            $contentX = 88;
            $cardRx = 28;

            $avatarCx = 88;
            $avatarCy = 92;
            $avatarR = 25;
            $avatarFontSize = 16;

            $brandNameX = 124;
            $brandNameY = 87;
            $brandNameFontSize = 20;
            $verifiedR = 7;
            $verifiedX = $brandNameX + (int) (strlen($brandName) * 11.8) + 14;
            $verifiedY = 81;
            $handleY = 108;
            $handleFontSize = 14;

            $badgeW = min(350, max(190, (int) (strlen($badge) * 9.8) + 34));
            $badgeH = 38;
            $badgeRx = 19;
            $badgeX = $width - $cardPadding - $badgeW - 16;
            $badgeY = 73;
            $badgeTextX = $badgeX + 26;
            $badgeTextY = $badgeY + 24;
            $badgeDotX = $badgeX + 15;
            $badgeDotY = $badgeY + 19;
            $badgeFontSize = 13;

            $contentStartY = 175;
            $contentAvailH = $height - 175 - 120;

            $footerY = $height - 100;
            $footerSepY = $footerY - 26;
            $footerSepX1 = 88;
            $footerSepX2 = $width - 88;
            $footerBrandY = $footerY;
            $footerFontSize = 15;

            $ctaW = 270;
            $ctaH = 46;
            $ctaRx = 23;
            $ctaX = $width - 88 - $ctaW;
            $ctaY = $footerY - 14;
            $ctaTextX = $ctaX + (int) ($ctaW / 2);
            $ctaTextY = $ctaY + 29;
            $ctaFontSize = 14;
        }

        $cardW = $width - ($cardPadding * 2);
        $cardH = $height - ($cardPadding * 2);

        // Dot grid quadrant
        $dotGridW = (int) ($width * 0.35);
        $dotGridH = (int) ($height * 0.28);
        $dotGridX = $width - $dotGridW - 20;
        $dotGridY = 20;

        // Verified Checkmark Path
        $v1x = $verifiedX - (int) ($verifiedR * 0.45);
        $v1y = $verifiedY;
        $v2x = $verifiedX - (int) ($verifiedR * 0.1);
        $v2y = $verifiedY + (int) ($verifiedR * 0.4);
        $v3x = $verifiedX + (int) ($verifiedR * 0.5);
        $v3y = $verifiedY - (int) ($verifiedR * 0.35);
        $verifiedCheckSvg = "M {$v1x} {$v1y} L {$v2x} {$v2y} L {$v3x} {$v3y}";

        // Avatar SVG: Custom logo image or crisp monogram circle
        $avatarInnerSvg = '';
        if ($logoUrl !== '') {
            $safeLogo = htmlspecialchars($logoUrl, ENT_XML1);
            $imgSize = $avatarR * 2 - 4;
            $imgX = $avatarCx - $avatarR + 2;
            $imgY = $avatarCy - $avatarR + 2;
            $avatarInnerSvg = "<image href=\"{$safeLogo}\" x=\"{$imgX}\" y=\"{$imgY}\" width=\"{$imgSize}\" height=\"{$imgSize}\" preserveAspectRatio=\"xMidYMid meet\"/>";
        } else {
            $monogramTextY = $avatarCy + (int) ($avatarFontSize * 0.36);
            $avatarInnerSvg = "<text x=\"{$avatarCx}\" y=\"{$monogramTextY}\" fill=\"#ffffff\" font-family=\"'{$headingFont}', sans-serif\" font-size=\"{$avatarFontSize}\" font-weight=\"900\" text-anchor=\"middle\">{$monogram}</text>";
        }

        // Watermark element
        $watermarkSvg = '';
        if ($watermarkUrl !== '') {
            $safeWm = htmlspecialchars($watermarkUrl, ENT_XML1);
            $wmOp = round($watermarkOpacity / 100, 2);
            $wmW = $isLandscape ? 70 : ($isStory ? 120 : 90);
            $wmH = $wmW;
            $wmX = $watermarkPosition === 'bottom-left' ? $contentX : ($width - $cardPadding - $wmW - 20);
            $wmY = str_contains($watermarkPosition, 'top') ? $contentStartY : ($footerSepY - $wmH - 15);
            $watermarkSvg = "<image href=\"{$safeWm}\" x=\"{$wmX}\" y=\"{$wmY}\" width=\"{$wmW}\" height=\"{$wmH}\" opacity=\"{$wmOp}\" preserveAspectRatio=\"xMidYMid meet\"/>";
        }

        // =========================================================================
        // ARCHETYPE CONTENT GENERATION
        // =========================================================================
        $contentSvg = '';
        $cardBoxW = $cardW - (($contentX - $cardPadding) * 2);

        if ($format === 'quote') {
            $quoteText = (string) ($slide['quote'] ?? $rawHeadline);
            $authorName = htmlspecialchars((string) ($slide['author'] ?? $brandName), ENT_XML1);
            $authorTitle = htmlspecialchars((string) ($slide['author_title'] ?? 'Founder & Strategist'), ENT_XML1);

            $quoteSize = $isLandscape ? 28 : ($isStory ? 48 : 38);
            $quoteLineStep = (int) ($quoteSize * 1.32);
            $quoteWrap = $isLandscape ? 38 : ($isStory ? 24 : 26);
            $maxQuoteLines = $isLandscape ? 3 : 5;

            $quoteGlyphSize = $isLandscape ? 70 : ($isStory ? 140 : 100);
            $quoteGlyphY = $contentStartY + ($isLandscape ? 20 : 45);

            [$quoteLines, $nextY, $lineCount] = $this->renderTspans($quoteText, $quoteWrap, $maxQuoteLines, $contentX, $quoteGlyphY + ($isLandscape ? 30 : 50), $quoteLineStep);

            // Divider with center star
            $divY = $nextY + ($isLandscape ? 15 : 24);
            $divW = (int) ($cardBoxW * 0.4);
            $divX2 = $contentX + $divW;
            $starX = $divX2 + 18;

            // Author Box
            $authorBoxY = $divY + ($isLandscape ? 18 : 28);
            $authorBoxH = $isLandscape ? 50 : 64;
            $authorBoxW = min($cardBoxW, $isLandscape ? 400 : 500);
            $authorNameY = $authorBoxY + ($isLandscape ? 24 : 30);
            $authorTitleY = $authorBoxY + ($isLandscape ? 40 : 50);
            $authorNameSize = $isLandscape ? 14 : 17;
            $authorTitleSize = $isLandscape ? 11 : 13;

            $contentSvg = <<<SVG
  <!-- Quotation Mark Glyph -->
  <text x="{$contentX}" y="{$quoteGlyphY}" font-family="Georgia, serif" font-size="{$quoteGlyphSize}" font-weight="900" fill="url(#accentGlow)" opacity="0.32">“</text>

  <!-- Quote Typography -->
  <text class="font-heading" font-size="{$quoteSize}" font-style="italic" font-weight="600" fill="{$textPrimary}">
    {$quoteLines}
  </text>

  <!-- Divider & Star Glyph -->
  <line x1="{$contentX}" y1="{$divY}" x2="{$divX2}" y2="{$divY}" stroke="url(#accentGlow)" stroke-width="2"/>
  <text x="{$starX}" y="{$divY + 4}" fill="{$accentHex}" font-size="14" text-anchor="middle">✦</text>

  <!-- Author Attribution Capsule -->
  <rect x="{$contentX}" y="{$authorBoxY}" width="{$authorBoxW}" height="{$authorBoxH}" rx="16" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.08)"/>
  <circle cx="{$contentX + 28}" cy="{$authorBoxY + (int)($authorBoxH / 2)}" r="14" fill="url(#accentGlow)"/>
  <text x="{$contentX + 28}" y="{$authorBoxY + (int)($authorBoxH / 2) + 5}" fill="#ffffff" font-family="'{$headingFont}', sans-serif" font-size="12" font-weight="900" text-anchor="middle">{$monogram}</text>
  <text x="{$contentX + 54}" y="{$authorNameY}" fill="{$textPrimary}" class="font-heading" font-size="{$authorNameSize}" font-weight="700">{$authorName}</text>
  <text x="{$contentX + 54}" y="{$authorTitleY}" fill="{$textMuted}" class="font-body" font-size="{$authorTitleSize}" font-weight="500">{$authorTitle}</text>
SVG;
        } elseif ($format === 'data') {
            $takeawayText = (string) ($slide['takeaway'] ?? $rawBody);

            $statBoxH = $isLandscape ? 72 : ($isStory ? 130 : 96);
            $statBoxW = $isLandscape ? 280 : ($isStory ? 440 : 340);
            $statBoxY = $contentStartY;

            $statNumSize = $isLandscape ? 48 : ($isStory ? 84 : 64);
            $statNumX = $contentX + 24;
            $statNumY = $statBoxY + ($isLandscape ? 52 : ($isStory ? 90 : 70));

            $trendChipW = $isLandscape ? 105 : 130;
            $trendChipH = $isLandscape ? 26 : 32;
            $trendChipX = $contentX + $statBoxW - $trendChipW - 16;
            $trendChipY = $statBoxY + (int) (($statBoxH - $trendChipH) / 2);
            $trendTextX = $trendChipX + (int) ($trendChipW / 2);
            $trendTextY = $trendChipY + ($isLandscape ? 17 : 21);
            $trendFontSize = $isLandscape ? 11 : 13;

            // Headline below stat
            $headlineY = $statBoxY + $statBoxH + ($isLandscape ? 24 : 36);
            $headSize = $isLandscape ? 26 : ($isStory ? 46 : 36);
            $headLineStep = (int) ($headSize * 1.28);
            $headWrap = $isLandscape ? 44 : ($isStory ? 25 : 28);
            [$headLines, $afterHeadY] = $this->renderTspans($rawHeadline, $headWrap, $isLandscape ? 2 : 3, $contentX, $headlineY, $headLineStep);

            // Takeaway capsule
            $takeawayBoxY = $afterHeadY + ($isLandscape ? 14 : 24);
            $takeawayBoxH = $isLandscape ? 56 : ($isStory ? 100 : 78);
            $takeawayBadgeY = $takeawayBoxY + ($isLandscape ? 20 : 26);
            $takeawayTextY = $takeawayBoxY + ($isLandscape ? 38 : 54);
            $takeawayFontSize = $isLandscape ? 12 : 15;
            $takeawayWrap = $isLandscape ? 62 : 40;
            [$takeawayLines] = $this->renderTspans($takeawayText, $takeawayWrap, 2, $contentX + 18, $takeawayTextY, (int) ($takeawayFontSize * 1.3));

            $contentSvg = <<<SVG
  <!-- Hero Stat Box -->
  <rect x="{$contentX}" y="{$statBoxY}" width="{$statBoxW}" height="{$statBoxH}" rx="18" fill="rgba(255,255,255,0.035)" stroke="{$accentHex}" stroke-opacity="0.35" stroke-width="1.5"/>
  <text x="{$statNumX}" y="{$statNumY}" font-family="'{$headingFont}', sans-serif" font-size="{$statNumSize}" font-weight="900" fill="url(#accentGlow)">{$stat}</text>

  <!-- Trend Pill -->
  <rect x="{$trendChipX}" y="{$trendChipY}" width="{$trendChipW}" height="{$trendChipH}" rx="{$trendChipH / 2}" fill="#10b981" fill-opacity="0.18" stroke="#10b981" stroke-opacity="0.4" stroke-width="1.2"/>
  <text x="{$trendTextX}" y="{$trendTextY}" fill="#34d399" class="font-heading" font-size="{$trendFontSize}" font-weight="800" text-anchor="middle">▲ {$trend}</text>

  <!-- Headline -->
  <text class="font-heading" font-size="{$headSize}" font-weight="800" fill="{$textPrimary}">
    {$headLines}
  </text>

  <!-- Analytical Takeaway Box -->
  <rect x="{$contentX}" y="{$takeawayBoxY}" width="{$cardBoxW}" height="{$takeawayBoxH}" rx="16" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.08)"/>
  <text x="{$contentX + 18}" y="{$takeawayBadgeY}" fill="{$accentHex}" class="font-heading" font-size="11" font-weight="800" letter-spacing="1">VERIFIED BENCHMARK ↗</text>
  <text class="font-body" font-size="{$takeawayFontSize}" fill="{$textMuted}">
    {$takeawayLines}
  </text>
SVG;
        } elseif ($format === 'promo') {
            $promoBadgeY = $contentStartY;
            $promoBadgeW = 210;
            $promoBadgeH = 28;

            $headSize = $isLandscape ? 28 : ($isStory ? 48 : 38);
            $headLineStep = (int) ($headSize * 1.28);
            $headWrap = $isLandscape ? 40 : ($isStory ? 24 : 26);
            $headStartY = $promoBadgeY + $promoBadgeH + ($isLandscape ? 24 : 32);

            [$headLines, $afterHeadY] = $this->renderTspans($rawHeadline, $headWrap, 2, $contentX, $headStartY, $headLineStep);

            // Value Stack Rows
            $points = $slide['points'] ?? [
                'Instant multi-channel publishing to IG, X, LinkedIn & FB',
                '100% deterministic brand consistency & design kits',
                'Eliminate creative bottlenecks with 10x faster output',
            ];

            $stackStartY = $afterHeadY + ($isLandscape ? 16 : 26);
            $rowH = $isLandscape ? 38 : ($isStory ? 66 : 52);
            $rowGap = $isLandscape ? 8 : 12;
            $bulletSvg = '';

            foreach (array_slice($points, 0, $isLandscape ? 2 : 3) as $idx => $pt) {
                $curRowY = $stackStartY + ($idx * ($rowH + $rowGap));
                $iconCy = $curRowY + (int) ($rowH / 2);
                $iconCx = $contentX + 22;
                $textX = $contentX + 44;
                $textY = $curRowY + (int) ($rowH / 2) + 5;
                $rowFontSize = $isLandscape ? 12 : 15;
                $safePt = htmlspecialchars(is_array($pt) ? ($pt['title'] ?? '') : (string) $pt, ENT_XML1);

                $bulletSvg .= <<<SVG
  <rect x="{$contentX}" y="{$curRowY}" width="{$cardBoxW}" height="{$rowH}" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)"/>
  <circle cx="{$iconCx}" cy="{$iconCy}" r="10" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-opacity="0.5"/>
  <path d="M {$iconCx - 4} {$iconCy} L {$iconCx - 1} {$iconCy + 3} L {$iconCx + 4} {$iconCy - 3}" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>
  <text x="{$textX}" y="{$textY}" fill="{$textPrimary}" class="font-body" font-size="{$rowFontSize}" font-weight="500">{$safePt}</text>
SVG;
            }

            $contentSvg = <<<SVG
  <!-- Urgency Tag -->
  <rect x="{$contentX}" y="{$promoBadgeY}" width="{$promoBadgeW}" height="{$promoBadgeH}" rx="{$promoBadgeH / 2}" fill="url(#accentGlow)"/>
  <text x="{$contentX + (int)($promoBadgeW / 2)}" y="{$promoBadgeY + 19}" fill="#ffffff" class="font-heading" font-size="11" font-weight="800" letter-spacing="1" text-anchor="middle">✦ SPECIAL LAUNCH ACCESS</text>

  <!-- Headline -->
  <text class="font-heading" font-size="{$headSize}" font-weight="800" fill="{$textPrimary}">
    {$headLines}
  </text>

  <!-- Value Stack Checklist -->
  {$bulletSvg}
SVG;
        } elseif ($format === 'announcement') {
            $badgeY = $contentStartY;
            $badgeW = 190;
            $badgeH = 30;

            $headSize = $isLandscape ? 28 : ($isStory ? 48 : 38);
            $headLineStep = (int) ($headSize * 1.28);
            $headWrap = $isLandscape ? 40 : ($isStory ? 24 : 26);
            $headStartY = $badgeY + $badgeH + ($isLandscape ? 24 : 32);

            [$headLines, $afterHeadY] = $this->renderTspans($rawHeadline, $headWrap, 2, $contentX, $headStartY, $headLineStep);

            $boxY = $afterHeadY + ($isLandscape ? 16 : 28);
            $boxH = $isLandscape ? 70 : ($isStory ? 140 : 100);
            $bodySize = $isLandscape ? 13 : 16;
            $bodyWrap = $isLandscape ? 60 : 38;
            [$bodyLines] = $this->renderTspans($rawBody, $bodyWrap, $isLandscape ? 2 : 4, $contentX + 22, $boxY + ($isLandscape ? 28 : 38), (int) ($bodySize * 1.38));

            $contentSvg = <<<SVG
  <!-- Announcement Beacon Badge -->
  <rect x="{$contentX}" y="{$badgeY}" width="{$badgeW}" height="{$badgeH}" rx="{$badgeH / 2}" fill="{$primaryHex}" fill-opacity="0.18" stroke="{$primaryHex}" stroke-opacity="0.4"/>
  <circle cx="{$contentX + 16}" cy="{$badgeY + (int)($badgeH / 2)}" r="4" fill="#10b981"/>
  <text x="{$contentX + 28}" y="{$badgeY + (int)($badgeH / 2) + 4}" fill="{$accentHex}" class="font-heading" font-size="11" font-weight="800" letter-spacing="1">OFFICIAL UPDATE</text>

  <!-- Headline -->
  <text class="font-heading" font-size="{$headSize}" font-weight="800" fill="{$textPrimary}">
    {$headLines}
  </text>

  <!-- Feature Highlights Box -->
  <rect x="{$contentX}" y="{$boxY}" width="{$cardBoxW}" height="{$boxH}" rx="18" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.08)"/>
  <text class="font-body" font-size="{$bodySize}" fill="{$textMuted}">
    {$bodyLines}
  </text>
SVG;
        } elseif ($format === 'carousel') {
            $progressTrackW = $cardBoxW;
            $progressH = 4;
            $progressY = $contentStartY;
            $progressFilledW = (int) ($progressTrackW * ($slideNumber / max(1, $totalSlides)));

            $headSize = $isLandscape ? 28 : ($isStory ? 48 : 38);
            $headLineStep = (int) ($headSize * 1.28);
            $headWrap = $isLandscape ? 40 : ($isStory ? 24 : 26);
            $headStartY = $progressY + 36;

            [$headLines, $afterHeadY] = $this->renderTspans($rawHeadline, $headWrap, 2, $contentX, $headStartY, $headLineStep);

            $bodyBoxY = $afterHeadY + ($isLandscape ? 16 : 28);
            $bodyBoxH = $isLandscape ? 70 : ($isStory ? 130 : 96);
            $bodySize = $isLandscape ? 13 : 16;
            $bodyWrap = $isLandscape ? 60 : 38;
            [$bodyLines] = $this->renderTspans($rawBody, $bodyWrap, $isLandscape ? 2 : 4, $contentX + 22, $bodyBoxY + ($isLandscape ? 28 : 36), (int) ($bodySize * 1.38));

            $swipeW = 200;
            $swipeH = 34;
            $swipeY = $bodyBoxY + $bodyBoxH + ($isLandscape ? 14 : 24);

            $contentSvg = <<<SVG
  <!-- Progress Bar across Card -->
  <rect x="{$contentX}" y="{$progressY}" width="{$progressTrackW}" height="{$progressH}" rx="2" fill="rgba(255,255,255,0.1)"/>
  <rect x="{$contentX}" y="{$progressY}" width="{$progressFilledW}" height="{$progressH}" rx="2" fill="url(#accentGlow)"/>

  <!-- Headline -->
  <text class="font-heading" font-size="{$headSize}" font-weight="800" fill="{$textPrimary}">
    {$headLines}
  </text>

  <!-- Takeaway Card -->
  <rect x="{$contentX}" y="{$bodyBoxY}" width="{$cardBoxW}" height="{$bodyBoxH}" rx="18" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.08)"/>
  <text class="font-body" font-size="{$bodySize}" fill="{$textMuted}">
    {$bodyLines}
  </text>

  <!-- Swipe Indicator Pill -->
  <rect x="{$contentX}" y="{$swipeY}" width="{$swipeW}" height="{$swipeH}" rx="{$swipeH / 2}" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
  <text x="{$contentX + (int)($swipeW / 2)}" y="{$swipeY + 22}" fill="{$textPrimary}" class="font-heading" font-size="12" font-weight="700" text-anchor="middle">SWIPE TO EXPLORE ➔</text>
SVG;
        } else {
            // TIP / ACTIONABLE FRAMEWORK
            $headSize = $isLandscape ? 28 : ($isStory ? 46 : 36);
            $headLineStep = (int) ($headSize * 1.28);
            $headWrap = $isLandscape ? 40 : ($isStory ? 24 : 26);
            $headStartY = $contentStartY;

            [$headLines, $afterHeadY] = $this->renderTspans($rawHeadline, $headWrap, 2, $contentX, $headStartY, $headLineStep);

            // 3 Framework Steps
            $points = $slide['points'] ?? [
                ['title' => 'Systemize Your Creative Pipeline', 'body' => 'Automate design production to focus 100% on high-leverage brand strategy.'],
                ['title' => 'Enforce Visual Consistency', 'body' => 'Lock your typography, palette, and tone across every channel effortlessly.'],
                ['title' => 'Compound Organic Distribution', 'body' => 'Publish daily at peak engagement windows to build compounding authority.'],
            ];

            $stepCount = $isLandscape ? 2 : min(3, count($points));
            $stepBoxH = $isLandscape ? 48 : ($isStory ? 90 : 70);
            $stepGap = $isLandscape ? 10 : 14;
            $stepStartY = $afterHeadY + ($isLandscape ? 16 : 24);

            $stepSvg = '';
            foreach (array_slice($points, 0, $stepCount) as $idx => $pt) {
                $curStepY = $stepStartY + ($idx * ($stepBoxH + $stepGap));
                $ptTitle = htmlspecialchars(is_array($pt) ? ($pt['title'] ?? 'Point #'.($idx + 1)) : (string) $pt, ENT_XML1);
                $ptBody = htmlspecialchars(is_array($pt) ? ($pt['body'] ?? '') : '', ENT_XML1);

                $iconCy = $curStepY + (int) ($stepBoxH / 2);
                $iconCx = $contentX + 24;
                $iconR = $isLandscape ? 12 : 16;
                $numY = $iconCy + ($isLandscape ? 4 : 5);

                $textX = $contentX + 50;
                $titleY = $curStepY + ($isLandscape ? 20 : 28);
                $descY = $curStepY + ($isLandscape ? 36 : 52);
                $titleSize = $isLandscape ? 13 : 16;
                $descSize = $isLandscape ? 11 : 13;

                $stepNum = sprintf('%02d', $idx + 1);

                $stepSvg .= <<<SVG
  <rect x="{$contentX}" y="{$curStepY}" width="{$cardBoxW}" height="{$stepBoxH}" rx="14" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.08)"/>
  <circle cx="{$iconCx}" cy="{$iconCy}" r="{$iconR}" fill="url(#accentGlow)"/>
  <text x="{$iconCx}" y="{$numY}" fill="#ffffff" class="font-heading" font-size="{$iconR * 0.75}" font-weight="900" text-anchor="middle">{$stepNum}</text>
  <text x="{$textX}" y="{$titleY}" fill="{$textPrimary}" class="font-heading" font-size="{$titleSize}" font-weight="700">{$ptTitle}</text>
  <text x="{$textX}" y="{$descY}" fill="{$textMuted}" class="font-body" font-size="{$descSize}" font-weight="400">{$ptBody}</text>
SVG;
            }

            $contentSvg = <<<SVG
  <!-- Main Hook Headline -->
  <text class="font-heading" font-size="{$headSize}" font-weight="800" fill="{$textPrimary}">
    {$headLines}
  </text>

  <!-- Framework Step Cards -->
  {$stepSvg}
SVG;
        }

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="{$width}" height="{$height}" viewBox="0 0 {$width} {$height}" preserveAspectRatio="xMidYMid meet">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Montserrat:wght@600;700;800;900&amp;family=Outfit:wght@600;700;800;900&amp;family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&amp;family=Poppins:wght@600;700;800;900&amp;family=Space+Grotesk:wght@600;700&amp;display=swap');
      .font-heading { font-family: '{$headingFont}', -apple-system, BlinkMacSystemFont, sans-serif; }
      .font-body { font-family: '{$bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif; }
    </style>
    <radialGradient id="meshSpot1" cx="85%" cy="12%" r="65%">
      <stop offset="0%" stop-color="{$primaryHex}" stop-opacity="0.28"/>
      <stop offset="60%" stop-color="{$primaryHex}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="{$primaryHex}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="meshSpot2" cx="15%" cy="88%" r="60%">
      <stop offset="0%" stop-color="{$accentHex}" stop-opacity="0.22"/>
      <stop offset="60%" stop-color="{$accentHex}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="{$accentHex}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cardSurfaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{$surfaceHex}" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="{$surfaceGradEnd}" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="cardBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{$primaryHex}" stop-opacity="0.5"/>
      <stop offset="45%" stop-color="rgba(255,255,255,0.15)"/>
      <stop offset="100%" stop-color="{$accentHex}" stop-opacity="0.35"/>
    </linearGradient>
    <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{$primaryHex}"/>
      <stop offset="100%" stop-color="{$accentHex}"/>
    </linearGradient>
    <linearGradient id="dividerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{$primaryHex}" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="{$accentHex}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.05)"/>
    </linearGradient>
    <pattern id="dotPattern" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="{$primaryHex}" fill-opacity="0.14"/>
    </pattern>
    <filter id="cardElevation" x="-8%" y="-8%" width="116%" height="116%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.45"/>
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="{$primaryHex}" flood-opacity="0.10"/>
    </filter>
  </defs>

  <!-- Canvas Outer Fill -->
  <rect width="{$width}" height="{$height}" fill="{$bgHex}"/>

  <!-- Ambient Mesh Spotlights -->
  <rect width="{$width}" height="{$height}" fill="url(#meshSpot1)"/>
  <rect width="{$width}" height="{$height}" fill="url(#meshSpot2)"/>

  <!-- Geometric Dot Grid in corner quadrant -->
  <rect x="{$dotGridX}" y="{$dotGridY}" width="{$dotGridW}" height="{$dotGridH}" fill="url(#dotPattern)" opacity="0.8"/>

  <!-- Top Accent Bar -->
  <rect width="{$width}" height="6" fill="url(#accentGlow)"/>

  <!-- Main Floating Glass Card -->
  <rect x="{$cardPadding}" y="{$cardPadding}" width="{$cardW}" height="{$cardH}" rx="{$cardRx}" fill="url(#cardSurfaceGrad)" filter="url(#cardElevation)"/>
  <rect x="{$cardPadding}" y="{$cardPadding}" width="{$cardW}" height="{$cardH}" rx="{$cardRx}" fill="none" stroke="url(#cardBorderGrad)" stroke-width="1.5"/>

  <!-- Top Brand Lockup (Avatar Monogram + Brand Name + Verified Badge + Handle) -->
  <g>
    <circle cx="{$avatarCx}" cy="{$avatarCy}" r="{$avatarR}" fill="none" stroke="url(#accentGlow)" stroke-width="2.5"/>
    <circle cx="{$avatarCx}" cy="{$avatarCy}" r="{$avatarR - 2}" fill="{$secondaryHex}"/>
    {$avatarInnerSvg}

    <text x="{$brandNameX}" y="{$brandNameY}" fill="{$textPrimary}" class="font-heading" font-size="{$brandNameFontSize}" font-weight="800">{$safeBrand}</text>
    <circle cx="{$verifiedX}" cy="{$verifiedY}" r="{$verifiedR}" fill="#0284c7"/>
    <path d="{$verifiedCheckSvg}" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>

    <text x="{$brandNameX}" y="{$handleY}" fill="{$textMuted}" class="font-body" font-size="{$handleFontSize}" font-weight="500">{$safeHandle}</text>
  </g>

  <!-- Category Pillar Badge (Top Right) -->
  <g>
    <rect x="{$badgeX}" y="{$badgeY}" width="{$badgeW}" height="{$badgeH}" rx="{$badgeRx}" fill="{$primaryHex}" fill-opacity="0.14" stroke="{$primaryHex}" stroke-opacity="0.38" stroke-width="1.2"/>
    <circle cx="{$badgeDotX}" cy="{$badgeDotY}" r="3.5" fill="{$accentHex}"/>
    <text x="{$badgeTextX}" y="{$badgeTextY}" fill="{$accentHex}" class="font-heading" font-size="{$badgeFontSize}" font-weight="800" letter-spacing="1.5">{$badge}</text>
  </g>

  <!-- Watermark -->
  {$watermarkSvg}

  <!-- Archetype Core Content Region -->
  {$contentSvg}

  <!-- Footer Signature & Divider -->
  <line x1="{$footerSepX1}" y1="{$footerSepY}" x2="{$footerSepX2}" y2="{$footerSepY}" stroke="url(#dividerGrad)" stroke-width="1.2"/>

  <!-- Footer Brand / Website Pill -->
  <text x="{$contentX}" y="{$footerBrandY}" fill="{$textMuted}" class="font-body" font-size="{$footerFontSize}" font-weight="600">
    <tspan fill="{$primaryHex}">✦</tspan> {$safeWebsite} <tspan fill="{$textMuted}" opacity="0.4">·</tspan> {$safeHandle}
  </text>

  <!-- Footer Action Button -->
  <rect x="{$ctaX}" y="{$ctaY}" width="{$ctaW}" height="{$ctaH}" rx="{$ctaRx}" fill="url(#accentGlow)"/>
  <text x="{$ctaTextX}" y="{$ctaTextY}" fill="#ffffff" class="font-heading" font-size="{$ctaFontSize}" font-weight="700" text-anchor="middle">{$footerCta} ↗</text>
</svg>
SVG;
    }

    /**
     * Helper to wrap text into SVG tspan lines and track the cursor Y.
     *
     * @return array{0: string, 1: int, 2: int}
     */
    private function renderTspans(string $text, int $maxChars, int $maxLines, int $x, int $startY, int $lineStep): array
    {
        $escaped = htmlspecialchars($text, ENT_XML1);
        $lines = explode("\n", wordwrap($escaped, $maxChars, "\n", true));
        $lines = array_slice($lines, 0, $maxLines);

        $svg = '';
        $curY = $startY;
        foreach ($lines as $line) {
            $svg .= "<tspan x=\"{$x}\" y=\"{$curY}\">{$line}</tspan>";
            $curY += $lineStep;
        }

        return [$svg, $curY, count($lines)];
    }

    private function adjustBrightness(string $hex, float $percent): string
    {
        $rgb = $this->hexToRgb($hex);
        $r = max(0, min(255, (int) ($rgb[0] * (1 + $percent))));
        $g = max(0, min(255, (int) ($rgb[1] * (1 + $percent))));
        $b = max(0, min(255, (int) ($rgb[2] * (1 + $percent))));

        return sprintf('#%02x%02x%02x', $r, $g, $b);
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
