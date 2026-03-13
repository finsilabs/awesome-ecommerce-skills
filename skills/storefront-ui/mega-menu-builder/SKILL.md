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
platforms: [platform-agnostic]
difficulty: beginner
---

# Mega Menu Builder

## Overview

Build a horizontal navigation bar that expands into full-width panels containing category columns, featured product cards, and promotional banners. The mega menu is driven by a structured data model managed in a CMS or admin UI, supports keyboard navigation and screen readers, and degrades gracefully to a mobile hamburger drawer.

## When to Use This Skill

- When a store has 3+ top-level categories, each with significant sub-categories
- When the navigation needs to surface promotional content (seasonal banners, featured products) alongside category links
- When rebuilding navigation as part of a storefront redesign
- When the current dropdown menu is not accessible to keyboard or screen reader users
- When navigation content needs to be managed by a merchandiser without code deploys

## Prerequisites & Platform Notes

**Shopify**: Build with Shopify themes (Liquid), Shopify Hydrogen (React), or headless with the Storefront API. These component patterns work in any React-based Shopify setup.
**WooCommerce**: Build with WooCommerce Blocks (React), classic PHP themes, or headless with WooCommerce REST API. These patterns apply to block-based or headless storefronts.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A storefront codebase (theme, Hydrogen app, or headless frontend)

## Core Instructions

1. **Define the navigation data model**

   Store the menu structure as JSON in your CMS or database. Each top-level item can have columns of links, featured products, and a banner slot.

   ```javascript
   // Example navigation data structure
   const navigationData = [
     {
       id: 'womens',
       label: "Women's",
       url: '/collections/womens',
       megaMenu: {
         columns: [
           {
             heading: 'Clothing',
             links: [
               { label: 'Tops', url: '/collections/womens-tops' },
               { label: 'Bottoms', url: '/collections/womens-bottoms' },
               { label: 'Dresses', url: '/collections/womens-dresses' },
               { label: 'Activewear', url: '/collections/womens-activewear' },
             ],
           },
           {
             heading: 'Shoes',
             links: [
               { label: 'Sneakers', url: '/collections/womens-sneakers' },
               { label: 'Boots', url: '/collections/womens-boots' },
               { label: 'Sandals', url: '/collections/womens-sandals' },
             ],
           },
         ],
         featuredProducts: [
           { id: 'prod_001', name: 'Summer Dress', price: 89, image: '/images/summer-dress.jpg', url: '/products/summer-dress' },
         ],
         banner: {
           image: '/images/nav-banner-womens.jpg',
           alt: 'New summer collection',
           url: '/collections/summer-2026',
           headline: 'Summer Collection',
           cta: 'Shop Now',
         },
       },
     },
     {
       id: 'mens',
       label: "Men's",
       url: '/collections/mens',
       megaMenu: null, // Simple link — no mega panel
     },
   ];
   ```

2. **Build the navigation bar component**

   ```jsx
   // MegaNav.jsx
   import { useState, useRef } from 'react';

   export function MegaNav({ items }) {
     const [activeItem, setActiveItem] = useState(null);
     const closeTimer = useRef(null);

     function openMenu(id) {
       clearTimeout(closeTimer.current);
       setActiveItem(id);
     }

     function scheduleClose() {
       closeTimer.current = setTimeout(() => setActiveItem(null), 150);
     }

     function cancelClose() {
       clearTimeout(closeTimer.current);
     }

     return (
       <nav aria-label="Main navigation">
         <ul role="menubar" className="nav-bar">
           {items.map(item => (
             <li key={item.id} role="none"
                 onMouseEnter={() => item.megaMenu && openMenu(item.id)}
                 onMouseLeave={scheduleClose}>
               <a
                 href={item.url}
                 role="menuitem"
                 aria-haspopup={item.megaMenu ? 'true' : undefined}
                 aria-expanded={activeItem === item.id ? 'true' : undefined}
                 onFocus={() => item.megaMenu && openMenu(item.id)}
               >
                 {item.label}
               </a>
               {item.megaMenu && activeItem === item.id && (
                 <MegaPanel
                   panel={item.megaMenu}
                   onMouseEnter={cancelClose}
                   onMouseLeave={scheduleClose}
                   onClose={() => setActiveItem(null)}
                 />
               )}
             </li>
           ))}
         </ul>
       </nav>
     );
   }
   ```

3. **Build the mega panel with columns, products, and banner**

   ```jsx
   // MegaPanel.jsx
   export function MegaPanel({ panel, onMouseEnter, onMouseLeave, onClose }) {
     return (
       <div
         className="mega-panel"
         role="region"
         onMouseEnter={onMouseEnter}
         onMouseLeave={onMouseLeave}
       >
         <div className="mega-panel-inner">
           {/* Category columns */}
           <div className="mega-columns">
             {panel.columns.map(col => (
               <div key={col.heading} className="mega-column">
                 <p className="column-heading">{col.heading}</p>
                 <ul>
                   {col.links.map(link => (
                     <li key={link.url}>
                       <a href={link.url} onClick={onClose}>{link.label}</a>
                     </li>
                   ))}
                 </ul>
               </div>
             ))}
           </div>

           {/* Featured products */}
           {panel.featuredProducts?.length > 0 && (
             <div className="mega-featured">
               <p className="column-heading">Featured</p>
               {panel.featuredProducts.map(product => (
                 <a key={product.id} href={product.url} className="featured-product" onClick={onClose}>
                   <img src={product.image} alt={product.name} width="80" height="80" />
                   <span className="featured-name">{product.name}</span>
                   <span className="featured-price">${product.price}</span>
                 </a>
               ))}
             </div>
           )}

           {/* Promotional banner */}
           {panel.banner && (
             <div className="mega-banner">
               <a href={panel.banner.url} onClick={onClose}>
                 <img src={panel.banner.image} alt={panel.banner.alt} />
                 <div className="banner-overlay">
                   <p>{panel.banner.headline}</p>
                   <span className="banner-cta">{panel.banner.cta}</span>
                 </div>
               </a>
             </div>
           )}
         </div>
       </div>
     );
   }
   ```

