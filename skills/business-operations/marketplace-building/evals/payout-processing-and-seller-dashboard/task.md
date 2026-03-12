# Payout Processing and Earnings Dashboard

## Problem/Feature Description

ArtisanHub is an online marketplace for independent craftspeople. Every week, the platform processes payouts to sellers whose earnings have cleared the return window. The team recently had a painful incident: a payout transfer to a seller's bank failed partway through, but the system had already marked the associated earnings as disbursed — meaning those earnings were never retried and the seller was left short-changed. The team needs to make the payout flow bulletproof, with correct status transitions that can only happen once a transfer is confirmed.

A separate issue has come up with suspended sellers: when a seller account is suspended for policy violations, the ops team found that the suspension was also inadvertently blocking payouts for orders that had already been completed before the suspension. Sellers were owed money for sales they had legitimately made, but weren't receiving it. The payout logic needs to correctly scope which sellers are eligible for new payouts.

Finally, seller retention has been suffering because sellers have no visibility into their earnings. A finance dashboard endpoint is needed that gives each seller a real-time snapshot of their balance, broken down by funds that are available now, funds still in the holding period, and historical totals.

## Output Specification

Produce two TypeScript files:

**`payout-processor.ts`** containing:
1. `processWeeklyPayouts(): Promise<void>` — runs the weekly payout job for all eligible sellers.
2. `processMultiSellerOrder(orderId: string, sellerAmounts: Map<string, number>): Promise<void>` — handles a payment for an order with items from multiple sellers, creating a grouped payment intent and individual transfers.

**`earnings-api.ts`** containing:
1. An Express route handler for `GET /api/seller/earnings` that returns an earnings summary for the authenticated seller.

Also produce a `payout-design.md` file documenting:
- How the system handles a payout failure (what states are set and when)
- What determines whether a suspended seller receives a payout

## Input Files

The following stub types are provided. Extract them before beginning.

=============== FILE: inputs/types.ts ===============
export interface Seller {
  id: string;
  name: string;
  email: string;
  stripe_account_id: string;
  status: 'pending' | 'active' | 'suspended' | 'deactivated';
  payout_schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
}

export interface SellerEarning {
  id: string;
  seller_id: string;
  order_id: string;
  gross_amount: number;
  commission: number;
  net_amount: number;
  status: 'pending' | 'held' | 'available' | 'paid_out';
  available_at: Date;
}

export interface Payout {
  id: string;
  seller_id: string;
  amount: number;
  stripe_payout_id: string | null;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  period_start: string;
  period_end: string;
}

export interface DB {
  sellers: {
    findAll(filter: any): Promise<Seller[]>;
    findById(id: string): Promise<Seller>;
  };
  sellerEarnings: {
    findAll(filter: any): Promise<SellerEarning[]>;
    updateMany(ids: string[], data: Partial<SellerEarning>): Promise<void>;
    raw(query: string, params: any[]): Promise<{ rows: any[] }>;
  };
  payouts: {
    insert(data: Omit<Payout, 'id'>): Promise<Payout>;
    update(id: string, data: Partial<Payout>): Promise<void>;
    findAll(filter: any): Promise<Payout[]>;
  };
  transaction<T>(fn: (tx: DB) => Promise<T>): Promise<T>;
}

export interface EmailService {
  send(opts: { to: string; template: string; data: Record<string, any> }): Promise<void>;
}
