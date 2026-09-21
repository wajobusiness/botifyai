<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewayConfig;
use App\Modules\Ecommerce\Models\MerchantBankAccount;
use App\Modules\Ecommerce\Models\MerchantLedgerEntry;
use App\Modules\Ecommerce\Models\MerchantPayoutRequest;
use App\Modules\Ecommerce\Models\MerchantWallet;
use App\Modules\Ecommerce\Services\MerchantWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class MerchantWalletController extends Controller
{
    public function __construct(
        private MerchantWalletService $walletService
    ) {}

    /**
     * Display merchant wallet overview, ledger entries, and bank accounts.
     */
    public function index(Request $request): Response
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
        $currency = strtoupper($request->input('currency', 'NGN'));

        $wallet = MerchantWallet::getOrCreate($workspaceId, $currency);

        $ledgerEntries = MerchantLedgerEntry::where('workspace_id', $workspaceId)
            ->where('wallet_id', $wallet->id)
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (MerchantLedgerEntry $e) => [
                'id' => $e->id,
                'entry_type' => $e->entry_type,
                'amount' => $e->formatted_amount,
                'fee' => $e->formatted_fee,
                'net_amount' => $e->formatted_net_amount,
                'running_balance' => $e->formatted_running_balance,
                'currency' => $e->currency,
                'description' => $e->description,
                'created_at' => $e->created_at->format('M d, Y H:i'),
            ]);

        $bankAccounts = MerchantBankAccount::where('workspace_id', $workspaceId)
            ->orderByDesc('is_default')
            ->get()
            ->map(fn (MerchantBankAccount $b) => [
                'id' => $b->id,
                'bank_name' => $b->bank_name,
                'account_number' => $b->masked_account_number,
                'account_name' => $b->account_name,
                'currency' => $b->currency,
                'is_default' => $b->is_default,
            ]);

        $payoutRequests = MerchantPayoutRequest::with('bankAccount')
            ->where('workspace_id', $workspaceId)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (MerchantPayoutRequest $p) => [
                'id' => $p->id,
                'reference' => $p->reference,
                'amount' => $p->formatted_amount,
                'currency' => $p->currency,
                'status' => $p->status,
                'bank_name' => $p->bankAccount?->bank_name,
                'account_number' => $p->bankAccount?->masked_account_number,
                'rejection_reason' => $p->rejection_reason,
                'created_at' => $p->created_at->format('M d, Y'),
            ]);

        return Inertia::render('Ecommerce/Wallet/Index', [
            'wallet' => [
                'id' => $wallet->id,
                'currency' => $wallet->currency,
                'available_balance' => $wallet->available_balance,
                'pending_balance' => $wallet->pending_balance,
                'total_withdrawn' => $wallet->total_withdrawn,
                'total_earned' => $wallet->total_earned,
                'is_frozen' => $wallet->is_frozen,
            ],
            'ledgerEntries' => $ledgerEntries,
            'bankAccounts' => $bankAccounts,
            'payoutRequests' => $payoutRequests,
            'minPayoutAmount' => ($this->walletService::MINIMUM_PAYOUT_THRESHOLDS[$currency] ?? 500000) / 100,
        ]);
    }

    /**
     * Request a withdrawal payout.
     */
    public function requestPayout(Request $request): RedirectResponse
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);

        $validated = $request->validate([
            'bank_account_id' => ['required', 'integer', 'exists:merchant_bank_accounts,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'currency' => ['nullable', 'string', 'in:NGN,USD,EUR,GBP'],
        ]);

        $currency = strtoupper($validated['currency'] ?? 'NGN');
        $amountCents = (int) round(((float) $validated['amount']) * 100);

        try {
            $payout = $this->walletService->requestPayout(
                $workspaceId,
                (int) $validated['bank_account_id'],
                $amountCents,
                $currency
            );

            return back()->with('success', "Payout request #{$payout->reference} submitted successfully! Your funds are awaiting admin processing.");
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Save a merchant bank account with optional Paystack account name resolution.
     */
    public function storeBankAccount(Request $request): RedirectResponse
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);

        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:128'],
            'bank_code' => ['nullable', 'string', 'max:32'],
            'account_number' => ['required', 'string', 'max:64'],
            'account_name' => ['required', 'string', 'max:128'],
            'currency' => ['nullable', 'string', 'max:8'],
        ]);

        $hasExisting = MerchantBankAccount::where('workspace_id', $workspaceId)->exists();

        MerchantBankAccount::create([
            'workspace_id' => $workspaceId,
            'bank_name' => $validated['bank_name'],
            'bank_code' => $validated['bank_code'] ?? null,
            'account_number' => $validated['account_number'],
            'account_name' => $validated['account_name'],
            'currency' => strtoupper($validated['currency'] ?? 'NGN'),
            'is_default' => ! $hasExisting,
        ]);

        return back()->with('success', 'Bank account added successfully.');
    }

    /**
     * Delete a saved bank account.
     */
    public function destroyBankAccount(Request $request, MerchantBankAccount $bankAccount): RedirectResponse
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);

        if ($bankAccount->workspace_id !== $workspaceId) {
            abort(403);
        }

        $bankAccount->delete();

        return back()->with('success', 'Bank account removed.');
    }

    /**
     * Resolve Nigerian bank account name via Paystack API (optional AJAX helper).
     */
    public function resolveAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_number' => ['required', 'digits:10'],
            'bank_code' => ['required', 'string'],
        ]);

        $config = PaymentGatewayConfig::where('gateway', 'paystack')->where('enabled', true)->first();
        $creds = $config?->getActiveCredentials() ?? [];
        $secretKey = $creds['secret_key'] ?? config('services.paystack.secret_key', '');

        if (empty($secretKey)) {
            return response()->json(['error' => 'Paystack not configured for verification.'], 422);
        }

        $res = Http::withToken($secretKey)
            ->acceptJson()
            ->get('https://api.paystack.co/bank/resolve', [
                'account_number' => $validated['account_number'],
                'bank_code' => $validated['bank_code'],
            ]);

        if ($res->successful() && $res->json('status') === true) {
            return response()->json([
                'success' => true,
                'account_name' => $res->json('data.account_name'),
            ]);
        }

        return response()->json([
            'error' => $res->json('message') ?: 'Unable to verify account details.',
        ], 422);
    }
}
