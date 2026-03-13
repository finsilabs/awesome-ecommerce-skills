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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# International Shipping

## Overview

International shipping requires more than just choosing a carrier — you need to handle customs declarations, duties and taxes (showing customers the landed cost at checkout prevents nasty surprises), HS code classification for each product, and screening for items that are prohibited in certain countries. Getting this wrong leads to packages stuck in customs, unexpected bills delivered to customers, and damaged brand reputation.

This skill walks through setting up international shipping on each major platform, including the right apps for duties/taxes and customs form generation.

## When to Use This Skill

- When expanding from domestic to international shipping and need to handle customs declarations
- When offering Delivered Duty Paid (DDP) so customers see the full landed cost at checkout
- When building a product catalog that needs HS codes for accurate tariff classification
- When screening orders for restricted items before processing international shipments
- When integrating with a customs broker or carrier (EasyPost, Shippo, Easyship, Flexport)

## Core Instructions

### Step 1: Determine your platform and choose the right international shipping tools

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Shopify Markets + Zonos Duty & Tax or Global-e | Shopify Markets handles multi-currency and localized checkout; Zonos/Global-e add accurate DDP landed cost |
| **WooCommerce** | WooCommerce Shipping + Easyship plugin or Zonos for WooCommerce | Easyship provides multi-carrier rates including international; Zonos handles duties/taxes |
| **BigCommerce** | BigCommerce Multi-Currency + Easyship or Avalara AvaTax Cross-Border | Built-in multi-currency handles pricing; Easyship/Avalara add duties estimation |
| **Custom / Headless** | EasyPost or Shippo for labels + Zonos or Avalara for duties estimation | Use carrier aggregators for labels; use a landed-cost API for duties/taxes |

### Step 2: Assign HS codes to all products

HS (Harmonized System) codes are required on customs declarations for every international shipment. Missing codes cause customs delays.

#### Shopify

1. Go to **Products → [Product] → Shipping**
2. Under "Customs information", enter the **HS tariff code** (6–10 digits) and **Country/Region of origin**
3. For large catalogs: export your product CSV (**Products → Export**), fill in the `Variant HS Code` and `Variant Origin Country` columns in bulk, then re-import

Common HS codes for e-commerce:
- `6109.10` — Cotton T-shirts
- `6109.90` — Synthetic T-shirts
- `6404.11` — Athletic footwear
- `8471.30` — Laptops
- `9503.00` — Toys
- `3304.99` — Cosmetics

For HS code classification help, use:
- **Zonos Hello** (free tool at zonos.com/hs-code) — paste a product description and get a suggested HS code
- **Avalara TariffFinder** — free online tool for HS code lookup
- **Schedule B Search Engine** (US Census Bureau) — authoritative for US exports

#### WooCommerce

1. Go to **Products → [Product] → Shipping tab**
2. Most shipping plugins (ShipStation, Easyship) add custom HS code and country of origin fields here
3. If your plugin doesn't add these fields, install **WooCommerce Extra Product Options** or use the **Custom Fields** metabox to store `_hs_code` and `_country_of_origin` per product

#### BigCommerce

1. Go to **Products → [Product] → Shipping**
2. Enter the HS code in the "Harmonized System Code" field (visible on all plans)
3. Enter Country of Origin in the "Country of Manufacture" field

### Step 3: Configure duties and taxes (DDP vs. DDU)

**DDP (Delivered Duty Paid):** Customer pays duties at checkout — best for conversion, no surprises.
**DDU (Delivered Duty Unpaid):** Customer pays duties on delivery — creates friction and returns.

Always aim for DDP on key international markets.

#### Shopify

**Using Shopify Markets (DDP):**
1. Go to **Settings → Markets → International markets**
2. Enable each country you ship to and set the currency
3. For duties: install **Zonos Duty & Tax** or **Global-e** from the App Store
4. Zonos integrates with Shopify Markets checkout and shows the exact duty amount as a line item
5. In Zonos settings, configure which markets to show DDP (collect duties at checkout) vs. DDU

**Note:** Shopify's built-in international shipping does NOT automatically calculate duties — you need Zonos or Global-e for that.

#### WooCommerce

1. Install the **Easyship plugin** from WordPress.org or easyship.com
2. In Easyship settings, enable "Show duties and taxes at checkout"
3. Easyship calculates duties based on destination country and your HS codes
4. Customers see the duties estimate during checkout as a separate line item

**Alternative for larger operations:** Use the **Zonos Checkout for WooCommerce** plugin which guarantees the landed cost accuracy.

#### BigCommerce

1. Install **Avalara AvaTax Cross-Border** from the BigCommerce App Marketplace
2. Configure Avalara with your shipping origin address and enable cross-border tax calculation
3. Avalara displays duties estimates on checkout; upgrade to their DDP product for guaranteed landed costs

### Step 4: Set up international label creation with customs forms

Carriers require customs declarations (CN22 for items under $400; CN23/commercial invoice for higher values) on every international package.

