# WooCommerce Redis Caching Setup

## Problem Description

A mid-sized fashion retailer running WooCommerce is experiencing significant database load during peak hours. Their DBA has identified that MySQL is handling thousands of identical queries per minute — most of them fetching the same product data, shipping zone configuration, and tax rules over and over on every page request. The team has provisioned a Redis server at `127.0.0.1:6379` and wants it wired into WordPress as a persistent object cache.

The store runs WooCommerce on a standard LEMP stack. They want an experienced developer to produce a production-ready `wp-config.php` snippet that enables Redis object caching correctly. They're particularly concerned about cache correctness on the checkout path, where volatile data (sessions, cart counters) must never be served stale, and they want a sensible maximum TTL so memory doesn't grow unbounded.

## Output Specification

Produce a file named `redis-config.php` containing only the `define()` constants that should be added to `wp-config.php` to configure the Redis object cache. The file should include brief inline comments explaining the purpose of each constant.

Also produce a short `setup-notes.md` explaining:
1. Which WP-CLI commands are needed to install and activate the required plugin and enable the cache
2. Why certain cache groups are excluded from Redis in this configuration
