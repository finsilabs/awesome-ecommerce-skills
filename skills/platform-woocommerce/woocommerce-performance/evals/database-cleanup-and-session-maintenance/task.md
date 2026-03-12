# WooCommerce Database Maintenance Plugin

## Problem Description

A busy WooCommerce store has been running for three years without any database maintenance. The operations team has flagged that the `wp_woocommerce_sessions` table has grown to over 4 million rows (most of them abandoned sessions from bots and expired guest checkouts), expired transients are cluttering `wp_options`, and the WooCommerce log table is consuming gigabytes of disk space. Nightly backups are taking too long and the DB server is showing elevated I/O during business hours.

The team wants a WordPress plugin that runs automated cleanup on a daily schedule. A previous developer started work on the file below but never finished it — your job is to complete the implementation so it correctly handles all three cleanup tasks. The plugin must be safe to run on a live store: large DELETE operations must be batched appropriately, and the schedule must be registered so it only fires once per day and won't double-register on repeated plugin activations.

## Output Specification

Produce a single PHP file named `wc-maintenance.php` that contains a complete, working WordPress plugin implementing the daily cleanup routine. The plugin header (Plugin Name, Description, Version) should be included.

Also produce a `cleanup-design.md` that briefly describes:
- The scheduling mechanism used and why it was chosen
- The batch size decisions and their rationale
- The session expiry window used

## Input Files

The following starter file is provided. Extract it before beginning.

=============== FILE: inputs/wc-maintenance-stub.php ===============
<?php
/**
 * Plugin Name: WC Maintenance
 * Description: Daily WooCommerce database cleanup
 * Version: 0.1.0
 */

// TODO: Register the daily cleanup action using the correct scheduling API
// TODO: Hook the cleanup function to the registered action

function wc_maintenance_run_cleanup() {
    global $wpdb;

    // TODO: Delete expired WooCommerce sessions
    // Sessions are stored in {prefix}woocommerce_sessions
    // A session is expired when session_expiry timestamp is in the past

    // TODO: Delete expired transients from wp_options
    // Step 1: delete _transient_timeout_ entries that are past due
    // Step 2: delete orphaned _transient_ entries with no matching timeout entry

    // TODO: Delete old WooCommerce log entries
    // Logs are stored in {prefix}woocommerce_log
}
