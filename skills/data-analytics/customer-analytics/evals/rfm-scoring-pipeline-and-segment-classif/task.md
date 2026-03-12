# Customer Segmentation for Loyalty Program Targeting

## Problem Description

Finova, a mid-size direct-to-consumer fashion retailer, is launching a revamped loyalty program next quarter. The marketing team currently treats all customers the same — everyone gets the same newsletter, the same discounts, and the same reactivation emails. The head of retention has seen competitors use data-driven segmentation to dramatically improve campaign ROI and wants Finova to do the same.

The data team has a PostgreSQL database with two relevant tables: `orders` (columns: `id`, `customer_id`, `created_at`, `subtotal_cents`, `status`) and `customers` (columns: `id`, `email`, `first_name`). Not all orders should count toward analytics — some were cancelled or refunded. The team wants a SQL-based scoring pipeline that keeps segments up to date so marketing always has fresh data to target.

The analytics lead wants a self-contained SQL file that can be scheduled as a cron job. It should score every customer on how recently they purchased, how often they purchase, and how much they spend — then classify each into a named segment that marketing can act on directly. The results should reference each customer's email and first name for easy export to the marketing automation tool.

## Output Specification

Produce a file `rfm_pipeline.sql` containing the complete SQL query that:
- Computes recency, frequency, and monetary scores for each customer
- Assigns each customer a percentile-based score from 1–5 on each dimension
- Classifies each customer into a named segment based on their scores
- Returns customer contact info alongside analytics fields

Also produce a short `notes.md` explaining:
- How the query handles problematic order statuses
- What the segment names represent and when they are assigned
- A recommendation for the appropriate scheduling cadence for this query and why it matters
