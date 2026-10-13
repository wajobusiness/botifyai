<?php

namespace App\Modules\Automation\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Automation extends Model
{
    protected $table = 'automations';

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (self $model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected $fillable = [
        'workspace_id',
        'name',
        'status',
        'trigger_type',
        'trigger_config',
        'trigger_token',
        'nodes',
        'edges',
        'run_count',
        'next_run_at',
        'last_run_at',
    ];

    protected function casts(): array
    {
        return [
            'trigger_config' => 'array',
            'nodes' => 'array',
            'edges' => 'array',
            'next_run_at' => 'datetime',
            'last_run_at' => 'datetime',
        ];
    }

    public function runs()
    {
        return $this->hasMany(AutomationRun::class, 'automation_id');
    }

    public function isActive()
    {
        return $this->status === 'active';
    }

    /**
     * Compute the next UTC execution timestamp for a `schedule.recurring` automation.
     */
    public function computeNextRunAt(?\Illuminate\Support\Carbon $from = null): ?\Illuminate\Support\Carbon
    {
        if ($this->trigger_type !== 'schedule.recurring') {
            return null;
        }

        $config = is_array($this->trigger_config) ? $this->trigger_config : [];
        $tzName = (string) ($config['timezone'] ?? 'UTC');
        try {
            $tz = new \DateTimeZone($tzName ?: 'UTC');
        } catch (\Throwable) {
            $tz = new \DateTimeZone('UTC');
        }

        $base = ($from ? $from->copy() : now())->setTimezone($tz);

        // Parse posting times (default 09:00)
        $rawTimes = $config['times'] ?? ['09:00'];
        if (is_string($rawTimes)) {
            $rawTimes = array_filter(array_map('trim', explode(',', $rawTimes)));
        }
        $times = [];
        foreach ((array) $rawTimes as $t) {
            $t = trim((string) $t);
            if (preg_match('/^([01]?\d|2[0-3]):([0-5]\d)$/', $t, $m)) {
                $times[] = sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
            }
        }
        if (empty($times)) {
            $times = ['09:00'];
        }
        sort($times);

        // Parse allowed days of week (mon..sun)
        $frequency = (string) ($config['frequency'] ?? 'daily');
        $rawDays = $config['days_of_week'] ?? [];
        if (is_string($rawDays)) {
            $rawDays = array_filter(array_map('trim', explode(',', $rawDays)));
        }
        $allowedDays = match ($frequency) {
            'weekdays' => ['mon', 'tue', 'wed', 'thu', 'fri'],
            'weekly', 'custom' => array_values(array_filter(array_map(
                fn ($d) => strtolower(substr(trim((string) $d), 0, 3)),
                (array) $rawDays
            ))),
            default => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        };
        if (empty($allowedDays)) {
            $allowedDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        }

        // Search up to 8 days ahead for the earliest matching slot strictly after $base
        for ($dayOffset = 0; $dayOffset <= 7; $dayOffset++) {
            $candidateDay = $base->copy()->addDays($dayOffset);
            $dayShort = strtolower($candidateDay->format('D'));
            if (! in_array($dayShort, $allowedDays, true)) {
                continue;
            }

            foreach ($times as $hhmm) {
                [$hour, $minute] = array_map('intval', explode(':', $hhmm));
                $slot = $candidateDay->copy()->setTime($hour, $minute, 0);
                if ($slot->gt($base)) {
                    return $slot->utc();
                }
            }
        }

        return $base->copy()->addDay()->setTime(9, 0, 0)->utc();
    }
}

