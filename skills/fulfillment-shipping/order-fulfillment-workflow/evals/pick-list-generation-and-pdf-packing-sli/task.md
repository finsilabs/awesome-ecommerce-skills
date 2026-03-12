# Warehouse Pick List and Packing Slip Service

## Problem/Feature Description

A regional e-commerce fulfillment center handles both single-order and batch-order processing. The warehouse floor spans three aisles (A, B, C) with bin locations like "B2-07-3", and pickers currently receive poorly formatted printouts that send them back and forth across the warehouse. The operations director wants two improvements: first, a smarter pick list generator that groups routes efficiently; second, professionally formatted packing slips that can be printed server-side and physically placed in the box before sealing.

The tech lead has decided the packing slips must be generated on the backend (not in the browser) so they are reproducible and can be re-printed from the archive at any time. The team uses Node.js/TypeScript throughout. Your task is to implement both the pick list query logic and the packing slip generation service.

## Output Specification

Implement the following TypeScript source files:

1. **`pick-list.ts`** — Exports:
   - A `generatePickList(orderIds: string[])` function that returns pick items for one or more orders
   - A `generateBatchPickList(orderIds: string[])` function suitable for collecting multiple orders in a single warehouse pass

2. **`packing-slip.ts`** — Exports:
   - A `generatePackingSlip(orderId: string): Promise<Buffer>` function that produces a PDF document

3. **`sample-output/`** directory containing:
   - **`pick-list-sample.json`** — A sample pick list output (with at least 3 items, realistic bin locations, realistic SKUs and barcodes)
   - **`batch-pick-list-sample.json`** — A sample batch pick list output consolidating at least 2 orders

The TypeScript files should be complete enough to review the logic. Assume a `db` object is available globally with the same collections described in the schema below. Install any needed npm packages.

## Input Files

The following schema file describes the data model. Extract it before beginning.

=============== FILE: inputs/schema.ts ===============
export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_email: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    line1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  shipping_service: string;
  created_at: Date;
}

export interface OrderLine {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  barcode: string;
}

export interface WarehouseLocation {
  id: string;
  product_id: string;
  bin_location: string;   // e.g. "A3-04-2"
}

export interface Customer {
  id: string;
  name: string;
  email: string;
}
