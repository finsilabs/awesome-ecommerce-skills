---
name: ugc-campaign-management
description: "Source, curate, and display user-generated content at scale with rights management, brand safety moderation, and trust-building social proof galleries"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [ugc, social-proof, content-marketing]
triggers: ["manage UGC campaigns", "display user content"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# UGC Campaign Management

## Overview

User-generated content (UGC) — photos, videos, and reviews from real customers — consistently outperforms brand-created content in conversion rate and trust metrics. Shoppers are 79% more likely to purchase when they see UGC, and UGC ads on paid social typically achieve 4x higher CTR than studio-produced ads. This skill covers collecting UGC via hashtag campaigns and post-purchase requests, obtaining usage rights, moderating for brand safety, syndicating to product pages and ads, and measuring UGC's impact on conversion.

## When to Use This Skill

- When product pages need social proof beyond star ratings
- When paid social creative is stale and UGC-style ads would boost performance
- When launching a hashtag campaign to generate organic content at scale
- When needing a rights management system before using customer photos in ads
- When building a shoppable Instagram or TikTok gallery on your storefront

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, UGC platform (TINT, Stackla, or Bazaarvoice), social platform API access for content collection

## Core Instructions

### 1. UGC collection pipeline

Collect UGC through three channels: post-purchase email requests, hashtag monitoring, and direct customer upload widgets.

```typescript
interface UGCSubmission {
  id:           string;
  source:       'hashtag' | 'email-request' | 'widget' | 'review-photo';
  platform:     'instagram' | 'tiktok' | 'twitter' | 'direct-upload';
  authorHandle: string;
  authorId:     string;
  contentUrl:   string;    // original post URL
  mediaUrls:    string[];  // image/video URLs
  caption?:     string;
  productIds:   string[];  // tagged products (manual or auto-detected)
  submittedAt:  Date;
  status:       'pending' | 'approved' | 'rejected' | 'rights-requested' | 'rights-granted';
  rightsToken?: string;
}

// Post-purchase email with UGC request
async function sendUGCRequestEmail(order: Order) {
  // Send 14 days after delivery
  await scheduleEmail(order.customerId, 'ugc-request', {
    subject: `Show us how you style it — tag #${process.env.BRAND_HASHTAG} for a chance to be featured`,
    delay: 14 * 86400000,
    payload: {
      orderItems: order.lineItems,
      hashtag: process.env.BRAND_HASHTAG,
      incentive: '10% off your next order for approved posts',
      uploadUrl: `${process.env.STORE_URL}/share/${order.id}`,
    },
  });
}
```

### 2. Hashtag monitoring integration

```typescript
// Poll Instagram Basic Display API for hashtag posts
async function fetchHashtagPosts(hashtag: string, since: Date) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/ig_hashtag_search?user_id=${process.env.IG_USER_ID}&q=${hashtag}&access_token=${process.env.IG_ACCESS_TOKEN}`
  );
  const { id: hashtagId } = await response.json();

  const postsResponse = await fetch(
    `https://graph.facebook.com/v18.0/${hashtagId}/recent_media?user_id=${process.env.IG_USER_ID}&fields=id,media_url,permalink,caption,timestamp,username&access_token=${process.env.IG_ACCESS_TOKEN}`
  );
  const { data: posts } = await postsResponse.json();

  const newPosts = posts.filter(p => new Date(p.timestamp) > since);

  for (const post of newPosts) {
    const existing = await db.ugcSubmissions.findByExternalId(post.id);
    if (existing) continue;

    await db.ugcSubmissions.create({
      externalId:   post.id,
      source:       'hashtag',
      platform:     'instagram',
      authorHandle: post.username,
      contentUrl:   post.permalink,
      mediaUrls:    [post.media_url],
      caption:      post.caption,
      submittedAt:  new Date(post.timestamp),
      status:       'pending',
    });
  }
}
```

### 3. Rights management workflow

Always obtain explicit rights before using customer content in ads or on-site:

```typescript
async function requestContentRights(submissionId: string) {
  const submission = await db.ugcSubmissions.findById(submissionId);
  const rightsToken = generateSecureToken();

  // Send a comment/DM requesting rights
  const rightsMessage = `We love your post! We'd love to feature it on our website and in our marketing. Reply "YES" to grant us permission, or visit ${process.env.STORE_URL}/ugc/rights/${rightsToken} to manage your preferences. #ugcpermission`;

  await postInstagramComment(submission.externalId, rightsMessage);

  await db.ugcSubmissions.update(submissionId, {
    status:      'rights-requested',
    rightsToken,
    rightsRequestedAt: new Date(),
  });
}

