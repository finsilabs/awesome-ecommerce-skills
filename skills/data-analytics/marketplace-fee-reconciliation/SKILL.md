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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Marketplace Fee Reconciliation

## Overview

Selling on marketplaces like Amazon, eBay, Walmart, and Etsy introduces a complex layer of fees that significantly impact net profitability. Amazon alone has over a dozen distinct fee types: referral fees, FBA fulfillment fees, storage fees, advertising fees, return processing fees, and more. These fees are deducted before disbursement, making it easy to lose track of how much of your gross revenue actually reaches your bank account.

Fee reconciliation is the practice of matching marketplace settlement data against your expected fee schedule, verifying that you have been charged correctly, and computing true net revenue by SKU and category. Fees are frequently miscalculated — Amazon FBA fees are based on dimensional weight and product category, and even small errors in product dimensions can result in systematic overcharges.

This skill covers downloading and parsing settlement reports from each major marketplace, categorizing and analyzing fees, computing net revenue, identifying overcharges, and generating optimization recommendations to reduce fee burden.

---

## When to Use

- You sell on Amazon, eBay, Walmart, Etsy, or other marketplaces and need to understand true net revenue
- You suspect you are being overcharged on FBA fulfillment fees due to incorrect product dimensions
- You want to reconcile marketplace payouts against your GL on a monthly basis
- You need to compute true contribution margin per SKU by channel including marketplace fees
- You are evaluating whether to move products from FBA to FBM (fulfilled by merchant)
- You are building a multi-channel profitability model and need normalized fee data
- You want to identify opportunities to reduce ACOS and increase net margin on Amazon

---

## Prerequisites & Platform Notes

**Shopify**: Export data via the Shopify Admin API or use Shopify's built-in analytics. For advanced analytics, connect to a data warehouse (BigQuery, Snowflake) via tools like Fivetran, Stitch, or Shopify's bulk data export.
**WooCommerce**: Use WooCommerce Analytics (built-in) or plugins like Metorik. For custom reporting, query the WordPress database directly or export to a warehouse.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: Access to your store's API, a data warehouse (BigQuery, Snowflake, or PostgreSQL) for advanced analytics

## Core Instructions

### Step 1 — Download Settlement Reports by Marketplace

**Amazon:**
- In Seller Central: Reports → Payments → Transaction View → Download flat file
- Or via SP-API: `GET /finances/v0/financialEventGroups` and `GET /finances/v0/financialEvents`
- Settlement periods are typically bi-weekly

**eBay:**
- Account → Payments → Payments report (CSV or XML)
- Or via eBay Finances API

**Walmart:**
- Seller Center → Payments → Transaction Report
- Available as CSV, monthly

**Etsy:**
- Finance → Payment account → Monthly statements

### Step 2 — Normalize Settlement Data to a Common Schema

```sql
-- Unified marketplace transaction table
CREATE TABLE marketplace_transactions (
    transaction_id      VARCHAR(100) NOT NULL,
    marketplace         VARCHAR(20) NOT NULL,  -- 'amazon', 'ebay', 'walmart', 'etsy'
    settlement_id       VARCHAR(50),
    transaction_date    DATE NOT NULL,
    transaction_type    VARCHAR(50) NOT NULL,  -- 'order', 'refund', 'fee', 'advertising', 'adjustment'
    fee_type            VARCHAR(100),          -- Amazon-specific: FBAPerUnitFulfillmentFee, Commission, etc.
    order_id            VARCHAR(100),
    sku                 VARCHAR(50),
    asin                VARCHAR(20),
    product_name        VARCHAR(200),
    quantity            INTEGER,
    selling_price       NUMERIC(12,2),
    marketplace_fee     NUMERIC(12,2),         -- negative for fees deducted from seller
    tax_collected       NUMERIC(12,2),
    tax_remitted        NUMERIC(12,2),
    net_proceeds        NUMERIC(12,2),
    currency            CHAR(3) DEFAULT 'USD',
    settlement_period_start DATE,
    settlement_period_end   DATE,
    PRIMARY KEY (marketplace, transaction_id)
);

CREATE INDEX idx_mktplace_txn_sku ON marketplace_transactions(sku, marketplace);
CREATE INDEX idx_mktplace_txn_period ON marketplace_transactions(settlement_period_start);
CREATE INDEX idx_mktplace_txn_type ON marketplace_transactions(transaction_type, fee_type);
```

### Step 3 — Parse Amazon Settlement Files

Amazon's flat-file settlement is the most complex of the major marketplaces.

