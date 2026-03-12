# Automated Collection Page Ranking

## Problem/Feature Description

A fashion retailer's merchandising team currently sorts their online collection pages manually, which is time-consuming and inconsistent. They want to automate the ranking so that the best-performing products appear first. "Best-performing" means a combination of signals: how well a product sells through its inventory, how well its product page converts visitors, how strongly it contributes to revenue, how customers rate it, whether it has healthy stock levels, and whether it's generating returns that erode margins.

The team has been debating how to weight these signals. After internal discussion, they've aligned on specific weights and normalisation formulas that balance short-term revenue signals with longer-term product health indicators. They now need a developer to implement the scoring function and apply it to their current product catalog snapshot so they can validate the output before plugging it into the collection page service.

## Output Specification

Write a TypeScript file (`score_products.ts`) that:

1. Implements a `calculateMerchandisingScore` function accepting a product's performance inputs.
2. Applies the scoring to the product data provided below.
3. Writes the results to `ranked_products.json` — a JSON array of products sorted from highest to lowest score, each entry including: productId, productName, score (rounded to 2 decimal places), and the individual normalised dimension scores.

The script must be runnable with `npx ts-node score_products.ts`.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/product_performance.json ===============
[
  {
    "productId": "A001",
    "productName": "Classic Denim Jacket",
    "sellThroughPct": 72,
    "pdpConversionPct": 3.8,
    "revenueRank": 3,
    "reviewScore": 4.6,
    "daysOnHand": 45,
    "returnsRate": 8
  },
  {
    "productId": "A002",
    "productName": "Oversized Graphic Tee",
    "sellThroughPct": 88,
    "pdpConversionPct": 6.2,
    "revenueRank": 1,
    "reviewScore": 4.2,
    "daysOnHand": 20,
    "returnsRate": 5
  },
  {
    "productId": "A003",
    "productName": "Pleated Wide-Leg Trousers",
    "sellThroughPct": 31,
    "pdpConversionPct": 1.1,
    "revenueRank": 18,
    "reviewScore": 3.8,
    "daysOnHand": -5,
    "returnsRate": 22
  },
  {
    "productId": "A004",
    "productName": "Linen Summer Blazer",
    "sellThroughPct": 55,
    "pdpConversionPct": 2.5,
    "revenueRank": 7,
    "reviewScore": 4.4,
    "daysOnHand": 90,
    "returnsRate": 12
  },
  {
    "productId": "A005",
    "productName": "Ribbed Knit Midi Dress",
    "sellThroughPct": 93,
    "pdpConversionPct": 5.0,
    "revenueRank": 2,
    "reviewScore": 4.8,
    "daysOnHand": 8,
    "returnsRate": 3
  },
  {
    "productId": "A006",
    "productName": "Faux Leather Biker Shorts",
    "sellThroughPct": 19,
    "pdpConversionPct": 0.7,
    "revenueRank": 25,
    "reviewScore": 3.1,
    "daysOnHand": 0,
    "returnsRate": 30
  },
  {
    "productId": "A007",
    "productName": "Tailored Wool Coat",
    "sellThroughPct": 61,
    "pdpConversionPct": 4.2,
    "revenueRank": 5,
    "reviewScore": 4.7,
    "daysOnHand": 60,
    "returnsRate": 6
  },
  {
    "productId": "A008",
    "productName": "Vintage Wash Cargo Pants",
    "sellThroughPct": 44,
    "pdpConversionPct": 1.8,
    "revenueRank": 12,
    "reviewScore": 3.9,
    "daysOnHand": 110,
    "returnsRate": 18
  }
]
