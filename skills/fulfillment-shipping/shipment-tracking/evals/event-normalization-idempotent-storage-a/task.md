# Shipment Tracking Data Layer

## Problem/Feature Description

A growing e-commerce platform is adding multi-carrier package tracking to their order management system. The team needs to design the database schema and the core data processing layer that takes raw tracking events from their carrier aggregator and persists them reliably. The aggregator sends batches of tracking details for a given shipment — and the same events may be resent multiple times when the aggregator retries failed deliveries.

The platform uses PostgreSQL and a TypeScript/Node.js backend. The head of engineering wants to make sure that running the same webhook payload twice doesn't create duplicate events in the database, and that when a package is delivered the order record is automatically updated so the fulfillment team doesn't have to manually close out orders.

## Output Specification

Produce two files:

1. `schema.sql` — PostgreSQL DDL creating the tables and indexes required to store shipment and tracking data. Include all necessary constraints.

2. `tracking-processor.ts` — A TypeScript module that exports:
   - A carrier status normalization mapping (translating carrier-specific codes to your unified status vocabulary)
   - A `normalizeEasyPostEvent(trackerData: any)` function
   - A `processTrackerEvent(trackerData: any)` function that persists events and updates the shipment and order

   Use a `db` stub object (define it as a simple constant with the methods called — no need to implement the actual DB layer) so the logic is self-contained and reviewable.
