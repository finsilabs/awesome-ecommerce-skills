# Marketing Platform Sync and Audience Management

## Problem Description

PeakPulse Athletics, an activewear e-commerce brand, is scaling up their paid and owned marketing. Their marketing operations team needs to connect their customer segmentation system to two external platforms: Klaviyo (for lifecycle email campaigns) and Meta (for paid social advertising). Right now, the team manually exports CSVs and uploads them — a process that's error-prone and runs once a week at best.

The engineering team has a database with a `customerSegmentMemberships` table that stores which customers belong to which segments (with a `segmentId` and `customerId`), a `customers` table with fields: `id`, `email`, `firstName`, `lastName`, `phone`, and an `orders` table with `customer_id`, `created_at`, `status` ('completed', 'cancelled', 'refunded', 'pending'). Each marketing segment in Klaviyo corresponds to a Klaviyo List ID.

One critical requirement: the team wastes significant ad budget on customers who already purchased recently. The Meta export must handle privacy requirements correctly. The engineering lead also warned that when the team previously synced to Klaviyo, duplicate customer profiles appeared — this must be documented with a recommended fix.

The team wants two TypeScript modules implementing the sync logic, plus a runbook explaining the duplicate profile issue and how to resolve it.

## Output Specification

Produce the following files:

1. `klaviyo_sync.ts` — A TypeScript module with a `syncSegmentToKlaviyo(segmentId, klaviyoListId)` function that:
   - Fetches all customer IDs in the segment and their profile data
   - Syncs the customers to the specified Klaviyo list
   - Uses the correct Klaviyo API endpoint structure and authentication format
   - Uses `process.env.KLAVIYO_PRIVATE_KEY` for the API key
   - Includes logic to handle the case where a segment has 0 members (guard against empty syncs)

2. `meta_suppression.ts` — A TypeScript module with an `exportSuppressionListForMeta()` function that:
   - Exports recent purchasers (last 30 days, completed orders only) as a suppression list
   - Applies the required privacy transformation to email addresses before export
   - Returns an array of objects suitable for Meta Custom Audiences

3. `klaviyo_runbook.md` — A markdown document explaining the duplicate profile problem that can occur when syncing to Klaviyo and the recommended approach to resolve it, including which field should be used as the primary key.
