# Pre-Campaign Audience Validation System

## Problem Description

A fashion ecommerce brand is launching a 20%-off storewide sale and wants to send the promotional email to their most engaged subscribers. Their list has grown organically over several years and contains a mix of highly loyal customers, occasional shoppers, and contacts who have not interacted in years. The brand also has European customers, which introduces GDPR obligations they must respect.

Before the campaign goes out, the marketing operations team needs a script that takes the full subscriber list and the proposed target segment and produces a clean, validated send list. In past campaigns, they accidentally emailed contacts who had unsubscribed, triggered spam filters due to sending to disengaged contacts, and received GDPR complaints from EU customers whose consent records were not properly validated. They also discovered that their most valuable loyal customers started holding off purchases until promotional emails arrived — a problem they want to avoid repeating.

The team needs a TypeScript (or JavaScript) module that validates and cleans a proposed campaign audience before delivery. It should produce a report showing how many contacts were removed and why, and the final list of addresses approved for sending.

## Output Specification

Produce:

- `campaign-validator.ts` (or `.js`) — the validation module with the core logic
- `validation-report.json` — output when the module is run against the provided input, showing suppression counts by reason and the final approved address list (or count)

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/subscribers.json ===============
[
  { "email": "alice@example.com", "rfmSegment": "champions", "engagementTier": "champion", "openRate": 0.75, "lastOpenDate": "2026-03-10", "lastClickDate": "2026-03-08", "totalSent": 24, "marketingConsent": true, "unsubscribedAt": null, "bounced": false, "spamComplaint": false, "gdprLawfulBasis": "consent", "region": "EU" },
  { "email": "bob@example.com", "rfmSegment": "new-customers", "engagementTier": "active", "openRate": 0.20, "lastOpenDate": "2026-03-01", "lastClickDate": null, "totalSent": 3, "marketingConsent": true, "unsubscribedAt": null, "bounced": false, "spamComplaint": false, "gdprLawfulBasis": null, "region": "US" },
  { "email": "claire@example.com", "rfmSegment": "loyal", "engagementTier": "active", "openRate": 0.18, "lastOpenDate": "2026-02-20", "lastClickDate": "2026-02-15", "totalSent": 30, "marketingConsent": true, "unsubscribedAt": null, "bounced": false, "spamComplaint": false, "gdprLawfulBasis": "consent", "region": "EU" },
  { "email": "david@example.com", "rfmSegment": "potential-loyal", "engagementTier": "active", "openRate": 0.22, "lastOpenDate": "2026-02-10", "lastClickDate": "2026-02-05", "totalSent": 15, "marketingConsent": true, "unsubscribedAt": null, "bounced": false, "spamComplaint": false, "gdprLawfulBasis": "legitimate-interest", "region": "EU" },
  { "email": "eva@example.com", "rfmSegment": "hibernating", "engagementTier": "unengaged", "openRate": 0.00, "lastOpenDate": null, "lastClickDate": null, "totalSent": 10, "marketingConsent": true, "unsubscribedAt": null, "bounced": false, "spamComplaint": false, "gdprLawfulBasis": null, "region": "US" },
  { "email": "frank@example.com", "rfmSegment": "cant-lose", "engagementTier": "dormant", "openRate": 0.05, "lastOpenDate": "2025-06-01", "lastClickDate": null, "totalSent": 40, "marketingConsent": true, "unsubscribedAt": null, "bounced": false, "spamComplaint": false, "gdprLawfulBasis": null, "region": "US" },
  { "email": "grace@example.com", "rfmSegment": "at-risk", "engagementTier": "at-risk", "openRate": 0.10, "lastOpenDate": "2025-11-20", "lastClickDate": null, "totalSent": 20, "marketingConsent": false, "unsubscribedAt": null, "bounced": false, "spamComplaint": false, "gdprLawfulBasis": null, "region": "US" },
  { "email": "henry@example.com", "rfmSegment": "loyal", "engagementTier": "champion", "openRate": 0.80, "lastOpenDate": "2026-03-05", "lastClickDate": "2026-03-04", "totalSent": 20, "marketingConsent": true, "unsubscribedAt": null, "bounced": false, "spamComplaint": false, "gdprLawfulBasis": "consent", "region": "EU" },
  { "email": "irene@example.com", "rfmSegment": "lost", "engagementTier": "unengaged", "openRate": 0.02, "lastOpenDate": "2024-01-01", "lastClickDate": null, "totalSent": 8, "marketingConsent": true, "unsubscribedAt": "2025-05-01", "bounced": false, "spamComplaint": false, "gdprLawfulBasis": null, "region": "US" },
  { "email": "james@example.com", "rfmSegment": "potential-loyal", "engagementTier": "active", "openRate": 0.35, "lastOpenDate": "2026-03-01", "lastClickDate": "2026-02-25", "totalSent": 18, "marketingConsent": true, "unsubscribedAt": null, "bounced": true, "spamComplaint": false, "gdprLawfulBasis": null, "region": "US" },
  { "email": "kate@example.com", "rfmSegment": "hibernating", "engagementTier": "unengaged", "openRate": 0.01, "lastOpenDate": "2023-12-01", "lastClickDate": null, "totalSent": 50, "marketingConsent": true, "unsubscribedAt": null, "bounced": false, "spamComplaint": true, "gdprLawfulBasis": null, "region": "US" },
  { "email": "liam@example.com", "rfmSegment": "champions", "engagementTier": "champion", "openRate": 0.65, "lastOpenDate": "2026-03-11", "lastClickDate": "2026-03-10", "totalSent": 22, "marketingConsent": true, "unsubscribedAt": null, "bounced": false, "spamComplaint": false, "gdprLawfulBasis": "consent", "region": "EU" }
]

=============== FILE: inputs/campaign.json ===============
{
  "name": "Spring Sale 20% Off",
  "type": "promotional_discount",
  "targetSegments": ["champions", "loyal", "potential-loyal", "active"],
  "targetRegions": ["US", "EU"]
}
