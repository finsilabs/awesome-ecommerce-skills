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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# User-Generated Content

## Overview

User-generated content (UGC) — customer photos, Q&A, and recent purchase signals — increases product page conversion by giving new visitors authentic proof that real customers use and love the product. Review apps like Judge.me and Yotpo include UGC photo collection, product Q&A, and social proof widgets out of the box. Dedicated UGC platforms like Okendo, Loox, and Bazaarvoice provide more advanced sourcing from Instagram and TikTok. Only build a custom UGC pipeline if your moderation logic, rights management, or database requirements exceed what these tools support.

## When to Use This Skill

- When product pages need authentic customer lifestyle photos beyond studio shots
- When building a Q&A section so customers can answer each other's questions
- When displaying "X people bought this in the last 24 hours" urgency signals
- When sourcing Instagram UGC tagged with your brand hashtag for the product page gallery
- When a third-party UGC platform is too expensive for the current scale

## Core Instructions

### Step 1: Determine platform and choose the right UGC tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Loox | Focused on photo reviews — sends post-purchase emails requesting photo uploads, displays a visual gallery on the PDP |
| **Shopify** | Okendo | Full UGC suite: photo + video reviews, Q&A, attributes ratings (sizing, quality), Instagram UGC sourcing |
| **Shopify** | Judge.me | Includes photo reviews in the free plan; good starting point before moving to Loox or Okendo |
| **WooCommerce** | WooCommerce built-in reviews + WP Product Review | Handles text + star reviews; add a media upload plugin for photo submissions |
| **WooCommerce** | Yotpo for WooCommerce | Full UGC including photo reviews, Q&A, and social proof |
| **BigCommerce** | Okendo or Yotpo | Both available on the BigCommerce App Marketplace |
| **Custom / Headless** | Build UGC API with S3 + moderation | Required when UGC data needs to live in your own database or integrate with a custom recommendation engine |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Option A: Loox (recommended for photo-first UGC)**

1. Install **Loox** from the Shopify App Store
2. Configure post-purchase photo request:
   - Go to **Loox → Emails → Photo Request Email**
   - Set send delay to **7 days after fulfillment**
   - Offer a discount incentive (e.g., 10% off next order) for submitting a photo review — Loox shows this offer in the request email
3. Configure the photo gallery widget:
   - Go to **Loox → Widgets → Product Widget**
   - Enable the photo carousel on your product template
   - Set minimum photo count to show (only show gallery once you have 3+ photos per product)
4. Moderation:
   - Go to **Loox → Reviews → Pending** to review and approve submitted photos
   - Enable **Auto-publish** for verified purchase photo reviews

**Option B: Okendo (full UGC including Q&A and Instagram)**

1. Install **Okendo** from the App Store
2. Configure review forms to collect custom attributes: sizing, quality, value — these appear as filtered search options in the review widget
3. Set up **Q&A** in Okendo → Features → Q&A:
   - Enable customer-to-customer Q&A below reviews
   - Configure email notifications to your team when a new question is submitted
   - Set up an auto-email notification to the question author when staff answers
4. Connect Instagram in **Okendo → Channels → Instagram**:
   - Connect your brand Instagram account
   - Okendo imports posts tagged with your hashtag and lets you request rights from the poster
   - Only publish to product pages after rights are granted

**Social proof notification widget (Loox and Okendo):**
Both apps include a "recent purchases" pop-up widget. Enable it in **Loox → Widgets → Social Proof** or **Okendo → Widgets → Purchase Activity**. Configure to show on product and collection pages, not on checkout.

---

#### WooCommerce

**Yotpo for WooCommerce:**

1. Install **Yotpo Reviews** from the WordPress plugin directory
2. Yotpo handles photo review requests, moderation, and gallery display
3. Configure post-purchase photo request timing in **Yotpo → Settings → Review Requests**
4. Enable Q&A under **Yotpo → Features → Q&A**

