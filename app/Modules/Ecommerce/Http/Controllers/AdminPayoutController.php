<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\MerchantPayoutRequest;
use App\Modules\Ecommerce\Services\MerchantWalletService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AdminPayoutController extends Controller
{
    public function __construct(
        private MerchantWalletService $walletService
    ) {}

    /**
     * Display all merchant payout requests for platform administrators.
     */
    public function index(Request $request): Response
    {
        $status = $request->input('status', 'pending');

        $payouts = MerchantPayoutRequest::with(['wallet', 'bankAccount'])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (MerchantPayoutRequest $p) => [
                'id' => $p->id,
                'workspace_id' => $p->workspace_id,
                'reference' => $p->reference,
                'amount' => $p->formatted_amount,
                'currency' => $p->currency,
                'status' => $p->status,
                'bank_name' => $p->bankAccount?->bank_name,
                'account_number' => $p->bankAccount?->account_number,
                'account_name' => $p->bankAccount?->account_name,
                'recipient_code' => $p->bankAccount?->recipient_code,
                'rejection_reason' => $p->rejection_reason,
                'processed_at' => $p->processed_at?->format('M d, Y H:i'),
                'created_at' => $p->created_at->format('M d, Y H:i'),
            ]);

        $counts = [
            'pending' => MerchantPayoutRequest::where('status', 'pending')->count(),
            'completed' => MerchantPayoutRequest::where('status', 'completed')->count(),
            'rejected' => MerchantPayoutRequest::where('status', 'rejected')->count(),
        ];

        return Inertia::render('Admin/Ecommerce/Payouts', [
            'payouts' => $payouts,
            'counts' => $counts,
            'currentStatus' => $status,
        ]);
    }

    /**
     * Approve and mark payout completed.
     */
    public function approve(Request $request, MerchantPayoutRequest $payout): RedirectResponse
    {
        if ($payout->status !== 'pending') {
            return back()->with('error', 'Only pending payouts can be approved.');
        }

        try {
            $admin = $request->user('admin') ?? $request->user();
            $this->walletService->completePayout($payout, (int) ($admin?->id ?? 1));

            return back()->with('success', "Payout #{$payout->reference} marked as completed.");
        } catch (Throwable $e) {
            return back()->with('error', 'Error completing payout: '.$e->getMessage());
        }
    }

    /**
     * Reject payout and refund funds back to merchant wallet.
     */
    public function reject(Request $request, MerchantPayoutRequest $payout): RedirectResponse
    {
        if ($payout->status !== 'pending') {
            return back()->with('error', 'Only pending payouts can be rejected.');
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $admin = $request->user('admin') ?? $request->user();
            $this->walletService->rejectPayout($payout, $validated['rejection_reason'], (int) ($admin?->id ?? 1));

            return back()->with('success', "Payout #{$payout->reference} rejected and funds restored to merchant.");
        } catch (Throwable $e) {
            return back()->with('error', 'Error rejecting payout: '.$e->getMessage());
        }
    }
}
