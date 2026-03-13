---
name: marketing-spend-analysis
description: "Track and analyze marketing spend across all channels with ROAS calculation, diminishing returns analysis, and budget reallocation recommendations by platform"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [marketing-spend, roas, budget-optimization]
triggers: ["analyze marketing spend", "ROAS analysis", "marketing budget allocation", "channel efficiency", "diminishing returns", "ad spend optimization", "blended ROAS"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Marketing Spend Analysis

## Overview

Marketing spend is typically the largest variable cost in a DTC ecommerce business — often 15-40% of revenue. Unlike most costs, marketing spend is directly controllable in near-real-time: you can increase or decrease budgets on paid channels within minutes. This creates both opportunity (scale what works) and risk (waste capital on what does not).

Marketing spend analysis covers the full lifecycle: tracking spend by channel and campaign, computing Return on Ad Spend (ROAS) and related efficiency metrics, identifying diminishing returns curves as spend scales, and making data-driven budget reallocation recommendations across platforms.

The core goal is to maximize total contribution profit (not just revenue) from marketing investment. This distinction matters because a channel with high ROAS but high product costs, high return rates, or low average order value may generate less actual profit than a channel with lower ROAS but stronger unit economics.

This skill covers data integration from ad platforms, metric definitions, ROAS calculations, marginal ROAS analysis, channel mix modeling concepts, and the decision framework for budget reallocation.

---

## When to Use

- You manage marketing budgets across multiple platforms (Meta, Google, TikTok, Pinterest, Amazon Ads)
- You want to identify which channels generate the most profitable customers, not just the most revenue
- You need to build a unified marketing performance dashboard fed by multiple ad platforms
- You are hitting diminishing returns on a key channel and need to decide how to reallocate spend
- You are planning a marketing budget increase and need to project incremental ROAS at different spend levels
- You want to compare platform-reported ROAS against your own first-party attribution
- You are building a marketing efficiency report for a board or investor update

---

## Prerequisites & Platform Notes

**Shopify**: Export data via the Shopify Admin API or use Shopify's built-in analytics. For advanced analytics, connect to a data warehouse (BigQuery, Snowflake) via tools like Fivetran, Stitch, or Shopify's bulk data export.
**WooCommerce**: Use WooCommerce Analytics (built-in) or plugins like Metorik. For custom reporting, query the WordPress database directly or export to a warehouse.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: Access to your store's API, a data warehouse (BigQuery, Snowflake, or PostgreSQL) for advanced analytics

## Core Instructions

### Step 1 — Build a Unified Marketing Spend Data Model

Pull spend data from all platforms into a single normalized table. Each major platform has an API or CSV export.

```python
from datetime import date

PLATFORM_CONNECTORS = {
    'meta': {
        'api_url': 'https://graph.facebook.com/v18.0/act_{account_id}/insights',
        'fields': ['date_start', 'campaign_name', 'adset_name', 'ad_name',
                   'spend', 'impressions', 'clicks', 'purchases', 'purchase_roas'],
        'date_field': 'date_start',
        'spend_field': 'spend',
        'attribution': '7d_click_1d_view',
    },
    'google': {
        'api': 'Google Ads API',
        'fields': ['date', 'campaign_name', 'ad_group', 'cost', 'impressions',
                   'clicks', 'conversions', 'conversion_value'],
        'date_field': 'date',
        'spend_field': 'cost',
        'attribution': 'last_click_30d',
    },
    'tiktok': {
        'api_url': 'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/',
        'fields': ['stat_time_day', 'campaign_name', 'spend', 'impressions',
                   'clicks', 'real_time_conversion', 'real_time_conversion_value'],
        'date_field': 'stat_time_day',
        'spend_field': 'spend',
        'attribution': '7d_click',
    },
    'amazon_sponsored': {
        'api': 'Amazon Advertising API',
        'report_type': 'campaigns',
        'fields': ['date', 'campaignName', 'cost', 'impressions', 'clicks',
                   'attributedSales14d', 'attributedUnitsOrdered14d'],
        'date_field': 'date',
        'spend_field': 'cost',
        'attribution': '14d_click',
    },
    'klaviyo_email': {
        'api': 'Klaviyo API',
        'fields': ['date', 'campaign_name', 'revenue', 'recipients',
                   'opens', 'clicks', 'unsubscribes'],
        'spend_field': 'platform_cost',  # monthly fee prorated by campaign sends
    },
}

# Normalized schema
UNIFIED_SPEND_SCHEMA = """
    CREATE TABLE marketing_spend_daily (
        spend_date          DATE NOT NULL,
        platform            VARCHAR(30) NOT NULL,
        channel_type        VARCHAR(20) NOT NULL,  -- 'paid_search', 'paid_social', 'email', etc.
        campaign_id         VARCHAR(100),
        campaign_name       VARCHAR(200),
        ad_group            VARCHAR(200),
        ad_name             VARCHAR(200),
        spend_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
        impressions         BIGINT DEFAULT 0,
        clicks              INTEGER DEFAULT 0,
        platform_conversions INTEGER DEFAULT 0,
        platform_revenue    NUMERIC(12,2) DEFAULT 0,
        platform_roas       NUMERIC(8,4),
        currency            CHAR(3) DEFAULT 'USD',
        attribution_window  VARCHAR(20),
        PRIMARY KEY (spend_date, platform, campaign_id)
    );
"""
```

### Step 2 — Define and Compute ROAS Metrics

There are several ROAS definitions in common use — it is critical to use the right one for the right decision.

```python
def compute_roas_metrics(
    period: str,
    platform_spend: float,
    platform_attributed_revenue: float,  # from platform's own attribution
    first_party_attributed_revenue: float,  # from your own attribution model
    gross_revenue: float,                # all revenue in period (including organic)
    cogs_rate: float = 0.45,
    variable_costs_rate: float = 0.15,   # fulfillment, payment fees, etc.
) -> dict:
    """
    Compute multiple ROAS definitions for comprehensive channel evaluation.
    """
    # Platform ROAS (what the ad platform reports — usually optimistic)
    platform_roas = platform_attributed_revenue / max(platform_spend, 0.01)

    # Blended ROAS (total revenue / total marketing spend across all channels)
    # Best for overall marketing efficiency, not individual channel decisions
    blended_roas = gross_revenue / max(platform_spend, 0.01)

    # First-party ROAS (using your own attribution, more conservative)
    fp_roas = first_party_attributed_revenue / max(platform_spend, 0.01)

    # TROAS (true ROAS): gross profit after variable costs / spend
    gross_profit_attributed = first_party_attributed_revenue * (1 - cogs_rate - variable_costs_rate)
    true_roas = gross_profit_attributed / max(platform_spend, 0.01)

    # MER (Marketing Efficiency Ratio) = total revenue / total marketing spend
    # Best metric for overall marketing health
    mer = gross_revenue / max(platform_spend, 0.01)

    # Minimum ROAS to break even on contribution margin
    # Must cover: COGS + variable costs + marketing spend
    # If contribution_margin_rate = 1 - cogs_rate - variable_costs_rate - marketing_rate
    # Break-even ROAS = 1 / contribution_margin_rate_before_marketing
    break_even_roas = 1 / max(1 - cogs_rate - variable_costs_rate, 0.01)

    return {
        'period': period,
        'platform_spend': platform_spend,
        'platform_roas': round(platform_roas, 2),
        'first_party_roas': round(fp_roas, 2),
        'true_roas': round(true_roas, 2),
        'mer': round(mer, 2),
        'break_even_roas': round(break_even_roas, 2),
        'is_profitable': true_roas > break_even_roas,
        'profit_vs_breakeven': round(true_roas - break_even_roas, 2),
    }
```

### Step 3 — Analyze Diminishing Returns

As spend on a channel increases, the marginal return per dollar typically decreases. Understanding where you are on the diminishing returns curve is essential for budget allocation decisions.

```python
import numpy as np
from scipy.optimize import curve_fit

def fit_diminishing_returns_curve(
    weekly_spend: list[float],
    weekly_revenue: list[float],
) -> dict:
    """
    Fit a Michaelis-Menten (saturation) curve to spend vs. revenue data:
    Revenue = (a × Spend) / (b + Spend)
    where 'a' is max potential revenue (saturation point) and 'b' is the spend at half-saturation.
    """
    def saturation_curve(spend, a, b):
        return (a * spend) / (b + spend)

    try:
        popt, pcov = curve_fit(
            saturation_curve,
            weekly_spend,
            weekly_revenue,
            p0=[max(weekly_revenue) * 2, np.median(weekly_spend)],
            bounds=(0, [np.inf, np.inf]),
        )
        a, b = popt
    except RuntimeError:
        return {'error': 'Could not fit saturation curve — insufficient data variability'}

    # Compute marginal ROAS at current spend level
    current_spend = weekly_spend[-1]
    marginal_revenue_at_current = (a * b) / ((b + current_spend) ** 2)  # derivative
    marginal_roas_at_current = marginal_revenue_at_current  # = d(Revenue)/d(Spend)

    # Optimal spend: where marginal ROAS = target (e.g., 1.5x for break-even at 40% margins)
    target_marginal_roas = 1.5
    optimal_spend = np.sqrt(a * b / target_marginal_roas) - b

    return {
        'saturation_revenue': round(a, 2),
        'half_saturation_spend': round(b, 2),
        'current_spend': current_spend,
        'current_marginal_roas': round(marginal_roas_at_current, 3),
        'optimal_spend_for_target_mroas': round(max(0, optimal_spend), 2),
        'is_overspending': current_spend > optimal_spend,
        'spend_recommendation': (
            'reduce' if current_spend > optimal_spend * 1.1 else
            'maintain' if abs(current_spend - optimal_spend) / optimal_spend < 0.1 else
            'increase'
        ),
    }
```

### Step 4 — Channel Performance Scorecard

```sql
-- Channel performance scorecard (last 30 days vs. prior 30 days)
WITH current_window AS (
    SELECT
        platform,
        channel_type,
        SUM(spend_amount) AS spend,
        SUM(platform_revenue) AS platform_attributed_revenue,
        SUM(impressions) AS impressions,
        SUM(clicks) AS clicks,
        SUM(platform_conversions) AS platform_orders,
        COUNT(DISTINCT spend_date) AS active_days
    FROM marketing_spend_daily
    WHERE spend_date >= CURRENT_DATE - 30
    GROUP BY platform, channel_type
),
prior_window AS (
    SELECT
        platform,
        channel_type,
        SUM(spend_amount) AS prior_spend,
        SUM(platform_revenue) AS prior_revenue,
        SUM(platform_conversions) AS prior_orders
    FROM marketing_spend_daily
    WHERE spend_date BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
    GROUP BY platform, channel_type
)
SELECT
    c.platform,
    c.channel_type,
    c.spend,
    c.platform_attributed_revenue,
    ROUND(c.platform_attributed_revenue / NULLIF(c.spend, 0), 2) AS roas,
    ROUND(c.spend / NULLIF(c.platform_orders, 0), 2) AS cost_per_order,
    ROUND(c.clicks::numeric / NULLIF(c.impressions, 0) * 100, 2) AS ctr_pct,
    ROUND(c.platform_orders::numeric / NULLIF(c.clicks, 0) * 100, 2) AS cvr_pct,
    p.prior_spend,
    ROUND((c.spend - p.prior_spend) / NULLIF(p.prior_spend, 0) * 100, 1) AS spend_change_pct,
    ROUND(c.platform_attributed_revenue / NULLIF(c.spend, 0) -
          p.prior_revenue / NULLIF(p.prior_spend, 0), 2) AS roas_change_vs_prior
FROM current_window c
LEFT JOIN prior_window p USING (platform, channel_type)
ORDER BY c.spend DESC;
```

### Step 5 — Budget Reallocation Recommendations

```python
def generate_reallocation_recommendations(
    channel_performance: list[dict],
    total_budget: float,
    target_overall_roas: float = 3.0,
) -> dict:
    """
    Generate budget reallocation recommendations based on channel efficiency.
    Uses marginal ROAS to maximize total contribution at a given budget.
    """
    profitable = [c for c in channel_performance if c['true_roas'] >= c['break_even_roas']]
    unprofitable = [c for c in channel_performance if c['true_roas'] < c['break_even_roas']]

    recommendations = []

    # Flag underperforming channels
    for channel in unprofitable:
        roas_gap = channel['break_even_roas'] - channel['true_roas']
        recommendations.append({
            'channel': channel['platform'],
            'action': 'reduce',
            'priority': 'high',
            'current_spend': channel['spend'],
            'recommended_spend': channel['spend'] * 0.50,  # cut 50% until ROAS recovers
            'rationale': (
                f"True ROAS of {channel['true_roas']:.2f}x is {roas_gap:.2f}x below break-even "
                f"({channel['break_even_roas']:.2f}x). Reduce spend by 50% and optimize campaigns."
            ),
            'freed_budget': channel['spend'] * 0.50,
        })

    # Identify high-efficiency channels with headroom to scale
    high_performers = sorted(
        [c for c in profitable if c.get('marginal_roas', c['true_roas']) > target_overall_roas],
        key=lambda x: x.get('marginal_roas', x['true_roas']),
        reverse=True,
    )

    freed_budget = sum(r['freed_budget'] for r in recommendations)
    budget_to_allocate = freed_budget

    for channel in high_performers:
        if budget_to_allocate <= 0:
            break
        headroom = channel.get('optimal_spend', channel['spend'] * 1.3) - channel['spend']
        incremental_spend = min(headroom, budget_to_allocate)
        if incremental_spend > 100:
            recommendations.append({
                'channel': channel['platform'],
                'action': 'increase',
                'priority': 'medium',
                'current_spend': channel['spend'],
                'recommended_spend': channel['spend'] + incremental_spend,
                'rationale': (
                    f"True ROAS of {channel['true_roas']:.2f}x is above target. "
                    f"Incremental ${incremental_spend:,.0f} projected to yield "
                    f"{channel.get('marginal_roas', channel['true_roas']):.2f}x marginal ROAS."
                ),
                'freed_budget': -incremental_spend,
            })
            budget_to_allocate -= incremental_spend

    return {
        'total_budget': total_budget,
        'total_freed_from_cuts': freed_budget,
        'total_reallocated': freed_budget - budget_to_allocate,
        'recommendations': sorted(recommendations, key=lambda x: {'high': 0, 'medium': 1, 'low': 2}[x['priority']]),
    }
```

### Step 6 — Weekly Marketing Efficiency Report

```python
def format_weekly_marketing_report(
    channel_data: list[dict],
    prior_week_data: list[dict],
    total_budget_remaining: float,
) -> str:
    """Generate a formatted weekly marketing efficiency summary."""
    total_spend = sum(c['spend'] for c in channel_data)
    total_revenue = sum(c['attributed_revenue'] for c in channel_data)
    blended_roas = total_revenue / max(total_spend, 0.01)

    lines = [
        f"WEEKLY MARKETING PERFORMANCE SUMMARY",
        f"{'─' * 60}",
        f"Total Spend: ${total_spend:,.0f}",
        f"Total Attributed Revenue: ${total_revenue:,.0f}",
        f"Blended ROAS: {blended_roas:.2f}x",
        f"{'─' * 60}",
        f"{'Channel':<20} {'Spend':>10} {'ROAS':>8} {'vs LW':>8} {'Status':>10}",
        f"{'─' * 60}",
    ]

    prior_roas = {c['platform']: c.get('roas', 0) for c in prior_week_data}

    for ch in sorted(channel_data, key=lambda x: x['spend'], reverse=True):
        roas = ch.get('roas', 0)
        lw_roas = prior_roas.get(ch['platform'], roas)
        roas_delta = roas - lw_roas
        delta_str = f"{roas_delta:+.2f}x"
        status = 'OK' if roas >= ch.get('break_even_roas', 2.0) else 'REVIEW'

        lines.append(
            f"{ch['platform']:<20} ${ch['spend']:>9,.0f} {roas:>7.2f}x {delta_str:>8} {status:>10}"
        )

    lines.append(f"{'─' * 60}")
    lines.append(f"Monthly Budget Remaining: ${total_budget_remaining:,.0f}")

    return '\n'.join(lines)
```

---

## Best Practices

1. **Track true ROAS, not platform-reported ROAS** — Platform ROAS uses the platform's own attribution, which is almost always higher than reality due to view-through attribution and multi-touch double-counting. Compute ROAS from your own first-party data and compare it to platform reports to understand the discrepancy.

2. **Set channel-specific ROAS targets based on margin** — A 3x ROAS is not the same profitability across products with different margins. Set minimum ROAS thresholds by product category: higher-margin products can sustain lower ROAS; lower-margin products need higher ROAS to be profitable.

3. **Monitor MER (Marketing Efficiency Ratio) as a holistic metric** — Blended MER (total revenue / total marketing spend across all channels) is harder to game than individual channel ROAS and gives you a true picture of overall marketing health. A healthy ecommerce MER is typically 3-6x depending on margins.

4. **Separate new customer acquisition from retention spending** — Remarketing and email/SMS to existing customers have very different economics than prospecting for new customers. Track CAC and ROAS separately for new vs. returning customer campaigns.

5. **Build a weekly spend pacing report** — Track cumulative spend vs. monthly budget by the day. A channel that has spent 80% of its monthly budget by day 15 will either overspend or dramatically under-deliver in the second half of the month.

6. **Investigate ROAS drops before cutting budgets** — A sudden ROAS drop often has a specific cause: creative fatigue, a competitor promotion, a tracking pixel issue, or a product going out of stock. Diagnose before cutting spend; sometimes the fix is a new creative, not a budget reduction.

7. **Test incrementality before doubling down on any channel** — High ROAS on a retargeting campaign may be capturing sales that would have happened anyway. Run incrementality tests (holdout tests) to measure the true incremental impact of your marketing spend.

8. **Normalize spend metrics to per-day rates** — Marketing spend varies by calendar month length. Use spend-per-day rather than spend-per-month for period comparisons.

9. **Track creative performance, not just campaign performance** — Budget reallocation at the campaign level misses the insight that one creative drives 70% of a campaign's ROAS. Surface creative-level performance and prioritize winning ad formats and messages.

10. **Build a channel diversification health score** — Concentration risk is real: if 80% of your customer acquisition comes from one platform, a policy change (iOS privacy changes, algorithm update, account suspension) can destroy your growth. Track channel concentration and incentivize diversification.

---

## Common Pitfalls

### Pitfall 1: Optimizing for ROAS Instead of Profit
High ROAS can be achieved by only running ads for low-competition, high-margin products — but this limits scale. Optimize for total incremental gross profit, not ROAS. A channel with 2.5x ROAS on $500K spend contributes more profit than one with 5x ROAS on $50K spend at most margin structures.

### Pitfall 2: Ignoring Attribution Window Mismatches
Meta uses 7-day click / 1-day view attribution by default. Google uses 30-day last-click. TikTok uses 7-day click. When you compare ROAS across platforms, you are comparing different time windows. Standardize attribution windows in your first-party model.

### Pitfall 3: Not Accounting for Halo Effects
Spending on upper-funnel brand awareness (YouTube, connected TV, influencer) drives organic and direct-traffic sales that will not show up in paid channel ROAS. Evaluate brand channels using marketing mix modeling or brand lift studies, not last-click attribution.

### Pitfall 4: Cutting Spend Too Aggressively During Temporary ROAS Dips
Short-term ROAS drops occur during audience learning phases, creative refreshes, and seasonal demand shifts. Cutting spend during an algorithmic learning period resets the learning and causes additional performance degradation. Allow platforms a full learning phase (50+ optimization events) before evaluating performance.

### Pitfall 5: Not Separating Branded from Non-Branded Search ROAS
Branded Google search (people searching your company name) has very high ROAS but low incrementality — those customers were already going to find you. Non-branded (generic) search is where you are genuinely competing for new demand. Analyze these separately to avoid overestimating Google's incremental value.

### Pitfall 6: Analyzing Spend Without Inventory Context
Running ads at full budget when a top SKU is out of stock drives spend with no ability to convert. Build an alert that flags when spend is running for products that are low or out of stock, and automatically pause those campaigns.
