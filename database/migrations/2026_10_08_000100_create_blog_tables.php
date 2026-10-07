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
        // 1. Blog Categories
        Schema::create('blog_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->text('description')->nullable();
            $table->string('icon', 50)->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'order']);
        });

        // 2. Blog Authors (E-E-A-T compliance for Google Search & AdSense)
        Schema::create('blog_authors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_user_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->string('title_role', 150)->nullable();
            $table->string('avatar_url', 500)->nullable();
            $table->text('bio')->nullable();
            $table->string('email', 150)->nullable();
            $table->json('social_links')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
        });

        // 3. Blog Tags
        Schema::create('blog_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->timestamps();
        });

        // 4. Blog Posts
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('blog_categories')->nullOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('blog_authors')->nullOnDelete();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('featured_image', 500)->nullable();
            $table->string('featured_image_alt', 255)->nullable();
            $table->string('status', 30)->default('draft'); // draft, scheduled, published, archived
            $table->timestamp('published_at')->nullable();
            $table->unsignedSmallInteger('reading_time_minutes')->default(3);
            $table->boolean('is_featured')->default(false);
            $table->unsignedBigInteger('views_count')->default(0);
            
            // Advanced SEO & Structured Data Metadata
            $table->string('meta_title', 255)->nullable();
            $table->text('meta_description')->nullable();
            $table->string('focus_keyword', 150)->nullable();
            $table->json('secondary_keywords')->nullable();
            $table->string('canonical_url', 500)->nullable();
            $table->string('og_image', 500)->nullable();
            $table->json('table_of_contents')->nullable();

            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index(['is_featured', 'published_at']);
            $table->index('category_id');
            $table->index('author_id');
        });

        // 5. Post Tag Pivot
        Schema::create('blog_post_tag', function (Blueprint $table) {
            $table->foreignId('post_id')->constrained('blog_posts')->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained('blog_tags')->cascadeOnDelete();
            $table->primary(['post_id', 'tag_id']);
        });

        // 6. AI Content & Topic Opportunity Logs
        Schema::create('blog_ai_topics', function (Blueprint $table) {
            $table->id();
            $table->string('topic_title', 255);
            $table->string('cluster_category', 100)->nullable();
            $table->string('search_intent', 50)->default('informational'); // informational, commercial, transactional
            $table->unsignedTinyInteger('difficulty_score')->default(30); // 1 - 100
            $table->json('target_keywords')->nullable();
            $table->json('outline')->nullable();
            $table->string('status', 30)->default('suggested'); // suggested, approved, drafted, rejected
            $table->foreignId('generated_post_id')->nullable()->constrained('blog_posts')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blog_ai_topics');
        Schema::dropIfExists('blog_post_tag');
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('blog_tags');
        Schema::dropIfExists('blog_authors');
        Schema::dropIfExists('blog_categories');
    }
};

