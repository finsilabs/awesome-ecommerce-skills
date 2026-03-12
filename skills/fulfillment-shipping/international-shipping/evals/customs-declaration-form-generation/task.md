# Customs Declaration Generator

## Problem/Feature Description

GlobalMart, a mid-size e-commerce retailer, is preparing to launch international shipping to customers in the UK, Germany, and Australia. Their fulfilment operations team has asked the engineering team to build a TypeScript module that generates customs declaration payloads for outbound international orders.

The product catalogue already stores item weights in ounces, and some products have a special customs-declared value that differs from the retail price (for example, promotional items sold below cost, or items where customs value is contractually fixed). The fulfilment team wants the module to respect these overrides and handle all the formatting and field requirements that international carriers and customs agencies expect. The operations manager has flagged that an incorrect handling of undeliverable packages in the past led to significant losses, and the legal team has highlighted that export compliance fields must be included for every outgoing shipment.

The team uses a PostgreSQL database accessible via a `db` object with the following shape (already defined, do not redefine): `db.orders.findById(id)`, `db.orderLines.findByOrderId(id)`, `db.products.findById(id)`. Products have fields: `name` (string), `weight_oz` (number|null), `declared_value_override` (number|null, in cents), `hs_code` (string), `country_of_origin` (string). Order lines have `product_id`, `quantity`, `unit_price` (cents). The warehouse identity fields are available via environment variables.

## Output Specification

Produce a single TypeScript file `customs-declaration.ts` containing:

1. A `generateCustomsItem()` helper that builds a single customs line item from a product and order line
2. A `generateCustomsInfo()` async function that takes an `orderId: string` and returns the complete customs info payload ready to be passed to a carrier API
3. A brief `README.md` (max 20 lines) explaining the key decisions made in the implementation — particularly around field values and formats
