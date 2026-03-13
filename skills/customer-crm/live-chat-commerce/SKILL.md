---
name: live-chat-commerce
description: "Add real-time chat to your storefront so agents can share product links, assist with cart questions, and close sales in the conversation"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [live-chat, websocket, customer-support, product-sharing, cart-assistance, agent-tools, real-time, commerce-chat]
triggers: ["live chat", "live chat commerce", "chat product recommendations", "agent product sharing", "chat support integration", "real-time chat ecommerce"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Live Chat Commerce

## Overview

Live chat for e-commerce goes beyond basic support — agents can actively assist customers in finding products, adding items to their cart, and applying discount codes, reducing purchase hesitation and increasing conversion rate. This skill covers building a WebSocket-based chat system, implementing product card sharing from agent to customer, exposing cart state to agents, and integrating automated chatbot responses for common queries like order status.

## When to Use This Skill

- When building a custom live chat system instead of embedding a third-party widget
- When agents need to see a customer's current cart contents during a chat session
- When implementing "co-browsing" features where agents can suggest products mid-conversation
- When automating order-status replies so agents handle only complex issues
- When measuring chat-to-conversion rate and revenue attributed to live chat
- When a third-party chat widget does not support the custom commerce actions your agents need

## Core Instructions

1. **Set up the WebSocket server for real-time chat**

   ```typescript
   import { WebSocketServer, WebSocket } from 'ws';
   import { IncomingMessage } from 'http';
   import { parse as parseCookie } from 'cookie';

   interface ChatClient {
     ws: WebSocket;
     type: 'customer' | 'agent';
     sessionId: string;
     customerId?: string;
     conversationId?: string;
   }

   const clients = new Map<string, ChatClient>();  // key: socketId
   const conversations = new Map<string, string[]>(); // conversationId -> [socketId]

   const wss = new WebSocketServer({ noServer: true });

   wss.on('connection', async (ws: WebSocket, req: IncomingMessage, context: { type: 'customer' | 'agent'; sessionId: string }) => {
     const socketId = generateId();
     clients.set(socketId, { ws, ...context });

     ws.on('message', (data) => handleMessage(socketId, JSON.parse(data.toString())));
     ws.on('close', () => handleDisconnect(socketId));

     // Send conversation history on connect
     if (context.conversationId) {
       const history = await db.chatMessages.findByConversation(context.conversationId, { limit: 50 });
       ws.send(JSON.stringify({ type: 'history', messages: history }));
     }
   });
   ```

2. **Implement product card sharing from agent to customer**

   Agents can search the product catalog and push a product card directly into the customer's chat window:

   ```typescript
   // Message types
   type ChatMessage =
     | { type: 'text'; body: string }
     | { type: 'product_card'; productId: string }
     | { type: 'cart_action'; action: 'add_to_cart'; productId: string; variantId: string }
     | { type: 'discount_apply'; code: string }
     | { type: 'order_status'; orderId: string };

   async function handleMessage(socketId: string, message: ChatMessage & { conversationId: string }) {
     const sender = clients.get(socketId)!;

     // Persist message
     const savedMsg = await db.chatMessages.create({
       conversationId: message.conversationId,
       senderType: sender.type,
       senderId: sender.customerId ?? sender.sessionId,
       type: message.type,
       payload: message,
       createdAt: new Date(),
     });

     // Broadcast to all participants in the conversation
     const recipients = conversations.get(message.conversationId) ?? [];
     for (const recipientSocketId of recipients) {
       const recipient = clients.get(recipientSocketId);
       if (recipient && recipient.ws.readyState === WebSocket.OPEN) {
         recipient.ws.send(JSON.stringify({ ...savedMsg, isSelf: recipientSocketId === socketId }));
       }
     }

     // Handle commerce actions server-side
     if (message.type === 'cart_action' && message.action === 'add_to_cart') {
       await handleAgentAddToCart(sender.conversationId!, message.productId, message.variantId);
     }
   }
   ```

3. **Expose customer cart state to the agent interface**

   ```typescript
   // GET /api/chat/agent/conversation/:id/context
   export async function getConversationContext(req: Request, res: Response) {
     const { id: conversationId } = req.params;
     const conversation = await db.chatConversations.findById(conversationId, { include: ['customer'] });

     const [cart, recentOrders, browsing] = await Promise.all([
       db.carts.findActiveByCustomer(conversation.customerId, { include: ['items.product.images'] }),
       db.orders.findManyByCustomer(conversation.customerId, { limit: 3, orderBy: { createdAt: 'desc' } }),
       db.browsingHistory.findRecentByCustomer(conversation.customerId, { limit: 5 }),
     ]);

     res.json({
       customer: {
         name: conversation.customer.firstName,
         lifetimeValue: conversation.customer.lifetimeSpendCents / 100,
         segment: conversation.customer.segmentScore?.segment,
       },
       cart: {
         itemCount: cart?.items.length ?? 0,
         totalValue: cart ? cart.items.reduce((sum, i) => sum + i.priceInCents * i.quantity, 0) / 100 : 0,
         items: cart?.items ?? [],
       },
       recentOrders,
       recentlyBrowsed: browsing,
     });
   }
   ```

4. **Auto-respond to order status queries with a bot**

   ```typescript
   async function handleBotAutoResponse(conversationId: string, message: string): Promise<boolean> {
     const orderNumberMatch = message.match(/#?(\d{5,})/);

     if (orderNumberMatch || /order status|where.*order|track.*order/i.test(message)) {
       const conversation = await db.chatConversations.findById(conversationId, { include: ['customer'] });
       const orderId = orderNumberMatch?.[1];

       const order = orderId
         ? await db.orders.findByNumber(orderId, { where: { customerId: conversation.customerId } })
         : await db.orders.findLatestByCustomer(conversation.customerId);

       if (order) {
         const statusMessage = `Your order #${order.number} is currently **${order.status}**.${
           order.shipments[0]?.trackingUrl ? ` [Track your package](${order.shipments[0].trackingUrl})` : ''
         }`;

         await db.chatMessages.create({
           conversationId,
           senderType: 'bot',
           senderId: 'order-status-bot',
           type: 'text',
           payload: { type: 'text', body: statusMessage },
           createdAt: new Date(),
         });

         broadcastToConversation(conversationId, { type: 'bot_message', body: statusMessage });
         return true; // Message was handled by bot
       }
     }

     return false; // Route to human agent
   }
   ```

