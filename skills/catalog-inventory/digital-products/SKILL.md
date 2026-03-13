---
name: digital-products
description: "Sell software, ebooks, and other downloads with secure delivery, license key generation, download limits, and expiration controls using platform apps"
category: catalog-inventory
risk: critical
source: curated
date_added: "2026-03-12"
tags: [digital-products, downloads, license-keys, drm, delivery, software, ebooks]
triggers: ["digital product download", "license key delivery", "downloadable product", "software license", "ebook store", "digital goods"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Digital Products

## Overview

Selling digital products — ebooks, software licenses, templates, music, courses — requires secure delivery after payment, download limits to prevent unauthorized sharing, and expiring access links. Every major platform either has this built in (WooCommerce) or has a mature app that handles it (Shopify, BigCommerce). Use the platform's native solution first; only build custom delivery infrastructure if your use case (complex license key management, subscription-gated content libraries) exceeds what apps offer.

## When to Use This Skill

- When adding downloadable products (PDFs, software, audio, templates) to an existing store
- When implementing a license key delivery system for software products
- When building a subscription that gates access to a digital content library
- When replacing publicly accessible download URLs with secure, expiring signed URLs

## Core Instructions

### Step 1: Determine platform and choose the right tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Sky Pilot or Fileflare | Sky Pilot handles files, license keys, streaming video, and download limits; Fileflare is simpler for basic file downloads |
| **WooCommerce** | WooCommerce Downloadable Products (built-in) | WooCommerce has native digital product support including download limits, expiry, and secure token URLs |
| **BigCommerce** | Downloadable Digital Products (built-in) or Fileflare | BigCommerce handles file attachment and download delivery natively |
| **Custom / Headless** | Build delivery with S3 presigned URLs | Required when the platform has no native digital product support |

---

### Step 2: Platform-specific setup

---

#### Shopify

Shopify does not have native digital product support — you need an app. **Sky Pilot** is the most feature-complete option.

**Setting up Sky Pilot:**

1. Install **Sky Pilot** from the Shopify App Store
2. Go to **Sky Pilot → Files → Upload** your digital file (PDF, ZIP, etc.)
3. Go to **Sky Pilot → Products** and link the uploaded file to a specific product or variant
4. Configure delivery settings:
   - **Download limit**: set to 3–5 for standard products, unlimited for subscriptions
   - **Link expiry**: 48–72 hours is standard; customers can request a new link from their account
   - **Automatic delivery**: enabled by default — customers receive a download email immediately after payment
5. Customize the delivery email under **Sky Pilot → Settings → Email template**

**For license key products:**
1. In Sky Pilot, go to **License Keys → Import** and upload a CSV of your license keys
2. Link the license key pool to the product
3. Sky Pilot automatically assigns one key per purchase and includes it in the delivery email

**For subscription-gated content (Sky Pilot + Recharge):**
- Sky Pilot integrates with Recharge — customers with an active subscription automatically gain access; access is revoked when the subscription cancels

---

#### WooCommerce

WooCommerce has digital product delivery built in — no extra plugin required for basic use.

**Setting up a downloadable product:**

1. Go to **WooCommerce → Products → Add Product**
2. Check **Downloadable** (and optionally **Virtual** to skip shipping)
3. Under **Product Data → Downloadable Files**:
   - Click **Add File** and upload the file or enter a URL
   - File name: the name shown to customers in their account
4. Configure access settings:
   - **Download limit**: enter a number (e.g., `5`) or leave blank for unlimited
   - **Download expiry**: number of days after purchase (e.g., `365`), or leave blank for no expiry
5. WooCommerce generates a secure, token-based download URL for each purchase automatically

**Forcing customer account for downloads:**
- Go to **WooCommerce → Settings → Accounts & Privacy**
- Enable **Grant access to downloadable products after payment** and **Require login to download**

**For license key products:**
- Install **License Manager for WooCommerce** (free plugin)
- Go to **License Manager → Add License Keys** and bulk import your keys
- Link the license key pool to a product
- The plugin delivers keys in the order confirmation email and the customer's account page

---

#### BigCommerce

**Setting up digital delivery (built-in):**

1. Go to **Products → Add Product**
2. Under **Files**, upload your digital file (BigCommerce supports files up to 512 MB)
3. Set **Max downloads** to limit how many times the file can be downloaded per order
4. BigCommerce sends an automatic download email after payment with a secure link

**For more advanced delivery:**
- Install **SendOwl** or **Fileflare** from the BigCommerce App Marketplace
- These apps add license key management, download analytics, and streaming video delivery

---

#### Custom / Headless

For headless storefronts, implement secure file delivery using S3 presigned URLs — never expose the raw S3 key:

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });

