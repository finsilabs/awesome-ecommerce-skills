# Implement Google Ads Conversion Tracking for Order Confirmation

## Problem/Feature Description

Bloom & Basket, a specialty gift basket ecommerce shop, recently launched Google Ads campaigns but is seeing significant discrepancies between their reported conversions and their actual order count. The marketing team suspects duplicate conversions are inflating their numbers, and their Smart Bidding performance is inconsistent because the algorithm isn't receiving reliable purchase signals. They also want to understand why their conversion match rate with Google is very low.

Your task is to write the order confirmation page conversion tracking code for their storefront. The implementation must correctly fire Google Ads purchase conversions, implement Enhanced Conversions for improved signal recovery, and additionally implement server-side tracking via their existing sGTM container for resilience against browser restrictions. The implementation should work for both new and returning customers.

The store uses vanilla JavaScript on a Node.js/Express backend. Their Google Ads account ID is `AW-987654321`, their purchase conversion label is `abc123XYZ`, and their sGTM container is available at the URL stored in the environment variable `SGTM_CONTAINER_URL`.

## Output Specification

- `order-confirmation.html` — the complete order confirmation page with all Google tag scripts included in the `<head>` and the conversion tracking code in the `<body>`
- `track-purchase.js` — a server-side Node.js module that exports a `trackGooglePurchase(order)` function that sends the purchase event to the sGTM container
- A `notes.md` file explaining any key implementation decisions, including how duplicate conversions are prevented and how Enhanced Conversions improve match rates

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/order-example.json ===============
{
  "id": "ORD-20240315-8821",
  "subtotal": 84.50,
  "currencyCode": "USD",
  "isFirstOrder": true,
  "customerEmail": "Jane.Smith@Example.COM",
  "customerPhone": "+14155550192",
  "customerFirstName": "Jane",
  "customerLastName": "Smith",
  "shippingAddress": {
    "line1": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "countryCode": "US"
  },
  "lineItems": [
    {
      "sku": "GBK-LUXURY-001",
      "name": "Luxury Spa Gift Basket",
      "price": 59.99,
      "quantity": 1
    },
    {
      "sku": "ADD-RIBBON-001",
      "name": "Personalized Ribbon",
      "price": 4.99,
      "quantity": 1
    }
  ]
}
