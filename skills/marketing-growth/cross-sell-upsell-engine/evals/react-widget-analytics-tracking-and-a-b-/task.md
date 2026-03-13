# Recommendation Widget with Experiment Tracking

## Problem/Feature Description

A home goods retailer has a working recommendation API and wants to roll out a React-based recommendation widget across their storefront. The growth team also wants to run a structured experiment comparing different recommendation algorithms (affinity-based vs. trending) against a control group. To make the experiment trustworthy, they need consistent assignment — a customer who sees "affinity" recommendations on Monday should still be in the affinity group on Friday, regardless of which device or browser session they use.

The data team has a separate concern: when a customer adds a recommended product to their cart, they need to know *which algorithm* drove that add, *where on the page* the widget was positioned, and *which products were shown alongside it*. This attribution data is essential to calculate whether the recommendation program is actually growing incremental revenue rather than just capturing purchases that would have happened anyway.

## Output Specification

Produce the following files:

1. `CrossSellWidget.tsx` — a React component that fetches and renders recommendations
2. `ab-testing.ts` — a module with a function that assigns a customer to an experiment variant
3. `analytics.ts` — a module with a function that fires the add-to-cart tracking event
4. `widget-notes.md` — brief notes covering:
   - How the widget handles loading states and empty results
   - What data is captured in the add-to-cart event and why
   - How A/B variant assignment works and why it's designed that way

## Input Files

No additional files are provided. Use standard React patterns and assume SWR is available as a dependency.
