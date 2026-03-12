# Build the Post-Purchase Account Creation Flow

## Problem/Feature Description

Wildrose Boutique has launched guest checkout and is now seeing orders come in. The retention team wants to convert some of those one-time guests into registered account holders. They need two things: a backend endpoint that turns a post-purchase token into a real account, and a frontend confirmation page that surfaces the account creation prompt to the customer right after they complete their purchase.

A previous engineer set up token generation during order placement — the tokens are stored in the `accountCreationTokens` table with `token`, `email`, `orderId`, and `expiresAt` columns. A customer who completes a guest purchase gets a link emailed to them. When they click it, the frontend reads the token from the URL and shows the confirmation page. If the customer sets a password, the frontend POSTs to `/api/auth/create-account-from-order`. The team is also getting support tickets from customers who lost access to their order history after creating an account — make sure the implementation handles this.

There is also a need for a public order-tracking page so guests can check on their orders without an account. The tracking page will call a backend endpoint. Implement that endpoint too.

You do not need to set up a real database — write the handler functions and React components as plain JavaScript/JSX modules. You can assume `db`, `hashPassword`, and session management are available.

## Output Specification

Produce the following files:
- `api/auth/create-account-from-order.js` — the `createAccountFromOrder(req, res)` handler
- `api/orders/track.js` — the `trackGuestOrder(req, res)` handler (accepts GET with query params)
- `components/OrderConfirmationPage.jsx` — the React confirmation page component

Include a `security-notes.md` file (in the working directory) summarising the security decisions made for the token-based account creation flow.
