# SMS Opt-In for Checkout Page

## Problem/Feature Description

A direct-to-consumer apparel brand is launching a text messaging channel alongside their email program. Their legal team has flagged that their previous SMS list was collected improperly and they need to rebuild it from scratch with clean, provable consent. The compliance officer has made it clear that they must be able to demonstrate — in writing if challenged — exactly when, where, and how each subscriber consented to receive texts.

The team needs a checkout opt-in component for their React/TypeScript storefront and the backend logic to store consent records in a way that will hold up to legal scrutiny. They also serve customers in the EU and need to be able to produce a complete consent history for any customer on request.

## Output Specification

Produce the following TypeScript source files in your working directory:

- `SmsOptIn.tsx` — A React component that renders the SMS opt-in field for a checkout form. The component should accept a phone number and a callback for when the user toggles the checkbox.
- `consentService.ts` — Backend service containing:
  - A function to record SMS consent in a database (you can use a mock `db` object — no real database connection is needed)
  - A function to export a customer's full SMS consent history (for GDPR data access requests)
- `README.md` — A short description (2–3 paragraphs) of the consent model used, explaining how it handles different consent types and what data is stored for audit purposes.
