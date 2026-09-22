<?php

namespace App\Modules\AI\Models;

use App\Models\Workspace;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiBotProductAssignment extends Model
{
    protected $table = 'ai_bot_product_assignments';

    protected $fillable = [
        'workspace_id',
        'chatbot_id',
        'product_id',
        'custom_instructions',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function chatbot(): BelongsTo
    {
        return $this->belongsTo(AiChatbot::class, 'chatbot_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(EcommerceProduct::class, 'product_id');
    }
}

