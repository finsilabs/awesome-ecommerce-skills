---
name: monitoring-alerting-commerce
description: "Track store health in real time with dashboards for checkout success rate, payment failures, cart errors, and custom SLO alerting"
category: infrastructure-performance
risk: safe
source: curated
date_added: "2026-03-12"
tags: [monitoring, alerting, datadog, grafana, prometheus, checkout-funnel, payment-monitoring, slo, error-tracking]
triggers: ["ecommerce monitoring", "commerce alerting", "checkout monitoring", "payment failure alerts", "cart error tracking", "commerce dashboards", "slo ecommerce"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Monitoring & Alerting — Commerce

## Overview

Generic infrastructure monitoring (CPU, memory, error rate) is insufficient for e-commerce — you need commerce-domain metrics: checkout funnel conversion rates, payment success/failure breakdown by gateway and card type, cart abandonment rates, and inventory-out-of-stock events. This skill covers instrumenting a Node.js/Next.js storefront with OpenTelemetry, building a Grafana dashboard for commerce KPIs, and setting up alerts that fire before revenue impact becomes visible in sales reports.

## When to Use This Skill

- When setting up observability for a new headless storefront or commerce service
- When an incident occurred and you had no alerting in place to catch it early
- When SRE or engineering teams need SLOs (Service Level Objectives) for the checkout flow
- When business stakeholders want real-time visibility into checkout performance and payment failures
- When diagnosing a drop in conversion rate that may be caused by a technical issue

## Prerequisites & Platform Notes

**Shopify**: Shopify manages infrastructure, CDN, and scaling. Focus on Liquid template performance, image optimization via Shopify's CDN, and app performance.
**WooCommerce**: You manage hosting and performance. Use caching plugins (WP Rocket, Redis Object Cache), CDN (Cloudflare), and optimize database queries.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: Access to your hosting/infrastructure, monitoring tools

## Core Instructions

1. **Define commerce-specific SLOs and metrics**

   Before implementing monitoring, define what "working" means for your commerce stack:

   ```typescript
   // lib/metrics/commerce-slos.ts
   export const COMMERCE_SLOS = {
     // Checkout funnel SLOs
     checkoutStartSuccessRate: {target: 0.99, window: '1h', alert: 0.97},     // 99% of checkout page loads succeed
     checkoutCompletionRate: {target: 0.75, window: '1h', alert: 0.60},        // 75% of started checkouts complete
     paymentSuccessRate: {target: 0.95, window: '1h', alert: 0.90},            // 95% of payment attempts succeed
     orderCreationLatencyP99: {target: 3000, window: '5m', alert: 5000},       // ms

     // Catalog SLOs
     productPageP50: {target: 500, window: '5m', alert: 1000},                 // ms
     productPageP99: {target: 2000, window: '5m', alert: 4000},                // ms
     searchResultsP99: {target: 1000, window: '5m', alert: 2000},              // ms

     // Availability SLOs
     checkoutAvailability: {target: 0.999, window: '30d'},                     // 99.9% = 43 min/month downtime
     catalogAvailability: {target: 0.9995, window: '30d'},
   } as const;
   ```

2. **Instrument your application with OpenTelemetry**

   ```bash
   npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node \
     @opentelemetry/exporter-metrics-otlp-http @opentelemetry/exporter-trace-otlp-http \
     @opentelemetry/sdk-metrics prom-client
   ```

   ```typescript
   // instrumentation.ts — must be required before any other imports
   import {NodeSDK} from '@opentelemetry/sdk-node';
   import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
   import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http';
   import {OTLPMetricExporter} from '@opentelemetry/exporter-metrics-otlp-http';
   import {PeriodicExportingMetricReader} from '@opentelemetry/sdk-metrics';

   const sdk = new NodeSDK({
     serviceName: 'commerce-storefront',
     traceExporter: new OTLPTraceExporter({url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT}),
     metricReader: new PeriodicExportingMetricReader({
       exporter: new OTLPMetricExporter({url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT}),
       exportIntervalMillis: 15000,
     }),
     instrumentations: [getNodeAutoInstrumentations({
       '@opentelemetry/instrumentation-http': {enabled: true},
       '@opentelemetry/instrumentation-pg': {enabled: true},
       '@opentelemetry/instrumentation-ioredis': {enabled: true},
     })],
   });

   sdk.start();
   ```

3. **Track checkout funnel events**

   ```typescript
   // lib/metrics/checkout-metrics.ts
   import {metrics} from '@opentelemetry/api';

   const meter = metrics.getMeter('commerce-checkout');

   // Counters
   const checkoutStarted = meter.createCounter('checkout.started', {description: 'Number of checkout sessions started'});
   const checkoutCompleted = meter.createCounter('checkout.completed', {description: 'Number of completed checkouts'});
   const checkoutAbandoned = meter.createCounter('checkout.abandoned', {description: 'Number of abandoned checkouts'});

   // Payment metrics
   const paymentAttempts = meter.createCounter('payment.attempts', {description: 'Payment attempts by gateway and method'});
   const paymentSuccesses = meter.createCounter('payment.successes');
   const paymentFailures = meter.createCounter('payment.failures', {description: 'Payment failures by decline code'});

   // Histograms for latency
   const orderCreationDuration = meter.createHistogram('order.creation.duration_ms', {
     description: 'Time to create an order from payment confirmation',
     boundaries: [100, 250, 500, 1000, 2000, 5000, 10000],
   });

   export const checkoutMetrics = {
     recordCheckoutStart(channel: string, cartValue: number) {
       checkoutStarted.add(1, {channel});
     },

     recordCheckoutComplete(channel: string, paymentMethod: string, cartValue: number) {
       checkoutCompleted.add(1, {channel, payment_method: paymentMethod});
     },

     recordPaymentAttempt(gateway: string, method: string) {
       paymentAttempts.add(1, {gateway, method});
     },

     recordPaymentSuccess(gateway: string, method: string) {
       paymentSuccesses.add(1, {gateway, method});
     },

     recordPaymentFailure(gateway: string, declineCode: string) {
       paymentFailures.add(1, {gateway, decline_code: declineCode});
     },

     recordOrderCreation(durationMs: number, channel: string) {
       orderCreationDuration.record(durationMs, {channel});
     },
   };
   ```

4. **Build a Grafana dashboard for commerce KPIs**

   Create a Grafana dashboard JSON with the key panels:

   ```json
   // Key panels to include in your commerce dashboard:
   // Panel 1: Checkout Funnel (Sankey or bar chart showing drop-off)
   // Panel 2: Payment Success Rate (gauge with SLO threshold)
   // Panel 3: Revenue per Hour (time series)
   // Panel 4: Payment Failures by Decline Code (pie chart)
   // Panel 5: Order Creation Latency P50/P95/P99 (time series)
   // Panel 6: Checkout Abandonment Rate (stat panel)
   // Panel 7: Active Carts (gauge)
   // Panel 8: Out of Stock Events (counter)
   ```

   Sample PromQL queries for Grafana panels:

   ```promql
   # Payment success rate over the last 5 minutes
   rate(payment_successes_total[5m])
   /
   (rate(payment_successes_total[5m]) + rate(payment_failures_total[5m]))

   # P99 order creation latency
   histogram_quantile(0.99,
     sum(rate(order_creation_duration_ms_bucket[5m])) by (le, channel)
   )

   # Checkout conversion rate (completions / starts)
   rate(checkout_completed_total[1h])
   /
   rate(checkout_started_total[1h])

   # Payment failures by decline code (top 5)
   topk(5, sum(rate(payment_failures_total[5m])) by (decline_code))
   ```

5. **Set up actionable alerts**

   ```yaml
   # alertmanager/commerce-alerts.yaml
   groups:
     - name: commerce-critical
       rules:
         - alert: CheckoutPaymentSuccessRateLow
           expr: |
             (
               rate(payment_successes_total[5m]) /
               (rate(payment_successes_total[5m]) + rate(payment_failures_total[5m]))
             ) < 0.90
           for: 2m
           labels:
             severity: critical
             team: payments
           annotations:
             summary: "Payment success rate below 90%"
             description: "Payment success rate is {{ $value | humanizePercentage }}. SLO is 95%. Check Stripe status and recent deployments."
             runbook: "https://wiki.mystore.com/runbooks/payment-failures"

         - alert: CheckoutHighLatency
           expr: |
             histogram_quantile(0.99, sum(rate(order_creation_duration_ms_bucket[5m])) by (le)) > 5000
           for: 3m
           labels:
             severity: warning
             team: engineering
           annotations:
             summary: "Checkout P99 latency above 5 seconds"
             description: "Order creation P99 is {{ $value }}ms. Check database slow query log."

         - alert: CheckoutServiceDown
           expr: |
             rate(checkout_started_total[5m]) == 0
           for: 2m
           labels:
             severity: critical
             team: engineering
           annotations:
             summary: "No checkouts being started — possible service outage"
             description: "Zero checkout starts in the last 5 minutes during business hours."

         - alert: HighCartAbandonmentRate
           expr: |
             (rate(checkout_abandoned_total[30m]) / rate(checkout_started_total[30m])) > 0.60
           for: 15m
           labels:
             severity: warning
             team: product
           annotations:
             summary: "Cart abandonment rate above 60%"
             description: "{{ $value | humanizePercentage }} of checkouts are being abandoned. Check for checkout errors in Sentry."
   ```

6. **Add Real User Monitoring (RUM) for frontend metrics**

   Server-side metrics miss client-side failures. Add RUM for Core Web Vitals and JS errors:

   ```typescript
   // lib/rum.ts — initialize in app layout
   import {onCLS, onFID, onLCP, onFCP, onTTFB} from 'web-vitals';

   function sendToAnalytics(metric: any) {
     const body = JSON.stringify({
       name: metric.name,
       value: metric.value,
       rating: metric.rating,  // 'good', 'needs-improvement', 'poor'
       delta: metric.delta,
       id: metric.id,
       page: window.location.pathname,
     });

     // Use sendBeacon for reliable delivery even on page unload
     if (navigator.sendBeacon) {
       navigator.sendBeacon('/api/rum/vitals', body);
     }
   }

   export function initRUM() {
     onCLS(sendToAnalytics);
     onFID(sendToAnalytics);  // FID -> INP in newer versions
     onLCP(sendToAnalytics);
     onFCP(sendToAnalytics);
     onTTFB(sendToAnalytics);
   }

   // Track checkout funnel client-side errors
   window.addEventListener('error', (event) => {
     if (window.location.pathname.includes('/checkout')) {
       fetch('/api/rum/errors', {
         method: 'POST',
         body: JSON.stringify({
           message: event.message,
           source: event.filename,
           line: event.lineno,
           page: window.location.pathname,
         }),
         keepalive: true,
       });
     }
   });
   ```

## Examples

### Datadog APM checkout funnel trace

```typescript
// Instrument checkout steps as spans for distributed tracing
import tracer from 'dd-trace';

export async function processCheckout(checkoutData: CheckoutInput) {
  return tracer.trace('checkout.process', {resource: 'checkout-api'}, async (span) => {
     span.setTag('cart.total_cents', checkoutData.totalCents);
     span.setTag('payment.gateway', checkoutData.paymentGateway);
     span.setTag('customer.is_new', checkoutData.isNewCustomer);

     const inventorySpan = tracer.startSpan('checkout.inventory_check', {childOf: span});
     await checkInventory(checkoutData.lineItems);
     inventorySpan.finish();

     const paymentSpan = tracer.startSpan('checkout.payment_capture', {childOf: span});
     const payment = await capturePayment(checkoutData);
     paymentSpan.setTag('payment.success', payment.success);
     paymentSpan.finish();

     const orderSpan = tracer.startSpan('checkout.order_create', {childOf: span});
     const order = await createOrder(checkoutData, payment);
     orderSpan.setTag('order.id', order.id);
     orderSpan.finish();

     return order;
  });
}
```

### Synthetic monitoring for checkout availability

```typescript
// Run synthetic checkout transactions every 5 minutes
// Using Playwright in a scheduled Lambda/Cloud Function

import {chromium} from 'playwright';

export async function syntheticCheckout() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const start = Date.now();
  try {
    await page.goto('https://mystore.com/products/test-product');
    await page.click('[data-testid="add-to-cart"]');
    await page.goto('https://mystore.com/checkout');
    await page.waitForSelector('[data-testid="payment-form"]', {timeout: 5000});

    const duration = Date.now() - start;
    await metrics.gauge('synthetic.checkout.duration_ms', duration);
    await metrics.increment('synthetic.checkout.success');
  } catch (err) {
    await metrics.increment('synthetic.checkout.failure');
    await alertOpsTeam('Synthetic checkout failed', err);
  } finally {
    await browser.close();
  }
}
```

## Best Practices

- **Alert on symptoms, not causes** — alert on "payment success rate < 90%" (a symptom), not on "Stripe API latency > 500ms" (a cause); symptom-based alerts fire faster and are more actionable
- **Set burn-rate alerts for SLOs** — use multi-window burn-rate alerting (1h and 6h windows) so you're alerted when you're burning through your error budget too fast before the SLO window closes
- **Track checkout funnel step-by-step** — instrument each step (cart → checkout → payment → confirmation) separately so you can pinpoint exactly where users are dropping off
- **Monitor decline codes, not just payment failure counts** — a 10% failure rate dominated by "insufficient_funds" is different from one dominated by "do_not_honor" (possible fraud or issuer outage); they require different responses
- **Use synthetic monitoring for checkout availability** — real-user monitoring depends on actual traffic; synthetic transactions run even at 3 AM during low traffic and catch outages before customers do
- **Set `for` duration in alerts to avoid flapping** — a 30-second spike in latency is normal; alerts with `for: 2m` only fire if the condition is sustained for 2 minutes
- **Keep runbooks linked in alert annotations** — every alert should have a `runbook` annotation pointing to a page describing how to diagnose and resolve the specific condition

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Too many alerts, all low signal | Start with 3–5 high-value alerts (payment failures, checkout latency, service down); add more only after validating each fires at the right threshold |
| Metrics missing during checkout pipeline errors | Instrument metrics before and after error-prone operations; a failed payment should still increment `payment.failures` even if it throws |
| Dashboard looks healthy but revenue is down | Add business metrics (orders per minute, revenue per hour) alongside technical metrics; technical SLOs can be met while UX issues suppress conversion |
| Alert fires in staging noise, ignored in production | Use separate alert routing rules for production vs staging; suppress staging alerts outside business hours |
| RUM data dominated by bots | Filter RUM data by user agent and session characteristics; bot traffic skews Core Web Vitals and can hide real user performance regressions |

## Related Skills

- @flash-sale-scaling
- @load-testing-commerce
- @database-optimization-commerce
- @edge-commerce
