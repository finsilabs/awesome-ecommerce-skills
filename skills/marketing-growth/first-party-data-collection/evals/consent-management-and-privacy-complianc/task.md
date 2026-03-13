# Privacy Compliance Module for a Multi-Region E-Commerce Platform

## Problem/Feature Description

BrightCart is a fashion e-commerce platform operating in both the EU and United States. Following a recent external GDPR audit, their legal team has raised concerns that BrightCart's current consent management system would be difficult to defend in a regulatory investigation: the audit report noted that consent records lacked sufficient metadata to reconstruct what a customer agreed to and under what circumstances, and that historical consent states could not be reliably verified. The auditors also flagged that customer data removal requests were being fulfilled incompletely.

A separate incident this quarter highlighted a CCPA compliance gap: after a California customer submitted a "do not sell my data" request, the customer's data continued to be used in targeted digital advertising, resulting in a formal complaint. The root cause was that the opt-out process only updated an internal database flag without propagating to the downstream advertising systems BrightCart uses for audience targeting.

Additionally, the customer support team has received complaints from customers who opted out of marketing emails but then stopped receiving their order confirmations and shipping updates. Engineering identified that the consent logic was not distinguishing between different categories of customer communication.

The engineering team needs a TypeScript consent management module that addresses all of these issues. The module will be reviewed by the legal team, so the design documentation should explain the architectural decisions clearly.

## Output Specification

Produce the following TypeScript files:

- `consent-manager.ts` — the `recordConsent` function and `ConsentRecord` type
- `erasure-handler.ts` — the `handleErasureRequest` function implementing GDPR right-to-erasure
- `ccpa-handler.ts` — the `handleCcpaOptOut` function
- `consent-design.md` — a document for the legal team describing:
  - What data is captured for each consent record and why it is needed for compliance
  - How the design ensures historical consent states are auditable over time
  - How different categories of customer email are handled differently
  - What external systems are notified during data removal and opt-out flows

Assume the following are available as imports:
- `db` — a database client with `.consentLogs.create()`, `.customerProfiles.update()`, etc.
- `emailServiceClient` — an ESP client with `.deleteProfile(customerId)` and `.updateContactProperty(customerId, key, value)` methods
- `adPlatformClient` — with `.suppressFromCustomerMatch(customerId)` and `.suppressFromCustomAudiences(customerId)` methods
