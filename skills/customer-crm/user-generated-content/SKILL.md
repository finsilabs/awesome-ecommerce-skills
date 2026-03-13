---
name: user-generated-content
description: "Let customers upload photos, ask and answer product questions, and share social proof that increases trust and conversion for new visitors"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [ugc, user-generated-content, customer-photos, qa, social-proof, reviews, moderation, instagram-ugc]
triggers: ["user generated content", "UGC", "customer photos", "product Q&A", "social proof widgets", "customer photo gallery", "ugc moderation"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# User-Generated Content

## Overview

User-generated content (UGC) — customer photos, Q&A, and social proof elements — increases purchase confidence and product page conversion rates. This skill covers building a customer photo submission pipeline with S3 storage and image moderation, a product Q&A system with staff answers, and a social proof widget that aggregates recent purchase signals. UGC requires robust moderation to prevent abuse.

## When to Use This Skill

- When product pages need authentic customer lifestyle photos beyond studio shots
- When building a Q&A section so customers can answer each other's questions
- When displaying "X people bought this in the last 24 hours" urgency signals
- When sourcing Instagram UGC tagged with your brand hashtag for the product page gallery
- When building a submissions portal where post-purchase customers can upload photos
- When a third-party UGC platform is too expensive for the current scale

## Prerequisites & Platform Notes

**Shopify**: Shopify stores customer data natively. Use Shopify Customer APIs and metafields for custom data. For CRM, integrate with Klaviyo, HubSpot, or Gorgias via Shopify webhooks.
**WooCommerce**: Customer data lives in WordPress. Extend with CRM plugins (HubSpot for WooCommerce, Metorik). Use woocommerce_created_customer and profile hooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with customer data, CRM tool (Klaviyo, HubSpot) if needed

## Core Instructions

1. **Accept and store customer photo uploads**

   Use S3 multipart upload with server-side presigned URLs to avoid sending files through your server:

   ```typescript
   import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
   import sharp from 'sharp';

   const s3 = new S3Client({ region: process.env.AWS_REGION });

   // POST /api/ugc/photo/presign
   export async function getPhotoUploadUrl(req: Request, res: Response) {
     const { productId, fileName, contentType } = req.body;
     if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
       return res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are accepted' });
     }

     const key = `ugc/pending/${productId}/${req.session.customerId}/${Date.now()}-${fileName}`;

     const command = new PutObjectCommand({
       Bucket: process.env.S3_BUCKET,
       Key: key,
       ContentType: contentType,
       Metadata: { productId, customerId: req.session.customerId ?? 'anon' },
     });

     const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

     // Create a pending UGC record
     await db.ugcPhotos.create({
       productId,
       customerId: req.session.customerId,
       s3Key: key,
       status: 'pending_upload',
       createdAt: new Date(),
     });

     res.json({ uploadUrl: presignedUrl, key });
   }
   ```

2. **Process and moderate uploads via S3 event trigger**

   When the S3 `ObjectCreated` event fires, validate and moderate the image:

   ```typescript
   import Rekognition from '@aws-sdk/client-rekognition';

   const rekognition = new Rekognition({ region: process.env.AWS_REGION });

   export async function processUGCPhoto(event: S3Event) {
     const key = event.Records[0].s3.object.key;
     const ugcRecord = await db.ugcPhotos.findByS3Key(key);

     // Detect inappropriate content with AWS Rekognition
     const moderationResult = await rekognition.detectModerationLabels({
       Image: { S3Object: { Bucket: process.env.S3_BUCKET, Name: key } },
       MinConfidence: 75,
     });

     const flaggedLabels = moderationResult.ModerationLabels ?? [];

     if (flaggedLabels.length > 0) {
       await db.ugcPhotos.update(ugcRecord.id, { status: 'rejected', rejectionReason: flaggedLabels.map((l) => l.Name).join(', ') });
       return;
     }

     // Resize to web-optimized sizes using Sharp (via Lambda)
     await resizeAndStore(key, ugcRecord.productId, ugcRecord.id);

     // Auto-approve verified purchase photos; queue others for manual review
     const isVerifiedPurchase = await db.orderItems.exists({ customerId: ugcRecord.customerId, productId: ugcRecord.productId });

     await db.ugcPhotos.update(ugcRecord.id, {
       status: isVerifiedPurchase ? 'approved' : 'pending_review',
       approvedAt: isVerifiedPurchase ? new Date() : null,
       verifiedPurchase: isVerifiedPurchase,
     });
   }

   async function resizeAndStore(originalKey: string, productId: string, ugcId: string) {
     const original = await s3.getObject({ Bucket: process.env.S3_BUCKET!, Key: originalKey });
     const buffer = Buffer.from(await original.Body!.transformToByteArray());

     const sizes = [{ suffix: 'thumbnail', width: 200 }, { suffix: 'medium', width: 600 }, { suffix: 'full', width: 1200 }];

     for (const size of sizes) {
       const resized = await sharp(buffer).resize(size.width).webp({ quality: 80 }).toBuffer();
       const destKey = `ugc/approved/${productId}/${ugcId}/${size.suffix}.webp`;
       await s3.putObject({ Bucket: process.env.S3_BUCKET!, Key: destKey, Body: resized, ContentType: 'image/webp' });
     }
   }
   ```

3. **Build the product Q&A system**

   ```typescript
   // POST /api/ugc/questions
   export async function submitQuestion(req: Request, res: Response) {
     const { productId, question, authorName } = req.body;

     const q = await db.productQuestions.create({
       productId,
       question,
       authorName,
       authorEmail: req.session.customerEmail,
       status: 'pending',
       createdAt: new Date(),
     });

     // Notify product team to answer
     await notifyProductTeam({ questionId: q.id, productId, question });
     res.json({ questionId: q.id, status: 'pending' });
   }

   // POST /api/admin/ugc/questions/:id/answer
   export async function answerQuestion(req: Request, res: Response) {
     const { id } = req.params;
     const { answer, answeredBy } = req.body;

     await db.productQuestions.update(id, {
       answer,
       answeredBy,
       answeredAt: new Date(),
       status: 'answered',
     });

     // Also allow other customers to upvote answers
     // Notify the question author
     const question = await db.productQuestions.findById(id, { include: ['product'] });
     if (question.authorEmail) {
       await sendTransactionalEmail(question.authorEmail, 'question-answered', {
         question: question.question,
         answer,
         productName: question.product.name,
         productUrl: `${process.env.STORE_URL}/products/${question.product.slug}`,
       });
     }

     res.json({ ok: true });
   }
   ```

4. **Build a social proof widget (recent purchases)**

   ```typescript
   // Cache recent purchase signals for the social proof widget
   async function buildRecentPurchaseFeed() {
     const recentOrders = await db.orders.findMany({
       where: { createdAt: { gte: subHours(new Date(), 24) }, status: 'completed' },
       include: ['lineItems.product', 'customer'],
       orderBy: { createdAt: 'desc' },
       take: 100,
     });

     const feed = recentOrders.flatMap((order) =>
       order.lineItems.slice(0, 1).map((item) => ({
         productId: item.productId,
         productName: item.product.name,
         productImage: item.product.images[0]?.url,
         productSlug: item.product.slug,
         buyerFirstName: order.customer.firstName,
         buyerLocation: order.customer.city ?? 'somewhere',
         purchasedAt: order.createdAt.toISOString(),
       }))
     );

     await redis.setex('social_proof_feed', 300, JSON.stringify(feed));
   }

   // GET /api/ugc/social-proof?productId=xxx
   export async function getSocialProof(req: Request, res: Response) {
     const { productId } = req.query;
     const raw = await redis.get('social_proof_feed');
     const feed: any[] = raw ? JSON.parse(raw) : [];

     const productSignals = productId
       ? feed.filter((f) => f.productId === productId).slice(0, 5)
       : feed.slice(0, 10);

     res.json(productSignals);
   }
   ```

5. **Display the UGC photo gallery on the product page**

   ```typescript
   // GET /api/ugc/photos?productId=xxx
   export async function getApprovedPhotos(req: Request, res: Response) {
     const { productId, page = 1, limit = 12 } = req.query;

     const photos = await db.ugcPhotos.findMany({
       where: { productId: productId as string, status: 'approved' },
       orderBy: [{ verifiedPurchase: 'desc' }, { createdAt: 'desc' }], // verified first
       skip: (Number(page) - 1) * Number(limit),
       take: Number(limit),
       include: ['customer'],
     });

     res.json(photos.map((p) => ({
       id: p.id,
       thumbnailUrl: `${process.env.CDN_URL}/ugc/approved/${productId}/${p.id}/thumbnail.webp`,
       mediumUrl: `${process.env.CDN_URL}/ugc/approved/${productId}/${p.id}/medium.webp`,
       verifiedPurchase: p.verifiedPurchase,
       authorName: p.customer?.firstName ?? 'Customer',
       createdAt: p.createdAt,
     })));
   }
   ```

## Examples

### Source UGC from Instagram tagged posts

```typescript
async function importInstagramUGC(hashtag: string) {
  // Use Instagram Basic Display API or a UGC platform like Bazaarvoice
  const media = await fetchInstagramHashtagMedia(hashtag);

  for (const post of media) {
    // Check rights management — only import if rights have been granted
    if (!post.rightsApproved) continue;

    const product = await matchPostToProduct(post.caption); // keyword matching
    if (!product) continue;

    await db.ugcPhotos.create({
      productId: product.id,
      source: 'instagram',
      instagramMediaId: post.id,
      externalImageUrl: post.mediaUrl,
      authorName: post.username,
      status: 'approved',  // Already moderated for rights
      createdAt: new Date(post.timestamp),
    });
  }
}
```

### Q&A upvote endpoint

```typescript
// POST /api/ugc/questions/:id/upvote
export async function upvoteQuestion(req: Request, res: Response) {
  const { id } = req.params;
  const voterId = req.session.customerId ?? req.ip;

  const alreadyVoted = await db.questionVotes.exists({ questionId: id, voterId });
  if (alreadyVoted) return res.status(409).json({ error: 'Already voted' });

  await db.questionVotes.create({ questionId: id, voterId });
  await db.productQuestions.increment(id, 'upvotes', 1);
  res.json({ ok: true });
}
```

## Best Practices

- **Use presigned S3 URLs for uploads** — never route file uploads through your API server; this keeps your server stateless and avoids memory issues with large files
- **Always run AI content moderation before displaying** — use AWS Rekognition or Google Vision SafeSearch to auto-reject NSFW content before manual review
- **Auto-approve verified-purchase photos** — verified photos have lower risk and removing the review bottleneck dramatically increases UGC volume
- **Resize images to multiple sizes at upload time** — store thumbnail (200px), medium (600px), and full (1200px) variants; never serve original uploads on product pages
- **Display verified purchase badge on UGC photos** — customers distinguish genuine-use photos from promotional ones; the badge increases trust
- **Paginate the photo gallery** — load 12 photos initially with lazy loading for subsequent pages; loading all UGC blocks LCP
- **Obtain explicit photo rights before displaying on paid ads** — using customer photos in paid advertising without written consent creates legal liability

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Large image uploads crash the server | Use presigned S3 URLs so files go directly to S3, bypassing your API; limit file size to 10MB client-side |
| Inappropriate content appears on product pages | Implement auto-moderation before the `status: approved` state is reachable; never approve without at least AI screening |
| Social proof widget shows fake urgency with stale data | Serve the feed from a 5-minute cache; do not fabricate purchase signals — legal and reputational risk |
| Q&A section has unanswered questions for weeks | Send a daily digest to the product team of unanswered questions; questions older than 7 days without a staff answer damage trust |
| UGC photos rank in Google Images with competitor keywords in metadata | Strip EXIF data from uploads and do not include competitor names in alt text |

## Related Skills

- @product-reviews-ratings
- @personalization-engine
- @content-commerce
- @social-commerce
- @customer-segmentation
