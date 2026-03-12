# Post-Order Analytics Hook and Customer Feedback Form

## Problem/Feature Description

Acme's e-commerce platform needs two new integrations in a custom SFCC cartridge called `int_acme_engagement`:

**Order Analytics Hook:** The analytics team wants to receive order data in real-time whenever a new order is placed through the OCAPI storefront API. They have provided an endpoint that accepts order summary data as a JSON POST. The hook must be wired in correctly so SFCC calls it automatically after each OCAPI order creation.

**Customer Feedback Form:** The customer success team needs a feedback form on the storefront where shoppers can submit their name, email, and a message after completing a purchase. The form should validate that all three fields are present before saving the submission. Submissions should be persisted as SFCC Custom Objects. The support team expects to be able to diagnose errors from log files in Business Manager.

Build both features and include a `IMPLEMENTATION_NOTES.md` that describes the file layout and how the hook registration works.

## Output Specification

Produce all files under `int_acme_engagement/` in your working directory. The deliverable should include:

- The OCAPI hook implementation and its registration configuration
- The feedback form controller at `int_acme_engagement/cartridge/controllers/Feedback.js`
- The form handling support files
- `IMPLEMENTATION_NOTES.md` describing the file layout and approach
