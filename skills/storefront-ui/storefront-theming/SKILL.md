---
name: storefront-theming
description: "Build a themeable storefront with design tokens and CSS custom properties that supports white-labeling, multi-brand variants, and dark mode"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [theming, design-tokens, css-custom-properties, white-label, multi-brand, dark-mode, tokens]
triggers: ["storefront theming", "design tokens", "CSS variables commerce", "white label store", "multi-brand theme", "dark mode ecommerce"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Storefront Theming

## Overview

Architect a theming system using design tokens and CSS custom properties that allows a storefront to be re-skinned for multiple brands without modifying component code. Covers the token taxonomy (color, typography, spacing, radius, shadow), build-time token compilation from a JSON source of truth, runtime theme switching (light/dark mode), and a white-label multi-tenant architecture where each tenant has their own token overrides.

## When to Use This Skill

- When building a platform that will power multiple branded storefronts from a single codebase
- When handing off a design system to a team that will maintain brand consistency across components
- When implementing dark mode for a storefront
- When a rebrand requires changing colors across thousands of component instances without hunt-and-replace

## Prerequisites & Platform Notes

**Shopify**: Build with Shopify themes (Liquid), Shopify Hydrogen (React), or headless with the Storefront API. These component patterns work in any React-based Shopify setup.
**WooCommerce**: Build with WooCommerce Blocks (React), classic PHP themes, or headless with WooCommerce REST API. These patterns apply to block-based or headless storefronts.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A storefront codebase (theme, Hydrogen app, or headless frontend)

## Core Instructions

1. **Define the token taxonomy in JSON**

   Tokens live at three tiers: global (all possible values), semantic (meaning-bearing aliases), component (component-specific).

   ```json
   // tokens/global.json
   {
     "color": {
       "gray-50":  { "value": "#f8fafc" },
       "gray-100": { "value": "#f1f5f9" },
       "gray-900": { "value": "#0f172a" },
       "blue-500": { "value": "#3b82f6" },
       "blue-600": { "value": "#2563eb" },
       "red-500":  { "value": "#ef4444" },
       "green-600":{ "value": "#16a34a" }
     },
     "font-size": {
       "xs":   { "value": "0.75rem" },
       "sm":   { "value": "0.875rem" },
       "base": { "value": "1rem" },
       "lg":   { "value": "1.125rem" },
       "xl":   { "value": "1.25rem" },
       "2xl":  { "value": "1.5rem" },
       "3xl":  { "value": "1.875rem" }
     },
     "space": {
       "1": { "value": "0.25rem" },
       "2": { "value": "0.5rem" },
       "4": { "value": "1rem" },
       "6": { "value": "1.5rem" },
       "8": { "value": "2rem" },
       "12": { "value": "3rem" }
     },
     "radius": {
       "sm": { "value": "0.25rem" },
       "md": { "value": "0.375rem" },
       "lg": { "value": "0.5rem" },
       "full": { "value": "9999px" }
     }
   }
   ```

   ```json
   // tokens/semantic.json — references global tokens
   {
     "color": {
       "brand-primary":   { "value": "{color.blue-600}" },
       "brand-secondary": { "value": "{color.blue-500}" },
       "surface":         { "value": "{color.gray-50}" },
       "on-surface":      { "value": "{color.gray-900}" },
       "price":           { "value": "{color.gray-900}" },
       "price-sale":      { "value": "{color.red-500}" },
       "success":         { "value": "{color.green-600}" },
       "border":          { "value": "{color.gray-100}" }
     },
     "button": {
       "border-radius": { "value": "{radius.md}" },
       "font-size":     { "value": "{font-size.base}" }
     }
   }
   ```

2. **Compile tokens to CSS custom properties**

   Use Style Dictionary to transform the JSON token source into platform-specific output files.

   ```javascript
   // build-tokens.js
   import StyleDictionary from 'style-dictionary';

   const sd = new StyleDictionary({
     source: ['tokens/**/*.json'],
     platforms: {
       css: {
         transformGroup: 'css',
         prefix: 'store',
         buildPath: 'src/styles/generated/',
         files: [
           {
             destination: 'tokens.css',
             format: 'css/variables',
             options: { selector: ':root' },
           },
         ],
       },
       js: {
         transformGroup: 'js',
         buildPath: 'src/styles/generated/',
         files: [
           { destination: 'tokens.js', format: 'javascript/es6' },
         ],
       },
     },
   });

   await sd.buildAllPlatforms();
   ```

   Output: `src/styles/generated/tokens.css`

   ```css
   :root {
     --store-color-brand-primary: #2563eb;
     --store-color-price: #0f172a;
     --store-color-price-sale: #ef4444;
     --store-button-border-radius: 0.375rem;
     /* ... */
   }
   ```

3. **Use semantic tokens in all component styles**

   Components reference only semantic tokens, never global tokens or raw values. This ensures a single-point rebrand.

   ```css
   /* components/button.css */
   .btn-primary {
     background: var(--store-color-brand-primary);
     color: white;
     border-radius: var(--store-button-border-radius);
     font-size: var(--store-font-size-base);
     min-height: 44px;
     padding: 0 var(--store-space-6);
   }

   .btn-primary:hover {
     background: var(--store-color-brand-secondary);
   }

   /* Price display */
   .price { color: var(--store-color-price); }
   .price--sale { color: var(--store-color-price-sale); }
   ```

4. **Implement dark mode**

   Define a dark token set that overrides semantic tokens when `[data-theme="dark"]` is active.

   ```json
   // tokens/dark.json
   {
     "color": {
       "surface":    { "value": "{color.gray-900}" },
       "on-surface": { "value": "{color.gray-50}" },
       "border":     { "value": "#1e293b" }
     }
   }
   ```

   ```css
   /* Generated dark mode overrides */
   [data-theme="dark"] {
     --store-color-surface: #0f172a;
     --store-color-on-surface: #f8fafc;
     --store-color-border: #1e293b;
   }

   @media (prefers-color-scheme: dark) {
     :root:not([data-theme="light"]) {
       --store-color-surface: #0f172a;
       --store-color-on-surface: #f8fafc;
       --store-color-border: #1e293b;
     }
   }
   ```

   ```javascript
   // ThemeToggle.jsx
   export function ThemeToggle() {
     const [theme, setTheme] = useState(
       () => localStorage.getItem('theme') ?? 'system'
     );

     function applyTheme(newTheme) {
       setTheme(newTheme);
       localStorage.setItem('theme', newTheme);
       if (newTheme === 'system') {
         document.documentElement.removeAttribute('data-theme');
       } else {
         document.documentElement.setAttribute('data-theme', newTheme);
       }
     }

     return (
       <button onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
         aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
         {theme === 'dark' ? 'Light' : 'Dark'}
       </button>
     );
   }
   ```

5. **White-label multi-tenant theme injection**

   For SaaS platforms serving multiple tenants, inject tenant-specific token overrides server-side.

   ```javascript
   // middleware/themeInjection.js (Next.js middleware or Express)
   export async function injectTenantTheme(req, res, next) {
     const tenant = await getTenantFromHost(req.hostname);
     if (!tenant?.theme) return next();

     // Serialize tenant token overrides as inline <style>
     const cssOverrides = Object.entries(tenant.theme)
       .map(([token, value]) => `  --store-${token}: ${value};`)
       .join('\n');

     res.locals.themeOverrides = `:root {\n${cssOverrides}\n}`;
     next();
   }

   // In your HTML template / _document.tsx
   // <style>{themeOverrides}</style>  — injected in <head>
   ```

   Example tenant theme record in the database:

   ```json
   {
     "tenantId": "brand-acme",
     "theme": {
       "color-brand-primary": "#e63946",
       "color-brand-secondary": "#457b9d",
       "button-border-radius": "9999px",
       "font-size-base": "1.0625rem"
     }
   }
   ```

## Examples

### Generating Tailwind config from design tokens

If using Tailwind CSS, generate `tailwind.config.js` from your token JSON at build time:

```javascript
// build/generateTailwindConfig.js
import tokens from '../tokens/semantic.json' assert { type: 'json' };

export const themeExtension = {
  colors: {
    brand: {
      primary:   tokens.color['brand-primary'].value,
      secondary: tokens.color['brand-secondary'].value,
    },
    price: tokens.color.price.value,
    'price-sale': tokens.color['price-sale'].value,
  },
  borderRadius: {
    button: tokens.button['border-radius'].value,
  },
};
```

### Token documentation with Storybook

```jsx
// stories/DesignTokens.stories.jsx
export function ColorTokens() {
  const tokens = [
    { name: '--store-color-brand-primary', label: 'Brand Primary', usage: 'CTAs, links' },
    { name: '--store-color-price-sale',    label: 'Sale Price',    usage: 'Discounted price display' },
  ];

  return (
    <table>
      {tokens.map(t => (
        <tr key={t.name}>
          <td><div style={{ background: `var(${t.name})`, width: 40, height: 40, borderRadius: 4 }} /></td>
          <td><code>{t.name}</code></td>
          <td>{t.label}</td>
          <td>{t.usage}</td>
        </tr>
      ))}
    </table>
  );
}
```

## Best Practices

- **Never hard-code colors or sizes in component CSS** — always use semantic tokens; a global find-replace of `#2563eb` is a maintenance nightmare
- **Three-tier token hierarchy** — global (palette) -> semantic (meaning) -> component (specific usage); components consume semantic, semantic references global
- **Keep semantic token names meaning-based** — `--color-brand-primary` not `--color-blue-600`; the hex value may change but the meaning stays
- **Version your token files** — token JSON files are source code; commit them and tag releases so teams can track token changes
- **Test dark mode with real devices** — macOS/iOS and Windows have different default dark behaviors; test both
- **Include token documentation in Storybook** — engineers and designers need a single reference for all available tokens
- **Validate contrast ratios automatically** — run `color-contrast` checks on your semantic token combinations as part of CI

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Token CSS variables have a flash of unstyled content on dark mode | Apply `data-theme` attribute synchronously in a script in `<head>` before the body renders, reading from `localStorage` |
| Tenant theme overrides not applied on first render (SSR) | Inject tenant CSS overrides as an inline `<style>` tag server-side; do not apply them only in `useEffect` |
| Design tokens out of sync between Figma and code | Use a token export plugin (Tokens Studio for Figma) that writes directly to your `tokens/*.json` files |
| Component uses wrong token tier | Lint CSS with `stylelint-declaration-block-no-ignored-properties` and a custom rule that forbids `--store-color-gray-*` (global) in component files |
| White-label CSS injection enables XSS via tenant tokens | Sanitize tenant theme values — only allow CSS color values, rem/px lengths, and border-radius; reject arbitrary strings |

## Related Skills

- @responsive-storefront
- @accessibility-commerce
- @mega-menu-builder
- @product-page-design
