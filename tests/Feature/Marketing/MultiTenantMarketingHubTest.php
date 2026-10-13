<?php

namespace Tests\Feature\Marketing;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceOrderItem;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\Segment;
use App\Modules\Shared\Services\SegmentResolver;
use App\Services\Marketing\PlatformAudienceSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiTenantMarketingHubTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_audience_sync_never_imports_global_users_or_other_workspace_orders(): void
    {
        // Create platform workspace first (so tenant workspaces are non-platform)
        $platformCtx = $this->createWorkspaceContext(['name' => 'BotifyAI Platform']);
        $tenantACtx = $this->createWorkspaceContext(['name' => 'Tenant A']);
        $tenantBCtx = $this->createWorkspaceContext(['name' => 'Tenant B']);

        $widA = $tenantACtx['workspace']->id;
        $widB = $tenantBCtx['workspace']->id;

        $service = app(PlatformAudienceSyncService::class);
        $this->assertTrue($service->isPlatformWorkspace($platformCtx['workspace']->id));
        $this->assertFalse($service->isPlatformWorkspace($widA));
        $this->assertFalse($service->isPlatformWorkspace($widB));

        // Create a paid order in Tenant A and a paid order in Tenant B
        EcommerceOrder::create([
            'workspace_id' => $widA,
            'order_number' => 'ORD-A-001',
            'customer_name' => 'Alice Buyer',
            'customer_email' => 'alice@tenanta.test',
            'status' => 'completed',
            'payment_status' => 'paid',
            'subtotal_cents' => 5000,
            'total_cents' => 5000,
            'currency' => 'USD',
        ]);

        EcommerceOrder::create([
            'workspace_id' => $widB,
            'order_number' => 'ORD-B-001',
            'customer_name' => 'Bob Buyer',
            'customer_email' => 'bob@tenantb.test',
            'status' => 'completed',
            'payment_status' => 'paid',
            'subtotal_cents' => 9000,
            'total_cents' => 9000,
            'currency' => 'USD',
        ]);

        // Sync Tenant A's workspace audience
        $service->syncWorkspaceAudience($widA);

        $contactsA = Contact::where('workspace_id', $widA)->pluck('email')->all();

        // Tenant A must ONLY have alice@tenanta.test — NOT bob@tenantb.test, and NOT global User emails
        $this->assertSame(['alice@tenanta.test'], $contactsA);
        $this->assertNotContains($tenantBCtx['user']->email, $contactsA);
        $this->assertNotContains($platformCtx['user']->email, $contactsA);
    }

    public function test_segment_resolver_scopes_buyers_and_products_strictly_to_tenant_workspace(): void
    {
        $platformCtx = $this->createWorkspaceContext(['name' => 'BotifyAI Platform']);
        $tenantACtx = $this->createWorkspaceContext(['name' => 'Tenant A']);
        $tenantBCtx = $this->createWorkspaceContext(['name' => 'Tenant B']);

        $widA = $tenantACtx['workspace']->id;
        $widB = $tenantBCtx['workspace']->id;

        // Shared email exists as a contact in both Tenant A and Tenant B,
        // but only purchased in Tenant B!
        $contactA = Contact::create([
            'workspace_id' => $widA,
            'email' => 'shared@customer.test',
            'first_name' => 'Shared',
            'status' => 'subscribed',
            'email_opted_in' => true,
        ]);

        $contactB = Contact::create([
            'workspace_id' => $widB,
            'email' => 'shared@customer.test',
            'first_name' => 'Shared',
            'status' => 'subscribed',
            'email_opted_in' => true,
        ]);

        $productB = EcommerceProduct::create([
            'workspace_id' => $widB,
            'name' => 'Tenant B Course',
            'slug' => 'tenant-b-course',
            'type' => 'digital',
            'status' => 'active',
            'price_cents' => 10000,
            'currency' => 'USD',
        ]);

        $orderB = EcommerceOrder::create([
            'workspace_id' => $widB,
            'order_number' => 'ORD-B-999',
            'customer_name' => 'Shared Customer',
            'customer_email' => 'shared@customer.test',
            'status' => 'completed',
            'payment_status' => 'paid',
            'subtotal_cents' => 10000,
            'total_cents' => 10000,
            'currency' => 'USD',
        ]);

        EcommerceOrderItem::create([
            'order_id' => $orderB->id,
            'product_id' => $productB->id,
            'name' => $productB->name,
            'quantity' => 1,
            'unit_price_cents' => 10000,
            'total_cents' => 10000,
        ]);

        $resolver = app(SegmentResolver::class);

        // In Tenant A, shared@customer.test has 0 purchases in Tenant A, so "only_buyers" must be 0
        $this->assertSame(0, $resolver->presetQuery($widA, 'only_buyers')->count());
        // In Tenant B, shared@customer.test has 1 purchase in Tenant B, so "only_buyers" must be 1
        $this->assertSame(1, $resolver->presetQuery($widB, 'only_buyers')->count());

        // Product buyer filter in Tenant A for productB must return 0
        $segA = new Segment([
            'workspace_id' => $widA,
            'name' => 'Product Buyers A',
            'filter_rules' => ['product_id' => $productB->id],
        ]);
        $this->assertSame(0, $resolver->count($segA));
    }

    public function test_workspace_user_cannot_access_admin_marketing_hub(): void
    {
        $this->createWorkspaceContext(['name' => 'BotifyAI Platform']);
        $tenantCtx = $this->createWorkspaceContext(['name' => 'Tenant Workspace']);

        $response = $this->actingAs($tenantCtx['user'])->get('/admin/marketing');
        $this->assertTrue(in_array($response->status(), [302, 401, 403], true));
    }
}

