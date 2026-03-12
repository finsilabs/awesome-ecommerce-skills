# Warranty Claims Module for Medusa Backend

## Problem/Feature Description

A B2B hardware retailer has recently migrated their storefront to Medusa. Their product catalog includes electronics and appliances that carry manufacturer warranties of varying lengths (1-year, 2-year, lifetime). Currently, when customers submit warranty claims through the website, staff handle them manually in a spreadsheet — a process that breaks down as order volume grows.

The engineering team has been asked to add warranty claim tracking directly into the Medusa backend. Each warranty claim must record which order it belongs to, which product variant is affected, the warranty duration in months, and the current claim status (open, approved, rejected, resolved). The service should expose methods to create a claim, update its status, and list claims for a given order. The team also wants a brief developer notes document explaining how to activate the module in the project configuration and apply the database schema changes.

## Output Specification

Produce the following files:

- `src/modules/warranty/models/warranty-claim.ts` — the data model definition
- `src/modules/warranty/service.ts` — the module service
- `src/modules/warranty/index.ts` — module registration
- `medusa-config.ts` — project config showing how the module is wired in (may be partial/illustrative, but must show the relevant registration)
- `NOTES.md` — a short developer notes file explaining how to activate the module and run the required database command after adding it
