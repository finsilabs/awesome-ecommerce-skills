# Influencer Campaign Onboarding — Tracking Artifacts Generator

## Problem/Feature Description

A direct-to-consumer skincare brand is scaling its influencer program from ad-hoc spreadsheet management to a structured, code-driven workflow. The marketing ops team has signed three influencers for a "Spring Glow" launch campaign running April 1–30, 2026. Each influencer needs a unique set of campaign tracking artifacts before they can post: a personalized tracking URL to their product page and a unique discount code to share with their audience.

The team needs a TypeScript module that takes an influencer roster and campaign configuration and produces the tracking link and promo code for each influencer. The module should follow the brand's internal conventions for UTM parameter naming and promo code formatting so that downstream analytics pipelines can parse them correctly.

## Output Specification

Produce a TypeScript file `influencer-onboarding.ts` that:
- Defines the necessary data types/interfaces for influencers, campaigns, and UTM parameters
- Implements a function to build a UTM-tracked URL for a given influencer and campaign
- Implements a function to generate (and optionally "create") a promo code for a given influencer and campaign
- Exports a main function or script that processes the three influencers below and writes a JSON summary to `output.json` with each influencer's handle, tracking link, and promo code

The `output.json` file should be an array of objects, one per influencer, with at minimum the fields: `handle`, `trackingLink`, `promoCode`.

Also produce a `promo-details.json` file listing the full promo code configuration for each influencer (all fields that would be passed to the database/promotions system).

## Input Files

The following data describes the campaign and influencer roster. Extract it before beginning.

=============== FILE: inputs/campaign.json ===============
{
  "id": "camp-spring-2026",
  "name": "Spring Glow",
  "platform": "instagram",
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "budget": 4500,
  "discountPct": 15,
  "deliverables": ["1 feed post", "2 stories"],
  "destination": "/collections/spring"
}
=============== FILE: inputs/influencers.json ===============
[
  {
    "id": "inf-001",
    "handle": "@glowwithsophie",
    "platform": "instagram",
    "followerCount": 85000,
    "niche": ["skincare", "wellness"],
    "email": "sophie@example.com",
    "feeStructure": "flat_fee"
  },
  {
    "id": "inf-002",
    "handle": "@thetaradiaries",
    "platform": "instagram",
    "followerCount": 210000,
    "niche": ["beauty", "lifestyle"],
    "email": "tara@example.com",
    "feeStructure": "flat_fee"
  },
  {
    "id": "inf-003",
    "handle": "@skincarebypriya",
    "platform": "instagram",
    "followerCount": 42000,
    "niche": ["skincare", "sustainability"],
    "email": "priya@example.com",
    "feeStructure": "gifted"
  }
]