```python
import pandas as pd
from decimal import Decimal

AMAZON_FEE_CATEGORIES = {
    'FBAPerUnitFulfillmentFee': 'fulfillment',
    'FBAPerOrderFulfillmentFee': 'fulfillment',
    'FBAWeightBasedFee': 'fulfillment',
    'Commission': 'referral_fee',
    'VariableClosingFee': 'referral_fee',
    'RefundCommission': 'refund_fee',
    'FBAStorageFee': 'storage',
    'FBALongTermStorageFee': 'storage_long_term',
    'Subscription': 'monthly_subscription',
    'Selling fees': 'referral_fee',
    'FBA transaction fees': 'fulfillment',
    'other-transaction': 'other',
    'Lightning Deal fees': 'promotional',
    'Sponsored Products': 'advertising',
    'Sponsored Brands': 'advertising',
}

def parse_amazon_settlement(filepath: str) -> pd.DataFrame:
    """
    Parse Amazon flat-file settlement report into normalized transaction records.
    """
    df = pd.read_csv(filepath, sep='\t', encoding='utf-8', thousands=',')

    # Rename columns to normalized schema
    col_mapping = {
        'settlement-id': 'settlement_id',
        'settlement-start-date': 'settlement_period_start',
        'settlement-end-date': 'settlement_period_end',
        'transaction-type': 'transaction_type',
        'order-id': 'order_id',
        'merchant-order-id': 'merchant_order_id',
        'shipment-id': 'shipment_id',
        'marketplace-name': 'marketplace_name',
        'amount-type': 'fee_type',
        'amount-description': 'fee_description',
        'amount': 'amount',
        'quantity-purchased': 'quantity',
        'posted-date': 'transaction_date',
        'sku': 'sku',
        'product-description': 'product_name',
    }
    df = df.rename(columns={k: v for k, v in col_mapping.items() if k in df.columns})
    df['marketplace'] = 'amazon'
    df['fee_category'] = df['fee_type'].map(AMAZON_FEE_CATEGORIES).fillna('other')
    df['amount'] = pd.to_numeric(df.get('amount', 0), errors='coerce').fillna(0)

    return df

def summarize_amazon_fees_by_sku(settlement_df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate fees and net proceeds by SKU for a settlement period."""
    return settlement_df.groupby(['sku', 'fee_category']).agg(
        total_amount=('amount', 'sum'),
        transaction_count=('transaction_date', 'count')
    ).reset_index().pivot_table(
        index='sku',
        columns='fee_category',
        values='total_amount',
        aggfunc='sum',
        fill_value=0
    ).reset_index()
```

### Step 4 — Compute Net Revenue Per SKU Per Marketplace

```sql
-- Net revenue computation by SKU and marketplace
WITH fee_summary AS (
    SELECT
        marketplace,
        sku,
        DATE_TRUNC('month', transaction_date) AS period,
        SUM(CASE WHEN transaction_type = 'order' THEN selling_price ELSE 0 END) AS gross_revenue,
        SUM(CASE WHEN fee_category = 'referral_fee' THEN ABS(marketplace_fee) ELSE 0 END) AS referral_fees,
        SUM(CASE WHEN fee_category = 'fulfillment' THEN ABS(marketplace_fee) ELSE 0 END) AS fulfillment_fees,
        SUM(CASE WHEN fee_category = 'storage' THEN ABS(marketplace_fee) ELSE 0 END) AS storage_fees,
        SUM(CASE WHEN fee_category = 'storage_long_term' THEN ABS(marketplace_fee) ELSE 0 END) AS long_term_storage_fees,
        SUM(CASE WHEN fee_category = 'advertising' THEN ABS(marketplace_fee) ELSE 0 END) AS advertising_fees,
        SUM(CASE WHEN fee_category = 'refund_fee' THEN ABS(marketplace_fee) ELSE 0 END) AS refund_fees,
        SUM(CASE WHEN fee_category = 'other' THEN ABS(marketplace_fee) ELSE 0 END) AS other_fees,
        SUM(CASE WHEN transaction_type = 'refund' THEN ABS(selling_price) ELSE 0 END) AS refunds,
        SUM(net_proceeds) AS total_net_proceeds
    FROM marketplace_transactions
    GROUP BY 1, 2, 3
)
SELECT
    marketplace,
    sku,
    period,
    gross_revenue,
    refunds,
    gross_revenue - refunds AS net_sales,
    referral_fees,
    fulfillment_fees,
    storage_fees,
    long_term_storage_fees,
    advertising_fees,
    refund_fees,
    other_fees,
    referral_fees + fulfillment_fees + storage_fees + long_term_storage_fees + advertising_fees + refund_fees + other_fees AS total_fees,
    ROUND((referral_fees + fulfillment_fees + storage_fees + long_term_storage_fees + advertising_fees) / NULLIF(net_sales, 0) * 100, 1) AS total_fee_rate_pct,
    net_sales - (referral_fees + fulfillment_fees + storage_fees + long_term_storage_fees + advertising_fees + refund_fees) AS net_marketplace_proceeds,
    ROUND((net_sales - (referral_fees + fulfillment_fees + storage_fees + long_term_storage_fees + advertising_fees + refund_fees)) / NULLIF(net_sales, 0) * 100, 1) AS net_margin_pct
FROM fee_summary
ORDER BY marketplace, net_sales DESC;
```

