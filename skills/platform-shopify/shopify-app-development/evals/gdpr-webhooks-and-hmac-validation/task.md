# Set Up Webhook Handling for Shopify App Store Submission

## Problem/Feature Description

A startup has built a Shopify app that monitors inventory levels and sends alerts to merchants. The app is nearly ready to submit to the Shopify App Store, but the legal and compliance team has flagged that the app doesn't yet meet Shopify's data protection requirements. Shopify requires that every App Store app handles specific data-related webhook topics and can prove its webhook endpoints are authentic — otherwise Shopify will reject the app submission.

The backend engineer needs to write the webhook handler route that covers all required topics. The app stores some merchant and customer data (product watchlists associated with customer emails), so the team needs real logic for the data deletion and redaction topics, not just stubs. In addition, the security architect has pointed out that the current webhook endpoint blindly trusts all incoming requests without verifying they genuinely came from Shopify — this needs to be fixed. Produce a working webhook handler and a `WEBHOOK_NOTES.md` documenting what was implemented and why each piece is required.

## Output Specification

Produce the following files:

- `app/routes/webhooks.tsx` (or `app/routes/webhooks.ts`) — a Remix action that handles all required Shopify webhook topics and validates request authenticity
- `WEBHOOK_NOTES.md` — documentation explaining the webhook topics handled, why each is required, and how request authenticity is verified

## Input Files

The following file shows the current (incomplete) webhook handler. Extract it before beginning.

=============== FILE: app/routes/webhooks.tsx ===============
import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  switch (topic) {
    case "APP_UNINSTALLED":
      await db.session.deleteMany({ where: { shop } });
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  return new Response();
};
=============== END FILE ===============
