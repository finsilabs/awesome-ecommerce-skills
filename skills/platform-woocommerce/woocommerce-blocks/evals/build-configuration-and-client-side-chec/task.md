# B2B VAT Number Field: Build Setup and Checkout Validation

## Problem/Feature Description

A B2B supplies company sells to businesses across the EU and needs to collect VAT registration numbers at checkout for proper invoicing and VAT exemption processing. A developer has already built the server-side Store API registration and order meta storage for the VAT field. Now they need two things: (1) a proper build configuration so the JavaScript source can be compiled for WordPress, and (2) client-side validation that checks the VAT number format before the customer can complete the order.

The validation requirement is: VAT numbers must start with a 2-letter EU country code followed by 2–13 alphanumeric characters (e.g. "DE123456789", "GB999999973"). If the format is invalid, checkout should be blocked and the customer shown a helpful error message on the VAT field.

The plugin has two JavaScript entry points: `src/frontend.js` (SlotFill/general frontend) and `src/blocks/vat-number/index.js` (the inner block). Both must be built.

## Output Specification

Produce the following files:

1. `package.json` — Node.js package file with the build scripts and correct devDependencies for a WordPress/WooCommerce blocks project
2. `src/blocks/vat-number/block.json` — Block manifest for the VAT number inner block (assume it should appear inside the checkout contact information step)
3. `src/blocks/vat-number/validation.js` — The client-side validation logic that hooks into WooCommerce checkout filters
4. `BUILD_NOTES.md` — Brief notes explaining: which build tool is used and why, how to run a development build vs production build, and what the entry points are

The VAT number block already exists — only the build setup and validation file need to be created. The grader will review these four files.
