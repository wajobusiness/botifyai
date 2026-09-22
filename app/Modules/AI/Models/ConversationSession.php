<?php

namespace App\Modules\AI\Models;

use App\Models\Workspace;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\Conversation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ConversationSession extends Model
{
    protected $table = 'conversation_sessions';

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (self $model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->session_token)) {
                $model->session_token = 'sess_'.Str::random(40);
            }
        });
    }

    protected $fillable = [
        'uuid',
        'workspace_id',
        'chatbot_id',
        'channel',
        'channel_account_id',
        'contact_id',
        'conversation_id',
        'session_token',
        'current_store_id',
        'current_product_id',
        'metadata',
        'status',
        'last_activity_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'last_activity_at' => 'datetime',
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

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function currentStore(): BelongsTo
    {
        return $this->belongsTo(EcommerceStore::class, 'current_store_id');
    }

    public function currentProduct(): BelongsTo
    {
        return $this->belongsTo(EcommerceProduct::class, 'current_product_id');
    }
}

