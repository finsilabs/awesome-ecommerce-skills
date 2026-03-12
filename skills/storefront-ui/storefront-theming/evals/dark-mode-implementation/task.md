# Dark Mode for an Existing Storefront

## Problem/Feature Description

Lumora Shop is an online fashion retailer whose storefront was built with a light theme. Customer research has shown strong demand for a dark mode, and the accessibility team has also flagged that the existing color scheme needs to be systematically managed rather than scattered through individual component files.

The team wants to introduce dark mode support while also ensuring component styles are properly abstracted. The solution should handle the user's operating system preference automatically but also let shoppers manually switch modes and have their preference remembered across sessions. A particularly important requirement from the frontend lead is that there must be no "flash" of the wrong theme when the page first loads — this was a known issue in a competitor's implementation that hurt perceived quality.

The storefront uses a token-based CSS approach where `--store-color-*` variables are defined on `:root`. A small set of component styles and an HTML page are provided for you to work with.

## Output Specification

Produce the following:

1. **Component CSS files** (e.g., `components/button.css`, `components/product-card.css`) that style two or three components. Color and size values must come from CSS custom properties.

2. **A dark mode CSS file** (e.g., `src/styles/dark.css` or equivalent) containing the overrides that activate when dark mode is in effect, covering at minimum surface, text, and border colors.

3. **An HTML page** (`index.html`) that includes the necessary CSS, shows the components, and correctly initializes the theme on page load without a flash of the wrong colors.

4. **A theme toggle component or script** (e.g., `ThemeToggle.jsx` or `theme-toggle.js`) that allows the user to switch between modes and persists their choice.

5. A `NOTES.md` briefly describing your approach to the theme switching mechanism and how you prevent the flash of unstyled content.

## Input Files

The following base token CSS is provided. Extract it before beginning.

=============== FILE: src/styles/tokens.css ===============
:root {
  --store-color-brand-primary: #2563eb;
  --store-color-brand-secondary: #3b82f6;
  --store-color-surface: #f8fafc;
  --store-color-on-surface: #0f172a;
  --store-color-price: #0f172a;
  --store-color-price-sale: #ef4444;
  --store-color-success: #16a34a;
  --store-color-border: #f1f5f9;
  --store-button-border-radius: 0.375rem;
  --store-font-size-base: 1rem;
  --store-font-size-sm: 0.875rem;
  --store-space-4: 1rem;
  --store-space-6: 1.5rem;
}
