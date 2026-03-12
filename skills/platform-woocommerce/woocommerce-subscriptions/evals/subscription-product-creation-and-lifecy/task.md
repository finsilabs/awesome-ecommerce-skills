# Premium Membership Plugin Setup

## Problem/Feature Description

A digital media company is launching a new premium content tier called "Premium Membership" on their WooCommerce store. They want members to gain access to exclusive content as soon as they subscribe, lose access if their renewal payment fails repeatedly, and have their access cleanly revoked when they cancel. The marketing team also needs the subscription to offer a 14-day free trial to reduce churn from hesitant buyers, with a monthly billing cycle of $29.99.

The dev team needs a WordPress plugin that both creates the subscription product programmatically (for consistent staging/production deployments) and wires up the key lifecycle events — activation, renewal success, renewal failure, and cancellation — so that user roles and access are managed automatically without manual admin intervention.

## Output Specification

Write a single PHP plugin file at `premium-membership-plugin.php` that:

1. Creates the Premium Membership subscription product programmatically (to run once on activation or via a setup function).
2. Hooks into the relevant subscription lifecycle events to manage a custom WordPress user role called `premium_member`.
3. On repeated renewal failures (2 or more), the plugin should take additional protective action beyond just removing the role.

The plugin file should be self-contained and include all necessary `add_action` / `add_filter` calls. Include inline comments explaining each major section.
