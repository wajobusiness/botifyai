<?php

namespace App\Modules\AI\Models;

use App\Models\Workspace;
use App\Modules\Ecommerce\Models\EcommerceStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiBotStoreConnection extends Model
{
    protected $table = 'ai_bot_store_connections';

    protected $fillable = [
        'workspace_id',
        'chatbot_id',
        'store_id',
        'is_store_default',
        'enable_catalog_search',
        'enable_cart_creation',
        'enable_order_tracking',
    ];

    protected function casts(): array
    {
        return [
            'is_store_default' => 'boolean',
            'enable_catalog_search' => 'boolean',
            'enable_cart_creation' => 'boolean',
            'enable_order_tracking' => 'boolean',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function chatbot(): BelongsTo
    {
        return $this->belongsTo(AiChatbot::class, 'chatbot_id');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(EcommerceStore::class, 'store_id');
    }
}

