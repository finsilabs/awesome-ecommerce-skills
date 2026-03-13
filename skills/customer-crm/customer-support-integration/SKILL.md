---
name: customer-support-integration
description: "Connect your helpdesk (Gorgias, Zendesk, Intercom) to your store so support agents see full order history and customer details without switching tools"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [zendesk, intercom, helpdesk, customer-support, order-context, ticket, crm-integration, support-automation, gorgias]
triggers: ["zendesk integration", "intercom integration", "helpdesk integration", "order context in support", "customer support integration", "inject order data into zendesk", "support ticket automation"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Customer Support Integration

## Overview

Connecting your helpdesk to your store automatically surfaces order history, tracking information, and customer spend inside every support ticket — reducing average handle time by 40–60% because agents don't switch between systems. For Shopify, Gorgias is the purpose-built helpdesk that's native to the platform. For other platforms and for Zendesk/Intercom users, dedicated integration apps connect the systems. Only build a custom integration if you need deep two-way automation (auto-create tickets from order events, VIP routing, CSAT sync back to CRM) that off-the-shelf apps don't provide.

## When to Use This Skill

- When support agents repeatedly ask customers for their order number because it doesn't auto-populate in the ticket
- When implementing Zendesk Sunshine Apps or Intercom Canvas Kit to show order details inside the agent interface
- When automating ticket creation from order events (failed delivery, fraud hold, backorder)
- When routing tickets by order value to prioritize VIP customers
- When syncing support CSAT scores back to your CRM for customer health scoring

## Core Instructions

### Step 1: Determine platform and choose the right helpdesk

| Platform | Best Helpdesk | Why |
|----------|--------------|-----|
| **Shopify** | Gorgias | Purpose-built for Shopify; deep order data access, macro variables that pull order info, 1-click actions (refund, cancel, reorder) from within the ticket |
| **Shopify** | Zendesk | Good for teams that already use Zendesk; install the Shopify app for Zendesk from the App Store |
| **WooCommerce** | Gorgias or Freshdesk | Gorgias supports WooCommerce; Freshdesk + WooCommerce plugin for teams on Freshdesk |
| **BigCommerce** | Gorgias or Zendesk | Both have BigCommerce integrations in their app marketplaces |
| **Custom / Headless** | Zendesk or Intercom with custom integration | Build a sidebar app to inject order context into tickets |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Option A: Gorgias (recommended for Shopify)**

Gorgias is the most widely-used Shopify support helpdesk with the deepest platform integration.

1. Install **Gorgias** from the Shopify App Store
2. Authorize Gorgias to access your Shopify store data
3. Gorgias automatically pulls order history, customer details, and shipping status into every ticket when a customer emails from the address on their Shopify account

**What Gorgias shows agents automatically:**
- Customer name, email, total spent, order count
- All past orders with status, items, and tracking
- Live chat history across all channels

**Setting up automation rules:**
1. Go to **Gorgias → Automation → Rules**
2. Create rules like:
   - Auto-tag tickets with "VIP" when customer lifetime value > $500
   - Auto-assign VIP tickets to a senior support team
   - Auto-reply with order status when ticket contains "where is my order"

**1-click actions from within Gorgias:**
- Refund, cancel, or duplicate an order directly from the ticket sidebar
- Apply discount codes to orders without leaving Gorgias
- Create a draft order for a replacement

**Gorgias macros (template responses with dynamic variables):**
- Create macros that pull in order data automatically: `Your order {{order.name}} is currently {{order.fulfillment_status}}`
- Go to **Settings → Macros** to create and manage macros

---

#### WooCommerce

**Gorgias for WooCommerce:**

1. Install the **Gorgias** WooCommerce plugin from WordPress.org or connect via Gorgias integrations
2. Connect your WooCommerce store — Gorgias pulls order history automatically

**Freshdesk for WooCommerce:**
1. Install **Freshdesk Help Desk for WooCommerce** from the WordPress plugin directory
2. The plugin creates Freshdesk tickets from WooCommerce order events
3. Freshdesk agents see customer order details in the ticket sidebar via the integration

**Manual integration with Zendesk:**
1. Install **Zendesk for WooCommerce** from the Zendesk App Marketplace
2. Agents can search for customers by email and see their order history in the ticket sidebar

---

#### BigCommerce

**Gorgias for BigCommerce:**
1. Install **Gorgias** from the BigCommerce App Marketplace
2. Connect your store — same deep integration as Shopify

**Zendesk for BigCommerce:**
1. Install the BigCommerce app from the Zendesk App Marketplace
2. Agents see customer details and order history in the ticket sidebar

---

#### Custom / Headless

Build a Zendesk Sunshine App (sidebar panel) or Intercom Canvas Kit app that injects order context into every ticket:

**Zendesk sidebar app — data endpoint:**

```typescript
// GET /api/support/zendesk-context?email=customer@example.com
export async function getZendeskContext(req: Request, res: Response) {
  const customerEmail = (req.query.email as string)?.toLowerCase();
  if (!customerEmail) return res.json({ customer: null, orders: [] });

  const [customer, recentOrders] = await Promise.all([
    db.customers.findByEmail(customerEmail, { include: ['segmentScore'] }),
    db.orders.findMany({
      where: { customerEmail },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { lineItems: { include: { product: true } }, shipments: true },
    }),
  ]);

  res.json({
    customer: customer ? {
      lifetimeValue: customer.totalSpentCents / 100,
      orderCount: customer.orderCount,
      segment: customer.segmentScore?.segment,
      tags: customer.tags,
    } : null,
    orders: recentOrders.map(o => ({
      number: o.orderNumber,
      status: o.status,
      total: o.totalCents / 100,
      createdAt: o.createdAt,
      trackingUrl: o.shipments[0]?.trackingUrl,
      items: o.lineItems.map(i => ({ name: i.product.name, quantity: i.quantity })),
    })),
  });
}
```

**Route high-value tickets to VIP queue:**

```typescript
// Called when a new Zendesk ticket is created (via Zendesk webhook)
export async function applyTicketRouting(ticketId: string) {
  const ticket = await fetchZendeskTicket(ticketId);
  const customerEmail = ticket.requester?.email?.toLowerCase();
  if (!customerEmail) return;

  const customer = await db.customers.findByEmail(customerEmail, { include: ['segmentScore'] });
  if (!customer) return;

  const isVIP = ['champions', 'cannot_lose_them'].includes(customer.segmentScore?.segment ?? '');
  const isHighValue = customer.totalSpentCents >= 100000;  // $1,000+

  if (isVIP || isHighValue) {
    await fetch(`https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets/${ticketId}.json`, {
      method: 'PUT',
      headers: { Authorization: getZendeskAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket: {
          priority: 'urgent',
          group_id: process.env.ZENDESK_VIP_GROUP_ID,
          tags: [...(ticket.tags ?? []), 'vip-customer'],
        },
      }),
    });
  }
}

// Auto-create ticket on delivery failure
export async function onDeliveryFailed(shipmentId: string) {
  const shipment = await db.shipments.findById(shipmentId, { include: ['order.customer'] });
  await fetch(`https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`, {
    method: 'POST',
    headers: { Authorization: getZendeskAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticket: {
        subject: `Delivery failed — Order #${shipment.order.orderNumber}`,
        comment: { body: `Delivery attempt failed on ${new Date().toDateString()}. Carrier: ${shipment.carrier}. Tracking: ${shipment.trackingNumber}.` },
        requester: { email: shipment.order.customer.email },
        priority: 'high',
        tags: ['delivery-failure', 'auto-created'],
      },
    }),
  });
}
```

---

### Step 3: Set up ticket routing rules for VIP customers

Ensure your most valuable customers get faster responses by routing their tickets to your best agents.

**Gorgias routing rules:**
1. Go to **Automation → Rules → Create Rule**
2. Condition: `Customer → Total spent → is greater than → $500`
3. Actions: `Add tag → vip`, `Assign to → VIP Support Team`, `Set priority → Urgent`

**Zendesk trigger:**
1. Go to **Admin → Business Rules → Triggers → Add trigger**
2. Conditions: ticket tag contains "vip-customer"
3. Actions: assign to group (VIP Support), set priority to Urgent

**Define SLA targets:**
- VIP customers: first response within 1 hour
- Standard customers: first response within 24 hours
- Set these in **Gorgias → Settings → Business hours and SLAs** or **Zendesk → Admin → SLAs**

## Best Practices

- **Use Gorgias for Shopify stores** — it's the purpose-built solution; the time saved on setup and the depth of integration are worth the subscription cost
- **Never store helpdesk API tokens in client-side code** — Zendesk and Intercom API tokens have write access to all tickets; always proxy requests through your server
- **Attach the order ID to every ticket** — this is the key that links your support system to your commerce database and enables two-way sync and automation
- **Keep order context fresh in the sidebar** — cache data for 60 seconds maximum; an agent seeing stale order status is worse than a loading spinner
- **Log every agent action taken on an order** — maintain an audit trail of refunds, order changes, and status updates initiated from within the helpdesk

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Agent sees wrong customer because email lookup is case-sensitive | Normalize all emails to lowercase before lookup; `Jane@example.com` and `jane@example.com` must resolve to the same customer |
| Webhook payload not verified | Implement HMAC signature verification using the Zendesk/Gorgias webhook signing secret before processing any payload |
| CSAT sync creates duplicate customer records | Always look up by email first; never create a new customer record from a support webhook — link to existing or skip |
| Auto-created tickets missing order context | Set the order ID in a custom ticket field at creation time; this enables bidirectional sync and accurate routing |

## Related Skills

- @live-chat-commerce
- @customer-segmentation
- @customer-lifetime-value
