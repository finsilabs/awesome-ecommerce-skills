# Set Up Commerce Payment Alerting

## Problem/Feature Description

A payments engineering team at an online retailer is being overwhelmed by noisy, low-value alerts that have led to alert fatigue. Their on-call engineers are getting paged for things like "Redis latency spike" or "Stripe API response time > 200ms" — causes that may or may not be affecting customers — rather than being told directly that customers cannot complete purchases. The team has also been caught off-guard by slow-burning incidents: a payment success rate that degraded from 95% to 88% over 4 hours went unnoticed because no alert covered the gradual drift.

The team wants to rebuild their alerting from scratch with a focused, high-signal rule set. They use Prometheus and Alertmanager. The storefront already emits the metrics: `payment_successes_total`, `payment_failures_total` (with `gateway` and `decline_code` labels), `checkout_started_total`, `checkout_abandoned_total`, and `order_creation_duration_ms_bucket`. They run both a production and staging environment and have been burned before by staging alerts waking engineers at 2 AM.

## Output Specification

Produce the following files:

1. `alertmanager/commerce-alerts.yaml` — Prometheus alert rule groups for commerce
2. `alertmanager/routing.yaml` — Alertmanager routing configuration handling production vs staging
3. `ALERTING_DESIGN.md` — A short design document (1–2 pages) explaining:
   - The alerting philosophy used (what conditions were chosen and why)
   - How the alert set avoids common pitfalls
   - Any advanced alerting strategies applied to protect the error budget
