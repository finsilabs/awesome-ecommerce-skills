# Multi-Channel P&L Waterfall for an E-Commerce Business

## Problem Description

Driftwood Supply Co. is a mid-sized outdoor gear retailer selling through three channels: their own website (channel = 'direct'), Amazon (channel = 'amazon'), and a wholesale portal (channel = 'wholesale'). Their CFO has just returned from a board meeting where a director pointed out that despite $4M in gross revenue last quarter, the business had negative operating cash flow. The CFO suspects the Amazon channel looks profitable on paper but is actually a money-loser once fulfillment, advertising, and a share of warehouse overhead are properly accounted for.

The data team has been asked to write a SQL query (or series of queries / CTEs) that produces a full P&L waterfall broken down by channel. The output must show every cost layer in sequence — from gross revenue down to a final net contribution margin — so that each channel's true economics are visible. The company uses PostgreSQL. The relevant tables that already exist in the database are: `orders`, `order_items`, `product_costs`, `order_fulfillment_costs`, `channel_marketing_costs`, `order_attribution`, `order_channel_cpa` (a pre-computed view), `order_overhead_allocations`, and `products`.

Amazon and Etsy orders incur a platform fee of approximately 15% of order revenue. This fee is currently stored nowhere — the CFO wants it included in the waterfall for those channels.

## Output Specification

Produce a file `pnl_waterfall.sql` containing the complete SQL for the channel P&L waterfall. The query should return one row per channel with columns for: orders (count), gross_revenue, discounts, net_revenue, cogs, gross_profit, fulfillment_costs, marketing_costs, overhead_costs, net_margin, and net_margin_pct.

Also produce a short `query_notes.md` explaining any assumptions you made about the schema or data, particularly around how marketplace fees are handled and how costs from cancelled orders are treated.
