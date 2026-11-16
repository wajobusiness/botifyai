<?php

namespace App\Modules\AI\Services\KnowledgeConnectors;

use App\Modules\AI\Models\KnowledgeSource;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CrmConnector implements ConnectorInterface
{
    public function testConnection(array $details): array
    {
        $crm = $details['crm'] ?? 'hubspot'; // hubspot, salesforce, zoho
        $token = $details['access_token'] ?? '';

        if (! $token) {
            return ['success' => false, 'message' => "Access token required for {$crm} integration."];
        }

        try {
            if ($crm === 'hubspot') {
                $res = Http::withToken($token)->get('https://api.hubapi.com/crm/v3/objects/contacts?limit=1');
                if ($res->successful()) {
                    return ['success' => true, 'message' => 'Connected to HubSpot CRM successfully!'];
                }
                return ['success' => false, 'message' => 'HubSpot authentication failed: HTTP '.$res->status()];
            } elseif ($crm === 'salesforce') {
                $instanceUrl = rtrim($details['instance_url'] ?? '', '/');
                if (! $instanceUrl) {
                    return ['success' => false, 'message' => 'Salesforce instance URL required.'];
                }
                $res = Http::withToken($token)->get("{$instanceUrl}/services/data/v58.0/sobjects");
                if ($res->successful()) {
                    return ['success' => true, 'message' => 'Connected to Salesforce CRM successfully!'];
                }
                return ['success' => false, 'message' => 'Salesforce authentication failed: HTTP '.$res->status()];
            } else {
                // Zoho CRM
                $domain = $details['domain'] ?? 'https://www.zohoapis.com';
                $res = Http::withToken($token)->get("{$domain}/crm/v2/Contacts?per_page=1");
                if ($res->successful()) {
                    return ['success' => true, 'message' => 'Connected to Zoho CRM successfully!'];
                }
                return ['success' => false, 'message' => 'Zoho CRM authentication failed: HTTP '.$res->status()];
            }
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => 'CRM connection error: '.$e->getMessage()];
        }
    }

    public function extract(KnowledgeSource $source): array
    {
        $details = $source->connection_details ?? [];
        $crm = $details['crm'] ?? 'hubspot';
        $token = $details['access_token'] ?? '';
        $items = [];

        if (! $token) {
            return [];
        }

        try {
            if ($crm === 'hubspot') {
                $res = Http::withToken($token)->get('https://api.hubapi.com/crm/v3/objects/contacts?limit=50&properties=firstname,lastname,email,phone,lifecyclestage');
                if ($res->successful()) {
                    $results = $res->json('results') ?? [];
                    foreach ($results as $c) {
                        $p = $c['properties'] ?? [];
                        $name = trim(($p['firstname'] ?? '').' '.($p['lastname'] ?? ''));
                        $email = $p['email'] ?? '';
                        $stage = $p['lifecyclestage'] ?? 'lead';

                        $content = "HubSpot Contact: {$name}\nEmail: {$email}\nLifecycle Stage: {$stage}";
                        $items[] = [
                            'content' => $content,
                            'metadata' => [
                                'source' => $source->name,
                                'type' => 'hubspot_contact',
                                'contact_id' => $c['id'] ?? null,
                            ],
                        ];
                    }
                }
            } elseif ($crm === 'salesforce') {
                $instanceUrl = rtrim($details['instance_url'] ?? '', '/');
                $res = Http::withToken($token)->get("{$instanceUrl}/services/data/v58.0/query?q=SELECT+Id,Name,Email,Title+FROM+Contact+LIMIT+50");
                if ($res->successful()) {
                    $records = $res->json('records') ?? [];
                    foreach ($records as $r) {
                        $name = $r['Name'] ?? 'Contact';
                        $email = $r['Email'] ?? '';
                        $title = $r['Title'] ?? 'Lead';

                        $content = "Salesforce Contact: {$name}\nTitle: {$title}\nEmail: {$email}";
                        $items[] = [
                            'content' => $content,
                            'metadata' => [
                                'source' => $source->name,
                                'type' => 'salesforce_contact',
                                'contact_id' => $r['Id'] ?? null,
                            ],
                        ];
                    }
                }
            } else {
                // Zoho CRM
                $domain = $details['domain'] ?? 'https://www.zohoapis.com';
                $res = Http::withToken($token)->get("{$domain}/crm/v2/Contacts?per_page=50");
                if ($res->successful()) {
                    $contacts = $res->json('data') ?? [];
                    foreach ($contacts as $c) {
                        $name = $c['Full_Name'] ?? 'Contact';
                        $email = $c['Email'] ?? '';
                        $content = "Zoho Contact: {$name}\nEmail: {$email}";
                        $items[] = [
                            'content' => $content,
                            'metadata' => [
                                'source' => $source->name,
                                'type' => 'zoho_contact',
                                'contact_id' => $c['id'] ?? null,
                            ],
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('CrmConnector extraction error: '.$e->getMessage());
        }

        return $items;
    }
}
