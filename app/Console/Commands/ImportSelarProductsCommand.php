<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Modules\Ecommerce\Services\Import\Adapters\SelarStoreAdapter;
use App\Modules\Ecommerce\Services\Import\ExternalStoreImportService;
use Illuminate\Console\Command;

class ImportSelarProductsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ecommerce:import-selar 
                            {email : Target BotifyAI user email address} 
                            {store_url=https://selar.com/m/finxhost : Selar store URL} 
                            {--dry-run : Perform a dry run without modifying the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import products from a public Selar store into a BotifyAI user store';

    /**
     * Execute the console command.
     */
    public function handle(ExternalStoreImportService $importer, SelarStoreAdapter $adapter): int
    {
        $email = (string) $this->argument('email');
        $storeUrl = (string) $this->argument('store_url');
        $dryRun = (bool) $this->option('dry-run');

        $this->info("Resolving BotifyAI target user: {$email}...");

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("User with email [{$email}] was not found in BotifyAI.");
            return Command::FAILURE;
        }

        $this->info("Found User ID: {$user->id} ({$user->name})");
        $this->info("Starting extraction from Selar store: {$storeUrl}".($dryRun ? ' [DRY RUN]' : ''));

        $report = $importer->import($adapter, $storeUrl, $user, $dryRun);

        $this->newLine();
        $this->info("==========================================");
        $this->info("SELAR → BOTIFYAI MIGRATION REPORT");
        $this->info("==========================================");
        $this->info("Source Store:      {$report['store_url']}");
        $this->info("Destination User:  {$report['target_user_email']} (ID: {$report['target_user_id']})");
        $this->info("Workspace ID:      {$report['workspace_id']}");
        if (isset($report['store_id'])) {
            $this->info("Store ID:          {$report['store_id']}");
        }
        $this->info("Discovered:        {$report['discovered_count']}");
        $this->info("Created:           {$report['created_count']}");
        $this->info("Updated:           {$report['updated_count']}");
        $this->info("Failed:            {$report['failed_count']}");
        $this->info("==========================================");

        $tableData = array_map(function ($p) {
            return [
                $p['index'],
                $p['external_id'],
                $p['name'],
                $p['currency'].' '.number_format($p['price'], 2),
                $p['product_type'],
                $p['action'],
            ];
        }, $report['products']);

        $this->table(['#', 'Code', 'Name', 'Price', 'Type', 'Action'], $tableData);

        if (! empty($report['errors'])) {
            $this->newLine();
            $this->warn('Warnings/Errors encountered:');
            foreach ($report['errors'] as $err) {
                $this->error("- {$err}");
            }
        }

        return $report['failed_count'] > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
