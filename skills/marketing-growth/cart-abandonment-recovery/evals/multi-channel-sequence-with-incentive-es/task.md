# Abandoned Cart Recovery Messaging Sequence

## Problem/Feature Description

A mid-size home decor e-commerce company is launching its first automated cart recovery program. Their head of revenue noted that flat-discount approaches at competitors have conditioned shoppers to abandon intentionally to wait for a coupon. The company wants a smarter multi-step approach that contacts customers across multiple channels over two days, applies incentives strategically based on what the data says about cart value, and respects customer preferences — particularly around SMS.

The engineering team needs to implement the recovery sequence logic in TypeScript. The sequence must cover multiple channels in a specific order, apply incentives at the right moments (but not too early), and differentiate the offer based on what the customer has in their cart. The system should also handle segment edge cases: VIP customers who spend heavily should never feel like they need to bargain, while first-time abandoners should be given a chance to return without being trained to expect discounts.

You are given the outline of the Cart and Customer types in the input files. Implement the sequence configuration and the incentive selection logic, and produce a short write-up explaining the strategy choices made.

## Output Specification

Produce:
- `recovery-sequence.ts` — exports `getRecoverySequence(cartValue: number): RecoveryStep[]` and `getIncentiveForCustomer(customerId: string, cartValue: number): Promise<Incentive | null>`
- `STRATEGY.md` — a short document (bullet points are fine) explaining:
  - Channel order and timing rationale
  - When and why incentives are withheld vs. offered
  - How VIP vs. new customers are treated differently
  - SMS opt-in handling approach

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/types.ts ===============
export interface RecoveryStep {
  channel: 'email' | 'push' | 'sms';
  delayFromAbandonMs: number;
  incentive: Incentive | null;
  template: string;
}

export interface Incentive {
  type: 'free_shipping' | 'percent_off';
  value: number;
}

export interface Cart {
  id: string;
  customerId: string;
  totalValue: number;
  customerEmail: string | null;
  customerPhone: string | null;
  smsMarketingOptIn: boolean;
  items: CartItem[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Customer {
  id: string;
  email: string;
  totalLifetimeSpend: number;
}
