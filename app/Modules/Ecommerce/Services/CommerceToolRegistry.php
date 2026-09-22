<?php

namespace App\Modules\Ecommerce\Services;

use App\Events\CommerceEventReceived;
use App\Events\ContactCreated;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Shared\Models\Contact;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CommerceToolRegistry
{
    /**
     * Get tool schemas formatted for LLM function calling (OpenAI / Gemini format).
     *
     * @param  array  $allowedTools  List of tool names allowed for the bot
     * @return array[]
     */
    public static function getToolDefinitions(array $allowedTools = []): array
    {
        $all = [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'search_products',
                    'description' => 'Search the merchant store catalog for available products matching a keyword, title, or category.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'query' => [
                                'type' => 'string',
                                'description' => 'Search keyword, product title, or category to look for.',
                            ],
                            'max_price' => [
                                'type' => 'number',
                                'description' => 'Optional maximum price ceiling.',
                            ],
                            'category' => [
                                'type' => 'string',
                                'description' => 'Optional product category or type (e.g. digital, physical, course, ebook).',
                            ],
                        ],
                        'required' => ['query'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_product_details',
                    'description' => 'Get real-time live pricing, description, stock status, and digital file download attributes for a specific product.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'product_id_or_slug' => [
                                'type' => 'string',
                                'description' => 'The product ID (e.g. "12") or URL slug (e.g. "ai-marketing-masterclass").',
                            ],
                        ],
                        'required' => ['product_id_or_slug'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'create_checkout_link',
                    'description' => 'Generate an instant 1-click checkout and payment link for a customer wanting to purchase a product.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'product_id' => [
                                'type' => 'integer',
                                'description' => 'The ID of the product the customer wishes to purchase.',
                            ],
                            'quantity' => [
                                'type' => 'integer',
                                'description' => 'Number of units (defaults to 1).',
                            ],
                            'customer_name' => [
                                'type' => 'string',
                                'description' => 'The customer full name, if provided in chat.',
                            ],
                            'customer_email' => [
                                'type' => 'string',
                                'description' => 'The customer email address for receipt and digital product download delivery.',
                            ],
                            'customer_phone' => [
                                'type' => 'string',
                                'description' => 'The customer phone number (WhatsApp or SMS format).',
                            ],
                            'coupon_code' => [
                                'type' => 'string',
                                'description' => 'Optional discount coupon code.',
                            ],
                        ],
                        'required' => ['product_id'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'check_order_status',
                    'description' => 'Check tracking, fulfillment, payment status, and download links for an existing customer order.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'order_number' => [
                                'type' => 'string',
                                'description' => 'The order number (e.g. "ORD-12345") or order UUID.',
                            ],
                            'customer_email' => [
                                'type' => 'string',
                                'description' => 'Customer email address to verify identity.',
                            ],
                        ],
                        'required' => ['order_number'],
                    ],
                ],
            ],
        ];

        if (empty($allowedTools)) {
            return $all;
        }

        return array_values(array_filter($all, fn ($t) => in_array($t['function']['name'], $allowedTools, true)));
    }

    /**
     * Execute a tool securely within the tenant's workspace scope.
     */
    public function execute(
        string $toolName,
        array $args,
        int $workspaceId,
        ?int $storeId = null,
        ?int $contactId = null
    ): array {
        try {
            return match ($toolName) {
                'search_products' => $this->searchProducts($args, $workspaceId, $storeId),
                'get_product_details' => $this->getProductDetails($args, $workspaceId, $storeId),
                'create_checkout_link' => $this->createCheckoutLink($args, $workspaceId, $storeId, $contactId),
                'check_order_status' => $this->checkOrderStatus($args, $workspaceId),
                default => ['error' => "Unknown tool: {$toolName}"],
            };
        } catch (\Throwable $e) {
            Log::error('CommerceToolRegistry execution error', [
                'tool' => $toolName,
                'args' => $args,
                'workspace_id' => $workspaceId,
                'error' => $e->getMessage(),
            ]);

            return ['error' => 'Failed to execute tool: '.$e->getMessage()];
        }
    }

    private function searchProducts(array $args, int $workspaceId, ?int $storeId): array
    {
        $query = $args['query'] ?? '';
        $maxPrice = isset($args['max_price']) ? (float) $args['max_price'] : null;
        $category = $args['category'] ?? null;

        $q = EcommerceProduct::where('workspace_id', $workspaceId)
            ->where('is_published', true);

        if ($storeId) {
            $q->where('store_id', $storeId);
        }

        if ($query) {
            $q->where(function ($sub) use ($query) {
                $sub->where('name', 'LIKE', "%{$query}%")
                    ->orWhere('description', 'LIKE', "%{$query}%")
                    ->orWhere('sku', 'LIKE', "%{$query}%");
            });
        }

        if ($maxPrice !== null && $maxPrice > 0) {
            $q->where('price', '<=', $maxPrice);
        }

        if ($category) {
            $q->where('product_type', 'LIKE', "%{$category}%");
        }

        $results = $q->take(5)->get(['id', 'slug', 'name', 'price', 'compare_at_price', 'currency', 'product_type', 'image_url']);

        if ($results->isEmpty()) {
            return [
                'found' => false,
                'message' => "No products found matching '{$query}'.",
                'products' => [],
            ];
        }

        return [
            'found' => true,
            'count' => $results->count(),
            'products' => $results->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
                'currency' => $p->currency ?: 'NGN',
                'url' => $p->getCheckoutUrl(),
                'product_type' => $p->product_type,
            ])->toArray(),
        ];
    }

    private function getProductDetails(array $args, int $workspaceId, ?int $storeId): array
    {
        $target = (string) ($args['product_id_or_slug'] ?? '');
        if (empty($target)) {
            return ['error' => 'Product identifier required.'];
        }

        $product = EcommerceProduct::where('workspace_id', $workspaceId)
            ->where(function ($q) use ($target) {
                $q->where('slug', $target)
                    ->orWhere('id', (int) $target);
            })
            ->with(['store', 'digitalAsset'])
            ->first();

        if (! $product) {
            return ['error' => "Product '{$target}' not found in store."];
        }

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'price' => (float) $product->price,
            'compare_at_price' => $product->compare_at_price ? (float) $product->compare_at_price : null,
            'currency' => $product->currency ?: 'NGN',
            'product_type' => $product->product_type,
            'description' => Str::limit(strip_tags($product->description ?? ''), 350),
            'checkout_url' => $product->getCheckoutUrl(),
            'in_stock' => $product->inventory_quantity === null || $product->inventory_quantity > 0,
            'digital_download' => $product->digitalAsset ? [
                'file_name' => $product->digitalAsset->file_name,
                'file_size' => $product->digitalAsset->formatted_file_size,
            ] : null,
        ];
    }

    private function createCheckoutLink(array $args, int $workspaceId, ?int $storeId, ?int $contactId): array
    {
        $productId = (int) ($args['product_id'] ?? 0);
        $product = EcommerceProduct::where('workspace_id', $workspaceId)->find($productId);

        if (! $product) {
            return ['error' => 'Product not found.'];
        }

        $customerEmail = ! empty($args['customer_email']) ? trim($args['customer_email']) : null;
        $customerPhone = ! empty($args['customer_phone']) ? trim($args['customer_phone']) : null;
        $customerName = ! empty($args['customer_name']) ? trim($args['customer_name']) : null;

        // Auto-upsert or link CRM Contact if contact information was provided
        $contact = null;
        if ($customerEmail || $customerPhone) {
            $contact = Contact::where('workspace_id', $workspaceId)
                ->where(function ($q) use ($customerEmail, $customerPhone) {
                    if ($customerEmail) {
                        $q->where('email', $customerEmail);
                    }
                    if ($customerPhone) {
                        $q->orWhere('phone_e164', $customerPhone);
                    }
                })->first();

            if (! $contact) {
                $contact = Contact::create([
                    'uuid' => (string) Str::uuid(),
                    'workspace_id' => $workspaceId,
                    'email' => $customerEmail,
                    'phone_e164' => $customerPhone,
                    'first_name' => $customerName ?: 'Customer',
                    'source' => 'ai_commerce_bot',
                ]);
                ContactCreated::dispatch($contact);
            }
        }

        $checkoutUrl = $product->getCheckoutUrl();
        $params = [];
        if ($customerEmail) {
            $params['email'] = $customerEmail;
        }
        if ($customerName) {
            $params['name'] = $customerName;
        }
        if ($customerPhone) {
            $params['phone'] = $customerPhone;
        }
        if (! empty($params)) {
            $checkoutUrl .= '?'.http_build_query($params);
        }

        // Fire commerce cart event for automations (abandoned cart workflows)
        if ($contact) {
            CommerceEventReceived::dispatch(
                $workspaceId,
                $contact->id,
                'cart.created',
                [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => (float) $product->price,
                    'currency' => $product->currency,
                    'checkout_url' => $checkoutUrl,
                ]
            );
        }

        return [
            'success' => true,
            'product_name' => $product->name,
            'total' => (float) $product->price,
            'currency' => $product->currency ?: 'NGN',
            'checkout_url' => $checkoutUrl,
            'action_prompt' => 'Click the link below to complete your order securely:',
        ];
    }

    private function checkOrderStatus(array $args, int $workspaceId): array
    {
        $orderNumber = trim($args['order_number'] ?? '');
        $email = isset($args['customer_email']) ? trim($args['customer_email']) : null;

        $q = EcommerceOrder::where('workspace_id', $workspaceId)
            ->where(function ($sub) use ($orderNumber) {
                $sub->where('number', $orderNumber)
                    ->orWhere('external_order_id', $orderNumber)
                    ->orWhere('uuid', $orderNumber);
            });

        if ($email) {
            $q->where('customer_email', $email);
        }

        $order = $q->first();

        if (! $order) {
            return [
                'found' => false,
                'message' => "Order '{$orderNumber}' was not found. Please verify the order number and email.",
            ];
        }

        $receiptUrl = ! empty($order->uuid) ? route('public.checkout.receipt', ['orderUuid' => $order->uuid]) : null;

        return [
            'found' => true,
            'order_number' => $order->number ?: $order->uuid,
            'status' => $order->status ?? 'processing',
            'payment_status' => $order->payment_status ?? ($order->paid_at ? 'paid' : 'pending'),
            'total' => (float) $order->total,
            'currency' => $order->currency ?: 'NGN',
            'tracking_url' => $order->tracking_url,
            'receipt_url' => $receiptUrl,
            'placed_at' => $order->placed_at ? $order->placed_at->toDateString() : null,
        ];
    }
}

