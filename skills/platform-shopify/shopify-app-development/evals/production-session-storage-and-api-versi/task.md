# Migrate Shopify App to Multi-Instance Production Configuration

## Problem/Feature Description

The engineering team at a growing e-commerce agency has built a Shopify app that currently works fine on a single developer machine, but they're preparing to launch it publicly on the Shopify App Store. During load testing they discovered that when they scaled their hosting to multiple instances, merchants were getting logged out randomly — their sessions were not persisting across instances.

The current app was prototyped quickly using the default development configuration. Now the team needs to harden the server-side configuration for production: persistent cross-instance session storage, a stable API version that won't silently change on them, and a proper root layout that initializes Shopify's UI framework correctly so merchants don't encounter broken interfaces.

Your job is to write the production-ready server configuration file (`app/shopify.server.ts`) and the Remix root layout file (`app/root.tsx`) that addresses these concerns. Also provide a short `DEPLOYMENT_NOTES.md` explaining what changed from the development setup and why, specifically addressing each production concern.

## Output Specification

Produce the following files:

- `app/shopify.server.ts` — the Shopify server configuration module with production-ready session storage and API version settings
- `app/root.tsx` — the Remix root layout component properly initialized for use in the Shopify Admin
- `DEPLOYMENT_NOTES.md` — a brief document explaining the production changes made and why the development defaults are not suitable for multi-instance hosting

## Input Files

The following files represent the current development-only configuration. Extract them before beginning.

=============== FILE: app/shopify.server.ts.dev ===============
import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix/server";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new SQLiteSessionStorage("sessions.db"),
  distribution: AppDistribution.AppStore,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
=============== END FILE ===============

=============== FILE: app/root.tsx.dev ===============
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
=============== END FILE ===============
