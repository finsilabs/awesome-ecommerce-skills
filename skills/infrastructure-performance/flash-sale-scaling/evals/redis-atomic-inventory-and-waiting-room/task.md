# Sneaker Drop Inventory Service

## Problem/Feature Description

A streetwear brand is launching a limited-edition sneaker drop — only 500 pairs available — and expects roughly 80,000 unique visitors to hit the site within the first 30 seconds of the sale going live. Previous drops ran inventory checks against the PostgreSQL database: every checkout read the current stock, confirmed availability, then decremented in a separate write. Under high concurrency this race condition caused 120 pairs to be oversold during the last drop, triggering chargebacks and brand damage.

The team wants to rewrite the inventory layer to use an in-memory store for all reservation operations during the sale. Reservations must be fully atomic — no pair should be sold that doesn't exist — and if an order later fails during payment processing, the reservation must be returned to the pool. Because fair access matters for the brand's reputation, the team also wants a waiting room: customers who arrive when inventory is available get a queue position and are admitted in arrival order rather than at random.

## Output Specification

Write a single TypeScript file `inventory.ts` implementing the following exported functions:

- `initializeInventory(productId, quantity)` — sets the initial stock count
- `reserveInventory(productId, quantity)` — atomically reserves stock; returns one of `'reserved'`, `'out_of_stock'`, or `'not_found'`
- `releaseInventory(productId, quantity)` — returns stock to the pool when an order fails
- `syncInventoryToDatabase()` — writes current Redis stock counts back to the database
- `enterWaitingRoom(sessionId, productId)` — adds a customer to the fair queue; returns their position and a signed token
- `admitFromQueue(productId, batchSize)` — pops the next batch of customers from the queue and notifies them

You may use placeholder implementations for external calls (e.g., `db.products.updateInventory`, `signQueueToken`, `notifyCustomerAdmitted`) — focus on the Redis interaction logic.

Include a brief `DESIGN.md` file (max 200 words) explaining the atomicity guarantees of your inventory reservation approach.
