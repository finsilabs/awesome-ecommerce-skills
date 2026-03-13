# Design Google Ads Campaign Architecture for a Growing Ecommerce Brand

## Problem/Feature Description

NovaPet, a direct-to-consumer pet supplies brand, is rebuilding their Google Ads account from scratch after a poor experience with a single catch-all Performance Max campaign that burned through their entire budget on branded searches. They have an established product catalog with a clear margin structure: premium subscription food products (high margin, ~55%) and accessories like toys and bowls (lower margin, ~25%). They launched six weeks ago and have accumulated 42 purchases total in their Google Ads account. Their brand name is "NovaPet."

The head of growth wants a comprehensive campaign architecture document that details exactly how to structure their campaigns, what bidding strategy to use at launch, how to manage the transition to automated bidding as data accumulates, and how to prevent the brand spend cannibalization problem they experienced before. They also want to understand how to configure audience targeting in Performance Max without limiting their reach, and what steps they need to take to make Smart Bidding reliable over time.

## Output Specification

- `campaign-architecture.md` — a detailed document describing the full campaign structure, including:
  - All campaigns with their types, priorities, and initial bidding strategies
  - Asset group organization within PMax
  - Keyword strategy and match types for Search campaigns
  - Negative keyword strategy across campaigns
  - A week-by-week Smart Bidding ramp plan for the first 4 weeks
  - Audience configuration guidance for Performance Max
  - A prioritized checklist of pre-launch steps to ensure Smart Bidding performs well
- `campaign-structure.json` — a machine-readable representation of the campaign hierarchy (campaigns → ad groups/asset groups → bidding settings)