### Step 5 — Detect FBA Fee Overcharges

Amazon FBA fees are based on product dimensions and weight stored in their system, which may not match your actual product. Systematic errors compound across thousands of units.

```python
def detect_fba_fee_overcharges(
    actual_dimensions: dict,   # {sku: {'length': float, 'width': float, 'height': float, 'weight_oz': float}}
    charged_fees: pd.DataFrame,  # sku, units_shipped, total_fba_fee_charged
    amazon_fba_rate_table: dict,  # size_tier -> {weight_range: rate}
) -> pd.DataFrame:
    """
    Compare expected FBA fees based on actual product dimensions against charged fees.
    Returns a DataFrame of potential overcharges.
    """
    overcharges = []

    for _, row in charged_fees.iterrows():
        sku = row['sku']
        dims = actual_dimensions.get(sku)
        if not dims:
            continue

        # Compute size tier
        longest = max(dims['length'], dims['width'], dims['height'])
        median = sorted([dims['length'], dims['width'], dims['height']])[1]
        shortest = min(dims['length'], dims['width'], dims['height'])
        girth = 2 * (median + shortest)
        weight_lbs = dims['weight_oz'] / 16
        dim_weight = (dims['length'] * dims['width'] * dims['height']) / 139
        billable_weight = max(weight_lbs, dim_weight)

        if longest <= 15 and median <= 12 and shortest <= 0.75 and weight_lbs <= 0.75:
            size_tier = 'small_standard'
        elif longest <= 18 and median <= 14 and shortest <= 8 and weight_lbs <= 20:
            size_tier = 'large_standard'
        else:
            size_tier = 'large_bulky'

        expected_fee_per_unit = amazon_fba_rate_table.get(size_tier, {}).get(
            min((k for k in amazon_fba_rate_table[size_tier] if k >= billable_weight), default=None)
        ) or 0

        expected_total = expected_fee_per_unit * row['units_shipped']
        actual_total = row['total_fba_fee_charged']
        variance = actual_total - expected_total

        if variance > 10.0:  # Flag overcharges > $10 per settlement period
            overcharges.append({
                'sku': sku,
                'size_tier': size_tier,
                'billable_weight_lbs': round(billable_weight, 3),
                'expected_fee_per_unit': round(expected_fee_per_unit, 2),
                'units_shipped': row['units_shipped'],
                'expected_total_fee': round(expected_total, 2),
                'charged_total_fee': round(actual_total, 2),
                'overcharge_amount': round(variance, 2),
                'action': 'submit_reimbursement_request',
            })

    return pd.DataFrame(overcharges).sort_values('overcharge_amount', ascending=False)
```

### Step 6 — Fee Optimization Recommendations

