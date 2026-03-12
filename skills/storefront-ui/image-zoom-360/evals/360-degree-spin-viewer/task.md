# 360-Degree Product Spin Viewer

## Problem/Feature Description

An electronics retailer sells premium headphones and wants to give shoppers a way to inspect the product from every angle without physically holding it. Their product photography team has produced a set of 36 still images taken at 10-degree intervals around the product. The goal is to let visitors drag across the product image to spin it, giving a feel for the physical object.

The product team has flagged two specific concerns from a previous attempt at a similar feature on a sister site: the spin felt jerky on phones, and the page loaded slowly because all images were downloaded up front blocking the main hero from appearing quickly. They want the new implementation to address both issues. Additionally, the accessibility team requires that the spinner be operable by keyboard for users who cannot use a pointing device.

## Output Specification

Implement a `SpinViewer` React component in `SpinViewer.jsx`. The component should accept a `frames` prop (array of image URLs representing the 36 frames) and an optional `autoSpin` boolean prop.

Write a `spin-viewer.test.js` (using plain JavaScript, no test framework required) that documents the expected behavior as comments and verifies at minimum:
- That dragging right advances frames
- That the frame wraps around (e.g., from the last frame back to the first)

Also write a brief `IMPLEMENTATION_NOTES.md` that explains:
- How frame preloading is handled and why
- How mobile jitter is prevented
- What keyboard interaction is supported
