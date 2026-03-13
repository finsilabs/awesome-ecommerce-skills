# Cart Recovery Message Builder and Discount Code Generator

## Problem/Feature Description

A home goods retailer has its cart recovery scheduler up and running, but the engineering team now needs to implement the message content layer. The growth team wants SMS messages that feel personal and contextual rather than generic blasts — referencing what the customer left behind, creating social urgency, and closing with an incentive for high-value holdouts. They also need a system that generates one-time-use discount codes exclusively for the final recovery attempt, so the discount isn't given away prematurely.

The team has had past problems with SMS messages being filtered by carriers (customers reported never receiving them), messages arriving as two separate texts due to length, and discount codes being applied by the wrong customer. They want the new implementation to avoid these issues and to include trackable links so the analytics team can attribute recoveries back to specific SMS messages in their dashboards.

## Output Specification

Produce the following files:

- `src/lib/buildMessage.ts` — the function that constructs the SMS body for each step of the sequence, using cart and customer data
- `src/lib/generateRecoveryLink.ts` — the function that creates a trackable recovery link with a secure token
- `src/lib/generateDiscount.ts` — the function that creates a discount code for qualifying carts
- `src/lib/messageTemplates.ts` — the message templates for steps 1, 2, and 3 (may be inlined in buildMessage.ts instead if preferred)
- `DESIGN.md` — a brief document describing: (1) when discounts are applied in the sequence, (2) the minimum cart value to qualify for a discount, and (3) how discount code uniqueness and single-use are enforced

All TypeScript files should be syntactically valid. Actual API calls (e.g. to Shopify or a URL shortener) may be stubbed out.

## Input Files

The following type definitions are provided as the data model your functions should operate on. Extract them before beginning.

=============== FILE: src/types/cart.ts ===============
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  recentViewers?: number;
}

export interface Customer {
  id: string;
  firstName?: string;
  email?: string;
}

export interface AbandonedCart {
  sessionId: string;
  customerId?: string;
  phone: string;
  email?: string;
  cartValue: number;
  currency: string;
  items: CartItem[];
  checkoutUrl: string;
  abandonedAt: Date;
  recoveryState: string;
  customer?: Customer;
  discountCode?: string;
}
