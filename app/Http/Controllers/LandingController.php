<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\LandingPageController;
use App\Models\Currency;
use App\Models\Plan;
use App\Models\SystemSetting;
use App\Services\CurrencyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function __construct(
        private CurrencyService $currency
    ) {}

    private function landingDisabledRedirect(): ?RedirectResponse
    {
        if (SystemSetting::get('landing.page_enabled', '1') === '1' || ! Route::has('login')) {
            return null;
        }

        return redirect()->route('login');
    }

    private function resolveDisplayCurrency(?Request $request = null): string
    {
        $request = $request ?? request();
        $user = $request->user();

        return $user?->display_currency
            ?? ($user?->workspace?->currency_code ?? null)
            ?? $request->session()->get('display_currency')
            ?? Currency::defaultCode()
            ?? 'USD';
    }

    private function plans(?Request $request = null): array
    {
        try {
            $displayCurrency = $this->resolveDisplayCurrency($request);
            $targetCurrency = Currency::where('code', $displayCurrency)->where('enabled', true)->first();
            $decimals = (int) ($targetCurrency?->decimals ?? 2);
            $symbol = $targetCurrency?->symbol ?? '$';

            return Plan::where('enabled', true)
                ->orderBy('sort_order')
                ->get()
                ->map(function (Plan $p) use ($displayCurrency, $symbol, $decimals) {
                    $monthlyCents = $p->priceCentsForCycle('month') ?? 0;
                    $yearlyCents = $p->priceCentsForCycle('year') ?? 0;
                    $isFree = $monthlyCents === 0 && $yearlyCents === 0;

                    $monthlyConverted = $isFree ? 0 : $this->currency->convert($monthlyCents, $p->currency_code ?? 'USD', $displayCurrency);
                    $yearlyConverted = $isFree ? 0 : $this->currency->convert($yearlyCents, $p->currency_code ?? 'USD', $displayCurrency);

                    $factor = 10 ** $decimals;

                    return [
                        'id'                    => $p->id,
                        'name'                  => $p->name,
                        'description'           => $p->description ?? '',
                        'price_monthly'         => round($monthlyConverted / $factor, $decimals),
                        'price_yearly'          => round($yearlyConverted / $factor, $decimals),
                        'monthly_price_display' => $isFree ? null : $this->currency->format($monthlyConverted, $displayCurrency),
                        'yearly_price_display'  => $isFree ? null : $this->currency->format($yearlyConverted, $displayCurrency),
                        'currency_code'         => $displayCurrency,
                        'currency_symbol'       => $symbol,
                        'is_free'               => $isFree,
                        'features'              => is_array($p->features) ? $p->features : [],
                        'is_featured'           => (bool) ($p->featured ?? $p->popular ?? false),
                        'trial_days'            => $p->trial_days ?? 0,
                    ];
                })
                ->values()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    public function index(Request $request): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('Welcome', [
            'canLogin'    => Route::has('login'),
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
            'plans'       => $this->plans($request),
        ]);
    }

    public function pricing(Request $request): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/Pricing', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
            'plans'       => $this->plans($request),
        ]);
    }

    public function faq(): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/Faq', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
        ]);
    }

    public function useCases(): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/UseCases', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
        ]);
    }

    public function about(): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/About', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
        ]);
    }

    public function integrations(): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/Integrations', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
        ]);
    }
}
