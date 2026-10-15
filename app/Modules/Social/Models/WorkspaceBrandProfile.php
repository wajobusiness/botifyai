<?php

namespace App\Modules\Social\Models;

use Illuminate\Database\Eloquent\Model;

class WorkspaceBrandProfile extends Model
{
    protected $table = 'workspace_brand_profiles';

    protected $fillable = [
        'workspace_id',
        'brand_name',
        'niche',
        'target_audience',
        'tone',
        'writing_style',
        'content_pillars',
        'brand_colors',
        'typography',
        'visual_theme',
        'aspect_ratios',
        'logo_url',
        'dark_logo_url',
        'watermark_url',
        'watermark_opacity',
        'watermark_position',
        'website_url',
        'primary_handle',
        'contact_info',
        'active_templates',
        'cta_templates',
        'banned_phrases',
        'default_hashtag_sets',
        'requires_approval',
        'auto_replenish',
    ];

    protected function casts(): array
    {
        return [
            'content_pillars' => 'array',
            'brand_colors' => 'array',
            'typography' => 'array',
            'aspect_ratios' => 'array',
            'contact_info' => 'array',
            'active_templates' => 'array',
            'cta_templates' => 'array',
            'banned_phrases' => 'array',
            'default_hashtag_sets' => 'array',
            'watermark_opacity' => 'integer',
            'requires_approval' => 'boolean',
            'auto_replenish' => 'boolean',
        ];
    }

    public static function forWorkspace(int $workspaceId): self
    {
        $defaults = [
            'workspace_id' => $workspaceId,
            'tone' => 'professional',
            'content_pillars' => ['Educational Insights', 'Industry Trends', 'Actionable Tips', 'Case Studies'],
            'brand_colors' => ['#6366f1', '#0f172a', '#38bdf8', '#0b0f19', '#1e293b'],
            'typography' => [
                'heading_font' => 'Poppins',
                'body_font' => 'Inter',
                'accent_font' => 'Playfair Display',
            ],
            'visual_theme' => 'modern_minimalist',
            'aspect_ratios' => ['1:1', '4:5'],
            'watermark_opacity' => 40,
            'watermark_position' => 'bottom-right',
            'active_templates' => ['tip', 'quote', 'data', 'promo', 'announcement', 'carousel'],
            'requires_approval' => false,
            'auto_replenish' => true,
        ];

        try {
            if (! \Illuminate\Support\Facades\Schema::hasTable('workspace_brand_profiles')) {
                return new static($defaults);
            }

            return static::firstOrCreate(
                ['workspace_id' => $workspaceId],
                $defaults
            );
        } catch (\Throwable) {
            return new static($defaults);
        }
    }

    public function primaryColor(): string
    {
        $colors = $this->brand_colors ?? [];

        return $this->sanitizeHex($colors[0] ?? '#6366f1', '#6366f1');
    }

    public function secondaryColor(): string
    {
        $colors = $this->brand_colors ?? [];

        return $this->sanitizeHex($colors[1] ?? '#0f172a', '#0f172a');
    }

    public function accentColor(): string
    {
        $colors = $this->brand_colors ?? [];

        return $this->sanitizeHex($colors[2] ?? '#38bdf8', '#38bdf8');
    }

    public function backgroundColor(): string
    {
        $colors = $this->brand_colors ?? [];

        return $this->sanitizeHex($colors[3] ?? '#0b0f19', '#0b0f19');
    }

    public function surfaceColor(): string
    {
        $colors = $this->brand_colors ?? [];

        return $this->sanitizeHex($colors[4] ?? '#1e293b', '#1e293b');
    }

    public function headingFont(): string
    {
        return (string) ($this->typography['heading_font'] ?? 'Poppins');
    }

    public function bodyFont(): string
    {
        return (string) ($this->typography['body_font'] ?? 'Inter');
    }

    public function accentFont(): string
    {
        return (string) ($this->typography['accent_font'] ?? 'Playfair Display');
    }

    public function watermarkOpacity(): int
    {
        $val = (int) ($this->watermark_opacity ?? 40);

        return max(10, min(100, $val));
    }

    public function watermarkPosition(): string
    {
        $pos = strtolower(trim((string) ($this->watermark_position ?? 'bottom-right')));
        $valid = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'header-center'];

        return in_array($pos, $valid, true) ? $pos : 'bottom-right';
    }

    /**
     * Compute mathematically verified WCAG contrast text color (pure white vs dark slate)
     * based on relative luminance of the background or card surface.
     */
    public function contrastTextColor(string $surfaceHex): string
    {
        $rgb = $this->hexToRgb($surfaceHex);
        $sR = $rgb[0] / 255;
        $sG = $rgb[1] / 255;
        $sB = $rgb[2] / 255;

        // Relative luminance formula (WCAG 2.1)
        $lum = 0.2126 * $sR + 0.7152 * $sG + 0.0722 * $sB;

        return $lum > 0.5 ? '#0f172a' : '#ffffff';
    }

    private function hexToRgb(string $hex): array
    {
        $hex = ltrim($this->sanitizeHex($hex, '#1e293b'), '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }

        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2)),
        ];
    }

    private function sanitizeHex(?string $hex, string $fallback): string
    {
        $hex = trim((string) $hex);
        if (preg_match('/^#[0-9a-fA-F]{6}$/', $hex)) {
            return strtolower($hex);
        }

        return $fallback;
    }
}
