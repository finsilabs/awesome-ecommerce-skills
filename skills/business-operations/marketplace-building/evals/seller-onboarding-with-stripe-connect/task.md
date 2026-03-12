# Seller Onboarding Module

## Problem/Feature Description

CraftHive is a handmade goods marketplace launching later this year. The platform lets independent artisans ("sellers") list and sell their own products while CraftHive collects payments on their behalf and pays them out on a schedule. Before a seller can publish listings, they must complete identity verification and link a bank account — this is a legal requirement in most jurisdictions.

The engineering team needs to implement the seller onboarding flow. When a new seller signs up, the system should set up the necessary third-party account infrastructure and return a link the seller can follow to complete identity verification and payment setup. Once the seller finishes this external process, a webhook from the payment provider should update their status in the platform so they can start selling.

A seller's onboarding state needs to be clearly tracked: newly registered sellers start in a pending state and can only be activated after the payment provider confirms they are fully capable of both receiving charges and having funds transferred to them.

## Output Specification

Implement this as a TypeScript module. Produce a single file `seller-onboarding.ts` containing:

1. A function `createSellerOnboardingLink(sellerId: string): Promise<string>` that provisions the third-party account (if not already created) and returns the onboarding URL.
2. A webhook handler function `handleAccountUpdated(account: any): Promise<void>` that processes the event fired when a seller's external account details change, updating the seller's status in the database appropriately.
3. A short `IMPLEMENTATION_NOTES.md` file explaining:
   - Which account type was chosen and why (1-2 sentences)
   - What condition is checked to determine a seller is ready to go live (1 sentence)
   - What happens after a seller is activated (1 sentence)

## Input Files

The following stub types and mock database are provided as inputs. Extract them before beginning.

=============== FILE: inputs/types.ts ===============
export interface Seller {
  id: string;
  name: string;
  email: string;
  user_id: string;
  stripe_account_id: string | null;
  status: string;
  commission_type: string;
  commission_rate: number;
  payout_schedule: string;
}

export interface DB {
  sellers: {
    findById(id: string): Promise<Seller>;
    findByStripeAccountId(stripeAccountId: string): Promise<Seller | null>;
    update(id: string, data: Partial<Seller>): Promise<void>;
  };
}

export interface EmailService {
  send(opts: { to: string; template: string; data: Record<string, any> }): Promise<void>;
}
