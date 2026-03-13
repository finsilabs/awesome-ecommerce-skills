---
name: cogs-tracking-allocation
description: "Track cost of goods sold and landed costs using your platform's built-in tools or accounting integrations to compute accurate gross margin per order"
category: catalog-inventory
risk: critical
source: curated
date_added: "2026-03-12"
tags: [cogs, inventory-valuation, cost-accounting]
triggers: ["track cost of goods", "inventory costing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# COGS Tracking and Allocation

## Overview

Tracking Cost of Goods Sold (COGS) tells you the actual gross margin on every order — revenue minus what you paid for the products you sold. Most platforms let you enter a cost price per product, and accounting integrations (QuickBooks, Xero) use that to generate COGS entries automatically. Landed cost allocation (freight, customs, duties) requires either a dedicated app or manual allocation in your accounting software. Only build a custom COGS system if your platform cannot meet your costing method requirements (FIFO, weighted average).

## When to Use This Skill

- When your income statement shows revenue but you cannot compute gross margin because unit costs are not tracked
- When importing goods internationally and needing to allocate freight, customs, and duties into the landed cost of each SKU
- When switching from periodic (year-end count) to perpetual (real-time) cost tracking
- When building variance analysis reports to identify SKUs where actual purchase costs are drifting from standard costs
- When an ERP integration (QuickBooks, NetSuite, Xero) requires COGS journal entries at time of sale

## Core Instructions

### Step 1: Determine platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Enter cost per variant in Admin; use Shopify Analytics or connect QuickBooks/Xero for COGS reporting | Shopify stores cost price per variant; profit reports use this for margin calculation |
| **WooCommerce** | Enter purchase price per product; connect WooCommerce Bookings + accounting plugin or Metorik for margin reports | WooCommerce stores cost price natively; Metorik provides profit analytics |
| **BigCommerce** | Purchase cost field per product; connect to QuickBooks via built-in integration | BigCommerce has a cost price field; the QuickBooks integration auto-posts COGS |
| **Custom / Headless** | Build a cost ledger with FIFO/weighted-avg logic and accounting journal entries | Required when none of the above integrations meet your costing method or reporting needs |

---

### Step 2: Enter cost prices per product

Before any COGS reporting is possible, every product variant needs a cost price.

#### Shopify

1. Go to **Admin → Products → [Product] → [Variant]**
2. Under **Pricing**, enter the **Cost per item** field
3. Shopify's **Analytics → Finances → Product sales by variant** report will then show profit per product

For bulk cost updates: use **Matrixify** (App Store) to import a CSV with cost per SKU — the column is `Variant Cost`.

#### WooCommerce

1. Go to **WooCommerce → Products → [Product] → Inventory tab**
2. Enter the value in the **Purchase cost** field (requires WooCommerce Cost of Goods plugin or the field added by your theme/plugin)
3. For reporting: install **Metorik** or connect **QuickBooks for WooCommerce** — both read the cost field and generate gross margin reports

Popular COGS plugins for WooCommerce:
- **WooCommerce Cost of Goods** (SkyVerge) — adds cost field, generates margin reports
- **Metorik** — analytics dashboard showing profit per product, order, and channel

#### BigCommerce

1. Go to **Products → [Product] → Pricing**
2. Enter the value in the **Cost Price** field
3. Connect **QuickBooks Online** via **Apps → BigCommerce for QuickBooks** — it maps cost price to COGS entries automatically

---

### Step 3: Connect accounting software for COGS journal entries

The cost price field alone only enables reporting inside the platform. For your P&L and balance sheet, connect an accounting integration that posts COGS when orders are fulfilled.

#### Shopify → QuickBooks / Xero

- **QuickBooks Online**: Install **QuickBooks Connector by OneSaas** from the Shopify App Store. Configure: Sales → Fulfilled orders post to COGS account; map products to QuickBooks items
- **Xero**: Install **Xero by Amaka** or **A2X** from the Shopify App Store. A2X is the most widely used — it batches daily Shopify sales into summarized Xero journal entries including COGS

> A2X is strongly recommended for Shopify + Xero — it handles currency conversion, refunds, fees, and COGS automatically.

#### WooCommerce → QuickBooks / Xero

- **QuickBooks**: Install **QuickBooks Commerce** or **MyWorks Sync** (most reliable WooCommerce ↔ QuickBooks sync)
- **Xero**: Install **Xero for WooCommerce by Zapier** or **Xero Bridge by Parex** for direct sync

#### BigCommerce → QuickBooks

- Use the built-in **BigCommerce for QuickBooks** app from the Apps marketplace
- Configure COGS mapping under **Settings → Accounting → Cost of Goods Sold account**

---

### Step 4: Set up landed cost allocation

Landed costs (freight, insurance, customs, duties) must be added to the product cost before the first sale to get accurate COGS.

**For most merchants (manual method):**
1. Receive your shipment and get the freight/customs invoice
2. Calculate the landed cost per unit: Total landed cost ÷ Total units received
3. Update the cost price in your platform to include the landed cost component
4. For allocation by value: `(Product value / Total shipment value) × Total landed cost ÷ Units received`

**For Shopify merchants with frequent imports:**
- Install **Shopify Shipping Costs** or **LandedCost.app** from the App Store
- These apps let you enter a shipment's landed costs and allocate them across received SKUs automatically

**For accounting software users:**
- In QuickBooks or Xero, use a **landed cost allocation** journal entry to add freight/duties to inventory asset value before goods are sold

---

### Step 5: Run COGS and margin reports

Once cost prices are entered and accounting is connected:

#### Shopify
- **Analytics → Finances → Profit by product** — shows revenue, cost, and margin per variant
- **Analytics → Reports → Product sales** — filter by date range, includes units sold and profit

#### WooCommerce + Metorik
- **Metorik → Reports → Profitability** — gross margin by product, order, and time period
- Metorik also shows cost per order and margin %

#### QuickBooks / Xero
- **P&L report** — COGS line shows total cost of goods sold for the period
- **Inventory valuation summary** — current on-hand value per SKU

---

#### Custom / Headless

For headless storefronts needing perpetual inventory costing with FIFO, build a cost ledger:

```typescript
// Cost layer model — one row per purchase order receipt
interface InventoryCostLayer {
  variantId: string;
  receiptDate: Date;
  quantityReceived: number;
  quantityRemaining: number;  // Decrements as units are sold
  unitCostCents: number;      // Purchase price per unit
  landedCostCents: number;    // Allocated freight/duties per unit
}

// FIFO cost assignment when an order is fulfilled
async function assignCogsFifo(variantId: string, locationId: string, quantity: number, orderId: string) {
  let remaining = quantity;
  let totalCostCents = 0;

  return db.transaction(async tx => {
    // Consume oldest cost layers first (FIFO)
    const layers = await tx.inventoryCostLayers.findAll({
      where: { variantId, locationId, quantityRemaining: { gt: 0 } },
      orderBy: { receiptDate: 'asc' },
    });

    for (const layer of layers) {
      if (remaining <= 0) break;
      const units = Math.min(remaining, layer.quantityRemaining);
      const totalUnitCost = layer.unitCostCents + layer.landedCostCents;

      await tx.inventoryCostLayers.update(layer.id, {
        quantityRemaining: layer.quantityRemaining - units,
      });
      await tx.cogsEntries.create({
        orderId, variantId, quantity: units,
        unitCostCents: totalUnitCost,
        costingMethod: 'fifo',
      });

      totalCostCents += units * totalUnitCost;
      remaining -= units;
    }

    if (remaining > 0) throw new Error(`Insufficient cost layers for ${variantId}`);
    return { totalCostCents };
  });
}

// Allocate landed costs to a received shipment (by value)
async function allocateLandedCostsByValue(shipmentId: string, totalLandedCostCents: number) {
  const layers = await db.inventoryCostLayers.findByShipment(shipmentId);
  const totalValue = layers.reduce((s, l) => s + l.unitCostCents * l.quantityReceived, 0);

  for (const layer of layers) {
    const share = (layer.unitCostCents * layer.quantityReceived) / totalValue;
    const perUnitLanded = Math.round((share * totalLandedCostCents) / layer.quantityReceived);
    await db.inventoryCostLayers.update(layer.id, { landedCostCents: perUnitLanded });
  }
}
```

## Best Practices

- **Enter cost prices before your first import or purchase order receipt** — COGS is only accurate for orders after costs are set; retroactive fixes require manual adjustments
- **Include landed costs in unit cost before the first sale** — freight and duties paid after goods are received but before sale must be allocated; otherwise COGS understates the true cost
- **Choose one costing method (FIFO vs. weighted average) per product category and stick to it** — switching mid-year requires a revaluation journal entry
- **Reconcile platform profit reports with your accounting software monthly** — discrepancies usually mean cost prices are missing for some variants
- **Set a standard cost at the start of each fiscal year** for variance reporting — compare actual purchase prices to standard to catch cost drift early

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Gross margin reports show 100% for some products | Cost price is missing for those variants; Shopify and WooCommerce silently treat missing cost as $0 |
| COGS in QuickBooks doesn't match the platform's profit report | The accounting integration may be using a different COGS account or ignoring refunds; check the integration mapping settings |
| Landed costs not reflected in COGS | Landed costs must be entered before the first sale; entering them after requires adjusting the cost layer manually in your accounting software |
| Cost price includes VAT but shouldn't | Enter the ex-VAT cost price; tax is a separate line in your P&L, not part of COGS |
| Weighted average cost goes stale | Recalculate weighted average dynamically from current inventory layers — never cache it as a static field |

## Related Skills

- @inventory-tracking
- @multi-warehouse
- @catalog-import-export
