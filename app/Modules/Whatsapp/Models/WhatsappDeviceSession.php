<?php

namespace App\Modules\Whatsapp\Models;

use App\Models\Workspace;
use App\Modules\Shared\Models\ChannelAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WhatsappDeviceSession extends Model
{
    protected $table = 'whatsapp_device_sessions';

    protected $fillable = [
        'workspace_id',
        'channel_account_id',
        'session_uid',
        'name',
        'phone_number',
        'connection_type',
        'connection_status',
        'pairing_code',
        'pairing_code_expires_at',
        'qr_raw',
        'auth_state_json',
        'push_name',
        'platform',
        'battery_level',
        'is_business',
        'error_message',
        'last_active_at',
        'paired_at',
    ];

    protected $hidden = [
        'auth_state_json',
    ];

    protected function casts(): array
    {
        return [
            'pairing_code_expires_at' => 'datetime',
            'last_active_at'          => 'datetime',
            'paired_at'                => 'datetime',
            'is_business'              => 'boolean',
            'battery_level'            => 'integer',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function channelAccount(): BelongsTo
    {
        return $this->belongsTo(ChannelAccount::class, 'channel_account_id');
    }

    /**
     * Check if pairing code has expired (default: 3 minutes lifetime).
     */
    public function isPairingExpired(): bool
    {
        if (! $this->pairing_code_expires_at) {
            return true;
        }

        return now()->isAfter($this->pairing_code_expires_at);
    }

    /**
     * Generate an 8-character human-friendly pairing code (e.g. ABCD-1234).
     */
    public function generatePairingCode(): string
    {
        $code = strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        $this->update([
            'pairing_code' => $code,
            'pairing_code_expires_at' => now()->addMinutes(3),
            'connection_status' => 'pairing',
            'error_message' => null,
        ]);

        return $code;
    }

    /**
     * Mark device as connected and link to unified ChannelAccount.
     */
    public function markConnected(string $phoneNumber, ?string $pushName = null, ?string $platform = null): ChannelAccount
    {
        // 1. Ensure a unified ChannelAccount exists for this session
        $account = ChannelAccount::updateOrCreate(
            [
                'workspace_id'    => $this->workspace_id,
                'phone_number_id' => $phoneNumber,
            ],
            [
                'channel'              => 'whatsapp',
                'provider'             => 'linked_device',
                'display_name'         => $this->name ?: ($pushName ?: $phoneNumber),
                'business_account_id'  => $this->session_uid,
                'status'               => 'active',
                'meta_json'            => [
                    'session_uid'     => $this->session_uid,
                    'connection_type' => $this->connection_type,
                    'push_name'       => $pushName,
                    'platform'        => $platform,
                    'phone_number'    => $phoneNumber,
                ],
            ]
        );

        $this->update([
            'channel_account_id' => $account->id,
            'phone_number'       => $phoneNumber,
            'push_name'          => $pushName,
            'platform'           => $platform,
            'connection_status'  => 'connected',
            'pairing_code'       => null,
            'pairing_code_expires_at' => null,
            'qr_raw'             => null,
            'error_message'      => null,
            'last_active_at'     => now(),
            'paired_at'          => now(),
        ]);

        return $account;
    }

    /**
     * Mark device as disconnected.
     */
    public function markDisconnected(?string $reason = null): void
    {
        $this->update([
            'connection_status' => 'disconnected',
            'error_message'     => $reason,
            'pairing_code'      => null,
            'pairing_code_expires_at' => null,
        ]);

        if ($this->channelAccount) {
            $this->channelAccount->update(['status' => 'disconnected']);
        }
    }
}
