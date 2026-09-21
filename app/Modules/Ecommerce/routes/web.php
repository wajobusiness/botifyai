<?php

use App\Modules\Ecommerce\Http\Controllers\AdminPayoutController;
use App\Modules\Ecommerce\Http\Controllers\DigitalDownloadController;
use App\Modules\Ecommerce\Http\Controllers\EcommerceOAuthController;
use App\Modules\Ecommerce\Http\Controllers\MerchantWalletController;
use App\Modules\Ecommerce\Http\Controllers\NativeProductController;
use App\Modules\Ecommerce\Http\Controllers\OrderContextController;
use App\Modules\Ecommerce\Http\Controllers\OrderController;
use App\Modules\Ecommerce\Http\Controllers\ProductController;
use App\Modules\Ecommerce\Http\Controllers\PublicCheckoutController;
use App\Modules\Ecommerce\Http\Controllers\StoreController;
use Illuminate\Support\Facades\Route;

// Public Commerce Checkout, Receipt & Digital Delivery (No Auth required)
Route::middleware(['web'])->group(function () {
    Route::get('/buy/callback/verify', [PublicCheckoutController::class, 'verify'])->name('public.checkout.verify');
    Route::get('/buy/orders/{uuid}/status', [PublicCheckoutController::class, 'status'])->name('public.checkout.status');
    Route::get('/buy/receipt/{orderUuid}', [PublicCheckoutController::class, 'receipt'])->name('public.checkout.receipt');
    Route::get('/buy/download/{token}', [DigitalDownloadController::class, 'download'])->name('public.download.file');
    Route::get('/buy/{slug}', [PublicCheckoutController::class, 'show'])->name('public.checkout.show');
    Route::post('/buy/{slug}/checkout', [PublicCheckoutController::class, 'process'])->name('public.checkout.process');
});

// Ecommerce module — client app routes (per-workspace store & commerce management).
Route::middleware(['web', 'client-app'])->prefix('app/ecommerce')->name('client.ecommerce.')->group(function () {
    // Stores & Connectors
    Route::get('/stores', [StoreController::class, 'index'])->name('stores.index');
    Route::post('/stores', [StoreController::class, 'store'])->name('stores.store');
    Route::post('/stores/{store}/test', [StoreController::class, 'test'])->name('stores.test');
    Route::post('/stores/{store}/sync', [StoreController::class, 'sync'])->name('stores.sync');
    Route::delete('/stores/{store}', [StoreController::class, 'destroy'])->name('stores.destroy');

    // OAuth onboarding
    Route::get('/oauth/{platform}/connect', [EcommerceOAuthController::class, 'connect'])->name('oauth.connect');
    Route::get('/oauth/shopify/callback', [EcommerceOAuthController::class, 'shopifyCallback'])->name('oauth.shopify.callback');
    Route::get('/oauth/bigcommerce/callback', [EcommerceOAuthController::class, 'bigcommerceCallback'])->name('oauth.bigcommerce.callback');
    Route::get('/oauth/woocommerce/return', [EcommerceOAuthController::class, 'woocommerceReturn'])->name('oauth.woocommerce.return');

    // Products & Native Catalog
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/products/search', [ProductController::class, 'search'])->name('products.search');
    Route::post('/products/native', [NativeProductController::class, 'store'])->name('products.native.store');
    Route::post('/products/native/{product}', [NativeProductController::class, 'update'])->name('products.native.update');
    Route::delete('/products/native/{product}', [NativeProductController::class, 'destroy'])->name('products.native.destroy');
    Route::post('/products/native/{product}/toggle-publish', [NativeProductController::class, 'togglePublish'])->name('products.native.toggle-publish');

    // Orders dashboard + management
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/orders/{order}/refresh', [OrderController::class, 'refresh'])->name('orders.refresh');
    Route::post('/orders/{order}/fulfill', [OrderController::class, 'fulfill'])->name('orders.fulfill');

    // Merchant Wallet & Payouts
    Route::get('/wallet', [MerchantWalletController::class, 'index'])->name('wallet.index');
    Route::post('/wallet/payouts', [MerchantWalletController::class, 'requestPayout'])->name('wallet.payouts.store');
    Route::post('/wallet/bank-accounts', [MerchantWalletController::class, 'storeBankAccount'])->name('wallet.bank-accounts.store');
    Route::delete('/wallet/bank-accounts/{bankAccount}', [MerchantWalletController::class, 'destroyBankAccount'])->name('wallet.bank-accounts.destroy');
    Route::get('/wallet/resolve-bank', [MerchantWalletController::class, 'resolveAccount'])->name('wallet.bank-accounts.resolve');

    // Inbox order context
    Route::get('/contacts/{contact}/orders', [OrderContextController::class, 'index'])->name('contacts.orders');
});

// Platform Admin Payout Management
Route::middleware(['web', 'auth', 'admin'])->prefix('admin/ecommerce')->name('admin.ecommerce.')->group(function () {
    Route::get('/payouts', [AdminPayoutController::class, 'index'])->name('payouts.index');
    Route::post('/payouts/{payout}/approve', [AdminPayoutController::class, 'approve'])->name('payouts.approve');
    Route::post('/payouts/{payout}/reject', [AdminPayoutController::class, 'reject'])->name('payouts.reject');
});
