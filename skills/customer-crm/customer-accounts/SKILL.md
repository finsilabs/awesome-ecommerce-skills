---
name: customer-accounts
description: "Let shoppers register, manage their profile, save multiple addresses, and view their full order history using your platform's built-in customer account system"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [customer, accounts, registration, profile, address-book, order-history, authentication]
triggers: ["build customer accounts", "add user registration", "create customer portal", "implement address book"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: beginner
---

# Customer Accounts

## Overview

Customer accounts let shoppers save addresses for faster checkout, view order history, track shipments, and manage their profile. Every major e-commerce platform has this built in — Shopify, WooCommerce, and BigCommerce all provide account registration, login, address books, and order history without any custom development. The main decisions are: whether to make accounts optional or required, and whether to extend the platform's default account pages with additional functionality.

## When to Use This Skill

- When enabling customer registration and login on a new storefront
- When customizing the account dashboard with order history and tracking
- When adding an address book to speed up returning customer checkout
- When converting guest checkout users into registered customers
- When adding wishlist or saved-for-later functionality

## Core Instructions

### Step 1: Determine platform and enable customer accounts

| Platform | Account System | Recommended Extension |
|----------|---------------|----------------------|
| **Shopify** | Native customer accounts (classic or new) | Customer Accounts Concierge or Flits for enhanced account pages |
| **WooCommerce** | My Account page (built-in, customizable) | YITH WooCommerce Wishlist; WooCommerce Memberships for gated content |
| **BigCommerce** | Customer account portal (built-in) | Customer Groups for tiered access; LoyaltyLion for loyalty integration |
| **Custom / Headless** | Build with JWT sessions and bcrypt password hashing | Required for complete control over authentication and account UX |

---

### Step 2: Platform-specific setup

---

#### Shopify

Shopify offers two account experiences: **Classic accounts** and the newer **New customer accounts** (available on all plans).

**Enable accounts and choose the experience:**

1. Go to **Settings → Customer accounts**
2. Choose between:
   - **Classic accounts**: traditional email + password login with customizable account pages via Liquid theme
   - **New customer accounts**: passwordless login via email link; Shopify-hosted pages that Shopify controls (faster to set up, less customizable)
3. Set accounts as **Optional** (recommended) or **Required**

**Classic accounts setup:**

1. Enable **Classic accounts** in Settings → Customer accounts
2. The account page appears at `/account` — your theme controls the layout
3. Customize the account page in **Online Store → Themes → Customize → Customer account pages**
4. Key pages: Login, Register, Account overview, Order detail, Addresses

**Making accounts optional (strongly recommended):**
- Always allow guest checkout — never force registration before purchase
- After checkout, show a "Create account to save your details" prompt
- Shopify handles the "convert guest to account" flow automatically when a customer registers with the same email used for a past order

**Extending account pages:**

For enhanced account functionality (wishlist, loyalty points, social login, recent orders with tracking):
- Install **Flits** from the App Store — comprehensive account page customization
- Or install **Customer Accounts Concierge** — adds wishlist, recently viewed, reorder functionality

---

#### WooCommerce

WooCommerce has a built-in **My Account** page that includes order history, addresses, and profile management.

**Set up My Account:**

1. Go to **WooCommerce → Settings → Accounts & Privacy**
2. Configure:
   - **Guest checkout**: check "Allow customers to place orders without an account"
   - **Account creation**: optionally auto-create accounts during checkout
   - **Account erasure**: enable "Allow customers to request account deletion"
3. The My Account page is created automatically at `/my-account/`

**Customize My Account tabs:**

The default tabs are: Dashboard, Orders, Downloads, Addresses, Account details, Logout. Add or remove tabs:
1. Add custom tabs by using the `woocommerce_account_menu_items` filter in your child theme's functions.php, or install a plugin like **YITH WooCommerce Customize My Account Page**
2. Reorder tabs by modifying the array in the filter

**Address book:**

1. Go to **WooCommerce → Settings → Accounts → Allow customers to store multiple addresses**
2. Customers can add/edit multiple addresses in **My Account → Addresses**
3. WooCommerce pre-fills checkout with the default address automatically

**Wishlist:**
- Install **YITH WooCommerce Wishlist** (free/premium)
- Adds a "Add to Wishlist" button on product pages and a wishlist page in My Account

**Converting guest to registered after purchase:**

WooCommerce shows a "Create account" prompt in order confirmation emails automatically when accounts are enabled but optional.

---

#### BigCommerce

BigCommerce has a built-in customer portal.

**Enable and configure:**

1. Go to **Store Setup → Store Settings → Display → Customer Account Access**
2. Set to "Optional" to allow guest checkout
3. Account pages are managed by your theme — customize in the Stencil theme editor

**Customer groups:**

Use customer groups for tiered access, B2B pricing, or member-only categories:
1. Go to **Customers → Customer Groups → Add Group**
2. Set group-specific pricing, category visibility, or shipping rules
3. Assign customers to groups manually or auto-assign based on purchase history

**Address book:**
- Built-in under the customer account portal
- Customers can save multiple addresses and select them at checkout

---

#### Custom / Headless

For headless storefronts, build a complete account system with secure authentication:

```typescript
// lib/auth.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  acceptsMarketing: z.boolean().default(false),
});

// POST /api/customers/register
export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);

  const existing = await db.customers.findByEmail(input.email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const passwordHash = await bcrypt.hash(input.password, 12);  // Cost factor 12 minimum
  const customer = await db.customers.create({ ...input, email: input.email.toLowerCase(), passwordHash });

  await sendVerificationEmail(customer);
  const token = jwt.sign({ sub: customer.id, type: 'customer' }, process.env.JWT_SECRET!, { expiresIn: '7d' });

  res.status(201).json({ customer: omit(customer, ['passwordHash']), token });
}

// POST /api/customers/login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const customer = await db.customers.findByEmail(email.toLowerCase());

  // Use the same error for both "not found" and "wrong password" to prevent email enumeration
  if (!customer || !customer.passwordHash) return res.status(401).json({ error: 'Invalid email or password' });
  if (customer.status === 'disabled') return res.status(403).json({ error: 'This account has been disabled' });

  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ sub: customer.id, type: 'customer' }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.json({ customer: omit(customer, ['passwordHash']), token });
}

// Address book CRUD — GET /api/customers/me/addresses
export async function listAddresses(req: AuthRequest, res: Response) {
  const addresses = await db.customerAddresses.findMany({ where: { customerId: req.customerId } });
  res.json({ addresses });
}

// POST /api/customers/me/addresses
export async function addAddress(req: AuthRequest, res: Response) {
  const existing = await db.customerAddresses.findMany({ where: { customerId: req.customerId } });
  const input = { ...addressSchema.parse(req.body), customerId: req.customerId };

  if (input.isDefault || existing.length === 0) {
    await db.customerAddresses.updateMany({ where: { customerId: req.customerId }, data: { isDefault: false } });
    input.isDefault = true;
  }

  const address = await db.customerAddresses.create({ data: input });
  res.status(201).json({ address });
}

// GET /api/customers/me/orders — paginated order history with tracking
export async function listOrders(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  const [orders, total] = await Promise.all([
    db.orders.findMany({ where: { customerId: req.customerId }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { lineItems: true, shipments: true } }),
    db.orders.count({ where: { customerId: req.customerId } }),
  ]);

  res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
```

---

### Step 3: Configure post-checkout account creation

The highest-converting moment to ask for account creation is immediately after a successful first purchase, not before.

**Shopify:** The order confirmation page includes a "Create account" button automatically when customer accounts are enabled but optional. Customize the message in **Online Store → Themes → Customize → Order status page**.

**WooCommerce:** Customize the "Thank you" page message in **WooCommerce → Settings → Accounts** or use the **Checkout Field Editor** plugin to add a post-checkout account creation prompt.

**What to say:** "Save your details for faster checkout next time" is more compelling than "Create an account" — focus on the benefit, not the action.

## Best Practices

- **Always make accounts optional** — never force registration before purchase; post-purchase conversion rates are much higher than pre-purchase
- **Offer social login** where possible (Google, Facebook) — reduces friction significantly for mobile users; use apps like **Single Sign-On (SSO)** for Shopify or **WooCommerce Social Login** for WooCommerce
- **Auto-populate checkout from saved addresses** — the primary value of accounts is faster checkout; ensure the default address pre-fills automatically
- **Send a re-engagement email 24 hours after checkout** to guest buyers inviting them to create an account — timing matters
- **Enable GDPR/CCPA account deletion** — every platform supports this; make sure the "delete my account" option is easy to find; see your platform's documentation for the data erasure workflow

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customers can't see past orders after creating an account | On Shopify, past orders from guest checkout are linked when the customer registers with the same email; verify the account linking is enabled in Settings → Customer accounts |
| Address validation fails for international customers | Don't mark state/province as required — many countries don't have them; WooCommerce handles this with country-dependent field visibility |
| JWT tokens too long-lived | Use 15-minute access tokens with refresh tokens for better security, or use server-side sessions with a secure, HttpOnly cookie |
| No way to merge duplicate customer records | Shopify and WooCommerce both support customer merge in the admin; for custom builds, build a merge tool that consolidates orders and addresses |

## Related Skills

- @customer-segmentation
- @customer-lifetime-value
- @personalization-engine
