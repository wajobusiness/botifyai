<?php

namespace App\Modules\Social\Services;

use App\Models\Media;
use App\Models\Workspace;
use App\Modules\Social\Models\WorkspaceBrandProfile;
use App\Services\StorageManager;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Lightweight, zero-Chromium deterministic branded graphic & carousel generator.
 *
 * Uses native PHP GD (with SVG fallback) to render 1080x1080 branded quote cards,
 * promotional graphics, insight tips, and multi-slide educational carousels using
 * the workspace's brand colors and typography — consuming < 8 MB RAM on WHM servers.
 */
class BrandedGraphicService
{
    public function __construct(private readonly StorageManager $storageManager) {}

    /**
     * Render one or more branded social graphics (1080x1080) and persist them to Media library.
     *
     * @param  array<string, mixed>  $payload
     * @return array{urls: list<string>, primary_url: string, format: string, slide_count: int}
     */
    public function render(int $workspaceId, string $template, array $payload = []): array
    {
        $profile = WorkspaceBrandProfile::forWorkspace($workspaceId);
        $workspace = Workspace::find($workspaceId);

        $brandName = trim((string) ($payload['brand_name'] ?? $profile->brand_name ?? $workspace?->name ?? config('app.name', 'Brand')));
        $primaryHex = (string) ($payload['primary_color'] ?? $profile->primaryColor());
        $secondaryHex = (string) ($payload['secondary_color'] ?? $profile->secondaryColor());
        $bgHex = (string) ($payload['bg_color'] ?? $profile->backgroundColor());

        $format = $this->resolveTemplate($template, $payload);
        $pillar = strtoupper(trim((string) ($payload['pillar'] ?? $payload['content_pillar'] ?? $profile->niche ?? 'INSIGHT')));
        $cta = trim((string) ($payload['cta_text'] ?? ($profile->cta_templates[0] ?? 'Follow for more insights')));

        $slides = $this->buildSlideSpecs($format, $payload, $pillar, $brandName, $cta);

        $urls = [];
        $totalSlides = count($slides);
        foreach ($slides as $idx => $slide) {
            $urls[] = $this->renderAndStoreSlide(
                $workspaceId,
                $format,
                $slide,
                $idx + 1,
                $totalSlides,
                $brandName,
                $primaryHex,
                $secondaryHex,
                $bgHex
            );
        }

        return [
            'urls' => $urls,
            'primary_url' => $urls[0] ?? '',
            'format' => $format,
            'slide_count' => count($urls),
        ];
    }

    private function resolveTemplate(string $template, array $payload): string
    {
        $template = strtolower(trim($template));
        if (in_array($template, ['quote', 'carousel', 'promo', 'tip'], true)) {
            return $template;
        }

        // Auto-select based on day of week or payload hints
        $day = strtolower((string) ($payload['day_of_week'] ?? now()->englishDayOfWeek));
        if ($day === 'monday' || $day === 'mon') {
            return 'quote';
        }
        if ($day === 'friday' || $day === 'fri') {
            return 'promo';
        }
        if (! empty($payload['slides']) && is_array($payload['slides']) && count($payload['slides']) > 1) {
            return 'carousel';
        }

        return 'carousel';
    }

