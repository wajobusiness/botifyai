<?php

namespace App\Modules\AI\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiBotToolPermission extends Model
{
    protected $table = 'ai_bot_tool_permissions';

    protected $fillable = [
        'chatbot_id',
        'tool_name',
        'is_allowed',
        'rate_limit_per_session',
    ];

    protected function casts(): array
    {
        return [
            'is_allowed' => 'boolean',
            'rate_limit_per_session' => 'integer',
        ];
    }

    public function chatbot(): BelongsTo
    {
        return $this->belongsTo(AiChatbot::class, 'chatbot_id');
    }
}