#### Shopify

- Shopify Shipping generates customs forms automatically when you buy labels for international orders
- Go to **Orders → [Order] → Fulfill items** and Shopify shows the customs information form pre-filled from your product HS codes
- Review and adjust the declared value if needed (use sale price, not a lowered value — declaring a lower value to avoid duties is illegal)
- For high-volume operations: **ShipStation** (Shopify App Store) or **Easyship** generate customs forms in bulk and integrate with all major carriers (DHL, FedEx, UPS, USPS)

#### WooCommerce

- **WooCommerce Shipping** (powered by WooCommerce Shipping & Tax plugin) generates customs forms for USPS and DHL Express labels
- Go to **WooCommerce → Shipments → Create Label** for an order — customs fields are auto-populated from product data
- For full carrier coverage: use **ShipStation** or **Easyship** plugins which handle customs forms for all carriers

#### BigCommerce

- **ShipStation** (BigCommerce App Marketplace) handles customs forms for all carriers and has BigCommerce order sync built in
- **Easyship** (BigCommerce App Marketplace) also supports multi-carrier international labels with auto-generated customs forms

### Step 5: Block restricted and prohibited items

Some products cannot ship to certain countries (firearms parts, alcohol, certain electronics).

#### Shopify

1. Use **Shopify Markets** to set country availability per product:
   - Go to **Products → [Product] → Sales channels**
   - Disable specific markets for restricted products
2. For a comprehensive restriction list: Install **Fraud Filter** or use **Shopify Flow** (Plus) to flag orders where a restricted product is shipping to a restricted country
3. Apps like **Geoipfy** can redirect or block checkout for restricted country/product combinations

#### WooCommerce

1. Use the **WooCommerce Shipping Restrictions** plugin to block specific products from shipping to specific countries
2. Go to **Products → [Product] → Shipping tab** and set "Shipping restrictions" by country
3. For order-level blocking: use WooCommerce's built-in "Restrict to countries" in **WooCommerce → Settings → General → Selling location(s)**

#### BigCommerce

1. Go to **Products → [Product] → Shipping**
2. Set "Free Shipping" to disabled and use custom shipping rules to block certain destinations
3. For comprehensive blocking: Use the **ShipperHQ** app which supports zone-based shipping restrictions

#### Custom / Headless

```typescript
// Screen cart for restricted items before allowing checkout to proceed
async function screenForRestrictions(params: {
  orderLines: { productId: string; hsCode?: string }[];
  destinationCountry: string;
}): Promise<{ allowed: boolean; blockedItems: string[] }> {
  const blockedItems: string[] = [];

  // Common restrictions — seed these from a country-restrictions database
  const RESTRICTIONS: Record<string, string[]> = {
    AU: ['9305'],    // Firearm parts
    IN: ['2207'],    // Alcohol (requires import licence)
    CN: ['8517'],    // Consumer electronics require CCC certification
  };

  const countryRestrictions = RESTRICTIONS[params.destinationCountry] ?? [];

  for (const line of params.orderLines) {
    if (!line.hsCode) continue;
    const hsPrefixBlocked = countryRestrictions.some(prefix => line.hsCode!.startsWith(prefix));
    if (hsPrefixBlocked) {
      blockedItems.push(line.productId);
    }
  }

  return { allowed: blockedItems.length === 0, blockedItems };
}
```

## Best Practices

- **Assign HS codes to every product before enabling international shipping** — missing HS codes are the single most common cause of customs delays; use the Zonos or Avalara classification tools for bulk assignment
- **Always include a phone number in the ship-to address** — most international carriers require a recipient phone number; make it required for all non-domestic shipping addresses
- **Offer DDP for your top 5 international markets** — customers who see the full landed cost at checkout convert at significantly higher rates than those who receive a duty bill on delivery
- **Respect de minimis thresholds** — orders below the de minimis value (US: $800, UK: £135, EU: €150, AU: AUD $1,000) are often duty-free; most DDP apps handle this automatically
- **Keep customs descriptions generic but accurate** — "Cotton T-shirt" is better than a brand name for faster clearance; avoid anything that sounds like it requires special permits
- **Test with real international orders before scaling** — send a test order to each new country and track it through customs before launching a marketing campaign there

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customs form not generated for international order | Ensure your shipping app has HS codes and country of origin on all product records; missing fields are the most common cause |
| Duties estimated at checkout differ from actual duties assessed | Use a DDP provider (Zonos, Global-e) for guaranteed accuracy; label estimates as "estimated" when using DDU |
| Prohibited item detected after label is created and package is in transit | Screen for restrictions at checkout, not at fulfillment; block checkout for restricted country/product combinations |
| Package returned for "customs information required" | All international shipments need customs forms — even low-value ones; configure your shipping app to always include customs data for non-domestic destinations |

## Related Skills

- @order-fulfillment-workflow
- @shipment-tracking
- @shipping-rate-calculator
- @same-day-delivery
- @order-management-system
