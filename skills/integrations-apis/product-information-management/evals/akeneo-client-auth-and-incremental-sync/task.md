# Akeneo PIM Sync Integration

## Problem/Feature Description

A growing e-commerce company has just licensed Akeneo PIM as their central hub for product content. The engineering team needs to build the foundational TypeScript integration layer that connects their Node.js backend to Akeneo, so that product data flows automatically into their commerce database whenever merchandisers update products in Akeneo.

The team currently does a full catalog export every night (all 20,000 products), which takes 45 minutes and hammers the Akeneo API. They need a new approach that only fetches products changed since the last run. The integration also needs to be resilient — a single bad product record shouldn't abort the whole job and lose updates for the rest of the catalog. The last-sync timestamp should be persisted between runs so the job can always pick up where it left off.

## Output Specification

Produce a TypeScript implementation with the following files:

- `lib/akeneo/client.ts` — Akeneo API client class
- `jobs/akeneo-sync.ts` — Scheduled sync job

The implementation should be realistic, runnable TypeScript (no pseudo-code). Use environment variables for all credentials and configuration. Add a `sync-log.md` documenting how the key design decisions in the implementation work — specifically the authentication approach, pagination strategy, and how incremental sync is achieved.
