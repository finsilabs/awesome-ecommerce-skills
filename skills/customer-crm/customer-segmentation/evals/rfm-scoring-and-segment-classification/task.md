# Customer Scoring System for E-Commerce Analytics

## Problem Description

GreenLeaf Commerce, an online plant and gardening retailer, has grown to over 50,000 customers over the past three years. Their marketing team currently sends the same promotional emails to all customers and is burning significant budget on customers who either just purchased last week or haven't purchased in over a year. The CTO has asked you to build a customer scoring and classification system that will allow the marketing team to target different groups of customers with appropriate messages.

The company uses PostgreSQL and their `orders` table has the following schema: customer_id, id (order id), created_at (timestamp), subtotal_cents (integer), status (string, e.g. 'completed', 'cancelled', 'refunded', 'pending'). They want to score every customer based on their purchase history and automatically categorize them so campaigns can be tailored by customer lifecycle stage. The scoring should work correctly even as the customer base grows or spending patterns shift over time.

The engineering team will schedule this scoring to run automatically, and they need a TypeScript function that reads the computed scores and assigns each customer to a named lifecycle segment. A CRM dashboard will display a summary of all segments with counts and average monetary scores, along with a recommended action per segment.

## Output Specification

Produce the following files:

1. `rfm_scoring.sql` — A complete SQL query that computes per-customer RFM scores (recency, frequency, monetary) using the `orders` table. The query should output: `customer_id`, `r_score`, `f_score`, `m_score`, `rfm_total`, `rfm_cell`.

2. `rfm_classifier.ts` — A TypeScript module containing:
   - A TypeScript type for all possible segment names
   - A `classifyRFMSegment(r, f, m)` function that maps scores to a segment name
   - A `refreshRFMScores()` async function that runs the scoring query and persists the results (assume a `db` object is available as shown in examples)
   - A `getSegmentSummary()` function that returns segment counts, average monetary score, and recommended action per segment

3. `SEGMENT_ACTIONS.md` — A markdown table mapping each segment name to the recommended marketing action for that segment.
