<?php

namespace App\Modules\AI\Models;

use App\Models\Workspace;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use Database\Factories\AiChatbotFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AiChatbot extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return AiChatbotFactory::new();
    }

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (self $model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected $table = 'ai_chatbots';

    protected $fillable = [
        'workspace_id',
        'name',
        'purpose',
        'ai_kb_id',
        'system_prompt',
        'tone',
        'temperature',
        'max_context_chunks',
        'fallback_reply',
        'is_default',
        'handoff_threshold',
        'channels',
        'enabled',
    ];

    protected function casts(): array
    {
        return [
            'channels' => 'array',
            'enabled' => 'boolean',
            'is_default' => 'boolean',
            'temperature' => 'float',
            'max_context_chunks' => 'integer',
            'handoff_threshold' => 'integer',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Legacy single knowledge base relationship
     */
    public function knowledgeBase(): BelongsTo
    {
        return $this->belongsTo(AiKnowledgeBase::class, 'ai_kb_id');
    }

    /**
     * Multi-source knowledge bases (many-to-many)
     */
    public function knowledgeBases(): BelongsToMany
    {
        return $this->belongsToMany(
            AiKnowledgeBase::class,
            'ai_bot_knowledge_sources',
            'chatbot_id',
            'knowledge_base_id'
        )->withPivot('priority')->withTimestamps();
    }

    /**
     * Get all knowledge bases, including legacy ai_kb_id and many-to-many bindings.
     */
    public function allKnowledgeBases(): Collection
    {
        $kbs = $this->knowledgeBases;

        if ($this->ai_kb_id && ! $kbs->contains('id', $this->ai_kb_id)) {
            $legacy = $this->knowledgeBase;
            if ($legacy) {
                $kbs->push($legacy);
            }
        }

        return $kbs;
    }

    public function storeConnections(): HasMany
    {
        return $this->hasMany(AiBotStoreConnection::class, 'chatbot_id');
    }

    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(
            EcommerceStore::class,
            'ai_bot_store_connections',
            'chatbot_id',
            'store_id'
        )->withPivot([
            'workspace_id',
            'is_store_default',
            'enable_catalog_search',
            'enable_cart_creation',
            'enable_order_tracking',
        ])->withTimestamps();
    }

    public function productAssignments(): HasMany
    {
        return $this->hasMany(AiBotProductAssignment::class, 'chatbot_id');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(
            EcommerceProduct::class,
            'ai_bot_product_assignments',
            'chatbot_id',
            'product_id'
        )->withPivot('custom_instructions')->withTimestamps();
    }

    public function toolPermissions(): HasMany
    {
        return $this->hasMany(AiBotToolPermission::class, 'chatbot_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ConversationSession::class, 'chatbot_id');
    }

    public function runs(): HasMany
    {
        return $this->hasMany(AiRun::class, 'chatbot_id');
    }

    public function hasToolPermission(string $toolName): bool
    {
        $permission = $this->toolPermissions->firstWhere('tool_name', $toolName);
        if ($permission) {
            return (bool) $permission->is_allowed;
        }

        // Default allowed tools for commerce bots
        return in_array($toolName, [
            'search_products',
            'get_product_details',
            'create_checkout_link',
            'check_order_status',
        ], true);
    }

    public function isAllowedForStore(int $storeId): bool
    {
        return $this->storeConnections()->where('store_id', $storeId)->exists();
    }
}
