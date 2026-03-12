# Product Gallery Component

## Problem/Feature Description

A fashion retailer is rebuilding their product detail pages in React/TypeScript. Their current gallery is a simple `<img>` tag with no zoom capability, causes significant layout shift on page load, and performs poorly on Google's Core Web Vitals audit — particularly LCP and CLS scores. Their mobile users (60% of traffic) also complain they can't zoom into images to inspect fabric details.

The team needs a polished `ProductGallery` component that handles the main display image with zoom, a row of clickable thumbnails, and proper handling of touch devices. The component should be accessible to keyboard and screen reader users, and should be optimized for fast initial loads without impacting the perceived quality of the images.

## Output Specification

Produce a self-contained `ProductGallery.tsx` React/TypeScript component file. The component should accept an array of product images (each with at minimum `src`, `alt`, `width`, and `height` fields) and render a main display area with zoom interaction and a thumbnail strip below.

Also produce a `ProductGallery.css` file with the supporting styles.

You do not need to set up a full app — just the component files are required. Include a brief `IMPLEMENTATION_NOTES.md` describing any non-obvious decisions you made about zoom behavior on desktop vs. mobile.
