# Add Quick View Button to Product Card

## Problem/Feature Description

The marketing team at Pebble & Grain, a home goods retailer, has noticed that customers frequently leave the product listing page to check product details and then abandon their shopping session entirely. The dev team wants to add a quick-preview trigger to each product card so shoppers can peek at product details without a full page navigation.

You've been asked to add a "Quick View" button to the existing `ProductCard` React component. The button should sit over the product image and be easily accessible regardless of the device type — the company has a significant mobile customer base, and any interaction that only works on desktop hover would leave those customers out.

The component must also be properly accessible for screen reader users, who should hear a meaningful label when navigating to the button.

## Output Specification

Produce the following files:

- `ProductCard.jsx` — the updated React component with the quick view button
- `ProductCard.css` — the associated styles, including hover and touch visibility behaviour

## Input Files

The following file is provided as a starting point. Extract it before beginning.

=============== FILE: ProductCard.jsx ===============
import React from 'react';

export function ProductCard({ product, onQuickView }) {
  return (
    <article className="product-card">
      <div className="product-card__image-wrapper">
        <a href={product.url}>
          <img src={product.image} alt={product.name} loading="lazy" />
        </a>
      </div>
      <div className="product-card__info">
        <a href={product.url} className="product-card__name">{product.name}</a>
        <p className="product-card__price">${product.price}</p>
      </div>
    </article>
  );
}
