<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceDownloadToken;
use App\Modules\Ecommerce\Services\DigitalFulfillmentService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DigitalDownloadController extends Controller
{
    public function __construct(
        private DigitalFulfillmentService $fulfillmentService
    ) {}

    /**
     * Download the purchased digital asset via secure token.
     */
    public function download(Request $request, string $token): Response
    {
        $downloadToken = EcommerceDownloadToken::with(['product', 'digitalAsset'])
            ->where('token', $token)
            ->firstOrFail();

        return $this->fulfillmentService->downloadFile($downloadToken, $request->ip());
    }
}
