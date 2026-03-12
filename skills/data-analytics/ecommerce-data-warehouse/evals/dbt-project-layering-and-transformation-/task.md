# dbt Transformation Project for Bloom & Basket Shopify Store

## Problem/Feature Description

Bloom & Basket is an online floral subscription service running on Shopify. Their data engineering team recently onboarded Fivetran to sync Shopify data into their cloud data warehouse (BigQuery). The raw tables are landing in a source schema, but the analysts can't use them directly — the data is messy, fields need renaming, and there's no clean separation between raw ingestion and analytics-ready output.

The team wants a properly structured dbt project that transforms the raw Fivetran-synced Shopify data into analytics-ready models. They need a clear layered architecture so that analysts can trust the marts layer, and so the intermediate logic isn't exposed or materialized unnecessarily. The staging models should handle cleanup and normalization, including extracting marketing attribution information from URL parameters. The final order fact model should only include financially settled transactions. Data quality checks need to be in place on the key models, and all models should be documented.

The team is particularly concerned about the fact table growing too large — they want the transformation strategy to handle that gracefully so daily runs don't reprocess the entire history.

## Output Specification

Produce a complete (but minimal) dbt project structure with the following files:

- `dbt_project.yml` — project configuration with model layer settings
- `models/staging/stg_orders.sql` — staging model for Shopify orders
- `models/staging/stg_order_items.sql` — staging model for order line items
- `models/marts/fct_order_items.sql` — final fact model joining all dimensions
- `models/marts/schema.yml` — documentation and tests for the marts models
- `design-notes.md` — brief explanation of materialization choices and incremental strategy

## Input Files

The following files describe the raw Fivetran source tables. Extract them before beginning.

=============== FILE: inputs/source_schema.md ===============
# Raw Source Tables (Fivetran Shopify connector)

Schema: `shopify_raw`

## orders
| column | type | notes |
|--------|------|-------|
| id | STRING | Shopify order ID |
| name | STRING | Human-readable order number (e.g. #1001) |
| email | STRING | Customer email |
| customer_id | STRING | Shopify customer ID |
| financial_status | STRING | paid, pending, voided, refunded |
| fulfillment_status | STRING | fulfilled, partial, null |
| total_price | STRING | Total in store currency |
| subtotal_price | STRING | Pre-tax, pre-shipping subtotal |
| total_discounts | STRING | Total discounts applied |
| total_tax | STRING | Tax collected |
| total_shipping_price_set_shop_money_amount | STRING | Shipping charged |
| currency | STRING | ISO currency code |
| source_name | STRING | Channel: web, pos, draft_orders |
| referring_site | STRING | Referring URL |
| landing_site | STRING | Landing page URL (may contain UTM params) |
| cancel_reason | STRING | Reason if cancelled |
| cancelled_at | TIMESTAMP | Cancellation time |
| created_at | TIMESTAMP | Order creation time |
| updated_at | TIMESTAMP | Last update time |
| _fivetran_deleted | BOOLEAN | Soft-delete flag set by Fivetran |

## order_line_items
| column | type | notes |
|--------|------|-------|
| id | STRING | Line item ID |
| order_id | STRING | Parent order ID |
| product_id | STRING | Shopify product ID |
| variant_id | STRING | Product variant ID |
| sku | STRING | SKU code |
| title | STRING | Product title |
| variant_title | STRING | Variant description |
| quantity | INTEGER | Units ordered |
| price | STRING | Unit price as string |
| total_discount | STRING | Discount on this line item |
