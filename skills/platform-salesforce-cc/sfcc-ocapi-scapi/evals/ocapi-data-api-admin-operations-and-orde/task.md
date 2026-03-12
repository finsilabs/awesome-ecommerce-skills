# Order Fulfillment Integration

## Problem/Feature Description

A home goods retailer uses Salesforce B2C Commerce Cloud as their commerce platform and has recently contracted a third-party fulfilment warehouse to handle physical order processing. The warehouse system needs to pull new orders from SFCC every few minutes and update order statuses (e.g. "shipped", "cancelled") as fulfilment progresses. This is a server-to-server integration with no customer-facing UI — it runs as a Node.js background service on the retailer's internal infrastructure.

The engineering team has had two problems in production: duplicate orders were created during a brief network outage when the submission script retried without safeguards, and the integration was briefly broken after a security audit forced credential rotation because the client secret had been committed to source control. They want the new implementation to be production-safe from day one.

Write a TypeScript integration module that the fulfillment service can use to interact with SFCC orders. Also include a `FULFILLMENT_SETUP.md` that describes what permissions the SFCC OCAPI client ID needs and what environment variables must be configured.

## Output Specification

Produce the following files:

- `lib/fulfillment.ts` — Integration module with at minimum:
  - `getPendingOrders()` — retrieve orders in "new" or "open" status ready for fulfilment
  - `updateOrderStatus(orderNo, status)` — update the fulfilment status of an order
  - `submitOrder(basketId)` — submit a basket as an order, protected against duplicate submission
- `lib/sfcc-admin-auth.ts` — Admin authentication helper for obtaining and caching the admin access token
- `FULFILLMENT_SETUP.md` — Setup guide covering required OCAPI client permissions, environment variable names, and any configuration notes

Use TypeScript. Assume the following environment variables will be configured in the deployment environment (do not hardcode their values):
- `SFCC_OCAPI_CLIENT_ID`
- `SFCC_OCAPI_CLIENT_SECRET`
- `SFCC_INSTANCE_URL` — the SFCC instance hostname (e.g. `https://xxxx.dx.commercecloud.salesforce.com`)
- `SFCC_SITE_ID`
