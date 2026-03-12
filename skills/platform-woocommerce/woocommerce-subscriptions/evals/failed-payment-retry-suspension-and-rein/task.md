# Subscription Recovery and Admin Suspension Tools

## Problem/Feature Description

A subscription box company is experiencing revenue leakage from failed recurring payments. Their customer success team needs two capabilities: first, an admin tool that can trigger an immediate payment retry for customers whose subscriptions have gone on hold due to a failed renewal — without waiting for the automatic retry schedule. Second, the operations team occasionally needs to suspend a subscription manually (e.g., due to fraud review or shipping address issues) and later reinstate it without accidentally triggering an immediate renewal charge on the customer.

The team also wants an audit trail: when a subscription is suspended manually, the reason and timestamp should be recorded. When it's reinstated, the next billing date should be pushed forward to give the customer a fair billing period, rather than charging them immediately after a suspension.

## Output Specification

Write a PHP file at `subscription-recovery-tools.php` that implements:

1. A function to trigger an immediate payment retry for an on-hold subscription, using the subscription's stored payment method.
2. A function to suspend a subscription with a reason string, logging the reason and date before changing status.
3. A function to reinstate a previously suspended subscription, resetting the next payment date appropriately to avoid an immediate charge.

Include inline comments. The file should be self-contained.
