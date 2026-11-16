<?php

namespace App\Modules\AI;

use App\Modules\AI\Support\AiSchemaProvisioner;
use Illuminate\Support\ServiceProvider;

class AIServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/routes/web.php');
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');

        // Automatically provision or verify tables on production
        AiSchemaProvisioner::ensureTablesExist();
    }
}
