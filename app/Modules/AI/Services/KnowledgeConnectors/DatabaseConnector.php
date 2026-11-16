<?php

namespace App\Modules\AI\Services\KnowledgeConnectors;

use App\Modules\AI\Models\KnowledgeSource;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseConnector implements ConnectorInterface
{
    public function testConnection(array $details): array
    {
        $driver = $details['driver'] ?? 'mysql'; // mysql, pgsql, mongodb
        $host = $details['host'] ?? '127.0.0.1';
        $port = $details['port'] ?? ($driver === 'pgsql' ? 5432 : ($driver === 'mongodb' ? 27017 : 3306));
        $database = $details['database'] ?? '';
        $username = $details['username'] ?? '';
        $password = $details['password'] ?? '';

        if (! $database) {
            return ['success' => false, 'message' => 'Database name is required.'];
        }

        if ($driver === 'mongodb') {
            return ['success' => true, 'message' => 'MongoDB connection configured successfully.'];
        }

        try {
            $tempConn = 'test_conn_'.uniqid();
            Config::set("database.connections.{$tempConn}", [
                'driver' => $driver,
                'host' => $host,
                'port' => $port,
                'database' => $database,
                'username' => $username,
                'password' => $password,
                'charset' => 'utf8mb4',
                'prefix' => '',
            ]);

            DB::connection($tempConn)->getPdo();
            return ['success' => true, 'message' => "Successfully connected to {$driver} database '{$database}'!"];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => 'Connection failed: '.$e->getMessage()];
        }
    }

    public function extract(KnowledgeSource $source): array
    {
        $details = $source->connection_details ?? [];
        $driver = $details['driver'] ?? 'mysql';
        $table = $details['table'] ?? '';
        $queryLimit = (int) ($details['limit'] ?? 200);

        if (! $table) {
            return [];
        }

        try {
            $tempConn = 'sync_conn_'.uniqid();
            Config::set("database.connections.{$tempConn}", [
                'driver' => $driver,
                'host' => $details['host'] ?? '127.0.0.1',
                'port' => $details['port'] ?? 3306,
                'database' => $details['database'] ?? '',
                'username' => $details['username'] ?? '',
                'password' => $details['password'] ?? '',
                'charset' => 'utf8mb4',
                'prefix' => '',
            ]);

            $rows = DB::connection($tempConn)->table($table)->limit($queryLimit)->get();
            $items = [];

            foreach ($rows as $idx => $row) {
                $lines = [];
                $rowArr = (array) $row;
                foreach ($rowArr as $col => $val) {
                    if (is_scalar($val)) {
                        $colName = ucwords(str_replace(['_', '-'], ' ', (string) $col));
                        $lines[] = "{$colName}: {$val}";
                    }
                }

                $content = "Record from table {$table} (ID #".($rowArr['id'] ?? $idx)."):\n".implode("\n", $lines);
                $items[] = [
                    'content' => $content,
                    'metadata' => [
                        'source' => $source->name,
                        'type' => 'database',
                        'driver' => $driver,
                        'table' => $table,
                        'record_id' => $rowArr['id'] ?? $idx,
                    ],
                ];
            }

            return $items;
        } catch (\Throwable $e) {
            Log::error('DatabaseConnector extraction failed: '.$e->getMessage());
            return [];
        }
    }
}
