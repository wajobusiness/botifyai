<?php

namespace App\Console\Commands;

use App\Modules\Whatsapp\Services\WhatsappGatewayClient;
use Illuminate\Console\Command;

class WhatsappGatewayCommand extends Command
{
    protected $signature = 'whatsapp:gateway {action=status : Action: start, stop, restart, status} {--port=3100 : Port to listen on} {--daemon : Run as daemon in background}';

    protected $description = 'Manage the BotifyAI WhatsApp Multi-Device (Baileys) Node.js Gateway service';

    public function handle(): int
    {
        $action = strtolower($this->argument('action'));
        $port = (int) ($this->option('port') ?: 3100);

        return match ($action) {
            'start'   => $this->startGateway($port),
            'stop'    => $this->stopGateway($port),
            'restart' => $this->restartGateway($port),
            'status'  => $this->statusGateway($port),
            default   => $this->invalidAction($action),
        };
    }

    private function findNodeBinary(): string
    {
        $candidates = [
            '/usr/local/bin/node',
            '/usr/bin/node',
            '/opt/homebrew/bin/node',
            'node',
        ];

        foreach ($candidates as $cand) {
            $ver = @shell_exec("{$cand} -v 2>/dev/null");
            if ($ver && str_contains(trim($ver), 'v')) {
                return $cand;
            }
        }

        return 'node';
    }

    private function startGateway(int $port): int
    {
        if (WhatsappGatewayClient::isAvailable()) {
            $this->info("WhatsApp Gateway is already running and healthy on port {$port}.");
            return self::SUCCESS;
        }

        $serverPath = base_path('whatsapp-gateway/server.js');
        if (! file_exists($serverPath)) {
            $this->error("Server script not found at {$serverPath}!");
            return self::FAILURE;
        }

        $nodeBin = $this->findNodeBinary();
        $logPath = storage_path('logs/whatsapp-gateway.log');
        $this->info("Starting WhatsApp Gateway on port {$port} using {$nodeBin}...");

        $appUrl = rtrim((string) config('app.url', 'https://botifyai.cloud'), '/');
        $secret = (string) config('services.whatsapp_gateway.secret', env('WHATSAPP_GATEWAY_SECRET', config('app.key', 'botifyai-whatsapp-secret-key')));
        $appKey = (string) config('app.key', '');

        $envVars = "PORT={$port} LARAVEL_API_URL=" . escapeshellarg($appUrl) . " WHATSAPP_GATEWAY_SECRET=" . escapeshellarg($secret) . " APP_KEY=" . escapeshellarg($appKey);
        $cmd = "nohup env {$envVars} {$nodeBin} " . escapeshellarg($serverPath) . " >> " . escapeshellarg($logPath) . " 2>&1 &";

        shell_exec($cmd);

        $this->info("Launched in background. Waiting for gateway health check...");
        for ($i = 0; $i < 6; $i++) {
            usleep(500000); // 0.5s
            if (WhatsappGatewayClient::isAvailable()) {
                $this->info("✓ WhatsApp Gateway is active and healthy on http://127.0.0.1:{$port}!");
                return self::SUCCESS;
            }
        }

        if (WhatsappGatewayClient::isAvailable()) {
            $this->info("✓ WhatsApp Gateway is active and healthy!");
            return self::SUCCESS;
        }

        $this->warn("Gateway process started, but health check is not responding yet.");
        $this->line("Check the log at: {$logPath}");
        return self::SUCCESS;
    }

    private function stopGateway(int $port): int
    {
        $this->info("Stopping WhatsApp Gateway on port {$port}...");
        $pids = shell_exec("lsof -ti :{$port} 2>/dev/null");
        if ($pids) {
            $pidList = array_filter(array_map('trim', explode("\n", $pids)));
            foreach ($pidList as $pid) {
                shell_exec("kill -9 {$pid} 2>/dev/null");
            }
            $this->info("Terminated gateway process(es): " . implode(', ', $pidList));
        } else {
            $this->info("No process found listening on port {$port}.");
        }

        return self::SUCCESS;
    }

    private function restartGateway(int $port): int
    {
        $this->stopGateway($port);
        sleep(1);
        return $this->startGateway($port);
    }

    private function statusGateway(int $port): int
    {
        $this->info("Checking WhatsApp Gateway status on http://127.0.0.1:{$port}...");
        if (WhatsappGatewayClient::isAvailable()) {
            $this->info("✓ WhatsApp Gateway is RUNNING and HEALTHY.");
            return self::SUCCESS;
        }

        $this->warn("✗ WhatsApp Gateway is OFFLINE or not responding.");
        $this->line("Run 'php artisan whatsapp:gateway start' to start it.");
        return self::FAILURE;
    }

    private function invalidAction(string $action): int
    {
        $this->error("Invalid action '{$action}'. Use: start, stop, restart, or status.");
        return self::FAILURE;
    }
}
