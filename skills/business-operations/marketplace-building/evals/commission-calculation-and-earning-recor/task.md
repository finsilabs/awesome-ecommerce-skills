# Commission Engine and Earning Records

## Problem/Feature Description

ShopBridge is a B2B marketplace that connects wholesale suppliers with retail buyers. Different suppliers have negotiated different commission arrangements with the platform: some pay a percentage of each sale, others have agreed to a flat fee per transaction, and the platform's highest-volume suppliers are on a tiered structure where the commission rate decreases as their monthly volume grows.

The finance team has been receiving disputes from suppliers who claim the platform charged them the wrong commission amount. The root cause is that the current system recalculates commission at payout time rather than recording it at the moment of sale — meaning rate changes between sale and payout lead to discrepancies. They need a reliable earning-recording system that captures the commission calculation at the exact moment of the sale.

Additionally, suppliers are frustrated because funds are occasionally released to them before buyers have had a chance to return items, leaving the platform exposed to losses when refunds come in. The system needs to enforce a holding period before earnings become available for payout.

## Output Specification

Produce a TypeScript file `commission-engine.ts` containing:

1. `calculateCommission(seller: Seller, grossAmountCents: number): number` — returns the commission in cents for each commission type.
2. `recordSellerEarning(orderId: string, sellerId: string, itemAmountCents: number, shippingAmountCents: number): Promise<void>` — records the earning, applying the appropriate hold period.
3. `handlePaymentWebhook(event: StripeEvent): Promise<void>` — a Stripe webhook handler that calls `recordSellerEarning` at the correct point in the payment lifecycle.

Also produce a `commission-test-cases.md` file showing worked examples of commission calculation for:
- A percentage-commission seller with 15% rate on a $200 sale
- A fixed-commission seller with $5 fee on a $200 sale
- A tiered-commission seller on a $1,500 sale (showing the tier boundary calculation)

## Input Files

The following stub types are provided. Extract them before beginning.

=============== FILE: inputs/types.ts ===============
export interface Seller {
  id: string;
  name: string;
  commission_type: 'percentage' | 'fixed' | 'tiered';
  commission_rate: number;
  payout_schedule: string;
  status: string;
}

export interface SellerEarningInsert {
  seller_id: string;
  order_id: string;
  gross_amount: number;
  commission: number;
  net_amount: number;
  commission_type: string;
  commission_rate: number;
  status: string;
  available_at: Date;
}

export interface StripeEvent {
  type: string;
  data: {
    object: {
      id: string;
      metadata: { order_id?: string; seller_id?: string };
    };
  };
}

export interface DB {
  sellers: {
    findById(id: string): Promise<Seller>;
  };
  sellerEarnings: {
    insert(data: SellerEarningInsert): Promise<void>;
  };
  transaction<T>(fn: (tx: DB) => Promise<T>): Promise<T>;
}
