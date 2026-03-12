# White-Label Theme Injection for a Multi-Tenant Storefront Platform

## Problem/Feature Description

Nexus Retail Cloud is a SaaS platform that hosts branded storefronts for hundreds of independent merchants. Each merchant has their own primary color, button style, and font size preferences stored in the platform's database. The engineering team needs to implement a mechanism that applies each merchant's branding automatically when their storefront is served — without rebuilding the application or shipping separate bundles per merchant.

A previous attempt used a React `useEffect` hook to apply brand colors on the client, but this caused a visible flash of the default (unbranded) theme on every page load, which merchants complained about loudly. The platform uses server-side rendering (Express + a templating layer), so the new implementation must apply the merchant's theme before the page reaches the browser.

A security review also flagged that injecting merchant-controlled values into HTML responses is a potential attack vector. The implementation must ensure that only safe CSS values reach the output.

## Output Specification

Produce the following Node.js/Express implementation:

1. **A middleware module** (e.g., `middleware/themeInjection.js`) that resolves the tenant from the incoming request and populates response locals with an inline CSS block of token overrides.

2. **A sanitization utility** (e.g., `utils/sanitizeThemeValues.js`) that validates and cleans tenant-supplied theme values before they are rendered into HTML.

3. **An HTML template snippet** (e.g., `views/head-fragment.html` or a template string in code) showing how the injected CSS overrides are placed in the document `<head>`.

4. **A `tenants.js` or inline mock** representing at least two sample tenant theme records, so the middleware can be demonstrated without a real database.

5. **A short test script** (`test-injection.js`) that exercises the sanitization utility with a mix of valid and invalid values and logs which pass and which are rejected, so the behavior is observable in the output files.

Write a `NOTES.md` explaining the security approach and why server-side injection was chosen over a client-side approach.
