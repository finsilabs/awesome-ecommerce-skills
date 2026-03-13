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
platforms: [platform-agnostic]
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

## Prerequisites & Platform Notes

**Shopify**: Shopify manages infrastructure, CDN, and scaling. Focus on Liquid template performance, image optimization via Shopify's CDN, and app performance.
**WooCommerce**: You manage hosting and performance. Use caching plugins (WP Rocket, Redis Object Cache), CDN (Cloudflare), and optimize database queries.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: Access to your hosting/infrastructure, monitoring tools

## Core Instructions

1. **Design realistic user scenarios**

   A realistic load test mirrors how shoppers actually behave. Most traffic is browsing; only a small percentage converts to checkout:

   ```javascript
   // scenarios/shopping-weights.js
   // Typical e-commerce traffic distribution:
   // 60% — Browse catalog (homepage, category pages, search)
   // 25% — View product details
   // 10% — Add to cart, view cart
   //  5% — Checkout (most valuable to test throughput)
   ```

   k6 scenario definition:

   ```javascript
   // k6/scenarios.js
   export const options = {
     scenarios: {
       catalog_browsing: {
         executor: 'ramping-arrival-rate',
         startRate: 0,
         timeUnit: '1s',
         preAllocatedVUs: 50,
         maxVUs: 200,
         stages: [
           {target: 100, duration: '2m'},  // Ramp up
           {target: 100, duration: '5m'},  // Steady state
           {target: 0,   duration: '1m'},  // Ramp down
         ],
         weight: 60,
         exec: 'catalogBrowsing',
       },
       product_detail: {
         executor: 'ramping-arrival-rate',
         startRate: 0,
         timeUnit: '1s',
         preAllocatedVUs: 30,
         maxVUs: 100,
         stages: [
           {target: 40, duration: '2m'},
           {target: 40, duration: '5m'},
           {target: 0,  duration: '1m'},
         ],
         exec: 'productDetail',
       },
       checkout_flow: {
         executor: 'ramping-arrival-rate',
         startRate: 0,
         timeUnit: '1s',
         preAllocatedVUs: 10,
         maxVUs: 50,
         stages: [
           {target: 10, duration: '2m'},
           {target: 10, duration: '5m'},
           {target: 0,  duration: '1m'},
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
   ```

