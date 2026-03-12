# Redis Backend Configuration for Magento Production

## Problem/Feature Description

A growing online retailer is migrating their Magento 2.4 store from a single-server setup to a dedicated infrastructure. Their current setup uses the default file-based cache and PHP sessions stored on disk, which is causing race conditions during flash sales and poor performance under load. They've provisioned a single Redis instance (running on 127.0.0.1:6379) to serve all cache and session needs.

The company runs two environments — staging and production — that will share this Redis instance to reduce infrastructure costs. The DevOps lead is concerned about cache poisoning between environments and session loss under high concurrency. They also want clear Redis server configuration recommendations to handle memory pressure gracefully without losing customer sessions.

## Output Specification

Produce the following files:

1. `env-redis.php` — The complete Redis section to insert into `app/etc/env.php` for a production environment. The configuration should cover the default application cache, full-page cache, and session storage. Use placeholder values where credentials would go, but all other settings should be concrete and production-ready.

2. `redis-server.conf` — A redis.conf snippet (or a commented configuration file) showing the recommended memory eviction policy settings for the three logical Redis use cases in this setup (application cache, full-page cache, and sessions). Include comments explaining why each policy is appropriate.

3. `redis-setup-notes.md` — A brief technical notes document for the DevOps team explaining the multi-environment Redis sharing approach and any naming conventions used to prevent conflicts.
