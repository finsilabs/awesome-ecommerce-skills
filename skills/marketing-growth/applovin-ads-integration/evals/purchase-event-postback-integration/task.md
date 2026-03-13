# Purchase Event Reporting to AppLovin

## Problem/Feature Description

ShopFast, a mobile commerce startup, is running user acquisition campaigns on AppLovin and needs to report confirmed purchases back to the platform so AppLovin's ROAS optimization algorithm can improve targeting. Their backend is a Node.js/TypeScript service. The team has been told their campaign is underperforming because AppLovin isn't receiving reliable purchase signals, and the growth team suspects the attribution data is either missing or formatted incorrectly.

The engineering team needs to implement a purchase event reporting module that sends confirmed purchase data to AppLovin from the server side. The module should handle multiple device identifier types (since users may or may not have granted tracking permission) and correctly format all required fields. The team also needs a brief technical design note explaining their production architecture decision, since a product manager asked why they're not using a simpler client-side approach.

## Output Specification

Produce the following files:

- `postback.ts` — A TypeScript module exporting a `sendPurchasePostback` function that accepts purchase and user data and sends it to AppLovin
- `architecture-note.md` — A 1-2 paragraph technical decision document explaining the server-side vs client-side tradeoff and the role of an MMP in production attribution at scale
