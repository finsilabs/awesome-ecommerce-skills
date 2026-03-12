# Instrument a Node.js Storefront for Checkout Observability

## Problem/Feature Description

A mid-sized fashion retailer recently experienced a 45-minute payment outage that went undetected until the customer support queue overflowed. The engineering team had server CPU and memory dashboards, but nothing that tracked whether checkouts were actually succeeding. After the incident, the CTO has asked the platform team to add proper observability to the Node.js/Next.js storefront before the next flash sale.

The team wants to track the full checkout funnel — from when a customer initiates checkout through payment capture to order creation — with enough granularity to know exactly where failures occur and how long each step takes. They also need the metrics to be available in their existing observability stack, which uses an OTLP-compatible collector.

## Output Specification

Produce the following TypeScript source files that a developer could drop into a Next.js project:

1. `lib/metrics/commerce-slos.ts` — SLO definitions for the commerce stack
2. `instrumentation.ts` — OpenTelemetry SDK initialization (this file has specific loading requirements in Next.js)
3. `lib/metrics/checkout-metrics.ts` — Metric counters, histograms, and recording functions for the checkout funnel

Include a `package.json` (or a `package-deps.txt`) listing the required dependencies.

Write a brief `INSTRUMENTATION_NOTES.md` documenting any important setup instructions or ordering requirements for the instrumentation file.
