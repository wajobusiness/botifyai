<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('academy_categories')) {
            Schema::create('academy_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('icon')->nullable();
                $table->unsignedInteger('order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('academy_courses')) {
            Schema::create('academy_courses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('category_id')->nullable()->constrained('academy_categories')->nullOnDelete();
                $table->string('title');
                $table->string('slug')->unique();
                $table->string('headline')->nullable();
                $table->text('description')->nullable();
                $table->string('thumbnail_url')->nullable();
                $table->string('badge_text')->nullable();
                $table->string('difficulty_level')->default('beginner');
                $table->boolean('is_published')->default(true);
                $table->boolean('is_featured')->default(false);
                $table->unsignedInteger('order')->default(0);
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('academy_modules')) {
            Schema::create('academy_modules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('academy_courses')->cascadeOnDelete();
                $table->string('title');
                $table->string('slug');
                $table->text('description')->nullable();
                $table->unsignedInteger('order')->default(0);
                $table->boolean('is_published')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('academy_lessons')) {
            Schema::create('academy_lessons', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('academy_courses')->cascadeOnDelete();
                $table->foreignId('module_id')->nullable()->constrained('academy_modules')->cascadeOnDelete();
                $table->string('title');
                $table->string('slug');
                $table->string('youtube_video_url')->nullable();
                $table->string('youtube_video_id')->nullable();
                $table->unsignedInteger('duration_seconds')->default(0);
                $table->longText('description')->nullable();
                $table->longText('lesson_notes')->nullable();
                $table->json('resources_json')->nullable();
                $table->unsignedInteger('order')->default(0);
                $table->boolean('is_published')->default(true);
                $table->boolean('is_preview')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('academy_enrollments')) {
            Schema::create('academy_enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('course_id')->constrained('academy_courses')->cascadeOnDelete();
                $table->foreignId('last_lesson_id')->nullable()->constrained('academy_lessons')->nullOnDelete();
                $table->decimal('progress_percentage', 5, 2)->default(0.00);
                $table->timestamp('completed_at')->nullable();
                $table->timestamp('last_accessed_at')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'course_id']);
            });
        }

        if (! Schema::hasTable('academy_progress')) {
            Schema::create('academy_progress', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('course_id')->constrained('academy_courses')->cascadeOnDelete();
                $table->foreignId('lesson_id')->constrained('academy_lessons')->cascadeOnDelete();
                $table->boolean('is_completed')->default(true);
                $table->timestamp('completed_at')->nullable();
                $table->unsignedInteger('watch_duration_seconds')->default(0);
                $table->timestamps();

                $table->unique(['user_id', 'lesson_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academy_progress');
        Schema::dropIfExists('academy_enrollments');
        Schema::dropIfExists('academy_lessons');
        Schema::dropIfExists('academy_modules');
        Schema::dropIfExists('academy_courses');
        Schema::dropIfExists('academy_categories');
    }
};
