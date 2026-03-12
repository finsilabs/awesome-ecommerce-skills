# Promotions Infrastructure for a Fashion Retailer

## Problem/Feature Description

StyleHub is a fashion e-commerce platform preparing for their biggest promotional calendar of the year: a summer sale that applies to all apparel except their new premium collection, a loyalty-tier discount exclusively for "Gold" and "Platinum" members, a site-wide free-shipping threshold for any order over a certain value, and category-specific deals on accessories with no customer restrictions.

The backend team has been asked to create the database schema and the eligibility filtering logic that determines which cart lines a given rule applies to. The marketing team is particularly anxious about two past incidents: a premium capsule collection accidentally got discounted during last year's sale, and a loyalty reward once applied to a guest checkout. The schema must make it straightforward to prevent both issues. Marketing also wants the flexibility to create rules that apply automatically (no code required) as well as rules gated behind a coupon code.

## Output Specification

Produce a `solution/` directory containing:

- `schema.sql` — DDL statements creating the price rules table (and any supporting tables needed for auditing applied discounts)
- `eligibility.ts` (or `.js`) — a `getEligibleLines` function (and any helpers) that filters a list of cart lines based on a rule's inclusion/exclusion configuration
- `eligibility.test.ts` (or `.test.js`) — test cases covering a variety of rule configurations and cart compositions drawn from the sample data below, including targeting edge cases
- A brief `README.md` describing design decisions

## Input Files

The following sample data can be used as fixtures in your tests. Extract them before beginning.

=============== FILE: inputs/sample-categories.json ===============
{
  "categories": [
    { "id": "cat-apparel", "name": "Apparel" },
    { "id": "cat-accessories", "name": "Accessories" },
    { "id": "cat-premium", "name": "Premium Collection" }
  ],
  "products": [
    { "id": "prod-shirt-001", "name": "Classic T-Shirt", "categoryIds": ["cat-apparel"] },
    { "id": "prod-premium-jacket", "name": "Designer Jacket", "categoryIds": ["cat-apparel", "cat-premium"] },
    { "id": "prod-belt-001", "name": "Leather Belt", "categoryIds": ["cat-accessories"] }
  ]
}
