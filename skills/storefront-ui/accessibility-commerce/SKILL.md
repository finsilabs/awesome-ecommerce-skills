---
name: accessibility-commerce
description: "WCAG 2.1 AA compliance for e-commerce — screen readers, keyboard nav, ARIA for carts"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [accessibility, wcag, aria, screen-reader, keyboard-navigation, a11y, inclusive-design]
triggers: ["accessibility compliance", "WCAG 2.1", "screen reader support", "keyboard navigation", "ARIA labels", "a11y audit", "ADA compliance"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Accessibility for E-commerce

## Overview

Implement WCAG 2.1 Level AA compliance across core e-commerce flows: product browsing, variant selection, cart management, and checkout. Covers screen reader announcements for dynamic cart updates, keyboard-accessible interactive components (carousels, quantity steppers, modals), focus management after navigation, and color contrast requirements for commerce UI patterns.

## When to Use This Skill

- When an accessibility audit reveals WCAG violations blocking legal compliance (ADA, AODA, EAA)
- When building a new storefront from scratch and baking in accessibility from the start
- When screen reader users report inability to complete purchases
- When keyboard-only users cannot navigate the checkout flow
- When automated tools (axe, WAVE) surface critical issues that need remediation

## Core Instructions

1. **Announce cart updates to screen readers with ARIA live regions**

   When a shopper adds an item to the cart, screen readers need to announce the change without redirecting focus.

   ```jsx
   // CartLiveRegion.jsx — place once at the top of your app
   export function CartLiveRegion({ message }) {
     return (
       <div
         role="status"
         aria-live="polite"
         aria-atomic="true"
         className="sr-only"  /* Visually hidden, readable by screen readers */
       >
         {message}
       </div>
     );
   }

   // Usage: update the message after a successful add-to-cart
   const [cartMessage, setCartMessage] = useState('');

   async function handleAddToCart(product) {
     await addToCart(product);
     setCartMessage(`${product.name} added to cart. Cart total: ${cartCount} items.`);
     // Clear after announcement so the same message can be announced again
     setTimeout(() => setCartMessage(''), 1000);
   }

   return (
     <>
       <CartLiveRegion message={cartMessage} />
       <AddToCartButton onClick={() => handleAddToCart(product)} />
     </>
   );
   ```

   ```css
   /* Visually hidden but accessible to screen readers */
   .sr-only {
     position: absolute;
     width: 1px;
     height: 1px;
     padding: 0;
     margin: -1px;
     overflow: hidden;
     clip: rect(0, 0, 0, 0);
     white-space: nowrap;
     border-width: 0;
   }
   ```

2. **Build an accessible quantity stepper**

   Number inputs in checkout and cart must be usable without a mouse.

   ```jsx
   // QuantityStepper.jsx
   export function QuantityStepper({ value, min = 1, max = 99, onChange, productName }) {
     function decrement() {
       if (value > min) onChange(value - 1);
     }
     function increment() {
       if (value < max) onChange(value + 1);
     }

     return (
       <div className="quantity-stepper" role="group" aria-label={`Quantity for ${productName}`}>
         <button
           type="button"
           onClick={decrement}
           disabled={value <= min}
           aria-label={`Decrease quantity of ${productName}`}
         >
           -
         </button>
         <input
           type="number"
           value={value}
           min={min}
           max={max}
           onChange={e => {
             const num = parseInt(e.target.value);
             if (!isNaN(num) && num >= min && num <= max) onChange(num);
           }}
           aria-label={`Quantity of ${productName}`}
         />
         <button
           type="button"
           onClick={increment}
           disabled={value >= max}
           aria-label={`Increase quantity of ${productName}`}
         >
           +
         </button>
       </div>
     );
   }
   ```

3. **Make variant selectors accessible**

   Color swatches and size buttons must communicate their state and purpose to screen readers.

   ```jsx
   // ColorSwatchGroup.jsx
   export function ColorSwatchGroup({ options, selectedValue, onChange, productName }) {
     return (
       <fieldset>
         <legend>Color: <span className="selected-label">{selectedValue}</span></legend>
         <div className="swatch-list" role="radiogroup">
           {options.map(option => (
             <label
               key={option.value}
               className={`swatch ${selectedValue === option.value ? 'selected' : ''} ${!option.available ? 'unavailable' : ''}`}
               title={option.available ? option.label : `${option.label} — out of stock`}
             >
               <input
                 type="radio"
                 name={`${productName}-color`}
                 value={option.value}
                 checked={selectedValue === option.value}
                 disabled={!option.available}
                 onChange={() => onChange(option.value)}
                 className="sr-only"
               />
               <span
                 className="swatch-visual"
                 style={{ background: option.hex }}
                 aria-hidden="true"
               />
               <span className="sr-only">
                 {option.label}{!option.available ? ' (out of stock)' : ''}
               </span>
             </label>
           ))}
         </div>
       </fieldset>
     );
   }
   ```

4. **Implement focus management for SPAs and modals**

   In single-page applications, route changes must move focus to the new page's heading or main content region.

   ```javascript
   // lib/focusManagement.js

   // Call after each client-side route change
   export function focusPageTitle() {
     // Small delay to let the new content render
     requestAnimationFrame(() => {
       const heading = document.querySelector('main h1, [role="main"] h1');
       if (heading) {
         // Make the heading focusable temporarily
         heading.setAttribute('tabindex', '-1');
         heading.focus({ preventScroll: false });
         heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
       }
     });
   }

   // Call after opening a modal dialog
   export function trapFocus(containerElement) {
     const focusable = containerElement.querySelectorAll(
       'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
     );
     const first = focusable[0];
     const last = focusable[focusable.length - 1];

     containerElement.addEventListener('keydown', (e) => {
       if (e.key !== 'Tab') return;
       if (e.shiftKey) {
         if (document.activeElement === first) { e.preventDefault(); last.focus(); }
       } else {
         if (document.activeElement === last) { e.preventDefault(); first.focus(); }
       }
     });

     first?.focus();
   }
   ```

5. **Ensure sufficient color contrast and visible focus indicators**

   ```css
   /* WCAG AA requires 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold) */

   /* Commerce-specific: price and availability text must meet contrast requirements */
   .price { color: #1a202c; }              /* On white: 18.1:1 — passes AAA */
   .price--sale { color: #c53030; }        /* On white: 4.8:1 — passes AA */
   .badge--out-of-stock { color: #744210; background: #fefcbf; } /* 5.9:1 — passes AA */

   /* Visible focus indicator — never use outline:none without an alternative */
   :focus-visible {
     outline: 3px solid #2b6cb0;
     outline-offset: 2px;
     border-radius: 2px;
   }

   /* Remove focus ring for mouse users only */
   :focus:not(:focus-visible) {
     outline: none;
   }

   /* Ensure interactive elements have a visible focus state in high-contrast mode */
   @media (forced-colors: active) {
     :focus-visible {
       outline: 3px solid ButtonText;
     }
   }
   ```

## Examples

### Accessible product image carousel

```jsx
function ProductCarousel({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);

  function prev() { setActiveIndex(i => (i - 1 + images.length) % images.length); }
  function next() { setActiveIndex(i => (i + 1) % images.length); }

  return (
    <div role="region" aria-label="Product images" aria-roledescription="carousel">
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Image {activeIndex + 1} of {images.length}: {images[activeIndex].alt}
      </div>
      <button onClick={prev} aria-label="Previous image">&#x2039;</button>
      <img src={images[activeIndex].src} alt={images[activeIndex].alt} />
      <button onClick={next} aria-label="Next image">&#x203a;</button>
      <div role="tablist" aria-label="Select image">
        {images.map((img, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={activeIndex === i}
            aria-label={`Image ${i + 1}: ${img.alt}`}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Error messaging in checkout forms

Accessible form validation — errors must be programmatically associated with their inputs:

```jsx
function CheckoutField({ id, label, error, ...props }) {
  const errorId = `${id}-error`;
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

## Best Practices

- **Never remove focus outlines** — only suppress them for mouse users with `:focus:not(:focus-visible)`; keyboard users depend on visible focus
- **Use semantic HTML first** — `<button>` for actions, `<a>` for navigation, `<table>` for tabular data; ARIA cannot fix non-semantic markup
- **Test with a screen reader** — NVDA+Firefox and VoiceOver+Safari are the most common combinations; automated tools catch only ~30-40% of real issues
- **Ensure error messages are announced** — use `role="alert"` for critical errors, or associate errors with inputs via `aria-describedby`
- **Make touch targets at least 44x44px** — WCAG 2.5.5 and 2.5.8 require adequate target sizes; this also benefits motor-impaired mouse users
- **Write descriptive link and button text** — "Add to Cart" alone is fine; "Click here" is not; screen reader users navigate by link text
- **Caption all product videos** — auto-captions are acceptable as a start, but verify accuracy for product names and pricing

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Cart count badge is announced as "3" with no context | Wrap in a span with `aria-label="3 items in cart"` or use `aria-live="polite"` to announce changes with full context |
| Color swatch selection not announced | Use `<input type="radio">` with a `<fieldset>/<legend>` wrapping the swatch group; avoid div/span click handlers |
| Modal focus not trapped | Use the native `<dialog>` element which provides focus trapping for free, or implement the `trapFocus` pattern above |
| Form errors not announced on submit | Add `role="alert"` to error summary or `aria-invalid="true"` + `aria-describedby` on each failing field |
| Autocomplete dropdown not keyboard-navigable | Implement the ARIA combobox pattern with `role="combobox"`, `role="listbox"`, `aria-activedescendant`, and Arrow key handling |

## Related Skills

- @responsive-storefront
- @checkout-flow-optimization
- @mega-menu-builder
- @search-autocomplete
