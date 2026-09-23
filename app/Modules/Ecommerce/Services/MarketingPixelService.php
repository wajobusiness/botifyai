<?php

namespace App\Modules\Ecommerce\Services;

use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceStore;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MarketingPixelService
{
    /**
     * Build client-side HTML tracking snippet for the store's public head/body.
     */
    public function renderHeaderTags(EcommerceStore $store): string
    {
        $pixels = $store->marketing_pixels ?? [];
        if (empty($pixels)) {
            return '';
        }

        $html = '';

        // 1. Meta (Facebook) Pixel
        if (! empty($pixels['meta_pixel_id'])) {
            $pixelId = htmlspecialchars($pixels['meta_pixel_id'], ENT_QUOTES, 'UTF-8');
            $html .= <<<HTML
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{$pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id={$pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->

HTML;
        }

        // 2. Google Analytics 4 (GA4)
        if (! empty($pixels['ga4_measurement_id'])) {
            $gaId = htmlspecialchars($pixels['ga4_measurement_id'], ENT_QUOTES, 'UTF-8');
            $html .= <<<HTML
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id={$gaId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '{$gaId}');
</script>

HTML;
        }

        // 3. Google Tag Manager (GTM)
        if (! empty($pixels['gtm_container_id'])) {
            $gtmId = htmlspecialchars($pixels['gtm_container_id'], ENT_QUOTES, 'UTF-8');
            $html .= <<<HTML
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','{$gtmId}');</script>
<!-- End Google Tag Manager -->

HTML;
        }

        // 4. TikTok Pixel
        if (! empty($pixels['tiktok_pixel_id'])) {
            $ttId = htmlspecialchars($pixels['tiktok_pixel_id'], ENT_QUOTES, 'UTF-8');
            $html .= <<<HTML
<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('{$ttId}');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->

HTML;
        }

        // 5. Microsoft Clarity
        if (! empty($pixels['clarity_project_id'])) {
            $clarityId = htmlspecialchars($pixels['clarity_project_id'], ENT_QUOTES, 'UTF-8');
            $html .= <<<HTML
<!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "{$clarityId}");
</script>

HTML;
        }

        return $html;
    }

    /**
     * Dispatch server-side Conversion API events (Meta CAPI & TikTok CAPI) on successful purchase.
     */
    public function trackServerSidePurchase(EcommerceOrder $order): void
    {
        $store = $order->store;
        if (! $store) {
            return;
        }

        $pixels = $store->marketing_pixels ?? [];

        // 1. Meta Conversions API (CAPI)
        if (! empty($pixels['meta_pixel_id']) && ! empty($pixels['meta_capi_token'])) {
            $this->sendMetaCapiEvent($pixels['meta_pixel_id'], $pixels['meta_capi_token'], 'Purchase', [
                'event_name' => 'Purchase',
                'event_time' => time(),
                'event_id' => $order->uuid,
                'event_source_url' => route('public.checkout.receipt', ['orderUuid' => $order->uuid]),
                'action_source' => 'website',
                'user_data' => [
                    'em' => [hash('sha256', strtolower(trim($order->customer_email)))],
                    'ph' => ! empty($order->customer_phone) ? [hash('sha256', preg_replace('/\D/', '', $order->customer_phone))] : [],
                ],
                'custom_data' => [
                    'currency' => $order->currency ?: 'NGN',
                    'value' => (float) $order->total,
                    'order_id' => (string) $order->number,
                    'content_type' => 'product',
                    'contents' => collect($order->line_items ?? [])->map(fn ($item) => [
                        'id' => (string) ($item['product_id'] ?? $item['id'] ?? ''),
                        'quantity' => (int) ($item['quantity'] ?? 1),
                        'item_price' => (float) ($item['unit_price'] ?? $item['price'] ?? 0),
                    ])->values()->all(),
                ],
            ]);
        }

        // 2. TikTok Events API
        if (! empty($pixels['tiktok_pixel_id']) && ! empty($pixels['tiktok_access_token'])) {
            $this->sendTikTokEventsApi($pixels['tiktok_pixel_id'], $pixels['tiktok_access_token'], 'CompletePayment', [
                'event' => 'CompletePayment',
                'event_id' => $order->uuid,
                'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
                'context' => [
                    'user' => [
                        'email' => hash('sha256', strtolower(trim($order->customer_email))),
                    ],
                ],
                'properties' => [
                    'currency' => $order->currency ?: 'NGN',
                    'value' => (float) $order->total,
                    'order_id' => (string) $order->number,
                ],
            ]);
        }
    }

    protected function sendMetaCapiEvent(string $pixelId, string $accessToken, string $eventName, array $eventData): void
    {
        try {
            Http::timeout(5)->post("https://graph.facebook.com/v19.0/{$pixelId}/events", [
                'data' => [$eventData],
                'access_token' => $accessToken,
            ]);
        } catch (\Throwable $e) {
            Log::warning("Meta CAPI failed for pixel {$pixelId}: " . $e->getMessage());
        }
    }

    protected function sendTikTokEventsApi(string $pixelId, string $accessToken, string $eventName, array $eventData): void
    {
        try {
            Http::timeout(5)->withHeaders([
                'Access-Token' => $accessToken,
                'Content-Type' => 'application/json',
            ])->post('https://business-api.tiktok.com/open_api/v1.3/event/track/', [
                'pixel_code' => $pixelId,
                'event' => $eventData['event'],
                'event_id' => $eventData['event_id'],
                'timestamp' => $eventData['timestamp'],
                'context' => $eventData['context'],
                'properties' => $eventData['properties'],
            ]);
        } catch (\Throwable $e) {
            Log::warning("TikTok Events API failed for pixel {$pixelId}: " . $e->getMessage());
        }
    }
}

