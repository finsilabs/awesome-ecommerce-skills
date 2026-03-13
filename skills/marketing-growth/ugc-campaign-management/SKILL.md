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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# UGC Campaign Management

## Overview

User-generated content — photos, videos, and reviews from real customers — consistently outperforms brand-created content. Shoppers are 79% more likely to purchase when they see UGC, and UGC ads on paid social typically achieve 4× higher CTR than studio-produced ads. Dedicated UGC platforms (Yotpo, Okendo, TINT) handle collection, rights management, moderation, and display widgets. Custom pipelines only make sense for headless stores with high UGC volume.

## When to Use This Skill

- When product pages need social proof beyond star ratings
- When paid social creative is stale and UGC-style ads would boost performance
- When launching a hashtag campaign to generate organic content at scale
- When needing a rights management workflow before using customer photos in ads
- When building a shoppable Instagram or TikTok gallery on your storefront

## Core Instructions

### Step 1: Choose the right UGC platform

| Platform | Best For | Shopify | WooCommerce | BigCommerce | Price |
|----------|---------|---------|-------------|-------------|-------|
| **Yotpo** | Reviews + photos + social syncing | App Store | Plugin | App Marketplace | Free tier; $119+/mo |
| **Okendo** | Photo/video reviews, attribute ratings | App Store | — | — | $19+/mo |
| **TINT** | Shoppable galleries, enterprise | Via JS | Via JS | Via JS | $500+/mo |
| **Loox** | Photo-focused reviews, Shopify-native | App Store | — | — | $9+/mo |
| **Stackla** | Hashtag monitoring + brand gallery | Via JS | Via JS | Via JS | Custom pricing |

**Recommendation:** Use **Loox** or **Okendo** for Shopify if your priority is photo review collection on product pages. Use **Yotpo** if you want both review collection and shoppable UGC galleries. For WooCommerce, Yotpo or a combination of WooCommerce product reviews (built-in) + a gallery plugin covers most needs.

### Step 2: Set up UGC collection

---

#### Shopify with Loox (photo reviews)

1. Install **Loox** from the Shopify App Store
2. Go to **Loox → Settings → Review Request Emails**:
   - Enable automatic review requests after order fulfillment
   - Set timing: 14 days after order delivered
   - Enable **Photo review incentive**: "Add a photo to your review and get 10% off your next order"
3. Go to **Loox → Widgets** and add the photo review carousel to product pages and the homepage
4. Loox automatically moderates submitted photos and issues the discount code after approval

---

#### Shopify with Yotpo (photo reviews + social syncing)

1. Install **Yotpo** from the Shopify App Store
2. Go to **Yotpo → Reviews → Mail After Purchase** and enable photo review requests at 14 days post-delivery
3. Go to **Yotpo → Gallery → Sources** to connect Instagram:
   - Add your brand's Instagram hashtag
   - Yotpo pulls all public posts with your hashtag automatically
4. Go to **Yotpo → Gallery → Moderation** to review and approve imported Instagram UGC
5. For each Instagram post you want to feature: click **Request Rights** — Yotpo sends an automated comment requesting usage permission
6. Go to **Yotpo → Gallery → Display** to add a shoppable UGC gallery section to your product pages or homepage

---

#### WooCommerce

1. Enable WooCommerce's built-in product reviews under **WooCommerce → Settings → Products → Reviews**
2. For photo reviews: install **Customer Reviews for WooCommerce** plugin (free tier available) which adds photo upload to the review form
3. For social UGC galleries: install **Flow-Flow Social Stream** plugin to pull Instagram/TikTok content by hashtag and display on-site
4. For rights management on collected UGC: use **TINT** or **Stackla** via their JavaScript embed — both work with any platform

---

#### BigCommerce

1. Install **Yotpo** from the BigCommerce App Marketplace
2. Configuration mirrors the Shopify Yotpo setup above
3. For additional hashtag-sourced UGC: connect Instagram via Yotpo's Social Feeds feature

---

#### Custom / Headless

For headless stores, build the UGC collection via Instagram API and a direct upload widget:

