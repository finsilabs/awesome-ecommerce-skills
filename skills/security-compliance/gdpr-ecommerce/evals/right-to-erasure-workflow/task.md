# Customer Data Deletion Pipeline

## Problem/Feature Description

Verdana Commerce operates an e-commerce platform that recently started receiving formal deletion requests from customers exercising their rights under EU data protection law. The support team is currently handling these requests manually — a process that takes hours per request, involves multiple systems, and is inconsistently executed. The data protection officer has flagged that this creates compliance risk and that they need a reliable, repeatable automated process.

The complication is that Verdana is subject to tax and financial record-keeping obligations, which means they cannot simply delete all customer data. Order history must be retained for up to seven years. At the same time, the marketing team uses Klaviyo for email campaigns, the support team uses Zendesk, and there is a points-based loyalty platform — all of which hold copies of customer personal data that also need to be purged. The platform also has a product review system where customers have left reviews under their names.

Write a TypeScript module that implements the erasure processing logic. Assume a `db` object is available with methods matching the pattern `db.<table>.<method>(customerId)`. Assume third-party clients (`klaviyo`, `zendesk`, `loyaltyPlatform`) are imported and available. You do not need to implement these — just call their methods as if they exist.

## Output Specification

Produce the following files:

- `lib/gdpr-deletion.ts` — the main erasure function `processErasureRequest(customerId: string)` with all steps of the deletion/anonymization pipeline
- `lib/gdpr-deletion.test.ts` — unit tests (using any testing framework) covering at minimum: the pending-orders guard, the anonymization path for orders, and the third-party notification step
- `DELETION_PIPELINE.md` — a short document describing each step of the pipeline and noting any systems that must be manually verified or that are not yet automated (e.g. search indexes or analytics warehouses)
