---
name: marketplace-fee-reconciliation
description: "Reconcile and analyze seller fees from Amazon, eBay, Walmart, and Etsy with net revenue calculation, fee categorization, and optimization recommendations"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [marketplace-fees, reconciliation, amazon-fees]
triggers: ["reconcile marketplace fees", "Amazon seller fees", "eBay fees", "marketplace fee analysis", "net marketplace revenue", "settlement reconciliation", "FBA fee analysis"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Marketplace Fee Reconciliation

## Overview

Selling on marketplaces like Amazon, eBay, Walmart, and Etsy introduces a complex layer of fees that significantly impact net profitability. Amazon alone has over a dozen distinct fee types: referral fees, FBA fulfillment fees, storage fees, advertising fees, return processing fees, and more. These fees are deducted before disbursement, making it easy to lose track of how much of your gross revenue actually reaches your bank account.

Fee reconciliation is the practice of matching marketplace settlement data against your expected fee schedule, verifying that you have been charged correctly, and computing true net revenue by SKU and category.

This skill guides you through downloading settlement reports from each major marketplace, reconciling fees against expectations, and using dedicated tools to automate this process.

## When to Use This Skill

- When selling on Amazon, eBay, Walmart, or Etsy and needing to understand true net revenue
- When suspecting FBA fulfillment fee overcharges due to incorrect product dimensions
- When reconciling marketplace payouts against your GL on a monthly basis
- When computing true contribution margin per SKU by channel including marketplace fees
- When evaluating whether to move products from FBA to FBM (fulfilled by merchant)
- When building a multi-channel profitability model with normalized fee data

## Core Instructions

### Step 1: Download settlement reports from each marketplace

**Amazon (Seller Central):**
1. Go to **Seller Central → Reports → Payments → Transaction View**
2. Click **Download flat file (.txt)** for each settlement period (bi-weekly)
3. Alternatively, access via the **SP-API** (Selling Partner API): use the `/finances/v0/financialEventGroups` endpoint for automated downloads
4. Key settlement fields: transaction type, fee type, amount, order ID, SKU

**eBay:**
1. Go to **eBay Seller Hub → Payments → Payments report**
2. Download as CSV (monthly or custom date range)
3. eBay Payments API is available for programmatic access

**Walmart Marketplace:**
1. Go to **Walmart Seller Center → Payments → Transaction Report**
2. Download monthly CSV
3. Walmart's Seller API provides programmatic access via the `/payments/filepayments` endpoint

**Etsy:**
1. Go to **Etsy Shop Manager → Finances → Payment account**
2. Download monthly statement CSV
3. Note: Etsy fees include listing fees, transaction fees (6.5%), payment processing fees, and offsite ads fees (if enrolled)

### Step 2: Use a dedicated reconciliation tool (recommended)

Before building custom tooling, check if an existing tool handles your marketplace:

| Tool | Marketplaces Supported | Key Feature |
|------|----------------------|-------------|
| **A2X** | Amazon, Shopify, eBay, Etsy, Walmart | Reconciles marketplace settlements to QuickBooks/Xero with GAAP journal entries; fee categorization built-in |
| **Link My Books** | Amazon, eBay, Etsy, Shopify | Automatically maps settlement data to accounting chart of accounts; fee overcharge alerts |
| **Getida** | Amazon FBA | Specializes in Amazon reimbursement auditing; works on contingency (takes % of recovered fees) |
| **Seller Ledger** | Amazon, eBay, Etsy, Walmart | Bookkeeping designed for marketplace sellers; fee reconciliation + tax tracking |
| **InventoryLab** | Amazon FBA | COGS tracking, fee analysis, and profit calculation per ASIN |

**A2X setup (most comprehensive):**
1. Connect A2X to your marketplace accounts (Amazon Seller Central, eBay, Etsy)
2. Connect A2X to QuickBooks Online or Xero
3. A2X automatically imports each settlement, categorizes fees (referral, fulfillment, storage, advertising, refund fees), and creates journal entries
4. Go to **A2X → Settlements** — view each settlement with fee breakdown; click any settlement to see the journal entry it will create
5. Review and post journal entries to your accounting system monthly

### Step 3: Categorize and analyze marketplace fees

**Amazon fee categories to track separately:**

| Fee Type | Amazon Label | Typical Rate |
|----------|-------------|-------------|
| Referral fee | `Commission` | 6–45% of selling price (varies by category) |
| FBA per-unit fulfillment | `FBAPerUnitFulfillmentFee` | $3–$8+ per unit (based on size/weight) |
| FBA storage fee | `FBAStorageFee` | $0.75–$2.40/cubic foot/month |
| Long-term storage fee | `FBALongTermStorageFee` | $6.90/cubic foot on inventory >365 days old |
| Return processing fee | `RefundCommission` | 20% of referral fee on returned items |
| Advertising (Sponsored Products) | Listed separately in Advertising reports | Varies by ACOS target |

**Build a fee summary by SKU (using a spreadsheet or A2X):**

For each SKU and period, calculate:
```
Gross Revenue
  - Returns & Refunds
= Net Sales

  - Referral Fees
  - FBA Fulfillment Fees
  - Storage Fees
  - Long-term Storage Fees
  - Advertising Fees
  - Return Processing Fees
= Net Marketplace Proceeds

Total Fee Rate % = Total Fees / Net Sales × 100
Net Margin % = Net Proceeds / Net Sales × 100
```

**Typical Amazon total take rate by category:**
- Apparel: 25–35% (high referral + FBA for bulky items)
- Electronics: 15–20%
- Health & Beauty: 20–30%
- Home & Kitchen: 18–28%
- Books: 15–20%

If your actual fee rate is 5%+ above these ranges, investigate for potential overcharges.

### Step 4: Identify FBA fee overcharges

Amazon FBA fees are based on product dimensions and weight stored in their system. If Amazon has incorrect measurements for your product, you may be paying systematically higher fees on every unit shipped.

**How to check for FBA measurement errors:**
1. Go to **Seller Central → Reports → Fulfillment → Fee Preview** — download the fee preview report
2. Compare the dimensions Amazon has on file against your actual product measurements
3. Go to **Seller Central → Inventory → Manage Inventory → [Product] → FBA product review** to see the dimensions Amazon is using

**How to dispute an FBA measurement:**
1. Go to **Seller Central → Help → Contact Us → FBA issue → FBA fee dispute**
2. Submit a dispute with photos showing your product's actual dimensions
3. Amazon has up to 90 days to investigate; if the dispute is upheld, fees are corrected going forward
4. For historical overcharges: file a reimbursement request via **Seller Central → Help → Contact Us → Reimbursements**

**Using Getida for systematic reimbursement recovery:**
1. Sign up at [getida.com](https://getida.com) — Getida works on a contingency fee basis (takes ~25% of recovered amounts)
2. Grant Getida SP-API access to your Seller Central account
3. Getida audits 18 months of historical FBA fees and claims reimbursements automatically
4. You receive the net recovery with no upfront cost

### Step 5: Monitor long-term storage fees proactively

Amazon charges long-term storage fees on inventory held more than 365 days, assessed on February 15 and August 15 each year. These fees can be significant — $6.90 per cubic foot.

**Proactive monitoring:**
1. 60 days before the assessment date (December 15 and June 15), go to **Seller Central → Reports → Fulfillment → Inventory Age**
2. Download the report and filter for items with more than 270 days in FBA
3. For items approaching 365 days, evaluate:
   - **Price reduction:** Run a sale or promotion to accelerate sell-through
   - **Removal order:** Request Amazon to return inventory to you (removal fee applies but is lower than long-term storage fee for most items)
   - **Liquidation:** Amazon's liquidation program sells inventory to resellers at ~5–10% of the listed price

### Step 6: Build a multi-channel fee comparison

Once you have fee data from multiple marketplaces, compare net margin per SKU across channels:

**Example comparison for one SKU at $39.99 selling price:**

| Channel | Gross Revenue | Fees | Net Proceeds | Net Margin |
|---------|-------------|------|-------------|-----------|
| Own Website (Shopify + Stripe) | $39.99 | $1.46 (Stripe: 2.9% + $0.30) + $5 shipping | $33.53 | 83.8% of revenue |
| Amazon FBA | $39.99 | $5.99 referral (15%) + $4.50 FBA + $0.82 storage | $28.68 | 71.7% of revenue |
| eBay | $39.99 | $5.20 final value (13%) + $0.30 payment + $5 shipping | $29.49 | 73.7% of revenue |
| Etsy | $39.99 | $2.60 transaction (6.5%) + $0.90 payment + $0.20 listing | $36.29 | 90.7% of revenue |

This comparison shows which channel generates the most net proceeds per unit sold.

## Best Practices

- **Reconcile every settlement, not just month-end** — Amazon produces bi-weekly settlements; reconcile each one within 3 business days of receipt to catch discrepancies early
- **Use A2X or Link My Books to automate journal entries** — manual entry of marketplace settlements is error-prone; these tools save 4–8 hours per month and create accurate GAAP entries
- **Track fee rates as a percentage of revenue** — absolute fee amounts grow with revenue; tracking fee rate % lets you monitor fee efficiency independent of volume changes
- **Submit FBA reimbursement claims systematically** — claims must typically be submitted within 90–180 days; automate detection with Getida or SELLERBOARD to avoid leaving money unclaimed
- **Separate advertising spend from transaction fees** — marketing spend (Sponsored Products) is a strategic investment decision; transaction fees (referral, fulfillment) are unavoidable cost of sales; keep them in separate GL accounts
- **Monitor net payout timing for cash flow** — marketplace disbursements have holds and reserves; build the expected payout schedule into your cash flow model (see @cash-flow-forecasting)

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Using marketplace payout amount as revenue | The amount deposited by Amazon is net of all fees; record gross sales as revenue and fees as cost of revenue separately |
| Missing FBA inventory reimbursements | Amazon loses or damages FBA inventory and is obligated to reimburse; reconcile expected inventory against FBA inventory reports monthly; use Getida or SELLERBOARD for systematic auditing |
| Not tracking fee changes in Amazon's annual fee schedule update | Amazon updates FBA fees annually (typically in January/February); update your expected fee model or reconciliation will show unexplained variances throughout the year |
| Currency conversion fees ignored for international marketplaces | If selling on Amazon UK/DE/JP, currency conversion fees reduce disbursements; track separately and include in international channel profitability analysis |
| Long-term storage fees as a surprise | Pull the FBA Inventory Age report 60 days before Feb 15 and Aug 15 assessment dates; take action before fees are assessed |

## Related Skills

- @profit-margin-analysis
- @cost-allocation-analysis
- @cash-flow-forecasting
- @financial-reporting-dashboard
