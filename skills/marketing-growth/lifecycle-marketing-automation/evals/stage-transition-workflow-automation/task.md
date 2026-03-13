# Automated Marketing Workflow Triggers

## Problem Description

Brewsmith, an online specialty coffee subscription service, has a customer lifecycle system that classifies customers into stages. Now they need to wire up the automation layer: whenever a customer moves from one stage to another, the right marketing workflow should fire automatically. The current system does nothing when customers transition — loyal customers receive no recognition, and at-risk customers churn silently without any intervention.

The growth team has documented the workflows they want triggered at each stage transition. The key requirements are:
- New subscribers should enter a short welcome sequence
- When someone makes their first purchase, they should exit the welcome sequence immediately (they've already converted) and enter a product onboarding flow
- When someone makes a second purchase, acknowledge the milestone
- Loyal customers deserve meaningful recognition — both an acknowledgment and some tangible benefit
- Customers who are slipping away need a gentle nudge — but the team does NOT want to immediately offer discounts to everyone who goes at-risk; discounts erode margins and should only be used as a last resort
- If a customer continues to lapse after already receiving a retention nudge, then a stronger win-back offer is appropriate
- Advocates who refer friends or leave reviews deserve exclusive perks

Additionally, the team wants to handle real-time purchase events properly: when a customer buys something, any active win-back or re-engagement flows should be cancelled immediately — there's nothing worse than receiving a "we miss you" email an hour after placing an order.

The system needs to be documented. Produce a transition matrix document that maps every possible stage transition to the workflow it triggers.

## Output Specification

Write a TypeScript file `workflow-triggers.ts` containing the `triggerStageTransitionWorkflow` function and any supporting handlers (e.g. an `onOrderPaid` handler for real-time purchase events).

Also write a `transition-matrix.md` that documents: for each destination stage, which workflows fire and under what conditions (include the from-stage where it matters).
