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
platforms: [platform-agnostic]
difficulty: beginner
---

# Exit-Intent Popups

## Overview

Exit-intent popups detect when a visitor is about to leave the page — typically by tracking rapid mouse movement toward the browser's address bar or close button on desktop — and display a targeted offer to retain them. When implemented with proper targeting, frequency capping, and A/B testing, exit-intent popups recover 5–10% of otherwise lost visitors. This skill covers native browser-based exit detection, offer targeting rules, frequency capping with localStorage, and measuring impact through a holdout group.

## When to Use This Skill

- When site bounce rate is above 60% and conversion rate is below 2%
- When capturing email addresses for the marketing list during the session
- When offering a first-purchase discount to new visitors who haven't converted
- When reminding checkout abandoners about items in their cart before they leave
- When running A/B tests on popup offer types (% off vs. free shipping vs. free gift)
- When implementing GDPR-compliant email capture with explicit consent checkbox

## Core Instructions

1. **Detect exit intent with mouse movement tracking**

   ```typescript
   interface ExitIntentOptions {
     threshold?: number;       // px from top of viewport (default: 20)
     delay?: number;           // ms after page load before activating (default: 3000)
     onExitIntent: () => void;
   }

   function initExitIntent({ threshold = 20, delay = 3000, onExitIntent }: ExitIntentOptions): () => void {
     let activated = false;
     let timeoutId: ReturnType<typeof setTimeout>;

     const handleMouseMove = (e: MouseEvent) => {
       // Trigger when cursor moves above the threshold from the top
       if (!activated && e.clientY < threshold && e.movementY < 0) {
         activated = true;
         onExitIntent();
       }
     };

     // Delay activation so the popup doesn't fire immediately on page load
     timeoutId = setTimeout(() => {
       document.addEventListener('mouseleave', (e) => {
         if (e.clientY <= 0 && !activated) {
           activated = true;
           onExitIntent();
         }
       });
       document.addEventListener('mousemove', handleMouseMove);
     }, delay);

     // Mobile: use visibility change or beforeunload
     document.addEventListener('visibilitychange', () => {
       if (document.visibilityState === 'hidden' && !activated) {
         activated = true;
         onExitIntent();
       }
     });

     // Return cleanup function
     return () => {
       clearTimeout(timeoutId);
       document.removeEventListener('mousemove', handleMouseMove);
     };
   }
   ```

2. **Apply targeting rules before showing the popup**

   Not every visitor should see a popup — irrelevant popups increase bounce rate:

   ```typescript
   interface TargetingRule {
     id: string;
     condition: () => boolean;
   }

   function shouldShowPopup(popupConfig: PopupConfig): boolean {
     const rules: TargetingRule[] = [
       // Don't show to existing customers already logged in
       {
         id: 'not_logged_in',
         condition: () => !document.cookie.includes('customer_id='),
       },
       // Only on specific pages
       {
         id: 'target_pages',
         condition: () =>
           popupConfig.targetPages.length === 0 ||
           popupConfig.targetPages.some((p) => window.location.pathname.startsWith(p)),
       },
       // Minimum time on page (30s — engaged visitors)
       {
         id: 'time_on_page',
         condition: () => (Date.now() - pageLoadTime) > 30000,
       },
       // Frequency cap: don't show if shown in last N days
       {
         id: 'frequency_cap',
         condition: () => !hasSeenPopupRecently(popupConfig.id, popupConfig.frequencyCapDays),
       },
       // Don't show on checkout pages
       {
         id: 'exclude_checkout',
         condition: () => !window.location.pathname.startsWith('/checkout'),
       },
     ];

     return rules.every((rule) => rule.condition());
   }
   ```

3. **Implement frequency capping with localStorage**

   ```typescript
   function hasSeenPopupRecently(popupId: string, capDays: number): boolean {
     const key = `popup_seen_${popupId}`;
     const lastSeen = localStorage.getItem(key);
     if (!lastSeen) return false;

     const daysSinceSeen = (Date.now() - parseInt(lastSeen, 10)) / 86400000;
     return daysSinceSeen < capDays;
   }

   function markPopupShown(popupId: string) {
     localStorage.setItem(`popup_seen_${popupId}`, String(Date.now()));
   }

   function markPopupDismissed(popupId: string) {
     // On explicit dismiss, extend the cap significantly
     localStorage.setItem(`popup_seen_${popupId}`, String(Date.now()));
     localStorage.setItem(`popup_dismissed_${popupId}`, 'true');
   }
   ```

4. **Build the popup component with email capture**

   ```tsx
   interface ExitPopupProps {
     offer: { type: 'percent_off' | 'free_shipping' | 'free_gift'; value: number | string };
     onSubmit: (email: string) => Promise<void>;
     onDismiss: () => void;
   }

   export function ExitIntentPopup({ offer, onSubmit, onDismiss }: ExitPopupProps) {
     const [email, setEmail] = useState('');
     const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

     const offerText =
       offer.type === 'percent_off' ? `${offer.value}% off your first order` :
       offer.type === 'free_shipping' ? 'Free shipping on your first order' :
       `Free ${offer.value} with your first order`;

     async function handleSubmit(e: React.FormEvent) {
       e.preventDefault();
       setStatus('loading');
       try {
         await onSubmit(email);
         setStatus('success');
       } catch {
         setStatus('error');
       }
     }

     return (
       <div role="dialog" aria-modal="true" aria-label="Special offer" className="exit-popup-overlay">
         <div className="exit-popup">
           <button onClick={onDismiss} aria-label="Close" className="exit-popup__close">×</button>
           <h2>Wait — before you go!</h2>
           <p className="exit-popup__offer">{offerText}</p>
           {status === 'success' ? (
             <p className="exit-popup__success">Check your inbox for your discount code!</p>
           ) : (
             <form onSubmit={handleSubmit}>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="Enter your email"
                 required
                 autoFocus
               />
               <label className="exit-popup__consent">
                 <input type="checkbox" required />
                 I agree to receive marketing emails. Unsubscribe anytime.
               </label>
               <button type="submit" disabled={status === 'loading'}>
                 {status === 'loading' ? 'Claiming...' : 'Claim My Offer'}
               </button>
             </form>
           )}
         </div>
       </div>
     );
   }
   ```