```python
def generate_fee_optimization_recommendations(
    sku_fee_analysis: pd.DataFrame,
    product_costs: dict,  # sku -> landed_cost
) -> list[dict]:
    """Generate fee optimization recommendations for high-cost SKUs."""
    recommendations = []

    for _, row in sku_fee_analysis.iterrows():
        sku = row['sku']
        net_margin = row.get('net_margin_pct', 0)
        long_term_storage = row.get('long_term_storage_fees', 0)
        fulfillment_fees = row.get('fulfillment_fees', 0)
        gross_revenue = row.get('gross_revenue', 0)
        fba_fee_rate = fulfillment_fees / max(gross_revenue, 1) * 100

        if long_term_storage > 100:
            recommendations.append({
                'sku': sku,
                'category': 'inventory_liquidation',
                'priority': 'high',
                'current_cost': long_term_storage,
                'recommendation': f"SKU {sku} has ${long_term_storage:.2f} in long-term storage fees. "
                                  f"Consider running a removal order or liquidation to avoid continued charges.",
            })

        if fba_fee_rate > 20:
            recommendations.append({
                'sku': sku,
                'category': 'fbm_switch',
                'priority': 'medium' if net_margin > 0 else 'high',
                'current_cost': fulfillment_fees,
                'recommendation': f"FBA fees are {fba_fee_rate:.1f}% of revenue for {sku}. "
                                  f"Evaluate FBM fulfillment cost — if lower, switch to reduce fee burden.",
            })

        if net_margin < 5:
            landed_cost = product_costs.get(sku, 0)
            recommendations.append({
                'sku': sku,
                'category': 'pricing_review',
                'priority': 'high',
                'recommendation': f"Net margin is {net_margin:.1f}% on {sku}. "
                                  f"Review selling price or consider discontinuing if not improving.",
            })

    return sorted(recommendations, key=lambda x: {'high': 0, 'medium': 1, 'low': 2}[x['priority']])
```

---

## Best Practices

1. **Reconcile every settlement, not just month-end** — Amazon produces bi-weekly settlements; eBay and Walmart are monthly. Reconcile each settlement file against your expected payouts within 3 business days of receipt to catch discrepancies early.

2. **Build a fee expectation model** — Precompute expected fees by SKU based on category, dimensions, and weight. Compare actuals to expected every period. Unexplained variance signals miscategorization or fee errors.

3. **Track fee rates as a percentage of revenue** — Absolute fee amounts grow with revenue. Track FBA fee rate (%), referral fee rate (%), and total take rate (%) to monitor fee efficiency independent of volume.

4. **Submit FBA reimbursement claims systematically** — Amazon's Reimbursement Center handles fee overcharges, but claims must typically be submitted within 90-180 days. Automate the detection and submission process; many sellers leave significant money unclaimed.

5. **Separate advertising spend from transaction fees in the data model** — Marketing spend (Sponsored Products, Sponsored Brands) is a strategic investment decision. Transaction fees (referral, fulfillment) are unavoidable cost of sales. Keep them in separate GL accounts and analyze separately.

6. **Monitor long-term storage proactively** — Amazon charges long-term storage fees on inventory older than 365 days on February 15 and August 15 each year. Pull an aging inventory report 60 days before these dates and plan removal orders or pricing adjustments.

7. **Benchmark referral fee rates against category norms** — Amazon referral fees range from 6% (consumer electronics) to 45% (Amazon device accessories). Knowing your category's standard rate helps identify miscategorized products being over-charged.

8. **Automate monthly GL postings** — Marketplace fees should flow automatically from settlement data into your GL, mapped to the correct expense accounts. Manual entry at month-end is error-prone and time-consuming.

9. **Track net payout timing for cash flow purposes** — Marketplace disbursements often have holds (new seller reserves, chargeback reserves). Track the gap between earned revenue and actual bank receipt for cash flow planning.

10. **Consolidate multi-marketplace fees into a single dashboard** — If you sell on multiple marketplaces, build a unified fee analysis view that shows total fee rate per SKU across all channels. Some SKUs may be more profitably sold on one marketplace vs. another.

---

## Common Pitfalls

### Pitfall 1: Using Gross Payout as Revenue
The amount deposited to your bank account by Amazon includes marketplace price × units minus all fees. Using this as revenue understates gross sales and distorts your P&L. Record gross sales as revenue and fees as cost of revenue / selling expenses separately.

### Pitfall 2: Missing Co-mingled FBA Inventory Issues
If your FBA inventory is co-mingled (commingled with other sellers' units), you may receive returns of other sellers' products or have your products sold in others' name. Monitor for unusual return patterns and request label-only (stickered) inventory if co-mingling causes issues.

### Pitfall 3: Not Claiming FBA Inventory Reimbursements
Amazon loses or damages FBA inventory and is obligated to reimburse you. These credits appear in settlement data but can be missed if not tracked. Reconcile expected inventory against Amazon's FBA inventory reports monthly.

### Pitfall 4: Ignoring Currency Conversion Fees for International Marketplaces
If you sell on Amazon UK, DE, JP, etc., there are currency conversion fees on disbursements. Track these separately and factor them into your international channel profitability analysis.

### Pitfall 5: Not Tracking Fee Changes in Amazon's Annual Fee Schedule Update
Amazon updates its FBA fee schedule annually (typically in February). If you do not update your expected fee model, your reconciliation will show unexplained variances throughout the year. Build a fee change monitoring process.
