<?php

use App\Models\SystemSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        SystemSetting::firstOrCreate(
            ['key' => 'registration_emails_enabled'],
            [
                'value'     => '1',
                'is_secret' => false,
                'group'     => 'general',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        SystemSetting::where('key', 'registration_emails_enabled')->delete();
    }
};
