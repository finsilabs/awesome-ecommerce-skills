---
name: erp-integration
description: "Sync orders, inventory, and customer data between your store and ERP systems like SAP, NetSuite, or Odoo using middleware and async queues"
category: integrations-apis
risk: critical
source: curated
date_added: "2026-03-12"
tags: [erp, sap, netsuite, odoo, integration, sync, orders, inventory, middleware]
triggers: ["integrate ERP system", "sync orders with ERP", "connect SAP to ecommerce", "ERP inventory sync"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# ERP Integration

## Overview

Build integrations between e-commerce platforms and ERP systems (SAP, NetSuite, Odoo, Microsoft Dynamics) for bidirectional sync of orders, inventory, customers, and products. This skill covers integration architecture patterns (event-driven, polling, middleware), data mapping and transformation, conflict resolution, error handling and retry strategies, and idempotent sync endpoints that prevent duplicate records.

## When to Use This Skill

- When connecting a storefront to an ERP for automated order fulfillment
- When syncing real-time inventory levels from an ERP/WMS to the e-commerce catalog
- When building customer master data sync between the storefront and ERP
- When implementing product and pricing feeds from the ERP to the storefront
- When designing a middleware layer to handle multiple integration points

## Core Instructions

1. **Design the integration architecture**

   ```
   E-commerce ←→ Integration Layer ←→ ERP

   Pattern options:
   ┌─────────────────────────────────────────────────────────────┐
   │ 1. Event-Driven (recommended for real-time)                 │
   │    Storefront → Webhook/Event → Message Queue → ERP Adapter │
   │                                                              │
   │ 2. Polling (for ERP systems without webhooks)               │
   │    Scheduler → Poll ERP API → Transform → Update Storefront │
   │                                                              │
   │ 3. Middleware Platform (for complex multi-system)            │
   │    Storefront ↔ Workato/Celigo/MuleSoft ↔ ERP             │
   └─────────────────────────────────────────────────────────────┘
   ```

   ```typescript
   // Integration layer architecture
   interface SyncConfig {
     entities: {
       orders: {
         direction: 'ecommerce_to_erp';
         trigger: 'webhook';        // Real-time on order creation
         retryPolicy: RetryPolicy;
       };
       inventory: {
         direction: 'erp_to_ecommerce';
         trigger: 'polling';         // Poll every 5 minutes
         pollingInterval: 300000;
         retryPolicy: RetryPolicy;
       };
       customers: {
         direction: 'bidirectional';
         trigger: 'webhook';
         conflictResolution: 'erp_wins';  // ERP is system of record
       };
       products: {
         direction: 'erp_to_ecommerce';
         trigger: 'polling';
         pollingInterval: 900000;    // Every 15 minutes
       };
     };
   }

   interface RetryPolicy {
     maxRetries: number;
     initialDelayMs: number;
     maxDelayMs: number;
     backoffMultiplier: number;
   }

   const defaultRetryPolicy: RetryPolicy = {
     maxRetries: 5,
     initialDelayMs: 1000,
     maxDelayMs: 300000,      // 5 minutes max
     backoffMultiplier: 2,
   };
   ```

2. **Build the order sync pipeline (e-commerce to ERP)**

   ```typescript
   interface OrderSyncPayload {
     orderId: string;
     orderNumber: string;
     externalId?: string;      // ERP order ID after sync
     status: 'pending' | 'synced' | 'failed';
     attempts: number;
     lastError?: string;
     createdAt: Date;
     syncedAt?: Date;
   }

   class OrderSyncService {
     constructor(
       private erpAdapter: ERPAdapter,
       private orderRepo: OrderRepository,
       private syncLog: SyncLogRepository,
       private logger: Logger
     ) {}

     async syncOrder(orderId: string): Promise<void> {
       const order = await this.orderRepo.getOrderWithItems(orderId);

       // Idempotency check: skip if already synced
       const existingSync = await this.syncLog.findByOrderId(orderId);
       if (existingSync?.status === 'synced') {
         this.logger.info(`Order ${orderId} already synced, skipping`);
         return;
       }

       // Transform to ERP format
       const erpOrder = this.mapOrderToERP(order);

       try {
         const erpResponse = await this.erpAdapter.createSalesOrder(erpOrder);

         await this.syncLog.upsert({
           orderId,
           orderNumber: order.orderNumber,
           externalId: erpResponse.erpOrderId,
           status: 'synced',
           attempts: (existingSync?.attempts || 0) + 1,
           syncedAt: new Date(),
         });

         // Store ERP reference on the order
         await this.orderRepo.updateMetadata(orderId, {
           erpOrderId: erpResponse.erpOrderId,
           erpSyncedAt: new Date().toISOString(),
         });

         this.logger.info(`Order ${order.orderNumber} synced → ERP ID: ${erpResponse.erpOrderId}`);
       } catch (error) {
         await this.syncLog.upsert({
           orderId,
           orderNumber: order.orderNumber,
           status: 'failed',
           attempts: (existingSync?.attempts || 0) + 1,
           lastError: error.message,
         });

         this.logger.error(`Order sync failed for ${order.orderNumber}: ${error.message}`);
         throw error; // Let the retry mechanism handle it
       }
     }

     private mapOrderToERP(order: Order): ERPSalesOrder {
       return {
         externalReference: order.orderNumber,
         orderDate: order.createdAt.toISOString().split('T')[0],
         customer: {
           externalId: order.customer?.erpCustomerId || null,
           email: order.email,
           name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
         },
         shippingAddress: {
           line1: order.shippingAddress.street1,
           line2: order.shippingAddress.street2,
           city: order.shippingAddress.city,
           state: order.shippingAddress.state,
           postalCode: order.shippingAddress.postalCode,
           country: order.shippingAddress.country,
         },
         lineItems: order.lineItems.map(item => ({
           sku: item.sku,
           quantity: item.quantity,
           unitPrice: item.unitPrice / 100,   // Convert cents to dollars for ERP
           discount: item.discountAmount / 100,
           taxAmount: item.taxAmount / 100,
         })),
         shippingAmount: order.shippingTotal / 100,
         taxTotal: order.taxTotal / 100,
         orderTotal: order.totalPrice / 100,
         currency: order.currency,
         paymentMethod: order.paymentMethod,
         notes: order.customerNote,
       };
     }
   }
   ```

3. **Implement inventory sync (ERP to e-commerce)**

   ```typescript
   class InventorySyncService {
     constructor(
       private erpAdapter: ERPAdapter,
       private inventoryRepo: InventoryRepository,
       private cache: Redis,
       private logger: Logger
     ) {}

     // Polling-based: called by a scheduled job every 5 minutes
     async syncInventoryLevels(): Promise<SyncResult> {
       const result: SyncResult = { updated: 0, errors: 0, skipped: 0 };

       // Fetch all inventory from ERP (paginated)
       let page = 1;
       let hasMore = true;

       while (hasMore) {
         const erpInventory = await this.erpAdapter.getInventoryLevels({
           page,
           pageSize: 500,
           modifiedSince: await this.getLastSyncTimestamp(),
         });

         for (const item of erpInventory.items) {
           try {
             await this.processInventoryItem(item, result);
           } catch (error) {
             result.errors++;
             this.logger.error(`Inventory sync error for SKU ${item.sku}: ${error.message}`);
           }
         }

         hasMore = erpInventory.hasMore;
         page++;
       }

       await this.setLastSyncTimestamp(new Date());
       this.logger.info(
         `Inventory sync complete: ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors`
       );

       return result;
     }

     private async processInventoryItem(item: ERPInventoryItem, result: SyncResult): Promise<void> {
       // Map ERP warehouse quantities to e-commerce availability
       const availableQty = this.calculateAvailableQuantity(item);

       // Check if quantity actually changed (skip no-ops)
       const currentQty = await this.inventoryRepo.getQuantityBySku(item.sku);
       if (currentQty === availableQty) {
         result.skipped++;
         return;
       }

       // Update inventory in e-commerce database
       await this.inventoryRepo.updateBySku(item.sku, {
         quantity: availableQty,
         lastSyncedAt: new Date(),
         erpWarehouseId: item.warehouseId,
       });

       // Update Redis cache for real-time availability
       const productId = await this.inventoryRepo.getProductIdBySku(item.sku);
       if (productId) {
         await this.cache.set(`inventory:${productId}`, String(availableQty), 'EX', 3600);
       }

       result.updated++;
     }

     private calculateAvailableQuantity(item: ERPInventoryItem): number {
       // Available = On Hand - Reserved - Safety Stock
       const available = item.onHandQuantity - item.reservedQuantity - (item.safetyStock || 0);
       return Math.max(0, available);
     }

     private async getLastSyncTimestamp(): Promise<Date | undefined> {
       const ts = await this.cache.get('inventory:last_sync');
       return ts ? new Date(ts) : undefined;
     }

     private async setLastSyncTimestamp(date: Date): Promise<void> {
       await this.cache.set('inventory:last_sync', date.toISOString());
     }
   }

   interface SyncResult {
     updated: number;
     errors: number;
     skipped: number;
   }
   ```

4. **Build a retry mechanism with exponential backoff**

   ```typescript
   import { Queue, Worker, QueueEvents } from 'bullmq';

   // BullMQ queue for reliable order sync with retries
   const orderSyncQueue = new Queue('order-sync', {
     connection: { host: 'localhost', port: 6379 },
     defaultJobOptions: {
       attempts: 5,
       backoff: {
         type: 'exponential',
         delay: 5000,    // 5s, 10s, 20s, 40s, 80s
       },
       removeOnComplete: { count: 1000 },
       removeOnFail: { count: 5000 },
     },
   });

   // Producer: enqueue order for sync when placed
   async function onOrderPlaced(orderId: string): Promise<void> {
     await orderSyncQueue.add(
       'sync-order',
       { orderId },
       {
         jobId: `order-sync-${orderId}`,  // Idempotent: same order won't be queued twice
       }
     );
   }

   // Consumer: process the sync job
   const worker = new Worker('order-sync', async (job) => {
     const { orderId } = job.data;
     const syncService = container.resolve(OrderSyncService);

     await syncService.syncOrder(orderId);
   }, {
     connection: { host: 'localhost', port: 6379 },
     concurrency: 5,   // Process 5 orders in parallel
   });

   // Monitor failed jobs
   const queueEvents = new QueueEvents('order-sync', {
     connection: { host: 'localhost', port: 6379 },
   });

   queueEvents.on('failed', ({ jobId, failedReason }) => {
     logger.error(`Order sync job ${jobId} failed: ${failedReason}`);
     // Alert ops team after final retry
   });

   queueEvents.on('retries-exhausted', ({ jobId }) => {
     logger.error(`Order sync job ${jobId} exhausted all retries — manual intervention needed`);
     // Send alert to Slack/PagerDuty
   });
   ```

5. **Implement a generic ERP adapter interface**

   ```typescript
   // Abstract adapter — implement per ERP system
   interface ERPAdapter {
     // Orders
     createSalesOrder(order: ERPSalesOrder): Promise<{ erpOrderId: string }>;
     getOrderStatus(erpOrderId: string): Promise<ERPOrderStatus>;
     cancelOrder(erpOrderId: string): Promise<void>;

     // Inventory
     getInventoryLevels(params: InventoryQueryParams): Promise<PaginatedResult<ERPInventoryItem>>;

     // Customers
     createCustomer(customer: ERPCustomer): Promise<{ erpCustomerId: string }>;
     updateCustomer(erpCustomerId: string, data: Partial<ERPCustomer>): Promise<void>;
     getCustomer(erpCustomerId: string): Promise<ERPCustomer>;

     // Products
     getProducts(params: ProductQueryParams): Promise<PaginatedResult<ERPProduct>>;
   }

   // NetSuite adapter implementation via SuiteTalk REST
   class NetSuiteAdapter implements ERPAdapter {
     private baseUrl: string;
     private oauth: NetSuiteOAuth;

     constructor(config: NetSuiteConfig) {
       this.baseUrl = `https://${config.accountId}.suitetalk.api.netsuite.com/services/rest/record/v1`;
       this.oauth = new NetSuiteOAuth(config);
     }

     async createSalesOrder(order: ERPSalesOrder): Promise<{ erpOrderId: string }> {
       const nsOrder = {
         entity: { id: order.customer.externalId },
         tranDate: order.orderDate,
         otherRefNum: order.externalReference,
         item: {
           items: order.lineItems.map(item => ({
             item: { externalId: item.sku },
             quantity: item.quantity,
             rate: item.unitPrice,
           })),
         },
         shippingAddress: {
           addr1: order.shippingAddress.line1,
           addr2: order.shippingAddress.line2,
           city: order.shippingAddress.city,
           state: order.shippingAddress.state,
           zip: order.shippingAddress.postalCode,
           country: { id: order.shippingAddress.country },
         },
       };

       const response = await this.request('POST', '/salesOrder', nsOrder);
       const location = response.headers.get('Location');
       const erpOrderId = location?.split('/').pop() || '';

       return { erpOrderId };
     }

     async getInventoryLevels(params: InventoryQueryParams): Promise<PaginatedResult<ERPInventoryItem>> {
       const query = new URLSearchParams({
         limit: String(params.pageSize),
         offset: String((params.page - 1) * params.pageSize),
       });

       if (params.modifiedSince) {
         query.set('q', `lastModifiedDate AFTER "${params.modifiedSince.toISOString()}"`);
       }

       const response = await this.request('GET', `/inventoryItem?${query}`);
       const data = await response.json();

       return {
         items: data.items.map(this.mapInventoryItem),
         hasMore: data.hasMore,
         totalCount: data.totalResults,
       };
     }

     private mapInventoryItem(nsItem: any): ERPInventoryItem {
       return {
         sku: nsItem.itemId,
         warehouseId: nsItem.location?.id || 'default',
         onHandQuantity: nsItem.quantityOnHand || 0,
         reservedQuantity: nsItem.quantityCommitted || 0,
         safetyStock: nsItem.safetyStockLevel || 0,
         lastModified: new Date(nsItem.lastModifiedDate),
       };
     }

     private async request(method: string, path: string, body?: object): Promise<Response> {
       const url = `${this.baseUrl}${path}`;
       const headers = this.oauth.getHeaders(method, url);

       return fetch(url, {
         method,
         headers: {
           ...headers,
           'Content-Type': 'application/json',
           'Accept': 'application/json',
         },
         body: body ? JSON.stringify(body) : undefined,
       });
     }
   }
   ```

6. **Build a sync dashboard for monitoring**

   ```typescript
   // GET /api/admin/integrations/status
   async function getIntegrationStatus(req: Request, res: Response) {
     const [
       orderSyncStats,
       inventorySyncStats,
       failedJobs,
       lastSync,
     ] = await Promise.all([
       syncLog.getStats('order', 24),   // Last 24 hours
       syncLog.getStats('inventory', 24),
       orderSyncQueue.getFailed(0, 20),  // Last 20 failed jobs
       cache.get('inventory:last_sync'),
     ]);

     res.json({
       orders: {
         last24h: {
           synced: orderSyncStats.synced,
           failed: orderSyncStats.failed,
           pending: orderSyncStats.pending,
         },
         failedJobs: failedJobs.map(job => ({
           orderId: job.data.orderId,
           error: job.failedReason,
           attempts: job.attemptsMade,
           failedAt: job.finishedOn,
         })),
       },
       inventory: {
         lastSyncAt: lastSync,
         last24h: {
           updated: inventorySyncStats.updated,
           errors: inventorySyncStats.errors,
           skipped: inventorySyncStats.skipped,
         },
       },
       health: {
         erpConnectivity: await checkERPHealth(),
         queueDepth: await orderSyncQueue.count(),
         queueLatency: await getAverageProcessingTime(),
       },
     });
   }

   async function checkERPHealth(): Promise<'healthy' | 'degraded' | 'down'> {
     try {
       const start = Date.now();
       await erpAdapter.getOrderStatus('health-check');
       const latency = Date.now() - start;
       return latency < 5000 ? 'healthy' : 'degraded';
     } catch {
       return 'down';
     }
   }
   ```

## Examples

### SAP S/4HANA integration via OData API

```typescript
class SAPAdapter implements ERPAdapter {
  private baseUrl: string;

