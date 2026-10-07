<?php

namespace App\Modules\Academy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademyCourse extends Model
{
    protected $table = 'academy_courses';

    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'headline',
        'description',
        'thumbnail_url',
        'badge_text',
        'difficulty_level',
        'is_published',
        'is_featured',
        'order',
        'meta_title',
        'meta_description',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
            'order' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AcademyCategory::class, 'category_id');
    }

    public function modules(): HasMany
    {
        return $this->hasMany(AcademyModule::class, 'course_id')->orderBy('order');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(AcademyLesson::class, 'course_id')->orderBy('order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(AcademyEnrollment::class, 'course_id');
    }
}
