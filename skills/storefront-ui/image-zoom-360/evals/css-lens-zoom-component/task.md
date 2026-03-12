# Product Image Zoom Feature

## Problem/Feature Description

A fashion retailer is launching a new product detail page and wants to differentiate the shopping experience from competitors. Their current setup shows a single static product image, and customers frequently cite "couldn't see the details well enough" in post-return surveys. The UX team has decided to add an interactive zoom experience to the main product image that lets shoppers on desktop inspect fabric texture, stitching, and color gradients.

The team wants the zoom to feel fluid and immediate — the full-resolution image should already be loaded and the zoom effect should follow the mouse position without any perceptible delay or network requests triggered during hover. The interaction should also not cause any layout shift that would move surrounding price/add-to-cart elements when the zoom activates.

## Output Specification

Implement a self-contained `ZoomImage` React component in a file called `ZoomImage.jsx` and its accompanying styles in `ZoomImage.css`. The component should accept `src` (the image URL) and `alt` (the accessible description) as props.

Also produce a short `README.md` that documents:
- The props accepted by the component
- How the zoom effect is implemented at a high level (what CSS properties are used and why)
- Any known limitations

## Input Files

The following files are provided as starting points. Extract them before beginning.

=============== FILE: src/ZoomImage.jsx ===============
// TODO: implement ZoomImage component
export function ZoomImage({ src, alt }) {
  return <img src={src} alt={alt} />;
}

=============== FILE: src/ZoomImage.css ===============
/* TODO: add styles */
