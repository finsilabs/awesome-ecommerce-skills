# Tiered B2B Discount Function

## Problem/Feature Description

A B2B wholesale supplier has been using Shopify Plus and wants to implement automatic tiered pricing for bulk orders. Their requirement is simple: buyers who add 5 or more units to their cart get a 5% discount, 10+ units get 10%, and 20+ units get 15%. Native Shopify discount rules can't handle quantity-based tiers automatically — each order needs to be evaluated at checkout.

The engineering team has decided to implement this as a Shopify Function so discounts apply instantly during checkout without any manual coupon codes. The Function must be production-ready: it needs to perform well within Shopify's runtime constraints and be configured correctly so it can be deployed and activated. The team is unfamiliar with the Shopify Functions runtime and wants clear documentation of the deployment and activation steps alongside the code.

## Output Specification

Produce the following files:

- `extensions/b2b-tiered-discount/src/index.ts` — the Function source code in TypeScript/JavaScript
- `extensions/b2b-tiered-discount/shopify.extension.toml` — the Function configuration
- `DEPLOYMENT.md` — a brief document describing the steps required to deploy this Function and make it active on a store, including what admin section to use and what action to take after deployment

Do not create a full Shopify app scaffold — just these three files as if they were part of an existing app.
