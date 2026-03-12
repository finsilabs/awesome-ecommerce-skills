# First-Party Marketing Touchpoint Tracking

## Problem/Feature Description

A direct-to-consumer skincare brand has been relying on Meta Pixel and Google Tag to measure ad performance, but since iOS 14+ tracking changes gutted their conversion visibility, their reported ROAS from ad dashboards has dropped dramatically even though actual orders haven't. The engineering team has decided to move to a fully server-side, first-party attribution system based on UTM parameters.

They need two pieces of server-side TypeScript code: (1) a client-side function that fires on page load to record a marketing touchpoint when the user arrives via a tracked link, and (2) a server-side function that, when an order is placed, assembles the full conversion path for that order by fetching the user's historical touchpoints and persisting it.

The client-side capture must handle Google Ads, Meta Ads, and standard UTM-tagged campaigns. The conversion path builder must correctly resolve anonymous visitors (who may have browsed before logging in) to their orders.

## Output Specification

Produce a TypeScript file `tracking.ts` containing:
1. The client-side touchpoint capture function
2. The TypeScript type/interface definition for a marketing touchpoint
3. The server-side conversion path builder function

Also produce a short `design-notes.md` explaining:
- How anonymous visitors are tracked and linked to orders
- What data retention approach is recommended and why

## Input Files

No input files required — implement the tracking system from scratch.
