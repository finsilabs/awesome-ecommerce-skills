# Merchant Center Health Check and Global Expansion

## Problem Description

Meridian Outdoors is a direct-to-consumer gear brand that sells camping and hiking equipment. After a recent backend migration, their product disapproval rate in Google Merchant Center spiked significantly, and they're not sure which issues are most widespread. At the same time, the business is expanding from the US market into the UK and Canada, and needs Shopping ads running in those regions too.

The team has two immediate needs:

1. **Disapproval audit tool** — A TypeScript script that connects to Merchant Center and produces a ranked summary of the most common disapproval reasons across the entire catalog. The output should make it easy to see which issues to fix first.

2. **Multi-country product insertion** — A TypeScript function that takes a product SKU and pushes that product to Merchant Center for all three target markets (US, UK, Canada) with region-appropriate pricing. Some products in their catalog are Meridian's own-brand designs with no GTIN, while others are third-party branded items with barcodes. Both cases need to be handled correctly.

The team has encountered two specific recurring problems: variants of the same product appearing as separate unrelated listings in Shopping results, and some of their private-label products getting flagged for missing product identifiers. The solution should handle both of these cases correctly.

Write the implementation in `merchant-tools.ts`. Since no real API credentials are available, use mock data (at least one GTIN-enabled product and one private-label product, each with at least 2 variants) defined inline. Include comments explaining how each issue is addressed.

## Output Specification

- `merchant-tools.ts`: Contains the audit function and multi-country insertion function
- The audit function should output a sorted table or JSON showing issue codes by frequency
- The multi-country function should demonstrate correct per-country configuration
- No large files should be left on disk
