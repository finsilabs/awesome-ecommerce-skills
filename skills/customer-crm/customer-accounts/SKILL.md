---
name: customer-accounts
description: "Let shoppers register, manage their profile, save multiple addresses, and view their full order history in a personal account portal"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [customer, accounts, registration, profile, address-book, order-history, authentication]
triggers: ["build customer accounts", "add user registration", "create customer portal", "implement address book"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: beginner
---

# Customer Accounts

## Overview

Implement customer account management for e-commerce including registration, login, profile editing, address book CRUD, saved payment methods, order history with tracking, and wishlist functionality. This skill covers the data model, API endpoints, session management patterns, and UX considerations for both guest-to-registered conversion and returning customer experiences.

## When to Use This Skill

- When adding user registration and login to a storefront
- When building an account dashboard with order history
- When implementing an address book for faster checkout
- When converting guest checkout users into registered customers
- When adding wishlist or saved-for-later functionality

## Core Instructions

1. **Design the customer data model**

   ```sql
   CREATE TABLE customers (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email           VARCHAR(255) UNIQUE NOT NULL,
     password_hash   VARCHAR(255),          -- null for social/magic-link auth
     first_name      VARCHAR(100),
     last_name       VARCHAR(100),
     phone           VARCHAR(20),
     accepts_marketing BOOLEAN DEFAULT false,
     email_verified  BOOLEAN DEFAULT false,
     status          VARCHAR(20) DEFAULT 'active'
                     CHECK (status IN ('active', 'disabled', 'invited')),
     tags            TEXT[] DEFAULT '{}',
     note            TEXT,
     total_orders    INTEGER DEFAULT 0,
     total_spent     NUMERIC(12,2) DEFAULT 0,
     last_order_at   TIMESTAMPTZ,
     created_at      TIMESTAMPTZ DEFAULT now(),
     updated_at      TIMESTAMPTZ DEFAULT now()
   );

   CREATE TABLE customer_addresses (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
     first_name      VARCHAR(100) NOT NULL,
     last_name       VARCHAR(100) NOT NULL,
     company         VARCHAR(255),
     street1         VARCHAR(255) NOT NULL,
     street2         VARCHAR(255),
     city            VARCHAR(100) NOT NULL,
     state           VARCHAR(100),
     postal_code     VARCHAR(20) NOT NULL,
     country         VARCHAR(2) NOT NULL,    -- ISO 3166-1 alpha-2
     phone           VARCHAR(20),
     is_default      BOOLEAN DEFAULT false,
     label           VARCHAR(50),            -- "Home", "Work", etc.
     created_at      TIMESTAMPTZ DEFAULT now()
   );

   CREATE INDEX idx_addresses_customer ON customer_addresses(customer_id);
   ```

2. **Implement registration with password hashing**

   ```typescript
   import bcrypt from 'bcrypt';
   import { z } from 'zod';

   const registerSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8).max(128),
     firstName: z.string().min(1).max(100),
     lastName: z.string().min(1).max(100),
     acceptsMarketing: z.boolean().optional().default(false),
   });

   // POST /api/customers/register
   async function register(req: Request, res: Response) {
     const input = registerSchema.parse(req.body);

     // Check for existing account
     const existing = await db.customers.findByEmail(input.email.toLowerCase());
     if (existing) {
       return res.status(409).json({ error: 'An account with this email already exists' });
     }

     // Hash password with bcrypt (cost factor 12)
     const passwordHash = await bcrypt.hash(input.password, 12);

     const customer = await db.customers.create({
       email: input.email.toLowerCase(),
       passwordHash,
       firstName: input.firstName,
       lastName: input.lastName,
       acceptsMarketing: input.acceptsMarketing,
       status: 'active',
     });

     // Send verification email
     await sendVerificationEmail(customer);

     // Create session
     const session = await createSession(customer.id);

     res.status(201).json({
       customer: sanitizeCustomer(customer),
       token: session.token,
     });
   }
   ```

3. **Build the login and session management flow**

   ```typescript
   // POST /api/customers/login
   async function login(req: Request, res: Response) {
     const { email, password } = req.body;

     const customer = await db.customers.findByEmail(email.toLowerCase());
     if (!customer || !customer.passwordHash) {
       // Use the same error for both cases to prevent email enumeration
       return res.status(401).json({ error: 'Invalid email or password' });
     }

     if (customer.status === 'disabled') {
       return res.status(403).json({ error: 'This account has been disabled' });
     }

     const valid = await bcrypt.compare(password, customer.passwordHash);
     if (!valid) {
       return res.status(401).json({ error: 'Invalid email or password' });
     }

     const session = await createSession(customer.id);

     res.json({
       customer: sanitizeCustomer(customer),
       token: session.token,
     });
   }

   // Strip sensitive fields before returning customer data
   function sanitizeCustomer(customer: Customer) {
     const { passwordHash, ...safe } = customer;
     return safe;
   }

   // JWT-based session creation
   import jwt from 'jsonwebtoken';

   async function createSession(customerId: string) {
     const token = jwt.sign(
       { sub: customerId, type: 'customer' },
       process.env.JWT_SECRET,
       { expiresIn: '7d' }
     );
     return { token };
   }
   ```

4. **Implement the address book CRUD**

   ```typescript
   // GET /api/customers/me/addresses
   async function listAddresses(req: AuthRequest, res: Response) {
     const addresses = await db.customerAddresses.findByCustomer(req.customerId);
     res.json({ addresses });
   }

   // POST /api/customers/me/addresses
   async function addAddress(req: AuthRequest, res: Response) {
     const input = addressSchema.parse(req.body);

     // If this is the first address or marked as default, update defaults
     const existing = await db.customerAddresses.findByCustomer(req.customerId);

     if (input.isDefault || existing.length === 0) {
       // Unset any existing default
       await db.customerAddresses.clearDefaults(req.customerId);
       input.isDefault = true;
     }

     const address = await db.customerAddresses.create({
       customerId: req.customerId,
       ...input,
     });

     res.status(201).json({ address });
   }

   // PUT /api/customers/me/addresses/:id
   async function updateAddress(req: AuthRequest, res: Response) {
     const address = await db.customerAddresses.findById(req.params.id);

     // Ensure the address belongs to this customer
     if (!address || address.customerId !== req.customerId) {
       return res.status(404).json({ error: 'Address not found' });
     }

     const input = addressSchema.partial().parse(req.body);

     if (input.isDefault) {
       await db.customerAddresses.clearDefaults(req.customerId);
     }

     const updated = await db.customerAddresses.update(req.params.id, input);
     res.json({ address: updated });
   }

   // DELETE /api/customers/me/addresses/:id
   async function deleteAddress(req: AuthRequest, res: Response) {
     const address = await db.customerAddresses.findById(req.params.id);

     if (!address || address.customerId !== req.customerId) {
       return res.status(404).json({ error: 'Address not found' });
     }

     await db.customerAddresses.delete(req.params.id);

     // If we deleted the default, make the first remaining address the default
     if (address.isDefault) {
       const remaining = await db.customerAddresses.findByCustomer(req.customerId);
       if (remaining.length > 0) {
         await db.customerAddresses.update(remaining[0].id, { isDefault: true });
       }
     }

     res.status(204).end();
   }
   ```

5. **Build the order history endpoint**

   ```typescript
   // GET /api/customers/me/orders?page=1&limit=10
   async function listOrders(req: AuthRequest, res: Response) {
     const page = parseInt(req.query.page as string) || 1;
     const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
     const offset = (page - 1) * limit;

     const [orders, totalCount] = await Promise.all([
       db.orders.findByCustomer(req.customerId, { limit, offset }),
       db.orders.countByCustomer(req.customerId),
     ]);

     // Enrich with tracking info
     const enrichedOrders = await Promise.all(
       orders.map(async (order) => ({
         ...order,
         lineItems: await db.orderLineItems.findByOrder(order.id),
         tracking: await db.shipments.findByOrder(order.id),
       }))
     );

     res.json({
       orders: enrichedOrders,
       pagination: {
         page,
         limit,
         totalCount,
         totalPages: Math.ceil(totalCount / limit),
       },
     });
   }

   // GET /api/customers/me/orders/:id
   async function getOrder(req: AuthRequest, res: Response) {
     const order = await db.orders.findById(req.params.id);

     if (!order || order.customerId !== req.customerId) {
       return res.status(404).json({ error: 'Order not found' });
     }

     const [lineItems, shipments, discounts] = await Promise.all([
       db.orderLineItems.findByOrder(order.id),
       db.shipments.findByOrder(order.id),
       db.orderDiscounts.findByOrder(order.id),
     ]);

     res.json({
       order: { ...order, lineItems, shipments, discounts },
     });
   }
   ```

6. **Convert guest checkout to registered account**

   ```typescript
   // POST /api/customers/create-from-order
   async function convertGuestToCustomer(req: Request, res: Response) {
     const { orderId, password } = req.body;

     const order = await db.orders.findById(orderId);
     if (!order || !order.email) {
       return res.status(404).json({ error: 'Order not found' });
     }

     // Check if an account already exists
     const existing = await db.customers.findByEmail(order.email);
     if (existing) {
       return res.status(409).json({
         error: 'An account already exists with this email. Please log in.',
       });
     }

     const passwordHash = await bcrypt.hash(password, 12);

     const customer = await db.customers.create({
       email: order.email,
       passwordHash,
       firstName: order.shippingAddress.firstName,
       lastName: order.shippingAddress.lastName,
       phone: order.phone,
       totalOrders: 1,
       totalSpent: order.totalPrice,
       lastOrderAt: order.createdAt,
     });

     // Associate the order with the new customer
     await db.orders.update(orderId, { customerId: customer.id });

     // Copy shipping address to address book
     await db.customerAddresses.create({
       customerId: customer.id,
       ...order.shippingAddress,
       isDefault: true,
     });

     const session = await createSession(customer.id);

     res.status(201).json({
       customer: sanitizeCustomer(customer),
       token: session.token,
     });
   }
   ```

## Examples

### Password reset flow

```typescript
import crypto from 'crypto';

// POST /api/customers/forgot-password
async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  const customer = await db.customers.findByEmail(email.toLowerCase());

  // Always return success to prevent email enumeration
  if (!customer) {
    return res.json({ message: 'If an account exists, a reset link has been sent.' });
  }

  // Generate a secure, time-limited token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  await db.passwordResets.create({
    customerId: customer.id,
    tokenHash: resetTokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  await sendPasswordResetEmail(customer.email, resetToken);

  res.json({ message: 'If an account exists, a reset link has been sent.' });
}

// POST /api/customers/reset-password
async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetRecord = await db.passwordResets.findByToken(tokenHash);

  if (!resetRecord || resetRecord.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.customers.update(resetRecord.customerId, { passwordHash });

  // Invalidate the token
  await db.passwordResets.delete(resetRecord.id);

  // Invalidate all existing sessions
  await db.sessions.deleteByCustomer(resetRecord.customerId);

  res.json({ message: 'Password has been reset. Please log in.' });
}
```

### Account dashboard React component

```tsx
function AccountDashboard() {
  const { customer } = useCustomer();
  const { orders, isLoading } = useOrders({ limit: 5 });

  return (
    <div className="account-dashboard">
      <h1>Welcome back, {customer.firstName}</h1>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Recent Orders</h2>
          {isLoading ? (
            <OrdersSkeleton count={3} />
          ) : orders.length === 0 ? (
            <p>No orders yet. <a href="/collections">Start shopping</a></p>
          ) : (
            <ul className="orders-list">
              {orders.map(order => (
                <li key={order.id} className="order-item">
                  <div className="order-header">
                    <span className="order-number">#{order.orderNumber}</span>
                    <time dateTime={order.createdAt}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                  <div className="order-details">
                    <span className="order-status">{order.fulfillmentStatus}</span>
                    <span className="order-total">
                      {formatCurrency(order.totalPrice)}
                    </span>
                  </div>
                  <a href={`/account/orders/${order.id}`}>View details</a>
                </li>
              ))}
            </ul>
          )}
          <a href="/account/orders" className="view-all">View all orders</a>
        </section>

        <section className="dashboard-card">
          <h2>Account Details</h2>
          <dl>
            <dt>Name</dt>
            <dd>{customer.firstName} {customer.lastName}</dd>
            <dt>Email</dt>
            <dd>{customer.email}</dd>
          </dl>
          <a href="/account/profile">Edit profile</a>
        </section>

        <section className="dashboard-card">
          <h2>Default Address</h2>
          <AddressDisplay address={customer.defaultAddress} />
          <a href="/account/addresses">Manage addresses</a>
        </section>
      </div>
    </div>
  );
}
```

## Best Practices

- **Never return different error messages for existing vs. non-existing emails** — this enables email enumeration attacks; use generic "invalid email or password"
- **Hash passwords with bcrypt (cost factor 12+)** — never store plaintext passwords; bcrypt is designed for password hashing with built-in salting
- **Always verify email ownership** — send a verification email before allowing password-based login to prevent account squatting
- **Rate-limit login and registration endpoints** — prevent brute-force attacks with IP-based and email-based rate limiting
- **Support guest checkout** — never force registration before purchase; offer post-purchase account creation instead
- **Paginate order history** — customers with hundreds of orders will crash the browser if you load all orders at once
- **Auto-populate checkout from saved addresses** — the primary value of accounts is faster checkout; make the default address pre-fill automatic
- **Let customers delete their accounts** — GDPR and CCPA require this; implement a soft-delete with a grace period before permanent deletion

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customers can't log in after password reset | Ensure all existing sessions are invalidated when the password is changed |
| Address validation errors on international addresses | Don't require state/province for countries that don't use them; make `state` optional |
| Order history shows orders from before account creation | When converting guest to registered, associate past orders by email match (with customer consent) |
| JWT tokens are too long-lived | Use short-lived access tokens (15 min) with a refresh token pattern, or use server-side sessions |
| No way to merge duplicate customer records | Implement a customer merge tool that consolidates orders, addresses, and activity from two records |

## Related Skills

- @checkout-flow-optimization
- @pci-dss-compliance
- @ecommerce-seo
- @erp-integration
- @customer-segmentation