    /**
     * @return list<array{badge: string, headline: string, body: string, footer: string}>
     */
    private function buildSlideSpecs(string $format, array $payload, string $pillar, string $brandName, string $cta): array
    {
        $headline = trim((string) ($payload['headline'] ?? $payload['topic'] ?? 'Key Industry Insight'));
        $subheadline = trim((string) ($payload['subheadline'] ?? $payload['hook'] ?? $payload['angle'] ?? ''));

        if ($format === 'quote') {
            $quote = trim((string) ($payload['quote_text'] ?? $subheadline ?: $headline));

            return [[
                'badge' => 'MONDAY MOTIVATION · '.$pillar,
                'headline' => '“'.trim($quote, '“”"').'”',
                'body' => '— '.$brandName,
                'footer' => $cta,
            ]];
        }

        if ($format === 'promo') {
            $offer = trim((string) ($payload['promo_headline'] ?? $headline));
            $details = trim((string) ($payload['promo_body'] ?? $subheadline ?: 'Ready to scale faster? Discover how we help growing businesses win.'));

            return [[
                'badge' => 'SPECIAL OFFER · '.$pillar,
                'headline' => $offer,
                'body' => $details,
                'footer' => $cta,
            ]];
        }

        if ($format === 'tip') {
            return [[
                'badge' => $pillar,
                'headline' => $headline,
                'body' => $subheadline,
                'footer' => $cta,
            ]];
        }

        // Carousel (3–5 slides)
        $rawSlides = $payload['slides'] ?? [];
        if (is_string($rawSlides) && $rawSlides !== '') {
            $decoded = json_decode($rawSlides, true);
            $rawSlides = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode("\n", $rawSlides)));
        }

        $specs = [];
        // Cover slide
        $specs[] = [
            'badge' => $pillar.' · SWIPE →',
            'headline' => $headline,
            'body' => $subheadline ?: 'Swipe through to learn the key takeaways.',
            'footer' => $brandName,
        ];

        if (is_array($rawSlides) && ! empty($rawSlides)) {
            foreach (array_slice($rawSlides, 0, 4) as $i => $s) {
                if (is_array($s)) {
                    $specs[] = [
                        'badge' => 'STEP 0'.($i + 1),
                        'headline' => (string) ($s['title'] ?? $s['headline'] ?? 'Key Point #'.($i + 1)),
                        'body' => (string) ($s['body'] ?? $s['description'] ?? ''),
                        'footer' => $brandName,
                    ];
                } else {
                    $parts = array_pad(explode('|', (string) $s, 2), 2, '');
                    $specs[] = [
                        'badge' => 'POINT 0'.($i + 1),
                        'headline' => trim($parts[0]) ?: 'Key Takeaway #'.($i + 1),
                        'body' => trim($parts[1]),
                        'footer' => $brandName,
                    ];
                }
            }
        } else {
            $specs[] = [
                'badge' => 'KEY TAKEAWAY 01',
                'headline' => 'Focus on High-Leverage Execution',
                'body' => $subheadline ?: 'Consistent, structured execution compounds faster than sporadic bursts.',
                'footer' => $brandName,
            ];
            $specs[] = [
                'badge' => 'NEXT STEPS',
                'headline' => 'Save & Share This Guide',
                'body' => $cta,
                'footer' => $brandName,
            ];
        }

        return $specs;
    }

    private function renderAndStoreSlide(
        int $workspaceId,
        string $format,
        array $slide,
        int $slideNumber,
        int $totalSlides,
        string $brandName,
        string $primaryHex,
        string $secondaryHex,
        string $bgHex
    ): string {
        $diskName = $this->storageManager->diskName();

        if (function_exists('imagecreatetruecolor')) {
            $binary = $this->renderPngWithGd($format, $slide, $slideNumber, $totalSlides, $brandName, $primaryHex, $secondaryHex, $bgHex);
            $ext = 'png';
            $mime = 'image/png';
        } else {
            $binary = $this->renderSvgFallback($format, $slide, $slideNumber, $totalSlides, $brandName, $primaryHex, $secondaryHex, $bgHex);
            $ext = 'svg';
            $mime = 'image/svg+xml';
        }

        $filename = "social-{$format}-{$slideNumber}-".Str::random(8).".{$ext}";
        $rawPath = 'media/social-graphics/'.Str::uuid().'.'.$ext;
        $path = $this->storageManager->prefixedPath($rawPath);

        Storage::disk($diskName)->put($path, $binary);

        $media = Media::create([
            'mediable_type' => Workspace::class,
            'mediable_id' => $workspaceId,
            'disk' => $diskName,
            'path' => $path,
            'filename' => $filename,
            'mime_type' => $mime,
            'size_bytes' => strlen($binary),
            'collection' => 'social',
            'meta' => [
                'format' => $format,
                'slide' => $slideNumber,
                'total_slides' => $totalSlides,
            ],
        ]);

        return $media->url();
    }

    private function renderPngWithGd(
        string $format,
        array $slide,
        int $slideNumber,
        int $totalSlides,
        string $brandName,
        string $primaryHex,
        string $secondaryHex,
        string $bgHex
    ): string {
        $w = 1080;
        $h = 1080;
        $im = imagecreatetruecolor($w, $h);

        [$pr, $pg, $pb] = $this->hexToRgb($primaryHex);
        [$sr, $sg, $sb] = $this->hexToRgb($secondaryHex);
        [$br, $bg, $bb] = $this->hexToRgb($bgHex);

        $primaryCol = imagecolorallocate($im, $pr, $pg, $pb);
        $secondaryCol = imagecolorallocate($im, $sr, $sg, $sb);
        $bgCol = imagecolorallocate($im, $br, $bg, $bb);
        $white = imagecolorallocate($im, 255, 255, 255);
        $muted = imagecolorallocate($im, 148, 163, 184);

        // Dark background for quote/promo, light/secondary card for carousel
        $isDarkTheme = in_array($format, ['quote', 'promo'], true) || ($slideNumber === 1 && $format === 'carousel');
        imagefilledrectangle($im, 0, 0, $w, $h, $isDarkTheme ? $secondaryCol : $bgCol);

        // Top & bottom brand accent bars
        imagefilledrectangle($im, 0, 0, $w, 24, $primaryCol);
        imagefilledrectangle($im, 0, $h - 18, $w, $h, $primaryCol);

        // Inner card frame
        $cardBg = $isDarkTheme ? imagecolorallocate($im, max(0, $sr + 12), max(0, $sg + 16), max(0, $sb + 24)) : $white;
        imagefilledrectangle($im, 70, 90, $w - 70, $h - 90, $cardBg);
        imagefilledrectangle($im, 70, 90, 84, $h - 90, $primaryCol);

        // Badge pill
        imagefilledrectangle($im, 120, 140, 620, 192, $primaryCol);
        $this->drawScaledText($im, strtoupper(mb_substr($slide['badge'], 0, 36)), 140, 156, $white, 2);

        // Slide counter on top right if multi-slide
        if ($totalSlides > 1) {
            $counterText = "{$slideNumber} / {$totalSlides}";
            $this->drawScaledText($im, $counterText, $w - 220, 156, $muted, 2);
        }

        // Main Headline (wrapped & scaled)
        $textCol = $isDarkTheme ? $white : $secondaryCol;
        $bodyCol = $isDarkTheme ? imagecolorallocate($im, 203, 213, 225) : imagecolorallocate($im, 71, 85, 105);

        $headlineLines = explode("\n", wordwrap($this->asciiClean($slide['headline']), 26, "\n", true));
        $y = 280;
        foreach (array_slice($headlineLines, 0, 5) as $line) {
            $this->drawScaledText($im, $line, 120, $y, $textCol, 4);
            $y += 76;
        }

        // Divider accent
        $y += 24;
        imagefilledrectangle($im, 120, $y, 260, $y + 8, $primaryCol);
        $y += 44;

        // Body text
        if (! empty($slide['body'])) {
            $bodyLines = explode("\n", wordwrap($this->asciiClean($slide['body']), 38, "\n", true));
            foreach (array_slice($bodyLines, 0, 5) as $line) {
                $this->drawScaledText($im, $line, 120, $y, $bodyCol, 3);
                $y += 54;
            }
        }

        // Footer brand bar
        $footerY = $h - 170;
        $this->drawScaledText($im, strtoupper($this->asciiClean($brandName)), 120, $footerY, $primaryCol, 2);
        if (! empty($slide['footer']) && $slide['footer'] !== $brandName) {
            $this->drawScaledText($im, $this->asciiClean(mb_substr($slide['footer'], 0, 42)), 120, $footerY + 36, $muted, 2);
        }

        ob_start();
        imagepng($im, null, 6);
        $png = (string) ob_get_clean();
        imagedestroy($im);

        return $png;
    }

    /**
     * Render clean, crisp scaled bitmap text without requiring external TTF files on WHM servers.
     */
    private function drawScaledText(\GdImage $dst, string $text, int $x, int $y, int $color, int $scale = 3): void
    {
        $text = trim($text);
        if ($text === '') {
            return;
        }
        $font = 5; // largest built-in GD font (9x15)
        $fw = imagefontwidth($font);
        $fh = imagefontheight($font);
        $tw = max(1, strlen($text) * $fw);
        $th = $fh;

        $tmp = imagecreatetruecolor($tw, $th);
        $trans = imagecolorallocate($tmp, 1, 2, 3);
        imagecolortransparent($tmp, $trans);
        imagefilledrectangle($tmp, 0, 0, $tw, $th, $trans);

        $r = ($color >> 16) & 0xFF;
        $g = ($color >> 8) & 0xFF;
        $b = $color & 0xFF;
        $fg = imagecolorallocate($tmp, $r, $g, $b);

        imagestring($tmp, $font, 0, 0, $text, $fg);
        imagecopyresized($dst, $tmp, $x, $y, 0, 0, $tw * $scale, $th * $scale, $tw, $th);
        imagedestroy($tmp);
    }

    private function renderSvgFallback(
        string $format,
        array $slide,
        int $slideNumber,
        int $totalSlides,
        string $brandName,
        string $primaryHex,
        string $secondaryHex,
        string $bgHex
    ): string {
        $badge = htmlspecialchars($slide['badge'], ENT_XML1);
        $headline = htmlspecialchars($slide['headline'], ENT_XML1);
        $body = htmlspecialchars($slide['body'], ENT_XML1);
        $brand = htmlspecialchars($brandName, ENT_XML1);
        $counter = $totalSlides > 1 ? "{$slideNumber}/{$totalSlides}" : '';

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="{$secondaryHex}"/>
  <rect width="1080" height="24" fill="{$primaryHex}"/>
  <rect x="70" y="90" width="940" height="900" rx="24" fill="{$bgHex}"/>
  <rect x="120" y="140" width="420" height="52" rx="12" fill="{$primaryHex}"/>
  <text x="144" y="174" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">{$badge}</text>
  <text x="900" y="174" fill="#64748b" font-family="sans-serif" font-size="22" font-weight="bold">{$counter}</text>
  <text x="120" y="340" fill="{$secondaryHex}" font-family="sans-serif" font-size="48" font-weight="bold">{$headline}</text>
  <text x="120" y="520" fill="#475569" font-family="sans-serif" font-size="32">{$body}</text>
  <text x="120" y="920" fill="{$primaryHex}" font-family="sans-serif" font-size="26" font-weight="bold">{$brand}</text>
</svg>
SVG;
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

    private function asciiClean(string $text): string
    {
        $replacements = [
            '“' => '"', '”' => '"', '‘' => "'", '’' => "'",
            '—' => '-', '–' => '-', '…' => '...', '•' => '*', '→' => '->',
        ];
        $text = strtr($text, $replacements);
        $converted = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT//IGNORE', $text);

        return $converted !== false && $converted !== '' ? $converted : preg_replace('/[^\x20-\x7E]/', '', $text);
    }
}