**WooCommerce native reviews + photo upload:**
1. Enable product reviews in **WooCommerce → Settings → Products → Reviews**
2. Install **WooCommerce Product Reviews Pro** extension to add:
   - Photo upload field in the review form
   - Verified purchase gating
   - Upvote/helpful vote on individual reviews
3. For Q&A separately, install **WooCommerce Product Q&A** from WooThemes or a compatible plugin

**Sourcing Instagram UGC:**
Use **Tagembed** or **Smash Balloon Instagram Feed** (WordPress plugins) to embed tagged Instagram posts on product pages. These pull posts by hashtag or mentions and let you curate which appear on each product.

---

#### BigCommerce

**Okendo for BigCommerce:**

1. Go to **Apps → Search "Okendo"** and install
2. Configuration is the same as the Shopify version — photo reviews, Q&A, and Instagram sourcing work identically
3. Okendo connects to BigCommerce orders for verified purchase gating automatically

**Yotpo for BigCommerce:**
1. Install from the BigCommerce App Marketplace
2. Includes photo reviews, Q&A, and SMS review requests
3. Yotpo's visual UGC tab imports Instagram and TikTok tagged content for use in the product gallery

---

#### Custom / Headless

For headless storefronts needing UGC in your own database:

```typescript
// lib/ugc.ts

// Generate a presigned S3 URL for direct browser-to-S3 photo uploads
// Never route file uploads through your API server
export async function getPhotoUploadUrl(req: Request, res: Response) {
  const { productId, fileName, contentType } = req.body;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
    return res.status(400).json({ error: 'Only JPEG, PNG, and WebP accepted' });
  }

  const key = `ugc/pending/${productId}/${req.session.customerId}/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  await db.ugcPhotos.create({ data: { productId, customerId: req.session.customerId, s3Key: key, status: 'pending_upload' } });
  res.json({ uploadUrl, key });
}

// S3 ObjectCreated trigger: run content moderation then resize
export async function processUGCPhoto(s3Key: string) {
  const ugcRecord = await db.ugcPhotos.findFirst({ where: { s3Key } });
  if (!ugcRecord) return;

  // AWS Rekognition content moderation — auto-reject NSFW content
  const moderationResult = await rekognition.detectModerationLabels({
    Image: { S3Object: { Bucket: process.env.S3_BUCKET!, Name: s3Key } },
    MinConfidence: 75,
  });

  if ((moderationResult.ModerationLabels ?? []).length > 0) {
    await db.ugcPhotos.update({ where: { id: ugcRecord.id }, data: { status: 'rejected' } });
    return;
  }

  // Resize to thumbnail (200px), medium (600px), full (1200px) WebP variants
  const original = await s3.getObject({ Bucket: process.env.S3_BUCKET!, Key: s3Key });
  const buffer = Buffer.from(await original.Body!.transformToByteArray());

  for (const { suffix, width } of [{ suffix: 'thumbnail', width: 200 }, { suffix: 'medium', width: 600 }, { suffix: 'full', width: 1200 }]) {
    const resized = await sharp(buffer).resize(width).webp({ quality: 80 }).toBuffer();
    await s3.putObject({
      Bucket: process.env.S3_BUCKET!, Body: resized, ContentType: 'image/webp',
      Key: `ugc/approved/${ugcRecord.productId}/${ugcRecord.id}/${suffix}.webp`,
    });
  }

  // Auto-approve verified purchase photos; queue others for manual review
  const isVerifiedPurchase = await db.orderItems.findFirst({ where: { customerId: ugcRecord.customerId, productId: ugcRecord.productId } });
  await db.ugcPhotos.update({ where: { id: ugcRecord.id }, data: {
    status: isVerifiedPurchase ? 'approved' : 'pending_review',
    verifiedPurchase: !!isVerifiedPurchase,
  }});
}