2. **Write a realistic k6 checkout scenario**

   ```javascript
   // k6/checkout-flow.js
   import http from 'k6/http';
   import {check, sleep} from 'k6';
   import {SharedArray} from 'k6/data';

   const BASE_URL = __ENV.BASE_URL || 'https://staging.mystore.com';

   // Load test data (products, customer credentials) from a JSON file
   const products = new SharedArray('products', function() {
     return JSON.parse(open('./data/products.json'));
   });

   export function checkoutFlow() {
     const product = products[Math.floor(Math.random() * products.length)];

     // Step 1: View product page (simulates organic navigation)
     const productRes = http.get(`${BASE_URL}/api/products/${product.id}`, {
       tags: {step: 'view_product'},
     });
     check(productRes, {'product page 200': r => r.status === 200});
     sleep(2 + Math.random() * 3); // Think time: 2-5 seconds

     // Step 2: Create or retrieve cart
     const cartRes = http.post(`${BASE_URL}/api/cart`, JSON.stringify({
       items: [{productId: product.id, variantId: product.defaultVariantId, quantity: 1}],
     }), {
       headers: {'Content-Type': 'application/json'},
       tags: {step: 'add_to_cart'},
     });
     check(cartRes, {'add to cart 200': r => r.status === 200});
     const cart = JSON.parse(cartRes.body);
     sleep(1 + Math.random() * 2);

     // Step 3: Start checkout
     const checkoutRes = http.post(`${BASE_URL}/api/checkout/start`, JSON.stringify({
       cartId: cart.id,
       customer: {
         email: `test-${Math.random().toString(36).substring(7)}@test-load.invalid`,
         name: 'Test User',
       },
     }), {
       headers: {'Content-Type': 'application/json'},
       tags: {step: 'start_checkout'},
     });
     check(checkoutRes, {'checkout start 200': r => r.status === 200});
     const checkout = JSON.parse(checkoutRes.body);
     sleep(5 + Math.random() * 10); // Think time: filling form

     // Step 4: Submit order (with test payment token)
     const orderRes = http.post(`${BASE_URL}/api/checkout/complete`, JSON.stringify({
       checkoutId: checkout.id,
       paymentToken: 'tok_visa', // Stripe test token
       shippingMethodId: checkout.shippingMethods[0]?.id,
     }), {
       headers: {'Content-Type': 'application/json'},
       tags: {step: 'place_order'},
     });
     check(orderRes, {
       'order placed 201': r => r.status === 201,
       'order has id': r => JSON.parse(r.body).orderId !== undefined,
     });
   }

   export function catalogBrowsing() {
     // Homepage
     http.get(`${BASE_URL}/api/collections/featured`, {tags: {step: 'homepage'}});
     sleep(2 + Math.random() * 3);

     // Category page
     const categories = ['t-shirts', 'hoodies', 'accessories'];
     const category = categories[Math.floor(Math.random() * categories.length)];
     http.get(`${BASE_URL}/api/collections/${category}?page=1&sort=popular`, {tags: {step: 'category'}});
     sleep(3 + Math.random() * 5);

     // Search
     const terms = ['blue', 'summer', 'sale'];
     const term = terms[Math.floor(Math.random() * terms.length)];
     http.get(`${BASE_URL}/api/search?q=${term}`, {tags: {step: 'search'}});
     sleep(1 + Math.random() * 2);
   }

   export function productDetail() {
     const product = products[Math.floor(Math.random() * products.length)];
     http.get(`${BASE_URL}/api/products/${product.id}`, {tags: {step: 'product_detail'}});
     sleep(4 + Math.random() * 8); // Shoppers spend time on product pages
   }
   ```

3. **Write an Artillery scenario for API load testing**

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
     defaults:
       headers:
         Content-Type: "application/json"
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

     - name: "Search and browse"
       weight: 20
       flow:
         - get:
             url: "/api/search?q=shirt&page=1"
             capture:
               json: "$.results[0].id"
               as: "productId"
         - think: 2
         - get:
             url: "/api/products/{{ productId }}"

     - name: "Complete checkout"
       weight: 20
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

4. **Establish performance baselines**

   ```bash
   # Run baseline test and capture results
   k6 run \
     --env BASE_URL=https://staging.mystore.com \
     --out json=results/baseline-$(date +%Y%m%d).json \
     k6/checkout-flow.js

   # Compare with a previous baseline (use k6 compare or custom script)
   node scripts/compare-results.js \
     results/baseline-20250301.json \
     results/baseline-20250312.json
   ```

   ```typescript
   // scripts/compare-results.ts
   interface K6Result {
     metrics: {
       http_req_duration: {values: {'p(95)': number; 'p(99)': number; avg: number}};
       http_req_failed: {values: {rate: number}};
       iterations: {values: {rate: number}};
     };
   }

   function compareBaselines(before: K6Result, after: K6Result) {
     const p95Before = before.metrics.http_req_duration.values['p(95)'];
     const p95After = after.metrics.http_req_duration.values['p(95)'];
     const change = ((p95After - p95Before) / p95Before) * 100;

     console.table({
       'P95 Latency Before': `${p95Before}ms`,
       'P95 Latency After': `${p95After}ms`,
       'Change': `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
       'Error Rate Before': `${(before.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`,
       'Error Rate After': `${(after.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`,
     });

     if (change > 20) {
       console.error('REGRESSION: P95 latency increased by more than 20%');
       process.exit(1);
     }
   }
   ```

5. **Run load tests in CI with GitHub Actions**

   ```yaml
   # .github/workflows/load-test.yml
   name: Load Test (Pre-Release)
   on:
     workflow_dispatch:
       inputs:
         target_url:
           description: 'Target URL for load test'
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
           run: |
             k6 run \
               --env BASE_URL=$BASE_URL \
               --out json=results.json \
               k6/checkout-flow.js

         - name: Upload results
           uses: actions/upload-artifact@v4
           with:
             name: load-test-results
             path: results.json
   ```

6. **Analyze results and identify bottlenecks**

   ```bash
   # After running k6, analyze the JSON output
   cat results.json | jq '
     .metrics |
     {
       p95_ms: .http_req_duration.values["p(95)"],
       p99_ms: .http_req_duration.values["p(99)"],
       error_rate: .http_req_failed.values.rate,
       rps: .http_reqs.values.rate,
       vus_max: .vus_max.values.max
     }
   '

   # Per-step breakdown using tags
   cat results.json | jq '
     [.data_points[] | select(.type=="Point" and .metric=="http_req_duration")]
     | group_by(.tags.step)
     | map({step: .[0].tags.step, p95: (map(.value) | sort | .[length * 0.95 | floor])})
   '
   ```

## Examples

### k6 script for search performance testing

```javascript
// k6/search-performance.js
import http from 'k6/http';
import {check, sleep} from 'k6';
import {Trend} from 'k6/metrics';

