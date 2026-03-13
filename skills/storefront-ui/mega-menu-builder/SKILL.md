---
name: mega-menu-builder
description: "Build a rich navigation mega menu with product images, category highlights, featured banners, and keyboard-accessible dropdowns for large catalogs"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [navigation, mega-menu, cms, categories, banners, accessibility, keyboard-nav]
triggers: ["build mega menu", "navigation menu", "category menu with images", "featured products in nav", "promotional banner in menu"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: beginner
---

# Mega Menu Builder

## Overview

Build a horizontal navigation bar that expands into full-width panels containing category columns, featured product cards, and promotional banners. The mega menu is driven by content manageable in your platform's admin, supports keyboard navigation and screen readers, and degrades gracefully to a mobile hamburger drawer.

## When to Use This Skill

- When a store has 3+ top-level categories, each with significant sub-categories
- When the navigation needs to surface promotional content (seasonal banners, featured products) alongside category links
- When rebuilding navigation as part of a storefront redesign
- When the current dropdown menu is not accessible to keyboard or screen reader users
- When navigation content needs to be managed by a merchandiser without code deploys

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Configure nested menus in **Navigation** admin + use an OS2.0 theme that supports mega menus (Impulse, Empire, Prestige) or install **Meteor Mega Menu** app | Shopify's Navigation admin supports 3-level menus; premium themes like Impulse include built-in mega menu sections with image and banner support |
| **WooCommerce** | Use **Max Mega Menu** plugin (free/pro) or **WP Mega Menu** with your existing WordPress theme | Max Mega Menu integrates with any WordPress theme, adds image widgets and custom content to any menu item, and works with Elementor and Gutenberg |
| **BigCommerce** | Use **Header & Navigation** section in the Theme Editor with a theme that supports mega menus (Cornerstone Advanced, Merchant); or install **Shogun** page builder which includes mega menu blocks | BigCommerce themes vary in mega menu support; Cornerstone Advanced has a built-in mega menu; Shogun adds it to any theme |
| **Custom / Headless** | Build a data-driven mega menu component with hover/focus open logic, keyboard navigation (arrow keys, Escape), and a mobile accordion drawer | Full control over content model, animations, and accessibility patterns; see implementation below |

### Step 2: Set up navigation content

---

#### Shopify

**Configuring nested navigation:**

1. Go to **Online Store → Navigation**
2. Open your **Main menu** (or create one)
3. For each top-level item that needs a mega panel, click **Add menu item** and nest sub-items under it using the indent controls
4. Shopify supports up to 3 levels of nesting (top → category → sub-category)
5. Save the menu

**Enabling mega menu in a compatible theme:**

If using a theme with built-in mega menu support (Impulse, Prestige, Empire):
1. Go to **Online Store → Themes → Customize**
2. Navigate to the **Header** section
3. Under **Mega menu settings**, select which top-level nav items should trigger the mega panel vs. a simple dropdown
4. For each mega panel, add image blocks, featured product blocks, and promotional banner blocks using the section editor

**Using Meteor Mega Menu app (works with any Shopify theme):**
1. Install from the Shopify App Store
2. In the app, select which menu items get mega panels
3. For each panel, add columns of links, product cards (pulled from your Shopify catalog), and image/banner blocks
4. The app injects the mega menu into your theme without editing theme code

---

#### WooCommerce

**Using Max Mega Menu (free tier):**
1. Install **Max Mega Menu** from WordPress.org
2. Go to **Appearance → Menus** and open your primary navigation menu
3. Enable Max Mega Menu for this menu via the **Max Mega Menu Settings** panel
4. For each top-level menu item that should have a mega panel:
   - Click the **Mega Menu** toggle on the item
   - Select the panel layout (e.g., 3 columns)
5. In each column, add menu items, widgets (images, HTML, WooCommerce product widgets), or text blocks
6. Go to **Appearance → Max Mega Menu → Appearance** to set the panel width to full-width and configure hover behavior

**Integrating with Elementor:**
If your store uses Elementor, install **Happy Addons** or **ElementsKit** — both include a drag-and-drop mega menu builder that works within Elementor's visual editor.

---

#### BigCommerce

**Cornerstone Advanced theme:**
1. Go to **Storefront → My Themes → Customize**
2. In the **Header** section, find **Navigation style** and set it to **Mega Menu**
3. For each top-level category, you can add a featured image and banner in the **Category** settings (**Products → Categories → [category] → Image**)
4. BigCommerce automatically populates the mega panel with sub-categories; the theme renders them in a multi-column layout

**Shogun page builder:**
1. Install Shogun from the BigCommerce App Marketplace
2. Use Shogun's **Header** component to build a custom mega menu with full drag-and-drop control over columns, images, and links
3. Publish the header globally across all pages

---

#### Custom / Headless

**Navigation component with hover/focus open logic:**
```jsx
// MegaNav.jsx
import { useState, useRef } from 'react';

export function MegaNav({ items }) {
  const [activeItem, setActiveItem] = useState(null);
  const closeTimer = useRef(null);

  function openMenu(id) { clearTimeout(closeTimer.current); setActiveItem(id); }
  function scheduleClose() { closeTimer.current = setTimeout(() => setActiveItem(null), 150); }
  function cancelClose() { clearTimeout(closeTimer.current); }

  return (
    <nav aria-label="Main navigation">
      <ul role="menubar" className="nav-bar">
        {items.map(item => (
          <li key={item.id} role="none"
              onMouseEnter={() => item.megaMenu && openMenu(item.id)}
              onMouseLeave={scheduleClose}>
            <a href={item.url} role="menuitem"
               aria-haspopup={item.megaMenu ? 'true' : undefined}
               aria-expanded={activeItem === item.id ? 'true' : undefined}
               onFocus={() => item.megaMenu && openMenu(item.id)}
               onKeyDown={(e) => {
                 if ((e.key === 'ArrowDown' || e.key === 'Enter') && item.megaMenu) {
                   e.preventDefault();
                   openMenu(item.id);
                   document.querySelector(`#panel-${item.id} a`)?.focus();
                 }
                 if (e.key === 'Escape') setActiveItem(null);
               }}>
              {item.label}
            </a>
            {item.megaMenu && activeItem === item.id && (
              <MegaPanel id={`panel-${item.id}`} panel={item.megaMenu}
                onMouseEnter={cancelClose} onMouseLeave={scheduleClose}
                onClose={() => setActiveItem(null)} />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

**Mega panel layout (columns + featured products + banner):**
```jsx
function MegaPanel({ id, panel, onMouseEnter, onMouseLeave, onClose }) {
  return (
    <div id={id} className="mega-panel" role="region"
         onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="mega-panel-inner">
        <div className="mega-columns">
          {panel.columns.map(col => (
            <div key={col.heading} className="mega-column">
              <p className="column-heading">{col.heading}</p>
              <ul>
                {col.links.map(link => (
                  <li key={link.url}><a href={link.url} onClick={onClose}>{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {panel.banner && (
          <a href={panel.banner.url} className="mega-banner" onClick={onClose}>
            <img src={panel.banner.image} alt={panel.banner.alt} loading="lazy" />
            <span className="banner-cta">{panel.banner.cta}</span>
          </a>
        )}
      </div>
    </div>
  );
}
```

```css
.mega-panel {
  position: absolute; top: 100%; left: 0; width: 100vw;
  background: #fff; border-top: 2px solid #e2e8f0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 100;
}
.mega-panel-inner {
  display: grid; grid-template-columns: 1fr 1fr 1fr 200px;
  gap: 2rem; max-width: 1200px; margin: 0 auto; padding: 2rem;
}
@media (max-width: 768px) { .mega-panel { display: none; } }
```

### Step 3: Set up the mobile hamburger drawer

All platforms need a touch-friendly mobile navigation to replace the desktop mega menu:

- **Shopify:** Modern OS2.0 themes include a built-in mobile drawer — configure it in **Online Store → Themes → Customize → Mobile Menu**
- **WooCommerce:** Max Mega Menu has a built-in mobile mode that converts the mega menu to an accordion drawer; configure in **Appearance → Max Mega Menu → Mobile Menu**
- **BigCommerce:** Cornerstone's mobile navigation drawer is built in; configure the hamburger button position in the Theme Editor
- **Custom:** Build a `<dialog>` or `position:fixed` side drawer with accordion-style category expansion; apply `overflow:hidden` to `<body>` when open

## Best Practices

- **Drive menu content from the CMS/admin** — merchandisers should update banners and featured products without engineering help
- **Use a 150 ms close delay** — prevents the panel from disappearing when the cursor briefly leaves the nav while moving toward the panel
- **Position the panel with `position:absolute` on the nav bar** — not on the individual list item, so the panel spans full viewport width
- **Lazy-load panel images** — featured product and banner images should use `loading="lazy"` since they are not above the fold
- **Test on touch devices** — hover events do not fire on iOS/Android; mega menu apps and plugins handle this; for custom builds, use tap-to-open for top-level items on touch

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Panel closes when moving cursor diagonally from nav item to panel | Use a 150–200 ms `setTimeout` delay before closing; cancel it when cursor enters the panel |
| Keyboard users cannot reach panel links | Use `aria-haspopup` and `aria-expanded`; move focus into the panel on Enter/Space/ArrowDown |
| Mobile drawer scrolls the body behind it | Apply `overflow:hidden` to `<body>` when drawer is open; restore on close |
| Banner images cause layout shift | Set explicit `width` and `height` attributes on banner `<img>` elements |
| Nav overlaps sticky content on scroll | Set `position:sticky; top:0; z-index:50` on the nav; give the mega panel `z-index:100` |

## Related Skills

- @responsive-storefront
- @accessibility-commerce
- @product-categorization
- @storefront-theming
