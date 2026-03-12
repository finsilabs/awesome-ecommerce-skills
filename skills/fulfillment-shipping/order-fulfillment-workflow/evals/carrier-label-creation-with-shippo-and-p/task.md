# Shipping Label Creation and Carrier Integration

## Problem/Feature Description

A growing direct-to-consumer brand ships roughly 500 packages per day from a single warehouse in Austin, TX. Their current process requires warehouse staff to log into a carrier portal, manually enter package dimensions, and copy-paste tracking numbers into the order system — a painful 3-minute-per-order process that often introduces errors. Customers also complain about not receiving tracking notifications until a day after their order ships.

The engineering team wants to automate label generation: as soon as a packed order is ready to ship, the system should call the carrier API, retrieve the right shipping rate, purchase a label, and immediately send the customer a tracking notification. The company uses multiple carriers (USPS, UPS, FedEx) and already stores the preferred service level on each order. The team wants to keep the database lean, so large label images should not be stored directly in the database.

Your task is to implement the shipping label creation module in TypeScript and write a brief architecture note explaining your approach.

## Output Specification

Implement the following:

1. **`shipping-label.ts`** — Exports:
   - A `createShippingLabel(fulfillmentId: string): Promise<string>` function that creates a carrier label and returns the label URL
   - Any helper types or constants needed

2. **`notify-customer.ts`** — Exports:
   - A `sendTrackingNotification(orderId: string, trackingNumber: string, carrier: string): Promise<void>` stub function (implementation can be a console.log or placeholder, but the function signature and call site must be correct)

3. **`label-architecture.md`** — A short note (200–400 words) covering:
   - Which carrier API/SDK you chose and why
   - How the rate selection works when multiple rates are returned
   - What gets persisted to the database and what does not
   - When the customer tracking notification is triggered

Assume a `db` object is available globally. Package credentials should come from environment variables. Install any npm packages needed.

## Input Files

The following context file shows the relevant data model. Extract it before beginning.

=============== FILE: inputs/fulfillment-schema.ts ===============
export interface Fulfillment {
  id: string;
  order_id: string;
  status: string;
  picker_id?: string;
  tracking_number?: string;
  carrier?: string;
  label_url?: string;
  package_length_in: number;
  package_width_in: number;
  package_height_in: number;
  package_weight_oz: number;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_email: string;
  shipping_service: string;   // carrier service level token, e.g. "usps_priority", "ups_ground"
  shipping_address: {
    first_name: string;
    last_name: string;
    line1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  created_at: Date;
}

// Environment variables available at runtime:
// process.env.SHIPPO_API_KEY
// process.env.WAREHOUSE_NAME
// process.env.WAREHOUSE_ADDRESS
// process.env.WAREHOUSE_CITY
// process.env.WAREHOUSE_STATE
// process.env.WAREHOUSE_ZIP
