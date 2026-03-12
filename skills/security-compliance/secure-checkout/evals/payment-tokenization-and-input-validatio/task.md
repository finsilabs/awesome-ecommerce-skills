# Payment Checkout Page with Product Descriptions

## Problem/Feature Description

A growing online retailer wants to build a custom checkout experience in Next.js. The checkout page must display rich product descriptions fetched from their headless CMS — these descriptions contain basic HTML formatting (bold, italics, lists) written by the marketing team, but the CMS system doesn't sanitize content before storing it.

The page needs to collect payment from customers. The company has a Stripe account and wants to integrate payments directly on their own domain to provide a seamless branded experience, rather than redirecting customers to an external payment portal. The engineering lead has emphasized that the company does not want to become responsible for storing or handling raw card numbers — this would significantly increase their compliance burden.

Your task is to implement the core checkout page and its supporting API route. The implementation should display the product information safely, handle payment collection in a way that keeps card data off the company's servers, and robustly validate all the billing information submitted with the order.

## Output Specification

Produce the following files:

- `app/checkout/page.tsx` — the checkout page component, showing the product and the payment form
- `app/api/checkout/route.ts` — the Next.js API route that receives and validates the billing details and processes the order (use `process.env.STRIPE_SECRET_KEY` for the server-side Stripe key)
- `lib/sanitize.ts` — a utility for safely rendering HTML content from external sources

The Stripe publishable key is available as `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/product.json ===============
{
  "id": "prod_001",
  "name": "Artisan Leather Wallet",
  "price_cents": 7999,
  "descriptionHtml": "<p>Handcrafted from <strong>full-grain leather</strong> with <em>RFID blocking</em> technology.</p><ul><li>6 card slots</li><li>2 bill compartments</li></ul><script>alert('xss')</script><p>Made in <a href='javascript:void(0)' onclick='stealData()'>Italy</a>.</p>"
}
