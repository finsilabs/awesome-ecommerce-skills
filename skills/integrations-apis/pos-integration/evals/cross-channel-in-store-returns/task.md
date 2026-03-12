# Omnichannel Returns: Buy Online, Return In Any Store

## Problem/Feature Description

Redwood Home Goods runs 12 physical stores and a flagship online shop. Their current returns policy only allows online purchases to be returned by mail — but competitor analysis shows that 60% of customers prefer to return items in-person. The operations team has decided to roll out a "return anywhere" policy: any online order can be returned at any physical store location, with a refund issued immediately back to the customer's original payment method.

The technical challenge is that online orders were paid through either Stripe or Square depending on which payment gateway was active when the order was placed. When a store associate processes a return, the system needs to find the original order, validate what can still be returned, process the refund through the correct channel, and update inventory counts at the specific store where the goods were physically handed back. The operations team is also mindful of the impact incorrect inventory counts have on the online availability displayed to shoppers — the timing of when inventory changes are reflected online matters.

## Output Specification

Produce the following files:

- `lib/pos/returns.ts` — the main return processing module exporting a `processInStoreReturn` function
- `returns.test.ts` — unit tests (or a test script) covering at least: the already-refunded guard, the returnable quantity check, the gateway routing decision, and the inventory update behavior

The `processInStoreReturn` function should accept:
```typescript
{
  orderId: string;
  lineItems: Array<{lineItemId: string; quantity: number; reason: string; status: string}>;
  locationId: string;
}
```

Assume the following are already implemented and can be imported/referenced:
- `db.orders.findById(orderId)` — returns an order with `.status`, `.paymentGateway`, `.stripePaymentIntentId`, `.squarePaymentId`, and `.lineItems` (each with `.id`, `.sku`, `.unitPriceCents`, `.returnableQuantity`)
- `db.orders.addReturn({orderId, lineItems, gatewayRefundId, processedAt, processedAtLocation})`
- `db.inventory.incrementLocationQuantity(sku, locationId, qty)`
- `db.inventory.getTotalAvailable(sku)`
- `syncInventoryAcrossChannels({sku, quantity, source})`
- `stripe` — Stripe SDK client instance
- `paymentsApi` — Square payments API client
