# Secure Headers and CSP for Next.js Checkout

## Problem/Feature Description

Your team has just completed a penetration test of your Next.js e-commerce application. The report flagged that the payment and checkout pages are missing critical HTTP response headers and have no Content Security Policy. The security team is particularly worried about Magecart-style attacks — malicious JavaScript injected into the page that silently exfiltrates card numbers as customers type them. Several competitors in your space have suffered these attacks in the past year.

The application currently has a `/checkout` route group and a standard `next.config.ts`, but no security hardening has been done. Your task is to implement the full set of recommended HTTP security headers globally across the app, add extra restrictive headers for the checkout route specifically, and implement a per-request nonce-based Content Security Policy applied through Next.js middleware.

## Output Specification

Produce a self-contained implementation with the following files:

- `next.config.ts` — with global security headers defined for all routes and extra headers specifically for checkout pages
- `middleware.ts` — Next.js middleware that generates and applies the Content Security Policy header per request
- `lib/csp.ts` — the CSP generation function that accepts a nonce and returns the full policy string

The Stripe payment integration is already handled elsewhere; make sure your CSP is compatible with Stripe Elements (both the script loading and the iframe widgets).

For the nonce, the middleware should also forward it downstream so that layout components can use it on script tags.

Do not produce any other application files — focus only on the security infrastructure files listed above.