5. **Track chat-to-conversion attribution**

   ```typescript
   async function onOrderPlaced(orderId: string, sessionId: string) {
     // Check if the customer had a chat conversation in the 24h before ordering
     const recentConversation = await db.chatConversations.findRecentBySession(sessionId, {
       withinHours: 24,
       status: 'closed',
     });

     if (recentConversation) {
       await db.orderAttribution.create({
         orderId,
         source: 'live_chat',
         conversationId: recentConversation.id,
         agentId: recentConversation.assignedAgentId,
       });

       // Give agent credit for the sale
       await db.agentStats.increment(recentConversation.assignedAgentId, 'attributedSales');
     }
   }
   ```

## Examples

### Agent product search endpoint for the chat UI

```typescript
// GET /api/chat/agent/products/search?q=running+shoes
export async function searchProductsForAgent(req: Request, res: Response) {
  const { q, limit = 8 } = req.query;

  const products = await db.products.search({
    query: q as string,
    where: { status: 'active' },
    limit: Number(limit),
    fields: ['id', 'name', 'priceInCents', 'images', 'slug', 'inventory'],
  });

  res.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.priceInCents / 100,
      image: p.images[0]?.url,
      url: `${process.env.STORE_URL}/products/${p.slug}`,
      inStock: p.inventory > 0,
    }))
  );
}
```

### Customer-side product card renderer

```tsx
// Renders a product card inside the chat window when agent shares one
function ProductCard({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch(`/api/products/${productId}?fields=name,price,images,slug,inStock`)
      .then((r) => r.json())
      .then(setProduct);
  }, [productId]);

  if (!product) return <div className="chat-product-skeleton" />;

  return (
    <div className="chat-product-card">
      <img src={product.images[0]?.url} alt={product.name} />
      <div>
        <strong>{product.name}</strong>
        <p>${(product.priceInCents / 100).toFixed(2)}</p>
        <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer">View Product</a>
        <button onClick={() => addToCart(product.id)}>Add to Cart</button>
      </div>
    </div>
  );
}
```

## Best Practices

- **Show a typing indicator** — send a `typing` WebSocket event when the agent starts composing; this reduces perceived wait time
- **Cap concurrent conversations per agent** — set a maximum of 3–4 simultaneous chats per agent; beyond that, response quality degrades
- **Persist all messages to the database** — lost WebSocket connections should not lose conversation history; rebuild state from the database on reconnect
- **Rate-limit incoming WebSocket messages** — prevent message flooding by limiting each client to 20 messages per minute
- **Add connection heartbeats** — send a `ping` frame every 30 seconds to detect stale connections and reconnect customers automatically
- **Use HTTPS and WSS** — always use `wss://` for WebSocket in production; `ws://` sends messages in plaintext
- **Track agent first-response time** — the primary SLA metric for live chat is the time to first agent reply; alert when it exceeds your target

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Messages delivered out of order | Include a monotonic sequence number in each message and sort by it on the client; network jitter causes out-of-order delivery |
| Chat window breaks on page navigation | Use a persistent floating widget that survives page transitions; store the WebSocket connection in a global context or service worker |
| Agent sees stale cart data | Fetch cart context on each message from the customer, not once at conversation start; carts change during the conversation |
| WebSocket connection dropped on load balancer timeout | Configure your load balancer's idle connection timeout to at least 90 seconds; send WebSocket pings every 30 seconds |
| Product cards not clickable on mobile | Ensure product card links use `target="_blank"` and the tap target is at least 44×44px per WCAG guidelines |

## Related Skills

- @customer-support-integration
- @personalization-engine
- @cart-abandonment-recovery
- @customer-segmentation
- @user-generated-content