4. **Add full keyboard navigation**

   Implement arrow key navigation per the ARIA menu pattern: Arrow Down opens the panel, Arrow Right/Left moves between top-level items, Escape closes.

   ```javascript
   // Add to each top-level menu item's anchor
   function handleTopLevelKeyDown(e, item, index, allItems) {
     switch (e.key) {
       case 'ArrowDown':
       case 'Enter':
       case ' ':
         if (item.megaMenu) {
           e.preventDefault();
           openMenu(item.id);
           // Focus first link in panel
           document.querySelector(`#panel-${item.id} a`)?.focus();
         }
         break;
       case 'ArrowRight':
         e.preventDefault();
         allItems[(index + 1) % allItems.length].ref.focus();
         break;
       case 'ArrowLeft':
         e.preventDefault();
         allItems[(index - 1 + allItems.length) % allItems.length].ref.focus();
         break;
       case 'Escape':
         setActiveItem(null);
         break;
     }
   }
   ```

5. **Build the mobile hamburger drawer**

   On small screens, replace the horizontal nav with a side drawer that uses accordion-style category expansion.

   ```jsx
   // MobileNav.jsx
   export function MobileNav({ items }) {
     const [isOpen, setIsOpen] = useState(false);
     const [expandedItem, setExpandedItem] = useState(null);

     return (
       <>
         <button
           aria-expanded={isOpen}
           aria-controls="mobile-nav-drawer"
           aria-label={isOpen ? 'Close menu' : 'Open menu'}
           onClick={() => setIsOpen(o => !o)}
           className="hamburger"
         >
           <span className="hamburger-bar" />
           <span className="hamburger-bar" />
           <span className="hamburger-bar" />
         </button>

         {isOpen && (
           <div
             id="mobile-nav-drawer"
             className="mobile-drawer"
             role="dialog"
             aria-label="Navigation menu"
             aria-modal="true"
           >
             <nav>
               <ul>
                 {items.map(item => (
                   <li key={item.id}>
                     {item.megaMenu ? (
                       <>
                         <button
                           aria-expanded={expandedItem === item.id}
                           aria-controls={`mobile-sub-${item.id}`}
                           onClick={() => setExpandedItem(e => e === item.id ? null : item.id)}
                         >
                           {item.label}
                         </button>
                         {expandedItem === item.id && (
                           <ul id={`mobile-sub-${item.id}`}>
                             {item.megaMenu.columns.flatMap(col => col.links).map(link => (
                               <li key={link.url}>
                                 <a href={link.url} onClick={() => setIsOpen(false)}>{link.label}</a>
                               </li>
                             ))}
                           </ul>
                         )}
                       </>
                     ) : (
                       <a href={item.url}>{item.label}</a>
                     )}
                   </li>
                 ))}
               </ul>
             </nav>
           </div>
         )}
       </>
     );
   }
   ```

## Examples

### CSS for the full-width mega panel

```css
.mega-panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100vw;
  background: #fff;
  border-top: 2px solid #e2e8f0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 100;
}

.mega-panel-inner {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 200px;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 768px) {
  .mega-panel { display: none; } /* replaced by mobile drawer */
}
```

### Fetching navigation data from a headless CMS

```javascript
// lib/navigation.js
export async function getNavigationData() {
  const response = await fetch('https://your-cms.io/api/navigation/main', {
    next: { revalidate: 300 }, // Re-validate every 5 minutes (Next.js)
  });
  return response.json();
}
```

## Best Practices

- **Drive menu content from a CMS** — merchandisers should be able to update banners and featured products without engineer involvement
- **Use a 150 ms close delay** — prevents the panel from disappearing when the cursor briefly leaves the nav bar while moving to the panel
- **Position the panel with `position:absolute` on the nav bar** — not on the individual list item, so the panel spans the full viewport width
- **Trap focus in mobile drawer** — when the mobile drawer is open, Tab should cycle only within the drawer; close on Escape
- **Avoid hover-only interactions** — all mega menu functionality must also work via keyboard and touch
- **Lazy-load panel images** — featured product images and banner images should use `loading="lazy"` since they are not above-the-fold
- **Test on touch devices** — hover events do not fire on iOS/Android; use `touchstart` or a tap-to-open approach for the top-level items

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Panel closes when moving cursor diagonally from nav item to panel | Use a short `setTimeout` delay before closing (150-200 ms); cancel it if cursor enters the panel |
| Keyboard users cannot reach panel links | Use `aria-haspopup` and `aria-expanded`, and move focus into the panel on Enter/Space/ArrowDown |
| Mobile drawer scrolls the body behind it | Apply `overflow:hidden` to `<body>` when drawer is open; restore on close |
| Banner images cause layout shift | Set explicit `width` and `height` attributes on banner `<img>` elements so the browser reserves space |
| Nav overlaps sticky content on scroll | Set `position:sticky; top:0; z-index:50` on the nav; give the mega panel `z-index:100` |

## Related Skills

- @responsive-storefront
- @accessibility-commerce
- @product-categorization
- @storefront-theming
