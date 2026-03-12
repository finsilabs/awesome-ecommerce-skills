# Marketing Attribution Engine

## Problem/Feature Description

The growth team at a mid-size e-commerce company has been running campaigns across Google Ads, Meta, email newsletters, and affiliate partners for the past quarter. The head of marketing is frustrated: the Google Ads dashboard claims $120K in revenue, the Meta dashboard claims $95K, and the email platform claims $80K — yet total store revenue was only $150K. Every channel is overclaiming because they each use last-click attribution internally.

The team needs a TypeScript attribution engine that processes historical conversion path data and produces channel-level revenue reports under different attribution models. The goal is to produce a side-by-side comparison showing how each channel's attributed revenue changes depending on the model used, so the team can have an informed discussion about budget allocation.

You have been provided with a JSON file containing sample conversion path data. Build the attribution logic, compute the results under each supported model, and produce a comparison report. The comparison should specifically highlight channels where different models disagree the most.

## Output Specification

Produce a TypeScript implementation file `attribution.ts` that:
- Defines the relevant TypeScript types
- Implements all supported attribution model functions
- Implements a channel aggregation function
- Implements a multi-model comparison function that returns per-channel revenue under each model and identifies the largest discrepancies

Also produce a `results.json` file with the actual computed attribution output when run against the provided sample data. Run the code against the input data and save the output.

Include a `run.sh` script that shows how to execute the code.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/conversion_paths.json ===============
[
  {
    "orderId": "ord-001",
    "orderRevenue": 120.00,
    "touchpoints": [
      { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-10T09:00:00Z" },
      { "source": "email", "medium": "newsletter", "campaign": "spring-sale", "touchedAt": "2026-02-15T14:00:00Z" },
      { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-18T10:00:00Z" }
    ]
  },
  {
    "orderId": "ord-002",
    "orderRevenue": 85.50,
    "touchpoints": [
      { "source": "meta", "medium": "paid_social", "campaign": "retargeting", "touchedAt": "2026-02-12T11:00:00Z" },
      { "source": "meta", "medium": "paid_social", "campaign": "retargeting", "touchedAt": "2026-02-19T16:00:00Z" }
    ]
  },
  {
    "orderId": "ord-003",
    "orderRevenue": 200.00,
    "touchpoints": [
      { "source": "affiliate", "medium": "referral", "campaign": "partner-a", "touchedAt": "2026-01-20T08:00:00Z" },
      { "source": "google", "medium": "cpc", "campaign": "non-brand", "touchedAt": "2026-02-01T12:00:00Z" },
      { "source": "email", "medium": "newsletter", "campaign": "spring-sale", "touchedAt": "2026-02-10T09:00:00Z" },
      { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-19T15:00:00Z" }
    ]
  },
  {
    "orderId": "ord-004",
    "orderRevenue": 55.00,
    "touchpoints": []
  },
  {
    "orderId": "ord-005",
    "orderRevenue": 310.00,
    "touchpoints": [
      { "source": "influencer", "medium": "social", "campaign": "collab-jan", "touchedAt": "2026-02-05T10:00:00Z" },
      { "source": "email", "medium": "newsletter", "campaign": "spring-sale", "touchedAt": "2026-02-14T08:00:00Z" },
      { "source": "meta", "medium": "paid_social", "campaign": "retargeting", "touchedAt": "2026-02-19T20:00:00Z" }
    ]
  },
  {
    "orderId": "ord-006",
    "orderRevenue": 75.00,
    "touchpoints": [
      { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-18T11:00:00Z" }
    ]
  },
  {
    "orderId": "ord-007",
    "orderRevenue": 145.00,
    "touchpoints": [
      { "source": "organic", "medium": "search", "campaign": "(none)", "touchedAt": "2026-02-08T14:00:00Z" },
      { "source": "email", "medium": "newsletter", "campaign": "spring-sale", "touchedAt": "2026-02-16T10:00:00Z" },
      { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-20T09:00:00Z" }
    ]
  }
]
