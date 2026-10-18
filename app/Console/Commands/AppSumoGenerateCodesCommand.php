<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Services\License\AppSumoRedemptionService;
use Illuminate\Console\Command;

class AppSumoGenerateCodesCommand extends Command
{
    protected $signature = 'appsumo:generate
                            {--tier=tier1 : License tier (e.g. tier1, tier2, tier3)}
                            {--count=50 : Number of unique codes to generate}
                            {--plan= : Target Plan ID or Plan Slug (optional, defaults to matched AppSumo plan)}
                            {--prefix=BOTIFY : Prefix for code format (BOTIFY-XXXX-XXXX-XXXX)}
                            {--export= : File path to export CSV (optional)}';

    protected $description = 'Generate a batch of unique AppSumo lifetime deal license codes';

    public function handle(AppSumoRedemptionService $service): int
    {
        $tier = (string) $this->option('tier');
        $count = (int) $this->option('count');
        $prefix = (string) $this->option('prefix');
        $exportPath = (string) $this->option('export');
        $planOption = $this->option('plan');

        if ($count <= 0 || $count > 50000) {
            $this->error('Count must be between 1 and 50,000.');
            return self::FAILURE;
        }

        // Resolve plan
        $plan = null;
        if ($planOption) {
            $plan = is_numeric($planOption)
                ? Plan::find($planOption)
                : Plan::where('slug', $planOption)->first();
        }

        if (! $plan) {
            $plan = Plan::where('slug', 'appsumo-' . strtolower($tier))->first()
                ?? Plan::where('slug', 'pro')->first()
                ?? Plan::first();
        }

        if (! $plan) {
            $this->error('No matching plan found. Please create or seed plans first.');
            return self::FAILURE;
        }

        $this->info("Generating {$count} codes for {$plan->name} ({$tier}) with prefix '{$prefix}'...");

        $result = $service->generateBatch($tier, $count, $plan->id, $prefix);

        $this->info("Successfully generated and inserted {$result['count']} codes!");

        if ($exportPath) {
            $fullPath = base_path($exportPath);
            $dir = dirname($fullPath);
            if (! is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }

            $handle = fopen($fullPath, 'w');
            fputcsv($handle, ['Code', 'Tier', 'Plan']);
            foreach ($result['codes'] as $code) {
                fputcsv($handle, [$code, $tier, $plan->name]);
            }
            fclose($handle);

            $this->info("Exported codes to CSV: {$fullPath}");
        }

        return self::SUCCESS;
    }
}

