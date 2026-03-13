# Influencer Campaign ROI Analysis Tool

## Problem/Feature Description

A health supplements brand ran their "Immunity Boost" campaign across 8 influencers last quarter. Now the head of growth wants to understand whether the campaign delivered value, who the top performers were, and whether budget should be shifted for the next campaign. The team has raw post-campaign data (spend per influencer, social metrics, orders, and revenue driven via discount codes) and needs a TypeScript module that computes the standard ROI metrics and surfaces actionable recommendations.

The growth team has been burned before by influencers with huge followings who drove almost no sales — they now want systematic guidance on how to select creators for the next round, including which audience size ranges tend to perform best for e-commerce.

## Output Specification

Produce a TypeScript file called `roi-analysis.ts` that:

1. Defines the data structures for campaign participants and their deliverable metrics (social + commerce)
2. Implements a function that computes campaign-level ROI given an array of participant data, returning the key metrics needed to evaluate whether the campaign paid off and who drove the most value
3. Takes the sample data below and runs the analysis, outputting a `roi-report.json` with the computed metrics

Also produce a `strategy-recommendation.md` (max 300 words) with recommendations for the next campaign, including which influencer tier to prioritize and why, how to prevent attribution loss, and how to structure payment terms to protect against low performers.

## Input Data

The following sample data represents the Immunity Boost campaign results. Extract and use it as input to your analysis:

```json
{
  "campaignName": "Immunity Boost",
  "participants": [
    {
      "id": "p1", "handle": "@vitaldave", "tier": "mega",
      "compensationPaid": 8000,
      "deliverable": { "views": 1200000, "likes": 18000, "comments": 420, "shares": 890, "clicks": 340, "orders": 28, "revenue": 1120 }
    },
    {
      "id": "p2", "handle": "@healthymia", "tier": "macro",
      "compensationPaid": 2000,
      "deliverable": { "views": 280000, "likes": 12400, "comments": 880, "shares": 1200, "clicks": 920, "orders": 74, "revenue": 2960 }
    },
    {
      "id": "p3", "handle": "@wellnessjordan", "tier": "micro",
      "compensationPaid": 500,
      "deliverable": { "views": 62000, "likes": 4100, "comments": 510, "shares": 380, "clicks": 740, "orders": 62, "revenue": 2480 }
    },
    {
      "id": "p4", "handle": "@boostwithalex", "tier": "micro",
      "compensationPaid": 400,
      "deliverable": { "views": 44000, "likes": 3200, "comments": 390, "shares": 290, "clicks": 610, "orders": 55, "revenue": 2200 }
    },
    {
      "id": "p5", "handle": "@immunetips", "tier": "micro",
      "compensationPaid": 450,
      "deliverable": { "views": 51000, "likes": 3600, "comments": 440, "shares": 310, "clicks": 680, "orders": 58, "revenue": 2320 }
    },
    {
      "id": "p6", "handle": "@nanonourish", "tier": "nano",
      "compensationPaid": 150,
      "deliverable": { "views": 7800, "likes": 920, "comments": 180, "shares": 95, "clicks": 210, "orders": 19, "revenue": 760 }
    },
    {
      "id": "p7", "handle": "@fitfuelcoach", "tier": "macro",
      "compensationPaid": 2500,
      "deliverable": { "views": 310000, "likes": 9800, "comments": 560, "shares": 780, "clicks": 480, "orders": 38, "revenue": 1520 }
    },
    {
      "id": "p8", "handle": "@dailyvitals", "tier": "micro",
      "compensationPaid": 480,
      "deliverable": { "views": 58000, "likes": 3900, "comments": 470, "shares": 330, "clicks": 700, "orders": 61, "revenue": 2440 }
    }
  ]
}
```
