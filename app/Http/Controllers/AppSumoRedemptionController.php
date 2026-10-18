<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\License\AppSumoRedemptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AppSumoRedemptionController extends Controller
{
    public function __construct(
        protected AppSumoRedemptionService $service
    ) {}

    /**
     * Display the public AppSumo deal redemption portal.
     */
    public function show(Request $request): Response
    {
        $initialCode = trim((string) $request->query('code', ''));
        $codeDetails = null;

        if ($initialCode !== '') {
            $codeDetails = $this->service->validateCode($initialCode);
        }

        return Inertia::render('marketing/Redeem', [
            'initialCode' => $initialCode,
            'initialCodeDetails' => $codeDetails,
            'currentUser' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ] : null,
        ]);
    }

    /**
     * AJAX endpoint to validate code format and availability in real time.
     */
    public function validateCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:64'],
        ]);

        $result = $this->service->validateCode($validated['code']);

        return response()->json($result);
    }

    /**
     * Redeem code for a new user account (User + Client + Workspace).
     */
    public function redeemNew(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Password::defaults()],
            'agree_terms' => ['accepted'],
            'timezone' => ['nullable', 'string', 'max:64'],
        ], [
            'agree_terms.accepted' => __('You must accept the Terms & Conditions to create an account.'),
        ]);

        try {
            $user = $this->service->redeemForNewUser(
                $validated,
                $validated['code'],
                $request->ip(),
                $request->userAgent()
            );

            Auth::login($user);

            return redirect()->route('client.dashboard')->with(
                'success',
                __('Lifetime access activated! Welcome to your new Botify AI workspace.')
            );
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', $e->getMessage() ?: __('Redemption could not be completed. Please contact support.'));
        }
    }

    /**
     * Redeem or stack code for an existing user account.
     */
    public function redeemExisting(Request $request): RedirectResponse
    {
        $user = $request->user();

        // If not authenticated, require email and password
        if (! $user) {
            $credentials = $request->validate([
                'code' => ['required', 'string', 'max:64'],
                'email' => ['required', 'string', 'email'],
                'password' => ['required', 'string'],
            ]);

            if (! Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
                throw ValidationException::withMessages([
                    'email' => [__('Invalid email or password.')],
                ]);
            }

            $user = Auth::user();
        } else {
            $request->validate([
                'code' => ['required', 'string', 'max:64'],
            ]);
        }

        try {
            $result = $this->service->redeemForExistingUser(
                $user,
                $request->input('code'),
                $request->ip(),
                $request->userAgent()
            );

            return redirect()->route('client.subscription.show')->with('success', $result['message']);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', $e->getMessage() ?: __('Could not stack or redeem code.'));
        }
    }
}

