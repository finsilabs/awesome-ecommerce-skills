# Automated Order Fulfillment Service

## Problem/Feature Description

A Shopify merchant runs a small warehouse operation. When orders are picked and packed, warehouse staff scan a barcode to generate a tracking number and want the system to automatically mark the corresponding Shopify order as fulfilled and notify the customer. Currently they do this manually through the Shopify admin dashboard, which is slow and error-prone.

You need to build a Node.js TypeScript module that can be called by the warehouse's internal system to fulfill a Shopify order given its numeric order ID and a tracking number. The module should look up any unfulfilled orders, and for a given order mark it as fulfilled with the provided tracking number. The merchant has a custom Shopify app with a static Admin API access token — there is no OAuth flow involved. The implementation needs to be production-quality: it should handle cases where the operation fails gracefully, including surface errors back to the caller clearly.

## Output Specification

Produce a TypeScript module (`fulfill-order.ts`) that exports:
- A function `fulfillOrder(orderId: string, trackingNumber: string, trackingCompany: string): Promise<void>` that marks a Shopify order as fulfilled

Also produce a `demo.ts` script that demonstrates calling `fulfillOrder` with a sample order ID (e.g. `"5678901234"`) and tracking details, printing success or error to the console. The demo should use environment variables for credentials (`SHOPIFY_ADMIN_API_TOKEN`, `SHOPIFY_SHOP`).

Include a `package.json` with the necessary dependencies.