// Product Q&A — submit and answer questions
export async function submitQuestion(req: Request, res: Response) {
  const { productId, question, authorName } = req.body;
  const q = await db.productQuestions.create({ data: { productId, question, authorName, authorEmail: req.session.customerEmail, status: 'pending' } });
  await notifyProductTeam({ questionId: q.id, productId, question });
  res.json({ questionId: q.id });
}

// Social proof feed: recent purchases cached for 5 minutes
export async function buildRecentPurchaseFeed() {
  const recentOrders = await db.orders.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 86400000) }, status: 'completed' },
    include: { lineItems: { include: { product: true } }, customer: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const feed = recentOrders.flatMap(order =>
    order.lineItems.slice(0, 1).map(item => ({
      productId: item.productId,
      productName: item.product.name,
      buyerFirstName: order.customer.firstName,
      buyerLocation: order.customer.city ?? 'somewhere',
      purchasedAt: order.createdAt.toISOString(),
    }))
  );

  await redis.setex('social_proof_feed', 300, JSON.stringify(feed));
}
```

---

### Step 3: Configure rights management for Instagram UGC

Before displaying any customer social media content on your store or in paid ads:

1. **Request rights explicitly** — Okendo and Yotpo have built-in rights request flows that DM the Instagram user asking for permission
2. **Never use Instagram content in paid advertising** without written consent — this creates legal liability
3. **Track rights status per photo** — only display content where rights are confirmed; Okendo and Yotpo track this automatically
4. **For organic sourcing** (no dedicated app), comment on the post or send a DM with a rights request and keep a record of the response

---

### Step 4: Set up Q&A moderation

Unanswered questions damage trust more than having no Q&A at all:

**In Okendo and Yotpo:**
- Configure a daily email digest to your team listing all unanswered questions
- Set a 48-hour SLA for staff answers — questions older than 7 days without answers should be escalated

**Best practice:** Enable customer-to-customer answers (other buyers can answer) — this reduces the staff burden and customers often provide more authentic answers than support agents.

---

### Step 5: Measure UGC impact

| Metric | Benchmark | Where to Find |
|--------|-----------|---------------|
| UGC photo submission rate | 2–5% of delivered orders | Loox / Okendo email analytics |
| Products with 3+ customer photos | Track % of top 50 products | App dashboard |
| Q&A answer rate | 90%+ within 7 days | Okendo / Yotpo Q&A report |
| Social proof widget click-through | 1–3% of product page visitors | Widget analytics in Loox/Okendo |

## Best Practices

- **Use Loox or Okendo before building custom** — they handle S3 storage, content moderation, rights management, and Instagram import; building this from scratch takes 2–4 weeks
- **Offer a small incentive for photo submissions** — Loox's discount-for-photo feature increases submission rates by 3–5x compared to asking without an incentive
- **Auto-approve verified purchase photos** — these have lower risk and removing the manual review bottleneck dramatically increases UGC volume
- **Show verified purchase badges on UGC photos** — customers distinguish genuine-use photos from staged ones; the badge increases trust
- **Always run AI content moderation before display** — never approve photos without at least automated screening; AWS Rekognition or Google Vision SafeSearch catch NSFW content automatically
- **Obtain explicit rights before using UGC in paid ads** — using customer photos in advertising without written consent creates legal liability

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Inappropriate content appears on product pages | Enable content moderation before approval; Loox and Okendo run automated screening automatically |
| Social proof widget shows stale or fake urgency | Use a 5-minute cache and only show genuine purchase signals — fabricating data creates reputational and legal risk |
| Q&A section has unanswered questions for weeks | Send a daily digest to the product team; questions older than 7 days without a staff answer damage trust more than no Q&A |
| UGC photos slow page LCP | Loox and Okendo serve via CDN with automatic resizing; for custom builds, always resize to 200px thumbnails and use lazy loading |
| Instagram posts used in paid ads without rights | Track rights approval status per post; Okendo handles this automatically — never publish to ads without confirmed consent |

## Related Skills

- @product-reviews-ratings
- @personalization-engine
- @customer-segmentation
