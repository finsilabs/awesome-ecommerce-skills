# WooCommerce Order Fulfillment Integration

## Problem/Feature Description

A small warehouse team uses a third-party fulfillment software that exports completed shipments as a JSON file at the end of each day. Currently, staff manually log into WordPress Admin to mark orders as completed and add internal notes about which shipment batch they were packed in. This is tedious and error-prone when dealing with dozens of orders per day.

The development team has been asked to build a Node.js TypeScript module that bridges the gap: it should be able to create new orders programmatically (for orders that originate outside the storefront, such as phone orders), update the status of existing orders as they move through the fulfillment pipeline, and attach internal notes to orders when their status changes.

A known recurring issue: the WooCommerce store sells clothing items that come in different sizes — the previous ad-hoc scripts sometimes created orders that immediately failed in WordPress with a product-related error. Make sure the order module handles this scenario correctly.

## Output Specification

Produce a TypeScript module structured as follows:
- `package.json` with required dependencies
- `src/lib/woocommerce.ts` — WooCommerce client setup
- `src/orders.ts` — order management functions including:
  - `createOrder(params)` — creates a new WooCommerce order
  - `updateOrderStatus(orderId, status, note?)` — updates order status and optionally attaches a note
  - `getOrders(params?)` — retrieves a list of orders with pagination info
- `src/example-usage.ts` — a runnable example demonstrating:
  1. Creating a phone order from the customer data in `phone-order.json` (provided below). Item #2 is a size variant of product 205; its WooCommerce variant record has ID 312.
  2. Updating that order's status to "processing" with a note "Packed in batch B-42"

Do not include any real credentials. Use environment variables for all API configuration.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: phone-order.json ===============
{
  "customer": {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "address_1": "42 Maple Street",
    "city": "Portland",
    "postcode": "97201",
    "country": "US"
  },
  "items": [
    {
      "product_id": 101,
      "quantity": 1
    },
    {
      "product_id": 205,
      "quantity": 2,
      "size": "L",
      "wc_variant_id": 312
    }
  ]
}
