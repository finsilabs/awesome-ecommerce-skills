# Warehouse Picking System — State Management and Scan Verification

## Problem/Feature Description

A mid-sized e-commerce company is replacing its spreadsheet-based warehouse operations with a proper fulfillment system. The company processes around 200 orders per day and has had repeated problems with pickers grabbing the wrong items or skipping lines in an order, resulting in angry customers and costly re-ships. They also have no audit trail when disputes arise.

The engineering team has decided to build a TypeScript-based warehouse management backend. Your job is to implement the core picking module: a fulfillment status system and a barcode scan verification API that warehouse staff will use on their mobile scanners. The module must track every state change and every scan in the database so that operations managers can investigate any fulfillment dispute.

## Output Specification

Implement the following in TypeScript source files in the current directory:

1. **`fulfillment-state.ts`** — A module that exports:
   - A `FulfillmentStatus` type (or enum) covering all stages of the fulfillment lifecycle from initial receipt through delivery
   - A `VALID_TRANSITIONS` map or equivalent structure that prevents illegal status jumps
   - A `transitionFulfillment(fulfillmentId, newStatus, actorId)` function that safely updates the status

2. **`pick-verification.ts`** — A module that exports:
   - A `verifyPickScan(fulfillmentId, orderLineId, scannedBarcode, pickedQuantity)` function
   - A `markOrderFullyPicked(fulfillmentId, actorId)` function
   - An Express route handler (or plain function) for the mobile scanner HTTP endpoint

3. **`fulfillment-module-plan.md`** — A brief design document (300–500 words) describing:
   - The status lifecycle you chose and why
   - How scan verification works and what checks are performed
   - How the audit trail is maintained
   - Any concurrency or error-handling considerations

Assume the existence of a `db` object with collections: `db.fulfillments`, `db.fulfillmentEvents`, `db.orderLines`, `db.products`, `db.pickVerifications`. You do not need to implement the database layer itself — stub it as needed.

## Input Files

The following context file describes the existing order data schema. Extract it before beginning.

=============== FILE: inputs/order-schema.ts ===============
// Existing order data types already in the codebase

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
  shipping_service: string;  // e.g. "usps_priority", "ups_ground"
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

export interface Fulfillment {
  id: string;
  order_id: string;
  status: string;
  picker_id?: string;
  tracking_number?: string;
  carrier?: string;
  label_url?: string;
  package_length_in?: number;
  package_width_in?: number;
  package_height_in?: number;
  package_weight_oz?: number;
  created_at: Date;
  updated_at: Date;
}
