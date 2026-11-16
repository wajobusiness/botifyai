<?php

namespace App\Modules\AI\Models;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ChatbotWidget extends Model
{
    protected $table = 'chatbot_widgets';

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (self $model) {
            if (empty($model->widget_key)) {
                $model->widget_key = 'bw_'.Str::random(32);
            }
        });
    }

    protected $fillable = [
        'workspace_id',
        'chatbot_id',
        'widget_key',
        'agent_name',
        'theme',
        'position',
        'primary_color',
        'welcome_message',
        'enable_lead_capture',
        'enable_human_takeover',
        'allowed_domains',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'enable_lead_capture' => 'boolean',
            'enable_human_takeover' => 'boolean',
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

    /**
     * Generate HTML embed snippet for external websites
     */
    public function getEmbedCode(): string
    {
        $cdnUrl = config('app.url').'/widget.js';
        $pos = $this->position === 'bottom_left' ? 'left' : 'right';

        return "<script>\n"
            ."window.BotifyAIConfig = {\n"
            ."    botId: \"{$this->widget_key}\",\n"
            ."    theme: \"{$this->theme}\",\n"
            ."    position: \"{$pos}\"\n"
            ."};\n"
            ."</script>\n"
            ."<script async src=\"{$cdnUrl}\"></script>";
    }
}
