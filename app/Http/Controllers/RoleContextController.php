<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RoleContextController extends Controller
{
    /**
     * Switch the active user role between merchant, customer, and affiliate.
     */
    public function switchRole(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:merchant,customer,affiliate'],
        ]);

        $role = $validated['role'];
        $user = $request->user();

        // Update active role and persist
        $user->active_role = $role;

        // Ensure user_roles contains the active role
        $roles = $user->user_roles ?? ['merchant', 'customer', 'affiliate'];
        if (! in_array($role, $roles, true)) {
            $roles[] = $role;
            $user->user_roles = $roles;
        }

        if ($role === 'affiliate' && empty($user->affiliate_status)) {
            $user->affiliate_status = 'active';
        }

        $user->save();
        $request->session()->put('active_role', $role);

        $redirectTo = match ($role) {
            'customer' => route('buyer.dashboard'),
            'affiliate' => route('client.affiliates.index'),
            default => route('client.ecommerce.stores.index'),
        };

        return redirect($redirectTo)->with('success', 'Switched to ' . ucfirst($role) . ' Mode.');
    }
}
