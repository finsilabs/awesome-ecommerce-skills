---
name: influencer-tracking
description: "Measure influencer campaign ROI by generating unique UTM links per creator, attributing sales, and reporting revenue against campaign spend"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [influencer, attribution, utm, roi, campaign-tracking, creator, ugc, instagram, tiktok]
triggers: ["influencer tracking", "influencer attribution", "influencer ROI", "UTM management", "creator campaign tracking", "influencer marketing analytics"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Influencer Tracking

## Overview

Influencer marketing drives significant e-commerce revenue but is notoriously difficult to attribute because customers often see an influencer post, leave the platform, and purchase days later through a direct or organic channel. This skill covers generating unique UTM links and promo codes per influencer, building a first-touch attribution model that captures the influencer's role, measuring CPM/CPS/ROI per campaign, and storing structured campaign metadata for cross-campaign comparison.

## When to Use This Skill

> **Note:** For full influencer campaign management, see @influencer-marketplace-integration. This skill focuses purely on attribution and analytics.

- When managing 10+ influencer partnerships and tracking them manually in a spreadsheet
- When needing to prove ROI of influencer spend to leadership with first-party data
- When building a creator portal where influencers can generate their own tracking links
- When running gifting campaigns and needing to separate organic versus paid influencer posts
- When combining UTM tracking with unique promo codes to capture offline/app conversions
- When comparing performance across platforms (Instagram, TikTok, YouTube) in a single dashboard

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, UTM tracking setup, analytics platform (GA4 or similar), discount/coupon code generation

## Core Instructions

1. **Define the influencer and campaign data model**

   ```typescript
   interface Influencer {
     id: string;
     handle: string;           // @influencer_name
     platform: 'instagram' | 'tiktok' | 'youtube' | 'pinterest' | 'blog';
     followerCount: number;
     niche: string[];          // e.g., ['fashion', 'sustainability']
     email: string;
     feeStructure: 'flat_fee' | 'gifted' | 'commission' | 'hybrid';
   }

   interface Campaign {
     id: string;
     influencerId: string;
     name: string;
     platform: string;
     startDate: Date;
     endDate: Date;
     budget: number;           // flat fee or gifting value in dollars
     deliverables: string[];   // e.g., ['1 feed post', '3 stories', '1 reel']
     promoCode: string;        // unique discount code for this influencer
     utmParams: UTMParams;
   }

   interface UTMParams {
     utm_source: string;       // e.g., 'instagram'
     utm_medium: string;       // e.g., 'influencer'
     utm_campaign: string;     // e.g., 'spring-2026'
     utm_content: string;      // e.g., 'janedoe'  (influencer handle)
     utm_term?: string;        // optional: 'reel' | 'story' | 'post'
   }
   ```

2. **Generate unique tracking links and promo codes**

   ```typescript
   function buildInfluencerLink(influencer: Influencer, campaign: Campaign, destination: string): string {
     const params = new URLSearchParams({
       utm_source: influencer.platform,
       utm_medium: 'influencer',
       utm_campaign: campaign.name.toLowerCase().replace(/\s+/g, '-'),
       utm_content: influencer.handle.replace('@', ''),
     });
     return `${process.env.STORE_URL}${destination}?${params}`;
   }

   async function createInfluencerPromoCode(influencer: Influencer, campaign: Campaign) {
     // Format: JANE15 — influencer's first name + discount percentage
     const code = `${influencer.handle.replace('@', '').slice(0, 6).toUpperCase()}${campaign.discountPct ?? 10}`;

     await db.promotions.create({
       code,
       type: 'percent_off',
       value: campaign.discountPct ?? 10,
       usageLimit: null,         // unlimited uses
       perCustomerLimit: 1,
       validFrom: campaign.startDate,
       validUntil: campaign.endDate,
       metadata: { campaignId: campaign.id, influencerId: influencer.id },
     });

     return code;
   }
   ```

3. **Capture first-touch attribution for influencer visits**

   Standard last-click UTM attribution misses influencer impact — customers often visit once from the post and purchase later. Store the first UTM touch separately:

   ```typescript
   // Client-side: on every page load, capture UTM if not already stored
   function captureFirstTouchUTM() {
     const params = new URLSearchParams(window.location.search);
     const utmSource = params.get('utm_source');

     if (!utmSource) return;

     // Only overwrite if no first-touch is stored yet in this session
     if (!sessionStorage.getItem('first_touch_utm')) {
       const firstTouch = {
         utm_source: utmSource,
         utm_medium: params.get('utm_medium'),
         utm_campaign: params.get('utm_campaign'),
         utm_content: params.get('utm_content'),
         utm_term: params.get('utm_term'),
         landed_at: new Date().toISOString(),
         landing_page: window.location.pathname,
       };
       sessionStorage.setItem('first_touch_utm', JSON.stringify(firstTouch));
     }

     // Always update last-touch
     localStorage.setItem('last_touch_utm', JSON.stringify({
       utm_source: utmSource,
       utm_medium: params.get('utm_medium'),
       utm_campaign: params.get('utm_campaign'),
       utm_content: params.get('utm_content'),
     }));
   }
   ```

4. **Attribute orders to influencer campaigns**

   ```typescript
   // At order placement, include both first-touch and last-touch attribution
   async function captureOrderInfluencerAttribution(orderId: string, request: Request) {
     const firstTouch = JSON.parse(request.cookies.first_touch_utm ?? '{}');
     const lastTouch = JSON.parse(request.cookies.last_touch_utm ?? '{}');
     const promoCode = request.body.promoCode;

     let campaignId: string | null = null;

     // If the promo code is an influencer code, attribute to that campaign
     if (promoCode) {
       const promo = await db.promotions.findByCode(promoCode);
       if (promo?.metadata?.campaignId) {
         campaignId = promo.metadata.campaignId;
       }
     }

     // Fall back to UTM attribution if no promo code
     if (!campaignId && firstTouch.utm_medium === 'influencer') {
       const campaign = await db.campaigns.findByUTMContent(firstTouch.utm_content);
       campaignId = campaign?.id ?? null;
     }

     if (campaignId) {
       await db.orderCampaignAttribution.create({
         orderId,
         campaignId,
         attributionType: promoCode ? 'promo_code' : 'utm_first_touch',
         firstTouchUtm: firstTouch,
         lastTouchUtm: lastTouch,
       });
     }
   }
   ```

5. **Calculate campaign ROI and EMV (Earned Media Value)**

   ```typescript
   async function calculateCampaignROI(campaignId: string) {
     const campaign = await db.campaigns.findById(campaignId, { include: ['influencer'] });
     const orders = await db.orderCampaignAttribution.findByCampaign(campaignId, { include: ['order'] });

     const revenue = orders.reduce((sum, a) => sum + a.order.subtotalCents / 100, 0);
     const orders_count = orders.length;
     const aov = orders_count > 0 ? revenue / orders_count : 0;

     // ROAS = Revenue / Ad Spend (flat fee)
     const roas = campaign.budget > 0 ? revenue / campaign.budget : null;

     // CPS = Cost Per Sale
     const cps = orders_count > 0 ? campaign.budget / orders_count : null;

     // EMV = estimated value of organic reach at CPM rates
     // Industry average: $0.01 per impression for Instagram
     const impressions = await fetchPostImpressions(campaign);
     const emv = impressions * 0.01;

     return { revenue, orders_count, aov, roas, cps, emv, campaignBudget: campaign.budget, influencerHandle: campaign.influencer.handle };
   }
   ```

## Examples

### Creator portal — influencer generates their own links

```typescript
// GET /api/creator/my-links
export async function getCreatorLinks(req: Request, res: Response) {
  const influencer = await db.influencers.findByUserId(req.user.id);
  const activeCampaigns = await db.campaigns.findActiveByInfluencer(influencer.id);

  const links = activeCampaigns.map((campaign) => ({
    campaign: campaign.name,
    promoCode: campaign.promoCode,
    trackingLink: buildInfluencerLink(influencer, campaign, '/'),
    productLinks: campaign.featuredProducts.map((p) => ({
      product: p.name,
      link: buildInfluencerLink(influencer, campaign, `/products/${p.slug}`),
    })),
    discount: `${campaign.discountPct}% off for your followers`,
    validUntil: campaign.endDate,
  }));

  res.json(links);
}
```

### Cross-campaign performance comparison query

```sql
SELECT
  inf.handle,
  inf.platform,
  inf.follower_count,
  c.name AS campaign_name,
  c.budget,
  COUNT(oca.order_id) AS attributed_orders,
  SUM(o.subtotal_cents) / 100.0 AS attributed_revenue,
  ROUND(SUM(o.subtotal_cents) / 100.0 / NULLIF(c.budget, 0), 2) AS roas,
  ROUND(c.budget / NULLIF(COUNT(oca.order_id), 0), 2) AS cost_per_sale
FROM campaigns c
JOIN influencers inf ON c.influencer_id = inf.id
LEFT JOIN order_campaign_attribution oca ON c.id = oca.campaign_id
LEFT JOIN orders o ON oca.order_id = o.id
WHERE c.end_date >= NOW() - INTERVAL '90 days'
GROUP BY inf.id, inf.handle, inf.platform, inf.follower_count, c.id, c.name, c.budget
ORDER BY attributed_revenue DESC;
```

## Best Practices

- **Always use both UTM links and promo codes together** — UTM tracks browsing traffic; promo codes capture purchases that happen via direct or organic after the initial influencer visit
- **Use `utm_content` for the influencer handle** so you can segment performance by creator within a single campaign (e.g., spring-2026 run with 20 influencers)
- **Require posts to include the tracking link in bio** for Instagram, since links in captions are not clickable — provide influencers with a customized link-in-bio URL
- **Fetch post impressions and engagement from the platform API** post-campaign and store them alongside revenue data for CPM and EMV calculations
- **Set campaign end dates on promo codes** to automatically expire influencer discounts and prevent long-term code sharing on coupon sites
- **Track gifting value** as campaign budget even for non-paid partnerships — gifted products have COGS which must be included in ROI calculations
- **Compare EMV across campaigns** as a secondary metric — high reach with low conversion may still justify spend as a brand-building investment

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Promo codes shared on deal sites, inflating attribution | Set per-customer usage limits (limit 1 per customer) and monitor daily usage velocity; pause codes showing suspicious spikes |
| UTM attribution lost when customer uses a different device | Supplement UTM tracking with promo codes as a device-agnostic attribution signal |
| No way to compare micro-influencers vs. macro-influencers | Normalize by reach — calculate revenue per 1,000 followers (RPM) to compare across follower counts |
| Campaign ROI appears zero because influencer posted after end date | Store `first_attributed_order_at` on the campaign and alert if orders arrive after end date with a grace period |
| Influencer uses an affiliate link instead of the agreed UTM URL | Audit influencer posts by fetching the actual URL from the post using the platform API |

## Related Skills

- @affiliate-program
- @attribution-modeling
- @social-commerce
- @content-commerce
- @customer-analytics
