# Email Segment Sync Service for Klaviyo

## Problem Description

A growing DTC (direct-to-consumer) apparel brand uses Klaviyo as their email service provider. They have recently built an internal segmentation database that classifies subscribers by purchase behavior and email engagement, and now need to keep Klaviyo's list management in sync with their internal data.

Currently, their segments in Klaviyo are stale because updates only happen manually. Campaigns are going to the wrong audiences: lapsed customers are receiving retention emails meant for active buyers, and the internal team cannot trust the Klaviyo segment counts when planning campaigns. Additionally, several customers have complained that they received emails after opting out, because the unsubscribe event was only reflected in Klaviyo the following night during a bulk sync.

The engineering team wants a TypeScript service that:
1. Pushes their classified subscriber lists to Klaviyo on a regular automated schedule so segments stay current
2. Also updates Klaviyo immediately when specific real-time events occur (like a customer completing an order or opting out)

The solution should be built to handle their list size of up to 80,000 subscribers efficiently, and must respect Klaviyo's API constraints.

## Output Specification

Produce:

- `klaviyo-sync.ts` — the sync service implementation including scheduled sync and event-triggered sync functions
- `webhook-handler.ts` — an HTTP handler (Express route or equivalent) that processes incoming ESP/platform webhook events and triggers the appropriate sync actions
- `README.md` — brief explanation of how to configure and run the service, including required environment variables and schedule

The service should use the following pre-classified subscriber data. Extract the input file before beginning.

=============== FILE: inputs/classified-subscribers.json ===============
[
  { "email": "alice@example.com", "rfmSegment": "champions", "engagementTier": "champion", "openRate": 0.75, "totalRevenue": 1450.00, "avgOrderValue": 120.83, "orderCount": 12, "tags": ["frequent-buyer", "high-aov"], "marketingConsent": true, "unsubscribedAt": null },
  { "email": "bob@example.com", "rfmSegment": "new-customers", "engagementTier": "active", "openRate": 0.20, "totalRevenue": 85.00, "avgOrderValue": 85.00, "orderCount": 1, "tags": ["new-subscriber-30d"], "marketingConsent": true, "unsubscribedAt": null },
  { "email": "claire@example.com", "rfmSegment": "loyal", "engagementTier": "active", "openRate": 0.18, "totalRevenue": 620.00, "avgOrderValue": 88.57, "orderCount": 7, "tags": ["category-apparel"], "marketingConsent": true, "unsubscribedAt": null },
  { "email": "david@example.com", "rfmSegment": "at-risk", "engagementTier": "at-risk", "openRate": 0.10, "totalRevenue": 540.00, "avgOrderValue": 90.00, "orderCount": 6, "tags": ["sale-shopper"], "marketingConsent": true, "unsubscribedAt": null },
  { "email": "eva@example.com", "rfmSegment": "cant-lose", "engagementTier": "dormant", "openRate": 0.05, "totalRevenue": 3200.00, "avgOrderValue": 213.33, "orderCount": 15, "tags": ["high-aov", "frequent-buyer"], "marketingConsent": true, "unsubscribedAt": null },
  { "email": "frank@example.com", "rfmSegment": "hibernating", "engagementTier": "unengaged", "openRate": 0.01, "totalRevenue": 45.00, "avgOrderValue": 22.50, "orderCount": 2, "tags": [], "marketingConsent": true, "unsubscribedAt": null },
  { "email": "grace@example.com", "rfmSegment": "potential-loyal", "engagementTier": "active", "openRate": 0.22, "totalRevenue": 310.00, "avgOrderValue": 103.33, "orderCount": 3, "tags": ["review-submitter"], "marketingConsent": true, "unsubscribedAt": null },
  { "email": "henry@example.com", "rfmSegment": "champions", "engagementTier": "champion", "openRate": 0.80, "totalRevenue": 880.00, "avgOrderValue": 97.78, "orderCount": 9, "tags": ["frequent-buyer", "mobile-opener"], "marketingConsent": true, "unsubscribedAt": null }
]
