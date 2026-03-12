# Price Experiment Event Tracking Integration

## Problem/Feature Description

A retail engineering team has built a basic price experimentation system but hasn't yet wired up the analytics side. Currently, the system assigns shoppers to price variants but there is no record of what happens next — no tracking of which shoppers add products to their cart, no recording of completed purchases, and no way to reconcile the revenue back to the experiment that influenced the sale.

The head of data has raised a specific concern: they want to be able to run post-hoc revenue analysis months later, which means every order record must carry enough metadata to identify which experiment and variant influenced that sale. The team also needs to understand shopping funnel behaviour at the variant level, not just final conversion.

## Output Specification

Produce the following files:

1. `eventTracking.ts` — A TypeScript module exporting:
   - A function to record a conversion event (add to cart or purchase) for a given experiment variant, including any relevant revenue amount.
   - A function to persist a completed order in the database along with any relevant experiment context needed for later attribution.

2. `checkoutIntegration.ts` — A TypeScript module showing how to integrate the event tracking into a typical checkout flow. It should demonstrate the full sequence from showing a price, through add-to-cart, to completing a purchase.

3. `INTEGRATION_NOTES.md` — A brief document (under 300 words) summarising the rules the team must follow when integrating the experiment tracking into the checkout flow. Focus on data integrity and correctness concerns.

Assume a `db` object is available with methods including `db.raw`, `db.orders.insert`, and the methods from the experiment system.
