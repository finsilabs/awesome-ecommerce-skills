# Invoice Generation Orchestrator

## Problem/Feature Description

Meridian Digital sells SaaS subscriptions and physical goods to both US businesses and EU companies. Their order system fires an event for every completed order, but invoice generation sometimes crashes mid-way (network error, database timeout), causing the same order to trigger invoice generation twice and resulting in duplicate invoices — one of which is usually incomplete. Additionally, the finance team discovered that some invoices sent to German and French B2B buyers are missing the buyer's VAT number and the correct invoice type, causing those customers to reject them for their own VAT reclaim.

Meridian also needs QuickBooks to stay in sync with every invoice so the accounting team doesn't have to manually enter them. However, QuickBooks connectivity is unreliable, and when sync fails it currently crashes the entire invoice creation flow and leaves orders without any invoice at all.

Your task is to implement the `generateAndSendInvoice(order)` orchestrator function in JavaScript/Node.js. The function must handle the full invoice lifecycle: safe handling of repeated calls for the same order, determining the correct invoice type based on the customer's region, persisting all relevant data, synchronising with the accounting system without letting connectivity issues break the flow, and emailing the invoice to the customer.

## Output Specification

Produce the following files:

- `src/invoice-service.js` — The orchestrator module. It may import helper functions from sibling modules (you can stub those as needed). Document the key design decisions in inline comments.
- `src/accounting-sync.js` — The QuickBooks accounting sync module.
- `src/invoice-email.js` — A stub email sender module that logs what it would send.
- `package.json` — Declares required dependencies.
- `src/invoice-service.test.js` — Tests that document the key behaviours: handling of repeated calls for the same order, EU vs non-EU invoice type selection, and accounting sync failure handling.
