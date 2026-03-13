# Server-Side Purchase Tracking for Ecommerce Platform

## Problem Description

A mid-sized ecommerce company recently migrated to a headless storefront. Their marketing team has noticed that reported purchase conversions in Meta Ads Manager have dropped by roughly 40% compared to their previous platform — a known issue after iOS 14 privacy changes that caused browsers to block or restrict tracking pixels.

The engineering team needs to implement server-side purchase tracking that fires from the backend when an order is confirmed. The company already uses Node.js/TypeScript on their backend. They have a `META_CAPI_ACCESS_TOKEN` and `META_PIXEL_ID` available as environment variables. The backend receives a webhook payload when an order is paid, containing the customer details, shipping address, order line items, and request metadata.

Your task is to write the server-side CAPI integration module and the webhook handler that uses it. The solution should send reliable purchase signals from the server that Meta's algorithm can use for optimization, using the strongest available identity signals to maximize attribution quality.

## Output Specification

Produce the following files:

- `capi-client.ts` — A reusable CAPI client module that initializes the Meta SDK and exposes a `sendCapiEvent` function
- `purchase-webhook.ts` — A webhook handler function (`trackPurchaseCapi`) that calls the CAPI client when an order is paid
- `package.json` — Package manifest listing the required dependencies

The implementation should be production-quality TypeScript. Include comments explaining key decisions.

## Input Files

The following type definitions describe the data available in the webhook handler. Extract them before beginning.

=============== FILE: types.ts ===============
export interface Order {
  id: string;
  subtotal: number;         // order subtotal before tax and shipping
  totalWithTax: number;     // full amount including tax and shipping
  currencyCode: string;
  customerEmail: string;
  customerPhone?: string;
  customerFirstName: string;
  customerLastName: string;
  shippingAddress?: {
    zip?: string;
    countryCode?: string;
  };
  lineItems: Array<{ sku: string; quantity: number; price: number }>;
}

export interface WebhookRequest {
  ip: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  body: { order: Order };
}