```typescript
// Fetch posts by hashtag from Instagram Graph API
async function fetchHashtagPosts(hashtag: string, since: Date) {
  const hashtagSearch = await fetch(
    `https://graph.facebook.com/v18.0/ig_hashtag_search?user_id=${process.env.IG_USER_ID}&q=${hashtag}&access_token=${process.env.IG_ACCESS_TOKEN}`
  );
  const { id: hashtagId } = await hashtagSearch.json();

  const postsResponse = await fetch(
    `https://graph.facebook.com/v18.0/${hashtagId}/recent_media?user_id=${process.env.IG_USER_ID}&fields=id,media_url,permalink,caption,timestamp,username&access_token=${process.env.IG_ACCESS_TOKEN}`
  );
  const { data: posts } = await postsResponse.json();

  for (const post of posts.filter(p => new Date(p.timestamp) > since)) {
    await db.ugcSubmissions.upsert({ externalId: post.id }, {
      source: 'hashtag',
      platform: 'instagram',
      authorHandle: post.username,
      mediaUrl: post.media_url,
      contentUrl: post.permalink,
      caption: post.caption,
      status: 'pending', // always start as pending — requires moderation + rights
    });
  }
}
```

### Step 3: Rights management

**Never use customer content in ads or on your website without explicit permission.** Instagram terms prohibit commercial use of UGC without rights. This is not optional.

**In Yotpo (automated):**
1. When you approve Instagram UGC in the Yotpo gallery, click **Request Rights**
2. Yotpo automatically posts a comment on the original Instagram photo asking the creator to reply "Yes" to grant rights
3. When the creator replies, Yotpo marks the content as rights-approved
4. Only rights-approved content appears in your published gallery

**For direct upload via your review form (Judge.me, Loox, Okendo):**
- Photo reviews submitted through your store's review form are covered by the review platform's terms of service, which include usage rights for the store
- No separate rights request needed for review photos

**Manual rights request (if not using a UGC platform):**
Send a comment: "We love this photo! May we feature it on our website and in our marketing? Reply 'YES' to grant permission or visit [link] to manage preferences."

### Step 4: Moderate UGC before publishing

**Automated moderation via Yotpo/Loox:**
- Both platforms include automatic content safety screening
- Set up keyword filters under the moderation settings to catch competitor mentions, inappropriate language, or misleading claims

**Manual moderation checklist before approving any UGC:**
1. Product is clearly visible and matches the product listing
2. No competitor products or branding visible
3. No inappropriate content (adult, violence)
4. No misleading product claims
5. Rights have been granted (for Instagram UGC)

### Step 5: Display UGC on product pages

**In Yotpo:** go to **Gallery → Display → Add to Store** — drag the UGC gallery widget into your product page template in the Shopify Theme Editor.

**In Loox:** go to **Widgets → Photo Reviews** and add to product page via Shopify Theme Editor.

**Key placements (in order of conversion impact):**
1. Product page — below the description, before customer reviews
2. Homepage — "As worn by our customers" gallery section
3. Cart page — "Customers who bought this also shared" section
4. Post-purchase confirmation page — social sharing prompt showing similar UGC

### Step 6: Use UGC in paid social ads

UGC-style ads consistently outperform polished brand content on TikTok and Meta. Steps to repurpose approved UGC:

1. Download the original high-resolution media from your UGC platform (rights must be granted)
2. In Meta Ads Manager: create a new ad and upload the UGC image or video
3. For Spark Ads on TikTok: use the creator's original TikTok post (not a download) via Spark Ad authorization
4. Track performance — compare UGC ads vs. brand ads using the same targeting and budget; measure CTR and conversion rate

## Best Practices

- **Build UGC collection into your post-purchase flow permanently** — the post-purchase review request email is the most reliable ongoing source of UGC; keep it running indefinitely
- **Respond publicly to tagged posts** — commenting "Love this! We featured it on our website" on customer posts increases future submissions organically
- **Feature UGC in your email campaigns** — adding a customer photo to a post-purchase flow email increases click-through rate significantly compared to product images
- **Rotate UGC in paid ads every 2–4 weeks** — creative fatigue is faster in social advertising; a steady UGC pipeline is a competitive advantage
- **Offer non-monetary recognition** — being featured on the brand's official channel is often more motivating than a discount; create a "Featured Customer" Instagram highlight

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Using content without rights and receiving a DMCA complaint | Never publish UGC until rights status is "approved" in your platform; review photos from your form are covered, but Instagram hashtag posts require separate rights |
| Low response rate to rights requests | Simplify: "Reply YES to grant permission" in a comment performs 3× better than linking to a form |
| UGC gallery loading slowly | Pre-generate thumbnails and serve via CDN; lazy-load images below the fold with IntersectionObserver |
| Competitor products appearing in approved UGC | Add competitor brand name detection to your moderation checklist; reject or crop images with competitor branding |
| UGC volume drops after initial campaign | The post-purchase review request must run permanently — it is the only reliable ongoing source |

## Related Skills

- @review-generation-engine
- @social-proof-widgets
- @influencer-marketplace-integration
- @tiktok-ads-integration
- @content-commerce
