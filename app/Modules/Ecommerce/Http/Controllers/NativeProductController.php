<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Services\NativeProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;

class NativeProductController extends Controller
{
    public function __construct(
        private NativeProductService $productService
    ) {}

    /**
     * Store a new native digital product.
     */
    public function store(Request $request): RedirectResponse
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:191'],
            'product_type' => ['required', 'string', 'in:digital,physical,service'],
            'price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:8'],
            'description' => ['nullable', 'string'],
            'asset_type' => ['nullable', 'string', 'in:file_upload,redirect_url'],
            'external_redirect_url' => ['nullable', 'url', 'max:1000'],
            'digital_file' => ['nullable', 'file', 'max:102400'], // Max 100MB
            'cover_image' => ['nullable', 'image', 'max:5120'], // Max 5MB
            'is_published' => ['nullable', 'boolean'],
        ]);

        try {
            $product = $this->productService->createProduct(
                $workspaceId,
                $validated,
                $request->file('digital_file'),
                $request->file('cover_image')
            );

            return back()->with('success', "Product '{$product->name}' created successfully! Checkout link: {$product->getCheckoutUrl()}");
        } catch (Throwable $e) {
            return back()->with('error', 'Failed to create product: '.$e->getMessage());
        }
    }

    /**
     * Update an existing product.
     */
    public function update(Request $request, EcommerceProduct $product): RedirectResponse
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
        if ($product->workspace_id !== $workspaceId) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:191'],
            'price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:8'],
            'description' => ['nullable', 'string'],
            'asset_type' => ['nullable', 'string', 'in:file_upload,redirect_url'],
            'external_redirect_url' => ['nullable', 'url', 'max:1000'],
            'digital_file' => ['nullable', 'file', 'max:102400'],
            'cover_image' => ['nullable', 'image', 'max:5120'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        try {
            $this->productService->updateProduct(
                $product,
                $validated,
                $request->file('digital_file'),
                $request->file('cover_image')
            );

            return back()->with('success', 'Product updated successfully.');
        } catch (Throwable $e) {
            return back()->with('error', 'Failed to update product: '.$e->getMessage());
        }
    }

    /**
     * Delete a product.
     */
    public function destroy(Request $request, EcommerceProduct $product): RedirectResponse
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
        if ($product->workspace_id !== $workspaceId) {
            abort(403);
        }

        $product->delete();

        return back()->with('success', 'Product deleted successfully.');
    }

    /**
     * Toggle product publish status.
     */
    public function togglePublish(Request $request, EcommerceProduct $product): RedirectResponse
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
        if ($product->workspace_id !== $workspaceId) {
            abort(403);
        }

        $product->update(['is_published' => ! $product->is_published]);

        return back()->with('success', $product->is_published ? 'Product is now live.' : 'Product unpublished.');
    }
}
