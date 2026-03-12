---
name: flash-sale-scaling
description: "Auto-scaling, queue-based ordering, and circuit breakers for traffic spikes"
category: infrastructure-performance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [scaling, auto-scaling, queue, circuit-breaker, flash-sale, redis, sqs, kubernetes, traffic-spike]
triggers: ["flash sale scaling", "traffic spike handling", "auto scaling ecommerce", "queue based ordering", "circuit breaker commerce", "high traffic sale", "black friday scaling"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Flash Sale Scaling

## Overview

Flash sales and product drops generate traffic spikes that can be 50–100× normal load, arriving within seconds of sale start. Without preparation, the checkout service collapses, inventory oversells, and customers see error pages — which destroys the brand. This skill covers the infrastructure patterns needed to handle extreme traffic: pre-warming auto-scaling, queue-based order intake with back-pressure, Redis-based atomic inventory reservation, and circuit breakers that degrade gracefully under load.

## When to Use This Skill

- When planning a flash sale, limited product drop, or major promotional event
- When past sales have caused checkout timeouts, oversells, or database failures
- When Black Friday/Cyber Monday planning is underway and infrastructure needs review
- When a new product announcement is expected to drive sudden high-demand traffic
- When conducting capacity planning for peak periods

## Core Instructions

1. **Pre-warm infrastructure before the sale**

   Auto-scaling reacts to traffic — it cannot scale fast enough if 10,000 users arrive simultaneously. Pre-warm before the sale:

   ```bash
   # Kubernetes: scale checkout deployment up 30 minutes before sale
   kubectl scale deployment checkout-service --replicas=50

   # AWS ECS: update desired count
   aws ecs update-service \
     --cluster production \
     --service checkout-service \
     --desired-count 50

   # Pre-warm Lambda functions by invoking them concurrently
   # (prevents cold starts during the sale)
   for i in $(seq 1 100); do
     aws lambda invoke --function-name checkout-handler --invocation-type Event /dev/null &
   done
   wait
   ```

   Configure auto-scaling with a scheduled action:
   ```yaml
   # k8s/hpa-flash-sale.yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: checkout-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: checkout-service
     minReplicas: 50     # High minimum during sale window
     maxReplicas: 200
     metrics:
       - type: Resource
         resource:
           name: cpu
           target:
             type: Utilization
             averageUtilization: 60
       - type: External
         external:
           metric:
             name: queue_depth
             selector:
               matchLabels:
                 queue: order-intake
           target:
             type: AverageValue
             averageValue: "100"
   ```

2. **Implement atomic inventory reservation with Redis**

   Database-level inventory checks under high concurrency lead to oversells. Use Redis atomic operations:

   ```typescript
   import Redis from 'ioredis';

   const redis = new Redis(process.env.REDIS_URL!);

   // Initialize inventory in Redis before the sale
   export async function initializeInventory(productId: string, quantity: number) {
     await redis.set(`inventory:${productId}`, quantity);
   }

   // Atomic reservation using a Redis Lua script.
   // redis.call() here is the Redis server-side Lua API — not JavaScript eval.
   // The script runs atomically on the Redis server with no race conditions.
   const LUA_RESERVE_SCRIPT = `
     local key = KEYS[1]
     local qty = tonumber(ARGV[1])
     local current = tonumber(redis.call('GET', key))
     if current == nil then return -1 end
     if current < qty then return 0 end
     redis.call('DECRBY', key, qty)
     return 1
   `;

   // ioredis exposes the Redis EVAL command as redis.eval()
   // This sends the Lua script to the Redis server for atomic server-side execution
   export async function reserveInventory(
     productId: string,
     quantity: number
   ): Promise<'reserved' | 'out_of_stock' | 'not_found'> {
     const result = await redis.eval(
       LUA_RESERVE_SCRIPT,
       1,                          // Number of keys
       `inventory:${productId}`,   // KEYS[1]
       quantity.toString()         // ARGV[1]
     ) as number;

     switch (result) {
       case 1:  return 'reserved';
       case 0:  return 'out_of_stock';
       default: return 'not_found';
     }
   }

   // Release reservation if order fails
   export async function releaseInventory(productId: string, quantity: number) {
     await redis.incrby(`inventory:${productId}`, quantity);
   }

   // Sync Redis inventory back to database periodically
   export async function syncInventoryToDatabase() {
     const keys = await redis.keys('inventory:*');
     for (const key of keys) {
       const productId = key.replace('inventory:', '');
       const quantity = parseInt(await redis.get(key) ?? '0');
       await db.products.updateInventory(productId, quantity);
     }
   }
   ```

   > **Alternative without Lua**: Use `redis.set('inventory:lock:' + productId, '1', 'EX', 5, 'NX')` as a distributed lock, then check-and-decrement inside the lock. The Lua approach is simpler and faster for high-throughput scenarios.

3. **Queue order intake to protect the database**

   During a spike, accept orders into a queue immediately and process them asynchronously. The customer gets instant confirmation; fulfillment happens in the background:

   ```typescript
   import {SQSClient, SendMessageCommand} from '@aws-sdk/client-sqs';

   const sqs = new SQSClient({region: 'us-east-1'});

   // Checkout API: fast path — just validate and enqueue
   export async function POST(req: NextRequest) {
     const order = await req.json();

     // 1. Validate input (fast — no DB call)
     const validation = orderSchema.safeParse(order);
     if (!validation.success) return NextResponse.json({errors: validation.error.flatten()}, {status: 400});

     // 2. Reserve inventory atomically in Redis
     const reservation = await reserveInventory(order.productId, order.quantity);
     if (reservation === 'out_of_stock') {
       return NextResponse.json({error: 'This item is sold out'}, {status: 409});
     }

     // 3. Generate a pending order ID
     const orderId = crypto.randomUUID();

     // 4. Enqueue for async processing — this is fast (<10ms)
     await sqs.send(new SendMessageCommand({
       QueueUrl: process.env.ORDER_QUEUE_URL!,
       MessageBody: JSON.stringify({orderId, ...validation.data}),
       MessageGroupId: order.customerId,     // FIFO queue — one message group per customer
       MessageDeduplicationId: orderId,
     }));

     // 5. Return immediately — customer gets instant response
     return NextResponse.json({
       orderId,
       status: 'queued',
       message: 'Your order is being processed. You will receive a confirmation email shortly.',
     });
   }

   // Order processor (runs as a separate service/Lambda consuming SQS)
   export async function processOrder(message: {Body: string}) {
     const order = JSON.parse(message.Body);

     try {
       // Full order processing: payment capture, DB write, email
       await capturePayment(order);
       await db.orders.create(order);
       await sendOrderConfirmationEmail(order);
       await syncInventoryToDatabase();
     } catch (err: any) {
       // Release inventory reservation on failure
       await releaseInventory(order.productId, order.quantity);
       await notifyOrderFailed(order.orderId, err.message);
       throw err; // Let SQS retry or move to DLQ
     }
   }
   ```

4. **Implement circuit breakers**

   When a downstream service (payment processor, database) is overloaded, fail fast instead of queuing requests that will all time out:

   ```typescript
   import CircuitBreaker from 'opossum';
   import {Counter} from 'prom-client';

   const circuitStateCounter = new Counter({
     name: 'circuit_breaker_state_total',
     labelNames: ['service', 'state'],
   });

   function createCircuitBreaker(fn: (...args: any[]) => Promise<any>, name: string) {
     const breaker = new CircuitBreaker(fn, {
       timeout: 5000,                    // 5s timeout per call
       errorThresholdPercentage: 30,     // Open if 30% fail
       resetTimeout: 30000,              // Try half-open after 30s
       volumeThreshold: 10,             // Minimum 10 calls before opening
     });

     breaker.on('open', () => {
       circuitStateCounter.inc({service: name, state: 'open'});
       console.warn(`Circuit OPEN for ${name}`);
     });
     breaker.on('halfOpen', () => circuitStateCounter.inc({service: name, state: 'half_open'}));
     breaker.on('close', () => circuitStateCounter.inc({service: name, state: 'close'}));

     return breaker;
   }

   const paymentCircuit = createCircuitBreaker(captureStripePayment, 'stripe');
   const dbCircuit = createCircuitBreaker(writeOrderToDatabase, 'database');

   // Fallback: queue for retry instead of failing the customer
   paymentCircuit.fallback(async (order: Order) => {
     await sqs.send(new SendMessageCommand({
       QueueUrl: process.env.PAYMENT_RETRY_QUEUE_URL!,
       MessageBody: JSON.stringify(order),
       DelaySeconds: 30,
     }));
     return {status: 'payment_queued', message: 'Payment will be retried automatically'};
   });
   ```

5. **Protect the database with read replicas and caching**

   During a flash sale, catalog reads can overwhelm the primary database. Route reads to replicas and cache heavily:

   ```typescript
   // lib/db-router.ts
   import {Pool} from 'pg';

   const primary = new Pool({connectionString: process.env.DATABASE_URL});
   const readReplica = new Pool({connectionString: process.env.DATABASE_REPLICA_URL, max: 50});

   export const db = {
     // Writes go to primary
     async write(query: string, params: any[]) {
       return primary.query(query, params);
     },
     // Reads go to replica
     async read(query: string, params: any[]) {
       return readReplica.query(query, params);
     },
   };

   // Cache product catalog in Redis for the duration of the sale
   export async function getProductCached(productId: string): Promise<Product> {
     const cacheKey = `product:${productId}`;
     const cached = await redis.get(cacheKey);
     if (cached) return JSON.parse(cached) as Product;

     const result = await db.read('SELECT * FROM products WHERE id = $1', [productId]);
     const product = result.rows[0];
     await redis.setex(cacheKey, 300, JSON.stringify(product));
     return product;
   }
   ```

6. **Load test before the sale**

   ```bash
   # Install Artillery for load testing
   npm install -g artillery

   # Create test scenario file
   cat > flash-sale.yml << 'EOF'
   config:
     target: "https://api.mystore.com"
     phases:
       - duration: 60
         arrivalRate: 10
         name: "Warm up"
       - duration: 30
         arrivalRate: 500
         name: "Flash sale spike"
       - duration: 120
         arrivalRate: 100
         name: "Sustained load"
   scenarios:
     - name: "Flash sale checkout"
       weight: 70
       flow:
         - get:
             url: "/api/products/limited-item"
         - post:
             url: "/api/checkout"
             json:
               productId: "limited-item"
               quantity: 1
     - name: "Browse catalog"
       weight: 30
       flow:
         - get:
             url: "/api/products?page=1"
   EOF

   artillery run flash-sale.yml --output results.json
   artillery report results.json
   ```

## Examples

### Redis-based waiting room with fair queuing

```typescript
// Fair queue: customers get a position when they arrive
export async function enterWaitingRoom(sessionId: string, productId: string): Promise<{position: number; token: string}> {
  const queueKey = `sale_queue:${productId}`;

  // Atomic: add to sorted set with timestamp score (FIFO ordering)
  await redis.zadd(queueKey, Date.now(), sessionId);
  const position = await redis.zrank(queueKey, sessionId);

  // Generate a signed queue token
  const token = await signQueueToken(sessionId, productId, position ?? 0);

  return {position: (position ?? 0) + 1, token};
}

// Periodically admit customers from queue to checkout
export async function admitFromQueue(productId: string, batchSize: number) {
  const queueKey = `sale_queue:${productId}`;
  const admitted = await redis.zpopmin(queueKey, batchSize);

  // zpopmin returns alternating [member, score] entries
  for (let i = 0; i < admitted.length; i += 2) {
    const sessionId = admitted[i];
    await notifyCustomerAdmitted(sessionId, productId);
  }
}
```

### Kubernetes pre-scale CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: flash-sale-prescale
spec:
  schedule: "30 11 * * 5"  # 11:30 AM every Friday (30 min before noon sale)
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: scaler-sa
          containers:
            - name: scaler
              image: bitnami/kubectl
              command:
                - kubectl
                - scale
                - deployment/checkout-service
                - --replicas=100
          restartPolicy: OnFailure
```

## Best Practices

- **Reserve inventory in Redis, not the database** — atomic Redis operations handle thousands of concurrent reservations per second; PostgreSQL row locking under the same load causes timeouts and deadlocks
- **Accept orders into a queue during spikes** — the user-facing checkout API should respond in under 100ms even during peak load; defer expensive operations (payment capture, DB writes, emails) to background workers
- **Set aggressive timeouts on every external call** — a 30-second Stripe timeout under load multiplies into thousands of held connections; use 5-second timeouts with immediate circuit-breaker escalation
- **Test at 2–3× expected peak, not just expected peak** — load tests at exactly expected capacity leave no headroom for measurement error; size for 3× to account for uneven traffic distribution
- **Use a read replica for all catalog queries during sales** — the primary database should only handle writes (order creation) during peak; all reads route to the replica
- **Communicate queue status to customers** — show a real-time position counter in the waiting room; customers with visible progress are far more patient than those staring at a spinner
- **Scale back down after the sale** — over-provisioned infrastructure costs money; configure a post-sale scale-down CronJob to return to normal capacity

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Oversells despite inventory check | Use Redis atomic operations (Lua script or distributed lock) for check-and-decrement; never check inventory in the application layer then update separately |
| Auto-scaling too slow to respond | Pre-warm to minimum capacity; configure scale-out cooldown to 30 seconds (not the default 5 minutes) |
| SQS queue depth grows faster than consumer processes | Scale consumers based on queue depth metric; use SQS Application Auto Scaling with a target tracking policy |
| Circuit breaker opens on brief latency spike, not real failure | Tune `volumeThreshold` and `errorThresholdPercentage` conservatively; use `timeout` rather than error rate as the primary trigger for flash sale scenarios |
| Database connection pool exhausted | Set `max` connections in the pool to a value that leaves headroom for other services; use PgBouncer to multiplex connections |

## Related Skills

- @database-optimization-commerce
- @monitoring-alerting-commerce
- @load-testing-commerce
- @bot-protection
- @edge-commerce
