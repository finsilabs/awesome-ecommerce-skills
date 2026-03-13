---
name: live-chat-commerce
description: "Add real-time chat to your storefront using a platform-native app so agents can share product links, assist with cart questions, and close sales"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [live-chat, websocket, customer-support, product-sharing, cart-assistance, agent-tools, real-time, commerce-chat]
triggers: ["live chat", "live chat commerce", "chat product recommendations", "agent product sharing", "chat support integration", "real-time chat ecommerce"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Live Chat Commerce

## Overview

Live chat for e-commerce goes beyond basic support — agents can assist customers in finding products, adding items to their cart, and applying discount codes, directly reducing purchase hesitation. Shopify Inbox (free), Tidio, and Gorgias Chat provide this out of the box with commerce-specific features like cart visibility, product card sharing, and order status bot responses. Only build a custom chat system if your commerce-specific requirements (custom cart manipulation, proprietary bot logic, white-labeled experience) exceed what these tools offer.

## When to Use This Skill

- When adding live chat to a storefront to reduce pre-purchase questions and increase conversion
- When agents need to see a customer's current cart contents during a chat session
- When implementing automated order-status responses so agents handle only complex issues
- When measuring chat-to-conversion rate and revenue attributed to live chat
- When a third-party chat widget needs deeper commerce actions than it supports natively

## Core Instructions

### Step 1: Determine platform and choose the right chat tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Shopify Inbox (free) | Native Shopify tool; shows customer's cart, recent orders, and lets agents send product links with prices |
| **Shopify** | Tidio | More advanced AI bot, integrations, and analytics than Inbox; supports product card sharing |
| **Shopify** | Gorgias Chat | Best for teams already using Gorgias for support ticketing; unified inbox |
| **WooCommerce** | Tidio or LiveChat | Both have WooCommerce plugins; show order history and cart contents to agents |
| **BigCommerce** | Tidio or LiveChat | Available from BigCommerce App Marketplace |
| **Custom / Headless** | Build with WebSocket server | Required when none of the above provide sufficient commerce API access |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Option A: Shopify Inbox (free, recommended starting point)**

1. Go to **Admin → Inbox → Turn on Shopify Inbox**
2. Shopify Inbox installs a chat widget on your storefront automatically
3. Agents access conversations at `inbox.shopify.com` or via the Shopify mobile app

**What agents see in every conversation:**
- Customer's name and email if logged in
- Active cart contents with product images and prices
- Recent order history and fulfillment status

**Commerce features:**
- Agents can search and share product links directly from the chat interface
- The customer sees a product card with image, price, and "Add to Cart" button
- Agents can apply discount codes to the customer's cart

**Setting up automated responses:**
1. Go to **Inbox → Manage → Instant answers**
2. Add answers to common questions: shipping, returns, sizing
3. Enable the AI-powered summary and suggested replies (available in newer Inbox versions)

**For order status bot:**
1. Go to **Inbox → Manage → Automated messages**
2. Create an automated response for conversations containing keywords like "order status", "where is my order", "tracking"
3. Include a link to `/account/orders` for registered customers

**Setting availability hours:**
1. Go to **Inbox → Manage → Away messages**
2. Set business hours and configure an away message shown outside those hours

---

#### WooCommerce

**Tidio for WooCommerce (recommended):**

1. Install **Tidio Live Chat** from the WordPress plugin directory
2. After activation, configure in **WooCommerce → Tidio**
3. Tidio automatically shows agents:
   - Current cart contents
   - Order history
   - Customer lifetime value

**Commerce features in Tidio:**
- Agents can view and share products from the chat interface
- Product recommendation cards sent by agents include image, price, and add-to-cart link
- Automated bot flows for order status lookup (Tidio integrates with WooCommerce orders)

**Setting up order status bot:**
1. In Tidio, go to **Automation → Create Automation**
2. Trigger: visitor sends a message containing "order" or "tracking"
3. Action: show a form asking for order number → look up via Tidio's WooCommerce integration → reply with status

**LiveChat for WooCommerce:**
1. Install **LiveChat** from WordPress.org
2. LiveChat's WooCommerce integration shows order data in the agent dashboard under "Customer Details"
3. Agents can see cart abandonment in real time and proactively engage

---

#### BigCommerce

**Tidio from the App Marketplace:**

1. Go to **Apps → Search "Tidio"** and install
2. Configuration is the same as the WooCommerce setup above
3. Tidio connects to BigCommerce orders automatically

**LiveChat for BigCommerce:**
1. Install from the BigCommerce App Marketplace
2. Agents see order history and cart contents per conversation

---

#### Custom / Headless

For headless storefronts needing custom commerce chat actions:

```typescript
// WebSocket server for real-time chat
import { WebSocketServer, WebSocket } from 'ws';

interface ChatClient {
  ws: WebSocket;
  type: 'customer' | 'agent';
  sessionId: string;
  customerId?: string;
  conversationId?: string;
}

const clients = new Map<string, ChatClient>();
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (ws, req, context: { type: 'customer' | 'agent'; sessionId: string }) => {
  const socketId = crypto.randomUUID();
  clients.set(socketId, { ws, ...context });

  ws.on('message', data => handleMessage(socketId, JSON.parse(data.toString())));
  ws.on('close', () => clients.delete(socketId));

  // Send recent history on connect
  if (context.conversationId) {
    const history = await db.chatMessages.findMany({ where: { conversationId: context.conversationId }, take: 50, orderBy: { createdAt: 'asc' } });
    ws.send(JSON.stringify({ type: 'history', messages: history }));
  }
});

// Expose cart state to agents — fetch on each message to stay current
export async function getConversationContext(conversationId: string) {
  const conversation = await db.chatConversations.findUnique({ where: { id: conversationId }, include: { customer: true } });
  const [cart, recentOrders] = await Promise.all([
    db.carts.findFirst({ where: { customerId: conversation.customerId, status: 'active' }, include: { items: { include: { product: true } } } }),
    db.orders.findMany({ where: { customerId: conversation.customerId }, orderBy: { createdAt: 'desc' }, take: 3 }),
  ]);

  return {
    customer: { name: conversation.customer?.firstName, segment: conversation.customer?.segment, lifetimeValue: conversation.customer?.totalSpentCents / 100 },
    cart: { items: cart?.items ?? [], totalValue: cart?.items.reduce((sum, i) => sum + i.priceInCents * i.quantity, 0) / 100 ?? 0 },
    recentOrders,
  };
}

// Auto-respond to order status queries
async function handleOrderStatusQuery(conversationId: string, message: string, customerId?: string): Promise<boolean> {
  const orderNumberMatch = message.match(/#?(\d{5,})/);
  if (!orderNumberMatch && !/order|track/i.test(message)) return false;

  const order = orderNumberMatch
    ? await db.orders.findFirst({ where: { orderNumber: orderNumberMatch[1], customerId } })
    : customerId ? await db.orders.findFirst({ where: { customerId }, orderBy: { createdAt: 'desc' } }) : null;

  if (!order) return false;

  const statusMsg = `Your order #${order.orderNumber} is **${order.status}**.${order.shipments[0]?.trackingUrl ? ` [Track package](${order.shipments[0].trackingUrl})` : ''}`;
  await db.chatMessages.create({ data: { conversationId, senderType: 'bot', type: 'text', payload: { body: statusMsg } } });
  broadcastToConversation(conversationId, { type: 'bot_message', body: statusMsg });
  return true;
}
```

---

### Step 3: Configure proactive chat triggers

Proactive chat triggers engage visitors at key moments before they leave — increasing conversion on high-intent pages.

**Shopify Inbox:** Go to **Inbox → Manage → Proactive chat** and set triggers based on time on page or cart value.

**Tidio:** Go to **Automation → Triggers** and create rules like:
- "Visitor has been on the checkout page for 3 minutes" → send "Need help completing your order?"
- "Cart value exceeds $150" → send "You qualify for free shipping — let us know if you have any questions"
- "Exit intent detected" → send a chat message before they leave

**Rule of thumb for proactive triggers:**
- Target high-intent pages: checkout, product pages with high-value items
- Don't trigger on every page — it's intrusive
- Trigger after 45+ seconds on page (shows intent) not immediately

---

### Step 4: Measure chat impact

Track these metrics monthly to evaluate chat ROI:

| Metric | How to Measure |
|--------|---------------|
| Chat-to-conversion rate | Orders where a chat occurred in the previous 24 hours / total conversations |
| Average response time | Reported in Tidio, Gorgias, or Inbox dashboards |
| Revenue attributed to chat | Tag orders with `source: live_chat` using UTM parameters or your platform's order tagging |
| CSAT score | Enable post-chat satisfaction surveys in your chat tool settings |

## Best Practices

- **Start with Shopify Inbox or Tidio before building anything custom** — these tools handle 95% of live chat needs with no engineering work
- **Show a typing indicator** — most platforms do this automatically; it significantly reduces perceived wait time
- **Cap concurrent conversations per agent** — 3–4 simultaneous chats is the maximum for quality responses; Gorgias and Tidio let you set this limit
- **Inform customers that chat conversations are recorded** — for EU customers, ensure consent is in place and provide the ability to export/delete chat transcripts per GDPR
- **Persist all messages to the database** — a WebSocket disconnect should not lose conversation history; rebuild state from the DB on reconnect (custom builds)

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Chat widget breaks on page navigation | Use a floating persistent widget; single-page app routing should not re-initialize the chat; Tidio and Gorgias handle this correctly |
| Agent sees stale cart data | Refetch cart context on each message from the customer, not once at conversation start — carts change during the conversation |
| Proactive chat triggers fire on every page | Limit triggers to 2–3 high-intent pages with a per-session cap (fire at most once per session) |
| Chat transcript emailed with sensitive order data | Review what's included in transcript emails; remove payment details, partial card numbers, and internal notes before the email sends |

## Related Skills

- @customer-support-integration
- @personalization-engine
- @customer-segmentation
