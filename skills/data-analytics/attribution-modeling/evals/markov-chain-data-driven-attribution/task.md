# Data-Driven Channel Attribution for High-Volume Store

## Problem/Feature Description

A large e-commerce retailer processes tens of thousands of orders per month and has accumulated over two years of server-side UTM touchpoint data. Their current rule-based attribution reports have a known problem: email consistently appears to get almost zero credit because most email-attributed journeys end with a branded Google search click, so last-click assigns everything to paid search. The analytics team suspects email is being dramatically undervalued in the budget planning process.

The team wants to move to a probabilistic model that infers each channel's true contribution to conversions based on historical path patterns rather than arbitrary rules. They need a TypeScript implementation of this model, along with a validation report that compares the probabilistic model's channel revenue allocations against the rule-based models to quantify the discrepancy.

The comparison report should also verify data integrity by checking whether the total attributed revenue matches actual revenue.

## Output Specification

Produce a TypeScript file `markov_attribution.ts` containing:
1. A function to build a transition probability matrix from an array of conversion paths
2. A function to calculate each channel's contribution score based on its counterfactual impact on the overall conversion rate
3. A comparison function that runs both the probabilistic model and the rule-based models, producing a unified report

Produce a `report.json` file with the computed results run against the provided sample data, including the comparison between models and the revenue integrity check.

Include a `README.md` that documents when this model is appropriate to use vs. rule-based models.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/paths.json ===============
[
  { "orderId": "o-001", "orderRevenue": 150.00, "touchpoints": [
    { "source": "google", "medium": "cpc", "campaign": "awareness", "touchedAt": "2026-01-15T08:00:00Z" },
    { "source": "email", "medium": "newsletter", "campaign": "promo-feb", "touchedAt": "2026-02-01T10:00:00Z" },
    { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-10T14:00:00Z" }
  ]},
  { "orderId": "o-002", "orderRevenue": 220.00, "touchpoints": [
    { "source": "meta", "medium": "paid_social", "campaign": "prospecting", "touchedAt": "2026-01-20T09:00:00Z" },
    { "source": "email", "medium": "newsletter", "campaign": "promo-feb", "touchedAt": "2026-02-03T11:00:00Z" },
    { "source": "meta", "medium": "paid_social", "campaign": "retargeting", "touchedAt": "2026-02-12T16:00:00Z" }
  ]},
  { "orderId": "o-003", "orderRevenue": 90.00, "touchpoints": [
    { "source": "email", "medium": "newsletter", "campaign": "promo-feb", "touchedAt": "2026-02-02T08:30:00Z" },
    { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-09T11:00:00Z" }
  ]},
  { "orderId": "o-004", "orderRevenue": 175.00, "touchpoints": [
    { "source": "organic", "medium": "search", "campaign": "(none)", "touchedAt": "2026-01-25T13:00:00Z" },
    { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-11T10:00:00Z" }
  ]},
  { "orderId": "o-005", "orderRevenue": 310.00, "touchpoints": [
    { "source": "affiliate", "medium": "referral", "campaign": "partner-b", "touchedAt": "2026-01-18T07:00:00Z" },
    { "source": "email", "medium": "newsletter", "campaign": "promo-feb", "touchedAt": "2026-02-04T09:00:00Z" },
    { "source": "affiliate", "medium": "referral", "campaign": "partner-b", "touchedAt": "2026-02-13T15:00:00Z" }
  ]},
  { "orderId": "o-006", "orderRevenue": 65.00, "touchpoints": [
    { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-14T10:00:00Z" }
  ]},
  { "orderId": "o-007", "orderRevenue": 400.00, "touchpoints": [
    { "source": "influencer", "medium": "social", "campaign": "macro-collab", "touchedAt": "2026-01-10T12:00:00Z" },
    { "source": "meta", "medium": "paid_social", "campaign": "retargeting", "touchedAt": "2026-02-05T14:00:00Z" },
    { "source": "email", "medium": "newsletter", "campaign": "promo-feb", "touchedAt": "2026-02-08T08:00:00Z" },
    { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-15T16:00:00Z" }
  ]},
  { "orderId": "o-008", "orderRevenue": 130.00, "touchpoints": [
    { "source": "email", "medium": "newsletter", "campaign": "promo-feb", "touchedAt": "2026-02-06T10:00:00Z" },
    { "source": "google", "medium": "cpc", "campaign": "non-brand", "touchedAt": "2026-02-13T12:00:00Z" }
  ]},
  { "orderId": "o-009", "orderRevenue": 88.00, "touchpoints": [
    { "source": "meta", "medium": "paid_social", "campaign": "prospecting", "touchedAt": "2026-01-28T11:00:00Z" },
    { "source": "google", "medium": "cpc", "campaign": "brand", "touchedAt": "2026-02-16T09:00:00Z" }
  ]},
  { "orderId": "o-010", "orderRevenue": 55.00, "touchpoints": [] }
]
