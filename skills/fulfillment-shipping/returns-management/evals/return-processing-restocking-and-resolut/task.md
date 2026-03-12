# Warehouse Return Processing and Resolution

## Problem/Feature Description

A warehouse team at a consumer electronics retailer receives dozens of returned packages each day. Currently, the process is error-prone: sometimes items are immediately put back on shelves before being checked for damage, other times refunds are issued automatically as soon as a label is scanned, leaving the business exposed to fraud when packages contain wrong or damaged goods. The finance team has also flagged inconsistencies in how restocking fees are recorded — some engineers subtract them as negative line items in the order system, which breaks financial reports.

The team needs a robust backend service to handle the full lifecycle from the moment a returned package arrives: recording the physical condition of each item, deciding what goes back to sellable stock versus to a damage bin, applying any applicable restocking fees, and then executing the appropriate resolution (full refund, store credit, or exchange for a replacement). The resolution should only happen after physical receipt is confirmed.

## Output Specification

Produce a TypeScript module **`receive-service.ts`** that exports:

1. `receiveAndResolveReturn(returnRequestId, inspectionResults, staffId)` — marks a return as received, records item conditions, handles inventory, calculates any fees, and triggers resolution.

2. `executeResolution(returnRequestId)` — determines the resolution type and dispatches to the appropriate handler (refund to original payment, store credit, or exchange order).

3. `calculateRefundAmount(rma)` — computes the net refund after fees.

The code does not need to connect to a real database — use placeholder `db` calls and stub functions like `issueRefundToOriginalPayment`, `issueStoreCredit`, and `createExchangeOrder` as if they are defined elsewhere. The business logic, data flow, and structural decisions must be complete and correct. Include a brief **`DESIGN.md`** explaining the key design choices made for inventory management, refund timing, restocking fee accounting, and exchange order pricing.
