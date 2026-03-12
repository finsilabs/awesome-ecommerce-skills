# Push Notification Opt-In Flow and Flash Sale Broadcast

## Problem/Feature Description

NorthShore Goods has the core push infrastructure running but is seeing very low opt-in rates from visitors. The product team believes the permission dialog is being shown too aggressively. Additionally, the marketing team wants to send a flash sale notification to all subscribers during a one-day sale event — but needs the delivery window to respect the sale's end time so customers don't receive a stale "sale is on" notification after it has ended.

Your task is to write two pieces of JavaScript/TypeScript:

1. A smart opt-in manager that decides *when* to show the browser push permission dialog. The team wants to avoid asking cold visitors and instead wait until customers have shown real engagement with the store. User preferences (whether they've subscribed or dismissed the prompt) must survive page refreshes.

2. A server-side broadcast function that sends a flash sale notification to all subscribers, cleans up any expired subscriptions discovered during the send, and ensures the notification is not delivered after the sale has ended.

## Output Specification

Produce the following files:

1. `client/push-optin.ts` — Client-side TypeScript implementing the smart opt-in prompt. The function should track engagement state and only ask the user for permission at the right moment. It should also avoid showing the dialog again to users who have already subscribed or dismissed it.

2. `server/broadcast-flash-sale.ts` — Server-side TypeScript function `broadcastFlashSale(saleDetails)` that sends a flash sale push to all subscribers, with appropriate expiry handling. The function should accept at minimum: `title`, `discountPct`, `endsAt` (Date), and `url`.

3. `DESIGN.md` — A brief document explaining the opt-in strategy chosen and any important constraints or best practices that guided the implementation decisions (e.g., sending frequency limits, notification body length, etc.).
