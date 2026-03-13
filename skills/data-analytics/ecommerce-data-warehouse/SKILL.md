---
name: ecommerce-data-warehouse
description: "Build a commerce data warehouse with star-schema tables, ETL pipelines, and dbt models for BigQuery, Snowflake, or Redshift analytics"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [data-warehouse, star-schema, etl, dbt, analytics, bigquery, snowflake, redshift]
triggers: ["build ecommerce data warehouse", "design analytics schema", "create dbt models", "ecommerce ETL pipeline"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# E-commerce Data Warehouse

## Overview

An ecommerce data warehouse centralizes data from your store, ad platforms, shipping carriers, and accounting system into a single analytics layer — enabling reports that no single platform can produce on its own. Most merchants start needing a warehouse when they outgrow their platform's built-in analytics (typically around $1M+ ARR or when managing multiple channels), want to combine ad spend with order data for true ROAS, or need SQL-level access to run custom cohort and attribution analyses.

This skill guides you through extracting data from your platform, loading it into BigQuery (recommended for cost), and transforming it with dbt so your team can build dashboards in Looker Studio, Metabase, or Tableau.

## When to Use This Skill

- When your platform's built-in analytics cannot answer important business questions
- When you need to combine data from multiple sources (Shopify + Meta Ads + Google Ads + shipping)
- When you want to build custom cohort retention, LTV, and attribution models
- When analysts or data scientists need SQL access to raw order data
- When you need a single source of truth across multiple sales channels

## Core Instructions

### Step 1: Choose your warehouse and set up the infrastructure

For most ecommerce merchants, **BigQuery** is the best starting point:
- Free tier: first 10 GB storage + 1 TB queries per month free
- No infrastructure to manage — serverless
- Excellent integrations with Looker Studio (free BI tool), dbt, and every major data integration tool

**Alternatives:**
- **Snowflake:** Better for teams that need time-travel, data sharing, or advanced concurrency; more expensive at small scale
- **Redshift:** Good if you are already in AWS; more operational overhead than BigQuery or Snowflake

**Set up BigQuery:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new Google Cloud project
2. Enable the BigQuery API
3. Create a dataset (e.g., `ecommerce_raw`) for raw ingested data and a second dataset (`ecommerce_analytics`) for transformed tables

### Step 2: Extract data from your ecommerce platform

The easiest way to get platform data into BigQuery is a managed connector. Avoid building custom extractors unless you have a specific requirement.

---

#### Shopify

**Option A: Fivetran (recommended, $$$)**
1. Sign up at [fivetran.com](https://fivetran.com)
2. Add the **Shopify connector** — enter your shop URL and grant API access
3. Fivetran syncs orders, customers, products, inventory, and financial data incrementally to BigQuery
4. Pre-built dbt package: `dbt-fivetran/shopify` — provides staging and mart models out of the box

**Option B: Stitch (mid-price)**
1. Sign up at [stitchdata.com](https://stitchdata.com)
2. Add the **Shopify integration** — select tables to sync (orders, order_line_items, customers, products)
3. Stitch loads raw data to BigQuery; you transform with dbt

**Option C: Shopify's native data export (free, manual)**
1. Go to **Analytics → Reports → [any report]** and click **Export** — available for orders, customers, products
2. For bulk data: Go to **Settings → Bulk operations** or use the **Shopify Admin API bulk query** to export all data as JSONL
3. Load JSONL files to BigQuery using **bq load** CLI command or Google Cloud Storage

**Option D: Polar Analytics (simplest, all-in-one)**
- Install **Polar Analytics** from the Shopify App Store — it connects Shopify + all ad platforms + shipping and provides a pre-built BigQuery export with a standard schema; skip building the pipeline yourself

---

#### WooCommerce

**Option A: Stitch or Airbyte**
1. **Stitch:** Does not have a native WooCommerce connector; use their **MySQL connector** to connect directly to your WordPress database
2. **Airbyte (open source, self-hosted):** Has a WooCommerce connector; run on a $20/month VM or use Airbyte Cloud

**Option B: Direct MySQL replication**
WooCommerce stores all data in MySQL. For a technical team:
1. Enable binary log replication on your MySQL instance
2. Use **Debezium** or **Airbyte's MySQL CDC connector** to stream changes to BigQuery
3. This requires DevOps expertise but provides the most real-time data

**Option C: Metorik export**
1. Use Metorik to pull and transform WooCommerce data into clean CSVs
2. Schedule CSV exports and load to BigQuery via **Cloud Functions** or a simple **Google Apps Script**

---

#### BigCommerce

**Option A: Fivetran BigCommerce connector**
- BigCommerce is available as a Fivetran source; set up the same way as Shopify

**Option B: BigCommerce Data Solutions**
- BigCommerce offers a native **Insights** product (available on higher-tier plans) that provides pre-built analytics; check if this meets your needs before building a warehouse

**Option C: Stitch BigCommerce connector**
- Available in Stitch; syncs orders, customers, and products to BigQuery

---

### Step 3: Install and configure dbt

dbt (data build tool) transforms raw ingested data into clean analytics-ready tables using SQL. It handles dependency management, testing, and documentation.

**Install dbt:**
```bash
pip install dbt-bigquery  # for BigQuery
# or: pip install dbt-snowflake / dbt-redshift
```

**Initialize a project:**
```bash
dbt init ecommerce_analytics
cd ecommerce_analytics
```

**Configure your profile in `~/.dbt/profiles.yml`** (points to your BigQuery project).

### Step 4: Build dbt models for your ecommerce data

If using Fivetran + Shopify, install the pre-built Shopify dbt package:
```yaml
# packages.yml
packages:
  - package: fivetran/shopify
    version: [">=0.10.0", "<0.11.0"]
```

Run `dbt deps` to install, then `dbt run` to build all models.

For other platforms or custom schemas, build models in this three-layer pattern:

**Staging layer** — clean raw data, no business logic:
```sql
-- models/staging/stg_orders.sql
with source as (select * from {{ source('shopify_raw', 'order') }}),
renamed as (
    select
        id::varchar as order_id,
        name as order_number,
        customer_id::varchar as customer_id,
        email,
        financial_status,
        fulfillment_status,
        total_price::numeric(12,2) as total_price,
        subtotal_price::numeric(12,2) as subtotal_price,
        total_discounts::numeric(10,2) as total_discounts,
        currency,
        source_name as channel,
        created_at as ordered_at
    from source
    where _fivetran_deleted = false
)
select * from renamed
```

**Mart layer** — business-ready tables for dashboards:
```sql
-- models/marts/fct_orders.sql
with orders as (select * from {{ ref('stg_orders') }}),
customers as (select * from {{ ref('stg_customers') }}),
first_orders as (
    select customer_id, min(ordered_at) as first_order_at
    from orders group by 1
)
select
    o.order_id,
    o.order_number,
    o.customer_id,
    o.ordered_at,
    o.total_price,
    o.subtotal_price,
    o.total_discounts,
    o.channel,
    o.ordered_at = fo.first_order_at as is_first_order,
    date_trunc(o.ordered_at, month) as order_month
from orders o
left join first_orders fo on o.customer_id = fo.customer_id
where o.financial_status not in ('voided', 'pending')
```

### Step 5: Add data quality tests

Add tests in your schema YAML files so broken pipelines are caught before they reach dashboards:

```yaml
# models/marts/schema.yml
models:
  - name: fct_orders
    columns:
      - name: order_id
        tests: [unique, not_null]
      - name: total_price
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
```

Run tests: `dbt test`

### Step 6: Connect a BI tool to your warehouse

Once data is in BigQuery, connect a visualization layer:

- **Google Looker Studio (free):** Go to [lookerstudio.google.com](https://lookerstudio.google.com) → Add data source → BigQuery → select your project and tables; build dashboards with drag-and-drop
- **Metabase (open source, self-hosted):** Install on a $10/month VM; connect to BigQuery; lets non-technical users browse data and build charts with a GUI
- **Tableau, Looker, Power BI:** Standard enterprise options; Looker is the most powerful for ecommerce analytics but has significant cost and setup overhead

## Best Practices

- **Start with managed connectors, not custom code** — Fivetran or Stitch cost $200–$500/month but save 40+ engineering hours; the breakeven is fast unless you have a very low traffic store
- **Use the dbt Shopify package if you are on Shopify + Fivetran** — it provides production-quality models for 15+ commonly needed tables out of the box; no need to reinvent
- **Implement Slowly Changing Dimensions (SCD Type 2) for products and customers** — track historical changes so you can analyze orders with the attributes that were true at the time of purchase
- **Build a date dimension table** — pre-populate with a full calendar including fiscal periods, holidays, and week numbers; every fact table should join to it
- **Add dbt tests before connecting dashboards** — uniqueness, not-null, and referential integrity tests catch data pipeline failures before they produce wrong numbers in reports
- **Separate staging, intermediate, and mart layers** — staging cleans raw data, intermediate models join and enrich, marts are the final analytics-ready tables your BI tool queries

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Revenue in warehouse does not match platform analytics | Verify currency handling (cents vs. dollars), discount application order, and tax inclusion/exclusion; build a daily reconciliation check that compares warehouse totals to platform API totals |
| Historical product prices not captured | Implement SCD Type 2 on the product dimension and join fact tables to the product row that was current at the time of the order |
| ETL fails mid-run leaving partial data | Use dbt's `on_schema_change: sync_all_columns` and atomic table swaps; for incremental models, configure a `unique_key` to handle re-runs idempotently |
| Dashboard queries are too slow | Pre-aggregate in daily summary fact tables; partition large tables by date in BigQuery; avoid running heavy SQL on load |
| Customer identity not resolved across channels | Build a customer identity resolution table that maps email, phone, and platform-specific IDs to a single canonical customer key |

## Related Skills

- @attribution-modeling
- @customer-analytics
- @sales-reporting-dashboard
- @product-analytics
