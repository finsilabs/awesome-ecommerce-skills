---
name: international-shipping
description: "Handle cross-border orders with customs form generation, duties and taxes estimation, HS code assignment, and restricted items blocking"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [international-shipping, customs, duties, taxes, restricted-items, cross-border, HS-codes, DDP, DDU]
triggers: ["international shipping", "customs forms", "duties and taxes", "cross-border shipping", "HS codes", "restricted items", "DDP DDU", "import duties"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# International Shipping

## Overview

Implement cross-border shipping capabilities including HS code assignment for products, duties and taxes estimation at checkout (DDP vs DDU), customs form generation, and restricted/prohibited item screening. Enables customers to see landed cost at checkout and ensures shipments clear customs without delays.

## When to Use This Skill

- When expanding from domestic to international shipping and need to handle customs declarations
- When offering Delivered Duty Paid (DDP) so customers see the full landed cost at checkout
- When building a product catalog that needs HS codes for accurate tariff classification
- When screening orders for restricted items before processing international shipments
- When integrating with a customs broker or carrier customs API (EasyPost, Shippo, Flexport)

## Core Instructions

1. **Assign HS codes to products**

   ```sql
   ALTER TABLE products ADD COLUMN hs_code VARCHAR(10);         -- e.g. '6109.10' (cotton T-shirts)
   ALTER TABLE products ADD COLUMN country_of_origin VARCHAR(2); -- ISO 3166-1 alpha-2, e.g. 'CN'
   ALTER TABLE products ADD COLUMN restricted_countries VARCHAR(2)[]; -- countries where this item cannot ship
   ALTER TABLE products ADD COLUMN declared_value_override INTEGER; -- cents; NULL = use sale price

   -- HS code reference table for auto-suggestions
   CREATE TABLE hs_codes (
     code        VARCHAR(10) PRIMARY KEY,
     description TEXT NOT NULL,
     notes       TEXT
   );
   ```

   Common HS codes for e-commerce:
   ```
   6109.10 — T-shirts, cotton
   6109.90 — T-shirts, other (synthetic)
   6404.11 — Athletic footwear
   8471.30 — Laptops/portable computers
   9503.00 — Toys
   3304.99 — Cosmetics
   ```

2. **Estimate duties and taxes at checkout**

   ```typescript
   import EasyPost from '@easypost/api';
   const easypost = new EasyPost(process.env.EASYPOST_API_KEY);

   interface DutyEstimation {
     duties: number;         // cents
     taxes: number;          // cents (VAT/GST)
     total: number;          // duties + taxes
     currency: string;
     method: 'DDP' | 'DDU'; // Delivered Duty Paid vs Unpaid
   }

   async function estimateDutiesAndTaxes(
     orderLines: { productId: string; quantity: number; unitPriceCents: number }[],
     destinationCountry: string,
     destinationZip: string
   ): Promise<DutyEstimation> {
     const lineItems = await Promise.all(orderLines.map(async line => {
       const product = await db.products.findById(line.productId);
       return {
         description: product.name,
         hs_tariff_number: product.hs_code,
         origin_country: product.country_of_origin ?? 'US',
         quantity: line.quantity,
         value: (line.unitPriceCents / 100).toFixed(2),
         currency: 'USD',
         weight: product.weight_oz ?? 4,  // ounces
       };
     }));

     try {
       const response = await easypost.Order.create({
         to_address: { country: destinationCountry, zip: destinationZip },
         from_address: { country: 'US' },
         customs_info: { contents_type: 'merchandise' },
         // EasyPost Carbon API or Taxes API call
       });
       // Note: Use EasyPost's /taxes endpoint for DDP estimation
       // This is a simplified illustration — refer to EasyPost docs for exact API
     } catch (err) {
       console.error('Duty estimation failed, returning DDU:', err);
     }

     // Fallback: rough estimation using destination country VAT rates
     const vatRates: Record<string, number> = {
       GB: 0.20, DE: 0.19, FR: 0.20, AU: 0.10, CA: 0.05, JP: 0.10
     };
     const vatRate = vatRates[destinationCountry] ?? 0;
     const merchandiseValue = orderLines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
     const taxes = Math.round(merchandiseValue * vatRate);

     return { duties: 0, taxes, total: taxes, currency: 'USD', method: 'DDU' };
   }
   ```

3. **Screen for restricted and prohibited items**

   ```typescript
   interface RestrictedItemCheck {
     allowed: boolean;
     blockedProducts: { productId: string; name: string; reason: string }[];
   }

   async function screenForRestrictions(
     orderLines: { productId: string; quantity: number }[],
     destinationCountry: string
   ): Promise<RestrictedItemCheck> {
     const blockedProducts: RestrictedItemCheck['blockedProducts'] = [];

     for (const line of orderLines) {
       const product = await db.products.findById(line.productId);

       if (product.restricted_countries?.includes(destinationCountry)) {
         blockedProducts.push({
           productId: product.id,
           name: product.name,
           reason: `Cannot ship to ${destinationCountry}`,
         });
         continue;
       }

       // Check against global restriction database
       const globalRestriction = await db.countryRestrictions.findOne({
         country_code: destinationCountry,
         hs_code: product.hs_code,
       });

       if (globalRestriction?.is_prohibited) {
         blockedProducts.push({
           productId: product.id,
           name: product.name,
           reason: globalRestriction.reason ?? 'Prohibited in destination country',
         });
       }
     }

     return { allowed: blockedProducts.length === 0, blockedProducts };
   }

   // Common restrictions to seed in your database
   const KNOWN_RESTRICTIONS = [
     { country: 'AU', hs_prefix: '9305', reason: 'Firearm parts — prohibited' },
     { country: 'IN', hs_prefix: '2207', reason: 'Alcohol — requires import licence' },
     { country: 'CN', hs_prefix: '8517', reason: 'Consumer electronics require CCC certification' },
   ];
   ```

4. **Generate a customs declaration form**

   ```typescript
   async function generateCustomsInfo(orderId: string): Promise<any> {
     const order = await db.orders.findById(orderId);
     const lines = await db.orderLines.findByOrderId(orderId);

     const customsItems = await Promise.all(lines.map(async line => {
       const product = await db.products.findById(line.product_id);
       const declaredValue = product.declared_value_override ?? line.unit_price;

       return {
         description: product.name.slice(0, 45),     // most carriers cap at 45 chars
         quantity: line.quantity,
         net_weight: (product.weight_oz ?? 4) / 16,  // convert to pounds
         value: (declaredValue / 100).toFixed(2),
         hs_tariff_number: product.hs_code ?? '',
         origin_country: product.country_of_origin ?? 'US',
         currency: 'USD',
       };
     }));

     return {
       contents_type: 'merchandise',
       contents_explanation: null,
       customs_certify: true,
       customs_signer: process.env.CUSTOMS_SIGNER_NAME,
       non_delivery_option: 'return',  // return to sender if undeliverable
       restriction_type: 'none',
       items: customsItems,
       eel_pfc: 'NOEEI 30.37(a)', // Electronic Export Information exemption for low-value exports
     };
   }
   ```

5. **Integrate customs info into label creation**

   ```typescript
   async function createInternationalLabel(fulfillmentId: string): Promise<string> {
     const fulfillment = await db.fulfillments.findById(fulfillmentId);
     const order = await db.orders.findById(fulfillment.order_id);
     const customsInfo = await generateCustomsInfo(order.id);

     const shipment = await easypost.Shipment.create({
       to_address: {
         name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
         street1: order.shipping_address.line1,
         city: order.shipping_address.city,
         state: order.shipping_address.state,
         zip: order.shipping_address.zip,
         country: order.shipping_address.country,
         email: order.customer_email,
         phone: order.shipping_address.phone,  // required for international
       },
       from_address: {
         name: process.env.WAREHOUSE_NAME,
         street1: process.env.WAREHOUSE_ADDRESS,
         city: process.env.WAREHOUSE_CITY,
         state: process.env.WAREHOUSE_STATE,
         zip: process.env.WAREHOUSE_ZIP,
         country: 'US',
         phone: process.env.WAREHOUSE_PHONE,
       },
       parcels: [{
         length: fulfillment.package_length_in,
         width: fulfillment.package_width_in,
         height: fulfillment.package_height_in,
         distance_unit: 'in',
         weight: fulfillment.package_weight_oz,
         mass_unit: 'oz',
       }],
       customs_info: customsInfo,
     });

     const rate = shipment.rates.find(r => r.carrier === 'USPS' && r.service === 'FirstClassPackageInternationalService')
       ?? shipment.rates[0];
     const transaction = await easypost.Transaction.create({ rate: rate.id, label_file_type: 'PDF' });

     return transaction.label_url;
   }
   ```

## Examples

### HS code lookup helper

```typescript
async function suggestHsCode(productName: string, productDescription: string): Promise<string[]> {
  // In production, use an HS code classification API (e.g., Avalara, Zonos)
  // This example uses a simple keyword match against your local hs_codes table
  const words = `${productName} ${productDescription}`.toLowerCase().split(/\s+/);
  const results = await db.hsCodes.findAll({
    description: { containsAny: words }
  }).limit(5);
  return results.map(r => r.code);
}
```

### De minimis value thresholds (no duties below this value)

```typescript
const DE_MINIMIS_CENTS: Record<string, number> = {
  US:   80000,   // $800 USD
  CA:   2000,    // CAD 20
  AU:   100000,  // AUD 1,000
  GB:   13500,   // £135
  EU:   15000,   // €150 (combined EU threshold)
  MX:   5000,    // USD 50
};

function exceedsDeMinimisCents(totalValueCents: number, destinationCountry: string): boolean {
  const threshold = DE_MINIMIS_CENTS[destinationCountry] ?? 0;
  return totalValueCents > threshold;
}
```

## Best Practices

- **Assign HS codes to every product before enabling international shipping** — missing HS codes lead to customs delays; automate classification with an API (Zonos, Avalara) for large catalogs
- **Always include a phone number in the ship-to address** — most international carriers and customs agencies require a recipient phone number; missing this causes label creation failures
- **Offer DDP for key international markets** — customers who see the full landed cost (including duties) at checkout convert significantly better than those who receive a surprise duties bill on delivery
- **Respect de minimis thresholds** — orders below the de minimis value of the destination country are often duty-free; calculate this and suppress the duty estimate when below threshold
- **Use 'return to sender' for undeliverable international packages** — 'abandon' destroys the package and prevents recouping any value; 'return' lets you restock or reship
- **Keep customs descriptions generic but accurate** — avoid trade names or brand names in descriptions; "Cotton T-shirt" is better than "Supreme Box Logo Tee" for faster customs clearance
- **Store the EEL/PFC number on high-value exports** — shipments over $2,500 USD require Electronic Export Information filing; use exemption NOEEI 30.37(a) for merchandise under this threshold

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Label creation fails with "customs info required" | Always include `customs_info` for any shipment with a non-US destination country, even for low-value orders |
| Duties estimated at checkout differ from actual duties assessed | Clearly label estimates as approximate; use a DDP provider (Zonos, Global-e) for guaranteed landed-cost accuracy |
| Prohibited item detected after label is created | Screen for restrictions before routing to fulfillment; reject the international order during checkout if prohibited items are in the cart |
| Phone number missing on international address | Make phone number required for all non-domestic shipping addresses; add a validation step in address form |

## Related Skills

- @order-fulfillment-workflow
- @shipment-tracking
- @shipping-rate-calculator
- @same-day-delivery
- @order-management-system
