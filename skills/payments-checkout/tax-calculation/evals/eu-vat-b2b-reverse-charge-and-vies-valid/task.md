# Add EU VAT Compliance to a Cross-Border Checkout

## Problem/Feature Description

EuroMart is a software tools marketplace based in Germany that recently opened sales to customers across all EU member states and the UK. The finance team has flagged an urgent compliance problem: the checkout currently charges a flat 19% German VAT on all orders regardless of the buyer's country or their business status. This is wrong — business customers in other EU countries should not pay VAT at all if they have a valid EU VAT registration number (the VAT liability shifts to them under the reverse charge mechanism), and B2C customers should pay VAT at their own country's rate, not Germany's.

Additionally, after a recent board meeting, the CTO asked for a summary of when EuroMart's cross-border tax obligations actually kick in — specifically, under what annual revenue conditions they need to register for OSS, and what thresholds apply to US sales tax nexus for a potential future US expansion.

Your task is to implement a VAT calculation module for EuroMart's Node.js checkout service and produce a short compliance reference document.

## Output Specification

Produce a JavaScript module at `lib/vatCalculation.js` that exports a function to compute VAT for an order given:
- `toAddress` (with a `country` field using ISO 3166-1 alpha-2 codes)
- `lineItems` (array with `unitPrice` and `quantity`)
- `buyerVatNumber` (optional string — present for B2B buyers)

The function should return an object describing the VAT amount, rate, and the type of VAT treatment applied.

Also produce a `compliance-notes.md` file summarizing:
- When EU VAT reverse charge applies and the validation step required
- The EU OSS/IOSS threshold that triggers mandatory registration for non-EU sellers
- The most common US economic nexus thresholds for context

Assume the seller is based in Germany (`DE`). The module should make real HTTP calls for VAT number validation — write the code as if network access is available.
