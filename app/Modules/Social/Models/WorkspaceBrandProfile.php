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
        'logo_url',
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
            'cta_templates' => 'array',
            'banned_phrases' => 'array',
            'default_hashtag_sets' => 'array',
            'requires_approval' => 'boolean',
            'auto_replenish' => 'boolean',
        ];
    }

    public static function forWorkspace(int $workspaceId): self
    {
        return static::firstOrCreate(
            ['workspace_id' => $workspaceId],
            [
                'tone' => 'professional',
                'content_pillars' => ['Educational Insights', 'Industry Trends', 'Actionable Tips', 'Case Studies'],
                'brand_colors' => ['#6366f1', '#0f172a', '#f8fafc'],
                'requires_approval' => false,
                'auto_replenish' => true,
            ]
        );
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

    public function backgroundColor(): string
    {
        $colors = $this->brand_colors ?? [];

        return $this->sanitizeHex($colors[2] ?? '#f8fafc', '#f8fafc');
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

