# Flash Sale Scheduler and Virtual Waiting Room

## Problem/Feature Description

DropZone, a sneaker and streetwear retailer, runs highly anticipated limited-edition product drops where thousands of customers compete for a few hundred units. Two recurring problems have hurt the customer experience: first, the sale sometimes shows "active" a few seconds late because the system relies entirely on a background process to flip the status flag; second, bots routinely exhaust the entire stock before genuine customers can even reach the purchase page.

The team wants a robust scheduling module that handles automatic sale activation and expiry, combined with a fair virtual waiting room that queues customers and admits them in order. The system must protect the queue from automated bots. The solution should also track when admitted customers fail to complete their purchase within a reasonable window so the slot can be offered to the next person in line.

## Output Specification

Produce a TypeScript module with the following files:

1. **`scheduler.ts`** — Implements the cron-based sale scheduler that activates and ends sales automatically. Also include a function that performs a live sale lookup suitable for use in a product page API handler, in case the scheduled job hasn't run yet.
2. **`queue.ts`** — Implements the virtual waiting room: joining the queue, atomically admitting a batch of customers, checking whether a specific customer has been admitted, and the admission token expiry mechanism.
3. **`DESIGN.md`** — A brief explanation of the queue data structure chosen, why admission tokens have a finite lifetime, and how the system protects against bots.

The files should be self-contained TypeScript and can reference shared types (e.g., `FlashSale`) without implementing them.
