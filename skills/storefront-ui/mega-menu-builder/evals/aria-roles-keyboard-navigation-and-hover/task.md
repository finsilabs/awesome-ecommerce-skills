# Accessibility Audit and Fix for a Storefront Navigation Bar

## Problem/Feature Description

A fashion e-commerce startup recently launched their site and received a failing score on an automated accessibility audit. Their primary complaint from assistive technology users is that the navigation dropdown menus are completely unreachable by keyboard — only mouse users can open them. The QA team also flagged that screen readers announce the nav structure incorrectly, with no indication that items have expandable sub-panels.

You have been handed their existing navigation component (provided below) and asked to bring it up to WCAG 2.1 AA. Specifically: screen readers must understand the menu structure and expansion state, keyboard users must be able to navigate between top-level items and open/close panels using standard keys, and the component must handle the close-on-move-away behavior cleanly without panels flickering when the cursor travels diagonally toward the panel.

## Output Specification

Produce the following files:

- `MegaNav.jsx` — the corrected navigation bar component with full keyboard support and correct ARIA attributes
- `accessibility-notes.md` — a brief document listing each change you made and the specific ARIA or keyboard pattern it addresses

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/MegaNav.jsx ===============
import { useState } from 'react';
import MegaPanel from './MegaPanel';

// ACCESSIBILITY ISSUES: This component has multiple a11y problems to fix.
export function MegaNav({ items }) {
  const [activeItem, setActiveItem] = useState(null);

  return (
    <nav>
      <ul className="nav-bar">
        {items.map((item, index) => (
          <li key={item.id}
              onMouseEnter={() => item.megaMenu && setActiveItem(item.id)}
              onMouseLeave={() => setActiveItem(null)}>
            <a href={item.url}>
              {item.label}
            </a>
            {item.megaMenu && activeItem === item.id && (
              <MegaPanel panel={item.megaMenu} onClose={() => setActiveItem(null)} />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
