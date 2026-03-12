# Channel Performance and Category Revenue Breakdown

## Problem/Feature Description

The marketing and merchandising teams at Vantage Shop have been working from separate spreadsheets and need a unified analytics module that answers two key questions: (1) Which acquisition channels are driving the most revenue, and how many new vs. returning customers does each channel bring? (2) Which product categories are driving the most revenue, and what share of total sales does each represent?

The database has an `orders` table, an `order_attribution` table (columns: `order_id`, `source`, `medium`), an `order_items` table, a `products` table, a `product_categories` join table, and a `categories` table. Monetary values in the orders and order_items tables are stored as integer cents. Some orders have no attribution record — those should not be dropped from the channel analysis but should be grouped under a sensible default.

Additionally, the CFO wants a high-level revenue waterfall that shows how gross revenue becomes net revenue, accounting for discounts, refunds, and shipping. The VP of Merchandising also wants a weekly "top products" report that ranks products by revenue and shows whether each product moved up or down in rank compared to the prior week.

## Output Specification

Produce the following files:

1. `channel-drilldown.sql` — SQL query for revenue by acquisition channel including new vs. returning customer breakdown.
2. `category-revenue.sql` — SQL query for revenue and revenue share by product category.
3. `revenue-waterfall.ts` — TypeScript function `getRevenueWaterfall(start: Date, end: Date)` that returns the waterfall array.
4. `top-products.sql` — SQL query that returns the top 20 products by revenue for a period with their rank and rank change vs. the prior period (use named parameters `:current_start`, `:current_end`, `:prior_start`, `:prior_end`).
5. `schema-notes.md` — A brief document (max 250 words) covering any important schema design or query optimisation decisions.

Assume `db.orders.sumField(field, options)` is available for the waterfall function.
