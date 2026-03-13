# Invoice PDF Renderer Service

## Problem/Feature Description

Acme Supplies is a B2B wholesale distributor that needs to generate professional PDF invoices for every completed order. Their current system emails plain-text order confirmations, but enterprise customers are increasingly requiring proper invoices — complete with branded headers, itemised line details, per-line tax information, and all the information needed for customers to process payment or submit expense claims.

Your task is to build a self-contained invoice PDF renderer module in JavaScript/Node.js. The renderer must accept invoice data (including line items, each with its own tax rate and tax amount) and a template definition (with branding configuration like colors and paper size), and produce a PDF buffer. The generated PDF must be suitable for sending directly to customers and should handle all the financial details correctly.

The finished module should be production-ready, with a working example that can be executed to verify the output.

## Output Specification

Produce the following files:

- `src/pdf-renderer.js` — The renderer module implementing the full PDF generation logic.
- `src/invoice-template.html` — A complete Handlebars HTML template for an invoice that a customer could actually receive. The template should handle all the invoice fields and produce a visually complete, professional document.
- `example/generate-invoice.js` — A standalone script that imports the renderer, defines sample invoice data with at least two line items carrying different tax rates, and calls the renderer to produce a PDF file saved to `example/output-invoice.pdf`. The script should print the resulting PDF file size to stdout.
- `package.json` — Declares the required dependencies.

The script in `example/generate-invoice.js` should be runnable with `node example/generate-invoice.js` after `npm install`. Clean up the PDF file if it is larger than 50 MB (it should not be).
