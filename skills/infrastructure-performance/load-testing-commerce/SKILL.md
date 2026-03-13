---
name: load-testing-commerce
description: "Simulate realistic shopper traffic on your checkout and catalog pages using k6 or Artillery to find performance bottlenecks before launch"
category: infrastructure-performance
risk: safe
source: curated
date_added: "2026-03-12"
tags: [load-testing, artillery, k6, performance-testing, checkout-testing, stress-testing, capacity-planning]
triggers: ["load testing ecommerce", "load test checkout", "performance testing commerce", "k6 ecommerce", "artillery load test", "stress test checkout", "capacity planning"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Load Testing — Commerce

## Overview

Load testing e-commerce applications requires more than hammering an endpoint with concurrent requests. Realistic test scenarios simulate actual user behavior: browsing the catalog, searching for products, adding items to a cart, and completing checkout — including the think time between actions. This skill covers building realistic shopping scenarios in k6 and Artillery, interpreting results to find bottlenecks, and establishing performance baselines before major sales events.

## When to Use This Skill

- When preparing for a flash sale, Black Friday, or seasonal traffic spike
- When deploying a major infrastructure change (new database, CDN, checkout service)
- When establishing performance SLOs and baselines for a new storefront
- When a production incident was caused by load and you need to reproduce it in staging
- When a new checkout feature is being released and its performance impact is unknown

## Core Instructions

### Step 1: Determine your platform and what you can test

| Platform | Load Testing Scope | Recommended Approach |
|----------|-------------------|---------------------|
| **Shopify** | Shopify's infrastructure scales automatically — you cannot overload it meaningfully | Test your theme's frontend performance with Google PageSpeed Insights and Lighthouse CI; test any custom apps or storefronts you host separately |
| **WooCommerce** | You own the server — load testing is critical before sales events | Use **Loader.io** (free tier: 1 target, 10K connections/test) against your staging site; or k6/Artillery for detailed scenario testing |
| **BigCommerce** | BigCommerce scales automatically — platform infrastructure is not a concern | Test your theme's frontend performance with PageSpeed Insights; test any custom middleware or headless layer you host |
| **Custom / Headless** | Full control — load testing is your responsibility | Use k6 (open-source, scriptable) or Artillery (YAML-based) with realistic shopping scenarios against a staging environment |

### Step 2: Platform-specific load testing

---

#### Shopify

Shopify's infrastructure handles virtually any traffic spike. Your load testing focus is the frontend experience:

1. **Run Google PageSpeed Insights** on your most critical pages (product page, collection page, checkout):
   - Go to [pagespeed.web.dev](https://pagespeed.web.dev) and test your product and collection pages
   - Target a Performance score of 75+ on mobile; address any red/orange recommendations before your sale

2. **Check Shopify's built-in performance report**:
   - Go to **Online Store → Themes** and click **View report**
   - This shows your store's Core Web Vitals (LCP, CLS, FID) based on real user data
   - A poor LCP score on mobile almost always means the hero image needs `fetchpriority="high"` or compression

3. **Audit your installed apps before a sale**:
   - Go to **Apps** in your Shopify admin and review every app injecting scripts into your storefront
   - Each third-party script adds 50–200ms; remove unused apps and disable any that load synchronously

4. **For Shopify Plus — notify Shopify support before major launches**:
   - Submit a flash sale notification through your Plus support channel at least 48 hours before the event
   - Shopify can pre-allocate resources and monitor your store during the event

---

#### WooCommerce

WooCommerce runs on your hosting infrastructure. Test against a staging environment that mirrors your production configuration (same PHP version, same MySQL version, same caching stack).

**Quick load test with Loader.io (no code required):**

1. Sign up at [loader.io](https://loader.io) (free tier: 1 target, 10K connections per test)
2. Click **New Test** and enter your staging URL
3. Configure a ramp test: start at 0 clients, ramp to your expected peak traffic over 60 seconds, hold for 120 seconds
4. Loader.io provides a verification token — add it to a page on your staging site to confirm ownership
5. Run the test against your **checkout page** specifically — product browse is usually cached; checkout hits the database

**Interpret results:**
- Response time under 3 seconds at peak: acceptable
- Error rate above 1%: investigate server logs for PHP fatal errors, database timeouts, or memory exhaustion
- If the server struggles at lower than expected traffic: upgrade your hosting tier or add Redis Object Cache before the sale

**Before your test, ensure your staging stack is properly configured:**
- Redis Object Cache is active (**Settings → Redis** — green status)
- WP Rocket page cache is enabled and has warmed the most-visited product pages
- You're testing against the same server size you'll run in production

---

#### Custom / Headless

For custom storefronts, use k6 or Artillery against a staging environment that mirrors production.

**Important before you start:**
- Always test against **staging**, never production
- Use test-mode payment tokens (Stripe: `tok_visa`) — never run load tests against real payment processors
- Tag test orders with a recognizable email domain (e.g., `@test-load.invalid`) so you can bulk-delete them after
- Reserve test products with unlimited inventory so the checkout scenario doesn't fail due to oversells

**k6 realistic shopping scenarios:**

k6 uses a `ramping-arrival-rate` executor to control requests per second (more realistic than VU-based approaches). Typical e-commerce traffic distribution: 60% browse, 25% product detail, 10% cart, 5% checkout.

```javascript
// k6/commerce-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'https://staging.mystore.com';

const products = new SharedArray('products', function() {
  return JSON.parse(open('./data/products.json')); // array of {id, defaultVariantId}
});

export const options = {
  scenarios: {
    catalog_browsing: {
      executor: 'ramping-arrival-rate',
      startRate: 0, timeUnit: '1s',
      preAllocatedVUs: 50, maxVUs: 200,
      stages: [
        { target: 60, duration: '2m' },  // Ramp up
        { target: 60, duration: '5m' },  // Steady state
        { target: 0,  duration: '1m' },  // Ramp down
      ],
      exec: 'catalogBrowsing',
    },
    checkout_flow: {
      executor: 'ramping-arrival-rate',
      startRate: 0, timeUnit: '1s',
      preAllocatedVUs: 10, maxVUs: 50,
      stages: [
        { target: 5, duration: '2m' },
        { target: 5, duration: '5m' },
        { target: 0, duration: '1m' },
      ],
      exec: 'checkoutFlow',
    },
  },
  thresholds: {
    'http_req_duration{scenario:checkout_flow}': ['p(95)<3000'],
    'http_req_failed{scenario:checkout_flow}': ['rate<0.01'],
    'http_req_duration{scenario:catalog_browsing}': ['p(95)<1000'],
  },
};

export function catalogBrowsing() {
  http.get(`${BASE_URL}/api/collections/featured`, { tags: { step: 'homepage' } });
  sleep(2 + Math.random() * 3); // Think time: 2–5s

  const categories = ['t-shirts', 'hoodies', 'accessories'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  http.get(`${BASE_URL}/api/collections/${category}?page=1&sort=popular`, { tags: { step: 'category' } });
  sleep(3 + Math.random() * 5);
}

export function checkoutFlow() {
  const product = products[Math.floor(Math.random() * products.length)];

  // View product
  const productRes = http.get(`${BASE_URL}/api/products/${product.id}`, { tags: { step: 'view_product' } });
  check(productRes, { 'product page 200': r => r.status === 200 });
  sleep(2 + Math.random() * 3);

  // Add to cart
  const cartRes = http.post(`${BASE_URL}/api/cart`, JSON.stringify({
    items: [{ productId: product.id, variantId: product.defaultVariantId, quantity: 1 }],
  }), { headers: { 'Content-Type': 'application/json' }, tags: { step: 'add_to_cart' } });
  check(cartRes, { 'add to cart 200': r => r.status === 200 });
  const cart = JSON.parse(cartRes.body);
  sleep(1 + Math.random() * 2);

  // Start checkout
  const checkoutRes = http.post(`${BASE_URL}/api/checkout/start`, JSON.stringify({
    cartId: cart.id,
    customer: { email: `test-${Math.random().toString(36).slice(7)}@test-load.invalid` },
  }), { headers: { 'Content-Type': 'application/json' }, tags: { step: 'start_checkout' } });
  check(checkoutRes, { 'checkout start 200': r => r.status === 200 });
  const checkout = JSON.parse(checkoutRes.body);
  sleep(5 + Math.random() * 10); // Think time: filling form

  // Place order
  const orderRes = http.post(`${BASE_URL}/api/checkout/complete`, JSON.stringify({
    checkoutId: checkout.id,
    paymentToken: 'tok_visa', // Stripe test token
    shippingMethodId: checkout.shippingMethods[0]?.id,
  }), { headers: { 'Content-Type': 'application/json' }, tags: { step: 'place_order' } });
  check(orderRes, { 'order placed 201': r => r.status === 201 });
}
```

**Artillery YAML config (alternative to k6 — good for API-focused testing):**

```yaml
# artillery/commerce-load-test.yml
config:
  target: "{{ $processEnvironment.BASE_URL }}"
  phases:
    - name: "Warm-up"
      duration: 60
      arrivalRate: 5
    - name: "Ramp up"
      duration: 120
      arrivalRate: 5
      rampTo: 50
    - name: "Peak load"
      duration: 300
      arrivalRate: 50
    - name: "Spike"
      duration: 30
      arrivalRate: 200
    - name: "Recovery"
      duration: 60
      arrivalRate: 20
  processor: "./processors/commerce-helpers.js"

scenarios:
  - name: "Browse catalog"
    weight: 60
    flow:
      - get:
          url: "/api/collections/all?page=1"
          capture:
            json: "$.products[0].id"
            as: "productId"
      - think: 3
      - get:
          url: "/api/products/{{ productId }}"

  - name: "Complete checkout"
    weight: 10
    flow:
      - function: "generateCheckoutData"
      - post:
          url: "/api/cart"
          json:
            productId: "{{ productId }}"
            quantity: 1
          capture:
            json: "$.id"
            as: "cartId"
      - think: 8
      - post:
          url: "/api/checkout/start"
          json:
            cartId: "{{ cartId }}"
            email: "{{ email }}"
          capture:
            json: "$.checkoutId"
            as: "checkoutId"
      - think: 10
      - post:
          url: "/api/checkout/complete"
          json:
            checkoutId: "{{ checkoutId }}"
            paymentToken: "tok_visa"
          expect:
            - statusCode: 201
```

**Run the test and capture a baseline:**

```bash
k6 run \
  --env BASE_URL=https://staging.mystore.com \
  --out json=results/baseline-$(date +%Y%m%d).json \
  k6/commerce-load-test.js
```

**Analyze results per step using tags:**

```bash
# Overall summary (k6 outputs this automatically at end of run)
# Per-step breakdown from the JSON output
cat results/baseline-*.json | jq '
  [.data_points[] | select(.type=="Point" and .metric=="http_req_duration")]
  | group_by(.tags.step)
  | map({step: .[0].tags.step, p95_ms: (map(.value) | sort | .[length * 0.95 | floor])})
'
```

**Scale targets for e-commerce:**
- Catalog pages p95 < 1000ms
- Product detail p95 < 1500ms
- Checkout flow p95 < 3000ms
- Error rate < 1% at peak

**Run load tests in CI before major releases (GitHub Actions):**

```yaml
# .github/workflows/load-test.yml
name: Load Test (Pre-Release)
on:
  workflow_dispatch:
    inputs:
      target_url:
        description: 'Staging URL to test'
        required: true
        default: 'https://staging.mystore.com'

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install k6
        run: |
          curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update && sudo apt-get install k6
      - name: Run load test
        env:
          BASE_URL: ${{ github.event.inputs.target_url }}
        run: k6 run --env BASE_URL=$BASE_URL --out json=results.json k6/commerce-load-test.js
      - uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: results.json
```

## Best Practices

- **Simulate think time between steps** — real users pause between actions; removing think time creates an unrealistically high request rate that doesn't reflect production patterns
- **Use test-mode payment tokens** — always use Stripe's `tok_visa` or equivalent test tokens; never run load tests against real payment processors
- **Run against staging, not production** — load tests consume resources and can degrade service for real customers
- **Profile at 1.5×, 2×, and 3× expected peak** — run multiple tests at different load levels to find your system's inflection point before the actual sale
- **Monitor the database and cache during tests** — watch for connection pool exhaustion, Redis evictions, and lock wait times in your DB; application-tier throughput can look fine while the database is saturated
- **Tag test orders for easy cleanup** — use a consistent test email domain (`@test-load.invalid`) so you can bulk-delete test data after runs: `DELETE FROM orders WHERE email LIKE '%@test-load.invalid'`

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Checkout scenario fails because products are sold out | Reserve test products with unlimited inventory; use a separate `is_load_test_product` flag and filter them from real catalog pages |
| Loader.io test passes but production still slows down | Staging may not mirror production load — confirm Redis Object Cache is active, MySQL version matches, and the server size is the same |
| k6 VUs exhausted before reaching target RPS | Use `ramping-arrival-rate` executor (controls RPS) instead of `ramping-vus` (controls concurrent users); increase `preAllocatedVUs` and `maxVUs` |
| Alert noise during planned load tests | Add a load test flag to your monitoring system (Datadog tag, Grafana annotation) to suppress non-critical alerts during the scheduled test window |
| Results not reproducible between runs | Use a `SharedArray` with a fixed dataset file instead of Math.random() product generation; fix the test data set before the run |

## Related Skills

- @flash-sale-scaling
- @monitoring-alerting-commerce
- @database-optimization-commerce
- @bot-protection
