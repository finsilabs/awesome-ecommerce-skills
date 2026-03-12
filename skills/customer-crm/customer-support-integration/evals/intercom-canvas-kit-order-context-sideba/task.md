# Order Context Panel for Intercom Support Conversations

## Problem/Feature Description

GreenLeaf Commerce's support team uses Intercom as their primary customer messaging platform. Right now, when a customer messages about a missing package or a wrong item, the support agent has to open a separate browser tab, log into the order management system, search for the customer, and manually read off order details. This context-switching adds 2–3 minutes per conversation and leads to mistakes during busy periods.

The engineering team wants to build a custom sidebar panel for Intercom that automatically displays the customer's most recent order — including status, total, placement date, and a tracking link — the moment a conversation is opened. The panel should be implemented using Intercom's native mechanism for embedding custom content in the agent workspace, and it must respond fast enough to keep up with a busy support queue.

## Output Specification

Produce a TypeScript source file named `intercom-canvas-handler.ts` containing:
- The HTTP POST handler that Intercom calls when a conversation is opened
- All canvas rendering logic (components for order data and fallback when no orders exist)
- Environment variable references for any credentials or IDs

Also produce `implementation-notes.md` explaining:
- The response structure your handler returns
- How performance requirements influenced the implementation
- How the handler handles cases where the customer has no orders or no tracking information

## Input Files

The following file describes the order data structure available from the database layer. Extract it before beginning.

=============== FILE: inputs/order-model.ts ===============
export interface Order {
  id: string;
  number: string;              // human-readable e.g. "ORD-1042"
  status: string;              // e.g. "shipped", "delivered", "processing"
  totalCents: number;          // integer, in cents
  createdAt: Date;
  shipments: Array<{
    trackingUrl: string | null;
    carrier: string;
  }>;
}

// Available DB function:
// db.orders.findLatestByEmail(email: string, options?: { include?: string[] }): Promise<Order | null>
