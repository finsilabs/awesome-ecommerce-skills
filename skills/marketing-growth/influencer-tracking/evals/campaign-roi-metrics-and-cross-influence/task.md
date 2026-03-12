# Post-Campaign ROI Report Generator

## Problem/Feature Description

A consumer goods brand ran five influencer campaigns over the past quarter — a mix of paid partnerships and gifted product collaborations across micro- and macro-influencers. The head of growth needs a clear picture of which campaigns and influencers actually delivered ROI so she can decide where to invest next season.

The team has exported raw campaign and order data. They need a script that processes this data and produces a structured performance report. The report should go beyond simple revenue totals: it needs metrics that account for the cost of gifted product (not just cash fees), allow fair comparison between an influencer with 800K followers and one with 12K, and include an estimate of the brand-awareness value generated even when direct sales were low. The output should be in a format the growth team can read directly or pass into a spreadsheet.

## Output Specification

Produce a Python or TypeScript script `roi-report.ts` (or `roi-report.py`) that:
- Reads the input data files below
- Computes per-campaign metrics and outputs `campaign-report.json`

`campaign-report.json` should be an array of campaign result objects, one per campaign, each containing at minimum:
- `campaignId`, `influencerHandle`, `platform`, `followerCount`
- `budget`, `revenue`, `ordersCount`, `aov`
- `roas`, `cps`
- `impressions`, `emv`
- `rpm` (revenue per 1,000 followers)
- `attributedRevenue` (from both promo code and UTM-attributed orders)

Also produce a `summary.md` that ranks the campaigns by a metric of your choice and includes a brief (3–5 sentence) narrative interpretation that uses EMV as a secondary consideration for campaigns with low direct conversion.

## Input Files

Extract these files before beginning.

=============== FILE: inputs/campaigns.json ===============
[
  {
    "id": "camp-001",
    "name": "Winter Warmth",
    "influencerId": "inf-A",
    "influencerHandle": "@naturalnora",
    "platform": "instagram",
    "followerCount": 820000,
    "budget": 8000,
    "feeStructure": "flat_fee",
    "impressions": 410000
  },
  {
    "id": "camp-002",
    "name": "Clean Kitchen",
    "influencerId": "inf-B",
    "influencerHandle": "@kitchenbyalex",
    "platform": "tiktok",
    "followerCount": 95000,
    "budget": 1200,
    "feeStructure": "flat_fee",
    "impressions": 280000
  },
  {
    "id": "camp-003",
    "name": "Morning Ritual",
    "influencerId": "inf-C",
    "influencerHandle": "@risewithreena",
    "platform": "instagram",
    "followerCount": 14000,
    "budget": 350,
    "feeStructure": "gifted",
    "impressions": 9800
  },
  {
    "id": "camp-004",
    "name": "Eco Everyday",
    "influencerId": "inf-D",
    "influencerHandle": "@ecowithjamie",
    "platform": "youtube",
    "followerCount": 210000,
    "budget": 3500,
    "feeStructure": "flat_fee",
    "impressions": 67000
  },
  {
    "id": "camp-005",
    "name": "Gifted Glow",
    "influencerId": "inf-E",
    "influencerHandle": "@glowingwithgrace",
    "platform": "instagram",
    "followerCount": 38000,
    "budget": 180,
    "feeStructure": "gifted",
    "impressions": 22000
  }
]
=============== FILE: inputs/orders.json ===============
[
  { "orderId": "ord-001", "campaignId": "camp-001", "subtotalCents": 8900, "attributionType": "utm_first_touch" },
  { "orderId": "ord-002", "campaignId": "camp-001", "subtotalCents": 6500, "attributionType": "promo_code" },
  { "orderId": "ord-003", "campaignId": "camp-001", "subtotalCents": 11200, "attributionType": "utm_first_touch" },
  { "orderId": "ord-004", "campaignId": "camp-002", "subtotalCents": 5400, "attributionType": "promo_code" },
  { "orderId": "ord-005", "campaignId": "camp-002", "subtotalCents": 7800, "attributionType": "promo_code" },
  { "orderId": "ord-006", "campaignId": "camp-002", "subtotalCents": 4200, "attributionType": "utm_first_touch" },
  { "orderId": "ord-007", "campaignId": "camp-002", "subtotalCents": 9100, "attributionType": "promo_code" },
  { "orderId": "ord-008", "campaignId": "camp-003", "subtotalCents": 3300, "attributionType": "promo_code" },
  { "orderId": "ord-009", "campaignId": "camp-003", "subtotalCents": 2800, "attributionType": "utm_first_touch" },
  { "orderId": "ord-010", "campaignId": "camp-004", "subtotalCents": 14500, "attributionType": "utm_first_touch" },
  { "orderId": "ord-011", "campaignId": "camp-004", "subtotalCents": 9800, "attributionType": "promo_code" },
  { "orderId": "ord-012", "campaignId": "camp-005", "subtotalCents": 4100, "attributionType": "promo_code" }
]
