# Sponsored Products Keyword Harvesting Tool

## Problem/Feature Description

An Amazon seller running Sponsored Products campaigns has noticed their auto campaign is finding converting search terms, but those terms are not being captured in their manual campaign for more precise bidding control. They need a scheduled harvesting process that automatically identifies high-performing search queries from their auto campaign and promotes them to their manual campaign so they can bid more efficiently on proven terms.

The seller's marketing operations team wants this as a TypeScript module they can run as a scheduled automation job. The system should be smart about which queries to promote — not every query that gets a click is worth promoting, and they don't want to flood the manual campaign with untested terms. Once a term is promoted, the auto campaign should stop competing on it to avoid bidding against themselves.

The seller uses a target ACOS that varies by product, so the threshold should be configurable via environment variable rather than hardcoded.

## Output Specification

Write a TypeScript file named `keyword-harvester.ts` that:
- Implements a function to harvest converting keywords from an auto campaign and add them to a manual ad group
- Pulls the appropriate search term report with correct parameters
- Applies filtering logic to select only statistically reliable, high-performing queries
- Adds qualifying queries to the manual campaign and prevents the auto campaign from competing on them
- Reads the target ACOS from an environment variable (fall back to a sensible default if not set)

The implementation should use `fetch` for HTTP calls and follow the same Amazon Ads API authentication pattern (config object with clientId, clientSecret, refreshToken, profileId, region).
