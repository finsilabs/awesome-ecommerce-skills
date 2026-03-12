# Influencer Attribution — Client & Server Implementation

## Problem/Feature Description

A fashion e-commerce startup has been running influencer campaigns but their analytics show nearly zero attributed revenue because they only use last-click attribution. The real purchase path for influencer-driven customers typically looks like this: a user taps an Instagram story link, browses, leaves, and returns two days later directly to buy. By that point, the UTM parameters are gone and the influencer gets no credit.

The engineering team needs two pieces of code: a client-side JavaScript snippet that runs on every page load to reliably capture the initial influencer visit, and a server-side TypeScript function that runs at checkout to attribute the order to the correct influencer campaign. The attribution logic must handle the case where the customer used a promo code (which may have come from a different influencer than the one they clicked) and the case where they never used a code at all.

## Output Specification

Produce two files:

1. `client-attribution.js` — A browser-side script (plain JS, no build step) with a function that should be called on every page load. The function reads URL query parameters and persists UTM data in browser storage so that it remains available at checkout time, even if the customer navigates away and returns later.

2. `server-attribution.ts` — A TypeScript module exporting an async function `captureOrderInfluencerAttribution(orderId, request)` that runs at order placement. It should resolve which influencer campaign deserves credit and write an attribution record. Include a `db` stub object and a type for the request so the file is self-contained and illustrates the logic clearly.

Add a `ATTRIBUTION_NOTES.md` explaining the attribution strategy — which signals are used, how conflicts between them are resolved, and why this approach handles multi-session purchase journeys correctly.
