<?php

namespace App\Modules\AI\Services\KnowledgeConnectors;

use App\Modules\AI\Models\KnowledgeSource;

interface ConnectorInterface
{
    /**
     * Test connection credentials
     *
     * @return array{success: bool, message: string}
     */
    public function testConnection(array $details): array;

    /**
     * Extract structured textual items from the source
     *
     * @return array<array{content: string, metadata: array}>
     */
    public function extract(KnowledgeSource $source): array;
}
