# Behavioral Analytics and Checkout Health Audit

## Problem/Feature Description

Petal & Stone, a boutique e-commerce brand selling handmade ceramics, has a 68% checkout abandonment rate. They have anecdotal evidence of users clicking around seemingly interactive elements that don't respond, and customer support frequently receives complaints about confusing form errors. The head of UX wants to instrument the checkout flow with behavioral analytics so the team can see where users are struggling, and also wants an automated audit that flags structural checkout issues before the upcoming holiday season.

The engineering team has a Hotjar account already set up on the site (the snippet is already loaded on all pages via their tag manager, so `window.hj` is available). They want frontend TypeScript code that hooks into Hotjar to capture specific behavioral signals, particularly around form field interactions and how far users scroll on product pages. They also want a programmatic audit module that checks their checkout pages for the most impactful structural problems.

Your goal is to produce two TypeScript modules: one that wires up the behavioral event tracking, and one that defines and runs the checkout audit checks. Also produce a brief audit findings report using a sample checkout page description provided below.

## Output Specification

Produce the following files:

- `behavioral-tracking.ts` — TypeScript module that initializes CRO event tracking. It should capture behavioral signals from forms and pages to surface to the analytics tool.
- `checkout-audit.ts` — TypeScript module defining the audit check list and the function to run all checks against a checkout page. Include the full list of checks as a typed data structure.
- `audit-findings.md` — A short findings report based on the sample page description below, listing which audit checks pass or fail and the top recommendations. Include specific checkout UX improvements the team should prioritize.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/sample-checkout-page.md ===============
# Sample Checkout Page Description

## Current State

The checkout flow is a single long-scroll page (not multi-step) with the following characteristics:

- Users must create an account before they can proceed to payment (no guest option)
- The payment section is 900px below the fold on mobile; the "Complete Purchase" button is only visible after scrolling
- Form validation errors appear in a red banner at the top of the page after the user clicks "Submit"
- The address form has 8 required fields: first name, last name, address line 1, address line 2, city, state, zip code, country — with no autocomplete enabled
- There are no security badges, SSL indicators, or accepted card logos visible near the payment fields
- The form fields have no `autocomplete` attributes set
