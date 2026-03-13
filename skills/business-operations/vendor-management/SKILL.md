---
name: vendor-management
description: "Manage supplier relationships with a portal for purchase orders, dropship routing, delivery tracking, and vendor performance scorecards"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [vendor-management, purchase-orders, supplier-portal, performance-scorecard, dropshipping, procurement]
triggers: ["vendor management", "supplier portal", "purchase orders", "vendor performance", "supplier scorecard", "procurement system"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Vendor Management

## Overview

Vendor management covers creating and sending purchase orders to suppliers, tracking goods receipts, running vendor performance scorecards (on-time rate, fill rate, defect rate), and maintaining a supplier portal where vendors can acknowledge POs and provide tracking numbers. For most merchants, QuickBooks/Xero handles POs and vendor tracking, while a supplier portal can be as simple as an email-based workflow for smaller operations.

## When to Use This Skill

- When managing 5+ suppliers and need a centralized system instead of email-based coordination
- When your merchandising team manually creates purchase orders in spreadsheets and needs automation
- When onboarding new dropship suppliers and need a structured integration flow
- When preparing quarterly business reviews with suppliers and need performance metrics
- When building a multi-vendor marketplace where each seller needs their own dashboard

## Core Instructions

### Step 1: Determine your platform and choose the right vendor management tool

| Store Stage | Recommended Tool | Why |
|-------------|-----------------|-----|
| **Small (< $1M revenue)** | QuickBooks Online or Xero + email-based POs | QuickBooks handles POs, vendor payments, and basic receipt tracking; most small merchants don't need a dedicated vendor portal |
| **Mid-market ($1M–$20M)** | DEAR Inventory (now Cin7 Core) or Unleashed | Both handle POs, goods receipts, and vendor scorecards with Shopify/WooCommerce/BigCommerce integrations |
| **Enterprise** | NetSuite or Coupa | Full procurement suite with approval workflows, supplier portals, and compliance tracking |
| **Dropshipping focus** | DSers, AutoDS, or Spocket | See @dropshipping-integration skill for supplier-specific dropshipping tools |
| **Custom** | Build a PO system + supplier portal | For unique workflows that existing tools don't support |

### Step 2: Connect your e-commerce platform to your vendor management system

#### Shopify

**Using Cin7 Core (formerly DEAR Inventory):**
1. Install the **Cin7 Core** connector from the Shopify App Store or via the Cin7 Core integration settings
2. Cin7 Core syncs Shopify products and inventory — your Shopify stock levels reflect what Cin7 shows as "on hand"
3. Create purchase orders in Cin7 Core → Purchase → Add Purchase
4. When goods are received in Cin7 (mark as Received), Shopify inventory updates automatically

**Using QuickBooks Online for POs:**
1. Connect QuickBooks to Shopify via the **QuickBooks Online** app or **A2X** connector
2. Create POs in QuickBooks Online → Expenses → Purchase Orders
3. When goods are received: in QuickBooks, go to the PO and click "Receive" to record the goods receipt
4. Manually update Shopify inventory after receiving (or use Cin7 Core which does this automatically)

#### WooCommerce

**Using ATUM Inventory Management (PO module):**
1. Install **ATUM Inventory Management** from WordPress.org (premium version for PO features)
2. Go to ATUM → Purchase Orders → Add PO
3. Select supplier, add products, set expected delivery date
4. ATUM emails the PO to the supplier automatically
5. When goods arrive: mark the PO as received in ATUM → WooCommerce inventory updates automatically

**Using Cin7 Core:**
1. Connect Cin7 Core to WooCommerce via their integration (Cin7 Core → Integrations → WooCommerce)
2. Manage all POs and vendor relationships in Cin7 Core; inventory syncs back to WooCommerce

#### BigCommerce

**Using Unleashed:**
1. Install the **Unleashed** connector from the BigCommerce App Marketplace
2. Create purchase orders in Unleashed → Purchases → New Purchase Order
3. Unleashed syncs inventory back to BigCommerce when POs are received

**Using Cin7 Core:**
1. Connect via BigCommerce API integration in Cin7 Core settings
2. Same workflow as Shopify/WooCommerce

### Step 3: Create and send purchase orders to suppliers

A good PO includes: your PO number, item descriptions with your SKU and the supplier's SKU, quantities, unit costs, expected delivery date, and delivery address.

#### In QuickBooks Online

1. Go to **Expenses → Vendors → [Vendor]** → click **New Transaction → Purchase Order**
2. Fill in: vendor, PO date, expected ship date, items with quantities and unit costs
3. Click **Save and Send** to email the PO directly to the vendor from QuickBooks
4. Track the PO status in Expenses → Purchase Orders — open POs show as "Open", received as "Closed"

#### In Cin7 Core / ATUM

1. Navigate to Purchase → New Purchase Order
2. Select the supplier; the system pre-fills the supplier's products from your supplier catalog
3. Adjust quantities based on your reorder quantities (see @demand-forecasting)
4. Set the expected delivery date: your supplier's lead time + today's date
5. Send the PO via the built-in email workflow — the PO PDF is attached to the email

#### Using a simple email template (for merchants not using a PO system yet)

```
Subject: Purchase Order PO-202603-001

Dear [Supplier Contact],

Please find our purchase order details below:

PO Number: PO-202603-001
Order Date: March 12, 2026
Expected Delivery: March 26, 2026

Items:
| SKU | Description | Qty | Unit Cost | Total |
|-----|-------------|-----|-----------|-------|
| YS-1001 | Cotton T-Shirt, White, S | 100 | $8.50 | $850.00 |
| YS-1002 | Cotton T-Shirt, White, M | 150 | $8.50 | $1,275.00 |

Total: $2,125.00
Payment Terms: Net 30

Please confirm receipt of this order and your expected ship date.

Ship to:
[Your warehouse address]
```

### Step 4: Set up a supplier portal for PO acknowledgment

For suppliers who work via email, a simple acknowledgment email workflow is sufficient. For higher-volume supplier relationships, a portal improves visibility.

**Simple email-based workflow:**
1. Send PO via email with a reply-by date (2 business days) asking the supplier to confirm: PO number, items, quantities, and expected ship date
2. When the supplier replies, update the PO status in your system to "Acknowledged"
3. If the supplier can't fulfill the full quantity, get a partial commitment in writing

**ATUM Supplier Portal (WooCommerce):**
1. ATUM Premium includes a supplier-facing portal where suppliers receive POs, acknowledge them, and enter tracking numbers
2. Go to ATUM → Suppliers → [Supplier] → configure portal access credentials

**Cin7 Core Supplier Portal:**
1. Cin7 Core includes a supplier portal where vendors can view POs, confirm delivery dates, and upload shipping documents
2. Invite suppliers in Cin7 Core → Settings → Suppliers → Invite to Portal

### Step 5: Track goods receipt and update inventory

When a shipment arrives from a supplier:

1. Match the packing list to the purchase order — check every line item's quantity
2. Identify any discrepancies:
   - **Short shipment:** supplier sent fewer units than ordered → update PO with received qty, leave PO "open" for the balance
   - **Damaged goods:** record separately; do not put damaged inventory into your sellable stock
   - **Wrong items:** contact supplier immediately with photos for credit memo

**In QuickBooks:**
- Open the PO → click "Receive Items" → enter actual received quantities
- QuickBooks creates a bill for the received quantity automatically

**In Cin7 Core / ATUM:**
- Navigate to the PO → click "Receive Stock" → enter quantities received per line
- Inventory updates automatically in Shopify/WooCommerce/BigCommerce

### Step 6: Calculate and review vendor performance scorecards

Run vendor scorecards quarterly to identify underperforming suppliers and support negotiation.

**Key metrics:**

| Metric | Definition | Target |
|--------|-----------|--------|
| On-time delivery rate | % of POs where actual receipt date ≤ expected delivery date | > 90% |
| Fill rate | Total units received / total units ordered across all POs | > 95% |
| Defect rate | Damaged/incorrect units received / total units received | < 2% |
| Lead time accuracy | Actual lead time vs. quoted lead time | ± 2 days |

**Calculate from your PO system:**

In QuickBooks, export PO data to a spreadsheet and compute these metrics. In Cin7 Core and ATUM, built-in vendor reports provide these metrics automatically.

#### Custom / Headless — vendor scorecard calculation

```typescript
async function calculateVendorScorecard(params: {
  vendorId: string;
  periodDays: number;
}): Promise<{
  onTimeRatePct: number;
  fillRatePct: number;
  defectRatePct: number;
  overallScore: number;   // 0–100
}> {
  const since = new Date(Date.now() - params.periodDays * 86400000);

  const pos = await db.purchaseOrders.findAll({
    vendor_id: params.vendorId,
    status: { in: ['received', 'partial'] },
    created_at: { gte: since },
  });

  if (pos.length === 0) return { onTimeRatePct: 0, fillRatePct: 0, defectRatePct: 0, overallScore: 0 };

  // On-time: PO received on or before expected delivery date
  const onTimeCount = pos.filter(po => po.received_at && po.received_at <= new Date(`${po.expected_delivery}T23:59:59Z`)).length;

  // Fill rate: total received / total ordered
  const allLines = await db.poLines.findByPoIds(pos.map(p => p.id));
  const totalOrdered = allLines.reduce((s, l) => s + l.quantity_ordered, 0);
  const totalReceived = allLines.reduce((s, l) => s + l.quantity_received, 0);

  // Defect rate: damaged units / total received
  const totalDamaged = await db.damagedReceipts.sumByVendorAndPeriod(params.vendorId, since);

  const onTimeRatePct = (onTimeCount / pos.length) * 100;
  const fillRatePct = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;
  const defectRatePct = totalReceived > 0 ? (totalDamaged / totalReceived) * 100 : 0;

  // Weighted score: on-time 40%, fill rate 40%, defect-free 20%
  const overallScore = Math.round(
    (onTimeRatePct * 0.4) + (fillRatePct * 0.4) + ((100 - defectRatePct) * 0.2)
  );

  return { onTimeRatePct, fillRatePct, defectRatePct, overallScore };
}
```

## Best Practices

- **Use your accounting software (QuickBooks, Xero) for POs if you're under $1M** — it integrates AP and inventory receiving in one tool; you don't need a separate vendor portal at this stage
- **Set expected delivery dates conservatively** — add the vendor's quoted lead time plus a 2-day buffer; this improves on-time metrics without changing actual performance
- **Track partial receipts carefully** — many POs arrive in multiple shipments; record the received quantity per line and keep the PO open until fully received
- **Record defects at the dock, not later** — damaged goods must be logged at receiving time with photos; retrospective claims are harder to substantiate with suppliers
- **Share scorecards with suppliers quarterly** — suppliers who see their metrics improve; use the data in pricing negotiations ("your fill rate dropped to 88% last quarter")

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| PO total doesn't match the supplier's invoice | Store unit costs at the PO line level and never update them retroactively; price discrepancies become AP exceptions flagged for review |
| Supplier ships to the wrong address | Include the warehouse address on every PO and in the portal confirmation screen; verify the ship-to address has been acknowledged |
| Inventory incremented before damaged goods are removed from the count | Only increment inventory for receipts with condition = 'good'; damaged goods go to a quarantine count, not sellable stock |
| Scorecard shows high on-time rate but stock still runs out | On-time rate measures delivery vs. expected date, not vs. actual demand need date; also track "stockout events attributed to late delivery" as a separate metric |

## Related Skills

- @dropshipping-integration
- @order-management-system
- @multi-channel-selling
- @demand-forecasting
- @accounts-payable-management
