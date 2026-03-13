---
name: woocommerce-subscriptions
description: "Add subscription products to WooCommerce with automatic recurring billing, renewal notifications, and subscriber self-service management"
category: platform-woocommerce
risk: safe
source: curated
date_added: "2026-03-12"
tags: [woocommerce, subscriptions, recurring-payments, billing, renewal, stripe, php]
triggers: ["woocommerce subscriptions", "woocommerce recurring payments", "woocommerce subscription product", "woocommerce renewal", "woocommerce billing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [woocommerce]
difficulty: intermediate
---

# WooCommerce Subscriptions

## Overview

WooCommerce Subscriptions (the official premium plugin) adds subscription product types — simple subscriptions and variable subscriptions — with configurable billing periods (daily, weekly, monthly, yearly), free trials, sign-up fees, and prorated upgrades/downgrades. It integrates with Stripe, PayPal Reference Transactions, and other gateways that support automated recurring billing. Custom logic hooks into the subscription lifecycle via a rich set of WordPress actions and filters.

## When to Use This Skill

- When selling products or services on a recurring billing schedule (SaaS, memberships, box subscriptions)
- When implementing subscription upgrades, downgrades, or plan switching
- When building custom renewal logic or adding business rules around failed payment retry
- When integrating subscription status with access control (e.g., membership site content gates)
- When extending subscription emails or admin reporting with custom data
- When creating subscription add-ons or per-unit quantity scaling

## Core Instructions

1. **Create a subscription product programmatically**

   ```php
   <?php
   // Create a simple subscription product via code (e.g., in a migration script)
   $product = new WC_Product_Subscription();
   $product->set_name('Monthly Pro Plan');
   $product->set_status('publish');
   $product->set_regular_price('29.99');

   // Save first so the product gets an ID
   $product->save();

   // Subscription-specific meta (product must be saved before setting post meta)
   update_post_meta($product->get_id(), '_subscription_price', '29.99');
   update_post_meta($product->get_id(), '_subscription_period', 'month');
   update_post_meta($product->get_id(), '_subscription_period_interval', '1');
   update_post_meta($product->get_id(), '_subscription_length', '0'); // 0 = forever
   update_post_meta($product->get_id(), '_subscription_trial_length', '14');
   update_post_meta($product->get_id(), '_subscription_trial_period', 'day');
   update_post_meta($product->get_id(), '_subscription_sign_up_fee', '0');
   ```

2. **Hook into subscription lifecycle events**

   WooCommerce Subscriptions fires specific actions at each lifecycle stage:

   ```php
   <?php

   // When a new subscription is created (after successful first payment)
   add_action('woocommerce_subscription_status_active', function ($subscription) {
       $user_id = $subscription->get_user_id();
       $plan = $subscription->get_items(); // Array of WC_Order_Item_Product

       // Grant access — e.g., set user role or update capabilities
       $user = new WP_User($user_id);
       $user->add_role('subscriber_member');

       // Track in analytics
       error_log("Subscription {$subscription->get_id()} activated for user {$user_id}");
   });

   // When a renewal payment succeeds
   add_action('woocommerce_subscription_renewal_payment_complete', function ($subscription, $last_order) {
       $user_id = $subscription->get_user_id();
       // Extend access, send renewal receipt, update CRM
       do_action('my_plugin_renewal_processed', $user_id, $subscription);
   }, 10, 2);

   // When a renewal payment fails
   add_action('woocommerce_subscription_payment_failed', function ($subscription, $last_order) {
       $user_id = $subscription->get_user_id();
       $retry_count = $subscription->get_failed_payment_count();

       // Notify user and optionally pause access
       if ($retry_count >= 2) {
           $user = new WP_User($user_id);
           $user->remove_role('subscriber_member');
           // Send dunning email
           $subscription->update_status('on-hold');
       }
   }, 10, 2);

   // When subscription is cancelled
   add_action('woocommerce_subscription_status_cancelled', function ($subscription) {
       $user_id = $subscription->get_user_id();
       $user = new WP_User($user_id);
       $user->remove_role('subscriber_member');
   });
   ```

3. **Query subscriptions programmatically**

   ```php
   <?php

   // Get all active subscriptions for a user
   function get_user_active_subscriptions(int $user_id): array {
       return wcs_get_users_subscriptions($user_id, ['active']);
   }

   // Check if a user has an active subscription to a specific product
   function user_has_active_subscription_to_product(int $user_id, int $product_id): bool {
       $subscriptions = wcs_get_subscriptions_for_product($product_id, 'any', ['customer_id' => $user_id]);
       foreach ($subscriptions as $subscription) {
           if ($subscription->has_status('active')) {
               return true;
           }
       }
       return false;
   }

   // Get subscription by ID
   function get_subscription_details(int $subscription_id): ?WC_Subscription {
       $subscription = wcs_get_subscription($subscription_id);
       if (!$subscription) return null;

       return $subscription;
   }

   // Usage
   $subscription = get_subscription_details(1234);
   if ($subscription) {
       echo $subscription->get_status();           // 'active', 'on-hold', 'cancelled', etc.
       echo $subscription->get_next_payment_date(); // ISO 8601 date
       echo $subscription->get_total();            // Current billing amount
   }
   ```

4. **Handle plan upgrades and downgrades**

   ```php
   <?php

   // Add proration logic for plan switches
   add_filter('woocommerce_subscriptions_switch_proration', function ($proration_amount, $subscription, $new_order, $product, $switch_cart_item) {
       // Custom proration: charge/credit based on days remaining in billing period
       $next_payment = strtotime($subscription->get_next_payment_date());
       $last_payment = $subscription->get_date('last_payment');
       $billing_period_days = ($next_payment - strtotime($last_payment)) / DAY_IN_SECONDS;
       $days_remaining = ($next_payment - time()) / DAY_IN_SECONDS;

       $old_daily_rate = (float)$subscription->get_total() / $billing_period_days;
       $new_product_price = (float)$switch_cart_item['data']->get_price();
       $new_daily_rate = $new_product_price / $billing_period_days;

       // Credit remaining days at old rate, charge at new rate
       $proration_amount = ($new_daily_rate - $old_daily_rate) * $days_remaining;

       return round($proration_amount, 2);
   }, 10, 5);

   // Trigger a plan switch programmatically
   function switch_subscription_plan(int $subscription_id, int $new_product_id): bool {
       $subscription = wcs_get_subscription($subscription_id);
       if (!$subscription) return false;

       // Remove existing item and add new product
       foreach ($subscription->get_items() as $item_id => $item) {
           $subscription->remove_item($item_id);
       }

       $item = new WC_Order_Item_Product();
       $item->set_product(wc_get_product($new_product_id));
       $item->set_quantity(1);
       $subscription->add_item($item);

       // Recalculate totals
       $subscription->calculate_totals();
       $subscription->save();

       return true;
   }
   ```

5. **Retry failed payments and synchronize billing dates**

   ```php
   <?php

   // Trigger an immediate payment retry (e.g., from an admin action)
   function retry_failed_subscription_payment(int $subscription_id): bool {
       $subscription = wcs_get_subscription($subscription_id);
       if (!$subscription || !$subscription->has_status('on-hold')) {
           return false;
       }

       // Create a renewal order and attempt payment
       $renewal_order = wcs_create_renewal_order($subscription);
       if (is_wp_error($renewal_order)) {
           return false;
       }

       // Process payment using the subscription's payment method
       $payment_gateway = wc_get_payment_gateway_by_order($subscription);
       if ($payment_gateway && method_exists($payment_gateway, 'scheduled_subscription_payment')) {
           $payment_gateway->scheduled_subscription_payment(
               $renewal_order->get_total(),
               $renewal_order
           );
       }

       return true;
   }

   // Synchronize all active subscriptions to renew on the 1st of the month
   add_filter('woocommerce_subscriptions_synced_next_payment_date', function ($next_payment_date, $product, $from_timestamp, $trial_end_timestamp) {
       if ($product->get_meta('_subscription_period') === 'month') {
           $next_month = date('Y-m-01', strtotime('+1 month'));
           return strtotime($next_month);
       }
       return $next_payment_date;
   }, 10, 4);
   ```

## Examples

### Suspension and reinstatement flow

```php
<?php

// Admin-triggered suspension with reason logging
function suspend_subscription_with_reason(int $subscription_id, string $reason): void {
    $subscription = wcs_get_subscription($subscription_id);
    if (!$subscription) return;

    // Store suspension reason as meta before status change
    $subscription->update_meta_data('_suspension_reason', $reason);
    $subscription->update_meta_data('_suspension_date', current_time('mysql'));
    $subscription->save();

    // Change status to on-hold (fires woocommerce_subscription_status_on-hold action)
    $subscription->update_status('on-hold', sprintf('Suspended: %s', $reason));
}

// Reinstate and reset payment date
function reinstate_subscription(int $subscription_id): void {
    $subscription = wcs_get_subscription($subscription_id);
    if (!$subscription || !$subscription->has_status('on-hold')) return;

    // Reset next payment date to avoid immediately triggering a renewal
    $subscription->set_date('next_payment', strtotime('+1 month'));

    // Activate subscription
    $subscription->update_status('active', 'Reinstated by admin');
    $subscription->save();
}
```

### Custom subscription email

```php
<?php

// Add a custom "Renewal Reminder" email 7 days before renewal
add_filter('woocommerce_email_classes', function ($email_classes) {
    require_once plugin_dir_path(__FILE__) . 'class-renewal-reminder-email.php';
    $email_classes['My_Renewal_Reminder_Email'] = new My_Renewal_Reminder_Email();
    return $email_classes;
});

// Schedule the emails via WooCommerce action scheduler
add_action('woocommerce_scheduled_subscription_payment', function ($subscription_id) {
    $subscription = wcs_get_subscription($subscription_id);
    if (!$subscription) return;

    // Schedule reminder 7 days before next payment
    $next_payment = strtotime($subscription->get_next_payment_date()) - (7 * DAY_IN_SECONDS);
    if ($next_payment > time()) {
        as_schedule_single_action(
            $next_payment,
            'my_plugin_send_renewal_reminder',
            [['subscription_id' => $subscription_id]]
        );
    }
}, 10);
```

## Best Practices

- **Use Action Scheduler** (bundled with WooCommerce) for all async subscription tasks — never rely on WP cron for payment-critical operations
- **Always use `wcs_get_subscription()` with null-checks** — subscriptions may be deleted or missing in edge cases (manual deletions, import failures)
- **Test payment gateway token handling** — subscription renewals require a stored payment token; test that the gateway correctly charges the original card on file during renewal
- **Handle failed payment dunning explicitly** — the default retry schedule is 1, 4, and 7 days after failure; customize via `wcs_retry_rules` filter to match your business policy
- **Log all subscription status changes** — store status change history in order notes or a custom table for auditing and customer support
- **Respect proration on plan switches** — don't force customers to pay double for the same period; use built-in proration or implement custom logic
- **Test upgrade/downgrade edge cases** — especially when a trial is active or when the billing period changes (monthly to annual)
- **Use `wcs_user_has_subscription()` for access control** — it's more reliable than checking user roles alone

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Renewal payments not processing | Check that the payment gateway has `supports[] = subscription` in its capabilities; gateways must explicitly declare subscription support |
| Subscription status stays "pending" after successful payment | The `woocommerce_payment_complete` action must fire — verify the payment gateway calls `$order->payment_complete()` on success |
| Proration results in negative charge | Implement minimum floor of `0.00` in the proration filter return value; negative amounts cause gateway errors on most processors |
| `wcs_get_subscriptions_for_product` returns empty | Pass the product's parent ID for variations — WCS stores the parent product ID, not the variation ID, on subscription items |
| Trial ends but renewal isn't charged | Ensure `_subscription_trial_length` meta is set to a number > 0 AND the payment gateway token is stored correctly from the initial order |
| Cancellation emails sent on admin status changes | Add `remove_action` for `woocommerce_subscription_status_cancelled` before programmatic cancellations and re-add after if you need to suppress emails |

## Related Skills

- @woocommerce-plugin-development
- @woocommerce-rest-api
- @subscription-billing
- @stripe-integration
- @woocommerce-blocks
