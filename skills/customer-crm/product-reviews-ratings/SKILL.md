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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Reviews & Ratings

## Overview

Product reviews are the strongest social proof signal in e-commerce — products with 5+ reviews convert at 270% higher rates than products with none. This skill covers building a review collection pipeline (post-purchase email trigger, verified purchase gating), a moderation workflow (spam detection, profanity filter, manual queue), aggregate score calculation with Bayesian smoothing, and a display widget with schema.org markup for Google star ratings in search results.

## When to Use This Skill

- When launching a new store and needing a first-party review system instead of relying on third-party platforms
- When implementing schema.org `AggregateRating` markup to enable star ratings in Google Search results
- When building a moderation workflow to prevent fake or spam reviews
- When displaying verified purchase badges to increase review credibility
- When calculating aggregate scores that account for low review volume (Bayesian averaging)
- When importing reviews from a third-party platform (Yotpo, Bazaarvoice) into a custom system

## Core Instructions

1. **Design the review data model**

   ```typescript
   interface Review {
     id: string;
     productId: string;
     orderId: string | null;     // Null for unverified reviews
     customerId: string | null;
     authorName: string;
     authorEmail: string;
     rating: 1 | 2 | 3 | 4 | 5;
     title: string;
     body: string;
     images: ReviewImage[];
     status: 'pending' | 'approved' | 'rejected' | 'spam';
     verifiedPurchase: boolean;
     helpfulVotes: number;
     createdAt: Date;
     approvedAt: Date | null;
   }

   interface ProductRatingSummary {
     productId: string;
     reviewCount: number;
     averageRating: number;        // Bayesian-smoothed
     rawAverageRating: number;     // Simple mean
     distribution: Record<1 | 2 | 3 | 4 | 5, number>; // count per star
   }
   ```

2. **Trigger review request after delivery**

   ```typescript
   // Triggered by shipping webhook when order is delivered
   async function triggerReviewRequest(orderId: string) {
     const order = await db.orders.findById(orderId, { include: ['lineItems.product', 'customer'] });

     // Wait 5 days after delivery before asking for a review
     await reviewQueue.add(
       'send-review-request',
       {
         orderId,
         customerId: order.customerId,
         email: order.customerEmail,
         products: order.lineItems.map((i) => ({
           productId: i.productId,
           productName: i.product.name,
           productImage: i.product.images[0]?.url,
           productSlug: i.product.slug,
         })),
       },
       { delay: 5 * 86400000, jobId: `review-request-${orderId}` }
     );
   }

   // Worker: send email with review links
   async function processReviewRequestJob(job: Job) {
     const { orderId, email, products } = job.data;

     // Generate a signed review token (no login required to submit)
     const token = await createSignedReviewToken(orderId, email);

     await sendTransactionalEmail(email, 'review-request', {
       products,
       reviewUrl: `${process.env.STORE_URL}/reviews/submit?token=${token}`,
     });
   }
   ```

3. **Accept and moderate review submissions**

   ```typescript
   // POST /api/reviews
   export async function submitReview(req: Request, res: Response) {
     const { token, productId, rating, title, body, authorName } = req.body;

     // Validate signed token (prevents spam submissions)
     const tokenData = await verifyReviewToken(token);
     if (!tokenData) return res.status(401).json({ error: 'Invalid or expired review token' });

     const verifiedPurchase = await db.orderItems.exists({
       orderId: tokenData.orderId,
       productId,
     });

     // Auto-moderation checks
     const spamScore = await checkSpam({ body, authorName, ip: req.ip });
     const hasProfanity = await checkProfanity(body + ' ' + title);

     const status =
       spamScore > 0.8 ? 'spam' :
       hasProfanity ? 'pending' :
       verifiedPurchase ? 'approved' : 'pending';

     const review = await db.reviews.create({
       productId,
       orderId: tokenData.orderId,
       customerId: tokenData.customerId,
       authorName,
       authorEmail: tokenData.email,
       rating,
       title,
       body,
       verifiedPurchase,
       status,
       createdAt: new Date(),
       approvedAt: status === 'approved' ? new Date() : null,
     });

     if (status === 'approved') {
       await updateProductRatingSummary(productId);
     }

     res.json({ reviewId: review.id, status });
   }
   ```

