<?php

namespace App\Http\Controllers\Seo;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

class RobotsController extends Controller
{
    /**
     * Render dynamic robots.txt.
     */
    public function __invoke(): Response
    {
        $sitemapUrl = route('sitemap');

        $lines = [
            '# =========================================================',
            '# BotifyAI Search Engine & AI Crawler Directives',
            '# =========================================================',
            '',
            'User-agent: *',
            'Disallow: /admin/',
            'Disallow: /app/',
            'Disallow: /buyer/',
            'Disallow: /billing/',
            'Disallow: /webhooks/',
            'Disallow: /broadcasting/',
            'Disallow: /api/',
            'Disallow: /buy/orders/',
            'Disallow: /storage/temp/',
            'Allow: /storage/',
            'Allow: /store/',
            'Allow: /buy/',
            'Allow: /p/',
            'Allow: /',
            '',
            '# AI Crawlers & Model Indexers',
            'User-agent: GPTBot',
            'Allow: /',
            'Disallow: /app/',
            'Disallow: /admin/',
            '',
            'User-agent: ClaudeBot',
            'Allow: /',
            'Disallow: /app/',
            'Disallow: /admin/',
            '',
            'User-agent: PerplexityBot',
            'Allow: /',
            'Disallow: /app/',
            'Disallow: /admin/',
            '',
            'User-agent: CCBot',
            'Allow: /',
            'Disallow: /app/',
            'Disallow: /admin/',
            '',
            "Sitemap: {$sitemapUrl}",
        ];

        return response(implode("\n", $lines), 200)
            ->header('Content-Type', 'text/plain')
            ->header('Cache-Control', 'public, max-age=86400');
    }
}

