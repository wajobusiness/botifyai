<?php

namespace App\Modules\Academy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademyModule extends Model
{
    protected $table = 'academy_modules';

    protected $fillable = [
        'course_id',
        'title',
        'slug',
        'description',
        'order',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(AcademyCourse::class, 'course_id');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(AcademyLesson::class, 'module_id')->orderBy('order');
    }
}
