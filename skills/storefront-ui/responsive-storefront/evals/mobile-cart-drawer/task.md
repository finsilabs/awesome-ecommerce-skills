# Mobile-Optimized Cart Drawer

## Problem/Feature Description

Bloom Home, a home goods retailer, is rebuilding their cart experience after discovering that mobile users are abandoning their cart at twice the rate of desktop users. User testing revealed several pain points: the cart panel slides in from the side on phones, making it feel like a desktop pattern forced onto a small screen; users accidentally trigger page scrolling instead of scrolling the cart list; the checkout button disappears behind the iPhone home indicator; and tapping outside the cart is unreliable.

The engineering team wants a cart drawer component that feels comfortable on both mobile and desktop. Mobile users in testing kept accidentally triggering page scroll when they meant to scroll within the cart list, and the checkout button was obscured behind the phone's system UI at the bottom of the screen. On desktop, users expect the familiar right-side panel layout. The component must lock the underlying page from scrolling when the cart is open, and support standard cart contents: a scrollable list of items with quantity controls and a checkout button.

The storefront already uses a React codebase. The page also needs a hero banner image at the top that serves different crops for mobile versus desktop browsers, loaded efficiently.

## Output Specification

Produce the following files:
- `CartDrawer.jsx` — React component for the cart drawer with open/close behavior and body scroll locking
- `CartDrawer.css` — all CSS for the drawer including responsive layout, open/close transitions, and checkout button positioning
- `HeroBanner.jsx` — a React component rendering a responsive hero image with art direction for mobile vs desktop
- `implementation-notes.md` — brief notes covering the mobile vs desktop layout switch, scroll locking approach, and image art direction technique

The component should accept props: `isOpen` (boolean), `onClose` (function), `items` (array of `{id, name, price, quantity}`), `onCheckout` (function). Use placeholder image paths in HeroBanner — no actual image files are needed.
