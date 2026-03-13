---
name: cart-recovery-sms
description: "Recover abandoned carts with targeted SMS sequences including urgency messaging, product reminders, discount incentives, and TCPA-compliant opt-in flows"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [sms, cart-recovery, abandonment]
triggers: ["set up SMS cart recovery", "reduce cart abandonment with SMS"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Cart Recovery SMS

## Overview

SMS cart abandonment recovery consistently achieves 20–35% recovery rates — typically 3–5× higher than email — because text messages are read within 3 minutes of delivery for 90% of recipients. The key is a properly timed sequence (not spam), deep personalization using cart contents, and bulletproof TCPA/GDPR compliance. Most merchants should use a dedicated SMS app rather than building custom infrastructure.

> **Note:** For multi-channel cart recovery (email + SMS + push), see @cart-abandonment-recovery. This skill focuses on SMS-only recovery.

## When to Use This Skill

- When email-only cart recovery sequences plateau below a 10% recovery rate
- When launching SMS as a new marketing channel and cart recovery is the highest-ROI starting point
- When re-platforming to a new SMS provider and need to rebuild flows
- When A/B testing recovery channels to find the optimal message mix

## Core Instructions

### Step 1: Choose the right SMS platform

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Postscript or Attentive | Deep Shopify integration, automatic cart event capture, built-in TCPA compliance, Shopify checkout opt-in widget |
| **WooCommerce** | SMSBump (by Yotpo) or Klaviyo SMS | WooCommerce plugin available, hooks into WooCommerce cart events automatically |
| **BigCommerce** | Attentive or Klaviyo SMS | Native BigCommerce integrations, automatic event tracking |
| **Custom / Headless** | Klaviyo SMS (via API) or Twilio + custom logic | Klaviyo handles compliance and sequencing via API; Twilio for full custom control |

### Step 2: Set up SMS opt-in (compliance first)

TCPA (US) requires express written consent before sending marketing SMS. Build this before any send logic.

---

#### Shopify

**Using Postscript:**

1. Install Postscript from the Shopify App Store
2. Go to **Postscript → Opt-in Tools → Checkout Opt-in**
3. Postscript automatically adds a compliant SMS opt-in checkbox to your Shopify checkout with the required TCPA disclosure text
4. Enable **Keyword Opt-in** under **Opt-in Tools → Keywords** — customers can text your keyword to subscribe
5. Postscript handles STOP/HELP responses, quiet hours, and consent storage automatically

**Using Attentive:**

1. Install Attentive from the Shopify App Store
2. Attentive's two-tap mobile opt-in (sign-up units) achieves higher opt-in rates than checkbox-only
3. Go to **Attentive → Subscribers → Sign-up Units** to configure placement and offer
4. Checkout integration is automatic after app install

---

#### WooCommerce

**Using SMSBump:**

1. Install SMSBump plugin from WordPress plugin directory
2. Go to **SMSBump → Opt-in → Checkout Opt-in** and enable the checkout checkbox with TCPA language
3. Configure quiet hours under **SMSBump → Settings → Compliance** — enforce 8am–9pm in recipient timezone
4. Go to **SMSBump → Automations → Cart Abandonment** and enable the abandonment flow

---

#### BigCommerce

1. Install **Attentive** from the BigCommerce App Marketplace
2. Configure the two-tap opt-in unit and checkout SMS opt-in through the Attentive dashboard
3. BigCommerce cart events sync automatically after installation

---

### Step 3: Build the cart recovery sequence

Use your SMS platform's automation builder. The optimal 3-message sequence:

**Message 1 — Reminder (20–30 minutes after abandonment)**
- No discount — most recoveries happen here without one
- Include the product name and a direct checkout link
- Example: "Hi [First Name], you left [Product Name] in your cart. Complete your order: [link] Reply STOP to opt out."

**Message 2 — Social proof or urgency (60 minutes)**
- Reference low stock or popularity
- Example: "[Product Name] is almost gone — only 3 left. Your cart is saved: [link] Reply STOP to opt out."

**Message 3 — Discount (24 hours)**
- Only for carts above your minimum threshold (recommend $50+)
- Use a unique single-use code
- Example: "Last chance, [First Name]! Use [CODE] for 10% off before your cart expires. Checkout: [link] Reply STOP to opt out."

**Configuration in Postscript:**
1. Go to **Postscript → Automations → New Automation → Checkout Abandoned**
2. Add three messages with the timing above
3. Add a filter on each step: "Has NOT placed an order since starting" — this auto-cancels on conversion
4. For the discount message: use Postscript's built-in unique coupon generation (connects to Shopify's discount system)
5. Set a cart value filter: only send the discount step for carts over $50

**Configuration in SMSBump (WooCommerce):**
1. Go to **SMSBump → Automations → Cart Abandonment**
2. Enable the three-step sequence with the same timing
3. Add "Order Not Placed" condition to each step
4. Connect WooCommerce coupon generation for the discount step

### Step 4: Configure cart value thresholds and discount strategy

1. **Set a minimum cart value** ($30–$50) for SMS recovery — low-value carts have negative ROI after SMS cost
2. **Reserve discounts for the last message only** — offering discounts too early trains customers to abandon on purpose
3. **Use single-use codes** — prevents sharing and controls attribution
4. **Segment by customer value**: new customers get 10% off; repeat customers get free shipping only; VIP customers (5+ orders) get no discount

### Step 5: Measure performance

| Metric | Target | How to Find |
|--------|--------|-------------|
| Recovery rate | 15–25% of abandoned carts | SMS app → Automation analytics |
| Click-through rate | 25–40% of delivered messages | SMS app → Message analytics |
| Opt-out rate per step | < 3% | SMS app → Subscriber analytics |
| Deliverability rate | > 95% | SMS app → Deliverability report |

## Best Practices

- **Capture phone number before payment** — on Shopify, Postscript captures the phone number at checkout step 1 so you can recover even if the customer never completes payment
- **Enforce quiet hours** — Postscript, Attentive, and SMSBump all enforce this automatically; verify it is enabled in settings (8am–9pm recipient local time)
- **Keep messages under 160 characters** — longer messages split into multiple SMS and increase cost
- **Always include STOP opt-out** — required by TCPA; all major SMS apps include this automatically
- **Set a 7-day suppression after a completed sequence** — if a customer abandons again right after a recovery sequence, give them space

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| SMS sent after order placed | Ensure each message step has "Order Not Placed" condition enabled in your automation |
| Anonymous cart abandonment not captured | Postscript and Attentive capture phone at checkout step 1; enable this in your checkout settings |
| Customers learn to abandon for discounts | Never discount on messages 1 or 2; skip discounts for repeat customers |
| Carrier filtering (messages not delivered) | Avoid all-caps, free link shorteners, and excessive punctuation; use your platform's verified sending number |
| High opt-out rate after first message | Message is too aggressive or cart value threshold is too low; raise the threshold and soften copy |
| TCPA lawsuit exposure | Use your SMS platform's built-in compliance tools; never import phone numbers without proof of explicit consent |

## Related Skills

- @cart-abandonment-recovery
- @sms-marketing
- @email-marketing-automation
- @lifecycle-marketing-automation
- @win-back-reactivation
