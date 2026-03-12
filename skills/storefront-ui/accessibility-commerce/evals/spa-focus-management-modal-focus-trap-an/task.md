# Keyboard Navigation Overhaul for a React Storefront

## Problem/Feature Description

A React e-commerce storefront uses client-side routing (React Router) and features a quick-view modal that pops up when shoppers click a product card. Keyboard and screen reader users have filed multiple support tickets: after clicking a navigation link the screen reader stays on the link they just activated instead of announcing the new page; and when the quick-view modal opens, pressing Tab escapes the modal and reaches content behind it, while Escape does nothing. A third complaint is that the CSS reset removed all browser focus outlines and no replacement was added, making keyboard navigation invisible.

You have been asked to produce the utility code and CSS that fixes all three issues and integrates them into the storefront. The store is built with React, so solutions should be React-compatible (hooks, refs, useEffect are all fine).

## Output Specification

Produce the following files:

- `lib/focusManagement.js` — focus utility functions for route changes and modal focus trapping
- `hooks/useFocusOnRouteChange.js` — a React hook that calls the route-change focus utility (can use a dummy route parameter to simulate a route change trigger)
- `Modal.jsx` — a modal dialog component that uses the focus trap utility; it should accept `isOpen`, `onClose`, and `children` props; render at least two focusable elements inside (e.g. a heading, a close button, and a sample action button)
- `global.css` — global CSS that provides visible focus indicators for keyboard users while suppressing the ring for mouse users, including support for Windows High Contrast mode

The files do not need a running dev server — they should be static source files that demonstrate the patterns clearly and consistently.
