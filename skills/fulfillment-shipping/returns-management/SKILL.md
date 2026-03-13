---
name: returns-management
description: "Process returns end to end — generate prepaid labels, apply refund or exchange logic, update inventory, and notify customers automatically"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [returns, rma, refunds, exchanges, return-labels, restocking, reverse-logistics]
triggers: ["returns management", "RMA", "return merchandise authorization", "return label", "refund processing", "exchange workflow"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Returns Management

## Overview

A returns management system lets customers initiate returns self-service, generates prepaid shipping labels, processes refunds or exchanges when the item is received, and handles restocking decisions. A well-run returns process builds customer trust and can become a competitive advantage. Most platforms have solid native returns workflows or purpose-built apps that handle this without custom development.

## When to Use This Skill

- When launching a self-service returns portal to reduce customer service workload
- When you need a structured RMA process with tracking numbers to prevent refund fraud
- When building logic that differentiates between "refund to original payment", "store credit", and "exchange" resolutions
- When integrating return label generation with carrier APIs (UPS, FedEx, USPS)
- When managing restocking — deciding whether returned items go back to sellable inventory or to a quarantine bin

## Core Instructions

### Step 1: Determine your platform and choose the right returns tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Loop Returns, Returnly, or AfterShip Returns | Loop Returns is the most popular; handles self-service portal, labels, exchanges, and store credit automatically |
| **WooCommerce** | WooCommerce Returns and Warranty Requests plugin or ReturnGo | WooCommerce's official extension handles RMA workflows; ReturnGo adds a branded self-service portal |
| **BigCommerce** | AfterShip Returns Center, Loop Returns, or ReturnGo | All three have native BigCommerce integrations with self-service portals |
| **Custom / Headless** | Build an RMA system + Shippo/EasyPost for return labels | Use Shippo's return label API; build the approval and restocking workflow on top |

### Step 2: Set up the returns portal

#### Shopify

**Option A: Loop Returns (most popular, starts free)**

1. Install Loop Returns from the Shopify App Store
2. In Loop settings, configure your return window (e.g., 30 days from delivery), eligible resolutions (refund, exchange, store credit), and which products are returnable
3. Loop creates a branded returns portal at `yourstore.com/returns` — customers enter their order number and email to initiate
4. Configure return reasons (wrong size, changed mind, defective, etc.) in Loop → Policy → Return Reasons
5. Loop generates prepaid USPS, UPS, or FedEx return labels automatically based on your carrier settings
6. Enable **Instant Exchange** (Loop feature) so customers can place an exchange order immediately without waiting for the return to arrive
7. When a return is received and inspected, Loop can automatically process the refund and sync the inventory update back to Shopify

**Option B: Shopify's built-in returns (good for simple workflows)**

1. On an individual order: go to **Orders → [Order] → Return**
2. Select which items to return, the return reason, and whether to restock inventory
3. Generate a prepaid return label via Shopify Shipping and email it to the customer
4. When the package arrives: go back to the order → mark as received → issue refund
5. Limitation: Shopify's native returns do not have a self-service customer portal — customers must contact you to initiate

#### WooCommerce

**Using WooCommerce Returns and Warranty Requests (official extension):**

1. Install the plugin from WooCommerce.com (paid extension)
2. Go to **WooCommerce → Returns** to configure: return window, eligible order statuses, allowed reasons, and notification emails
3. Customers see a "Request a Return" button on their order detail page in My Account
4. Each return request creates an RMA record visible in WooCommerce → Returns
5. To issue a return label: integrate with **ShipStation** which has a "Create Return Label" button from the order view, or use **Pirate Ship** manually for low-volume
6. When the package arrives: go to the RMA in WooCommerce → Returns → mark as received → issue refund from the original order

**Using ReturnGo (branded portal, free plan available):**

1. Install ReturnGo from WordPress.org or their website
2. ReturnGo creates a branded self-service portal and handles email notifications automatically
3. Configure resolution options (refund, store credit, exchange) and carrier integrations in ReturnGo settings

#### BigCommerce

**Using AfterShip Returns Center:**

1. Install AfterShip Returns Center from the BigCommerce App Marketplace
2. Set up your returns portal URL (branded with your store name)
3. Configure return policy rules: return window, eligible products, required reasons
4. AfterShip generates prepaid return labels (USPS, UPS, FedEx) when you approve a return request
5. Returns syncs status back to BigCommerce orders automatically

**Using Loop Returns:**
1. Install from BigCommerce App Marketplace
2. Same configuration as the Shopify workflow above

### Step 3: Configure refund and exchange resolution logic

Regardless of platform, define your resolution options clearly before going live:

1. **Refund to original payment method** — most straightforward; Stripe/PayPal refunds process in 5–10 business days
2. **Store credit** — faster for customers, better for your cash flow; Loop and AfterShip support automatic store credit issuance
3. **Exchange** — requires checking stock availability for the replacement item; Loop's Instant Exchange feature handles this automatically

**Key settings to configure:**

- **Return window:** Start the clock from delivery date, not order date (this matters — check your app's setting)
- **Restocking:** Decide whether returned items automatically go back to inventory or require manual inspection first. For used goods or high-value items, enable manual inspection before restocking
- **Restocking fee:** Configure this per product category if applicable (e.g., 15% for opened electronics)
- **Final sale items:** Tag final-sale products in your platform and configure the returns app to block returns on those tags

### Step 4: Set up return label generation

Most returns apps generate labels automatically. For manual label creation:

#### Shopify

- Shopify Shipping → Create Return Label: goes directly to the carrier and creates a "return" label type (charged when the customer drops off, not when you create it)
- Available carriers: USPS, UPS, DHL (varies by region)

#### WooCommerce

- **ShipStation**: the most reliable option for return labels via WooCommerce; go to an order in ShipStation → Create Return Shipment
- **Pirate Ship**: manual process but the cheapest USPS rates; create a return label at pirateship.com and email it to the customer

#### Custom / Headless

```typescript
import Shippo from 'shippo';
const shippo = Shippo(process.env.SHIPPO_API_KEY);

// Create a prepaid return label (customer sends back to warehouse)
async function createReturnLabel(params: {
  customerName: string;
  customerAddress: Address;
  warehouseName: string;
  warehouseAddress: Address;
  estimatedWeightLbs: number;
}): Promise<{ trackingNumber: string; labelUrl: string }> {
  const shipment = await shippo.shipment.create({
    address_from: {
      name: params.customerName,
      street1: params.customerAddress.street1,
      city: params.customerAddress.city,
      state: params.customerAddress.state,
      zip: params.customerAddress.zip,
      country: 'US',
    },
    address_to: {
      name: params.warehouseName,
      street1: params.warehouseAddress.street1,
      city: params.warehouseAddress.city,
      state: params.warehouseAddress.state,
      zip: params.warehouseAddress.zip,
      country: 'US',
    },
    parcels: [{
      weight: (params.estimatedWeightLbs * 16).toString(), // oz
      mass_unit: 'oz',
      length: '12', width: '10', height: '4',
      distance_unit: 'in',
    }],
    async: false,
    is_return: true, // marks this as a return label
  });

  const rate = shipment.rates.find(r => r.servicelevel.token === 'usps_priority')
    ?? shipment.rates[0];
  const transaction = await shippo.transaction.create({
    rate: rate.object_id,
    label_file_type: 'PDF',
  });

  return {
    trackingNumber: transaction.tracking_number,
    labelUrl: transaction.label_url,
  };
}
```

## Best Practices

- **Require label from your system, not the customer's** — prepaid labels let you control carrier choice, negotiate rates, and track packages; customer-supplied labels make tracking impossible
- **Segregate received returns before restocking** — create a physical "returned goods" bin and a logical "quarantine" status; never auto-restock without at least a visual inspection
- **Issue refunds after receiving the package** — only pre-authorize refunds if you offer "instant refund" as a deliberate premium feature
- **Notify customers at every status change** — send emails at "label created", "package received", and "refund/exchange processed" stages; lack of communication drives "where is my refund" contacts
- **Start the return window from delivery date, not order date** — this is more fair to customers and reduces disputes; most returns apps support this setting
- **Track return reasons** — aggregate return reasons monthly and share with buying/product teams; high return rates on specific SKUs indicate a product quality or description problem

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Refund processed before return physically arrives | Configure your returns app to trigger refunds on "package received" status, not on "return requested"; check Loop/AfterShip workflow settings |
| Restocking creates inaccurate inventory counts | Use a quarantine step before restocking; only increment inventory after inspection confirms the item is resalable |
| Customer initiates return after window expires | Set your platform return window clearly and ensure the returns app checks order delivery date — some apps default to order date which gives customers less time |
| Return label goes unused but was purchased | Use "pay-on-scan" label types where available (USPS allows this via Shippo) — you're only charged when the customer drops off the package |

## Related Skills

- @order-fulfillment-workflow
- @shipment-tracking
- @returns-refund-policy
- @stripe-integration
- @gift-cards
