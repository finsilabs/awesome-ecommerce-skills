---
name: cost-allocation-analysis
description: "Allocate COGS, shipping, marketing, and overhead costs across products, channels, and orders to calculate true per-unit and per-order profitability"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cost-allocation, profitability, cogs, gross-margin, contribution-margin, overhead, unit-economics, analytics, sql]
triggers: ["cost allocation", "true profitability", "allocate costs to products", "product margin analysis", "COGS allocation", "order profitability", "overhead allocation", "cost per order", "fully-loaded cost"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Cost Allocation Analysis

## Overview

Cost allocation analysis goes beyond simple revenue minus COGS to compute the fully-loaded cost of serving each order, product, and channel. Without proper cost allocation, high-revenue products may appear profitable while actually generating negative margin once fulfillment, marketing, and allocated overhead are factored in.

This skill guides you through allocating four cost buckets — COGS, variable fulfillment costs, direct marketing spend, and shared overhead — down to the product and order level using your existing platform tools, apps, and accounting integrations.

## When to Use This Skill

- When the business needs to identify which products, SKUs, or channels are genuinely profitable after all costs
- When building a P&L view that goes below gross margin to contribution margin and net margin
- When evaluating channel economics — understanding that marketplace orders carry marketplace fees on top of COGS
- When product managers need to make pricing decisions backed by fully-loaded cost data
- When finance is building monthly management accounts and needs automated cost allocation
- When the business is scaling and shared overhead is growing faster than revenue

## Core Instructions

### Step 1: Determine your platform and get your cost data

The first step is getting accurate COGS into your platform or analytics tool. Without cost data at the product level, every margin calculation will be wrong.

---

#### Shopify

**Enter product costs in Shopify:**
1. Go to **Products → [Product Name] → Variants**
2. Scroll to the **Cost per item** field in each variant
3. Enter your landed cost (purchase price + inbound freight + duties, divided by units)
4. Shopify uses this cost in **Analytics → Profit by product** (available on all plans) and in **Inventory → Inventory valuation** reports

**View cost allocation reports in Shopify:**
- Go to **Analytics → Reports → Profit by product** — shows gross profit per product (revenue minus COGS)
- Go to **Analytics → Reports → Profit by channel** — shows gross margin by sales channel

**For more detailed cost allocation, install a profit analytics app:**
- **BeProfit** (Shopify App Store): Adds fulfillment cost tracking, ad spend integration, and per-order margin calculation
- **Lifetimely** (Shopify App Store): Connects to ad platforms and shipping carriers to compute contribution margin per order
- **TrueProfit** (Shopify App Store): Real-time profit dashboard with shipping cost tracking, ad spend allocation, and per-product P&L

**BeProfit setup for full cost allocation:**
1. Install BeProfit from the Shopify App Store
2. Go to **BeProfit → Cost Settings** and verify product costs (imported from Shopify's cost per item field)
3. Connect shipping carriers under **BeProfit → Integrations → Shipping** — BeProfit pulls actual label costs from ShipStation, Shippo, EasyPost, or AfterShip
4. Connect ad accounts under **BeProfit → Integrations → Marketing** — links Meta, Google, and TikTok spend to attributed orders
5. Go to **BeProfit → Reports → Profit per Order** — see contribution margin after COGS, shipping, and marketing for every order

---

#### WooCommerce

**Enter product costs in WooCommerce:**
- Use the **Cost of Goods** plugin (WooCommerce extension, $79/yr) to add a cost field to every product and variant
- Alternatively, use **ATUM Inventory Management** (free) which includes COGS tracking

**View cost allocation with Metorik:**
1. Install **Metorik** (connects via WooCommerce REST API)
2. Go to **Metorik → Products → Profitability** — shows gross margin per product once costs are entered in WooCommerce
3. Go to **Metorik → Orders** — filter by any dimension and see per-order gross profit

**For fulfillment cost allocation:**
- If using ShipStation or Shippo for label generation, these tools track actual shipping costs per order; export monthly reports and reconcile against WooCommerce order totals

---

#### BigCommerce

1. BigCommerce supports cost price at the product level: **Products → [Product] → Pricing → Cost price**
2. Go to **Analytics → Merchandising** — shows revenue and cost of goods by product; provides gross margin % per product
3. For advanced cost allocation, connect BigCommerce to **QuickBooks Commerce** (formerly TradeGecko) or use the **Inventory Source** app for landed cost tracking
4. **Brightpearl** (available in the BigCommerce App Store) is a full retail operations platform that handles multi-channel cost allocation including fulfillment, marketplace fees, and overhead allocation

---

### Step 2: Allocate the four cost categories

**Cost Category 1: COGS (product cost)**
- Enter landed cost at the variant level in your platform (includes purchase price + inbound freight + duties)
- Update costs whenever supplier pricing changes — use "effective date" tracking so historical orders are not affected
- Most platforms and profit apps will pull this automatically

**Cost Category 2: Fulfillment costs (shipping + pick/pack)**
- **Direct website orders:** Pull actual label costs from your shipping platform (ShipStation, EasyPost, Shippo) and match to orders by order ID
- **FBA orders:** Pull fulfillment fees from the Amazon Settlement Report (see @marketplace-fee-reconciliation for details)
- **3PL orders:** Match 3PL invoices to order volume; most 3PLs charge per-order pick/pack fees that can be allocated directly

**Cost Category 3: Marketing spend**
- Use your attribution tool (Triple Whale, BeProfit, or GA4 attribution) to allocate marketing spend to the orders each channel drove
- Simpler approach: calculate Cost Per Order by channel (channel spend / channel orders) and apply that rate to each order attributed to that channel

**Cost Category 4: Overhead (warehouse, software, headcount)**
- Calculate a monthly overhead rate: Total overhead / Total net revenue = overhead %
- Apply this rate to each order's net revenue to allocate overhead
- Example: If monthly overhead is $20,000 and monthly revenue is $200,000, overhead rate is 10% — allocate $10 overhead to a $100 order

### Step 3: Build the cost waterfall

Use this structure for your cost analysis (whether in a spreadsheet or your profit analytics app):

```
Gross Revenue (selling price × units sold)
  - Discounts & coupons applied
  - Returns & refunds
= Net Revenue

  - Product cost / COGS (landed cost per unit)
  - Inbound freight & duties (if not included in COGS)
= Gross Profit
  Gross Margin % = Gross Profit / Net Revenue × 100

  - Outbound shipping (actual label cost or carrier estimate)
  - Pick & pack fees (3PL per-order fee)
  - Payment processing fees (~2.9% + $0.30 for Stripe/Shopify Payments)
  - Marketplace fees (Amazon referral + FBA fees; eBay final value fees)
  - Packaging materials
= Fulfillment-Adjusted Gross Profit

  - Direct marketing spend (allocated via attribution model)
= Contribution Margin
  Contribution Margin % = Contribution Margin / Net Revenue × 100

  - Allocated overhead (warehouse, software, headcount × overhead rate)
= Net Operating Profit per Order
```

### Step 4: Identify negative-margin orders and products

After building the cost waterfall, run these analyses:

**Find negative-margin products:**
- In BeProfit (Shopify): Go to **Reports → Products** and sort by **Net Profit % ascending** — products at the bottom are destroying value
- In Metorik (WooCommerce): Go to **Products → Profitability** and filter for contribution margin < 0
- In Shopify Analytics: Go to **Profit by product** and sort by **Gross profit ascending**

**Common causes of negative margin at the product level:**
1. COGS entered incorrectly (not including freight/duties)
2. High return rate for that SKU (returns eat into margin)
3. Heavy discounting on that product (check average discount rate per product)
4. Shipping cost exceeds margin on low-priced, heavy items (dimensional weight problem)

**Find negative-margin channels:**
- Amazon FBA orders often look profitable on gross margin but turn negative once FBA fulfillment fees (typically $3–$8/unit), referral fees (8–15%), and advertising spend are allocated
- Compare your website contribution margin vs. Amazon contribution margin for the same SKU side by side

## Best Practices

- **Use time-effective product costs** — COGS changes over time; always record the cost as of when the order was placed, not the current cost; most profit apps handle this automatically
- **Include all components of landed cost in COGS** — purchase price alone understates COGS by 15–40% for imported goods; add inbound freight, duties, and prep costs
- **Handle marketplace fees as a cost layer, not a revenue reduction** — Amazon and eBay fees should appear as a fulfillment/selling cost in your waterfall, not netted against revenue
- **Reconcile allocated costs against actuals monthly** — the sum of all allocated shipping costs should match your actual shipping invoices; any gap indicates orders where costs were not tracked
- **Include a returns reserve in fulfillment costs** — if your return rate is 15%, reserve 15% of average return processing cost on every order at the time of sale
- **Separate fixed and variable overhead** — shipping and pick/pack are variable (per-order); warehouse rent is fixed; treating fixed costs as variable inflates per-order costs in low-volume periods

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Gross margin is positive but cash flow is negative | Overhead and fulfillment costs are not in the gross margin calculation; build the full waterfall to contribution margin before concluding a product is profitable |
| Historical margin changes when COGS is updated | Use point-in-time cost records; BeProfit and most profit analytics apps track historical cost changes automatically |
| Marketing costs not allocated to orders | Use an attribution-aware profit app (BeProfit, Lifetimely) or calculate Cost Per Order by channel and apply manually |
| Overhead allocation rate fluctuates wildly month-to-month | Use a rolling 3-month average revenue to compute the overhead rate rather than a single month |
| Negative-margin orders are hidden by channel averages | View profit at the individual order level, not just channel averages; a high-volume channel can average positive margin while hiding a tail of unprofitable orders |
| SKU margins differ between variants | Enter cost at the variant level (not just product level); a product with multiple sizes may have different per-unit costs |

## Related Skills

- @profit-margin-analysis
- @unit-economics-tracking
- @financial-analytics-dashboard
- @marketing-spend-analysis
- @attribution-modeling
- @sales-reporting-dashboard