  constructor(config: SAPConfig) {
    this.baseUrl = `${config.host}/sap/opu/odata/sap`;
  }

  async createSalesOrder(order: ERPSalesOrder): Promise<{ erpOrderId: string }> {
    const sapOrder = {
      SalesOrderType: 'OR',
      SalesOrganization: '1000',
      DistributionChannel: '10',
      OrganizationDivision: '00',
      SoldToParty: order.customer.externalId,
      PurchaseOrderByCustomer: order.externalReference,
      to_Item: {
        results: order.lineItems.map((item, index) => ({
          SalesOrderItem: String((index + 1) * 10).padStart(6, '0'),
          Material: item.sku,
          RequestedQuantity: String(item.quantity),
          RequestedQuantityUnit: 'EA',
          NetAmount: String(item.unitPrice * item.quantity),
        })),
      },
    };

    const response = await fetch(
      `${this.baseUrl}/API_SALES_ORDER_SRV/A_SalesOrder`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.getBasicAuth()}`,
          'Content-Type': 'application/json',
          'X-CSRF-Token': await this.getCsrfToken(),
        },
        body: JSON.stringify(sapOrder),
      }
    );

    const data = await response.json();
    return { erpOrderId: data.d.SalesOrder };
  }

  private async getCsrfToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/API_SALES_ORDER_SRV/`, {
      headers: {
        'Authorization': `Basic ${this.getBasicAuth()}`,
        'X-CSRF-Token': 'Fetch',
      },
    });
    return response.headers.get('X-CSRF-Token') || '';
  }
}
```

### Dead letter queue for failed syncs

```typescript
// After all retries are exhausted, move to dead letter queue
const deadLetterQueue = new Queue('order-sync-dlq', {
  connection: { host: 'localhost', port: 6379 },
});

