# Invoice Number Generator

## Problem/Feature Description

Nexus Commerce operates across multiple EU countries and is required by tax authorities to produce invoices with strictly sequential, gap-free numbering — any gap in the sequence can trigger an audit and result in fines. The business also issues proforma invoices (quotes sent before payment) and credit notes (partial or full refunds), which must each belong to their own independent series to avoid confusion with the legal invoices.

The company runs the billing service on multiple application servers simultaneously. In the past, a naive JavaScript counter caused duplicate invoice numbers when two orders were completed at the same moment, and a junior developer's fix (using UUIDs) was rejected by the tax authority as non-compliant.

Your task is to implement the invoice number generation module in JavaScript/Node.js using Prisma as the ORM against a PostgreSQL database. The module must handle concurrent requests safely, produce the correct number formats, and keep the different invoice series completely separate.

## Output Specification

Produce the following files:

- `src/number-generator.js` — The number generator module with at minimum two exported functions:
  - `generateInvoiceNumber({ year, prefix, locale })` — generates the next number in the main invoice series
  - `generateCreditNoteNumber(originalInvoiceNumber)` — generates the next credit note number

- `src/number-generator.test.js` — Unit/integration tests (using any test framework) that document the expected behaviour, covering the number format, series separation, and concurrency safety.

- `package.json` — Declares required dependencies.

Write a `README.md` section (or a comment block at the top of `number-generator.js`) that explains the concurrency strategy used and why it prevents gaps.
