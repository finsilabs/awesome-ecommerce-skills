# Design Token Foundation for a Multi-Brand Storefront

## Problem/Feature Description

Meridian Commerce is launching a platform that will power storefronts for three distinct retail brands from a single shared codebase. The design team has produced a palette of colors, type scales, spacing values, and border radii that will be the foundation of the visual system. However, each brand will need to swap colors, adjust button shapes, and update font sizes independently — without touching any component code.

The engineering team has been asked to set up the design token infrastructure before component development begins. This means establishing a structured token source of truth in JSON and wiring up a build step that compiles those tokens into CSS custom properties and JavaScript exports for runtime access. The goal is that a future rebrand can be done entirely by updating token values, never touching component files.

## Output Specification

Produce a working token system with the following deliverables:

1. **Token JSON source files** in a `tokens/` directory. Include at minimum:
   - A file for foundational/palette values (colors, type sizes, spacing, radius)
   - A file for meaning-bearing aliases (brand colors, surface colors, text colors, price colors)

2. **A build script** (e.g., `build-tokens.js` or `build-tokens.mjs`) that reads the token JSON files and compiles them to CSS and JavaScript output.

3. **Generated output files** (or evidence that the build would produce them) demonstrating what the compiled token output looks like — at minimum a CSS file containing custom properties and a JavaScript module exporting token values.

4. **A `package.json`** (or relevant config) listing the token build dependency so another developer can reproduce the build.

Write a brief `NOTES.md` explaining the token architecture decisions you made — in particular how the two tiers of token files relate to each other and why.