worker.on('failed', async (job, error) => {
  if (job && job.attemptsMade >= job.opts.attempts) {
    await deadLetterQueue.add('failed-order', {
      originalJobId: job.id,
      orderId: job.data.orderId,
      error: error.message,
      attempts: job.attemptsMade,
      failedAt: new Date().toISOString(),
    });

    // Alert the operations team
    await notifyOpsTeam({
      channel: '#erp-alerts',
      message: `Order ${job.data.orderId} failed to sync after ${job.attemptsMade} attempts: ${error.message}`,
    });
  }
});

// Admin endpoint to retry DLQ items manually
// POST /api/admin/integrations/dlq/:jobId/retry
async function retryDlqJob(req: Request, res: Response) {
  const dlqJob = await deadLetterQueue.getJob(req.params.jobId);
  if (!dlqJob) return res.status(404).json({ error: 'Job not found' });

  // Re-enqueue to main queue
  await orderSyncQueue.add('sync-order', { orderId: dlqJob.data.orderId });
  await dlqJob.remove();

  res.json({ message: 'Job re-enqueued for retry' });
}
```

## Best Practices

- **Make every sync operation idempotent** -- use external references (order number, SKU) to check for existing records in the ERP before creating; this prevents duplicates from retries
- **Use a message queue for order sync** -- never call the ERP synchronously during checkout; enqueue the sync job and process asynchronously with retries
- **Implement a dead letter queue** -- after all retries are exhausted, move failed jobs to a DLQ for manual inspection and retry; never silently drop messages
- **Map data in a separate transformation layer** -- keep ERP-specific data formats out of your e-commerce code; use adapter interfaces and mapper functions
- **Store the ERP record ID on your local records** -- after syncing an order, save the ERP order ID on your order record for cross-referencing and status lookups
- **Use delta sync, not full sync** -- query the ERP for records modified since the last sync timestamp; full syncs don't scale past a few thousand records
- **Monitor sync lag and error rates** -- build a dashboard showing sync status, queue depth, error counts, and ERP connectivity; alert on failures
- **Handle ERP downtime gracefully** -- buffer orders in the queue during ERP maintenance windows; the queue naturally drains when the ERP comes back online

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate orders in ERP from retry logic | Use the e-commerce order number as an external reference and check for its existence before creating; most ERPs support duplicate-check on external IDs |
| Inventory quantities go negative after sync | Calculate available qty as `onHand - reserved - safetyStock` and clamp to zero; never blindly use the ERP's raw quantity |
| Customer records don't match across systems | Designate one system as the "system of record" per entity (e.g., ERP for customers, e-commerce for orders) and resolve conflicts accordingly |
| ERP rate limits cause sync failures | Implement rate limiting in your adapter (token bucket or sliding window) and batch API calls where the ERP supports it |
| Price sync overwrites promotional prices | Separate base prices (from ERP) from promotional prices (from e-commerce); apply discounts on top of ERP prices, never overwrite them |
| Large initial data load times out | Break the initial sync into batches; process in parallel with concurrency limits and checkpointing so you can resume after a failure |

## Related Skills

- @shipping-rate-calculator
- @ecommerce-data-warehouse
- @pci-dss-compliance
- @magento-module-development
- @product-data-modeling
