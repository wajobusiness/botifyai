<?php

namespace App\Modules\AI\Models;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeSource extends Model
{
    protected $table = 'knowledge_sources';

    protected $fillable = [
        'workspace_id',
        'kb_id',
        'type',
        'name',
        'connection_details',
        'sync_frequency',
        'last_sync',
        'status',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'connection_details' => 'array',
            'metadata' => 'array',
            'last_sync' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function knowledgeBase(): BelongsTo
    {
        return $this->belongsTo(AiKnowledgeBase::class, 'kb_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(KnowledgeDocument::class, 'knowledge_source_id');
    }
}
