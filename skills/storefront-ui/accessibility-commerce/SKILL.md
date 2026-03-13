---
name: accessibility-commerce
description: "Make your store usable by everyone with WCAG 2.1 AA compliance — screen reader support, keyboard navigation, and accessible cart and checkout flows"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [accessibility, wcag, aria, screen-reader, keyboard-navigation, a11y, inclusive-design]
triggers: ["accessibility compliance", "WCAG 2.1", "screen reader support", "keyboard navigation", "ARIA labels", "a11y audit", "ADA compliance"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Accessibility for E-commerce

## Overview

WCAG 2.1 Level AA compliance covers screen reader announcements for dynamic cart updates, keyboard navigation for interactive components (carousels, quantity steppers, modals), focus management, and color contrast requirements. Accessible stores reduce legal risk under ADA, AODA, and EAA, and typically convert better across all users.

## When to Use This Skill

- When an accessibility audit reveals WCAG violations blocking legal compliance (ADA, AODA, EAA)
- When screen reader users report inability to complete purchases
- When keyboard-only users cannot navigate the checkout flow
- When automated tools (axe, WAVE) surface critical issues that need remediation
- When building a new storefront and baking in accessibility from the start

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Use a WCAG-compliant theme (Dawn, Sense) from the Theme Store; install AccessiBe or EqualWeb app for automated overlays; edit Liquid for custom fixes | Shopify's built-in themes have improved a11y significantly; theme editor + Liquid edits handle most issues |
| **WooCommerce** | Choose an accessible theme (Astra, Kadence); install WP Accessibility plugin (free) for skip links, ARIA roles, and form labels | WP Accessibility adds critical fixes without code; Gutenberg blocks have reasonable built-in accessibility |
| **BigCommerce** | Use Cornerstone theme (most accessible); enable the built-in accessibility checker in the Theme Editor; install ADA accessibility apps from the marketplace | Cornerstone meets most WCAG AA requirements out of the box |
| **Custom / Headless** | Implement ARIA patterns manually using the techniques in Step 4; test with NVDA+Firefox and VoiceOver+Safari | Full control requires full responsibility — use the component patterns below |

### Step 2: Run an accessibility audit

Before making changes, identify what needs fixing:

1. **Automated scan**: Run [axe DevTools](https://www.deque.com/axe/) browser extension on your homepage, product page, cart, and checkout
2. **WAVE tool**: Visit [wave.webaim.org](https://wave.webaim.org) and scan your store URL
3. **Keyboard test**: Tab through your entire checkout without a mouse — every interactive element must be reachable and operable
4. **Screen reader test**: Test with VoiceOver (Mac/iOS) or NVDA (Windows/Firefox) — navigate your product listing and complete a purchase

Common issues found on most stores:
- Images without meaningful alt text
- Color-only indicators (e.g., red "out of stock" with no text)
- Form fields without labels
- Modals that don't trap focus or respond to Escape
- Add-to-cart buttons that don't announce success to screen readers

### Step 3: Platform-specific fixes

---

#### Shopify

**Theme-level fixes (no code required):**
1. Go to **Online Store → Themes → Customize**
2. Set alt text on all images: **Products → Media → Edit alt text**
3. Under **Theme settings → Typography**, ensure font sizes are at least 16px for body text
4. Enable **Skip to content** link in **Header settings** (available in Dawn and most modern themes)

**Liquid code fixes for custom themes:**

Add ARIA live region for cart updates — edit your `cart-notification.liquid` or equivalent snippet:
```liquid
<div aria-live="polite" aria-atomic="true" class="sr-only" id="cart-live-region">
  {{ cart.item_count }} items in cart
</div>
```

For color swatches in variant selectors, wrap in a `<fieldset>` with `<legend>`:
```liquid
<fieldset>
  <legend>{{ option.name }}: <span>{{ selected_value }}</span></legend>
  {% for value in option.values %}
    <label class="swatch {% if forloop.first %}selected{% endif %}">
      <input type="radio" name="{{ option.name }}" value="{{ value }}"
             {% if value == selected_value %}checked{% endif %} />
      <span class="sr-only">{{ value }}</span>
      <span class="swatch-color" style="background-color: {{ value | downcase }}" aria-hidden="true"></span>
    </label>
  {% endfor %}
</fieldset>
```

**App options:**
- **AccessiBe** (Shopify App Store, ~$49/mo) — automated WCAG 2.1 AA overlay; adds screen reader adjustments and keyboard navigation without theme edits
- **EqualWeb** — similar overlay approach with a free tier

---

#### WooCommerce

**Plugin-based fixes:**
1. Install **WP Accessibility** (free, wordpress.org) — adds skip navigation links, ARIA landmarks, removes title attributes from links, and fixes form labels
2. Install **Accessibility Suite for WooCommerce** — adds ARIA labels to cart and checkout elements automatically

**Theme-based fixes:**
- Use **Astra** or **Kadence** theme — both have strong WCAG AA coverage built in
- In **Appearance → Customize → Typography**, set base font size to 16px minimum

**Manual fixes for WooCommerce checkout fields** — add to your child theme's `functions.php`:
```php
// Associate checkout field labels with inputs
add_filter('woocommerce_checkout_fields', function($fields) {
    foreach ($fields as $fieldset => &$fieldset_fields) {
        foreach ($fieldset_fields as $key => &$field) {
            if (!isset($field['label'])) {
                $field['label'] = ucfirst(str_replace('_', ' ', $key));
            }
        }
    }
    return $fields;
});
```

---

#### BigCommerce

1. **Start with Cornerstone theme** — it has the best baseline accessibility of all BigCommerce themes
2. Go to **Storefront → My Themes → Customize** and enable the accessibility settings panel
3. For color contrast: in Theme Editor, set button background color with sufficient contrast against white text (minimum 4.5:1 ratio)
4. Install an accessibility app from the **BigCommerce App Marketplace** (search "accessibility") for overlay-style fixes

---

#### Custom / Headless

Implement these patterns in your React/Vue/Svelte components:

**ARIA live region for cart updates:**
```jsx
// Place once at the app root; update message after add-to-cart
export function CartLiveRegion({ message }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true"
         style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
      {message}
    </div>
  );
}
```

**Accessible variant selector using radio inputs:**
```jsx
<fieldset>
  <legend>Color: <strong>{selectedColor}</strong></legend>
  {colors.map(color => (
    <label key={color.value} className={`swatch ${!color.available ? 'unavailable' : ''}`}>
      <input type="radio" name="color" value={color.value}
             checked={selectedColor === color.value}
             disabled={!color.available}
             onChange={() => onColorChange(color.value)}
             className="sr-only" />
      <span className="swatch-visual" style={{ background: color.hex }} aria-hidden="true" />
      <span className="sr-only">{color.label}{!color.available ? ' (out of stock)' : ''}</span>
    </label>
  ))}
</fieldset>
```

**Focus management for modals** — use native `<dialog>` which handles focus trapping automatically:
```jsx
const dialogRef = useRef(null);
useEffect(() => {
  if (isOpen) dialogRef.current.showModal();
  else dialogRef.current.close();
}, [isOpen]);

return (
  <dialog ref={dialogRef} onClose={onClose}>
    {/* focus is automatically trapped inside <dialog> */}
    <button onClick={onClose} aria-label="Close">×</button>
    {children}
  </dialog>
);
```

**Visible focus indicators (never remove outlines):**
```css
:focus-visible {
  outline: 3px solid #2b6cb0;
  outline-offset: 2px;
}
:focus:not(:focus-visible) { outline: none; }
```

### Step 4: Validate and test

1. Re-run the axe scan after changes and verify critical and serious violations are resolved
2. Test keyboard navigation: Tab → all interactive elements reachable; Enter/Space → activates buttons; Escape → closes modals
3. Test with VoiceOver (Mac): `Cmd + F5` to enable, navigate using `Tab` and arrow keys; verify cart updates are announced
4. Check color contrast with the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — body text needs 4.5:1, large text 3:1

## Best Practices

- **Never remove focus outlines** — only suppress them for mouse users with `:focus:not(:focus-visible)` so keyboard users retain visible focus
- **Use semantic HTML first** — `<button>` for actions, `<a>` for navigation, `<table>` for tabular data; ARIA attributes cannot fix non-semantic markup
- **Test with a real screen reader** — automated tools catch only 30-40% of real issues; NVDA+Firefox and VoiceOver+Safari are the most common combinations
- **Make touch targets at least 44×44px** — this also benefits motor-impaired mouse users
- **Write descriptive button text** — "Add to Cart" is fine; "Click here" is not; screen reader users navigate by button and link text
- **Caption all product videos** — use auto-captions as a starting point but verify accuracy for product names and pricing

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Cart count badge announced as "3" with no context | Wrap in `aria-label="3 items in cart"` or use `aria-live="polite"` region that announces changes with full context |
| Color swatch selection not announced | Use `<input type="radio">` with `<fieldset>/<legend>` wrapping the swatch group; div/span click handlers are invisible to screen readers |
| Modal focus not trapped | Use the native `<dialog>` element (96%+ browser support) which provides focus trapping for free |
| Form errors not announced | Add `role="alert"` to error summary or `aria-invalid="true"` + `aria-describedby` on each failing field |
| Overlay accessibility apps cause conflicts | Test thoroughly after installing any overlay app — they sometimes break custom theme JavaScript; validate with axe before and after |

## Related Skills

- @responsive-storefront
- @checkout-flow-optimization
- @mega-menu-builder
- @search-autocomplete
