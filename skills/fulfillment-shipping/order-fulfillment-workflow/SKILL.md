---
name: order-fulfillment-workflow
description: "Streamline your warehouse with digital pick-pack-ship workflows, barcode scanning for accuracy, and automatic packing slip generation"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [fulfillment, pick-pack-ship, warehouse, barcode-scanning, packing-slip, wms]
triggers: ["order fulfillment", "pick pack ship", "warehouse workflow", "packing slip", "barcode scanning fulfillment", "warehouse management"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Order Fulfillment Workflow

## Overview

A fulfillment workflow takes a paid order from "awaiting fulfillment" through picking, packing, and shipping — with barcode verification to prevent mis-ships and packing slip generation for each shipment. For most merchants, purpose-built apps handle this more reliably and cheaply than custom software. Custom development only makes sense for high-volume operations with unique warehouse workflows.

## When to Use This Skill

- When building internal warehouse tooling to replace manual spreadsheet-based picking processes
- When setting up a new fulfillment operation and need a structured workflow from day one
- When integrating with a third-party logistics (3PL) provider that requires a standardized order feed
- When adding pick verification to reduce mis-ships and customer complaints
- When you need to support both single-order picking and batch picking for efficiency

## Core Instructions

### Step 1: Determine your platform and choose the right fulfillment tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | ShipStation, Shopify Fulfillment Network (SFN), or Pirate Ship | ShipStation handles pick lists, packing slips, and multi-carrier label printing in one tool; SFN fully outsources fulfillment |
| **WooCommerce** | ShipStation (WooCommerce plugin), WooCommerce Shipping + Packing Slips by WooCommerce | ShipStation's WooCommerce plugin syncs orders automatically; the built-in packing slip extension handles document generation |
| **BigCommerce** | ShipStation, ShipBob, or Easyship | ShipStation and ShipBob both have native BigCommerce integrations; Easyship offers rate shopping across carriers |
| **Custom / Headless** | Build a fulfillment state machine + integrate Shippo or EasyPost for labels | Use Shippo/EasyPost for carrier-agnostic label creation; build the pick-pack-ship workflow around them |

### Step 2: Set up your fulfillment tool

#### Shopify

**Option A: ShipStation (recommended for 50+ orders/day)**

1. Install ShipStation from the Shopify App Store
2. ShipStation automatically pulls all "unfulfilled" Shopify orders
3. Set up **Automation Rules** in ShipStation (Automation → Automation Rules) to assign carriers, services, and presets based on order weight, destination, or product type
4. **Pick list:** In ShipStation, go to Orders → select multiple orders → Print → Pick List. ShipStation generates a consolidated pick list sorted by your warehouse layout
5. **Packing slips:** Select orders → Print → Packing Slip. Customize the packing slip template in Account Settings → Printing → Document Templates
6. **Label printing:** ShipStation prints labels to a thermal label printer (Zebra, DYMO) via their desktop app — one scan per order creates and prints the label
7. After printing labels, ShipStation automatically marks orders as fulfilled in Shopify and sends tracking emails to customers

**Option B: Shopify Fulfillment Network (SFN) — fully outsourced**

1. Go to **Settings → Shipping and delivery → Shopify Fulfillment Network**
2. SFN handles all pick, pack, and ship operations — you ship your inventory to their warehouse and they fulfill orders automatically
3. No warehouse management needed on your end; SFN tracks inventory and fulfills orders same-day or next-day

**Option C: Shopify's built-in fulfillment (for low volume)**

1. Go to **Orders → [Order] → Fulfill items**
2. Enter the tracking number manually or purchase a label via Shopify Shipping
3. Shopify generates basic packing slips: **Orders → Print → Packing slip**

#### WooCommerce

**Using ShipStation:**
1. Install the **ShipStation for WooCommerce** plugin (free on WordPress.org)
2. In ShipStation, go to Account Settings → Stores and connect your WooCommerce store
3. Unfulfilled WooCommerce orders sync to ShipStation automatically
4. Use ShipStation for pick lists, packing slips, and label printing (same workflow as Shopify above)
5. When a label is printed, ShipStation pushes the tracking number back to WooCommerce and marks the order as "Completed"

**WooCommerce-only (lower volume):**
1. Install **WooCommerce PDF Invoices & Packing Slips** (free, WordPress.org) for PDF packing slips
2. Go to WooCommerce → Orders, select pending orders, and from the Bulk Actions dropdown choose "Generate packing slips"
3. For pick lists: the **Smart Manager for WooCommerce** plugin or **ATUM Inventory Management** generate pick lists directly from WooCommerce

#### BigCommerce

**Using ShipStation:**
1. Connect ShipStation via the BigCommerce App Marketplace
2. ShipStation syncs all open BigCommerce orders automatically
3. Use the same ShipStation workflow for pick lists, packing slips, and label printing

**Using ShipBob (outsourced fulfillment):**
1. Connect ShipBob from the BigCommerce App Marketplace
2. Ship your inventory to ShipBob warehouses; they fulfill all orders automatically
3. ShipBob updates BigCommerce order status and tracking in real time

### Step 3: Configure pick list generation and warehouse workflow

A good pick list groups items by warehouse location (bin/shelf) to minimize picker travel time. Most shipping apps support this.

**ShipStation pick list settings:**
1. Go to Account Settings → Printing → Pick List
2. Configure grouping: by SKU (for batch picking) or by order (for single-order picking)
3. Enable "Show bin location" if you've entered bin locations on products (ShipStation → Products → edit product)
4. For barcode scanning: ShipStation has a **Scan to Verify** feature — enable it in Account Settings → Features. Scanners verify item barcodes before printing the label, preventing wrong-item fulfillment

**For 3PL integration:**
- Most 3PLs (ShipBob, Whiplash, Flexport) accept orders via EDI, SFTP CSV, or REST API
- In Shopify: install the 3PL's app or use a webhook to push orders to their system
- In WooCommerce: use a WooCommerce webhook (WooCommerce → Settings → Advanced → Webhooks) to push order data to the 3PL

### Step 4: Set up carrier label creation

#### Shopify

- **Shopify Shipping** (built-in): purchase labels directly in Shopify admin from USPS, UPS, DHL, and Canada Post at discounted rates
- **ShipStation**: connects to all major carriers; negotiates rates based on your volume — often cheaper than Shopify Shipping for high-volume operations
- **EasyShip**: available on Shopify App Store; rate shops across 250+ carriers including international options

#### WooCommerce

- **WooCommerce Shipping** (built-in, powered by WooCommerce.com): USPS and DHL Express labels directly in the WooCommerce admin
- **ShipStation plugin**: connects to all major carriers from within ShipStation
- **Easyship plugin**: multi-carrier rate shopping directly in WooCommerce checkout and admin

#### BigCommerce

- **ShipStation**: rate shops all major carriers
- **Easyship**: native BigCommerce integration with 250+ carriers

#### Custom / Headless

```typescript
import Shippo from 'shippo';
const shippo = Shippo(process.env.SHIPPO_API_KEY);

// Create a shipping label for a fulfilled order
async function createShippingLabel(params: {
  warehouseName: string;
  warehouseAddress: Address;
  customerAddress: Address;
  packageWeightOz: number;
  packageDimensions: { lengthIn: number; widthIn: number; heightIn: number };
  preferredService?: string;
}): Promise<{ trackingNumber: string; labelUrl: string }> {
  const shipment = await shippo.shipment.create({
    address_from: {
      name: params.warehouseName,
      street1: params.warehouseAddress.street1,
      city: params.warehouseAddress.city,
      state: params.warehouseAddress.state,
      zip: params.warehouseAddress.zip,
      country: 'US',
    },
    address_to: {
      name: params.customerAddress.name,
      street1: params.customerAddress.street1,
      city: params.customerAddress.city,
      state: params.customerAddress.state,
      zip: params.customerAddress.zip,
      country: params.customerAddress.country,
      email: params.customerAddress.email,
    },
    parcels: [{
      length: params.packageDimensions.lengthIn.toString(),
      width: params.packageDimensions.widthIn.toString(),
      height: params.packageDimensions.heightIn.toString(),
      distance_unit: 'in',
      weight: params.packageWeightOz.toString(),
      mass_unit: 'oz',
    }],
    async: false,
  });

  const rate = params.preferredService
    ? shipment.rates.find(r => r.servicelevel.token === params.preferredService)
    : shipment.rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0];

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

- **Use a shipping app (ShipStation or equivalent) before building custom warehouse tooling** — ShipStation costs $9–$159/month depending on volume and handles pick lists, packing slips, label printing, and carrier rate shopping; this is almost always cheaper and faster than custom development
- **Sort pick lists by bin location** — routing pickers through the warehouse in aisle/shelf order reduces picking time by 15–25%
- **Send tracking numbers immediately after label creation** — not when the carrier scans the package; customers who get tracking numbers sooner submit fewer "where is my order" tickets
- **Verify scans at pick time** — ShipStation's Scan to Verify and similar features prevent wrong-item shipments; enable this as a required step, not optional
- **Print labels in batches at end of day** — for sub-100 orders/day, batching label printing improves printer efficiency; for 100+ orders/day, print labels as orders are packed

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Order ships with wrong item | Enable barcode scan verification in ShipStation or your WMS before allowing label printing; do not allow manual override without manager approval |
| Tracking number not sent to customer | Ensure your shipping app is configured to automatically mark orders as fulfilled in your platform and trigger the platform's shipping confirmation email |
| 3PL receives wrong quantities in the order feed | Validate the webhook payload format against the 3PL's spec; test with a handful of orders before enabling for all |
| Fulfillment status drifts out of sync with carrier tracking | Use ShipStation's or EasyPost's tracking webhooks to update order status automatically when packages are scanned by the carrier |

## Related Skills

- @shipment-tracking
- @returns-management
- @order-management-system
- @international-shipping
- @dropshipping-integration
