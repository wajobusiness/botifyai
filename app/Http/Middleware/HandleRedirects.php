<?php

namespace App\Http\Middleware;

use App\Models\Redirect;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class HandleRedirects
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Don't intercept POST/PUT/DELETE, webhooks, admin, or API requests
        if (! $request->isMethod('GET') && ! $request->isMethod('HEAD')) {
            return $next($request);
        }

        $path = '/'.ltrim($request->path(), '/');

        // Skip internal system paths
        if (Str::startsWith($path, ['/admin', '/api', '/webhooks', '/broadcasting', '/healthz', '/install', '/storage'])) {
            return $next($request);
        }

        try {
            $redirect = Redirect::where('is_active', true)
                ->where('source_path', $path)
                ->first();

            if ($redirect) {
                $target = $redirect->target_url;
                $query = $request->getQueryString();
                if ($query) {
                    $target .= (str_contains($target, '?') ? '&' : '?').$query;
                }

                // Increment hit count asynchronously or silently
                try {
                    $redirect->recordHit();
                } catch (\Throwable) {
                    // Ignore recording failure
                }

                return redirect()->to($target, $redirect->status_code ?: 301);
            }
        } catch (\Throwable) {
            // DB might not be ready or table might not exist yet
        }

        return $next($request);
    }
}

