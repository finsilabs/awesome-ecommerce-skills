# Automated Helpdesk Tickets for Order Delivery Issues

## Problem/Feature Description

ShipRight, a mid-sized e-commerce company, is dealing with an operational headache: when a carrier marks a package as undeliverable, customers have no idea what's happening and support agents only find out when an angry email arrives two days later. The ops team wants to close this gap by automatically opening a support ticket in Zendesk the moment their order management system registers a delivery failure, so the support team can get ahead of the issue before the customer even notices.

The company already has a Zendesk account and an internal order database. They need a TypeScript HTTP endpoint (Express-style) that their order management system can call whenever a shipment's delivery attempt fails. The endpoint must create a properly formatted Zendesk ticket, tag and categorize it correctly so that automated vs. manually-created tickets can be distinguished in reports, and ensure the order is linked to the ticket in a way that enables future two-way synchronization between the order database and Zendesk.

## Output Specification

Produce a TypeScript source file named `create-ticket-handler.ts` containing:
- The HTTP handler function for the delivery failure event
- Any helper functions needed for authentication or ticket creation
- Environment variable references (not hardcoded values) for credentials and configuration
- A brief `implementation-notes.md` explaining: how authentication is constructed, how the order is linked to the ticket, and what tags are applied and why

The handler should accept a JSON body describing the failed shipment and create the corresponding Zendesk ticket.

## Input Files

The following file describes the data shape available from the order management system when a delivery failure occurs. Extract it before beginning.

=============== FILE: inputs/shipment-failure-event.ts ===============
export interface ShipmentFailureEvent {
  shipmentId: string;
  orderId: string;
  orderNumber: string;          // human-readable e.g. "ORD-4821"
  carrier: string;              // e.g. "FedEx"
  trackingNumber: string;
  customerEmail: string;        // may be mixed case from the OMS
  failedAt: string;             // ISO 8601 timestamp
}
