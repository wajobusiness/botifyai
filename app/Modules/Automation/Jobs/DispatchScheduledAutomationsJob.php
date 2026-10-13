<?php

namespace App\Modules\Automation\Jobs;

use App\Modules\Automation\Models\Automation;
use App\Modules\Automation\Services\AutomationEngine;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class DispatchScheduledAutomationsJob implements ShouldQueue
{
    use Queueable;

    public function handle(AutomationEngine $engine): void
    {
        // Backfill next_run_at for any active recurring automations missing a next slot
        Automation::where('status', 'active')
            ->where('trigger_type', 'schedule.recurring')
            ->whereNull('next_run_at')
            ->get()
            ->each(function (Automation $automation) {
                $next = $automation->computeNextRunAt(now());
                if ($next) {
                    $automation->update(['next_run_at' => $next]);
                }
            });

        $now = now();
        $due = Automation::where('status', 'active')
            ->where('trigger_type', 'schedule.recurring')
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', $now)
            ->get();

        foreach ($due as $automation) {
            $nextRunAt = $automation->computeNextRunAt($now);

            // Atomic update guard so overlapping workers never double-trigger
            $claimed = Automation::where('id', $automation->id)
                ->where('status', 'active')
                ->where('next_run_at', '<=', $now)
                ->update([
                    'last_run_at' => $now,
                    'next_run_at' => $nextRunAt,
                ]);

            if ($claimed) {
                try {
                    $engine->triggerForWorkspace($automation);
                } catch (\Throwable $e) {
                    Log::error('Failed to trigger recurring automation', [
                        'automation_id' => $automation->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }
}

