# Build Elasticsearch Search Merchandising Query Builder

## Problem/Feature Description

A sports apparel company uses Elasticsearch to power their storefront search. Their merchandising team wants to apply promotional boosts during a summer campaign: products tagged as "summer" or "outdoor" should rank higher in search results, while still using Elasticsearch's relevance scoring as the foundation. They also need to ensure that in-stock products and products with images always get a baseline boost over those that don't.

You need to build the function that constructs the Elasticsearch query given a search term and a list of active merchandising boost rules. The resulting query object should be ready to send to Elasticsearch's `_search` endpoint.

Additionally, the head of merchandising wants a simple admin logging mechanism: every time a new merchandising rule is created through the API, the action should be recorded with enough context to later audit who changed what and when.

## Output Specification

Create `search_query_builder.ts` (or equivalent language) containing:

1. A function `buildSearchQuery(searchTerm, boostRules)` that produces an Elasticsearch query object
2. A function `logRuleCreation(adminUserId, rule)` (or equivalent) that records a structured audit log entry so that changes can later be reviewed by the compliance team

Save a demonstration script to `search_demo.ts` (or equivalent) that:
- Builds a sample query for the search term "running shoes" with two boost rules (e.g., boost products tagged "summer" by +60, boost vendor "Nike" by +30)
- Calls the audit log function to record a rule creation event
- Prints the generated Elasticsearch query as formatted JSON to stdout
- Writes the audit log entries to `audit_log.json`

Run the demo and save the query output to `search_output.json`.
