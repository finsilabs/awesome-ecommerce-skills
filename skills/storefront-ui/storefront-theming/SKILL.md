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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Storefront Theming

## Overview

Architect a theming system using design tokens and CSS custom properties that allows a storefront to be re-skinned for multiple brands without modifying component code. Covers the token taxonomy (color, typography, spacing, radius), runtime theme switching for dark mode, and white-label multi-tenant architecture where each tenant supplies their own token overrides.

## When to Use This Skill

- When building a platform that will power multiple branded storefronts from a single codebase
- When implementing dark mode for a storefront
- When a rebrand requires changing colors across thousands of component instances without hunt-and-replace
- When handing off a design system to a team that needs to maintain brand consistency

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Use the Theme Editor's **Color scheme** system + edit `config/settings_schema.json` and `assets/base.css` to add custom CSS variables | Shopify OS2.0 themes expose all brand colors, fonts, and border radii as Theme Editor settings that write to CSS variables automatically; no build step required |
| **WooCommerce** | Use the WordPress **Global Styles** system (WordPress 5.9+) with a block theme, or configure CSS variables in **Appearance → Customize → Additional CSS** for classic themes | Block themes using `theme.json` support a full design token system natively; classic themes need CSS custom properties added manually |
| **BigCommerce** | Configure theme settings in **Storefront → My Themes → Customize** — Cornerstone exposes colors, fonts, and spacing as Theme Editor variables; advanced customization via `config.json` and SCSS | Cornerstone compiles SCSS with Handlebars template variables; custom CSS variables can be added to the global stylesheet |
| **Custom / Headless** | Build a three-tier token system (global → semantic → component) using CSS custom properties, compiled from JSON using Style Dictionary | Full control over token taxonomy, dark mode, and multi-tenant overrides; see implementation below |

### Step 2: Configure theming on your platform

---

#### Shopify

**Using the Theme Editor color system (no code required):**
1. Go to **Online Store → Themes → Customize**
2. Click **Theme settings** (paint bucket icon) in the left panel
3. Under **Colors**, configure your brand's:
   - Primary, secondary, and accent colors
   - Background colors
   - Text colors
   - Button colors and text
4. Under **Typography**, set your font families and sizes
5. Under **Buttons and inputs**, configure border radius for buttons and form fields
6. All changes write to CSS custom properties that every component in the theme uses — no component-level changes needed

**Adding custom CSS variables (for developers extending the theme):**
1. Go to **Online Store → Themes → Edit code**
2. Open `assets/base.css` (Dawn) or equivalent
3. Add your custom variables to the `:root` block, referencing the theme's settings variables:
```css
:root {
  --color-button: {{ settings.color_button.red }}, {{ settings.color_button.green }}, {{ settings.color_button.blue }};
  --font-body-family: {{ settings.type_body_font.family }}, sans-serif;
}
```
4. In your section/component Liquid files, use `var(--color-button)` to reference the merchant-controlled setting

---

#### WooCommerce

**Block themes with theme.json (WordPress 5.9+):**

If you're building a new store with a block theme (like Storefront Blocks or a custom block theme):
1. Open `theme.json` in your theme root
2. Add your design tokens to the `settings.color.palette` and `settings.typography` sections:
```json
{
  "settings": {
    "color": {
      "palette": [
        { "slug": "brand-primary", "color": "#2563eb", "name": "Brand Primary" },
        { "slug": "brand-secondary", "color": "#3b82f6", "name": "Brand Secondary" }
      ]
    },
    "custom": {
      "spacing": { "xs": "0.5rem", "sm": "1rem", "md": "1.5rem" }
    }
  }
}
```
3. WordPress automatically exposes these in the **Global Styles** panel and generates CSS custom properties like `--wp--preset--color--brand-primary`

**Classic themes — CSS variables in Additional CSS:**
1. Go to **Appearance → Customize → Additional CSS**
2. Define your brand variables:
```css
:root {
  --color-primary: #2563eb;
  --color-price-sale: #dc2626;
  --font-size-base: 1rem;
  --border-radius-button: 0.375rem;
}
```
3. Use these variables in your child theme's CSS instead of hard-coded values

---

#### BigCommerce

**Cornerstone theme variables (SCSS-based):**
1. Go to **Storefront → My Themes → Edit Theme Files** (requires a copy of the theme)
2. Open `assets/scss/settings/global/` — Cornerstone organizes variables by category (color, typography, spacing)
3. Modify `_color.scss` to update the brand color palette
4. Open `config.json` in the theme root — this maps Theme Editor controls to SCSS variables:
```json
{
  "settings": {
    "color-primary": "#2563eb",
    "font-size-root": "16px",
    "button-radius": "4px"
  }
}
```
5. In **Storefront → My Themes → Customize**, the Theme Editor reflects these settings for merchant configuration