const searchLatency = new Trend('search_latency');

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    search_latency: ['p(95)<500'],  // Search must complete in under 500ms
    http_req_failed: ['rate<0.001'],
  },
};

const searchTerms = ['shirt', 'blue hoodie', 'summer dress', 'running shoes', 'gift'];

export default function() {
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const start = Date.now();

  const res = http.get(`${__ENV.BASE_URL}/api/search?q=${encodeURIComponent(term)}&limit=20`);
  searchLatency.add(Date.now() - start);

  check(res, {
    'status 200': r => r.status === 200,
    'has results': r => JSON.parse(r.body).results?.length > 0,
    'response under 500ms': r => r.timings.duration < 500,
  });

  sleep(1 + Math.random() * 2);
}
```

### Artillery processor for generating realistic test data

```javascript
// artillery/processors/commerce-helpers.js
module.exports = {
  generateCheckoutData(context, events, done) {
    const id = Math.random().toString(36).substring(2, 8);
    context.vars.email = `load-test-${id}@test.invalid`;
    context.vars.productId = `prod_${Math.floor(Math.random() * 100) + 1}`;
    context.vars.sessionId = `sess_${id}`;
    return done();
  },
};
```

## Best Practices

- **Simulate think time between steps** — real users pause between actions; removing think time creates an unrealistically high request rate that doesn't match production traffic patterns
- **Use test-mode payment tokens** — always use Stripe's `tok_visa` or equivalent test tokens in load tests; never run load tests against production payment processors
- **Run load tests in staging, not production** — load tests consume resources and can degrade service; always run against a staging environment that mirrors production configuration
- **Profile at 1.5×, 2×, and 3× expected peak** — run multiple tests at different load levels to find your system's inflection point and maximum capacity
- **Monitor the database during load tests** — high application-tier throughput can hide database bottlenecks; watch `pg_stat_activity`, lock wait times, and connection pool exhaustion during tests
- **Clean up test data after each run** — insert a test order marker (e.g., test email domain `@test.invalid`) so you can bulk-delete test data without affecting real orders
- **Compare latency histograms, not just averages** — a p99 regression hidden by an unchanged average can still impact 1% of users; always evaluate P95, P99, and P99.9

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Load test results not reproducible | Fix the random seed in your test data generation; use a `SharedArray` with a fixed dataset rather than Math.random() product selection |
| Test traffic not representative of production | Analyze production access logs to determine the real ratio of browse:search:checkout traffic; match this ratio in your scenario weights |
| k6 VUs exhausted before target RPS reached | Increase `preAllocatedVUs` and `maxVUs`; use `ramping-arrival-rate` executor (controls RPS) rather than `ramping-vus` (controls concurrent users) |
| Checkout scenario fails because test products are sold out | Reserve a set of test products with unlimited inventory; use a separate product flag (`is_load_test_product: true`) |
| Alert noise during load tests | Add a load test flag to your monitoring system; mute or suppress non-critical alerts while a scheduled load test is running |

## Related Skills

- @flash-sale-scaling
- @monitoring-alerting-commerce
- @database-optimization-commerce
- @bot-protection
