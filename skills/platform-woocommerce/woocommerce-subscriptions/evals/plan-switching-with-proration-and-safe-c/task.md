# Subscription Plan Upgrade/Downgrade with Fair Billing

## Problem/Feature Description

A SaaS company offers three subscription tiers — Starter ($9.99/month), Professional ($29.99/month), and Enterprise ($79.99/month) — and customers frequently upgrade or downgrade mid-billing-cycle. The finance team has received complaints that when a customer switches plans, they are either charged twice for the same period or receive no credit for days already paid. The company wants customers to be charged fairly: credited for unused days on their current plan and charged only the proportional cost of the new plan for the remainder of the billing period.

Additionally, customers who switch to a lower tier should never see a negative charge on their invoice — the system should cap any credits so that the switch results in a zero or positive amount only. The engineering team also needs a reliable function to actually perform the plan switch itself (update the subscription items, recalculate totals, and persist the change).

## Output Specification

Write a PHP file at `subscription-plan-switcher.php` that:

1. Registers a proration filter that calculates the prorated amount for plan switches using daily rates and days remaining in the billing period.
2. Ensures the prorated amount is never negative.
3. Provides a function that programmatically switches a subscription from one product to another, properly removing old items and adding the new product.

Include inline comments explaining the proration logic. The file should be self-contained with all necessary `add_filter` / `add_action` calls.
