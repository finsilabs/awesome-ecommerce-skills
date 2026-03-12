# Cart Recovery Link Handler and Analytics

## Problem/Feature Description

A fashion retailer's analytics team has noticed that cart recovery revenue is being lumped into organic revenue, making it impossible to measure the ROI of the recovery program. Separately, customer complaints have surfaced about prices shown in recovery emails not matching the checkout price — a side effect of product price changes between when a customer abandons and when they click the recovery link.

The engineering team needs to implement two things: the server-side endpoint that handles recovery link clicks (restoring the customer's cart and routing them to checkout), and a cart snapshot mechanism that captures the state of the cart at the moment of abandonment. The recovery links themselves should carry enough metadata for the analytics team to separate recovery-driven conversions from organic ones.

The app is built with Express and TypeScript. A `db` object, `analytics` tracking service, and `req.session` are available in scope. The token was already stored in `db.cartRecoveryTokens` when the sequence started.

## Output Specification

Produce:
- `recover-endpoint.ts` — exports the `recoverCart(req, res)` Express handler for `GET /cart/recover/:token`
- `cart-snapshot.ts` — exports `snapshotCart(cartId: string): Promise<CartSnapshot>` which captures the cart state at abandonment time
- `ATTRIBUTION.md` — describes how recovery conversions are attributed and tracked separately from organic revenue, including which parameters/flags are added to links and what analytics events are fired

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/types.ts ===============
export interface CartRecoveryToken {
  id: string;
  cartId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface Cart {
  id: string;
  customerId: string;
  status: 'active' | 'converted' | 'expired';
  totalValue: number;
  customerEmail: string | null;
  items: CartItem[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    images: { url: string }[];
  };
}

export interface CartSnapshot {
  cartId: string;
  snapshotAt: Date;
  items: {
    productId: string;
    name: string;
    image: string | undefined;
    price: number;
    quantity: number;
  }[];
  totalValue: number;
}
