# Customer Lapse Audit Tool

## Problem Description

The growth team at a mid-sized e-commerce company has noticed that repeat purchase rates have been declining steadily. Leadership suspects a large chunk of the customer base has quietly gone inactive, but there's no current tooling to measure or categorize this. Before they can launch any re-engagement efforts, they need a reliable way to identify and group lapsed customers based on how long it has been since their last order.

The company wants a TypeScript module that queries their customer database and returns structured segments of lapsed customers. The output should help the marketing team understand the urgency and appropriate communication strategy for each group, and prioritize the most commercially valuable customers within each group. Some customers are reachable via SMS for more urgent contact, but SMS permissions must always be respected.

## Output Specification

Write a TypeScript file `lapsed-segments.ts` that:
- Defines the lapsed segment configuration (the distinct groups, their day thresholds, offer intensity, and eligible channels)
- Implements a function `getLapsedCustomers(segment)` that queries the database and returns matching customers

Also write a short `README.md` explaining the segment definitions (names, day ranges, offer strengths, and channels) in a table.

Assume the following are available via imports:
- `db` from `'./db'` (with `db.customers.findAll(...)`)
- `subDays` from `'date-fns'`
- A `Customer` type from `'./types'`

Do not implement the database layer itself — focus only on the segment configuration and query logic.
