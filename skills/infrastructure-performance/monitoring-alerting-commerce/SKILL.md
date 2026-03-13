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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Monitoring & Alerting — Commerce

## Overview

Generic infrastructure monitoring (CPU, memory, error rate) is insufficient for e-commerce — you need commerce-domain metrics: checkout funnel conversion rates, payment success/failure breakdown by gateway and card type, cart abandonment rates, and inventory out-of-stock events. This skill covers setting up monitoring across different platforms and instrumenting custom storefronts with OpenTelemetry, building dashboards for commerce KPIs, and setting up alerts that fire before revenue impact becomes visible in sales reports.

## When to Use This Skill

- When setting up observability for a new headless storefront or commerce service
- When an incident occurred and you had no alerting in place to catch it early
- When you need real-time visibility into checkout performance and payment failures
- When diagnosing a drop in conversion rate that may be caused by a technical issue
- When preparing SLOs (Service Level Objectives) for the checkout flow before a major sale

## Core Instructions

### Step 1: Determine your platform and what you can monitor

| Platform | Built-In Monitoring | What You Can Add |
|----------|-------------------|-----------------|
| **Shopify** | Shopify admin shows orders, conversion rates, and a performance report with Core Web Vitals | Install **Lucky Orange** or **Microsoft Clarity** for session recordings and funnel drop-off; connect **Shopify** to Google Analytics 4 for detailed checkout funnel tracking |
| **WooCommerce** | WooCommerce analytics dashboard shows orders and revenue; no performance monitoring built in | Install **MonsterInsights** (GA4 integration), **WooFunnels** (checkout funnel tracking), and set up **Uptime Robot** (free tier: 50 monitors) for availability alerting |
| **BigCommerce** | BigCommerce Analytics shows orders, conversion rate, and abandoned carts | Connect BigCommerce to GA4 via native integration; use **Lucky Orange** for heatmaps and session recordings on checkout pages |
| **Custom / Headless** | Nothing — you build it | Instrument with OpenTelemetry, ship metrics to Grafana Cloud (free tier: 10K series) or Datadog; build checkout funnel dashboards with PromQL; see implementation below |

### Step 2: Platform-specific monitoring setup

---

#### Shopify

**Set up GA4 checkout funnel tracking:**

1. In your Shopify admin, go to **Online Store → Preferences → Google Analytics**
2. Connect your GA4 property — Shopify sends all standard e-commerce events automatically (page_view, add_to_cart, begin_checkout, purchase)
3. In **Google Analytics → Explore**, create a funnel exploration:
   - Step 1: `begin_checkout` event
   - Step 2: `add_shipping_info` event
   - Step 3: `add_payment_info` event
   - Step 4: `purchase` event
   - This shows you exactly where shoppers are dropping off in checkout

**Monitor your store's Core Web Vitals:**

1. Go to **Online Store → Themes** and click **View report**
2. This shows real-user LCP, CLS, and FID data from actual shoppers
3. A poor mobile LCP score (red, > 4s) almost always means your hero image needs optimization or `fetchpriority="high"`

**Set up availability and error alerting:**

1. Install **Lucky Orange** ($19/month) or **Microsoft Clarity** (free) to capture session recordings when checkout errors occur — this shows exactly what shoppers see when something breaks
2. Set up a **Shopify Email** or Slack notification for failed orders: go to **Settings → Notifications** and enable the **Order payment failure** notification
3. For uptime monitoring: use **Uptime Robot** (free, 5-minute checks) or **Better Uptime** to alert you if your store URL becomes unreachable

---

#### WooCommerce

**Connect WooCommerce to GA4:**

1. Install **MonsterInsights** (free tier available, Pro from $99/year) from wordpress.org
2. Go to **Insights → Settings → General** and connect your GA4 property
3. Enable **Enhanced eCommerce** tracking — this sends add_to_cart, begin_checkout, and purchase events to GA4 automatically

**Track checkout funnel drop-off:**

1. Install **WooFunnels** (free tier available) from wordpress.org
2. Create a funnel with your cart, checkout, and order confirmation pages as steps
3. WooFunnels shows you the conversion rate at each step and where shoppers abandon

**Set up uptime and error alerting:**

1. Sign up for **Uptime Robot** (free tier: 50 monitors, 5-minute checks)
2. Add monitors for your homepage, shop page, checkout page, and `/wp-admin/admin-ajax.php` (WooCommerce uses this heavily)
3. Set up email or Slack notifications when any monitor goes down

**Monitor server health:**

1. In your hosting control panel (cPanel, Cloudways, Kinsta), enable email alerts for:
   - PHP error logs (fatal errors)
   - Disk usage above 80%
   - Memory usage above 80%
2. Install **Query Monitor** plugin (free, wordpress.org) in a staging environment to identify slow database queries during development — disable on production

---

#### Custom / Headless

For custom storefronts, implement a full observability stack: OpenTelemetry for instrumentation, Prometheus or Grafana Cloud for metrics storage, and Grafana for dashboards.

**Define commerce SLOs before building dashboards** — these become your alert thresholds:

| Metric | Target | Alert threshold |
|--------|--------|----------------|
| Payment success rate | 95% | < 90% for 2 min |
| Checkout P99 latency | < 3000ms | > 5000ms for 3 min |
| Checkout availability | 99.9% | Zero starts for 2 min |
| Catalog page P95 | < 1000ms | > 2000ms for 5 min |

**Instrument your storefront with OpenTelemetry:**

```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-metrics-otlp-http @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/sdk-metrics
```

