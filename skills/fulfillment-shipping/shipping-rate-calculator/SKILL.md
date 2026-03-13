---
name: shipping-rate-calculator
description: "Show real-time shipping rates from UPS, FedEx, USPS, and DHL at checkout by integrating directly with each carrier's rate API"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [shipping, rates, carriers, ups, fedex, usps, dhl, fulfillment]
triggers: ["calculate shipping rates", "integrate carrier APIs", "add shipping options", "real-time shipping quotes"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Shipping Rate Calculator

## Overview

Showing real-time shipping rates at checkout — from UPS, FedEx, USPS, DHL — lets customers choose their preferred service and prevents you from under- or overcharging for shipping. Every major platform supports carrier-calculated rates natively or through apps, and a multi-carrier rate shopping tool can save you 15–40% on shipping costs by automatically selecting the cheapest option.

## When to Use This Skill

- When adding real-time carrier rate quotes to checkout
- When building a multi-carrier shipping rate comparison feature
- When implementing free shipping thresholds or tiered flat-rate shipping
- When you need to calculate dimensional weight for accurate carrier pricing
- When setting up shipping zones and rate tables for international shipping

## Core Instructions

### Step 1: Determine your platform and choose the right shipping rate tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Shopify Shipping (built-in) or Easyship / ShipStation for rate shopping | Shopify Shipping gives discounted USPS, UPS, DHL rates; Easyship adds 250+ carrier options and rate shopping |
| **WooCommerce** | WooCommerce Shipping (USPS/DHL) + Table Rate Shipping for custom rules | WooCommerce Shipping handles basic carrier rates; Table Rate Shipping adds weight/zone-based rule tables |
| **BigCommerce** | ShipperHQ or Easyship | ShipperHQ is the most powerful rate management tool for BigCommerce with dimensional rate calculation |
| **Custom / Headless** | EasyPost or Shippo as a carrier meta-API | Both aggregate UPS, FedEx, USPS, DHL into a single API call — far simpler than integrating each carrier directly |

### Step 2: Set up carrier-calculated rates

#### Shopify

**Shopify Shipping (built-in, free, recommended starting point):**

1. Go to **Settings → Shipping and delivery → Manage rates**
2. Under your domestic zone, click **Add rate**
3. Select **Use carrier or app to calculate rates**
4. Choose from: USPS, UPS, DHL Express
5. Check the services you want to offer (e.g., USPS Priority Mail, USPS Ground Advantage, UPS Ground, UPS 2nd Day Air)
6. Optionally add a markup or discount percentage on top of carrier rates (useful to offset packing material costs)
7. Save — rates will now appear dynamically at checkout based on the order's actual weight and destination

**For more carrier options (FedEx, regional carriers, international):**
1. Install **Easyship** or **ShipStation** from the Shopify App Store
2. Both integrate as Shopify "carrier-calculated shipping" providers and appear natively at checkout
3. Easyship's free tier shows live rates from 50+ carriers at checkout
4. **Note:** Carrier-calculated rates at checkout require Shopify's **Advanced plan** ($299/mo) or higher, OR purchasing the carrier-calculated shipping add-on ($20/month on lower plans)

**For flat-rate and free-shipping rules:**
- In Shopify Shipping, you can create flat-rate options ($5.99 standard shipping, $14.99 express) in addition to or instead of carrier-calculated rates
- Combine with a free shipping threshold: add a free shipping rate with a minimum order condition (see @free-shipping-thresholds skill)

#### WooCommerce

**WooCommerce Shipping (USPS + DHL, free):**
1. Install the **WooCommerce Shipping** plugin (free, by WooCommerce)
2. Go to **WooCommerce → Settings → Shipping → Add shipping zone** for each region
3. Under each zone, click **Add shipping method** → select USPS or DHL Express
4. Configure which services to display at checkout (Priority Mail, Ground Advantage, etc.)
5. Add your package dimensions and weights to products for accurate rate calculation

**WooCommerce Table Rate Shipping (for complex rules, e.g., weight tiers, custom zones):**
1. Purchase the **WooCommerce Table Rate Shipping** extension from WooCommerce.com
2. Create rate tables: e.g., 0–1lb = $4.99, 1–5lb = $7.99, 5–20lb = $12.99
3. Create separate tables for domestic vs. international zones

**ShipStation for WooCommerce (multi-carrier rate shopping):**
1. Install the **ShipStation for WooCommerce** plugin
2. ShipStation can be configured to use your negotiated carrier rates and display them at checkout via WooCommerce's shipping method API
3. Note: ShipStation shows rates in your ShipStation dashboard, not always directly at customer checkout — check ShipStation documentation for the specific WooCommerce checkout rate display feature

#### BigCommerce

**ShipperHQ (most powerful option for BigCommerce):**
1. Install **ShipperHQ** from the BigCommerce App Marketplace
2. Connect your UPS, FedEx, USPS, DHL accounts to ShipperHQ (or use ShipperHQ's built-in carrier accounts)
3. ShipperHQ handles dimensional weight calculations automatically based on your product dimensions
4. Configure rate shopping rules: "Show cheapest option", "Show all options", or "Show cheapest per delivery speed tier"
5. Set markup rules: +$2 per shipment for handling, or -15% discount on all FedEx rates

**BigCommerce built-in real-time rates:**
1. Go to **Store Setup → Shipping → Add a shipping zone**
2. Under the zone, add a real-time carrier method (UPS, FedEx, USPS via Endicia)
3. Enter your carrier account credentials
4. BigCommerce will display live carrier rates at checkout

#### Custom / Headless

Use EasyPost or Shippo as a meta-API to get rates from all carriers in one call — far simpler than integrating UPS, FedEx, USPS, and DHL separately:

```typescript
import EasyPost from '@easypost/api';
const easypost = new EasyPost(process.env.EASYPOST_API_KEY);

// Get multi-carrier rates for a shipment
async function getShippingRates(params: {
  originZip: string;
  destinationZip: string;
  destinationCountry: string;
  weightOz: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
}): Promise<{ carrier: string; service: string; rateCents: number; estimatedDays: number }[]> {
  const shipment = await easypost.Shipment.create({
    from_address: {
      zip: params.originZip,
      country: 'US',
    },
    to_address: {
      zip: params.destinationZip,
      country: params.destinationCountry,
    },
    parcel: {
      length: params.lengthIn,
      width: params.widthIn,
      height: params.heightIn,
      weight: params.weightOz, // EasyPost uses oz
    },
  });

  return shipment.rates.map(rate => ({
    carrier: rate.carrier,
    service: `${rate.carrier} ${rate.service}`,
    rateCents: Math.round(parseFloat(rate.rate) * 100),
    estimatedDays: rate.est_delivery_days ?? 5,
  })).sort((a, b) => a.rateCents - b.rateCents);
}

// Apply store-level rules on top of carrier rates
function applyShippingRules(params: {
  carrierRates: { carrier: string; service: string; rateCents: number; estimatedDays: number }[];
  cartSubtotalCents: number;
  freeShippingThresholdCents: number;
}): { label: string; rateCents: number; estimatedDays: number }[] {
  const rates = [...params.carrierRates];

  // Add free shipping option if eligible
  if (params.cartSubtotalCents >= params.freeShippingThresholdCents) {
    rates.unshift({ carrier: 'store', service: 'Free Shipping', rateCents: 0, estimatedDays: 7 });
  }

  // Show max 3 options to avoid choice paralysis:
  // 1. Free (if available)
  // 2. Cheapest paid option
  // 3. Fastest guaranteed option
  const freeOption = rates.find(r => r.rateCents === 0);
  const cheapestPaid = rates.filter(r => r.rateCents > 0).sort((a, b) => a.rateCents - b.rateCents)[0];
  const fastest = rates.filter(r => r.estimatedDays <= 2).sort((a, b) => a.estimatedDays - b.estimatedDays)[0];

  return [freeOption, cheapestPaid, fastest]
    .filter(Boolean)
    .filter((r, i, arr) => arr.findIndex(x => x?.service === r?.service) === i) // deduplicate
    .map(r => ({ label: r!.service, rateCents: r!.rateCents, estimatedDays: r!.estimatedDays }));
}
```

### Step 3: Configure dimensional weight calculation

Carriers charge based on the greater of actual weight vs. dimensional weight. Always configure this.

**Shopify:**
- Enter package dimensions on each product variant (Products → [Product] → Shipping section)
- Shopify automatically calculates dimensional weight when computing carrier rates

**WooCommerce:**
- Enter dimensions in the WooCommerce product Shipping tab (length, width, height in inches/cm)
- The WooCommerce Shipping plugin uses these dimensions for DHL and USPS dimensional rates

**ShipperHQ:**
- ShipperHQ has advanced dimensional weight packing simulation — it determines how multiple items pack into your actual box sizes and calculates the rate based on the packed box, not just the sum of item weights

**Manual check for dimensional weight:**
- DIM factor (US domestic): 139 cubic inches per pound
- Formula: (L × W × H) / 139 = DIM weight in lbs
- If DIM weight > actual weight, carrier charges DIM weight

### Step 4: Display the right number of options at checkout

Too many shipping options cause checkout abandonment. Best practice:

1. **Cheapest option** — always show this (often "Ground" or "Standard")
2. **Free shipping** — if the cart qualifies, show it prominently at the top
3. **Fastest option** — 1-day or 2-day air for customers who need speed

Remove everything in between (3-day, 5-day, etc.) — customers don't need 6 options.

In ShipperHQ: use "Rate Filters" to show only specific service levels. In Easyship: configure "Checkout Rules" to limit displayed options.

## Best Practices

- **Always set carrier API timeouts** — carrier rate APIs can take 2–5 seconds; show cached or flat-rate fallbacks if they don't respond in time
- **Validate addresses before requesting rates** — invalid addresses cause rate errors and checkout failures; most carriers offer address validation APIs (Shippo has one built in)
- **Round up package weights** — carriers round up to the next whole pound/kg; do the same in your rate calculation to avoid showing a lower rate than the customer will actually be charged
- **Offer free shipping as a separate option, not by discounting a carrier rate** — present it as "Free Shipping (5–7 days)" rather than modifying a carrier's listed rate
- **Recalculate rates when the cart changes** — re-fetch rates when items are added, quantities change, or the shipping address is updated

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Carrier API returns no rates for a valid address | Check if the address is a PO Box (UPS/FedEx don't deliver to PO Boxes); fall back to USPS for PO Boxes |
| Checkout shows lower shipping cost than order total charged | Recalculate the final shipping rate in your order confirmation logic, not just at cart; rates can change between cart and checkout |
| Large light items get expensive rates | Enable dimensional weight calculation; most carriers use DIM weight for large boxes — ShipperHQ handles this automatically |
| Rate requests make checkout slow (3+ seconds) | Use a carrier aggregator (EasyPost/Shippo) instead of individual carrier APIs; aggregate has better response times |

## Related Skills

- @free-shipping-thresholds
- @international-shipping
- @order-fulfillment-workflow
- @checkout-flow-optimization
- @dropshipping-integration
