# Camera Comparison Table

## Problem/Feature Description

A consumer electronics retailer sells a large range of digital cameras and wants shoppers to be able to compare models side by side. The product team has noticed that customers frequently open multiple product pages in separate tabs to manually compare specs, leading to drop-off before purchase. The goal is to build a self-contained React comparison table component that can be dropped into the existing store.

The catalog team has organised camera specifications into logical groups — Display, Sensor, Performance, and Connectivity — and the data layer will supply products already normalised to a common attribute map. The component must work with a screen reader and be keyboard-accessible so the feature passes the store's WCAG compliance review. A product manager has also asked for a toggle that lets shoppers hide rows where every camera has the same value, to cut noise from a potentially 40-row spec sheet.

## Output Specification

Produce the following files:

- `ProductComparisonTable.jsx` — the main comparison table React component. Accept `products`, `attributeGroups`, and `showOnlyDifferences` as props.
- `ComparisonTable.css` — all CSS for the table layout, sticky elements, and row styling.
- `README.md` — a short explanation of the component's props and how to integrate it.

The component should be runnable in isolation (no external dependencies beyond React). Use the sample data below to demonstrate the component rendering by exporting a `Demo` component in `ProductComparisonTable.jsx` that renders three cameras from the sample data.

## Input Files

The following sample data is provided as context. Extract the JSON before beginning.

=============== FILE: inputs/sample-products.json ===============
[
  {
    "id": "cam-001",
    "name": "AlphaShot X100",
    "price": 899,
    "image": "/images/x100.jpg",
    "url": "/products/alphashot-x100",
    "attributes": {
      "screen_size": "3.0 inch",
      "resolution": "24 MP",
      "refresh_rate": "60 Hz",
      "sensor_type": "APS-C",
      "iso_range": "100-51200",
      "burst_speed": "10 fps",
      "video_4k": true,
      "wifi": true,
      "bluetooth": false,
      "weather_sealed": true
    }
  },
  {
    "id": "cam-002",
    "name": "ZenLens Pro",
    "price": 1199,
    "image": "/images/zenlens.jpg",
    "url": "/products/zenlens-pro",
    "attributes": {
      "screen_size": "3.2 inch",
      "resolution": "33 MP",
      "refresh_rate": "60 Hz",
      "sensor_type": "Full Frame",
      "iso_range": "50-204800",
      "burst_speed": "15 fps",
      "video_4k": true,
      "wifi": true,
      "bluetooth": true,
      "weather_sealed": true
    }
  },
  {
    "id": "cam-003",
    "name": "SnapMaster 500",
    "price": 499,
    "image": "/images/snap500.jpg",
    "url": "/products/snapmaster-500",
    "attributes": {
      "screen_size": "2.7 inch",
      "resolution": "20 MP",
      "refresh_rate": "60 Hz",
      "sensor_type": "Micro 4/3",
      "iso_range": "100-25600",
      "burst_speed": "6 fps",
      "video_4k": false,
      "wifi": true,
      "bluetooth": false,
      "weather_sealed": false
    }
  }
]

=============== FILE: inputs/attribute-groups.json ===============
[
  {
    "label": "Display",
    "attributes": ["screen_size", "refresh_rate"]
  },
  {
    "label": "Sensor",
    "attributes": ["resolution", "sensor_type", "iso_range"]
  },
  {
    "label": "Performance",
    "attributes": ["burst_speed", "video_4k"]
  },
  {
    "label": "Connectivity",
    "attributes": ["wifi", "bluetooth", "weather_sealed"]
  }
]
