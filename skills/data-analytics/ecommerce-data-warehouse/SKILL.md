---
name: ecommerce-data-warehouse
description: "Data warehouse design for commerce — star schema, ETL pipelines, dbt models"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [data-warehouse, star-schema, etl, dbt, analytics, bigquery, snowflake, redshift]
triggers: ["build ecommerce data warehouse", "design analytics schema", "create dbt models", "ecommerce ETL pipeline"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# E-commerce Data Warehouse

## Overview

Design and build a data warehouse for e-commerce analytics using star schema modeling, ETL/ELT pipelines, and dbt (data build tool) for transformation. This skill covers dimensional modeling for orders, products, customers, and marketing attribution, data extraction from commerce platforms and payment providers, incremental loading strategies, and building KPI dashboards for revenue, conversion, and customer lifetime value.

## When to Use This Skill

- When building an analytics data warehouse for e-commerce reporting
- When designing dimensional models (star schema) for order, product, and customer analysis
- When creating dbt models to transform raw commerce data into analytics-ready tables
- When building ETL/ELT pipelines to extract data from Shopify, Stripe, or other platforms
- When calculating commerce KPIs: revenue, AOV, LTV, conversion rate, cohort retention

## Core Instructions

1. **Design the star schema for e-commerce**

   ```sql
   -- ============================================
   -- DIMENSION TABLES
   -- ============================================

   -- Date dimension (pre-populated calendar table)
   CREATE TABLE dim_date (
     date_key        INTEGER PRIMARY KEY,    -- YYYYMMDD format
     full_date       DATE NOT NULL,
     day_of_week     SMALLINT,
     day_name        VARCHAR(10),
     day_of_month    SMALLINT,
     day_of_year     SMALLINT,
     week_of_year    SMALLINT,
     month_number    SMALLINT,
     month_name      VARCHAR(10),
     quarter         SMALLINT,
     year            SMALLINT,
     is_weekend      BOOLEAN,
     is_holiday      BOOLEAN,
     fiscal_quarter  SMALLINT,
     fiscal_year     SMALLINT
   );

   -- Customer dimension (SCD Type 2 for tracking changes)
   CREATE TABLE dim_customer (
     customer_key      SERIAL PRIMARY KEY,
     customer_id       VARCHAR(50) NOT NULL,   -- Natural key from source
     email             VARCHAR(255),
     first_name        VARCHAR(100),
     last_name         VARCHAR(100),
     city              VARCHAR(100),
     state             VARCHAR(100),
     country           VARCHAR(2),
     customer_segment  VARCHAR(50),            -- 'new', 'returning', 'vip', 'churned'
     first_order_date  DATE,
     acquisition_channel VARCHAR(100),
     -- SCD Type 2 fields
     effective_from    TIMESTAMP NOT NULL,
     effective_to      TIMESTAMP DEFAULT '9999-12-31',
     is_current        BOOLEAN DEFAULT true
   );

   -- Product dimension
   CREATE TABLE dim_product (
     product_key       SERIAL PRIMARY KEY,
     product_id        VARCHAR(50) NOT NULL,
     sku               VARCHAR(100),
     title             VARCHAR(500),
     product_type      VARCHAR(100),
     vendor            VARCHAR(255),
     collection        VARCHAR(255),
     variant_title     VARCHAR(255),
     price             NUMERIC(10,2),
     cost_price        NUMERIC(10,2),
     weight            NUMERIC(8,2),
     is_active         BOOLEAN,
     created_date      DATE,
     effective_from    TIMESTAMP NOT NULL,
     effective_to      TIMESTAMP DEFAULT '9999-12-31',
     is_current        BOOLEAN DEFAULT true
   );

   -- Channel dimension
   CREATE TABLE dim_channel (
     channel_key       SERIAL PRIMARY KEY,
     channel_name      VARCHAR(100),           -- 'web', 'mobile_app', 'marketplace', 'pos'
     sub_channel       VARCHAR(100),           -- 'organic', 'paid_search', 'email', 'social'
     utm_source        VARCHAR(255),
     utm_medium        VARCHAR(255),
     utm_campaign      VARCHAR(255)
   );

   -- ============================================
   -- FACT TABLES
   -- ============================================

   -- Order line item fact (grain: one row per order line item)
   CREATE TABLE fact_order_items (
     order_item_key    SERIAL PRIMARY KEY,
     order_id          VARCHAR(50) NOT NULL,
     order_number      VARCHAR(50),
     date_key          INTEGER REFERENCES dim_date(date_key),
     customer_key      INTEGER REFERENCES dim_customer(customer_key),
     product_key       INTEGER REFERENCES dim_product(product_key),
     channel_key       INTEGER REFERENCES dim_channel(channel_key),
     -- Measures
     quantity          INTEGER NOT NULL,
     unit_price        NUMERIC(10,2),
     gross_revenue     NUMERIC(12,2),          -- quantity * unit_price
     discount_amount   NUMERIC(10,2),
     net_revenue       NUMERIC(12,2),          -- gross - discounts
     tax_amount        NUMERIC(10,2),
     shipping_amount   NUMERIC(10,2),
     cost_of_goods     NUMERIC(10,2),          -- quantity * cost_price
     gross_profit      NUMERIC(12,2),          -- net_revenue - cost_of_goods
     -- Order-level flags
     is_first_order    BOOLEAN,
     order_status      VARCHAR(30),
     payment_method    VARCHAR(50),
     currency          VARCHAR(3),
     -- Timestamps
     ordered_at        TIMESTAMP,
     fulfilled_at      TIMESTAMP,
     refunded_at       TIMESTAMP
   );

   -- Daily aggregate fact (for dashboards that don't need line-item detail)
   CREATE TABLE fact_daily_sales (
     date_key          INTEGER REFERENCES dim_date(date_key),
     channel_key       INTEGER REFERENCES dim_channel(channel_key),
     -- Measures
     total_orders      INTEGER,
     total_items       INTEGER,
     gross_revenue     NUMERIC(14,2),
     discount_amount   NUMERIC(12,2),
     net_revenue       NUMERIC(14,2),
     tax_collected     NUMERIC(12,2),
     shipping_revenue  NUMERIC(12,2),
     cogs              NUMERIC(14,2),
     gross_profit      NUMERIC(14,2),
     new_customers     INTEGER,
     returning_customers INTEGER,
     avg_order_value   NUMERIC(10,2),
     PRIMARY KEY (date_key, channel_key)
   );
   ```

2. **Build dbt models for transformation**

   ```yaml
   # dbt_project.yml
   name: 'ecommerce_analytics'
   version: '1.0.0'
   profile: 'warehouse'

   model-paths: ["models"]
   analysis-paths: ["analyses"]
   test-paths: ["tests"]

   models:
     ecommerce_analytics:
       staging:
         +materialized: view
         +schema: staging
       intermediate:
         +materialized: ephemeral
       marts:
         +materialized: table
         +schema: analytics
   ```

   ```sql
   -- models/staging/stg_orders.sql
   -- Staging model: clean and normalize raw order data

   with source as (
       select * from {{ source('shopify', 'orders') }}
   ),

   renamed as (
       select
           id as order_id,
           name as order_number,
           email,
           customer_id,
           financial_status,
           fulfillment_status,
           total_price::numeric(12,2) as total_price,
           subtotal_price::numeric(12,2) as subtotal_price,
           total_discounts::numeric(10,2) as total_discounts,
           total_tax::numeric(10,2) as total_tax,
           total_shipping_price_set_shop_money_amount::numeric(10,2) as shipping_amount,
           currency,
           source_name as channel,
           referring_site,
           landing_site,
           cancel_reason,
           cancelled_at,
           created_at as ordered_at,
           updated_at,
           -- Extract UTM parameters from landing site
           {{ extract_utm_param('landing_site', 'utm_source') }} as utm_source,
           {{ extract_utm_param('landing_site', 'utm_medium') }} as utm_medium,
           {{ extract_utm_param('landing_site', 'utm_campaign') }} as utm_campaign
       from source
       where _fivetran_deleted = false
   )

   select * from renamed
   ```

   ```sql
   -- models/staging/stg_order_items.sql
   with source as (
       select * from {{ source('shopify', 'order_line_items') }}
   ),

   renamed as (
       select
           id as order_item_id,
           order_id,
           product_id,
           variant_id,
           sku,
           title as product_title,
           variant_title,
           quantity,
           price::numeric(10,2) as unit_price,
           (quantity * price::numeric(10,2)) as gross_revenue,
           total_discount::numeric(10,2) as discount_amount,
           (quantity * price::numeric(10,2) - total_discount::numeric(10,2)) as net_revenue
       from source
   )

   select * from renamed
   ```

   ```sql
   -- models/marts/fct_order_items.sql
   -- Final fact table joining all dimensions

   with order_items as (
       select * from {{ ref('stg_order_items') }}
   ),

   orders as (
       select * from {{ ref('stg_orders') }}
   ),

   customers as (
       select * from {{ ref('dim_customers') }}
   ),

   products as (
       select * from {{ ref('dim_products') }}
   ),

   customer_first_orders as (
       select
           customer_id,
           min(ordered_at) as first_order_at
       from orders
       where financial_status != 'voided'
       group by customer_id
   ),

   final as (
       select
           oi.order_item_id,
           oi.order_id,
           o.order_number,
           {{ date_key('o.ordered_at') }} as date_key,
           c.customer_key,
           p.product_key,
           oi.quantity,
           oi.unit_price,
           oi.gross_revenue,
           oi.discount_amount,
           oi.net_revenue,
           coalesce(p.cost_price * oi.quantity, 0) as cost_of_goods,
           oi.net_revenue - coalesce(p.cost_price * oi.quantity, 0) as gross_profit,
           o.ordered_at = cfo.first_order_at as is_first_order,
           o.financial_status as order_status,
           o.currency,
           o.ordered_at,
           o.utm_source,
           o.utm_medium,
           o.utm_campaign
       from order_items oi
       join orders o on oi.order_id = o.order_id
       left join customers c
           on o.customer_id = c.customer_id
           and c.is_current = true
       left join products p
           on oi.product_id = p.product_id
           and p.is_current = true
       left join customer_first_orders cfo
           on o.customer_id = cfo.customer_id
       where o.financial_status not in ('voided', 'pending')
   )

   select * from final
   ```

3. **Build KPI models**

   ```sql
   -- models/marts/kpi_daily_summary.sql
   -- Daily commerce KPIs for executive dashboard

   with daily_orders as (
       select
           {{ date_key('ordered_at') }} as date_key,
           count(distinct order_id) as total_orders,
           count(distinct customer_key) as unique_customers,
           sum(quantity) as total_items,
           sum(gross_revenue) as gross_revenue,
           sum(discount_amount) as total_discounts,
           sum(net_revenue) as net_revenue,
           sum(cost_of_goods) as total_cogs,
           sum(gross_profit) as gross_profit,
           sum(case when is_first_order then net_revenue else 0 end) as new_customer_revenue,
           count(distinct case when is_first_order then customer_key end) as new_customers,
           count(distinct case when not is_first_order then customer_key end) as returning_customers
       from {{ ref('fct_order_items') }}
       group by 1
   )

   select
       d.full_date,
       d.day_name,
       d.week_of_year,
       d.month_name,
       d.quarter,
       d.year,
       o.total_orders,
       o.unique_customers,
       o.total_items,
       o.gross_revenue,
       o.total_discounts,
       o.net_revenue,
       o.total_cogs,
       o.gross_profit,
       case when o.net_revenue > 0
           then (o.gross_profit / o.net_revenue * 100)::numeric(5,2)
           else 0 end as gross_margin_pct,
       case when o.total_orders > 0
           then (o.net_revenue / o.total_orders)::numeric(10,2)
           else 0 end as avg_order_value,
       case when o.total_orders > 0
           then (o.total_items::numeric / o.total_orders)::numeric(5,2)
           else 0 end as avg_items_per_order,
       o.new_customers,
       o.returning_customers,
       case when o.unique_customers > 0
           then (o.returning_customers::numeric / o.unique_customers * 100)::numeric(5,2)
           else 0 end as returning_customer_pct,
       o.new_customer_revenue
   from daily_orders o
   join {{ ref('dim_date') }} d on o.date_key = d.date_key
   order by d.full_date desc
   ```

   ```sql
   -- models/marts/kpi_customer_ltv.sql
   -- Customer lifetime value calculation

   with customer_orders as (
       select
           customer_key,
           min(ordered_at) as first_order_at,
           max(ordered_at) as last_order_at,
           count(distinct order_id) as total_orders,
           sum(net_revenue) as total_revenue,
           sum(gross_profit) as total_profit,
           sum(quantity) as total_items,
           avg(net_revenue) as avg_order_revenue,
           datediff('day', min(ordered_at), max(ordered_at)) as customer_lifespan_days
       from {{ ref('fct_order_items') }}
       group by customer_key
   ),

   cohorted as (
       select
           *,
           date_trunc('month', first_order_at) as cohort_month,
           case
               when total_orders = 1 then 'one_time'
               when total_orders between 2 and 3 then 'repeat'
               when total_orders between 4 and 10 then 'loyal'
               else 'champion'
           end as customer_tier,
           case
               when datediff('day', last_order_at, current_date) > 365 then 'churned'
               when datediff('day', last_order_at, current_date) > 180 then 'at_risk'
               when datediff('day', last_order_at, current_date) > 90 then 'cooling'
               else 'active'
           end as activity_status
       from customer_orders
   )

   select
       c.customer_key,
       dc.customer_id,
       dc.email,
       dc.first_name,
       dc.last_name,
       dc.country,
       dc.acquisition_channel,
       c.cohort_month,
       c.first_order_at,
       c.last_order_at,
       c.total_orders,
       c.total_revenue,
       c.total_profit,
       c.avg_order_revenue,
       c.customer_lifespan_days,
       c.customer_tier,
       c.activity_status,
       -- Simple LTV prediction: avg_monthly_revenue * 24 months
       case when c.customer_lifespan_days > 30
           then (c.total_revenue / (c.customer_lifespan_days / 30.0) * 24)::numeric(12,2)
           else c.total_revenue
       end as predicted_ltv_24m
   from cohorted c
   join {{ ref('dim_customers') }} dc
       on c.customer_key = dc.customer_key
       and dc.is_current = true
   ```

4. **Set up the ETL/ELT pipeline**

   ```typescript
   // scripts/extract-shopify-orders.ts
   // Incremental extraction from Shopify API

   import Shopify from '@shopify/shopify-api';

   interface ExtractionState {
     lastExtractedAt: string;
     lastOrderId: string;
   }

   async function extractOrders(state: ExtractionState): Promise<ExtractionState> {
     const client = new Shopify.Clients.Rest(SHOP_URL, ACCESS_TOKEN);

     let nextPageUrl: string | null = null;
     let ordersExtracted = 0;
     let lastOrderId = state.lastOrderId;

     // First request with updated_at_min for incremental extraction
     let response = await client.get({
       path: 'orders',
       query: {
         status: 'any',
         updated_at_min: state.lastExtractedAt,
         limit: '250',
         order: 'updated_at asc',
       },
     });

     while (true) {
       const orders = response.body.orders;

       if (orders.length === 0) break;

       // Write to staging table (append-only)
       await writeTostaging('raw_shopify_orders', orders);
       ordersExtracted += orders.length;
       lastOrderId = orders[orders.length - 1].id;

       // Check for next page
       const linkHeader = response.headers['link'];
       nextPageUrl = parseLinkHeader(linkHeader, 'next');

       if (!nextPageUrl) break;

       response = await client.get({ path: nextPageUrl });
     }

     console.log(`Extracted ${ordersExtracted} orders`);

     return {
       lastExtractedAt: new Date().toISOString(),
       lastOrderId,
     };
   }
   ```

5. **Configure dbt tests and documentation**

   ```yaml
   # models/marts/schema.yml
   version: 2

   models:
     - name: fct_order_items
       description: "Fact table with one row per order line item, joined to all dimensions"
       columns:
         - name: order_item_id
           description: "Unique identifier for the order line item"
           tests:
             - unique
             - not_null
         - name: order_id
           description: "Order identifier"
           tests:
             - not_null
         - name: customer_key
           description: "Foreign key to dim_customer"
           tests:
             - relationships:
                 to: ref('dim_customers')
                 field: customer_key
         - name: net_revenue
           description: "Revenue after discounts, in the order currency"
           tests:
             - not_null
             - dbt_utils.accepted_range:
                 min_value: 0

     - name: kpi_daily_summary
       description: "Daily aggregate KPIs for executive dashboards"
       tests:
         - dbt_utils.unique_combination_of_columns:
             combination_of_columns:
               - full_date
       columns:
         - name: avg_order_value
           tests:
             - not_null
             - dbt_utils.accepted_range:
                 min_value: 0
   ```

6. **Schedule dbt runs with orchestration**

   ```yaml
   # dbt Cloud job or Airflow DAG
   # airflow/dags/ecommerce_dwh.py

   from airflow import DAG
   from airflow.operators.python import PythonOperator
   from airflow.operators.bash import BashOperator
   from datetime import datetime, timedelta

   default_args = {
       'owner': 'analytics',
       'retries': 2,
       'retry_delay': timedelta(minutes=5),
   }

   with DAG(
       'ecommerce_data_warehouse',
       default_args=default_args,
       schedule_interval='0 */4 * * *',  # Every 4 hours
       start_date=datetime(2026, 1, 1),
       catchup=False,
   ) as dag:

       extract_orders = PythonOperator(
           task_id='extract_shopify_orders',
           python_callable=extract_orders_incremental,
       )

       extract_products = PythonOperator(
           task_id='extract_shopify_products',
           python_callable=extract_products_incremental,
       )

       extract_customers = PythonOperator(
           task_id='extract_shopify_customers',
           python_callable=extract_customers_incremental,
       )

       dbt_run = BashOperator(
           task_id='dbt_run',
           bash_command='cd /opt/dbt/ecommerce_analytics && dbt run --target prod',
       )

       dbt_test = BashOperator(
           task_id='dbt_test',
           bash_command='cd /opt/dbt/ecommerce_analytics && dbt test --target prod',
       )

       # Extract in parallel, then transform
       [extract_orders, extract_products, extract_customers] >> dbt_run >> dbt_test
   ```

## Examples

### Cohort retention analysis

```sql
-- models/marts/analysis_cohort_retention.sql
-- Monthly cohort retention matrix

with customer_first_month as (
    select
        customer_key,
        date_trunc('month', min(ordered_at)) as cohort_month
    from {{ ref('fct_order_items') }}
    group by customer_key
),

customer_activity as (
    select distinct
        f.customer_key,
        cfm.cohort_month,
        date_trunc('month', f.ordered_at) as activity_month,
        datediff('month', cfm.cohort_month, date_trunc('month', f.ordered_at)) as months_since_first
    from {{ ref('fct_order_items') }} f
    join customer_first_month cfm on f.customer_key = cfm.customer_key
),

cohort_size as (
    select cohort_month, count(distinct customer_key) as cohort_customers
    from customer_first_month
    group by cohort_month
),

retention as (
    select
        ca.cohort_month,
        ca.months_since_first,
        count(distinct ca.customer_key) as active_customers
    from customer_activity ca
    group by ca.cohort_month, ca.months_since_first
)

select
    r.cohort_month,
    cs.cohort_customers,
    r.months_since_first,
    r.active_customers,
    (r.active_customers::numeric / cs.cohort_customers * 100)::numeric(5,2) as retention_pct
from retention r
join cohort_size cs on r.cohort_month = cs.cohort_month
order by r.cohort_month, r.months_since_first
```

### Product performance report

```sql
-- models/marts/report_product_performance.sql
select
    p.product_id,
    p.title,
    p.product_type,
    p.vendor,
    p.collection,
    sum(f.quantity) as units_sold,
    sum(f.net_revenue) as net_revenue,
    sum(f.gross_profit) as gross_profit,
    case when sum(f.net_revenue) > 0
        then (sum(f.gross_profit) / sum(f.net_revenue) * 100)::numeric(5,2)
        else 0 end as margin_pct,
    count(distinct f.order_id) as order_count,
    count(distinct f.customer_key) as unique_buyers,
    sum(f.discount_amount) as total_discounts_given,
    avg(f.unit_price)::numeric(10,2) as avg_selling_price,
    sum(case when f.is_first_order then f.net_revenue else 0 end) as acquisition_revenue
from {{ ref('fct_order_items') }} f
join {{ ref('dim_products') }} p
    on f.product_key = p.product_key
    and p.is_current = true
where f.ordered_at >= dateadd('day', -90, current_date)
group by 1, 2, 3, 4, 5
order by net_revenue desc
```

## Best Practices

- **Use star schema with conformed dimensions** -- keep fact tables narrow (measures + foreign keys) and dimension tables wide (descriptive attributes); this pattern optimizes for query performance
- **Implement Slowly Changing Dimensions (SCD Type 2)** -- track historical changes to product prices and customer segments so you can analyze orders with the attributes that were true at the time of purchase
- **Use incremental models in dbt** -- for large fact tables, use `materialized: incremental` with `unique_key` to avoid reprocessing the entire table on every run
- **Store monetary values consistently** -- decide on cents (integers) or dollars (decimals) and use it everywhere; document the convention in your dbt docs
- **Separate staging, intermediate, and marts layers** -- staging cleans raw data, intermediate models join and enrich, marts are the final analytics-ready tables
- **Add dbt tests for data quality** -- test for uniqueness, not-null constraints, referential integrity, and accepted value ranges on every model
- **Build a date dimension table** -- pre-populate with a full calendar including fiscal periods, holidays, and week numbers; every fact table should join to it
- **Document your models with descriptions** -- use dbt's YAML schema files to document every model and column; this becomes the data catalog for your team

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate rows in fact table from reprocessing | Use `unique_key` in dbt incremental models and deduplicate in staging with `row_number()` over the natural key |
| Revenue numbers don't match the source system | Verify currency handling (cents vs. dollars), discount application order, and tax inclusion/exclusion; build a reconciliation query that compares warehouse totals to source totals |
| Historical product prices not captured | Implement SCD Type 2 on dim_product and join fact_order_items to the product dimension row that was current at the time of the order |
| ETL fails mid-run leaving partial data | Use transactions for atomic writes; in dbt, use `on_schema_change: 'sync_all_columns'` and full-refresh if incremental gets corrupted |
| Dashboard queries are too slow | Pre-aggregate in a daily summary fact table; partition large tables by date; use columnar storage (BigQuery, Redshift, Snowflake) |
| Customer identity resolution across channels | Implement a customer ID mapping table that links email, phone, and platform-specific IDs to a single canonical customer key |

## Related Skills

- @product-data-modeling
- @erp-integration
- @ecommerce-seo
- @merchandising-rules
- @customer-accounts
