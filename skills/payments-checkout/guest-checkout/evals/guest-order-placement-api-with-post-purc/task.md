# Implement the Guest Order Placement Backend

## Problem/Feature Description

Thornfield Commerce is migrating their checkout to support guest purchases. The frontend team has already built the checkout UI and the engineering lead now needs a backend API endpoint that accepts a guest order submission (no logged-in user required), persists the order to the database, processes payment, and kicks off the post-purchase retention flow.

The backend uses Node.js. A `db` ORM client and `processPayment` helper are already available (you can assume they exist and behave as expected — you do not need to implement them). The `processPayment` function accepts `{ amount, currency, paymentMethodId, metadata }` and returns `{ status, error }`. There is also an existing `sendOrderConfirmationEmail(order, email, token)` function you can assume is available. You do not have to set up a real database; write the handler function and any supporting utilities as plain JavaScript modules.

The ops team is concerned about fraudulent guest orders since there is no account to tie back to a bad actor — make sure the implementation addresses this.

## Output Specification

Produce the following files:
- `api/orders/guest.js` — the `placeGuestOrder(req, res)` handler
- `lib/accountCreationToken.js` — the token generation utility function `generateAccountCreationToken(email, orderId)`

Include a `design-notes.md` file (in the working directory) with 3-5 bullet points describing the security and retention design decisions made.
