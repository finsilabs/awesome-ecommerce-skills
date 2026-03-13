# Automated Chargeback Evidence Engine

## Problem/Feature Description

Retail.io is an e-commerce platform with around 15,000 monthly transactions. Their dispute win rate is 28%, well below industry average. After a manual audit, the fraud team found two root causes: (1) the team inconsistently collected evidence — sometimes attaching delivery confirmation, sometimes not bothering with customer communication logs — and (2) every Visa fraud dispute was submitted with the same generic template with no attempt to leverage the cardholder's own purchase history. The team wants to replace the manual process with an automated engine that gathers all available evidence from the order record, scores it to predict the win probability, intelligently includes Visa CE 3.0 prior-transaction data when applicable, uploads any file attachments, and routes the dispute through Stripe automatically or escalates to human review based on how winnable the case looks.

The company already has order records in a database. Each order stores: customer_email, tracking_number, carrier, session_id, customer_ip, policy_accepted_at, and stripe_charge_id.

## Output Specification

Produce the following files:

- `evidence-collector.js` — A JavaScript module with the evidence collection and scoring logic. It must collect the relevant evidence types from the order, calculate a win probability score, include Visa CE 3.0 logic where applicable, and return the evidence bundle and score.
- `representment.js` — A JavaScript module that takes the chargeback record and evidence bundle, uploads any file-based evidence to Stripe, submits the dispute evidence via the Stripe API, and updates the internal chargeback record to reflect the submission.
- `routing-logic.md` — Document describing the thresholds and decision rules used to decide whether to auto-submit, escalate for review, or accept the dispute without fighting.

## Input Files

The following stub is provided to show the data shape available. Extract it before beginning.

=============== FILE: inputs/order-sample.json ===============
{
  "id": "ord_7f3a2b",
  "customer_email": "jane.doe@example.com",
  "customer_ip": "203.0.113.42",
  "session_id": "sess_abc123",
  "tracking_number": "1Z999AA10123456784",
  "carrier": "UPS",
  "policy_accepted_at": "2026-01-10T14:22:00Z",
  "stripe_charge_id": "ch_3OxYz2LkdIwHu7ix0",
  "created_at": "2026-01-10T14:20:00Z",
  "status": "completed"
}
