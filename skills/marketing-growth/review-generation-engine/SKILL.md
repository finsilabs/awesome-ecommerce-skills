---
name: review-generation-engine
description: "Automatically request and collect product reviews post-purchase with timed email/SMS sequences, photo incentives, and fraud detection for fake reviews"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [reviews, ratings, social-proof]
triggers: ["generate more reviews", "automate review requests"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Review Generation Engine

## Overview

Product reviews are the most trusted form of social proof — 88% of shoppers consult reviews before purchasing, and products with 50+ reviews convert 4.6% better than those with none. The fastest path to high review volume is a systematic post-purchase request sequence: a well-timed email at delivery plus one SMS follow-up doubles review rates vs. a single request. This skill covers building the request sequence, designing frictionless review submission forms, incentivizing photo reviews, and detecting fake or incentivized review fraud patterns.

## When to Use This Skill

- When a new product has fewer than 10 reviews and needs social proof to convert
- When overall review volume is low despite healthy order volume
- When wanting to add photo/video review incentives to an existing text-only system
- When migrating from a third-party review app to a custom solution
- When needing to detect and filter fake or incentivized reviews before publication

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, review platform (Yotpo, Judge.me, or Stamped), email service for review request sequences

## Core Instructions

### 1. Post-purchase review request sequence

```typescript
interface ReviewRequestJob {
  customerId: string;
  orderId:    string;
  productIds: string[];
  step:       0 | 1 | 2;  // 0=email day14, 1=SMS day21, 2=final-email day28
}

async function scheduleReviewRequests(order: Order) {
  // Only request reviews for delivered orders
  // Listen to shipment delivery event to start the timer

  const steps: Array<{ channel: 'email' | 'sms'; delayDays: number }> = [
    { channel: 'email', delayDays: 7  },  // 7 days after delivery
    { channel: 'sms',   delayDays: 14 },  // 14 days if no review yet
    { channel: 'email', delayDays: 21 },  // 21 days — final ask with photo incentive
  ];

  for (const [i, step] of steps.entries()) {
    await reviewRequestQueue.add(
      'send-review-request',
      { customerId: order.customerId, orderId: order.id, productIds: order.lineItems.map(l => l.productId), step: i },
      {
        delay:  step.delayDays * 86400000,
        jobId:  `review-request-${order.id}-step${i}`,
        removeOnComplete: true,
      }
    );
  }
}

// When a review is submitted, cancel remaining steps
async function onReviewSubmitted(orderId: string) {
  for (let step = 0; step < 3; step++) {
    const job = await reviewRequestQueue.getJob(`review-request-${orderId}-step${step}`);
    await job?.remove();
  }
}
```

### 2. Review request email content strategy

```
Step 0 (Day 7 post-delivery) — Simple, no incentive:
  Subject: "How did you like your [product name]?"
  Body: Star rating widget → clicking a star opens the review form pre-filled with that rating
  CTA: "Leave a review" (single, prominent button)

Step 1 (Day 14, SMS only if email not opened):
  "Hi [name], loving your [product]? Tap here to leave a quick review: [shortlink]"
  Keep under 160 chars

Step 2 (Day 21 — photo incentive):
  Subject: "Add a photo review — get 15% off your next order"
  Body: Explain that photo reviews help other shoppers; 15% discount code sent on approval
  CTA: "Upload your photo review"
```

### 3. Frictionless review submission form

Minimize friction with a single-page form accessible without login:

```typescript
// Generate a signed, tokenized review link so customers don't need to log in
function generateReviewToken(orderId: string, productId: string, customerId: string): string {
  const payload = { orderId, productId, customerId, exp: Math.floor(Date.now() / 1000) + 30 * 86400 };
  return jwt.sign(payload, process.env.REVIEW_JWT_SECRET!);
}

// GET /review/:token
export async function renderReviewForm(req: Request, res: Response) {
  try {
    const payload = jwt.verify(req.params.token, process.env.REVIEW_JWT_SECRET!) as any;
    const product = await db.products.findById(payload.productId);

    // Pre-fill star rating from email click (rating=4 query param)
    const prefilledRating = parseInt(req.query.rating as string) || 0;

    return res.render('review-form', { product, token: req.params.token, prefilledRating });
  } catch {
    return res.status(400).render('review-expired');
  }
}

// POST /review/:token
export async function submitReview(req: Request, res: Response) {
  const payload = jwt.verify(req.params.token, process.env.REVIEW_JWT_SECRET!) as any;

  const { rating, title, body, photos } = req.body;

  // Validate
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Invalid rating' });
  if (!body || body.length < 10)  return res.status(400).json({ error: 'Review too short' });

  const review = await db.productReviews.create({
    productId:   payload.productId,
    customerId:  payload.customerId,
    orderId:     payload.orderId,
    rating,
    title:       title.substring(0, 100),
    body:        body.substring(0, 2000),
    isVerifiedBuyer: true,  // confirmed via token from order
    status:      'pending',  // goes through moderation
  });

  // Handle photo uploads
  if (photos?.length > 0) {
    await processReviewPhotos(review.id, photos);
    // Award photo review incentive after moderation approval
    await db.pendingIncentives.create({ reviewId: review.id, type: 'percent_off', value: 15 });
  }

  await onReviewSubmitted(payload.orderId);
  return res.json({ success: true, reviewId: review.id });
}
```

### 4. Review moderation pipeline

```typescript
type ModerationStatus = 'approved' | 'rejected' | 'needs-human-review';

async function moderateReview(reviewId: string): Promise<ModerationStatus> {
  const review = await db.productReviews.findById(reviewId);
  const flags: string[] = [];

  // Spam/authenticity checks
  const hourlyReviewCount = await db.productReviews.countByCustomer(review.customerId, { since: subHours(new Date(), 1) });
  if (hourlyReviewCount > 3) flags.push('high-frequency');

  const sameIpReviews = await db.productReviews.countByIp(review.submitterIp, { since: subDays(new Date(), 7) });
  if (sameIpReviews > 5) flags.push('suspicious-ip');

  // Content quality checks
  if (review.body.length < 20) flags.push('too-short');
  if (/(.)\1{4,}/.test(review.body)) flags.push('repetitive-characters');  // "aaaaaaa"
  if (review.rating === 5 && review.body.toLowerCase().includes('discount')) flags.push('incentive-disclosure-risk');

  // Profanity / brand safety (use a word list or moderation API)
  const hasProfanity = await checkProfanity(review.body);
  if (hasProfanity) flags.push('profanity');

  if (flags.includes('profanity') || flags.includes('high-frequency')) return 'rejected';
  if (flags.length > 0) return 'needs-human-review';
  return 'approved';
}

async function processReviewModeration() {
  const pending = await db.productReviews.findAll({ where: { status: 'pending' } });

  for (const review of pending) {
    const decision = await moderateReview(review.id);

    await db.productReviews.update(review.id, { status: decision === 'approved' ? 'published' : decision });

    if (decision === 'approved') {
      // Send photo incentive if applicable
      const incentive = await db.pendingIncentives.findByReview(review.id);
      if (incentive) {
        const code = await createUniqueDiscount({ type: 'percent_off', value: incentive.value, customerId: review.customerId });
        await sendReviewThankYouEmail(review.customerId, { discountCode: code });
      }

      // Update product aggregate rating
      await refreshProductRatingAggregate(review.productId);
    }
  }
}
```

### 5. Aggregate rating refresh

```typescript
async function refreshProductRatingAggregate(productId: string) {
  const stats = await db.productReviews.aggregate({
    where:  { productId, status: 'published' },
    select: { _avg: { rating: true }, _count: { id: true } },
  });

  await db.products.update(productId, {
    avgRating:   parseFloat(stats._avg.rating?.toFixed(1) ?? '0'),
    reviewCount: stats._count.id,
  });

  // Invalidate CDN cache for the product page
  await invalidateProductCache(productId);
}
```

## Best Practices

- **Time the first request to after confirmed delivery** — asking for a review before the product arrives damages trust; use carrier tracking webhooks to detect delivery
- **Make the star rating widget clickable in the email** — each star links to the review form with `?rating=N` pre-filled; this single change typically doubles response rates
- **Never pay cash for reviews** — financial incentives for reviews violate FTC guidelines and marketplace terms of service; only incentivize photo reviews, not the review itself
- **Verified buyer badge drives conversion** — mark reviews from confirmed purchasers (token-based submission) and display the badge; shoppers trust verified reviews 2x more
- **Respond to negative reviews publicly** — brands that respond to 1-2 star reviews with empathy and resolution offers convert skeptical shoppers better than brands with only 5-star reviews
- **Syndicate reviews to marketplace listings** — push review data to Amazon, Google Shopping, and retailer PDPs where your products are listed

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Review requests sent to customers who returned the order | Check order status before sending; skip review requests for orders with active return requests |
| Photo reviews sitting in pending without moderation | Build an automated moderation queue that runs every 15 minutes; alert the team for human review items |
| Customers leaving reviews on the wrong product | Pre-fill product from the token; do not let customers change the product in the form |
| Review volume spikes followed by sudden drops | Analyze if you inadvertently trained customers to wait for an incentive; adjust incentive timing |
| Fake competitor reviews (5-star with suspicious patterns) | Flag reviews from accounts with no order history; require token from verified purchase |

## Related Skills

- @social-proof-widgets
- @ugc-campaign-management
- @product-reviews-ratings
- @email-marketing-automation
- @customer-retention-engine