// Rights grant endpoint — customer visits link to approve
// GET /ugc/rights/:token
export async function handleRightsGrant(req: Request, res: Response) {
  const { token } = req.params;
  const submission = await db.ugcSubmissions.findByRightsToken(token);

  if (!submission) return res.status(404).send('Not found');

  if (req.query.action === 'approve') {
    await db.ugcSubmissions.update(submission.id, {
      status: 'rights-granted',
      rightsGrantedAt: new Date(),
      rightsScope: 'website,ads,email',
    });

    // Send thank-you with incentive
    if (submission.authorEmail) {
      await sendEmail(submission.authorEmail, 'ugc-rights-thanks', {
        discountCode: await createUniqueDiscount({ type: 'percent_off', value: 10 }),
      });
    }

    return res.redirect(`${process.env.STORE_URL}/ugc/rights/thank-you`);
  }

  return res.render('ugc-rights-page', { submission });
}
```

### 4. Content moderation pipeline

```typescript
interface ModerationResult {
  approved:   boolean;
  flags:      string[];
  score:      number;  // 0-1, higher = more problematic
}

async function moderateUGCSubmission(submission: UGCSubmission): Promise<ModerationResult> {
  const flags: string[] = [];

  // Automated checks
  for (const mediaUrl of submission.mediaUrls) {
    const safeSearchResult = await callVisionSafeSearchAPI(mediaUrl);
    if (safeSearchResult.adult === 'LIKELY' || safeSearchResult.adult === 'VERY_LIKELY') {
      flags.push('adult-content');
    }
    if (safeSearchResult.violence === 'LIKELY') flags.push('violence');
  }

  // Check caption for brand-unsafe language
  if (submission.caption) {
    const toxicityScore = await callPerspectiveAPI(submission.caption);
    if (toxicityScore > 0.8) flags.push('toxic-language');

    // Check for competitor mentions
    const competitors = process.env.COMPETITOR_BRANDS?.split(',') ?? [];
    if (competitors.some(c => submission.caption!.toLowerCase().includes(c.toLowerCase()))) {
      flags.push('competitor-mention');
    }
  }

  const score   = flags.length / 5;  // normalized severity
  const approved = flags.length === 0;

  return { approved, flags, score };
}

async function runModerationQueue() {
  const pending = await db.ugcSubmissions.findAll({ where: { status: 'pending' } });

  for (const submission of pending) {
    const result = await moderateUGCSubmission(submission);

    if (result.approved) {
      await db.ugcSubmissions.update(submission.id, { status: 'approved', moderationFlags: [] });
      await requestContentRights(submission.id);
    } else if (result.flags.includes('adult-content') || result.flags.includes('violence')) {
      await db.ugcSubmissions.update(submission.id, { status: 'rejected', moderationFlags: result.flags });
    } else {
      // Needs human review
      await db.ugcModerationQueue.create({ submissionId: submission.id, flags: result.flags });
    }
  }
}
```

### 5. Display UGC on product pages

```typescript
// API: GET /api/products/:id/ugc
export async function getProductUGC(req: Request, res: Response) {
  const { id } = req.params;
  const { limit = 12, offset = 0 } = req.query;

  const submissions = await db.ugcSubmissions.findAll({
    where: {
      productIds: { contains: id },
      status: 'rights-granted',
    },
    orderBy: { engagementScore: 'desc' },
    limit: Number(limit),
    offset: Number(offset),
  });

  return res.json({
    items: submissions.map(s => ({
      id:          s.id,
      mediaUrl:    s.mediaUrls[0],
      thumbnailUrl:s.thumbnailUrl,
      authorHandle:s.authorHandle,
      platform:    s.platform,
      contentUrl:  s.contentUrl,
    })),
    total: await db.ugcSubmissions.count({ where: { productIds: { contains: id }, status: 'rights-granted' } }),
  });
}
```

## Best Practices

- **Never use customer content without explicit rights** — even tagged brand posts require permission for commercial use; the rights workflow is non-negotiable
- **Automate moderation but always have a human review queue** — AI moderation misses context; a human should review flagged items and a random sample of auto-approved content
- **Feature UGC prominently on product pages** — placing a UGC gallery below the fold near reviews increases conversion by 15–25%
- **Respond to UGC posts publicly** — commenting on or sharing tagged posts increases the volume of future submissions organically
- **Track UGC conversion impact with A/B tests** — test product page variants with and without the UGC gallery to measure incremental conversion rate
- **Refresh UGC in ads frequently** — UGC fatigue is real; rotate new content into paid social campaigns every 2–4 weeks
- **Offer non-monetary recognition** — being featured on the brand's official page is often more motivating than a discount; create a "Featured Customer" highlight

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Using content without rights and getting DMCA'd | Build the rights request into the moderation pipeline; never publish without `status === 'rights-granted'` |
| Low response rate to rights requests | Simplify the rights grant to a single reply — "Reply YES" is more effective than a form link |
| UGC gallery loading slowly | Pre-generate thumbnails and serve via CDN; lazy-load images below the fold |
| Competitor products visible in tagged photos | Add competitor detection to the moderation pipeline; reject or crop images showing competitor branding |
| UGC volume drying up after initial campaign | Keep the post-purchase email request active permanently; it is the most reliable ongoing source |

## Related Skills

- @influencer-marketplace-integration
- @review-generation-engine
- @social-proof-widgets
- @tiktok-ads-integration
- @content-commerce