5. **Wire up exit intent with targeting and A/B variants**

   ```typescript
   const POPUP_VARIANTS = {
     control: null,  // holdout — no popup
     percent_off: { type: 'percent_off' as const, value: 10 },
     free_shipping: { type: 'free_shipping' as const, value: 0 },
   };

   function initExitIntentSystem() {
     const popupConfig = {
       id: 'exit-v2',
       targetPages: ['/', '/products', '/collections'],
       frequencyCapDays: 14,
     };

     if (!shouldShowPopup(popupConfig)) return;

     // Assign variant deterministically based on session ID
     const sessionId = getOrCreateSessionId();
     const variantKeys = Object.keys(POPUP_VARIANTS);
     const variantKey = variantKeys[parseInt(sessionId.slice(-2), 16) % variantKeys.length] as keyof typeof POPUP_VARIANTS;
     const offer = POPUP_VARIANTS[variantKey];

     const cleanup = initExitIntent({
       onExitIntent: () => {
         if (!offer) {
           // Control group — track the exit intent but don't show popup
           trackExitIntent({ popupId: popupConfig.id, variant: 'control', shown: false });
           return;
         }

         markPopupShown(popupConfig.id);
         trackExitIntent({ popupId: popupConfig.id, variant: variantKey, shown: true });
         renderPopup(offer, popupConfig.id);
         cleanup();
       },
     });
   }
   ```

## Examples

### Submit email and generate discount code server-side

```typescript
// POST /api/exit-popup/capture
export async function captureExitPopupEmail(req: Request, res: Response) {
  const { email, popupId, variant } = req.body;

  // Subscribe to marketing list
  await db.marketingSubscribers.upsert(
    { email },
    { email, source: 'exit_popup', popupId, variant, subscribedAt: new Date() }
  );

  // Generate a unique one-time promo code
  const code = await createOneTimePromoCode({
    type: 'percent_off',
    value: 10,
    email,
    expiresInDays: 7,
    source: `exit_popup_${popupId}`,
  });

  // Send welcome email with the code
  await sendTransactionalEmail(email, 'exit-popup-offer', { code, expiresInDays: 7 });

  await db.exitPopupConversions.create({ email, popupId, variant, convertedAt: new Date() });

  res.json({ code });
}
```

### Measure popup impact with holdout comparison

```sql
-- Compare conversion rate between popup-shown and holdout sessions
SELECT
  variant,
  COUNT(DISTINCT session_id) AS sessions,
  COUNT(DISTINCT CASE WHEN converted_to_order THEN session_id END) AS orders,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN converted_to_order THEN session_id END) /
        NULLIF(COUNT(DISTINCT session_id), 0), 2) AS cvr_pct,
  COUNT(DISTINCT CASE WHEN email_captured THEN session_id END) AS email_captures
FROM exit_intent_events
WHERE shown_at >= NOW() - INTERVAL '30 days'
GROUP BY variant;
```

## Best Practices

- **Always include a control/holdout group** (20–30%) so you can prove the popup is adding value rather than just capturing intent that would have converted anyway
- **Delay activation by at least 3 seconds** — popups that fire immediately as the page loads train visitors to close them without reading
- **Cap at 14–30 days** — showing the same popup to a returning visitor every session creates annoyance; use localStorage to suppress for at least 2 weeks
- **Test one variable at a time** — rotate offer type (% off vs. free shipping), not headline + offer + design simultaneously
- **Include a clear close button** with `aria-label` — accessibility and UX both require an obvious escape; friction-heavy popups increase bounce rate
- **Never pre-check the email consent box** — GDPR requires explicit opt-in; pre-checked boxes are not valid consent in the EU
- **Generate unique one-time codes** for popup offers — generic codes (WELCOME10) get shared on coupon sites, inflating attribution
- **Exclude already-subscribed visitors** — checking for a `subscriber_id` cookie or localStorage flag prevents showing the popup to customers who are already on your list

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Popup fires immediately on page load | Set a minimum time-on-page delay of 3–5 seconds; also check minimum scroll depth (20%) |
| Popup shown to the same user on every visit | Implement 14-day frequency capping with localStorage; also suppress for known customers |
| Exit intent fires on mobile | Mobile has no mouse events — use `visibilitychange` API or a scroll-up detection instead of `mouseleave` |
| Popup blocks content on mobile causing CLS issues | Lazy-load the popup component; only mount it in the DOM when exit intent is detected |
| No way to measure whether the popup helps conversion | Always run with a holdout group and compare CVR using the exit-intent event log |

## Related Skills

- @cart-abandonment-recovery
- @email-marketing-automation
- @conversion-rate-optimization
- @push-notifications
- @ab-testing-ecommerce
