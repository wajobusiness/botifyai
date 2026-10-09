<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleSafeEncodedPayloads
{
    /**
     * Handle an incoming request and recursively decode any base64-encoded strings (prefixed with b64:).
     * This protects rich text and HTML forms from being falsely blocked by Web Application Firewalls (ModSecurity / LiteSpeed WAF).
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH')) {
            $inputs = $request->all();
            $decoded = $this->decodeRecursive($inputs);
            $request->merge($decoded);
        }

        return $next($request);
    }

    private function decodeRecursive(mixed $data): mixed
    {
        if (is_array($data)) {
            foreach ($data as $key => $val) {
                $data[$key] = $this->decodeRecursive($val);
            }
            return $data;
        }

        if (is_string($data) && str_starts_with($data, 'b64:')) {
            $raw = substr($data, 4);
            $decoded = base64_decode($raw, true);
            if ($decoded !== false) {
                return $decoded;
            }
        }

        return $data;
    }
}
