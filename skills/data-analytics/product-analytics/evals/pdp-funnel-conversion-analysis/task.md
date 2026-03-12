# Product Page Conversion Audit

## Problem/Feature Description

An e-commerce team has noticed that some products receive significant traffic but very few shoppers add items to their cart. The growth team suspects these are products with pricing, imagery, or copy issues — but they need data to confirm which products to prioritize for a page-quality review sprint.

The analytics team has three raw event tables in their PostgreSQL database: `page_view_events` (when shoppers land on a product detail page), `cart_events` (when shoppers click "Add to Cart"), and the `orders` table. Their current reporting only tracks completed orders; it ignores the full funnel, leaving them blind to where shoppers drop off. They want a set of SQL queries that computes per-product funnel metrics and surfaces a prioritized alert list of products needing attention.

There is a known data quality issue: a multi-variant product page can fire multiple `page_view_events` rows within the same session when the shopper browses between color/size options. The query must account for this to avoid inflated view counts.

## Output Specification

Write a file called `pdp_funnel.sql` containing:
1. A reusable SQL query (using CTEs) that computes, for each product: total page views, add-to-cart sessions, purchase count, pdp-to-atc conversion rate, and overall pdp conversion rate.
2. A second query (or extension of the first) that produces only the products needing urgent attention due to very low add-to-cart rate.

Assume the following schema is available:

```sql
-- page_view_events: one row per page view event
--   session_id TEXT, product_id TEXT, page_type TEXT, created_at TIMESTAMPTZ
-- cart_events: one row per cart interaction
--   session_id TEXT, product_id TEXT, event TEXT ('add_to_cart'), created_at TIMESTAMPTZ
-- orders: one row per order
--   order_id TEXT, session_id TEXT, status TEXT, created_at TIMESTAMPTZ
-- order_items: one row per line item in an order
--   order_id TEXT, product_id TEXT, quantity INT
-- products: product catalog
--   id TEXT, name TEXT
```

Also write a brief `analysis_notes.md` explaining how the query handles the multi-variant page view issue and what the low-conversion alert criteria mean for the team's review process.
