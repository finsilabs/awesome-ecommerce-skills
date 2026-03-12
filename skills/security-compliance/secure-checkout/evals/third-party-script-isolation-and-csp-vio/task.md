# Checkout Security Hardening: Script Isolation and Monitoring

## Problem/Feature Description

Your company runs a Next.js storefront that recently added Google Analytics, a live chat widget, and a few marketing pixels to drive conversion tracking and customer support. These scripts load on every page, including the new checkout flow. A security review flagged that having third-party JavaScript on payment pages is a significant supply chain risk — if any of those vendors were ever compromised, attackers could harvest customer card data in real time.

The security team wants two things done: first, isolate the checkout pages so that no non-essential third-party scripts run there at all; second, add active monitoring so the team is notified immediately if something suspicious attempts to load on a checkout page. The payment flow already uses Stripe Elements for card collection. The team also wants to ensure that the Stripe.js library itself is loaded in a tamper-evident way.

Your task is to implement the checkout layout that enforces script isolation, configure the CSP to enable violation reporting, and build the reporting endpoint that the browser will call when a violation is detected.

## Output Specification

Produce the following files:

- `app/checkout/layout.tsx` — the checkout-specific layout that loads only essential scripts (Stripe.js) and excludes all non-payment third parties
- `app/api/csp-report/route.ts` — the CSP violation reporting API endpoint
- `middleware.ts` — updated middleware that includes the CSP reporting directive in the policy

A simplified version of the existing root layout that loads analytics is provided below — use it to understand what scripts are currently loading site-wide.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/app/layout.tsx ===============
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
        {/* Live chat widget */}
        <Script
          src="https://cdn.livechat.com/widget.js"
          strategy="lazyOnload"
        />
        {/* Facebook Pixel */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){...}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '123456789');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
