# Subscriber RFM Scoring Engine

## Problem Description

A mid-size ecommerce retailer has grown their email list to 80,000 subscribers across several countries and currencies, but all campaigns currently go to the entire list. Their email deliverability has been declining and their marketing team suspects they are sending irrelevant content to disengaged subscribers while also over-messaging their most loyal customers.

The engineering team has been asked to build a TypeScript module that takes raw subscriber and order data and classifies each subscriber into a meaningful segment based on their purchase behavior. The module will run as a nightly job to keep segments fresh. A key challenge is that the store operates in USD, EUR, and GBP, so revenue figures in the source data may be in different currencies and must be handled consistently before any value-based classification is applied.

The team wants the classification logic captured as reusable TypeScript functions so it can be reviewed, tested, and integrated into their existing Node.js backend. No specific algorithm is mandated in the brief — use whatever approach produces well-calibrated, fair segmentation across the subscriber population.

## Output Specification

Produce a TypeScript implementation file `rfm-scoring.ts` that:

- Defines the subscriber data model as a TypeScript type or interface
- Implements the scoring and segment classification functions
- Exports a main function (e.g. `computeRfmSegments`) that processes an array of subscriber records and returns classified results
- Includes a brief `README.md` explaining the scoring approach, how multi-currency input is handled, and how/when the job should be scheduled

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/subscribers.json ===============
[
  { "email": "alice@example.com", "customerId": "C001", "orderCount": 12, "totalRevenue": 1450.00, "currency": "USD", "lastOrderDate": "2026-02-15", "totalSent": 24, "totalOpened": 18, "totalClicked": 10, "lastOpenDate": "2026-02-20", "lastClickDate": "2026-02-18", "subscribedAt": "2024-01-10", "marketingConsent": true },
  { "email": "bob@example.com", "customerId": "C002", "orderCount": 1, "totalRevenue": 85.00, "currency": "USD", "lastOrderDate": "2026-02-28", "totalSent": 5, "totalOpened": 1, "totalClicked": 0, "lastOpenDate": "2026-02-28", "lastClickDate": null, "subscribedAt": "2026-02-01", "marketingConsent": true },
  { "email": "claire@example.com", "customerId": "C003", "orderCount": 7, "totalRevenue": 620.00, "currency": "EUR", "lastOrderDate": "2025-09-10", "totalSent": 30, "totalOpened": 6, "totalClicked": 1, "lastOpenDate": "2025-10-01", "lastClickDate": "2025-09-15", "subscribedAt": "2023-06-01", "marketingConsent": true },
  { "email": "david@example.com", "customerId": "C004", "orderCount": 3, "totalRevenue": 210.00, "currency": "GBP", "lastOrderDate": "2025-12-01", "totalSent": 15, "totalOpened": 4, "totalClicked": 1, "lastOpenDate": "2025-12-10", "lastClickDate": "2025-12-10", "subscribedAt": "2024-04-20", "marketingConsent": true },
  { "email": "eva@example.com", "customerId": "C005", "orderCount": 0, "totalRevenue": 0, "currency": "USD", "lastOrderDate": null, "totalSent": 10, "totalOpened": 0, "totalClicked": 0, "lastOpenDate": null, "lastClickDate": null, "subscribedAt": "2025-01-15", "marketingConsent": true },
  { "email": "frank@example.com", "customerId": "C006", "orderCount": 15, "totalRevenue": 3200.00, "currency": "USD", "lastOrderDate": "2024-06-01", "totalSent": 40, "totalOpened": 35, "totalClicked": 20, "lastOpenDate": "2024-06-10", "lastClickDate": "2024-06-10", "subscribedAt": "2022-01-01", "marketingConsent": true },
  { "email": "grace@example.com", "customerId": "C007", "orderCount": 2, "totalRevenue": 95.00, "currency": "GBP", "lastOrderDate": "2026-01-20", "totalSent": 8, "totalOpened": 5, "totalClicked": 3, "lastOpenDate": "2026-02-10", "lastClickDate": "2026-02-10", "subscribedAt": "2025-11-01", "marketingConsent": true },
  { "email": "henry@example.com", "customerId": "C008", "orderCount": 9, "totalRevenue": 880.00, "currency": "EUR", "lastOrderDate": "2026-03-01", "totalSent": 20, "totalOpened": 16, "totalClicked": 9, "lastOpenDate": "2026-03-05", "lastClickDate": "2026-03-04", "subscribedAt": "2023-09-15", "marketingConsent": true },
  { "email": "irene@example.com", "customerId": "C009", "orderCount": 4, "totalRevenue": 320.00, "currency": "USD", "lastOrderDate": "2025-07-14", "totalSent": 22, "totalOpened": 3, "totalClicked": 0, "lastOpenDate": "2025-08-01", "lastClickDate": null, "subscribedAt": "2024-05-10", "marketingConsent": false },
  { "email": "james@example.com", "customerId": "C010", "orderCount": 6, "totalRevenue": 540.00, "currency": "USD", "lastOrderDate": "2025-11-20", "totalSent": 18, "totalOpened": 7, "totalClicked": 2, "lastOpenDate": "2025-12-01", "lastClickDate": "2025-11-25", "subscribedAt": "2023-12-01", "marketingConsent": true }
]
