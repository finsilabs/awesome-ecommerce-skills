---
name: customer-support-integration
description: "Connect Zendesk or Intercom to your store so support agents see full order history and customer details without switching tools"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [zendesk, intercom, helpdesk, customer-support, order-context, ticket, crm-integration, support-automation]
triggers: ["zendesk integration", "intercom integration", "helpdesk integration", "order context in support", "customer support integration", "inject order data into zendesk", "support ticket automation"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Customer Support Integration

## Overview

Injecting order and customer context into your helpdesk reduces average handle time by 40–60% because agents no longer need to switch between systems to look up order status, shipping info, or purchase history. This skill covers building Zendesk and Intercom integrations that automatically attach order context to tickets, triggering support conversations from order events (delivery failure, refund requested), and syncing support metadata back to your CRM.

## When to Use This Skill

- When support agents repeatedly ask customers for their order number because it is not auto-populated in the ticket
- When implementing Zendesk Sunshine Apps or Intercom Canvas Kit to show order details inside the agent interface
- When automating ticket creation from order events (failed delivery, fraud hold, out-of-stock backorder)
- When routing tickets by order value to prioritize VIP customers
- When syncing support sentiment and CSAT scores back to your CRM for customer health scoring

## Core Instructions

1. **Create a Zendesk Sunshine App (sidebar panel) that shows order context**

   Zendesk Apps are React apps served from your server and displayed in the ticket sidebar:

   ```typescript
   // server/zendesk-app-data.ts
   // GET /api/support/zendesk-context?ticketId=xxx
   export async function getZendeskContext(req: Request, res: Response) {
     const { ticketId } = req.query;

     // Fetch the ticket from Zendesk to get the requester email
     const ticket = await fetchZendeskTicket(ticketId as string);
     const customerEmail = ticket.via?.source?.from?.address ?? ticket.requester?.email;

     if (!customerEmail) return res.json({ customer: null, orders: [] });

     const customer = await db.customers.findByEmail(customerEmail, {
       include: ['tags', 'segmentScore'],
     });

     const recentOrders = await db.orders.findManyByCustomer(customer?.id, {
       limit: 5,
       orderBy: { createdAt: 'desc' },
       include: ['lineItems.product', 'shipments'],
     });

     res.json({
       customer: customer ? {
         id: customer.id,
         lifetimeValue: customer.lifetimeSpendCents / 100,
         totalOrders: customer.orderCount,
         segment: customer.segmentScore?.segment,
         tags: customer.tags,
       } : null,
       orders: recentOrders.map((o) => ({
         number: o.number,
         status: o.status,
         total: o.totalCents / 100,
         createdAt: o.createdAt,
         trackingUrl: o.shipments[0]?.trackingUrl,
         items: o.lineItems.map((i) => ({ name: i.product.name, quantity: i.quantity })),
       })),
     });
   }
   ```

2. **Register Zendesk webhooks to auto-create tickets from order events**

   ```typescript
   // POST /api/support/zendesk/create-ticket
   async function createZendeskTicket(params: {
     subject: string;
     body: string;
     customerEmail: string;
     orderId: string;
     priority: 'urgent' | 'high' | 'normal' | 'low';
     tags?: string[];
   }) {
     const response = await fetch(`https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`, {
       method: 'POST',
       headers: {
         Authorization: `Basic ${Buffer.from(`${process.env.ZENDESK_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`).toString('base64')}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         ticket: {
           subject: params.subject,
           comment: { body: params.body },
           requester: { email: params.customerEmail },
           priority: params.priority,
           tags: [...(params.tags ?? []), `order-${params.orderId}`],
           custom_fields: [
             { id: process.env.ZENDESK_ORDER_ID_FIELD_ID, value: params.orderId },
           ],
         },
       }),
     });

     return response.json();
   }

   // Trigger on delivery failure
   async function onDeliveryFailed(shipmentId: string) {
     const shipment = await db.shipments.findById(shipmentId, { include: ['order.customer'] });
     await createZendeskTicket({
       subject: `Delivery failed — Order #${shipment.order.number}`,
       body: `The delivery attempt for order #${shipment.order.number} failed on ${new Date().toDateString()}. Carrier: ${shipment.carrier}. Tracking: ${shipment.trackingNumber}.`,
       customerEmail: shipment.order.customer.email,
       orderId: shipment.orderId,
       priority: 'high',
       tags: ['delivery-failure', 'auto-created'],
     });
   }
   ```

3. **Inject order context into Intercom conversations**

   Intercom uses a Canvas Kit app to show custom data in the conversation sidebar:

   ```typescript
   // POST /api/support/intercom/canvas — called by Intercom when a conversation is opened
   export async function renderIntercomCanvas(req: Request, res: Response) {
     const { conversation_id, contact } = req.body;
     const customerEmail = contact?.email;

     const recentOrder = customerEmail
       ? await db.orders.findLatestByEmail(customerEmail, { include: ['shipments'] })
       : null;

     const canvas = {
       content: {
         components: recentOrder
           ? [
               { type: 'text', text: `Last Order: #${recentOrder.number}`, style: 'header' },
               { type: 'text', text: `Status: ${recentOrder.status}`, style: 'paragraph' },
               { type: 'text', text: `Total: $${(recentOrder.totalCents / 100).toFixed(2)}`, style: 'paragraph' },
               { type: 'text', text: `Placed: ${recentOrder.createdAt.toDateString()}`, style: 'muted' },
               ...(recentOrder.shipments[0]?.trackingUrl
                 ? [{ type: 'button', id: 'track', label: 'Track Package', action: { type: 'url', url: recentOrder.shipments[0].trackingUrl } }]
                 : []),
             ]
           : [{ type: 'text', text: 'No recent orders found', style: 'paragraph' }],
       },
     };

     res.json(canvas);
   }
   ```

4. **Sync support CSAT scores back to your CRM**

   ```typescript
   // POST /api/support/zendesk/webhook — Zendesk sends events here
   export async function handleZendeskWebhook(req: Request, res: Response) {
     const { type, ticket_id, satisfaction } = req.body;

     if (type === 'ticket.satisfaction_rating.created') {
       const ticket = await fetchZendeskTicket(ticket_id);
       const orderId = ticket.custom_fields?.find((f: any) => f.id === process.env.ZENDESK_ORDER_ID_FIELD_ID)?.value;
       const customerEmail = ticket.requester?.email;

       if (customerEmail) {
         await db.customers.updateByEmail(customerEmail, {
           lastCsatScore: satisfaction.score, // 'good' | 'bad'
           lastCsatAt: new Date(),
         });

         if (satisfaction.score === 'bad') {
           // Flag for proactive outreach
           await db.customerFlags.create({ email: customerEmail, flag: 'poor_support_experience', createdAt: new Date() });
         }
       }
     }

     res.sendStatus(200);
   }
   ```

5. **Route tickets by customer segment to prioritize VIPs**

   ```typescript
   async function applyTicketRoutingRules(ticketId: string) {
     const ticket = await fetchZendeskTicket(ticketId);
     const customerEmail = ticket.requester?.email;
     const customer = await db.customers.findByEmail(customerEmail, { include: ['segmentScore'] });

     if (!customer) return;

     let priority: string = 'normal';
     let groupId: string = process.env.ZENDESK_DEFAULT_GROUP_ID!;

     // VIP routing: champions and cannot_lose_them segments get urgent priority
     if (['champions', 'cannot_lose_them'].includes(customer.segmentScore?.segment ?? '')) {
       priority = 'urgent';
       groupId = process.env.ZENDESK_VIP_GROUP_ID!;
     } else if (customer.lifetimeSpendCents >= 100000) {
       priority = 'high';
     }

     await fetch(`https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets/${ticketId}.json`, {
       method: 'PUT',
       headers: { Authorization: getZendeskAuthHeader(), 'Content-Type': 'application/json' },
       body: JSON.stringify({ ticket: { priority, group_id: groupId } }),
     });
   }
   ```

## Examples

### One-click refund action from within Zendesk

Add a sidebar button that triggers a refund directly from the ticket:

```typescript
// POST /api/support/zendesk/refund — called from Zendesk App button click
export async function processRefundFromTicket(req: Request, res: Response) {
  const { orderId, amount, reason, agentId } = req.body;

  // Verify the agent has permission
  const agent = await db.supportAgents.findByZendeskId(agentId);
  if (!agent || agent.maxRefundAmount < amount) {
    return res.status(403).json({ error: 'Refund amount exceeds agent authorization' });
  }

  const refund = await processRefund({ orderId, amountCents: Math.round(amount * 100), reason });

  // Post an internal note to the ticket
  await addZendeskTicketNote(req.body.ticketId, `Refund of $${amount.toFixed(2)} processed by agent ${agent.name}. Refund ID: ${refund.id}`);

  res.json({ refundId: refund.id });
}
```

### Sync order updates back to Zendesk ticket as note

```typescript
// In order status webhook handler
async function syncOrderStatusToZendesk(orderId: string, newStatus: string) {
  const ticket = await db.zendesk_tickets.findByOrderId(orderId);
  if (!ticket) return;

  await addZendeskTicketNote(ticket.zendeskTicketId, `Order #${orderId} status changed to: ${newStatus}`);
}
```

## Best Practices

- **Attach the order ID to every ticket as a custom field** — this is the key that links your support system to your commerce database and enables two-way sync
- **Prioritize tickets by customer lifetime value** — a champion customer waiting 4 hours is far more costly than a first-time buyer
- **Use webhook delivery with retry** — Zendesk and Intercom webhooks can fail; ensure your endpoint returns 200 within 5 seconds and implement retry for critical events
- **Keep the Intercom/Zendesk app data fresh** — cache order context for 60 seconds maximum; an agent seeing stale order status is worse than seeing a loading spinner
- **Never store Zendesk API tokens in client-side code** — the Zendesk API token has write access to all tickets; always proxy requests through your server
- **Log every agent action taken via the sidebar** — maintain an audit trail of refunds, order edits, and status changes initiated from within the helpdesk
- **Segment auto-created tickets** with specific tags — `auto-created`, `delivery-failure` etc. — so manual and automated tickets can be analyzed separately

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Zendesk App shows wrong customer because email lookup is case-sensitive | Normalize all emails to lowercase before lookup; `jane@example.com` and `Jane@example.com` are the same customer |
| Webhook payload from Zendesk is not verified | Implement HMAC signature verification using the Zendesk webhook signing secret before processing any payload |
| Intercom Canvas app times out loading order data | Canvas Kit has a 5-second timeout — ensure your order lookup query is indexed and responds in < 2 seconds |
| Order ID custom field not populated for inbound tickets | Auto-detect the order number from the ticket subject/body using regex and backfill the custom field via the Zendesk API |
| CSAT sync creates duplicate customer records | Always look up by email first; never create a new customer record from a support webhook — link to existing or skip |

## Related Skills

- @live-chat-commerce
- @customer-segmentation
- @customer-lifetime-value
- @product-reviews-ratings
- @referral-program
