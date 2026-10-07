<?php

namespace App\Console\Commands;

use App\Modules\Blog\Database\Seeders\BlogDatabaseSeeder;
use Illuminate\Console\Command;

class SeedBlogCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'blog:seed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed default BotifyAI blog categories, author profiles, and initial SEO-optimized articles';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting BotifyAI Blog Seeder...');

        try {
            $seeder = new BlogDatabaseSeeder();
            $seeder->run();

            $this->info('✓ BotifyAI Blog categories, author, and pillar articles seeded successfully!');
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Failed to seed blog data: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}

