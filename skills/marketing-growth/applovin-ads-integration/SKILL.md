---
name: applovin-ads-integration
description: "Integrate AppLovin MAX mediation and ad campaigns for mobile commerce apps with user acquisition, retargeting, and in-app purchase event tracking"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [applovin, mobile-ads, app-marketing, max-mediation]
triggers: ["set up AppLovin ads", "mobile app user acquisition", "implement AppLovin MAX"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# AppLovin Ads Integration

## Overview

AppLovin is a leading mobile advertising platform for commerce apps — combining the MAX mediation SDK (monetizing your app with ads) and AppLovin Ads (acquiring users and running retargeting campaigns). This skill applies to merchants who have a native iOS or Android shopping app and want to run user acquisition campaigns or monetize with in-app ads. It is not relevant for web-only stores.

## When to Use This Skill

- When running user acquisition campaigns for a native mobile commerce app
- When monetizing a mobile commerce app with in-app advertising using MAX mediation
- When setting up purchase event postbacks for ROAS-optimized bidding
- When migrating from MoPub/ironSource to AppLovin MAX mediation
- When building a retargeting campaign for mobile app users who added to cart but did not purchase
- When implementing SKAdNetwork attribution for iOS 14+ compliance

## Core Instructions

### Step 1: Determine what you need

AppLovin serves two distinct use cases — choose the right one:

| Goal | What to Use | Difficulty |
|------|------------|------------|
| Acquire new app users and retarget existing ones | AppLovin Ads (demand-side platform) | Medium — configure via dashboard at manage.applovin.com |
| Monetize your app by showing ads to users | AppLovin MAX SDK | High — requires SDK integration in your mobile app |
| Track purchase events for ROAS optimization | SDK + MMP (Adjust, AppsFlyer, or Singular) | High — requires server-side postback setup |

**Prerequisite**: You need an AppLovin account at applovin.com and a mobile app that exists on the App Store or Google Play.

### Step 2: Install the AppLovin MAX SDK in your mobile app

**iOS (CocoaPods):**

Add to your Podfile:
```ruby
pod 'AppLovinSDK'
pod 'AppLovinMediationGoogleAdMobAdapter'
pod 'AppLovinMediationMetaAudienceNetworkAdapter'
```

Initialize in `AppDelegate.swift`:
```swift
import AppLovinSDK

func application(_ app: UIApplication, didFinishLaunchingWithOptions opts: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
  ALSdk.shared().mediationProvider = "max"
  ALSdk.shared().userIdentifier = currentUser?.id ?? ""
  ALSdk.shared().initializeSdk { sdkConfig in
    // SDK ready — load your first ad
  }
  return true
}
```

**Android (Gradle):**

In `app/build.gradle`:
```groovy
dependencies {
    implementation 'com.applovin:applovin-sdk:+'
    implementation 'com.applovin.mediation:google-adapter:+'
    implementation 'com.applovin.mediation:facebook-adapter:+'
}
```

In `Application.onCreate()`:
```kotlin
AppLovinSdk.getInstance(this).apply {
    mediationProvider = "max"
    userIdentifier = currentUser?.id ?: ""
    initializeSdk { /* SDK ready */ }
}
```

### Step 3: Set up a Mobile Measurement Partner (MMP) — do this before running campaigns

**Do not run AppLovin campaigns without an MMP.** Direct postbacks miss cross-device attribution and SKAdNetwork decoding. Use one of:

- **Adjust** (adjust.com) — most widely used, strong AppLovin integration
- **AppsFlyer** (appsflyer.com) — industry standard, good for multi-network attribution
- **Singular** (singular.net) — good for privacy-focused attribution

Each MMP provides an AppLovin integration module that automatically sends purchase postbacks. In your MMP dashboard:
1. Navigate to **Partner Configuration → AppLovin**
2. Enter your AppLovin SDK key
3. Enable "In-App Purchase" postbacks
4. Configure conversion value mapping for SKAdNetwork

### Step 4: Track purchase events in your app

Fire purchase events immediately after a confirmed purchase — both client-side and server-side:

**Client-side (iOS):**
```swift
func trackPurchase(orderId: String, revenue: Double, currency: String) {
  ALEventService.shared().trackEvent(ALEventTypePurchasedProduct, withParameters: [
    ALEventParameterRevenueAmount: NSNumber(value: revenue),
    ALEventParameterRevenueCurrency: currency,
    ALEventParameterProductIdentifier: orderId,
  ])
}

// Also track add-to-cart for retargeting signal
func trackAddToCart(productId: String, price: Double) {
  ALEventService.shared().trackEvent(ALEventTypeAddedItemToCart, withParameters: [
    ALEventParameterProductIdentifier: productId,
    ALEventParameterRevenueAmount: NSNumber(value: price),
  ])
}
```

**Server-side postback (for signal reliability):**
```typescript
async function sendApplovinPurchasePostback(params: {
  userId: string;
  orderId: string;
  revenue: number;
  currency: string;
  applovinId?: string;
}) {
  const url = new URL('https://d.applovin.com/postback/v1/purchase');
  url.searchParams.set('event_token', process.env.APPLOVIN_POSTBACK_TOKEN!);
  url.searchParams.set('event_name', 'purchase');
  url.searchParams.set('user_id', params.userId);
  url.searchParams.set('transaction_id', params.orderId);
  url.searchParams.set('revenue', params.revenue.toFixed(2));
  url.searchParams.set('currency', params.currency);
  if (params.applovinId) url.searchParams.set('device_id', params.applovinId);

  await fetch(url.toString());
}
```

### Step 5: Create user acquisition campaigns

In AppLovin's advertising dashboard at manage.applovin.com:

1. Go to **Campaigns → Create Campaign**
2. Configure:
   - **Campaign Type**: App Install (iOS or Android)
   - **Optimization Goal**: Purchase (ROAS optimization)
   - **Bid Strategy**: Target ROAS — start at 200%, increase after 50+ purchases/day
   - **Daily Budget**: minimum $200/day for ROAS campaigns (algorithm needs data volume)
   - **Targeting**: Tier-1 countries (US, CA, GB, AU) for highest ROAS; age 25–54
3. Upload creative assets: 15s and 30s video ads, playable ads, and static banners
4. Under **Audience Signals**, upload a lookalike audience based on your top purchasers (export from your MMP)

### Step 6: Configure the MAX mediation waterfall (for app monetization only)

If you are monetizing your app with in-app ads (not just running user acquisition), configure your waterfall in the MAX dashboard:

1. Go to **MAX → Ad Units → Create Ad Unit**
2. Set up in-app bidding networks first (simultaneous auction, highest yield):
   - AppLovin Exchange
   - Meta Audience Network
   - Google AdMob
3. Add traditional waterfall fallbacks with floor prices:
   - $3.00 CPM → Vungle
   - $2.00 CPM → Unity Ads
   - $1.00 CPM → ironSource

Load and show interstitial ads in your app:
```swift
class CartViewController: UIViewController {
  var interstitialAd: MAInterstitialAd?

  override func viewDidLoad() {
    super.viewDidLoad()
    interstitialAd = MAInterstitialAd(adUnitIdentifier: "YOUR_AD_UNIT_ID")
    interstitialAd?.delegate = self
    interstitialAd?.load()
  }
}

extension CartViewController: MAAdDelegate {
  func didLoad(_ ad: MAAd) { /* ready to show */ }
  func didHide(_ ad: MAAd) {
    interstitialAd?.load() // preload immediately after hide
  }
}
```

### Step 7: Configure SKAdNetwork for iOS 14+ attribution

Map your purchase value ranges to SKAdNetwork conversion values (0–63) in both AppLovin's dashboard and your app code:

```swift
func updateSKANConversionValue(orderValue: Double) {
  let conversionValue: Int
  switch orderValue {
  case 0..<25:    conversionValue = 10
  case 25..<50:   conversionValue = 20
  case 50..<100:  conversionValue = 30
  case 100..<200: conversionValue = 40
  default:         conversionValue = 63
  }

  if #available(iOS 16.1, *) {
    SKAdNetwork.updatePostbackConversionValue(conversionValue, coarseValue: .high, lockWindow: false) { _ in }
  } else {
    SKAdNetwork.updateConversionValue(conversionValue)
  }
}
```

Configure the identical schema in AppLovin's SKAN configuration panel (**MAX → SKAN Configuration**) so the platform can decode postbacks.

## Best Practices

- **Always use an MMP** — direct postbacks miss cross-device attribution and SKAdNetwork decoding; MMPs handle this automatically
- **Set revenue postbacks server-side** — client-side events can be spoofed; server postbacks give AppLovin reliable ROAS signal
- **Preload ads before they are needed** — call `load()` immediately after `didHide` to have an ad ready for the next impression
- **Use in-app bidding for all placements** — simultaneous auction outperforms sequential waterfall by 15–30% eCPM
- **Refresh creatives every two weeks** — AppLovin's algorithm tires of creatives quickly; add new video and playable formats
- **Cap retargeting frequency** — limit to 3 impressions per user per day

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Purchase postbacks not registering | Verify postback token is correct; ensure `revenue` uses decimal format (not integer) |
| SDK fails to initialize on iOS | Add `NSUserTrackingUsageDescription` to Info.plist; implement ATT prompt before SDK init |
| ROAS campaign underspending | Lower your tROAS target; ensure 50+ purchase events/day for the algorithm to optimize |
| SKAN conversion values showing all zeros | Confirm `updateConversionValue` is called after final purchase confirmation, not just payment intent |
| Rewarded ad not loading after first show | Call `load()` in `didHide` callback, not `didDisplay` |
| Android GAID missing in postbacks | Request `AD_ID` permission on Android 13+; user may have limited ad tracking in device settings |

## Related Skills

- @tiktok-ads-integration
- @meta-ads-integration
- @marketing-attribution-dashboard
- @push-notifications
- @customer-retention-engine
