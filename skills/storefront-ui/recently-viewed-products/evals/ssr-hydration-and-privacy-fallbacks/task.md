# Privacy-Compliant Recently Viewed Tracking for a European Storefront

## Problem/Feature Description

A European home goods retailer is rebuilding their storefront using Next.js. Their legal team has flagged that cross-session product tracking requires explicit opt-in under their cookie policy, so the default implementation must not persist browsing history beyond the current session. However, once a user grants consent, the site should switch to persistent cross-session tracking.

The team also discovered that some visitors browse in private/incognito mode where localStorage is unavailable entirely. In those cases, the server needs a way to read and write recently viewed history using cookies instead, so the experience degrades gracefully rather than silently dropping history. The cookie implementation will run in server-side API routes.

The engineering lead wants a clear, self-contained implementation showing both the session-only mode (no consent) and the cookie-based server fallback, along with the product detail page component that correctly integrates the tracking call without causing a hydration error in Next.js.

## Output Specification

Produce the following files:

1. `lib/recentlyViewedSession.js` — A variant of the storage utility that uses sessionStorage instead of localStorage (same API: `recordView`, `getRecentlyViewedIds`, `clearHistory`). This is the default mode used before consent is granted.

2. `lib/recentlyViewedCookie.js` — A server-side utility with two exported functions:
   - `getRecentlyViewedFromCookie(cookieHeader)` — parses the cookie header and returns an array of product IDs
   - `buildRecentlyViewedCookie(currentIds, newProductId)` — returns a complete Set-Cookie header string for updating the recently viewed cookie

3. `components/ProductDetailPage.jsx` — A React component that accepts a `product` prop and renders the product content plus the recently viewed widget. It must record the product view without causing a hydration mismatch.

Write a short `README.md` that explains when to use each module (session vs. cookie fallback) and what cookie attributes are set.
