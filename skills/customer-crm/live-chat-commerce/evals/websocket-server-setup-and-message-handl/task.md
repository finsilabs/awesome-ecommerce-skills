# Build the Core Chat Server for ShopStream Live

## Problem/Feature Description

ShopStream is launching a live commerce platform that lets support agents chat with customers in real time while they're shopping. The engineering team has been tasked with building the core WebSocket server component that will power this system. The server needs to handle both customer and agent connections simultaneously, maintain conversation state across multiple participants, and reliably deliver messages even when connections are unstable or clients briefly disconnect.

The server must support multiple message types — plain text, product card shares, cart actions, discount codes, and order status — and ensure that messages are broadcast correctly to all participants in a conversation. The system will eventually be deployed on a load-balanced cloud platform where idle connections may be dropped, so the implementation needs built-in resilience against those scenarios.

## Output Specification

Implement the WebSocket server in TypeScript. Write a complete implementation file at `src/chat-server.ts` that includes:

- All necessary type definitions for clients, conversations, and message types
- WebSocket server initialization and connection handling
- Message persistence and broadcast logic
- Resilience features (rate limiting, connection health checks)
- Order-sequence handling to cope with out-of-order delivery

Also produce a short `design-notes.md` file documenting the key design decisions you made, including how you handle connection drops, message ordering, and abuse prevention.

You may use Node.js, TypeScript, and any npm packages you consider appropriate. You do not need to connect to a real database — use stub/mock function calls (e.g. `db.chatMessages.create(...)`) as placeholders where database access would occur.