---

#### Custom / Headless

**Three-tier CSS custom properties system:**
```css
/* 1. Global tokens — the complete palette (never used directly in components) */
:root {
  --blue-600: #2563eb;
  --blue-500: #3b82f6;
  --red-500: #ef4444;
  --green-600: #16a34a;
  --gray-50: #f8fafc;
  --gray-900: #0f172a;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --radius-md: 0.375rem;
}

/* 2. Semantic tokens — meaningful aliases (components consume these) */
:root {
  --color-brand-primary: var(--blue-600);
  --color-brand-secondary: var(--blue-500);
  --color-surface: var(--gray-50);
  --color-on-surface: var(--gray-900);
  --color-price: var(--gray-900);
  --color-price-sale: var(--red-500);
  --color-success: var(--green-600);
}

/* 3. Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-surface: var(--gray-900);
    --color-on-surface: var(--gray-50);
  }
}
[data-theme="dark"] {
  --color-surface: var(--gray-900);
  --color-on-surface: var(--gray-50);
}

/* Components only use semantic tokens */
.btn-primary {
  background: var(--color-brand-primary);
  border-radius: var(--radius-md);
  min-height: 44px;
}
.price--sale { color: var(--color-price-sale); }
```

**Dark mode toggle (stores preference in localStorage):**
```jsx
export function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'system');

  function applyTheme(newTheme) {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', newTheme);
  }

  return (
    <button onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
```

**Prevent dark mode flash (apply before render):**
```html
<!-- In <head>, before any stylesheets -->
<script>
  (function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches))
      document.documentElement.setAttribute('data-theme', 'dark');
  })();
</script>
```

**Multi-tenant white-label (inject per-tenant overrides server-side):**
```javascript
// In your server response, inject tenant CSS overrides in <head>
// so they're applied before the page renders (no flash)
const tenantTheme = await getTenantTheme(req.hostname);
const cssOverrides = tenantTheme
  ? `:root { ${Object.entries(tenantTheme)
      .map(([k, v]) => `--${k}: ${sanitizeCssValue(v)};`)
      .join(' ')} }`
  : '';

// Sanitize to allow only safe CSS value patterns
function sanitizeCssValue(value) {
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value; // hex color
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(value)) return value; // length
  if (/^[a-zA-Z0-9\s,'"]+$/.test(value)) return value; // font names
  return ''; // reject everything else (prevents CSS injection)
}
```

### Step 3: Build a token reference for your team

Regardless of platform, document your tokens so designers and developers stay in sync:

- **Shopify:** The Theme Editor serves as the live token reference — share the Customize URL with your design team
- **WooCommerce:** Document the CSS variable names in a Storybook instance or a simple HTML reference page
- **BigCommerce:** Cornerstone's `config.json` documents available settings; add comments to SCSS files
- **Custom:** Use Style Dictionary to generate a static token documentation page, or document in Storybook

## Best Practices

- **Never hard-code colors in component CSS** — always use semantic tokens; a rebrand that requires global find-replace of `#2563eb` is avoidable
- **Keep semantic token names meaning-based** — `--color-brand-primary` not `--color-blue-600`; the hex value will change but the meaning stays
- **Test dark mode with real devices** — macOS/iOS and Windows have different default dark mode behaviors; test both
- **Validate contrast ratios** — after setting brand colors, verify WCAG contrast ratios (4.5:1 for body text) using WebAIM Contrast Checker
- **Sanitize white-label CSS injections** — only allow hex colors, rem/px lengths, and font names; reject arbitrary strings to prevent CSS injection attacks

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Dark mode causes flash of unstyled content | Apply `data-theme` attribute synchronously in a `<head>` script before stylesheets load |
| Tenant theme overrides not applied on first render | Inject tenant CSS as inline `<style>` tag server-side; do not apply in `useEffect` |
| Design tokens out of sync between Figma and code | Use Tokens Studio for Figma plugin to export directly to your CSS variable / `theme.json` files |
| White-label CSS enables XSS | Sanitize tenant token values to only allow valid CSS color, length, and font-family patterns |
| Rebranding requires changing many files | If you find yourself replacing colors in multiple component files, you skipped the semantic token layer — refactor to semantic tokens first |

## Related Skills

- @responsive-storefront
- @accessibility-commerce
- @mega-menu-builder
- @product-page-design