// Generate a short-lived presigned URL for each download attempt
export async function generateDownloadUrl(orderId: string, digitalProductId: string) {
  const access = await db.orderDigitalAccess.findUnique({
    where: { orderId_digitalProductId: { orderId, digitalProductId } },
    include: { digitalProduct: true },
  });

  if (!access) throw new Error('No access record found');
  if (access.expiresAt && access.expiresAt < new Date()) throw new Error('Download access has expired');
  if (access.maxDownloads && access.downloadCount >= access.maxDownloads) throw new Error('Download limit reached');

  // Atomically increment download count
  await db.orderDigitalAccess.update({ where: { id: access.id }, data: { downloadCount: { increment: 1 } } });

  // 60-second presigned URL — short enough to prevent sharing, long enough for the redirect
  const command = new GetObjectCommand({
    Bucket: process.env.DIGITAL_PRODUCTS_BUCKET,
    Key: access.digitalProduct.fileStorageKey,
    ResponseContentDisposition: `attachment; filename="${access.digitalProduct.fileName}"`,
  });

  return getSignedUrl(s3, command, { expiresIn: 60 });
}

// Provision access after payment — call this from your payment webhook
export async function provisionDigitalAccess(orderId: string) {
  const order = await db.orders.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: { include: { digitalProduct: true } } } } },
  });

  for (const item of order.items.filter(i => i.variant.digitalProduct)) {
    const dp = item.variant.digitalProduct;
    await db.orderDigitalAccess.upsert({
      where: { orderId_digitalProductId: { orderId, digitalProductId: dp.id } },
      create: {
        orderId, digitalProductId: dp.id, downloadCount: 0,
        maxDownloads: dp.downloadLimit,
        expiresAt: dp.accessDurationDays ? new Date(Date.now() + dp.accessDurationDays * 86400000) : null,
      },
      update: {}, // Idempotent — webhooks can fire multiple times
    });
  }
}

// License key pool management
export async function assignLicenseKey(orderId: string, productId: string) {
  return db.$transaction(async tx => {
    const license = await tx.digitalProductLicenses.findFirst({
      where: { productId, status: 'available' },
    });
    if (!license) throw new Error(`No available license keys for product ${productId}`);
    await tx.digitalProductLicenses.update({
      where: { id: license.id },
      data: { status: 'sold', orderId, soldAt: new Date() },
    });
    return license.licenseKey;
  });
}
```

---

### Step 3: Configure post-purchase delivery email

All platforms send an automatic delivery email — customize it to be clear and professional:

**Content to include:**
- Order confirmation number
- Product name and description
- Download link (or license key, displayed prominently)
- Download limit and expiry date if applicable
- Instructions for how to access/install the product
- Support contact if they have trouble

**Shopify (Sky Pilot):** Customize under **Sky Pilot → Settings → Email Template**

**WooCommerce:** Customize under **WooCommerce → Settings → Emails → Customer Processing Order** (includes download links automatically)

**BigCommerce:** Customize under **Marketing → Transactional Emails → Order Status Notification**

---

### Step 4: Monitor license key inventory

For license key products, set up alerts before keys run out:

- **Sky Pilot**: Go to **License Keys → [Product]** — shows remaining key count; Sky Pilot sends email alerts when stock drops below a threshold you configure
- **License Manager for WooCommerce**: Dashboard shows keys remaining per product with color-coded warnings
- **Custom**: Run a daily check and alert when available keys drop below 10

## Best Practices

- **Never deliver digital products until payment is confirmed** — trigger delivery from the payment confirmed webhook, not the order created event; card declines happen after order creation
- **Use short-lived download links (60 seconds)** for headless implementations — generate the URL fresh on each download page load, not when the page renders
- **Set download limits for most products** — 3–5 downloads is standard; unlimited for subscription access; limits prevent casual file sharing
- **Store files in private buckets** — never make your S3/GCS bucket public; all access must go through signed URL generation
- **Monitor license key inventory** — running out of keys causes support tickets and chargebacks; set up alerts when below 20% of original inventory
- **Send a separate, dedicated delivery email** — don't bundle license keys into the generic order confirmation; a focused delivery email is easier for customers to find and reference

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Download link expires before customer clicks it | For headless builds, generate a fresh presigned URL on each page load, not at email send time |
| Digital product delivered after a failed payment | Trigger delivery only from the payment success webhook (`payment_intent.succeeded` in Stripe), never from order creation |
| License keys double-assigned | Use a database transaction for key assignment with an atomic status check — never select and then update in two steps |
| Customer loses access after account deletion | Store download access against `order_id` + `email`, not only the user account ID; allow access recovery via order number |
| Large file download times out | Use S3 presigned URLs to deliver files directly from S3 to the customer's browser — never proxy through your server |

## Related Skills

- @inventory-tracking
- @low-stock-alerts
- @product-data-modeling
