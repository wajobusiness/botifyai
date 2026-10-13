<?php

namespace App\Modules\Broadcasting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class WorkspaceSmtpConfig extends Model
{
    protected $table = 'workspace_smtp_configs';

    protected $fillable = [
        'workspace_id',
        'host',
        'port',
        'username',
        'password',
        'encryption',
        'from_email',
        'from_name',
        'is_active',
    ];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'port' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function setPasswordAttribute(?string $value): void
    {
        if ($value === null || $value === '') {
            return;
        }
        $this->attributes['password'] = Crypt::encryptString($value);
    }

    public function getPasswordAttribute(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return $value;
        }
    }

    public function getDecryptedPassword(): ?string
    {
        return $this->password;
    }

    public static function forWorkspace(int $workspaceId): ?self
    {
        try {
            if (! \Illuminate\Support\Facades\Schema::hasTable('workspace_smtp_configs')) {
                return null;
            }

            return static::where('workspace_id', $workspaceId)
                ->where('is_active', true)
                ->first()
                ?? static::where('workspace_id', $workspaceId)
                    ->whereNotNull('host')
                    ->where('host', '!=', '')
                    ->orderByDesc('id')
                    ->first();
        } catch (\Throwable) {
            return null;
        }
    }

    public function getSummaryAttribute(): string
    {
        return "{$this->host}:{$this->port}";
    }
}
