# Magento Production Indexer Configuration

## Problem/Feature Description

A mid-sized e-commerce retailer recently launched their Magento 2.4 store on a dedicated server. Since launch, the operations team has noticed several problems: admin users experience timeouts when saving products with large attribute sets, checkout occasionally stalls after promotions are applied, and the merchandising team has reported that newly imported products sometimes show incorrect prices for up to an hour after import.

The catalog contains approximately 80,000 SKUs including configurable products with many variants. The engineering team suspects the indexing configuration is contributing to both the timeout issues and the stale data problems, and they've asked you to produce a production-ready indexer setup and a runbook for diagnosing stale data incidents.

## Output Specification

Produce the following files:

1. `setup-indexers.sh` — A shell script that configures the indexers appropriately for production use and enables any optimizations suitable for a large catalog. The script should include comments explaining what each step does and why.

2. `env-indexer-snippet.php` — A PHP snippet showing the relevant section to add to `app/etc/env.php` to optimize indexer performance for the catalog size described above. Include exact values.

3. `indexer-runbook.md` — A markdown runbook for the operations team covering:
   - How to diagnose whether stale index data is causing wrong prices or invisible products
   - Safe procedures for triggering a reindex on a live production system
   - What to check when automatic reindexing appears to have stopped working
