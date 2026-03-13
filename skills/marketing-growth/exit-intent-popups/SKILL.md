---
name: exit-intent-popups
description: "Capture leaving visitors with targeted exit-intent popups that show personalized offers, email capture forms, and respect frequency capping rules"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [exit-intent, popup, conversion, offer, frequency-capping, a-b-testing, email-capture, coupon]
triggers: ["exit intent popup", "exit intent", "exit intent detection", "popup with offer", "email capture popup", "frequency capping popup", "abandon intent detection"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: beginner
---

# Exit-Intent Popups

## Overview

Exit-intent popups detect when a visitor is about to leave — by tracking rapid mouse movement toward the browser's address bar on desktop — and display a targeted offer. When implemented with proper targeting and frequency capping, they recover 5–10% of otherwise lost visitors. Dedicated popup apps handle all the detection logic, A/B testing, and ESP integration — no custom code needed.

## When to Use This Skill

- When site bounce rate is above 60% and conversion rate is below 2%
- When capturing email addresses for the marketing list during the session
- When offering a first-purchase discount to new visitors who haven't converted
- When reminding checkout abandoners about items in their cart before they leave
- When A/B testing popup offer types (% off vs. free shipping vs. free gift)

## Core Instructions

### Step 1: Choose the right popup tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Klaviyo Forms (free, syncs to Klaviyo) or Privy ($30/mo) | Klaviyo Forms integrates directly with Klaviyo flows; Privy includes A/B testing, unique coupon codes, and detailed analytics |
| **WooCommerce** | OptinMonster ($9/mo) or Popup Maker (free) | OptinMonster has exit-intent detection, A/B testing, and WooCommerce integration; Popup Maker is simpler and free |
| **BigCommerce** | Justuno or Klaviyo Forms | Both have native BigCommerce integrations and exit-intent detection |
| **Custom / Headless** | Klaviyo Forms (via JavaScript embed) or custom implementation | Klaviyo Forms works on any site with a JavaScript snippet |

### Step 2: Configure exit-intent detection and targeting

Most popup tools have exit-intent built in. The key is configuring it correctly to avoid annoying visitors.

---

#### Shopify with Klaviyo Forms

1. In Klaviyo, go to **Sign-up Forms → Create Form**
2. Choose **Popup** as the form type
3. Under **Targeting**, set:
   - **Display when**: Exit intent (mouse moves to top of browser)
   - **Delay**: 5 seconds minimum time on page before activating
   - **Frequency**: Show once per 14 days (Klaviyo manages this via cookie)
4. Under **Targeting → Conditions**, add:
   - Show only on: Homepage, product pages, collection pages
   - Do NOT show on: /checkout, /cart, /account
   - Do NOT show to: Existing subscribers (Klaviyo checks this automatically for identified profiles)
5. Under **Form Content**, set your offer:
   - For email capture: "Get 10% off your first order" + email input + GDPR consent checkbox
   - For cart reminder: "You have items in your cart — complete your purchase" + link back to cart
6. Under **Success Action**, create a discount code:
   - Connect to **Shopify → Discounts** — Klaviyo can automatically create unique single-use 10% off codes
   - These codes appear in the success message and are automatically synced to the subscriber's profile

---

#### Shopify with Privy

1. Install Privy from the Shopify App Store
2. Go to **Privy → Displays → New Display → Popup**
3. Under **When to show**, select "Exit intent"
4. Under **Who to show it to**, configure:
   - New visitors only (suppress for logged-in customers)
   - Minimum 30 seconds on site
   - Not in checkout
   - Frequency cap: 14 days
5. Under **Offers**, Privy automatically generates unique coupon codes synced to Shopify's discount system
6. Connect Privy to Klaviyo or Mailchimp under **Integrations** for automatic list sync

---

#### WooCommerce with OptinMonster

1. Install OptinMonster plugin from the WordPress directory
2. Create a new campaign: **Popup → Exit Intent**
3. Under **Display Rules**, configure:
   - **Exit Intent** trigger: sensitivity = Medium
   - **Time on page**: minimum 30 seconds
   - **Page targeting**: include homepage, shop, product pages; exclude checkout, cart, my-account
   - **Frequency**: 14-day cookie suppression (OptinMonster default)
4. Under **Integrations**, connect to Mailchimp, Klaviyo, or your email provider
5. For unique coupon codes: use WooCommerce → Coupons to create a coupon, then display the code in the success message (OptinMonster does not auto-generate unique codes on free tiers)

---

#### BigCommerce with Justuno

1. Install Justuno from the BigCommerce App Marketplace
2. Go to **Justuno → Promotions → New Popup**
3. Configure exit intent triggers, targeting rules, and A/B test variants through the visual builder
4. Justuno integrates with Klaviyo and Mailchimp for list sync

---

#### Custom / Headless

For custom builds, Klaviyo Forms works on any website:

1. Add the Klaviyo JavaScript snippet to your site
2. Go to **Klaviyo → Sign-up Forms → Create Form** and configure as above
3. Klaviyo handles exit detection, frequency capping, and list sync

If you need full control over the popup behavior (custom exit detection logic):

```javascript
function initExitIntent({ threshold = 20, delay = 5000, onExitIntent }) {
  let activated = false;

  setTimeout(() => {
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0 && !activated) {
        activated = true;
        onExitIntent();
      }
    });
  }, delay);

  // Mobile: use visibilitychange instead of mouseleave
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !activated) {
      activated = true;
      onExitIntent();
    }
  });
}

// Check frequency cap using localStorage
function shouldShowPopup(popupId, capDays = 14) {
  const lastSeen = localStorage.getItem(`popup_seen_${popupId}`);
  if (!lastSeen) return true;
  return (Date.now() - parseInt(lastSeen)) > capDays * 86400000;
}
```

### Step 3: Configure the offer and A/B test

The most impactful thing to test is the offer type. Run one A/B test at a time:

| Offer Type | Best For | Typical Email Capture Rate |
|-----------|---------|--------------------------|
| 10% off first order | General merchandise | 3–8% of popup views |
| Free shipping | High-AOV stores (shipping is expensive) | 4–9% of popup views |
| Free gift with purchase | Beauty, supplements | 5–10% of popup views |
| Content offer ("Download our guide") | B2C brands with content | 2–5% |

**In Klaviyo/Privy**: create two variants of your form with different offers, split traffic 50/50, and measure conversion rate over 2 weeks before picking a winner.

### Step 4: Generate unique discount codes (not generic codes)

Generic codes like WELCOME10 get shared on coupon sites and inflate your attribution:

- **Shopify + Klaviyo**: Klaviyo automatically generates unique single-use Shopify discount codes — enable this in the form's success action settings
- **Shopify + Privy**: Privy connects to Shopify's discount system and generates unique codes automatically
- **WooCommerce**: Use the WooCommerce Unique Coupon Generator plugin, or create a general code with per-customer usage limit

## Best Practices

- **Always include a control/holdout group** (20–30%) — without a holdout, you cannot tell if the popup is adding value or just capturing conversions that would have happened anyway (most popup apps support this)
- **Delay activation by at least 5 seconds** — popups that fire immediately train visitors to close them without reading
- **Frequency cap at 14 days minimum** — all major popup apps handle this via cookie automatically; verify it is enabled
- **Never pre-check the email consent checkbox** — GDPR requires explicit opt-in; pre-checked boxes are not valid consent in the EU
- **Generate unique one-time codes** — generic codes (WELCOME10) get shared on coupon sites
- **Exclude already-subscribed visitors** — Klaviyo checks this automatically; for other tools, suppress via cookie

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Popup fires immediately on page load | Set minimum 5-second delay AND minimum scroll depth (20%) in targeting settings |
| Popup shown to same user on every visit | Verify frequency capping is enabled in your popup app (Klaviyo: 14 days; Privy: configurable; OptinMonster: configurable) |
| Exit intent fires on mobile | Switch to scroll-based or time-based triggers for mobile; most tools do this automatically when exit-intent is selected |
| No way to measure whether the popup helps conversion | Enable A/B testing with a control group in your popup app; most support this natively |
| High popup-driven unsubscribe rate | The offer is not compelling enough; test free shipping vs. % off; also check that emails are sending too frequently after signup |

## Related Skills

- @cart-abandonment-recovery
- @email-marketing-automation
- @conversion-rate-optimization
- @push-notifications
- @first-party-data-collection
