<?php

namespace App\Modules\Ecommerce\Services;

use App\Modules\Ecommerce\Models\EcommerceDigitalAsset;
use App\Modules\Ecommerce\Models\EcommerceDownloadToken;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Services\StorageManager;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DigitalFulfillmentService
{
    public function __construct(
        private StorageManager $storageManager
    ) {}

    /**
     * Generate download tokens for all digital products in an order.
     *
     * @return array<int, EcommerceDownloadToken>
     */
    public function fulfillOrder(EcommerceOrder $order): array
    {
        $tokens = [];
        $lineItems = $order->line_items ?? [];

        foreach ($lineItems as $item) {
            $productId = $item['product_id'] ?? null;
            if (! $productId) {
                continue;
            }

            $product = EcommerceProduct::with('digitalAsset')->find($productId);
            if (! $product || $product->product_type !== 'digital') {
                continue;
            }

            $asset = $product->digitalAsset;

            // Generate token (expires in 72 hours, max 5 downloads)
            $token = EcommerceDownloadToken::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'digital_asset_id' => $asset?->id,
                'max_downloads' => 5,
                'expires_at' => now()->addHours(72),
            ]);

            $tokens[] = $token;
        }

        return $tokens;
    }

    /**
     * Download the digital asset associated with a valid token.
     */
    public function downloadFile(EcommerceDownloadToken $token, ?string $clientIp = null): Response
    {
        if (! $token->canDownload()) {
            abort(403, 'This download link has expired or reached its maximum download limit.');
        }

        $asset = $token->digitalAsset;
        if (! $asset) {
            abort(404, 'No digital asset found for this product.');
        }

        // If it's an external redirect (e.g. Notion template, Google Drive, Course link)
        if ($asset->asset_type === 'redirect_url' && ! empty($asset->external_redirect_url)) {
            $token->recordDownload($clientIp);

            return redirect()->away($asset->external_redirect_url);
        }

        // File upload from disk
        $disk = $this->storageManager->disk();
        $filePath = $asset->file_path;

        if (! $filePath || ! $disk->exists($filePath)) {
            Log::error('Digital asset file missing from storage', [
                'token_id' => $token->id,
                'asset_id' => $asset->id,
                'file_path' => $filePath,
            ]);
            abort(404, 'File could not be found on the storage server. Please contact merchant support.');
        }

        $token->recordDownload($clientIp);

        $fileName = $asset->file_name ?: basename($filePath);
        $mimeType = $asset->mime_type ?: 'application/octet-stream';
        $fileSize = $asset->file_size_bytes ?: $disk->size($filePath);

        return new StreamedResponse(function () use ($disk, $filePath) {
            $stream = $disk->readStream($filePath);
            if ($stream) {
                fpassthru($stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => (string) $fileSize,
            'Content-Disposition' => 'attachment; filename="'.addslashes($fileName).'"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
