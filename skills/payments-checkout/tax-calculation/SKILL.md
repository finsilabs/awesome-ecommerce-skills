---
name: tax-calculation
description: "Calculate accurate sales tax and VAT at checkout using TaxJar or Avalara, with nexus management for multi-state and international compliance"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [tax, vat, nexus, taxjar, avalara, compliance, checkout, international]
triggers: ["tax calculation", "sales tax", "VAT", "TaxJar integration", "Avalara integration", "tax nexus", "international tax"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Tax Calculation

## Overview

Integrate a tax calculation service (TaxJar or Avalara) to compute accurate sales tax, VAT, and GST at checkout. Covers nexus determination (economic vs. physical presence), product taxability overrides, EU/UK VAT with reverse charge, real-time calculation at the checkout address step, and filing-ready transaction recording after order completion.

## When to Use This Skill

- When expanding sales to states or countries where you have tax nexus obligations
- When manual tax rates are causing compliance issues or requiring constant updates
- When implementing EU VAT compliance (IOSS, OSS, country-specific thresholds)
- When building a checkout that needs to display accurate tax before the customer confirms payment

## Prerequisites & Platform Notes

**Shopify**: Shopify handles checkout natively. Use Shopify Payments (powered by Stripe), checkout extensions, and Shopify Functions for custom discount/payment logic. You cannot modify the core checkout without Checkout Extensions.
**WooCommerce**: WooCommerce supports payment gateways via plugins (WooCommerce Stripe, WooCommerce PayPal). Extend checkout with woocommerce_checkout_process and woocommerce_payment_complete hooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Stripe or PayPal account, relevant payment plugin/app

## Core Instructions

1. **Understand nexus before integrating**

   ```
   US Sales Tax Nexus:
   Physical nexus: You have employees, warehouses, or offices in a state
   Economic nexus: Revenue or transaction count exceeds state threshold
                   Most states: $100,000/year OR 200 transactions/year

   EU VAT:
   EU-based sellers: Charge VAT at the rate of the customer's country
   Non-EU sellers:   OSS/IOSS registration required above €10,000/year in EU sales
   B2B transactions: Reverse charge applies — customer pays VAT via self-assessment
   ```

2. **Integrate TaxJar for US sales tax**

   ```javascript
   // lib/taxJar.js
   import Taxjar from 'taxjar';

   const taxjar = new Taxjar({ apiKey: process.env.TAXJAR_API_KEY });

   export async function calculateTaxForOrder({ fromAddress, toAddress, lineItems, shippingCost }) {
     const params = {
       from_country: fromAddress.country,
       from_zip: fromAddress.zip,
       from_state: fromAddress.state,
       from_city: fromAddress.city,
       from_street: fromAddress.street,

       to_country: toAddress.country,
       to_zip: toAddress.zip,
       to_state: toAddress.state,
       to_city: toAddress.city,
       to_street: toAddress.street,

       amount: lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
       shipping: shippingCost,

       line_items: lineItems.map(item => ({
         id: item.lineItemId,
         quantity: item.quantity,
         unit_price: item.unitPrice,
         product_tax_code: item.taxCode ?? null, // e.g., 'TPP' for tangible personal property
         discount: item.discountAmount ?? 0,
       })),
     };

     const response = await taxjar.taxForOrder(params);

     return {
       totalTax: response.tax.amount_to_collect,
       taxRate: response.tax.rate,
       breakdown: {
         stateTax: response.tax.breakdown?.state_tax_collectable ?? 0,
         countyTax: response.tax.breakdown?.county_tax_collectable ?? 0,
         cityTax: response.tax.breakdown?.city_tax_collectable ?? 0,
         specialTax: response.tax.breakdown?.special_district_tax_collectable ?? 0,
       },
       taxableAmount: response.tax.taxable_amount,
       hasNexus: response.tax.has_nexus,
     };
   }
   ```

3. **Integrate Avalara AvaTax for international coverage**

   Avalara covers US, Canada, EU VAT, UK VAT, Australia GST, and more.

   ```javascript
   // lib/avalara.js
   import { Avatax } from 'avatax';

   const client = new Avatax({
     appName: 'YourStore',
     appVersion: '1.0',
     environment: process.env.AVALARA_ENV === 'production' ? 'production' : 'sandbox',
     machineName: 'checkout-service',
   }).withSecurity({
     username: process.env.AVALARA_USERNAME,
     password: process.env.AVALARA_PASSWORD,
   });

   export async function calculateTaxAvalara({ fromAddress, toAddress, lineItems, shippingCost, commit = false }) {
     const transaction = {
       type: commit ? 'SalesInvoice' : 'SalesOrder', // SalesOrder = estimate only
       companyCode: process.env.AVALARA_COMPANY_CODE,
       date: new Date().toISOString().split('T')[0],
       customerCode: 'CHECKOUT',
       commit,

       addresses: {
         singleLocation: {
           line1: toAddress.street,
           city: toAddress.city,
           region: toAddress.state,
           country: toAddress.country,
           postalCode: toAddress.zip,
         },
       },

       lines: [
         ...lineItems.map((item, i) => ({
           number: String(i + 1),
           quantity: item.quantity,
           amount: item.unitPrice * item.quantity - (item.discountAmount ?? 0),
           itemCode: item.sku,
           taxCode: item.taxCode ?? 'P0000000', // Default: tangible personal property
           description: item.title,
         })),
         {
           number: 'SHIPPING',
           amount: shippingCost,
           taxCode: 'FR010000', // Shipping taxability code
         },
       ],
     };

     const result = await client.createTransaction({ model: transaction });

     return {
       totalTax: result.totalTax,
       taxRate: result.lines?.reduce((sum, l) => sum + (l.taxCalculated ?? 0), 0) / result.totalAmount,
       breakdown: result.summary?.map(s => ({
         taxName: s.taxName,
         rate: s.rate,
         taxCalculated: s.taxCalculated,
         jurisdiction: s.jurisName,
       })) ?? [],
       transactionCode: result.code, // Store for filing/commit later
     };
   }
   ```

4. **Handle EU VAT with reverse charge**

   ```javascript
   // lib/vatCalculation.js

   // GB is NOT in the EU since Brexit (January 2021) — handle UK VAT separately
   const EU_COUNTRIES = ['AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR',
                         'GR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL',
                         'PT','RO','SE','SI','SK'];
   // UK VAT: UK sellers must register for UK VAT separately via HMRC.
   // Non-UK sellers selling to UK consumers may need to register for UK VAT
   // (threshold: £0 for non-established sellers, £85,000 for UK-established sellers).
   const UK_COUNTRIES = ['GB'];

   export async function calculateVAT({ toAddress, lineItems, buyerVatNumber }) {
     const isEUDestination = EU_COUNTRIES.includes(toAddress.country);
     const isBusiness = !!buyerVatNumber;

     if (!isEUDestination) {
       // No VAT for outside EU (assuming your company is EU-based)
       return { totalVAT: 0, vatRate: 0, vatType: 'none' };
     }

     if (isBusiness && toAddress.country !== process.env.SELLER_COUNTRY) {
       // B2B cross-border within EU — reverse charge applies, buyer self-accounts
       const isValid = await validateVATNumber(buyerVatNumber);
       if (isValid) {
         return { totalVAT: 0, vatRate: 0, vatType: 'reverse_charge', validatedVAT: buyerVatNumber };
       }
       // VAT number invalid — charge VAT as B2C
     }

     // B2C — charge VAT at destination country rate
     const vatRate = await getVATRateForCountry(toAddress.country);
     const taxableAmount = lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
     const totalVAT = +(taxableAmount * vatRate).toFixed(2);

     return { totalVAT, vatRate, vatType: 'standard' };
   }

   async function validateVATNumber(vatNumber) {
     // Use VIES validation service
     const res = await fetch(
       `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${vatNumber.slice(0,2)}/vat/${vatNumber.slice(2)}`
     );
     const data = await res.json();
     return data.isValid;
   }

   // Country-specific VAT rates (simplified — use a maintained database in production)
   // GB rate (20%) is for UK VAT — keep separate from EU_COUNTRIES rates above
   // FI rate updated to 25.5% in September 2024 (previously 24%)
   const VAT_RATES = {
     DE: 0.19, FR: 0.20, IT: 0.22, ES: 0.21, NL: 0.21,
     SE: 0.25, DK: 0.25, FI: 0.255,
   };
   const UK_VAT_RATES = {
     GB: 0.20,
   };
   async function getVATRateForCountry(countryCode) {
     return VAT_RATES[countryCode] ?? 0.20; // Default to 20% if unknown
   }
   ```

5. **Record committed transactions for tax filing**

   After a successful order, commit the tax transaction to TaxJar or Avalara so it appears in your filing reports.

   ```javascript
   // Called after order.status transitions to 'confirmed'
   export async function commitTaxTransaction(orderId) {
     const order = await db.orders.findUnique({
       where: { id: orderId },
       include: { lineItems: true, shippingAddress: true },
     });

     if (!order.taxTransactionCode) {
       // No pre-calculated tax transaction — calculate and commit now
       const taxResult = await calculateTaxAvalara({
         fromAddress: STORE_ADDRESS,
         toAddress: order.shippingAddress,
         lineItems: order.lineItems,
         shippingCost: order.shippingCost,
         commit: true,
       });
       await db.orders.update({
         where: { id: orderId },
         data: { taxTransactionCode: taxResult.transactionCode },
       });
     } else {
       // Commit the existing estimate transaction
       await client.commitTransaction({
         companyCode: process.env.AVALARA_COMPANY_CODE,
         transactionCode: order.taxTransactionCode,
       });
     }
   }
   ```

## Examples

### Caching tax rates for performance

TaxJar/Avalara calls add 50-200 ms to checkout. Cache estimates by zip code and order total to reduce API calls:

```javascript
import { createHash } from 'crypto';

export async function getCachedTaxEstimate(params, calculateFn) {
  const key = `tax:${createHash('md5')
    .update(JSON.stringify({ zip: params.toAddress.zip, total: params.lineItems.reduce((s,i) => s+i.unitPrice*i.quantity,0) }))
    .digest('hex')}`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const result = await calculateFn(params);
  // Cache for 1 hour — tax rates change infrequently
  await redis.setex(key, 3600, JSON.stringify(result));
  return result;
}
```

### Tax code reference (US)

```
TPP (Tangible Personal Property): Standard taxable goods — clothing, electronics, furniture
P0000000 (Avalara): Same as TPP in AvaTax
D0000000: Digital goods — taxability varies by state
NP (Non-Profits): Exempt for qualifying organizations
SHIPPING: Shipping — taxable in some states, exempt in others
```

## Best Practices

- **Calculate tax in real time** — display the exact tax amount before the customer confirms payment; estimated tax that changes at payment causes distrust
- **Never hard-code tax rates** — tax rates change constantly; use TaxJar or Avalara to get current rates automatically
- **Commit transactions after payment, not before** — only committed transactions appear in filing reports; commit when the payment is confirmed
- **Void transactions on cancellation** — when an order is cancelled, void the committed tax transaction to avoid over-reporting
- **Store the transaction code** — save TaxJar/Avalara transaction codes on the order so you can void or refund them later
- **Handle tax calculation errors gracefully** — if the tax API is unavailable, apply a fallback rate (average US rate ~8.5%) or block checkout with a clear error message

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Tax calculated but not committed to the filing API | Always call the commit endpoint after successful payment; use the `order.confirmed` transition side effect |
| EU VAT charged on B2B cross-border sales | Validate VAT numbers via VIES before applying reverse charge; if validation fails, charge VAT as B2C |
| Tax API adds 500 ms to checkout | Cache tax estimates by destination zip code and line item total; recalculate only when the address or cart changes |
| Tax calculated on shipping when it should be exempt | Set the shipping line's tax code to `FR010000` (Avalara) or `FreightInside` (TaxJar) to let the engine determine taxability by jurisdiction |
| Inconsistent totals when tax changes between estimate and commit | Use the same parameters for estimate and commit; store the estimated tax and compare to the committed amount |

## Related Skills

- @checkout-flow-optimization
- @multi-currency
- @order-processing-pipeline
- @stripe-integration
