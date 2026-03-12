# Pricing Experimentation: Safe Variant Delivery and Experiment Health Monitoring

## Problem/Feature Description

A subscription software company wants to run a pricing test on their plans page: they want to show a subset of visitors a different monthly price for their Pro tier and measure whether it improves revenue. Legal has flagged a concern — a customer complained about seeing different prices during the same browsing session, which raised consumer protection questions. The engineering team needs a pricing variant delivery system that guarantees price consistency per user across visits.

Additionally, the experiment operations team has noticed that the checkout funnel currently has four overlapping experiments running. A data scientist warned in Slack that the interactions between these experiments are making all of them unreliable. Going forward, there should be a validation step that prevents more than a safe number of experiments from running simultaneously on the same page surface.

The team has also learned the hard way that improving conversion rate doesn't always mean success — a previous checkout test improved CVR but tanked average order value. They want an automated guardrail system that monitors key health metrics for running experiments and pauses them automatically when something looks wrong.

## Output Specification

Produce a TypeScript file `pricing-experiment.ts` containing:

1. A `getProductPrice(productId, userId)` function that retrieves the correct price for a user, using the user's assigned experiment variant when a pricing test is active for that product.
2. A `validateExperimentCount(pageId)` function (or equivalent) that checks whether adding a new experiment to a page would exceed safe limits, and returns an error or warning if it would.
3. A `checkExperimentGuardrails(experimentId)` function that checks key health metrics and pauses the experiment with a reason code if a guardrail is breached.

Also produce a `design-decisions.md` file explaining the pricing consistency strategy, the rationale for the concurrent experiment limit, and what metrics are being monitored as guardrails and why.
