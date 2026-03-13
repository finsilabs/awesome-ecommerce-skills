---
name: product-reviews-ratings
description: "Collect, moderate, and display customer reviews with star ratings, aggregate scores, and structured data markup for Google rich results"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [reviews, ratings, ugc, moderation, schema-org, social-proof, star-rating, review-widget]
triggers: ["product reviews", "star ratings", "review system", "review moderation", "review widget", "aggregate ratings", "customer reviews"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Reviews & Ratings

## Overview

Product reviews are the strongest social proof signal in e-commerce — products with 5+ reviews convert at 270% higher rates than products with none. Every major platform has review apps that handle collection, moderation, schema.org markup for Google star ratings, and verified purchase badging without custom code. Only build a custom review system if you need proprietary moderation logic, deep API integration, or review data in your own database.

## When to Use This Skill

- When launching a new store and needing a review collection and display system
- When implementing schema.org `AggregateRating` markup to enable star ratings in Google Search results
- When building a moderation workflow to prevent fake or spam reviews
- When displaying verified purchase badges to increase review credibility
- When triggering post-purchase review request emails automatically after delivery
- When importing reviews from one platform or app to another

## Core Instructions

### Step 1: Determine platform and choose the right review tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Judge.me | Free plan includes unlimited reviews, photo reviews, verified purchase badges, schema.org markup, and post-purchase email requests |
| **Shopify** | Yotpo | More advanced features: Q&A, loyalty integration, Google Shopping reviews syndication — best for mid-market+ stores |
| **WooCommerce** | WooCommerce built-in reviews + WP Product Review plugin | WooCommerce has built-in star ratings; add WP Product Review for schema.org markup and verified purchase gating |
| **WooCommerce** | Judge.me for WooCommerce | Same feature set as the Shopify version; available as a WooCommerce integration |
| **BigCommerce** | Judge.me or Yotpo | Both available on the BigCommerce App Marketplace with full feature parity |
| **Custom / Headless** | Build review API | Required when reviews need to live in your own database with custom moderation logic |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Option A: Judge.me (recommended — free, full-featured)**

1. Install **Judge.me Product Reviews** from the Shopify App Store
2. Judge.me automatically sends a post-purchase review request email after a configurable delay:
   - Go to **Judge.me → Settings → Review Request Emails**
   - Set delay to **5–7 days after fulfillment** (gives customers time to receive and use the product)
   - Customize the email template with your brand colors and product images

3. Configure review display:
   - Go to **Judge.me → Widgets → Install Widgets**
   - Enable the review widget on your product template (Judge.me provides a one-click install)
   - Enable the star rating snippet in product listings

4. Enable schema.org markup:
   - Go to **Judge.me → Settings → SEO**
   - Ensure "Add aggregate rating schema" is enabled — this is what enables star ratings in Google search results

5. Configure verification and moderation:
   - Go to **Settings → Review Settings**
   - Enable **Verified Purchase Only**: only customers who bought the product can leave a review
   - Enable **Auto-publish verified reviews**, manual moderation for unverified reviews
   - Set profanity filter to "Medium" or higher

**Option B: Yotpo (mid-market and enterprise)**

1. Install **Yotpo Reviews** from the App Store
2. Configure review request timing in **Yotpo → Settings → Review Request**
3. Enable **Google Shopping Reviews syndication** if you run Google Shopping campaigns — Yotpo sends review data directly to Google
4. Use **Yotpo Q&A** to add a question-and-answer section below reviews on the PDP

**Testing schema.org markup:**
After enabling Judge.me or Yotpo schema output, validate with [Google's Rich Results Test](https://search.google.com/test/rich-results) using your product page URL. Star ratings appear in Google Search within 1–2 weeks of indexing.

---

#### WooCommerce

**WooCommerce built-in reviews (free, basic):**

1. Go to **WooCommerce → Settings → Products → Reviews**
2. Enable **Enable product reviews**
3. Enable **Show "verified owner" label on customer reviews** — this restricts reviews to customers who purchased the product
4. Enable **Reviews can only be left by "verified owners"** to gate unverified submissions

**Adding schema.org markup and enhanced display:**

1. Install **WP Product Review** from the WordPress plugin directory
2. WP Product Review adds:
   - Aggregate star rating schema.org markup (required for Google rich results)
   - Star rating display in product listings
   - Review pros/cons fields
3. Configure in **WP Product Review → Settings**

**Automating review request emails:**

1. Install **Klaviyo** or **AutomateWoo** for post-purchase email automation
2. In Klaviyo: create a **Flow** triggered by the "Placed Order" event with a 7-day delay, containing a review request link
3. In AutomateWoo: go to **AutomateWoo → Workflows → Add** → trigger: "Order Status Changed to Completed" with a 7-day delay

**Judge.me for WooCommerce:**
- Install **Judge.me for WooCommerce** (available at judge.me)
- Provides the same review request emails, verified purchase gating, and schema markup as the Shopify version

---

#### BigCommerce

**Judge.me for BigCommerce:**

1. Go to **Apps → Search "Judge.me"** and install
2. Same configuration as the Shopify version — review request emails, schema markup, and verified purchase gating work identically

**BigCommerce built-in product reviews:**
1. Go to **Products → [Product] → Reviews tab** to manually moderate reviews
2. Go to **Settings → Store Settings → Miscellaneous** → enable **Product Reviews**
3. Built-in reviews do not include schema.org markup — install Judge.me or Yotpo to get Google star ratings in search results

**Yotpo for BigCommerce:**
1. Install from the BigCommerce App Marketplace
2. Includes Google Shopping Reviews syndication and SMS review requests alongside email

---

#### Custom / Headless

For headless storefronts, build a review pipeline with post-purchase trigger, moderation, Bayesian aggregate scoring, and schema.org output:

```typescript
// lib/reviews.ts

// POST /api/reviews — accept review submission with signed token verification
export async function submitReview(req: Request, res: Response) {
  const { token, productId, rating, title, body, authorName } = req.body;

  // Validate signed token (generated in post-purchase email, prevents spam)
  const tokenData = await verifyReviewToken(token);
  if (!tokenData) return res.status(401).json({ error: 'Invalid or expired review token' });

  const verifiedPurchase = await db.orderItems.exists({ orderId: tokenData.orderId, productId });

  // Auto-moderation: spam score + profanity check
  const spamScore = await checkSpam({ body, authorName, ip: req.ip });
  const hasProfanity = await checkProfanity(body + ' ' + title);

  const status =
    spamScore > 0.8 ? 'spam' :
    hasProfanity ? 'pending' :
    verifiedPurchase ? 'approved' : 'pending';

  const review = await db.reviews.create({
    productId, orderId: tokenData.orderId, customerId: tokenData.customerId,
    authorName, authorEmail: tokenData.email, rating, title, body,
    verifiedPurchase, status, approvedAt: status === 'approved' ? new Date() : null,
  });

  if (status === 'approved') await updateProductRatingSummary(productId);

  res.json({ reviewId: review.id, status });
}

// Bayesian aggregate: prevents a 2-review product with 5.0 outranking a 200-review product with 4.7
export async function updateProductRatingSummary(productId: string) {
  const reviews = await db.reviews.findMany({ where: { productId, status: 'approved' } });

  const rawAverage = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const globalMean = await db.reviews.globalAverageRating();
  const C = 5; // confidence weight — trust product's own average after 5+ reviews
  const bayesianAverage = (C * globalMean + reviews.reduce((s, r) => s + r.rating, 0)) / (C + reviews.length);

  await db.productRatingSummaries.upsert({ productId }, {
    productId, reviewCount: reviews.length,
    averageRating: Math.round(bayesianAverage * 10) / 10,
    rawAverageRating: Math.round(rawAverage * 10) / 10,
  });
}

// Emit schema.org AggregateRating JSON-LD — required for Google star ratings in search
export function buildProductSchema(product: Product, ratingSummary: { reviewCount: number; averageRating: number }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map(i => i.url),
    description: product.description,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: (product.priceInCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: product.inventoryQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(ratingSummary.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: ratingSummary.averageRating.toFixed(1),
        reviewCount: ratingSummary.reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
    }),
  };
}

// Trigger review request email 5 days after delivery
export async function triggerReviewRequest(orderId: string) {
  const order = await db.orders.findById(orderId, { include: ['lineItems.product', 'customer'] });
  const token = await createSignedReviewToken(orderId, order.customerEmail);

  await reviewQueue.add(
    'send-review-request',
    { orderId, email: order.customerEmail, token, products: order.lineItems.map(i => ({ productId: i.productId, name: i.product.name })) },
    { delay: 5 * 86400000, jobId: `review-request-${orderId}` }
  );
}
```

---

### Step 3: Configure moderation workflow

All review apps need a moderation strategy before go-live:

**In Judge.me:**
- Go to **Settings → Review Settings → Moderation**
- Set verified reviews to auto-publish; unverified reviews to manual review queue
- Enable the profanity filter
- Check the moderation queue weekly at **Judge.me → Reviews → Pending**

**In Yotpo:**
- Go to **Yotpo → Moderation → Settings**
- Configure auto-approve rules (e.g., star rating ≥ 3 and verified purchase → auto-approve)
- Yotpo sends a daily moderation digest email to your configured team email

**For custom builds:** auto-approve verified purchase reviews that pass spam and profanity checks; queue all others. Never skip moderation entirely — process the pending queue daily.

---

### Step 4: Measure review impact

| Metric | Benchmark | Where to Find |
|--------|-----------|---------------|
| Review collection rate | 3–8% of delivered orders | Judge.me Analytics → Email Performance |
| Products with 5+ reviews | Track % of active products | Judge.me → Insights |
| Average rating | 4.2–4.7 is healthy | Platform product listing page |
| Click-through rate from Google star ratings | Monitor in Google Search Console after schema is live | Search Console → Search Appearance → Rich Results |

## Best Practices

- **Use Judge.me or Yotpo before building from scratch** — they handle schema markup, email timing, verified purchase logic, and moderation queues out of the box
- **Send review requests 5–7 days after delivery**, not after shipment — the customer needs time to receive and use the product
- **Never delete negative reviews** — suppressing them erodes trust and may violate FTC guidelines; respond to them publicly instead
- **Show verified purchase badges** — they increase review trust and help customers distinguish genuine reviews
- **Cap carousels at 5–10 reviews on initial load** — lazy load additional reviews to avoid blocking page LCP
- **Validate schema.org markup with Google's Rich Results Test** before launching — star ratings appear in search only when the JSON-LD is correct

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Star ratings not showing in Google Search | Ensure `AggregateRating.reviewCount` is ≥ 1 and schema is in the `<head>` as JSON-LD; test with Google's Rich Results Test |
| Review request sent before product delivered | Trigger the review email from the delivery webhook, not the ship event; add 5-day buffer after delivery |
| Spam reviews flood the moderation queue | Enable Akismet integration in WooCommerce or use Judge.me's built-in spam filter; auto-reject submissions with high spam scores |
| Duplicate reviews from the same customer | Judge.me and Yotpo enforce one review per verified purchase; for custom builds add a unique constraint on `(customerId, productId)` |
| Review photos slow the page | Judge.me and Yotpo automatically resize and serve photos via CDN; for custom builds resize to 200px thumbnails at upload time |

## Related Skills

- @user-generated-content
- @customer-segmentation
- @personalization-engine
- @conversion-rate-optimization
