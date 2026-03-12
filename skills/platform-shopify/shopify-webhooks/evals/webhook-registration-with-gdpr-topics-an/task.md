# Shopify App Webhook Registration Setup

## Problem/Feature Description

A startup is launching a Shopify app in the App Store. The app needs to react to events across the merchant's store: when orders are placed (to trigger their fulfillment pipeline), when products are updated (to sync with their inventory system), and when a merchant uninstalls the app (to clean up stored data). Legal has also flagged that the app must comply with Shopify's data privacy requirements before the app can go live.

The engineering team has a working OAuth flow but the webhook subscriptions aren't being set up reliably — especially after merchants reinstall the app. Merchants who reinstall the app are not getting their events delivered, and in one case a merchant's uninstall event was never received, leaving orphaned data in the database. You need to write the webhook registration logic that runs after each OAuth completion.

## Output Specification

Produce the following files:

- `src/webhooks/register.ts` — A TypeScript module exporting a `registerWebhooks(adminClient, appUrl)` function that registers all required webhook subscriptions via the Shopify Admin GraphQL API.
- `src/webhooks/handlers/gdpr.ts` — A TypeScript module containing Express route handlers for all required GDPR endpoints.
- `README.md` — A brief explanation of where `registerWebhooks` should be called and how GDPR endpoints should be mounted.
