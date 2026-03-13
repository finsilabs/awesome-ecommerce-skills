---
name: digital-products
description: "Sell software, ebooks, and other downloads with secure delivery, license key generation, download limits, and expiration controls"
category: catalog-inventory
risk: critical
source: curated
date_added: "2026-03-12"
tags: [digital-products, downloads, license-keys, drm, delivery, software, ebooks]
triggers: ["digital product download", "license key delivery", "downloadable product", "software license", "ebook store", "digital goods"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Digital Products

## Overview

Implement the delivery and access control layer for downloadable digital goods: e-books, software, music, templates, and license keys. Covers secure download URL generation with expiring signed URLs, per-order download limits, license key pool management, automatic post-purchase email delivery, and expiration-based access control for subscription-gated digital content.

## When to Use This Skill

- When adding downloadable products (PDFs, software, audio, templates) to an existing store
- When implementing a license key delivery system for software products
- When building a subscription that gates access to a digital content library
- When replacing publicly accessible download URLs with secure, expiring signed URLs

## Prerequisites & Platform Notes

**Shopify**: Shopify has built-in inventory management, product variants, and metafields. Use the Shopify Admin API for bulk operations. For advanced needs, apps like Stocky or custom Shopify Functions.
**WooCommerce**: WooCommerce has built-in stock management. Extend with plugins (ATUM, WP All Import for bulk catalog). Use WooCommerce REST API for integrations.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with product catalog access, API credentials

## Core Instructions

1. **Design the digital product delivery data model**

   ```javascript
   // digital_products table — extends base products
   {
     id: 'dp_ebook_001',
     product_id: 'prod_001',
     file_storage_key: 'products/ebooks/advanced-js-2026.pdf',  // S3/GCS object key
     file_name: 'Advanced-JavaScript-2026.pdf',
     file_size_bytes: 5242880,
     mime_type: 'application/pdf',
     download_limit: 5,           // null = unlimited
     access_duration_days: 365,   // null = perpetual
   }

   // digital_product_licenses table — for license key products
   {
     id,
     product_id,
     license_key: 'XXXX-XXXX-XXXX-XXXX',
     status: 'available'|'sold'|'revoked',
     order_id: null,              // set when sold
     sold_at: null,
   }

   // order_digital_access table — per-order download tracking
   {
     id,
     order_id,
     digital_product_id,
     download_count: 0,
     max_downloads: 5,            // copied from digital_product.download_limit at purchase time
     expires_at: Date,            // copied + calculated at purchase time
     created_at: Date,
   }
   ```

2. **Generate secure expiring download URLs**

   Never expose the raw S3 object key in a publicly accessible URL. Generate short-lived presigned URLs per download attempt.

   ```javascript
   // lib/digitalDelivery.js
   import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

   const s3 = new S3Client({ region: process.env.AWS_REGION });

   export async function generateDownloadUrl(orderId, digitalProductId) {
     // 1. Look up the order's access record
     const access = await db.orderDigitalAccess.findUnique({
       where: { orderId_digitalProductId: { orderId, digitalProductId } },
       include: { digitalProduct: true },
     });

     if (!access) throw new Error('No access record found');

     // 2. Check expiration
     if (access.expiresAt && access.expiresAt < new Date()) {
       throw new DigitalAccessExpiredError('Download access has expired');
     }

     // 3. Check download limit
     if (access.maxDownloads !== null && access.downloadCount >= access.maxDownloads) {
       throw new DownloadLimitExceededError(
         `Download limit of ${access.maxDownloads} reached`
       );
     }

     // 4. Atomically increment download count
     await db.orderDigitalAccess.update({
       where: { id: access.id },
       data: { downloadCount: { increment: 1 } },
     });

     // 5. Generate a 60-second presigned URL — short-lived so it cannot be shared
     const command = new GetObjectCommand({
       Bucket: process.env.DIGITAL_PRODUCTS_BUCKET,
       Key: access.digitalProduct.fileStorageKey,
       ResponseContentDisposition: `attachment; filename="${access.digitalProduct.fileName}"`,
       ResponseContentType: access.digitalProduct.mimeType,
     });

     const url = await getSignedUrl(s3, command, { expiresIn: 60 });
     return url;
   }
   ```

3. **Provision access after successful payment**

   ```javascript
   // Triggered by payment webhook: payment_intent.succeeded
   export async function provisionDigitalAccess(orderId) {
     const order = await db.orders.findUnique({
       where: { id: orderId },
       include: { items: { include: { variant: { include: { digitalProduct: true } } } } },
     });

     const digitalItems = order.items.filter(item => item.variant.digitalProduct);

     for (const item of digitalItems) {
       const dp = item.variant.digitalProduct;

       await db.orderDigitalAccess.upsert({
         where: { orderId_digitalProductId: { orderId, digitalProductId: dp.id } },
         create: {
           orderId,
           digitalProductId: dp.id,
           downloadCount: 0,
           maxDownloads: dp.downloadLimit,
           expiresAt: dp.accessDurationDays
             ? new Date(Date.now() + dp.accessDurationDays * 86400000)
             : null,
         },
         update: {}, // idempotent — do not overwrite existing access
       });
     }

     // Send delivery email
     await sendDigitalDeliveryEmail(order, digitalItems);
   }
   ```

4. **Manage a license key pool**

   ```javascript
   // api/admin/digital-products/[id]/license-keys/import.js
   export async function importLicenseKeys(req, res) {
     const { productId } = req.params;
     const { keys } = req.body; // Array of license key strings

     // Validate no duplicates
     const existing = await db.digitalProductLicenses.findMany({
       where: { productId, licenseKey: { in: keys } },
       select: { licenseKey: true },
     });
     const duplicates = existing.map(l => l.licenseKey);
     if (duplicates.length > 0) {
       return res.status(400).json({ error: 'Duplicate keys', duplicates });
     }

     await db.digitalProductLicenses.createMany({
       data: keys.map(key => ({ productId, licenseKey: key, status: 'available' })),
     });

     res.json({ imported: keys.length });
   }

   // Assign a license key on purchase
   export async function assignLicenseKey(orderId, productId) {
     // Use a transaction with a pessimistic lock to prevent double-assignment
     return db.$transaction(async (tx) => {
       const license = await tx.digitalProductLicenses.findFirst({
         where: { productId, status: 'available' },
       });

       if (!license) {
         throw new Error(`No available license keys for product ${productId}`);
       }

       await tx.digitalProductLicenses.update({
         where: { id: license.id },
         data: { status: 'sold', orderId, soldAt: new Date() },
       });

       return license.licenseKey;
     });
   }
   ```

5. **Send post-purchase delivery email**

   ```javascript
   // lib/digitalDeliveryEmail.js
   export async function sendDigitalDeliveryEmail(order, digitalItems) {
     const downloadLinks = await Promise.all(
       digitalItems.map(async item => {
         const dp = item.variant.digitalProduct;
         if (dp.type === 'license_key') {
           const key = await db.digitalProductLicenses.findFirst({
             where: { orderId: order.id, productId: dp.productId },
           });
           return { name: item.variant.product.name, licenseKey: key?.licenseKey, type: 'license' };
         }
         return {
           name: item.variant.product.name,
           downloadUrl: `/my-account/orders/${order.id}/downloads/${dp.id}`,
           remainingDownloads: dp.downloadLimit,
           expiresAt: dp.accessDurationDays
             ? new Date(Date.now() + dp.accessDurationDays * 86400000)
             : null,
           type: 'file',
         };
       })
     );

     await emailService.send({
       to: order.email,
       template: 'digital-delivery',
       data: { order, downloadLinks },
     });
   }
   ```

## Examples

### Download page UI

```jsx
function DigitalDownloadPage({ orderId, access }) {
  async function handleDownload(digitalProductId) {
    const res = await fetch(`/api/orders/${orderId}/downloads/${digitalProductId}`);
    if (!res.ok) {
      const error = await res.json();
      alert(error.message);
      return;
    }
    const { downloadUrl } = await res.json();
    window.location.href = downloadUrl;
  }

  return (
    <div>
      <h1>Your Downloads</h1>
      {access.map(item => (
        <div key={item.digitalProductId}>
          <p>{item.productName}</p>
          {item.type === 'license' ? (
            <code className="license-key">{item.licenseKey}</code>
          ) : (
            <>
              <p>Downloads remaining: {item.maxDownloads ? item.maxDownloads - item.downloadCount : 'Unlimited'}</p>
              {item.expiresAt && <p>Access expires: {new Date(item.expiresAt).toLocaleDateString()}</p>}
              <button onClick={() => handleDownload(item.digitalProductId)}>Download</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Low stock alert for license key pools

```javascript
// Run as a scheduled job
async function checkLicenseKeyStockLevels() {
  const lowStockThreshold = 10;
  const products = await db.digitalProductLicenses.groupBy({
    by: ['productId'],
    where: { status: 'available' },
    _count: { id: true },
    having: { id: { _count: { lt: lowStockThreshold } } },
  });

  for (const p of products) {
    await notifyAdmin({
      subject: 'Low license key stock',
      message: `Product ${p.productId} has only ${p._count.id} keys remaining`,
    });
  }
}
```

## Best Practices

- **Use presigned URLs with short TTLs (60 seconds)** — the shopper is redirected immediately; a 60-second window is sufficient and prevents URL sharing
- **Store files in private S3/GCS buckets** — never make the storage bucket public; all access must go through signed URL generation
- **Provision access idempotently** — payment webhooks can fire multiple times; use `upsert` with a do-nothing on conflict
- **Monitor license key inventory** — alert when available keys drop below a threshold (e.g., 10 remaining); license key delays cause support tickets and chargebacks
- **Track download counts and alert on anomalies** — a customer who has downloaded 50 times may be distributing the file; flag for review
- **Send a separate email for digital delivery** — do not bundle license keys into the order confirmation email; use a dedicated delivery template that is easy to forward and reference

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Presigned URL expires before customer clicks | Set TTL to at least 60 seconds; generate the URL fresh on each download page load, not when the page is first rendered |
| Double-assignment of license keys | Use a database transaction with `status = 'available'` check and update in a single atomic operation |
| Digital delivery email sent before payment confirmed | Trigger delivery only from the payment webhook (`payment_intent.succeeded`), never from the client-side redirect |
| Customer loses downloads after account deletion | Store access records against `order_id` + `email`, not only the user account ID; allow recovery via order number |
| Large files time out during download | Stream the file from S3 directly via a presigned URL; do not proxy it through your server |

## Related Skills

- @order-processing-pipeline
- @subscription-billing
- @low-stock-alerts
- @stripe-integration
