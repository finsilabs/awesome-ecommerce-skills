# Local Delivery Coverage: Zone Database and Address Eligibility API

## Problem/Feature Description

A regional grocery chain is launching a same-day delivery service across three urban neighborhoods. The operations team has drawn precise coverage boundaries for each neighborhood on a map — irregular polygons that follow streets and postal boundaries rather than neat rectangles. The engineering team needs to build the persistence layer that stores these zone shapes and a backend function that, given any delivery address, determines which zone (if any) covers it.

Previous attempts used a simple lat/lng bounding box per zone, which caused edge cases where addresses near zone boundaries were incorrectly accepted or rejected. The team wants an exact, geometry-based solution that can handle overlapping zones (where the higher-minimum-order zone should be preferred) and is fast enough to run on every checkout request without a full table scan.

The product team also needs the checkout API to re-confirm that an address is still within a valid zone at the moment an order is placed, since customers sometimes navigate back and change their address mid-session.

## Output Specification

Produce the following files:

1. `schema.sql` — SQL DDL for the delivery zone and slot tables, including all indexes and constraints needed for correctness and query performance.

2. `zone-lookup.ts` — TypeScript module exporting:
   - `findDeliveryZone(lat: number, lng: number): Promise<DeliveryZone | null>` — returns the best matching active zone for a coordinate pair, or null if none covers it.
   - `checkoutZoneValidation(orderId: string, lat: number, lng: number): Promise<DeliveryZone>` — called during order placement to confirm the address is still in a valid zone; throws if it is not.

3. `NOTES.md` — brief explanation of the geometry approach chosen and why it is preferable to alternatives.

You may define a `db` object or import stubs as needed; the actual database connection does not need to be runnable. Focus on correctness of the queries and schema.