4. **Calculate aggregate ratings with Bayesian smoothing**

   Simple averages are misleading for products with very few reviews. Bayesian averaging pulls scores toward the global mean when count is low:

   ```typescript
   async function updateProductRatingSummary(productId: string) {
     const reviews = await db.reviews.findApproved(productId);
     const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;

     for (const r of reviews) distribution[r.rating]++;

     const rawAverage = reviews.length > 0
       ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
       : 0;

     // Bayesian average: (C * m + sum_of_ratings) / (C + n)
     // C = confidence weight (e.g., 5 reviews), m = global mean rating
     const globalMean = await db.reviews.globalAverageRating();
     const C = 5; // minimum count before trusting the product's own average
     const bayesianAverage = (C * globalMean + reviews.reduce((sum, r) => sum + r.rating, 0)) / (C + reviews.length);

     await db.productRatingSummaries.upsert({ productId }, {
       productId,
       reviewCount: reviews.length,
       averageRating: Math.round(bayesianAverage * 10) / 10,
       rawAverageRating: Math.round(rawAverage * 10) / 10,
       distribution,
       updatedAt: new Date(),
     });
   }
   ```

5. **Add schema.org AggregateRating markup**

   This is required for Google to show star ratings in search results:

   ```typescript
   function buildProductSchema(product: Product, ratingSummary: ProductRatingSummary) {
     return {
       '@context': 'https://schema.org',
       '@type': 'Product',
       name: product.name,
       image: product.images.map((i) => i.url),
       description: product.description,
       sku: product.sku,
       brand: { '@type': 'Brand', name: product.brand },
       offers: {
         '@type': 'Offer',
         price: (product.priceInCents / 100).toFixed(2),
         priceCurrency: 'USD',
         availability: product.inventory > 0
           ? 'https://schema.org/InStock'
           : 'https://schema.org/OutOfStock',
         url: `${process.env.STORE_URL}/products/${product.slug}`,
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
   ```

## Examples

### Moderation queue API for admin review

```typescript
// GET /api/admin/reviews/pending
export async function getPendingReviews(req: Request, res: Response) {
  const { page = 1, limit = 20 } = req.query;

  const reviews = await db.reviews.findMany({
    where: { status: 'pending' },
    include: ['product', 'customer'],
    orderBy: { createdAt: 'asc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });

  res.json(reviews);
}

// POST /api/admin/reviews/:id/moderate
export async function moderateReview(req: Request, res: Response) {
  const { id } = req.params;
  const { action, reason } = req.body; // action: 'approve' | 'reject'

  await db.reviews.update(id, {
    status: action === 'approve' ? 'approved' : 'rejected',
    approvedAt: action === 'approve' ? new Date() : null,
    moderationReason: reason,
    moderatedBy: req.user.id,
  });

  if (action === 'approve') {
    const review = await db.reviews.findById(id);
    await updateProductRatingSummary(review.productId);
  }

  res.json({ ok: true });
}
```

### Helpful votes to surface the best reviews

```typescript
// POST /api/reviews/:id/helpful
export async function markReviewHelpful(req: Request, res: Response) {
  const { id } = req.params;
  const voterId = req.session.customerId ?? req.ip;

  // Prevent duplicate votes
  const alreadyVoted = await db.reviewHelpfulVotes.exists({ reviewId: id, voterId });
  if (alreadyVoted) return res.status(409).json({ error: 'Already voted' });

  await db.reviewHelpfulVotes.create({ reviewId: id, voterId, votedAt: new Date() });
  await db.reviews.increment(id, 'helpfulVotes', 1);

  res.json({ ok: true });
}
```

## Best Practices

- **Only request reviews from verified purchasers** — send the review request email 5–7 days after delivery, when the customer has had time to experience the product
- **Show verified purchase badges** — they increase review trust and conversion lift; customers can distinguish genuine reviews from competitor plants
- **Use Bayesian averaging for star display** — a product with 3 reviews averaging 5.0 should not outrank one with 200 reviews averaging 4.7
- **Never delete negative reviews** — suppressing them erodes trust and may violate FTC guidelines; respond to them publicly instead
- **Auto-approve verified purchase reviews above a profanity threshold** — manual review of every submission is a bottleneck; only queue borderline content
- **Include structured review schema on every product page** — Google shows star ratings in SERPs only when `aggregateRating` is present
- **Sort by "most helpful" by default** — most recent is not always most useful; helpful votes surface quality reviews
- **Paginate review display** — load 5–10 reviews initially with infinite scroll or pagination; loading all reviews blocks page LCP

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Star ratings not showing in Google Search | Ensure `AggregateRating.reviewCount` is ≥ 1 and the schema is in the `<head>` as JSON-LD; test with Google's Rich Results Test |
| Spam reviews flood the pending queue | Integrate Akismet or a similar spam detection API; auto-reject submissions with scores above 0.9 |
| Review request sent before product delivered | Trigger the review email from the delivery event, not the ship event; use a 5-day buffer after delivery |
| Duplicate reviews from the same customer | Enforce a unique constraint on `(customerId, productId)` in the reviews table |
| Review images cause slow page load | Store images in S3 with on-the-fly resizing via CloudFront or Cloudinary; never serve originals on product pages |

## Related Skills

- @user-generated-content
- @product-analytics
- @customer-segmentation
- @personalization-engine
- @conversion-rate-optimization
