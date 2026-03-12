# Customer Retention Analytics and Behavioral Targeting System

## Problem Description

UrbanThreads, a direct-to-consumer apparel brand, has been running for four years and recently raised a Series A. Their new Head of Growth needs two things to plan the next marketing push: (1) a clear picture of how customers acquired in different months are retaining over their first year, and (2) a flexible system for defining targeting segments based on customer behavior and properties — so the team can create segments like "customers who viewed product pages 3+ times in the last 14 days but haven't purchased" without waiting on an engineer.

The engineering team uses PostgreSQL. The `orders` table has columns: `customer_id`, `id`, `created_at` (timestamp), `status` ('completed', 'cancelled', 'refunded', 'pending'), `subtotal_cents`. The `customer_events` table has columns: `customer_id`, `event` (string event name), `created_at` (timestamp). The `customers` table has columns: `id`, `email`, `acquisition_channel`, `plan`, and other profile properties.

For the retention analysis, the team wants a single SQL query they can run in their BI tool showing each acquisition cohort alongside the number of customers still purchasing at defined retention milestones.

For the behavioral segment system, the team wants a TypeScript module that evaluates whether a given customer belongs to a segment, where segments are defined as a list of rules with a combining operator. The system should handle checking event counts, customer property comparisons, and membership in other segments. Performance matters — the platform has millions of events per day — and the engineering lead wants any database recommendations documented in a `db_recommendations.md` file.

## Output Specification

Produce the following files:

1. `cohort_analysis.sql` — A complete SQL query against the `orders` table that shows cohort retention. For each acquisition cohort, output: `cohort_month`, `cohort_size`, and columns showing how many customers from that cohort made additional purchases at each defined retention milestone. Order results with most recent cohorts first.

2. `behavioral_segments.ts` — A TypeScript module containing:
   - Type definitions for a segment and its rules, supporting rules based on events, customer properties, and other segment membership
   - An `evaluateBehavioralSegment(customerId, segment)` async function that evaluates all rules for a customer and returns a boolean
   - The function should handle the segment operator (how rules are combined)

3. `db_recommendations.md` — A markdown document listing database optimizations recommended when using this behavioral segment system at scale, with the specific index/approach for the events table.
