# Time-Slot Booking Service: Handling the Last-Seat Race Condition

## Problem/Feature Description

An online florist runs a same-day delivery service with limited capacity per two-hour delivery window. On popular days (Valentine's Day, Mother's Day) hundreds of customers reach the checkout simultaneously, and several of them are often competing for the last one or two spots in a popular afternoon slot. The current implementation reads the slot availability, checks it in application code, and then inserts a booking — a pattern that has caused multiple incidents where more orders were confirmed than the slot could actually handle.

The engineering team needs a robust booking function that is safe to call concurrently from many web server processes. The function must reject bookings cleanly with informative errors when a slot is full, when the booking window has closed (past cutoff), or when the slot has been deactivated by an admin. The solution must work correctly even if two requests arrive at the exact same millisecond.

## Output Specification

Produce the following files:

1. `book-slot.ts` — TypeScript module exporting a `bookDeliverySlot(orderId: string, slotId: string): Promise<DeliveryAssignment>` function that handles concurrent booking safely.

2. `book-slot.test.ts` — Unit/integration test file (using any test framework) with at least three test cases covering: successful booking, rejection when slot is full, and rejection when past cutoff.

3. `NOTES.md` — A short explanation of the concurrency strategy used and why it prevents double-booking.

You may define or stub `db`, `DeliverySlot`, and `DeliveryAssignment` types as needed. The implementation does not need to connect to a real database, but the SQL and transaction logic must be written correctly as if it would run against PostgreSQL.
