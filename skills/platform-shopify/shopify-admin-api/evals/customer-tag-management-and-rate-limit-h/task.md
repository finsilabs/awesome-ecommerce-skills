# Customer Loyalty Tagging System

## Problem/Feature Description

An e-commerce brand wants to implement a loyalty tier system in their Shopify store. After analyzing purchase history in their CRM, they have identified customers who qualify for "vip", "gold", or "silver" loyalty tiers. They need a script that applies these loyalty tags to the corresponding customer records in Shopify. Customer profiles may already carry labels from previous campaigns (such as "newsletter", "wholesale", "eu-customer"), and these must not be lost in the process.

The operation needs to handle a list of customer records, look each customer up by email address, and apply the appropriate loyalty tag. Since this involves many sequential API calls, the script must be resilient to rate limiting. The merchant has seen API errors before and needs the script to recover gracefully rather than failing partway through the list.

## Output Specification

Produce a TypeScript script (`tag-customers.ts`) that:
- Reads a list of customer tag assignments from a JSON file (`customers.json`)
- For each customer, finds the customer in Shopify by email and adds the specified tag without disrupting any labels they already have
- Writes a results summary to `tagging-results.json` with the outcome for each customer (success/failure and final tags)
- Handles rate limiting gracefully

Also produce a `package.json` with necessary dependencies.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: customers.json ===============
[
  { "email": "alice@example.com", "tag": "vip" },
  { "email": "bob@example.com", "tag": "gold" },
  { "email": "carol@example.com", "tag": "silver" },
  { "email": "david@example.com", "tag": "vip" },
  { "email": "eve@example.com", "tag": "gold" }
]
