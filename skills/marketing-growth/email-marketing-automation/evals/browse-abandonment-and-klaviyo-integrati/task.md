# Browse Abandonment Email System

## Problem/Feature Description

Verdant Supply Co. sells premium outdoor gear online. Their analytics show that roughly 40% of their logged-in customers view a product detail page and then leave without adding anything to their cart. The marketing team wants to follow up those browsing sessions with targeted emails that reference the specific product the customer looked at, along with similar items they might like.

The tricky part is the timing: customers often browse multiple products in a single session, and the team does not want to send a separate email for every product viewed — they want one follow-up per browsing session, triggered by the last product the customer viewed. If the customer comes back and adds something to their cart before the email fires, the email should not send at all.

The system should work with either their custom BullMQ queue (already set up as `emailQueue` from `./email-queue`) or, if they later switch to Klaviyo, via Klaviyo's native flow triggering. Implement the browsing event handler and, as an alternative path, a Klaviyo-compatible integration function.

Note: This feature should only activate for customers who are signed in — do not trigger it for anonymous sessions.

## Output Specification

Produce the following TypeScript source files:

- `src/flows/browse-abandon.ts` — the main browse abandonment handler using the BullMQ approach. Export `onProductViewed(customerId, productId)` and `onCartItemAdded(customerId)`.
- `src/integrations/klaviyo.ts` — the Klaviyo Track API integration. Export `trackKlaviyoEvent(email, eventName, properties)` and a `trackProductViewed(customer, product)` function that fires the appropriate Klaviyo event for browse abandonment.

Stub any database calls with TODO comments. Types can be defined inline.
