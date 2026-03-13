# AppLovin MAX SDK Setup for iOS Commerce App

## Problem/Feature Description

GearMarket, an outdoor equipment retailer, is launching an iOS app and wants to monetize it with interstitial ads displayed after users complete a cart review. The team is new to mobile ad SDKs and needs a complete reference implementation for integrating AppLovin MAX. The app uses CocoaPods for dependency management and is built in Swift.

The engineering lead wants a clean reference implementation that demonstrates: how to declare the SDK dependency, how to initialize the SDK correctly in the app entry point, and how to load and display interstitial ads in a view controller used for the cart screen. The team has been warned that iOS privacy rules require additional configuration before the SDK can function properly on iOS 14+ devices, and that handling ad lifecycle callbacks correctly is important to avoid missed impressions.

## Output Specification

Produce the following files:

- `Podfile` — CocoaPods dependency file declaring AppLovin MAX and adapter pods
- `AppDelegate.swift` — App delegate with proper SDK initialization
- `CartViewController.swift` — UIViewController subclass that loads and shows an interstitial ad, implementing the appropriate delegate callbacks
- `integration-notes.md` — Brief notes covering: the iOS privacy requirement needed before SDK init, best practices for ad lifecycle management to avoid missed impressions, and a comparison of the two main MAX placement configuration strategies for maximizing eCPM

## Input Files (optional)

No input files are required. Produce all implementation files from scratch.
