<?php

namespace App\Modules\AI\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeDocument extends Model
{
    protected $table = 'knowledge_documents';

    protected $fillable = [
        'knowledge_source_id',
        'content',
        'metadata',
        'embedding',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(KnowledgeSource::class, 'knowledge_source_id');
    }
}
