# Push Notification Infrastructure Setup

## Problem/Feature Description

You are a developer at a mid-sized e-commerce company called NorthShore Goods. The marketing team has just approved a new initiative to add browser push notifications to the store. Customers should be able to opt in and receive timely alerts. The engineering team has decided to implement this using the standard Web Push API with a Node.js/TypeScript backend.

Your job is to lay the foundational infrastructure: the server-side push configuration, the browser-side service worker that receives and displays notifications, and the client-side subscription code that registers users. The code should be production-ready — handling edge cases and browser compatibility checks appropriately.

## Output Specification

Produce the following files:

1. `server/push-config.ts` — Server-side configuration code that initializes the push notification library using credentials from environment variables. Include a comment showing the CLI command used to generate the credentials.

2. `public/sw.js` — The service worker file that handles incoming push events and notification click interactions.

3. `client/subscribe.ts` — Client-side TypeScript that registers the service worker, requests notification permission, subscribes the browser to push, and sends the subscription to the server. Include any required helper functions.

4. `README.md` — A brief setup guide explaining the steps to initialize the system (key generation, environment variables, deployment notes), including any important platform limitations developers should be aware of.