```typescript
// instrumentation.ts — import before any other module
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const sdk = new NodeSDK({
  serviceName: 'commerce-storefront',
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
    exportIntervalMillis: 15000,
  }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-http': { enabled: true },
    '@opentelemetry/instrumentation-pg': { enabled: true },
    '@opentelemetry/instrumentation-ioredis': { enabled: true },
  })],
});
sdk.start();
```

**Track checkout funnel metrics:**

```typescript
// lib/metrics/checkout-metrics.ts
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('commerce-checkout');

const checkoutStarted = meter.createCounter('checkout.started');
const checkoutCompleted = meter.createCounter('checkout.completed');
const paymentAttempts = meter.createCounter('payment.attempts');
const paymentSuccesses = meter.createCounter('payment.successes');
const paymentFailures = meter.createCounter('payment.failures');
const orderCreationDuration = meter.createHistogram('order.creation.duration_ms', {
  boundaries: [100, 250, 500, 1000, 2000, 5000, 10000],
});

export const checkoutMetrics = {
  recordCheckoutStart(channel: string) {
    checkoutStarted.add(1, { channel });
  },
  recordCheckoutComplete(channel: string, paymentMethod: string) {
    checkoutCompleted.add(1, { channel, payment_method: paymentMethod });
  },
  recordPaymentAttempt(gateway: string, method: string) {
    paymentAttempts.add(1, { gateway, method });
  },
  recordPaymentSuccess(gateway: string, method: string) {
    paymentSuccesses.add(1, { gateway, method });
  },
  recordPaymentFailure(gateway: string, declineCode: string) {
    paymentFailures.add(1, { gateway, decline_code: declineCode });
  },
  recordOrderCreation(durationMs: number, channel: string) {
    orderCreationDuration.record(durationMs, { channel });
  },
};
```

**PromQL queries for Grafana dashboard panels:**

```promql
# Payment success rate (gauge panel — target 95%)
rate(payment_successes_total[5m])
/
(rate(payment_successes_total[5m]) + rate(payment_failures_total[5m]))

# Checkout P99 latency
histogram_quantile(0.99,
  sum(rate(order_creation_duration_ms_bucket[5m])) by (le, channel)
)

# Checkout funnel conversion rate
rate(checkout_completed_total[1h]) / rate(checkout_started_total[1h])

# Payment failures by decline code (top 5)
topk(5, sum(rate(payment_failures_total[5m])) by (decline_code))
```

**Prometheus alerting rules:**

```yaml
# prometheus/commerce-alerts.yaml
groups:
  - name: commerce-critical
    rules:
      - alert: PaymentSuccessRateLow
        expr: |
          (
            rate(payment_successes_total[5m]) /
            (rate(payment_successes_total[5m]) + rate(payment_failures_total[5m]))
          ) < 0.90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Payment success rate below 90%"
          description: "Rate is {{ $value | humanizePercentage }}. Check Stripe status page and recent deployments."
          runbook: "https://wiki.mystore.com/runbooks/payment-failures"

      - alert: CheckoutHighLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(order_creation_duration_ms_bucket[5m])) by (le)
          ) > 5000
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Checkout P99 latency above 5 seconds"
          description: "P99 is {{ $value }}ms. Check database slow query log and Redis connection pool."

      - alert: CheckoutServiceDown
        expr: rate(checkout_started_total[5m]) == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "No checkouts being started — possible service outage"
```

**Add Real User Monitoring for Core Web Vitals:**

```typescript
// lib/rum.ts — initialize in root layout
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendVital(metric: any) {
  navigator.sendBeacon?.('/api/rum/vitals', JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good', 'needs-improvement', 'poor'
    page: window.location.pathname,
  }));
}

export function initRUM() {
  onCLS(sendVital);
  onINP(sendVital);
  onLCP(sendVital);
  onFCP(sendVital);
  onTTFB(sendVital);
}
```

## Best Practices

- **Alert on symptoms, not causes** — alert on "payment success rate < 90%" (a symptom affecting revenue), not "Stripe API latency > 500ms" (a cause); symptom-based alerts fire faster and are more actionable
- **Track checkout funnel step-by-step** — instrument each step (cart → checkout → payment → confirmation) separately so you can identify exactly where users drop off
- **Monitor decline codes, not just failure counts** — a 10% failure rate dominated by `insufficient_funds` is different from `do_not_honor` (possible fraud or issuer outage); they require completely different responses
- **Use synthetic monitoring for availability** — RUM depends on real traffic; scheduled synthetic checkout flows (Playwright + Lambda) catch outages at 3 AM before customers do
- **Link runbooks in every alert** — every alert annotation should include a `runbook` URL pointing to a page describing how to diagnose and resolve that specific condition
- **Set `for` duration to avoid alert flapping** — a 30-second latency spike is normal; alerts with `for: 2m` only fire if the condition is sustained

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Too many alerts, low signal-to-noise | Start with 3–5 high-value alerts (payment failures, checkout latency, service down); add more only after validating each fires at the right threshold |
| Metrics not recorded when errors occur | Instrument metrics before and after error-prone operations; a failed payment should still increment `payment.failures` even if it throws an exception |
| Dashboard looks healthy but revenue is down | Add business metrics (orders per minute, revenue per hour) alongside technical metrics; technical SLOs can be met while UX issues suppress conversion |
| RUM data skewed by bots | Filter RUM events by user agent; bot traffic distorts Core Web Vitals and can hide real user performance regressions |
| Shopify GA4 funnel shows no data | Verify that the GA4 Measurement ID in **Online Store → Preferences** matches your GA4 property; check the GA4 DebugView to confirm events are firing |

## Related Skills

- @flash-sale-scaling
- @load-testing-commerce
- @database-optimization-commerce
- @edge-commerce
