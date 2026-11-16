<?php

namespace App\Modules\AI\Services\KnowledgeConnectors;

use App\Modules\AI\Models\KnowledgeSource;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudStorageConnector implements ConnectorInterface
{
    public function testConnection(array $details): array
    {
        $provider = $details['provider'] ?? 'google_drive'; // google_drive, dropbox
        $token = $details['access_token'] ?? '';

        if (! $token) {
            return ['success' => false, 'message' => "Access token or service account required for {$provider}."];
        }

        try {
            if ($provider === 'dropbox') {
                $res = Http::withToken($token)->post('https://api.dropboxapi.com/2/users/get_current_account');
                if ($res->successful()) {
                    return ['success' => true, 'message' => 'Connected to Dropbox account: '.$res->json('name.display_name')];
                }
                return ['success' => false, 'message' => 'Dropbox auth failed: HTTP '.$res->status()];
            } else {
                // Google Drive
                $res = Http::withToken($token)->get('https://www.googleapis.com/drive/v3/about?fields=user');
                if ($res->successful()) {
                    return ['success' => true, 'message' => 'Connected to Google Drive: '.$res->json('user.displayName')];
                }
                return ['success' => false, 'message' => 'Google Drive auth failed: HTTP '.$res->status()];
            }
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => 'Cloud storage connection error: '.$e->getMessage()];
        }
    }

    public function extract(KnowledgeSource $source): array
    {
        $details = $source->connection_details ?? [];
        $provider = $details['provider'] ?? 'google_drive';
        $token = $details['access_token'] ?? '';
        $items = [];

        if (! $token) {
            return [];
        }

        try {
            if ($provider === 'dropbox') {
                $res = Http::withToken($token)->post('https://api.dropboxapi.com/2/files/list_folder', [
                    'path' => $details['folder_path'] ?? '',
                    'limit' => 20,
                ]);

                if ($res->successful()) {
                    $entries = $res->json('entries') ?? [];
                    foreach ($entries as $entry) {
                        if (($entry['.tag'] ?? '') === 'file') {
                            $items[] = [
                                'content' => "Dropbox Document: {$entry['name']}\nPath: {$entry['path_display']}\nSize: ".($entry['size'] ?? 0).' bytes',
                                'metadata' => [
                                    'source' => $source->name,
                                    'type' => 'dropbox_file',
                                    'file_id' => $entry['id'] ?? null,
                                    'name' => $entry['name'],
                                ],
                            ];
                        }
                    }
                }
            } else {
                // Google Drive
                $folderId = $details['folder_id'] ?? 'root';
                $res = Http::withToken($token)->get("https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,description)");

                if ($res->successful()) {
                    $files = $res->json('files') ?? [];
                    foreach ($files as $file) {
                        $items[] = [
                            'content' => "Google Drive Document: {$file['name']}\nType: {$file['mimeType']}\nDescription: ".($file['description'] ?? 'No description provided.'),
                            'metadata' => [
                                'source' => $source->name,
                                'type' => 'google_drive_file',
                                'file_id' => $file['id'] ?? null,
                                'name' => $file['name'],
                            ],
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('CloudStorageConnector extraction error: '.$e->getMessage());
        }

        return $items;
    }
}
