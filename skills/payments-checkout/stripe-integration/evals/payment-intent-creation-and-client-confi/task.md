# Online Checkout Payment Flow

## Problem/Feature Description

Hartley Books is a small independent bookshop launching an online store. They have a working cart and order system but no payment processing. The shop sells internationally and has seen customers in Germany and France, so they need their checkout to comply with European banking regulations that require additional customer authentication steps for certain cards.

The team lead has decided to use Stripe and wants a clean, maintainable checkout implementation. The backend already has a basic Express server. The frontend uses plain HTML/JavaScript. The order system already generates an `order_id` for each basket before payment is initiated, and the team wants to be able to trace every Stripe transaction back to its originating order in the Stripe dashboard without querying their own database.

## Output Specification

Produce two files:

1. `server.js` — An Express endpoint at `POST /api/create-payment-intent` that:
   - Accepts `amount` (in USD dollars, e.g. 29.99), `currency`, and `orderId` from the request body
   - Creates a Stripe Payment Intent and returns the client secret to the frontend

2. `checkout.html` — A minimal checkout page that:
   - Loads Stripe.js
   - Mounts a payment form using Stripe Elements
   - On form submit, calls the `/api/create-payment-intent` endpoint then confirms the payment
   - Handles errors (declined card, etc.) by displaying a message to the user
   - On success, redirects to `/order/confirmation`

Both files should include comments explaining key decisions. Include a short `notes.md` listing which environment variables need to be configured.
